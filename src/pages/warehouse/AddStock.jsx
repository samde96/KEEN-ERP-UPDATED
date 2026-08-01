import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { CameraBarcodeScanner } from '../../components/common/CameraBarcodeScanner';
import { BarcodeScannerInput } from '../../components/pos/BarcodeScannerInput';
import { PageHeader } from '../../components/common/PageHeader';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { isWarehouseLocation } from '../../utils/locationTypes';

function numberOrDefault(value, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseScanPayload(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) return null;

  const fromObject = (source) => ({
    raw,
    productId: source.productId || source.product_id || source.id || '',
    barcode: source.barcode || source.code || source.ean || '',
    sku: source.sku || source.SKU || '',
    quantity: numberOrDefault(source.quantity || source.qty || source.units, 1),
    supplierId: source.supplierId || source.supplier_id || '',
    locationId: source.locationId || source.location_id || '',
    batchNumber: source.batchNumber || source.batch || '',
    expiryDate: source.expiryDate || source.expiry || ''
  });

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return fromObject(parsed);
    }
  } catch {
    // Continue with URL-style and raw-code parsing.
  }

  const query = raw.includes('?') ? raw.split('?').pop() : raw.includes('=') ? raw : '';
  if (query) {
    const params = new URLSearchParams(query);
    return fromObject(Object.fromEntries(params.entries()));
  }

  return {
    raw,
    productId: '',
    barcode: raw,
    sku: raw,
    quantity: 1,
    supplierId: '',
    locationId: '',
    batchNumber: '',
    expiryDate: ''
  };
}

function findScannedProduct(products, payload) {
  if (!payload) return null;
  const barcode = String(payload.barcode || '').toLowerCase();
  const sku = String(payload.sku || '').toLowerCase();
  const raw = String(payload.raw || '').toLowerCase();

  return (
    products.find((product) => payload.productId && String(product.id) === String(payload.productId)) ||
    products.find((product) => String(product.barcode || '').toLowerCase() === barcode) ||
    products.find((product) => String(product.sku || '').toLowerCase() === sku) ||
    products.find((product) => String(product.barcode || '').toLowerCase() === raw || String(product.sku || '').toLowerCase() === raw) ||
    null
  );
}

export function AddStock() {
  const [scanValue, setScanValue] = useState('');
  const [receiptLines, setReceiptLines] = useState([]);
  const [lastScan, setLastScan] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { data: suppliers } = useAsyncData(catalogService.suppliers);
  const { data: locations } = useAsyncData(catalogService.locations);
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const receivingLocations = locations.filter(isWarehouseLocation);
  const { register, handleSubmit, reset, setValue, getValues, formState } = useForm({
    defaultValues: {
      supplierId: '',
      locationId: '',
      referenceNumber: '',
      productId: '',
      quantity: 1,
      batchNumber: '',
      expiryDate: ''
    }
  });

  const addReceiptLine = (product, quantity, sourceCode = '') => {
    const units = numberOrDefault(quantity, 1);
    setReceiptLines((current) => {
      const existing = current.find((line) => line.productId === product.id);
      if (existing) {
        return current.map((line) => (line.productId === product.id ? { ...line, quantity: line.quantity + units, sourceCode: sourceCode || line.sourceCode } : line));
      }
      return [
        ...current,
        {
          productId: product.id,
          product: product.name,
          sku: product.sku,
          barcode: product.barcode,
          quantity: units,
          sourceCode
        }
      ];
    });
  };

  const applyScan = (rawValue) => {
    setMessage('');
    setError('');
    const payload = parseScanPayload(rawValue);
    if (!payload) return;

    if (payload.locationId) {
      const receivingLocation = receivingLocations.find((location) => String(location.id) === String(payload.locationId));
      if (receivingLocation) {
        setValue('locationId', payload.locationId, { shouldDirty: true, shouldValidate: true });
      } else {
        setLastScan(`${payload.raw} points to a non-receiving location`);
        setError('Scanned location is not available for supplier receiving. Receive into a store or main warehouse, then transfer stock to shops.');
        return;
      }
    }
    if (payload.supplierId) setValue('supplierId', payload.supplierId, { shouldDirty: true });
    if (payload.batchNumber) setValue('batchNumber', payload.batchNumber, { shouldDirty: true });
    if (payload.expiryDate) setValue('expiryDate', payload.expiryDate, { shouldDirty: true });

    const product = findScannedProduct(products, payload);
    if (!product) {
      setLastScan(`${payload.raw} was not found`);
      setError('No product matched that code. Select a product manually or create the product first.');
      return;
    }

    addReceiptLine(product, payload.quantity, payload.raw);
    setValue('productId', product.id, { shouldDirty: true });
    setValue('quantity', payload.quantity, { shouldDirty: true });
    setLastScan(`${payload.raw} matched ${product.name}`);
  };

  const handleScanSubmit = (event) => {
    event.preventDefault();
    applyScan(scanValue);
    setScanValue('');
  };

  const addManualLine = () => {
    setMessage('');
    setError('');
    const values = getValues();
    const product = products.find((item) => item.id === values.productId);
    if (!product) {
      setError('Select a product before adding a line.');
      return;
    }
    addReceiptLine(product, values.quantity, 'manual');
  };

  const updateLineQuantity = (productId, quantity) => {
    setReceiptLines((current) => current.map((line) => (line.productId === productId ? { ...line, quantity: numberOrDefault(quantity, 1) } : line)));
  };

  const removeLine = (productId) => {
    setReceiptLines((current) => current.filter((line) => line.productId !== productId));
  };

  const postReceipt = async (values) => {
    setMessage('');
    setError('');
    if (!receiptLines.length) {
      setError('Add at least one scanned or selected product before posting stock.');
      return;
    }
    if (!receivingLocations.some((location) => String(location.id) === String(values.locationId))) {
      setError('Select a store or main warehouse receiving location. Shop stock must come through transfers or shop requests.');
      return;
    }

    try {
      const reference = values.referenceNumber || values.batchNumber || `GRN-${Date.now()}`;
      const response = await inventoryService.receiveStockBatch({
        locationId: values.locationId,
        referenceNumber: reference,
        lines: receiptLines.map((line) => ({
          productId: line.productId,
          quantity: Number(line.quantity)
        }))
      });
      setMessage(response.offlineQueued ? response.message : `Stock posted with reference ${reference}.`);
      setReceiptLines([]);
      setLastScan('');
      setScanValue('');
      reset({ supplierId: '', locationId: '', referenceNumber: '', productId: '', quantity: 1, batchNumber: '', expiryDate: '' });
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to post received stock.');
    }
  };

  return (
    <>
      <PageHeader title="Add stock" description="Receive supplier stock into a store or main warehouse by scanner, product lookup, batch, expiry date, and quantity." />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <section className="dashboard-grid">
        <div className="panel span-5" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Scan</span>
              <h2>Barcode or QR</h2>
            </div>
          </div>
          <div className="d-grid gap-3">
            <BarcodeScannerInput value={scanValue} onChange={setScanValue} onSubmit={handleScanSubmit} placeholder="Scan barcode, SKU, or QR payload" />
            <CameraBarcodeScanner onScan={applyScan} />
          </div>
          {lastScan ? (
            <div className={`alert mt-3 ${lastScan.includes('not found') ? 'alert-warning' : 'alert-success'}`}>
              <i className="bi bi-upc-scan" aria-hidden="true" /> {lastScan}
            </div>
          ) : null}
        </div>
        <div className="panel span-7" data-animate="fade-up">
          <div className="panel-header">
            <div>
              <span className="panel-kicker">Goods received</span>
              <h2>Receiving receipt</h2>
            </div>
          </div>
          <form className="app-form-grid" onSubmit={handleSubmit(postReceipt)}>
            {receivingLocations.length === 0 || products.length === 0 ? (
              <div className="col-span-2 alert alert-warning">Create at least one store/main warehouse location and product before receiving stock.</div>
            ) : null}
            <div>
              <label className="form-label" htmlFor="supplier">
                Supplier
              </label>
              <select id="supplier" className="form-select" {...register('supplierId')}>
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="location">
                Receiving location
              </label>
              <select id="location" className="form-select" {...register('locationId', { required: true })}>
                <option value="">Select receiving location</option>
                {receivingLocations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="reference">
                Reference
              </label>
              <input id="reference" className="form-control" placeholder="GRN or supplier invoice" {...register('referenceNumber')} />
            </div>
            <div>
              <label className="form-label" htmlFor="batch">
                Batch number
              </label>
              <input id="batch" className="form-control" {...register('batchNumber')} />
            </div>
            <div>
              <label className="form-label" htmlFor="expiry">
                Expiry date
              </label>
              <input id="expiry" className="form-control" type="date" {...register('expiryDate')} />
            </div>
            <div>
              <label className="form-label" htmlFor="product">
                Product
              </label>
              <select id="product" className="form-select" {...register('productId')}>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label" htmlFor="quantity">
                Quantity
              </label>
              <input id="quantity" className="form-control" type="number" min="1" {...register('quantity', { min: 1, valueAsNumber: true })} />
            </div>
            <div className="d-flex align-items-end">
              <button className="btn btn-outline-primary w-100" type="button" onClick={addManualLine}>
                <i className="bi bi-plus-lg" aria-hidden="true" /> Add line
              </button>
            </div>
            <div className="col-span-2">
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Barcode</th>
                      <th>Qty</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {receiptLines.length ? (
                      receiptLines.map((line) => (
                        <tr key={line.productId}>
                          <td>{line.product}</td>
                          <td>{line.sku}</td>
                          <td>{line.barcode}</td>
                          <td style={{ width: '8rem' }}>
                            <input
                              className="form-control form-control-sm"
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(event) => updateLineQuantity(line.productId, event.target.value)}
                            />
                          </td>
                          <td className="text-end">
                            <button className="btn btn-icon text-danger" type="button" onClick={() => removeLine(line.productId)}>
                              <i className="bi bi-trash" aria-hidden="true" />
                              <span className="visually-hidden">Remove line</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-muted">
                          No received items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="col-span-2 d-flex justify-content-end">
              <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting || receivingLocations.length === 0 || products.length === 0 || receiptLines.length === 0}>
                <i className="bi bi-box-arrow-in-down" aria-hidden="true" /> Post received stock
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
