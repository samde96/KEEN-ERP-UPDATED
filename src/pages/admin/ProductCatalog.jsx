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

function vatCodeForRate(rate) {
  return Number(rate || 0) > 0 ? 'G' : 'A';
}

function importSummary(result) {
  const created = Number(result?.created || 0);
  const updated = Number(result?.updated || 0);
  const failed = Number(result?.failed || 0);
  const parts = [`${created} created`, `${updated} updated`];
  if (failed) {
    parts.push(`${failed} failed`);
  }
  return `Product import complete: ${parts.join(', ')}.`;
}

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

function ProductImportForm({ importing, onSubmit }) {
  const [file, setFile] = useState(null);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (file) {
      onSubmit(file);
    }
  };

  return (
    <form className="app-form-grid" onSubmit={handleSubmit}>
      <div className="col-span-2">
        <label className="form-label" htmlFor="product-import-file">
          Excel file
        </label>
        <input
          id="product-import-file"
          className="form-control"
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          required
        />
        <small className="text-muted d-block mt-2">
          Required columns: name, category, supplier, costPrice, sellingPrice. Optional: barcode, rfidTag, brand, unitOfMeasure, wholesalePrice, reorderLevel, taxRate, status.
        </small>
      </div>
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={!file || importing}>
          <i className="bi bi-upload" aria-hidden="true" /> {importing ? 'Importing...' : 'Import products'}
        </button>
      </div>
    </form>
  );
}

export function ProductCatalog() {
  const [query, setQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importIssues, setImportIssues] = useState([]);
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
    setImportIssues([]);
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
    setImportIssues([]);
    try {
      const response = await catalogService.saveCategory(values);
      setCategoryOpen(false);
      setMessage(response.offlineQueued ? response.message : 'Category saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to save category.');
    }
  };

  const handleImportProducts = async (file) => {
    setMessage('');
    setError('');
    setImportIssues([]);
    setImporting(true);
    try {
      const result = await productService.importProducts(file);
      setImportIssues(result.errors || []);
      if (Number(result.created || 0) + Number(result.updated || 0) > 0) {
        setImportOpen(false);
        setMessage(importSummary(result));
        reload();
      } else {
        setError('No products were imported. Review the row errors and upload the file again.');
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to import products.');
    } finally {
      setImporting(false);
    }
  };

  const handleExportProducts = async () => {
    setMessage('');
    setError('');
    setImportIssues([]);
    setExporting(true);
    try {
      await productService.exportProductsCsv();
      setMessage('Product CSV downloaded.');
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to export products.');
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deletingProduct?.id) {
      return;
    }

    setMessage('');
    setError('');
    setImportIssues([]);
    setDeleting(true);
    try {
      const result = await productService.deleteProduct(deletingProduct.id);
      setDeletingProduct(null);
      setMessage(result.message || 'Product deleted.');
      reload();
    } catch (requestError) {
      setError(requestError.response?.data?.detail || requestError.message || 'Unable to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Product catalog"
        description="Maintain product identity, barcodes, prices, reorder levels, suppliers, and stock status."
        actions={
          <>
            <button className="btn btn-outline-secondary" type="button" onClick={() => setImportOpen(true)}>
              <i className="bi bi-upload" aria-hidden="true" /> Import Excel
            </button>
            <button className="btn btn-outline-secondary" type="button" onClick={handleExportProducts} disabled={exporting}>
              <i className="bi bi-download" aria-hidden="true" /> {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
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
      {importIssues.length ? (
        <div className="alert alert-warning">
          <strong>Rows needing attention</strong>
          <ul className="mb-0 mt-2">
            {importIssues.slice(0, 10).map((issue) => (
              <li key={`${issue.row}-${issue.message}`}>
                Row {issue.row}: {issue.message}
              </li>
            ))}
            {importIssues.length > 10 ? <li>{importIssues.length - 10} more rows not shown.</li> : null}
          </ul>
        </div>
      ) : null}
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
          { key: 'taxRate', label: 'VAT', render: (row) => `${vatCodeForRate(row.taxRate)} (${Number(row.taxRate || 0)}%)` },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: '',
            render: (row) => (
              <div className="d-flex gap-2 justify-content-end">
                <button className="btn btn-sm btn-outline-primary" type="button" onClick={() => setEditingProduct(row)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setDeletingProduct(row)}>
                  Delete
                </button>
              </div>
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
      <ConfirmModal
        open={importOpen}
        title="Import products"
        body={<ProductImportForm importing={importing} onSubmit={handleImportProducts} />}
        cancelLabel={null}
        confirmLabel={null}
        onCancel={() => setImportOpen(false)}
      />
      <ConfirmModal
        open={Boolean(deletingProduct)}
        title="Delete product"
        body={`Delete ${deletingProduct?.name || 'this product'}? Products already used in stock or transactions will be marked discontinued instead.`}
        confirmLabel={deleting ? 'Deleting...' : 'Delete product'}
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setDeletingProduct(null)}
        onConfirm={handleDeleteProduct}
      />
    </>
  );
}
