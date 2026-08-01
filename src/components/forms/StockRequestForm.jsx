import { useMemo } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';
import { productService } from '../../services/productService';

function isShop(location) {
  return ['SHOP', 'BRANCH'].includes(String(location.type || '').toUpperCase().replace(/\s+/g, '_'));
}

function quantityValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function StockRequestForm({ onSubmit, defaultValues }) {
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const { data: locations } = useAsyncData(catalogService.locations);
  const shops = locations.filter(isShop);
  const { register, control, handleSubmit, formState, watch } = useForm({
    defaultValues: {
      shopId: defaultValues?.shopId || '',
      priority: 'Normal',
      reason: '',
      lines: defaultValues?.lines?.length ? defaultValues.lines : [{ productId: '', quantity: 1 }]
    }
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const watchedLines = watch('lines') || [];
  const selectedProductIds = watchedLines.map((line) => line.productId).filter(Boolean);
  const totals = useMemo(
    () =>
      watchedLines.reduce(
        (summary, line) => ({
          items: summary.items + (line.productId ? 1 : 0),
          units: summary.units + Math.max(quantityValue(line.quantity), 0)
        }),
        { items: 0, units: 0 }
      ),
    [watchedLines]
  );
  const ready = shops.length > 0 && products.length > 0;

  return (
    <form className="transfer-form" onSubmit={handleSubmit(onSubmit)}>
      {!ready ? <div className="alert alert-warning">Create shop locations and products before submitting requests.</div> : null}
      <div className="app-form-grid compact">
        <div>
          <label className="form-label" htmlFor="request-shop">
            Shop
          </label>
          <select id="request-shop" className="form-select" {...register('shopId', { required: true })}>
            <option value="">Select shop</option>
            {shops.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="form-label" htmlFor="request-priority">
            Priority
          </label>
          <select id="request-priority" className="form-select" {...register('priority')}>
            <option>Normal</option>
            <option>High</option>
            <option>Urgent</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className="form-label" htmlFor="request-reason">
            Reason
          </label>
          <textarea id="request-reason" className="form-control" rows="3" {...register('reason')} />
        </div>
      </div>
      <div className="line-editor">
        <div className="line-editor-header">
          <strong>Requested products</strong>
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => append({ productId: '', quantity: 1 })}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> Add product
          </button>
        </div>
        {fields.map((field, index) => {
          const line = watchedLines[index] || {};
          return (
            <div className="line-editor-row" key={field.id}>
              <select className="form-select" aria-label="Product" {...register(`lines.${index}.productId`, { required: true })}>
                <option value="">Select product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id} disabled={selectedProductIds.includes(product.id) && product.id !== line.productId}>
                    {product.name}
                  </option>
                ))}
              </select>
              <input className="form-control" type="number" min="1" aria-label="Quantity" {...register(`lines.${index}.quantity`, { required: true, min: 1, valueAsNumber: true })} />
              <button className="btn btn-icon text-danger" type="button" onClick={() => remove(index)} disabled={fields.length === 1}>
                <i className="bi bi-trash" aria-hidden="true" />
                <span className="visually-hidden">Remove product</span>
              </button>
            </div>
          );
        })}
        <div className="transfer-sale-summary">
          <span>
            <small>Products</small>
            <strong>{totals.items}</strong>
          </span>
          <span>
            <small>Total units</small>
            <strong>{totals.units}</strong>
          </span>
        </div>
      </div>
      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting || !ready || totals.items === 0}>
          <i className="bi bi-send" aria-hidden="true" /> Submit request
        </button>
      </div>
    </form>
  );
}
