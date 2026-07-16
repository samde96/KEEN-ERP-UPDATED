import { useForm } from 'react-hook-form';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';
import { productService } from '../../services/productService';

function isShop(location) {
  return ['SHOP', 'BRANCH'].includes(String(location.type || '').toUpperCase().replace(/\s+/g, '_'));
}

export function StockRequestForm({ onSubmit, defaultValues }) {
  const { data: products } = useAsyncData(productService.list.bind(productService));
  const { data: locations } = useAsyncData(catalogService.locations);
  const shops = locations.filter(isShop);
  const { register, handleSubmit, formState } = useForm({
    defaultValues: {
      shopId: defaultValues?.shopId || '',
      productId: '',
      quantity: 1,
      priority: 'Normal',
      reason: ''
    }
  });

  return (
    <form className="app-form-grid compact" onSubmit={handleSubmit(onSubmit)}>
      {shops.length === 0 ? <div className="col-span-2 alert alert-warning">Create at least one shop or branch location before submitting requests.</div> : null}
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
        <label className="form-label" htmlFor="request-product">
          Product
        </label>
        <select id="request-product" className="form-select" {...register('productId', { required: true })}>
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label" htmlFor="request-quantity">
          Quantity
        </label>
        <input id="request-quantity" className="form-control" type="number" min="1" {...register('quantity', { required: true, min: 1, valueAsNumber: true })} />
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
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting || shops.length === 0}>
          <i className="bi bi-send" aria-hidden="true" /> Submit request
        </button>
      </div>
    </form>
  );
}
