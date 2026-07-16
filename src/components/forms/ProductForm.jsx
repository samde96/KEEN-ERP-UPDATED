import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ProductPhoto } from '../common/ProductPhoto';
import { useAsyncData } from '../../hooks/useAsyncData';
import { catalogService } from '../../services/catalogService';

export function ProductForm({ onSubmit, defaultValues }) {
  const { data: categories } = useAsyncData(catalogService.categories);
  const { data: suppliers } = useAsyncData(catalogService.suppliers);
  const initialValues = {
    name: '',
    barcode: '',
    imageUrl: '',
    photoFile: null,
    categoryId: '',
    supplierId: '',
    brand: '',
    unitOfMeasure: 'Piece',
    costPrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    taxRate: 0,
    reorderLevel: '',
    ...defaultValues
  };
  const { register, handleSubmit, formState, setValue, watch } = useForm({
    defaultValues: initialValues
  });

  useEffect(() => {
    if (!defaultValues) return;
    const category = categories.find((item) => item.name === defaultValues.category || item.id === defaultValues.categoryId);
    const supplier = suppliers.find((item) => item.name === defaultValues.supplier || item.id === defaultValues.supplierId);

    if (category) setValue('categoryId', category.id);
    if (supplier) setValue('supplierId', supplier.id);
    setValue('unitOfMeasure', defaultValues.unitOfMeasure || defaultValues.unit || 'Piece');
    setValue('imageUrl', defaultValues.imageUrl || '');
  }, [categories, defaultValues, setValue, suppliers]);

  const catalogReady = categories.length > 0 && suppliers.length > 0;
  const productName = watch('name');
  const imageUrl = watch('imageUrl');
  const photoFile = watch('photoFile');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState(defaultValues?.imageUrl || '');

  const generateBarcode = () => {
    const base = `616${String(Math.floor(Math.random() * 1_000_000_000)).padStart(9, '0')}`;
    const sum = base.split('').reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    setValue('barcode', `${base}${checkDigit}`, { shouldDirty: true, shouldValidate: true });
  };

  useEffect(() => {
    const selectedPhoto = photoFile?.item ? photoFile.item(0) : photoFile?.[0];
    if (!selectedPhoto) {
      setPhotoPreviewUrl(defaultValues?.imageUrl || '');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedPhoto);
    setPhotoPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [defaultValues?.imageUrl, photoFile]);

  return (
    <form className="app-form-grid" onSubmit={handleSubmit(onSubmit)}>
      {!catalogReady ? (
        <div className="col-span-2 alert alert-warning mb-0">Create at least one category and one supplier before saving products.</div>
      ) : null}
      <div className="col-span-2">
        <label className="form-label" htmlFor="product-name">
          Product name
        </label>
        <input id="product-name" className="form-control" {...register('name', { required: true })} />
      </div>
      {defaultValues?.sku ? (
        <div>
          <label className="form-label" htmlFor="product-sku">
            SKU
          </label>
          <input id="product-sku" className="form-control" value={defaultValues.sku} disabled readOnly />
        </div>
      ) : null}
      <div>
        <label className="form-label" htmlFor="product-barcode">
          Barcode
        </label>
        <div className="input-group">
          <input id="product-barcode" className="form-control" {...register('barcode')} />
          <button className="btn btn-outline-primary" type="button" onClick={generateBarcode}>
            <i className="bi bi-upc-scan" aria-hidden="true" /> Auto
          </button>
        </div>
      </div>
      <div className="col-span-2 product-photo-field">
        <ProductPhoto src={photoPreviewUrl || imageUrl} alt={productName || 'Product photo'} size="form" />
        <div className="product-photo-control">
          <input type="hidden" {...register('imageUrl')} />
          <label className="form-label" htmlFor="product-photo">
            Product photo
          </label>
          <input id="product-photo" className="form-control" type="file" accept="image/png,image/jpeg,image/webp,image/gif" {...register('photoFile')} />
          <div className="form-text">Choose a JPG, PNG, WebP, or GIF image from this device. Maximum size is 5 MB.</div>
        </div>
      </div>
      <div>
        <label className="form-label" htmlFor="product-category">
          Category
        </label>
        <select id="product-category" className="form-select" {...register('categoryId', { required: true })}>
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label" htmlFor="product-supplier">
          Supplier
        </label>
        <select id="product-supplier" className="form-select" {...register('supplierId', { required: true })}>
          <option value="">Select supplier</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="form-label" htmlFor="product-cost">
          Cost price
        </label>
        <input id="product-cost" className="form-control" type="number" min="0" {...register('costPrice', { required: true, min: 0 })} />
      </div>
      <div>
        <label className="form-label" htmlFor="product-selling">
          Selling price
        </label>
        <input id="product-selling" className="form-control" type="number" min="0" {...register('sellingPrice', { required: true, min: 0 })} />
      </div>
      <div>
        <label className="form-label" htmlFor="product-brand">
          Brand
        </label>
        <input id="product-brand" className="form-control" {...register('brand')} />
      </div>
      <div>
        <label className="form-label" htmlFor="product-unit">
          Unit
        </label>
        <input id="product-unit" className="form-control" {...register('unitOfMeasure', { required: true })} />
      </div>
      <div>
        <label className="form-label" htmlFor="product-reorder">
          Reorder level
        </label>
        <input id="product-reorder" className="form-control" type="number" min="0" {...register('reorderLevel', { required: true, min: 0 })} />
      </div>
      <div>
        <label className="form-label" htmlFor="product-wholesale">
          Wholesale price
        </label>
        <input id="product-wholesale" className="form-control" type="number" min="0" {...register('wholesalePrice')} />
      </div>
      <div>
        <label className="form-label" htmlFor="product-tax">
          Tax rate
        </label>
        <input id="product-tax" className="form-control" type="number" min="0" {...register('taxRate')} />
      </div>
      <div className="col-span-2 d-flex justify-content-end">
        <button className="btn btn-primary" type="submit" disabled={formState.isSubmitting || !catalogReady}>
          <i className="bi bi-check2-circle" aria-hidden="true" /> Save product
        </button>
      </div>
    </form>
  );
}
