import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ProductForm } from '../../components/forms/ProductForm';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { DataTable } from '../../components/common/DataTable';
import { PageHeader } from '../../components/common/PageHeader';
import { ProductPhoto } from '../../components/common/ProductPhoto';
import { SearchFilterBar } from '../../components/common/SearchFilterBar';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useAsyncData } from '../../hooks/useAsyncData';
import { productService } from '../../services/productService';
import { catalogService } from '../../services/catalogService';
import { formatCurrency } from '../../utils/formatCurrency';

function CategoryForm({ onSubmit }) {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: { name: '', status: 'Active' }
  });

  return (
    <form className="app-form-grid" onSubmit={handleSubmit(onSubmit)}>
      <div className="col-span-2">
        <label className="form-label" htmlFor="category-name">
          Category name
        </label>
        <input id="category-name" className="form-control" {...register('name', { required: true })} />
      </div>
      <div>
        <label className="form-label" htmlFor="category-status">
          Status
        </label>
        <select id="category-status" className="form-select" {...register('status')}>
          <option>Active</option>
          <option>Inactive</option>
          <option>Restricted</option>
        </select>
      </div>
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting}>
          <i className="bi bi-check2-circle" aria-hidden="true" /> Save category
        </button>
      </div>
    </form>
  );
}

export function ProductCatalog() {
  const [query, setQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { data: products, reload } = useAsyncData(productService.list.bind(productService));
  const filtered = useMemo(
    () => products.filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(query.toLowerCase())),
    [products, query]
  );

  const handleProductSave = async (values) => {
    setMessage('');
    setError('');
    try {
      const response = await productService.save({ ...values, id: editingProduct?.id });
      setEditingProduct(null);
      setMessage(response.offlineQueued ? response.message : 'Product saved.');
      if (response.offlineQueued) {
        return;
      }
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to save product.');
    }
  };

  const handleCategorySave = async (values) => {
    setMessage('');
    setError('');
    try {
      const response = await catalogService.saveCategory(values);
      setCategoryOpen(false);
      setMessage(response.offlineQueued ? response.message : 'Category saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to save category.');
    }
  };

  return (
    <>
      <PageHeader
        title="Product catalog"
        description="Maintain product identity, barcodes, prices, reorder levels, suppliers, and stock status."
        actions={
          <>
            <button className="btn btn-outline-primary" type="button" onClick={() => setCategoryOpen(true)}>
              <i className="bi bi-tags" aria-hidden="true" /> New category
            </button>
            <button className="btn btn-primary" type="button" onClick={() => setEditingProduct({})}>
              <i className="bi bi-plus-lg" aria-hidden="true" /> New product
            </button>
          </>
        }
      />
      {message ? <div className="alert alert-success">{message}</div> : null}
      {error ? <div className="alert alert-danger">{error}</div> : null}
      <SearchFilterBar value={query} onChange={setQuery} placeholder="Search products, SKU, or barcode" />
      <DataTable
        data={filtered}
        columns={[
          {
            key: 'name',
            label: 'Product',
            render: (row) => (
              <div className="product-cell">
                <ProductPhoto src={row.imageUrl} alt={row.name} size="thumb" />
                <span>
                  <strong>{row.name}</strong>
                  <small>{row.brand || row.category}</small>
                </span>
              </div>
            )
          },
          { key: 'sku', label: 'SKU' },
          { key: 'barcode', label: 'Barcode' },
          { key: 'category', label: 'Category' },
          { key: 'supplier', label: 'Supplier' },
          { key: 'sellingPrice', label: 'Price', render: (row) => formatCurrency(row.sellingPrice) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setEditingProduct(row)}>
                Edit
              </button>
            )
          }
        ]}
      />
      <ConfirmModal
        open={editingProduct !== null}
        title={editingProduct?.id ? 'Edit product' : 'New product'}
        body={<ProductForm defaultValues={editingProduct} onSubmit={handleProductSave} />}
        cancelLabel={null}
        confirmLabel={null}
        onCancel={() => setEditingProduct(null)}
        size="modal-lg"
      />
      <ConfirmModal
        open={categoryOpen}
        title="New category"
        body={<CategoryForm onSubmit={handleCategorySave} />}
        cancelLabel={null}
        confirmLabel={null}
        onCancel={() => setCategoryOpen(false)}
      />
    </>
  );
}
