import { useMemo, useState } from 'react';
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
import { productService } from '../../services/productService';
import { posService } from '../../services/posService';
import { salesService } from '../../services/salesService';
import { buildPosReceipt } from '../../utils/receiptUtils';
import { formatCurrency } from '../../utils/formatCurrency';

function toCartItem(product) {
  return {
    id: product.id,
    name: product.name,
    sku: product.sku,
    barcode: product.barcode,
    imageUrl: product.imageUrl,
    price: product.sellingPrice,
    quantity: 1,
    status: product.status
  };
}

const emptyCashierSummary = {
  terminal: 'POS-01',
  shift: 'Open',
  totalSales: 0,
  expectedCash: 0,
  saleCount: 0
};

export function POSCheckoutPage() {
  const { user } = useAuth();
  const { currentLocation } = useBranch();
  const [barcode, setBarcode] = useState('');
  const [query, setQuery] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cart, setCart] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [amountTendered, setAmountTendered] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const { data: receiptSettings } = useAsyncData(posService.receiptSettings.bind(posService), {
    taxLabel: 'VAT',
    taxRate: 0,
    pointsEnabled: false,
    pointsPerCurrencyUnit: 0
  });
  const cashierName = user?.name || 'Cashier';
  const { data: cashierSummary, reload: reloadCashierSummary } = useAsyncData(
    () =>
      currentLocation?.id
        ? salesService.cashierSummary({ locationId: currentLocation.id, cashierName })
        : Promise.resolve(emptyCashierSummary),
    emptyCashierSummary,
    [currentLocation?.id, cashierName]
  );

  const visibleProducts = useMemo(() => {
    const search = query.toLowerCase();
    return products.filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(search));
  }, [products, query]);

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = Math.max(subtotal - discount, 0);
  const taxRate = Number(receiptSettings.taxRate || 0);
  const taxAmount = taxRate > 0 && total > 0 ? (total * taxRate) / (100 + taxRate) : 0;
  const effectiveAmountTendered = paymentMethod === 'Cash' ? Number(amountTendered || 0) : total;
  const changeAmount = Math.max(effectiveAmountTendered - total, 0);
  const cashPaidShort = paymentMethod === 'Cash' && effectiveAmountTendered < total;
  const pointsEarned = receiptSettings.pointsEnabled && customerPhone.trim()
    ? Math.floor(total * Number(receiptSettings.pointsPerCurrencyUnit || 0))
    : 0;
  const needsManagerApproval = discount > subtotal * 0.1 && discount > 0;

  const addProduct = (product) => {
    if (product.status === 'Theft Alert') return;

    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) {
        return items.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }

      return [...items, toCartItem(product)];
    });
  };

  const handleBarcodeSubmit = (event) => {
    event.preventDefault();
    const product = products.find((item) => item.barcode === barcode.trim() || item.sku.toLowerCase() === barcode.trim().toLowerCase());
    if (product) addProduct(product);
    setBarcode('');
  };

  const postCheckout = async () => {
    if (!currentLocation?.id) {
      setError('Select a shop location before checkout.');
      return;
    }

    setCheckingOut(true);
    setError('');
    setMessage('');
    try {
      const response = await posService.checkout({
        locationId: currentLocation.id,
        cashierName: user?.name || 'Cashier',
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        paymentMethod,
        paymentReference: '',
        discountAmount: discount,
        amountTendered: effectiveAmountTendered,
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity
        }))
      });
      if (response.offlineQueued) {
        setReceipt(null);
        setCart([]);
        setDiscount(0);
        setAmountTendered(0);
        setCustomerName('');
        setCustomerPhone('');
        setMessage(response.message);
        return;
      }

      const nextReceipt = buildPosReceipt(response);
      setReceipt(nextReceipt);
      localStorage.setItem('keen.inventory.lastReceipt', JSON.stringify(nextReceipt));
      setCart([]);
      setDiscount(0);
      setAmountTendered(0);
      setCustomerName('');
      setCustomerPhone('');
      setMessage(`Sale ${response.receiptNumber} posted.`);
      reloadCashierSummary();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to complete checkout.');
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

  const printReceipt = () => {
    window.print();
  };

  return (
    <>
      <PageHeader title="POS checkout" description="Fast checkout with barcode scan, cart controls, payment selection, and receipt preview." />
      {message ? <div className="alert alert-success">{message}</div> : null}
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
              <label className="form-label" htmlFor="customer-name">
                Customer name
              </label>
              <input id="customer-name" className="form-control" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Optional" />
            </div>
            <div>
              <label className="form-label" htmlFor="customer-phone">
                Phone / member no.
              </label>
              <input id="customer-phone" className="form-control" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Earn points" />
            </div>
          </div>
          <div className="product-button-grid">
            {visibleProducts.map((product) => (
              <button className="product-tile" type="button" key={product.id} onClick={() => addProduct(product)} disabled={product.status === 'Theft Alert'}>
                <ProductPhoto src={product.imageUrl} alt={product.name} size="tile" />
                <span className="product-tile-body">
                  <span className="product-tile-top">
                    <strong>{product.name}</strong>
                    <StatusBadge status={product.status} />
                  </span>
                  <span>{product.sku}</span>
                  <b>{formatCurrency(product.sellingPrice)}</b>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="pos-side" data-animate="fade-up">
          <POSCart
            cart={cart}
            onIncrement={(id) => setCart((items) => items.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)))}
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
            taxLabel={receiptSettings.taxLabel || 'VAT'}
            taxAmount={taxAmount}
            pointsEarned={pointsEarned}
            onPaymentMethodChange={setPaymentMethod}
            onDiscountChange={setDiscount}
            onAmountTenderedChange={setAmountTendered}
            onCheckout={handleCheckout}
            loading={checkingOut}
            disabled={!currentLocation?.id || cashPaidShort}
          />
        </div>
      </section>
      {receipt ? (
        <section className="dashboard-grid mt-4">
          <div className="span-4">
            <ReceiptPreview receipt={receipt} onPrint={printReceipt} />
          </div>
        </section>
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
