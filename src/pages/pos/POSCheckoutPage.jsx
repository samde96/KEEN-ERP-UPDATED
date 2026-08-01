import { useEffect, useMemo, useRef, useState } from 'react';
import { ApprovalModal } from '../../components/modals/ApprovalModal';
import { BarcodeScannerInput } from '../../components/pos/BarcodeScannerInput';
import { CashierShiftPanel } from '../../components/pos/CashierShiftPanel';
import { PaymentPanel } from '../../components/pos/PaymentPanel';
import { POSCart } from '../../components/pos/POSCart';
import { ReceiptPreview } from '../../components/pos/ReceiptPreview';
import { PageHeader } from '../../components/common/PageHeader';
import { ProductPhoto } from '../../components/common/ProductPhoto';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncData } from '../../hooks/useAsyncData';
import { useBranch } from '../../hooks/useBranch';
import { inventoryService } from '../../services/inventoryService';
import { mpesaService } from '../../services/mpesaService';
import { productService } from '../../services/productService';
import { posService } from '../../services/posService';
import { salesService } from '../../services/salesService';
import { buildPosReceipt } from '../../utils/receiptUtils';
import { formatCurrency } from '../../utils/formatCurrency';
import { printReceipt as printReceiptDocument } from '../../utils/printUtils';
import { balanceMatchesLocation, isShopLocation } from '../../utils/locationTypes';

function toCartItem(product) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    imageUrl: product.imageUrl,
    price: product.sellingPrice,
    quantity: 1,
    status: product.status,
    available: product.shopAvailable,
    taxRate: Number(product.taxRate || 0)
  };
}

function normalizeStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_');
}

function productUnavailableReason(product) {
  const catalogStatus = normalizeStatus(product.status);
  if (catalogStatus === 'theft_alert') return 'Theft Alert';
  if (catalogStatus === 'inactive') return 'Inactive';
  if (catalogStatus === 'discontinued') return 'Discontinued';

  const stockStatus = normalizeStatus(product.shopStockStatus);
  if (stockStatus === 'select_shop' || stockStatus === 'no_shop_selected') return 'Select Shop';
  if (stockStatus === 'out_of_stock' || Number(product.shopAvailable || 0) <= 0) {
    return 'Out Of Stock';
  }

  return '';
}

function inclusiveTax(amount, taxRate) {
  const rate = Number(taxRate || 0);
  const total = Number(amount || 0);
  if (rate <= 0 || total <= 0) return 0;
  return (total * rate) / (100 + rate);
}

function cartTaxAmount(cart, discount) {
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const appliedDiscount = Math.min(Number(discount || 0), subtotal);
  let allocatedDiscount = 0;

  return cart.reduce((sum, item, index) => {
    const lineGross = Number(item.price || 0) * Number(item.quantity || 0);
    const lineDiscount = index === cart.length - 1
      ? appliedDiscount - allocatedDiscount
      : subtotal > 0
        ? Math.round(((appliedDiscount * lineGross) / subtotal) * 100) / 100
        : 0;
    allocatedDiscount += lineDiscount;
    return sum + inclusiveTax(Math.max(lineGross - lineDiscount, 0), item.taxRate);
  }, 0);
}

const emptyCashierSummary = {
  terminal: 'POS-01',
  shift: 'Open',
  totalSales: 0,
  expectedCash: 0,
  saleCount: 0
};

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

function splitRemainder(total, amount) {
  return roundMoney(Math.max(Number(total || 0) - Number(amount || 0), 0));
}

export function POSCheckoutPage() {
  const { user } = useAuth();
  const { currentLocation } = useBranch();
  const currentShopLocation = currentLocation && isShopLocation(currentLocation) ? currentLocation : null;
  const [barcode, setBarcode] = useState('');
  const [query, setQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCardNumber, setCustomerCardNumber] = useState('');
  const [issueRewardsCard, setIssueRewardsCard] = useState(false);
  const [rewardCustomer, setRewardCustomer] = useState(null);
  const [rewardMessage, setRewardMessage] = useState('');
  const [registeringRewardCard, setRegisteringRewardCard] = useState(false);
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [amountTendered, setAmountTendered] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [splitCashAmount, setSplitCashAmount] = useState(0);
  const [splitMpesaAmount, setSplitMpesaAmount] = useState(0);
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [mpesaPayment, setMpesaPayment] = useState(null);
  const [mpesaMessage, setMpesaMessage] = useState('');
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [printingReceipt, setPrintingReceipt] = useState(false);
  const [printQueued, setPrintQueued] = useState(false);
  const mpesaPollTimer = useRef(null);
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const { data: stockBalances, reload: reloadStockBalances } = useAsyncData(inventoryService.balances.bind(inventoryService));
  const { data: receiptSettings } = useAsyncData(posService.receiptSettings.bind(posService), {
    taxLabel: 'VAT',
    taxRate: 0,
    pointsEnabled: false,
    pointsPerCurrencyUnit: 0
  });
  const cashierName = user?.name || 'Cashier';
  const { data: cashierSummary, reload: reloadCashierSummary } = useAsyncData(
    () =>
      currentShopLocation?.id
        ? salesService.cashierSummary({ locationId: currentShopLocation.id, cashierName })
        : Promise.resolve(emptyCashierSummary),
    emptyCashierSummary,
    [currentShopLocation?.id, cashierName]
  );

  const posProducts = useMemo(() => {
    const shopBalances = stockBalances.filter((balance) => {
      if (!currentShopLocation) return false;
      return balanceMatchesLocation(balance, currentShopLocation);
    });
    const balanceByProductId = new Map(shopBalances.filter((balance) => balance.productId).map((balance) => [String(balance.productId), balance]));
    const balanceBySku = new Map(shopBalances.filter((balance) => balance.sku).map((balance) => [String(balance.sku).toLowerCase(), balance]));

    return products.map((product) => {
      const balance = balanceByProductId.get(String(product.id)) || balanceBySku.get(String(product.sku || '').toLowerCase());
      const shopAvailable = Number(balance?.available || 0);
      const shopStockStatus = balance?.status || (currentShopLocation ? 'Out Of Stock' : 'Select Shop');
      const enrichedProduct = { ...product, shopAvailable, shopStockStatus };
      const unavailableReason = productUnavailableReason(enrichedProduct);

      return {
        ...enrichedProduct,
        posDisabled: Boolean(unavailableReason),
        posDisabledReason: unavailableReason
      };
    });
  }, [currentShopLocation, products, stockBalances]);

  const visibleProducts = useMemo(() => {
    const search = query.toLowerCase();
    return posProducts.filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(search));
  }, [posProducts, query]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(subtotal - discount, 0);
  const taxAmount = cartTaxAmount(cart, discount);
  const isSplitPayment = paymentMethod === 'Split Payment';
  const isMpesaTender = paymentMethod === 'M-Pesa' || isSplitPayment;
  const splitCashValue = Number(splitCashAmount || 0);
  const splitMpesaValue = Number(splitMpesaAmount || 0);
  const splitTotal = roundMoney(splitCashValue + splitMpesaValue);
  const splitBalance = roundMoney(total - splitTotal);
  const splitPaymentInvalid = isSplitPayment && (splitCashValue <= 0 || splitMpesaValue <= 0 || Math.abs(splitBalance) >= 0.01);
  const effectiveAmountTendered = paymentMethod === 'Cash' ? Number(amountTendered || 0) : total;
  const changeAmount = Math.max(effectiveAmountTendered - total, 0);
  const cashPaidShort = paymentMethod === 'Cash' && effectiveAmountTendered < total;
  const rewardsIdentityProvided = Boolean(customerCardNumber.trim() || customerPhone.trim() || issueRewardsCard);
  const pointsEarned = receiptSettings.pointsEnabled && rewardsIdentityProvided
    ? Math.floor(total * Number(receiptSettings.pointsPerCurrencyUnit || 0))
    : 0;
  const projectedPointsBalance = rewardCustomer ? rewardCustomer.pointsBalance + pointsEarned : pointsEarned;
  const needsManagerApproval = discount > subtotal * 0.1 && discount > 0;
  const mpesaTenderAmount = isSplitPayment ? splitMpesaValue : total;
  const mpesaRoundedAmount = Math.round(mpesaTenderAmount);
  const mpesaAmountIsWhole = Math.abs(mpesaTenderAmount - mpesaRoundedAmount) < 0.01;
  const mpesaAmountMatchesTarget = mpesaPayment ? mpesaAmountIsWhole && Math.abs(Number(mpesaPayment.amount || 0) - mpesaRoundedAmount) < 0.01 : false;
  const mpesaReady = !isMpesaTender || (mpesaPayment?.status === 'SUCCESS' && mpesaAmountMatchesTarget);

  const clearMpesaPolling = () => {
    if (mpesaPollTimer.current) {
      window.clearTimeout(mpesaPollTimer.current);
      mpesaPollTimer.current = null;
    }
  };

  const resetMpesaPayment = ({ keepPhone = true } = {}) => {
    clearMpesaPolling();
    setMpesaPayment(null);
    setMpesaMessage('');
    setMpesaLoading(false);
    if (!keepPhone) {
      setMpesaPhone('');
    }
  };

  useEffect(() => {
    const handleAfterPrint = () => setPrintingReceipt(false);
    window.addEventListener('afterprint', handleAfterPrint);

    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  useEffect(() => {
    return () => clearMpesaPolling();
  }, []);

  useEffect(() => {
    if (!mpesaPhone.trim() && customerPhone.trim()) {
      setMpesaPhone(customerPhone.trim());
    }
  }, [customerPhone, mpesaPhone]);

  useEffect(() => {
    if (!isSplitPayment) return;

    const cashAmount = Math.min(Math.max(roundMoney(splitCashValue), 0), total);
    const mpesaAmount = splitRemainder(total, cashAmount);

    if (Math.abs(cashAmount - splitCashValue) >= 0.01) {
      setSplitCashAmount(cashAmount);
    }
    if (Math.abs(mpesaAmount - splitMpesaValue) >= 0.01) {
      setSplitMpesaAmount(mpesaAmount);
    }
  }, [isSplitPayment, total, splitCashValue, splitMpesaValue]);

  useEffect(() => {
    if (isMpesaTender && mpesaPayment && !mpesaAmountMatchesTarget) {
      clearMpesaPolling();
      setMpesaPayment(null);
      setMpesaLoading(false);
      setMpesaMessage('Payment amount changed. Send a new STK Push for the current M-Pesa amount.');
    }
  }, [isMpesaTender, mpesaPayment, mpesaAmountMatchesTarget]);

  useEffect(() => {
    if (!printQueued || !receipt) return undefined;

    const printTimer = window.setTimeout(() => {
      printReceiptDocument();
      setPrintQueued(false);
    }, 150);
    const fallbackTimer = window.setTimeout(() => setPrintingReceipt(false), 1500);

    return () => {
      window.clearTimeout(printTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [printQueued, receipt]);

  const addProduct = (product) => {
    const unavailableReason = productUnavailableReason(product);
    if (unavailableReason) {
      setError(
        unavailableReason === 'Select Shop'
          ? 'Select a shop location before adding products.'
          : `${product.name} is ${unavailableReason.toLowerCase()} at ${currentShopLocation?.name || 'this shop'}.`
      );
      return;
    }

    const existing = cart.find((item) => item.id === product.id);
    if (existing && existing.quantity >= Number(product.shopAvailable || 0)) {
      setError(`Only ${product.shopAvailable} unit${product.shopAvailable === 1 ? '' : 's'} available for ${product.name}.`);
      return;
    }

    setError('');
    setCart((items) => {
      if (existing) {
        return items.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }

      return [...items, toCartItem(product)];
    });
  };

  const handleBarcodeSubmit = (event) => {
    event.preventDefault();
    const product = posProducts.find((item) => item.barcode === barcode.trim() || item.sku.toLowerCase() === barcode.trim().toLowerCase());
    if (product) addProduct(product);
    setBarcode('');
  };

  const handleRewardLookup = async () => {
    const cardNumber = customerCardNumber.trim();
    const phone = customerPhone.trim();
    if (!cardNumber && !phone) {
      setRewardCustomer(null);
      setRewardMessage('Enter a card number or phone to look up rewards.');
      return;
    }

    setRewardMessage('');
    try {
      const profile = await posService.lookupCustomer({ cardNumber, phone });
      setRewardCustomer(profile);
      setIssueRewardsCard(false);
      if (profile.name) setCustomerName(profile.name);
      if (profile.phone) setCustomerPhone(profile.phone);
      if (profile.cardNumber) setCustomerCardNumber(profile.cardNumber);
      setRewardMessage(`${profile.name || 'Customer'} has ${profile.pointsBalance} reward points.`);
    } catch {
      setRewardCustomer(null);
      setRewardMessage('No Keen Loyalty Card profile found. Register the printed card to this customer at checkout.');
    }
  };

  const handleRegisterRewardCard = async () => {
    const cardNumber = customerCardNumber.trim();
    if (!cardNumber) {
      setIssueRewardsCard(false);
      setRewardCustomer(null);
      setRewardMessage('Scan or enter the printed Keen Loyalty Card number before registering it.');
      return;
    }
    if (!customerName.trim() && !customerPhone.trim()) {
      setIssueRewardsCard(false);
      setRewardCustomer(null);
      setRewardMessage('Enter the customer name or phone before registering this Keen Loyalty Card.');
      return;
    }

    setRegisteringRewardCard(true);
    setRewardMessage('');
    setError('');
    try {
      const profile = await posService.registerRewardCard({
        cardNumber,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim()
      });
      setRewardCustomer(profile);
      setIssueRewardsCard(false);
      if (profile.name) setCustomerName(profile.name);
      if (profile.phone) setCustomerPhone(profile.phone);
      if (profile.cardNumber) setCustomerCardNumber(profile.cardNumber);
      setRewardMessage(`Keen Loyalty Card ${profile.cardNumber} registered. Balance: ${profile.pointsBalance} points.`);
    } catch (requestError) {
      setRewardCustomer(null);
      setIssueRewardsCard(false);
      setRewardMessage(requestError.response?.data?.detail || requestError.message || 'Unable to register Keen Loyalty Card.');
    } finally {
      setRegisteringRewardCard(false);
    }
  };

  const handleRegisterRewardToggle = (checked) => {
    setIssueRewardsCard(checked);
    setRewardCustomer(null);

    if (!checked) {
      setRewardMessage('');
    } else if (!customerCardNumber.trim()) {
      setRewardMessage('Scan or enter the printed Keen Loyalty Card number before checkout.');
    } else if (!customerName.trim() && !customerPhone.trim()) {
      setRewardMessage('Enter the customer name or phone before checkout.');
    } else {
      setRewardMessage(`Keen Loyalty Card ${customerCardNumber.trim()} will be registered at checkout.`);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    setError('');
    if (method === 'M-Pesa') {
      setSplitCashAmount(0);
      setSplitMpesaAmount(0);
      resetMpesaPayment();
      if (!mpesaPhone.trim() && customerPhone.trim()) {
        setMpesaPhone(customerPhone.trim());
      }
      return;
    }
    if (method === 'Split Payment') {
      setSplitCashAmount(0);
      setSplitMpesaAmount(roundMoney(total));
      resetMpesaPayment();
      if (!mpesaPhone.trim() && customerPhone.trim()) {
        setMpesaPhone(customerPhone.trim());
      }
      return;
    }

    setSplitCashAmount(0);
    setSplitMpesaAmount(0);
    resetMpesaPayment();
  };

  const handleSplitCashAmountChange = (value) => {
    const cashAmount = roundMoney(Math.max(Number(value || 0), 0));
    setSplitCashAmount(cashAmount);
    setSplitMpesaAmount(splitRemainder(total, cashAmount));
    resetMpesaPayment();
  };

  const handleSplitMpesaAmountChange = (value) => {
    const mpesaAmount = roundMoney(Math.max(Number(value || 0), 0));
    setSplitMpesaAmount(mpesaAmount);
    setSplitCashAmount(splitRemainder(total, mpesaAmount));
    resetMpesaPayment();
  };

  const pollMpesaStatus = (checkoutRequestId) => {
    clearMpesaPolling();
    let attempts = 0;

    const poll = async () => {
      attempts += 1;
      try {
        const localStatus = await mpesaService.status(checkoutRequestId);
        const latest = localStatus.status === 'PENDING' && attempts % 3 === 0
          ? await mpesaService.queryStk(checkoutRequestId)
          : localStatus;
        setMpesaPayment(latest);

        if (latest.status === 'SUCCESS') {
          clearMpesaPolling();
          setMpesaLoading(false);
          setMpesaMessage(latest.mpesaReceiptNumber ? `M-Pesa confirmed: ${latest.mpesaReceiptNumber}.` : 'M-Pesa payment confirmed.');
          return;
        }

        if (latest.status === 'FAILED') {
          clearMpesaPolling();
          setMpesaLoading(false);
          setMpesaMessage(latest.resultDesc || 'M-Pesa payment was not completed.');
          return;
        }

        setMpesaMessage('Waiting for Safaricom confirmation callback...');
      } catch (requestError) {
        setMpesaMessage(requestError.response?.data?.detail || requestError.message || 'Unable to query M-Pesa status.');
      }

      if (attempts >= 15) {
        clearMpesaPolling();
        setMpesaLoading(false);
        setMpesaMessage('Still waiting for M-Pesa confirmation. Check the customer phone or send a new STK Push.');
        return;
      }

      mpesaPollTimer.current = window.setTimeout(poll, 2000);
    };

    mpesaPollTimer.current = window.setTimeout(poll, 2000);
  };

  const handleMpesaPush = async () => {
    if (!currentShopLocation?.id) {
      setError('Select a shop location before sending an STK Push.');
      return;
    }
    if (total <= 0) {
      setError('Add items to the cart before sending an STK Push.');
      return;
    }
    if (isSplitPayment && splitPaymentInvalid) {
      setError('Enter cash and M-Pesa amounts that add up to the sale total before sending an STK Push.');
      return;
    }
    if (mpesaTenderAmount <= 0) {
      setError('Enter the M-Pesa amount before sending an STK Push.');
      return;
    }
    if (!mpesaAmountIsWhole) {
      setError('M-Pesa amount must be a whole KES amount.');
      return;
    }

    clearMpesaPolling();
    setMpesaLoading(true);
    setMpesaPayment(null);
    setMpesaMessage('');
    setError('');
    setMessage('');

    try {
      const response = await mpesaService.initiateStkPush({
        phoneNumber: mpesaPhone.trim(),
        amount: mpesaRoundedAmount,
        accountReference: currentShopLocation.name || 'Keen POS'
      });
      setMpesaPayment(response);
      setMpesaMessage(response.customerMessage || 'STK Push sent. Ask the customer to enter M-Pesa PIN.');
      pollMpesaStatus(response.checkoutRequestId);
    } catch (requestError) {
      setMpesaLoading(false);
      setMpesaMessage(requestError.response?.data?.detail || requestError.message || 'Unable to send STK Push.');
    }
  };

  const incrementCartItem = (id) => {
    const currentItem = cart.find((item) => item.id === id);
    const available = Number(currentItem?.available || 0);
    if (currentItem && available > 0 && currentItem.quantity >= available) {
      setError(`Only ${available} unit${available === 1 ? '' : 's'} available for ${currentItem.name}.`);
      return;
    }

    setError('');
    setCart((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  const postCheckout = async () => {
    if (!currentShopLocation?.id) {
      setError('Select a shop location before checkout.');
      return;
    }
    if (issueRewardsCard && !customerName.trim() && !customerPhone.trim()) {
      setError('Enter the customer name or phone before registering this Keen Loyalty Card.');
      return;
    }
    if (isSplitPayment && splitPaymentInvalid) {
      setError('Enter cash and M-Pesa amounts that add up to the sale total before checkout.');
      return;
    }
    if (isMpesaTender && (!mpesaReady || !mpesaPayment?.checkoutRequestId)) {
      setError('Send STK Push and wait for M-Pesa confirmation before checkout.');
      return;
    }

    setCheckingOut(true);
    setError('');
    setMessage('');
    try {
      const response = await posService.checkout({
        locationId: currentShopLocation.id,
        cashierName: user?.name || 'Cashier',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerCardNumber: customerCardNumber.trim(),
        issueRewardsCard,
        paymentMethod,
        paymentReference: isMpesaTender ? mpesaPayment.mpesaReceiptNumber || mpesaPayment.checkoutRequestId : '',
        mpesaCheckoutRequestId: isMpesaTender ? mpesaPayment.checkoutRequestId : null,
        splitCashAmount: isSplitPayment ? splitCashValue : null,
        discountAmount: discount,
        amountTendered: effectiveAmountTendered,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        }))
      });
      if (response.offlineQueued) {
        setReceipt(null);
        setPrintQueued(false);
        setPrintingReceipt(false);
        setCart([]);
        setDiscount(0);
        setAmountTendered(0);
        setSplitCashAmount(0);
        setSplitMpesaAmount(0);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerCardNumber('');
        setIssueRewardsCard(false);
        setRewardCustomer(null);
        setRewardMessage('');
        resetMpesaPayment({ keepPhone: false });
        setMessage(response.message);
        return;
      }

      const nextReceipt = buildPosReceipt(response);
      setReceipt(nextReceipt);
      localStorage.setItem('keen.inventory.lastReceipt', JSON.stringify(nextReceipt));
      setPrintingReceipt(true);
      setPrintQueued(true);
      setCart([]);
      setDiscount(0);
      setAmountTendered(0);
      setSplitCashAmount(0);
      setSplitMpesaAmount(0);
      const rewardSuffix = response.customerCardNumber
        ? ` Keen Loyalty Card ${response.customerCardNumber} balance: ${response.pointsBalance} points.`
        : '';
      setCustomerName('');
      setCustomerPhone('');
      setCustomerCardNumber('');
      setIssueRewardsCard(false);
      setRewardCustomer(null);
      setRewardMessage('');
      resetMpesaPayment({ keepPhone: false });
      setMessage(`Sale ${response.receiptNumber} posted.${rewardSuffix} ...printing receipt`);
      reloadCashierSummary();
      reloadStockBalances();
    } catch (requestError) {
      setPrintQueued(false);
      setPrintingReceipt(false);
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to complete checkout.');
      reloadStockBalances();
    } finally {
      setCheckingOut(false);
    }
  };

  const handleCheckout = () => {
    if (needsManagerApproval) {
      setApprovalOpen(true);
      return;
    }

    postCheckout();
  };

  const finishApprovedCheckout = () => {
    setApprovalOpen(false);
    postCheckout();
  };

  return (
    <>
      <PageHeader title="POS checkout" description="Fast checkout with barcode scan, cart controls, payment selection, and automatic receipt printing." />
      {message ? (
        <div className={`alert ${printingReceipt ? 'alert-info' : 'alert-success'}`}>
          {printingReceipt ? <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" /> : null}
          {message}
        </div>
      ) : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <CashierShiftPanel
        cashier={cashierName}
        terminal={cashierSummary?.terminal || 'POS-01'}
        status={cashierSummary?.shift || 'Open'}
        sales={formatCurrency(cashierSummary?.totalSales || 0)}
        expectedCash={cashierSummary?.expectedCash || 0}
      />
      <section className="pos-grid">
        <div className="pos-workspace" data-animate="fade-up">
          <BarcodeScannerInput value={barcode} onChange={setBarcode} onSubmit={handleBarcodeSubmit} />
          <div className="input-group mt-3">
            <span className="input-group-text">
              <i className="bi bi-search" aria-hidden="true" />
            </span>
            <input className="form-control" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" />
          </div>
          <div className="pos-customer-panel">
            <div>
              <label className="form-label" htmlFor="customer-card">
                Keen Loyalty Card
              </label>
              <div className="input-group">
                <input
                  id="customer-card"
                  className="form-control"
                  value={customerCardNumber}
                  onChange={(event) => {
                    setCustomerCardNumber(event.target.value);
                    if (!event.target.value.trim()) {
                      setIssueRewardsCard(false);
                    }
                    setRewardCustomer(null);
                    setRewardMessage('');
                  }}
                  placeholder="Scan printed card number"
                />
                <button className="btn btn-outline-primary" type="button" onClick={handleRewardLookup}>
                  <i className="bi bi-search" aria-hidden="true" /> Lookup Card
                </button>
                <button className="btn btn-outline-secondary" type="button" onClick={handleRegisterRewardCard} disabled={registeringRewardCard}>
                  {registeringRewardCard ? <span className="spinner-border spinner-border-sm me-1" aria-hidden="true" /> : <i className="bi bi-credit-card-2-front" aria-hidden="true" />} Register Card
                </button>
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="customer-name">
                Customer name
              </label>
              <input id="customer-name" className="form-control" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="form-label" htmlFor="customer-phone">
                Phone / member no.
              </label>
              <input
                id="customer-phone"
                className="form-control"
                value={customerPhone}
                onChange={(event) => {
                  setCustomerPhone(event.target.value);
                  setRewardCustomer(null);
                  setRewardMessage('');
                }}
                placeholder="Earn points"
              />
            </div>
            <div className="reward-card-status">
              <label className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={issueRewardsCard}
                  onChange={(event) => handleRegisterRewardToggle(event.target.checked)}
                />
                <span className="form-check-label">Register Keen Loyalty Card at checkout</span>
              </label>
              <strong>{projectedPointsBalance} points after sale</strong>
              {rewardMessage ? <small>{rewardMessage}</small> : null}
            </div>
          </div>
          <div className="product-button-grid">
            {visibleProducts.map((product) => (
              <button className="product-tile" type="button" key={product.id} onClick={() => addProduct(product)} disabled={product.posDisabled}>
                <ProductPhoto src={product.imageUrl} alt={product.name} size="tile" />
                <span className="product-tile-body">
                  <span className="product-tile-top">
                    <strong>{product.name}</strong>
                    <StatusBadge status={product.posDisabledReason || product.shopStockStatus || product.status} />
                  </span>
                  <span>{product.sku}</span>
                  <span>Available: {product.shopAvailable}</span>
                  <b>{formatCurrency(product.sellingPrice)}</b>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="pos-side" data-animate="fade-up">
          <POSCart
            cart={cart}
            onIncrement={incrementCartItem}
            onDecrement={(id) => setCart((items) => items.map((item) => (item.id === id ? { ...item, quantity: Math.max(item.quantity - 1, 1) } : item)))}
            onRemove={(id) => setCart((items) => items.filter((item) => item.id !== id))}
          />
          <PaymentPanel
            subtotal={subtotal}
            discount={discount}
            total={total}
            amountTendered={amountTendered}
            changeAmount={changeAmount}
            paymentMethod={paymentMethod}
            splitCashAmount={splitCashAmount}
            splitMpesaAmount={splitMpesaAmount}
            splitBalance={splitBalance}
            taxLabel={receiptSettings.taxLabel || 'VAT'}
            taxAmount={taxAmount}
            pointsEarned={pointsEarned}
            pointsBalance={projectedPointsBalance}
            rewardCustomerLabel={customerCardNumber.trim() || customerPhone.trim() || (issueRewardsCard ? 'New Keen Loyalty Card' : '')}
            mpesaPhone={mpesaPhone}
            mpesaStatus={mpesaPayment?.status || 'PENDING'}
            mpesaMessage={mpesaMessage}
            mpesaLoading={mpesaLoading}
            mpesaAmount={mpesaTenderAmount}
            mpesaActionDisabled={(isSplitPayment && splitPaymentInvalid) || !mpesaAmountIsWhole}
            onPaymentMethodChange={handlePaymentMethodChange}
            onSplitCashAmountChange={handleSplitCashAmountChange}
            onSplitMpesaAmountChange={handleSplitMpesaAmountChange}
            onMpesaPhoneChange={(value) => {
              clearMpesaPolling();
              setMpesaPhone(value);
              setMpesaPayment(null);
              setMpesaMessage('');
              setMpesaLoading(false);
            }}
            onMpesaPush={handleMpesaPush}
            onDiscountChange={setDiscount}
            onAmountTenderedChange={setAmountTendered}
            onCheckout={handleCheckout}
            loading={checkingOut}
            disabled={!currentShopLocation?.id || cashPaidShort || splitPaymentInvalid || (isMpesaTender && !mpesaReady)}
          />
        </div>
      </section>
      {receipt ? (
        <div className="receipt-print-host" aria-hidden="true">
          <ReceiptPreview receipt={receipt} />
        </div>
      ) : null}
      <ApprovalModal
        open={approvalOpen}
        title="Manager discount approval"
        body="This discount exceeds the cashier limit and requires manager PIN confirmation."
        onCancel={() => setApprovalOpen(false)}
        onApprove={finishApprovedCheckout}
      />
    </>
  );
}
