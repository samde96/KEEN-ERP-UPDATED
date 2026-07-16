import { useFieldArray, useForm } from 'react-hook-form';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';
import { productService } from '../../services/productService';

function isLocationType(location, types) {
  const normalized = String(location.type || '').toUpperCase().replace(/\s+/g, '_');
  return types.includes(normalized);
}

export function StockTransferForm({ onSubmit }) {
  const { data: locations } = useAsyncData(catalogService.locations);
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const { register, control, handleSubmit, formState } = useForm({
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
  const warehouses = locations.filter((location) => isLocationType(location, ['MAIN_WAREHOUSE', 'WAREHOUSE', 'STORE']));
  const shops = locations.filter((location) => isLocationType(location, ['SHOP', 'BRANCH']));
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
          <strong>Transfer lines</strong>
          <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => append({ productId: '', quantity: 1 })}>
            <i className="bi bi-plus-lg" aria-hidden="true" /> Add line
          </button>
        </div>
        {fields.map((field, index) => (
          <div className="line-editor-row" key={field.id}>
            <select className="form-select" {...register(`lines.${index}.productId`, { required: true })}>
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
            <input className="form-control" type="number" min="1" {...register(`lines.${index}.quantity`, { min: 1 })} />
            <button className="btn btn-icon text-danger" type="button" onClick={() => remove(index)} disabled={fields.length === 1}>
              <i className="bi bi-trash" aria-hidden="true" />
              <span className="visually-hidden">Remove line</span>
            </button>
          </div>
        ))}
      </div>
      <div className="d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting || !ready}>
          <i className="bi bi-arrow-left-right" aria-hidden="true" /> Create transfer
        </button>
      </div>
    </form>
  );
}
