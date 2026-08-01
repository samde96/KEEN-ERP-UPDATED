import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';
import { productService } from '../../services/productService';
import { formatCurrency } from '../../utils/formatCurrency';

function isLocationType(location, types) {
  const normalized = String(location.type || '').toUpperCase().replace(/\s+/g, '_');
  return types.includes(normalized);
}

function moneyValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function productById(products, id) {
  return products.find((product) => product.id === id);
}

export function StockTransferForm({ onSubmit }) {
  const { data: locations } = useAsyncData(catalogService.locations);
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const { register, control, handleSubmit, formState, watch } = useForm({
    defaultValues: {
      source: '',
      destination: '',
      attendant: '',
      storeManagerName: '',
      shopManagerName: '',
      notes: '',
      lines: [{ productId: '', quantity: 1 }]
    }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const sourceId = watch('source');
  const destinationId = watch('destination');
  const watchedLines = watch('lines') || [];
  const selectedProductIds = watchedLines.map((line) => line.productId).filter(Boolean);
  const warehouses = locations.filter((location) => isLocationType(location, ['MAIN_WAREHOUSE', 'WAREHOUSE', 'STORE']));
  const shops = locations.filter((location) => isLocationType(location, ['SHOP', 'BRANCH']));
  const source = locations.find((location) => location.id === sourceId);
  const destination = locations.find((location) => location.id === destinationId);
  const storeSale = source && destination && isLocationType(source, ['MAIN_WAREHOUSE', 'WAREHOUSE', 'STORE']) && isLocationType(destination, ['SHOP', 'BRANCH']);
  const transferTotals = useMemo(
    () =>
      watchedLines.reduce(
        (totals, line) => {
          const product = productById(products, line.productId);
          const quantity = Math.max(moneyValue(line.quantity), 0);
          const unitCost = moneyValue(product?.costPrice);
          const unitWholesale = moneyValue(line.wholesalePrice) || moneyValue(product?.wholesalePrice);
          if (line.productId) {
            totals.items += 1;
          }
          totals.units += quantity;
          totals.cost += unitCost * quantity;
          totals.revenue += unitWholesale * quantity;
          totals.profit += (unitWholesale - unitCost) * quantity;
          return totals;
        },
        { items: 0, units: 0, cost: 0, revenue: 0, profit: 0 }
      ),
    [products, watchedLines]
  );
  const ready = warehouses.length > 0 && shops.length > 0 && products.length > 0;

  return (
    <form className="transfer-form" onSubmit={handleSubmit(onSubmit)}>
      {!ready ? <div className="alert alert-warning">Create warehouse/shop locations, products, and stock before creating transfers.</div> : null}
      <div className="app-form-grid">
        <div>
          <label className="form-label" htmlFor="transfer-source">
            Source
          </label>
          <select id="transfer-source" className="form-select" {...register('source', { required: true })}>
            <option value="">Select source</option>
            {warehouses.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="transfer-destination">
            Destination
          </label>
          <select id="transfer-destination" className="form-select" {...register('destination', { required: true })}>
            <option value="">Select destination</option>
            {shops.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="transfer-attendant">
            Attendant
          </label>
          <input id="transfer-attendant" className="form-control" {...register('attendant', { required: true })} />
        </div>
        <div>
          <label className="form-label" htmlFor="transfer-store-manager">
            Store manager
          </label>
          <input id="transfer-store-manager" className="form-control" {...register('storeManagerName', { required: true })} />
        </div>
        <div>
          <label className="form-label" htmlFor="transfer-shop-manager">
            Shop manager
          </label>
          <input id="transfer-shop-manager" className="form-control" {...register('shopManagerName', { required: true })} />
        </div>
        <div>
          <label className="form-label" htmlFor="transfer-notes">
            Dispatch notes
          </label>
          <input id="transfer-notes" className="form-control" {...register('notes')} />
        </div>
      </div>
      <div className="line-editor">
        <div className="line-editor-header">
          <strong>{storeSale ? 'Store sale lines' : 'Transfer lines'}</strong>
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => append({ productId: '', quantity: 1, wholesalePrice: '' })}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> Add line
          </button>
        </div>
        {fields.map((field, index) => {
          const line = watchedLines[index] || {};
          const product = productById(products, line.productId);
          const quantity = Math.max(moneyValue(line.quantity), 0);
          const unitCost = moneyValue(product?.costPrice);
          const unitWholesale = moneyValue(line.wholesalePrice) || moneyValue(product?.wholesalePrice);
          const lineProfit = (unitWholesale - unitCost) * quantity;

          return (
            <div className={`line-editor-row${storeSale ? ' store-sale-line-editor-row' : ''}`} key={field.id}>
              <select className="form-select" {...register(`lines.${index}.productId`, { required: true })}>
                <option value="">Select product</option>
                {products.map((productOption) => (
                  <option key={productOption.id} value={productOption.id} disabled={selectedProductIds.includes(productOption.id) && productOption.id !== line.productId}>
                    {productOption.name}
                  </option>
                ))}
              </select>
              <input className="form-control" type="number" min="1" {...register(`lines.${index}.quantity`, { min: 1 })} />
              {storeSale ? (
                <>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={product?.wholesalePrice ? String(product.wholesalePrice) : 'Wholesale price'}
                    aria-label="Wholesale price"
                    {...register(`lines.${index}.wholesalePrice`)}
                  />
                  <span className="transfer-line-finance">
                    <small>Cost {formatCurrency(unitCost)}</small>
                    <strong>Profit {formatCurrency(lineProfit)}</strong>
                  </span>
                </>
              ) : null}
              <button className="btn btn-icon text-danger" type="button" onClick={() => remove(index)} disabled={fields.length === 1}>
                <i className="bi bi-trash" aria-hidden="true" />
                <span className="visually-hidden">Remove line</span>
              </button>
            </div>
          );
        })}
        <div className="transfer-sale-summary">
          <span>
            <small>Products</small>
            <strong>{transferTotals.items}</strong>
          </span>
          <span>
            <small>Total units</small>
            <strong>{transferTotals.units}</strong>
          </span>
          {storeSale ? (
            <>
              <span>
                <small>Store cost</small>
                <strong>{formatCurrency(transferTotals.cost)}</strong>
              </span>
              <span>
                <small>Shop invoice</small>
                <strong>{formatCurrency(transferTotals.revenue)}</strong>
              </span>
              <span>
                <small>Gross profit</small>
                <strong>{formatCurrency(transferTotals.profit)}</strong>
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting || !ready || transferTotals.items === 0}>
          <i className="bi bi-arrow-left-right" aria-hidden="true" /> {storeSale ? 'Create store sale' : 'Create transfer'}
        </button>
      </div>
    </form>
  );
}
