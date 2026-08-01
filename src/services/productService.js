import { apiClient } from './apiClient';

function selectedPhotoFile(photoFile) {
  if (!photoFile) return null;
  if (typeof File !== 'undefined' && photoFile instanceof File) {
    return photoFile;
  }
  if (typeof photoFile.length === 'number') {
    return photoFile.item ? photoFile.item(0) : photoFile[0];
  }
  return null;
}

function taxRateForProduct(product) {
  if (product.taxCode === 'A') return 0;
  if (product.taxCode === 'G') return 16;
  return Number(product.taxRate || 0);
}

function filenameFromDisposition(disposition, fallback) {
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition || '');
  return match ? decodeURIComponent(match[1].replace(/"$/, '')) : fallback;
}

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const productService = {
  async list() {
    const response = await apiClient.get('/products');
    return response.data || [];
  },

  async save(product) {
    const payload = {
      name: product.name,
      barcode: product.barcode,
      rfidTag: product.rfidTag || null,
      imageUrl: product.imageUrl || null,
      categoryId: product.categoryId || product.category,
      supplierId: product.supplierId || product.supplier,
      brand: product.brand || '',
      unitOfMeasure: product.unitOfMeasure || product.unit || 'Piece',
      costPrice: Number(product.costPrice || 0),
      sellingPrice: Number(product.sellingPrice || 0),
      wholesalePrice: Number(product.wholesalePrice || product.sellingPrice || 0),
      reorderLevel: Number(product.reorderLevel || 0),
      taxRate: taxRateForProduct(product),
      status: product.status || 'ACTIVE'
    };
    const photo = selectedPhotoFile(product.photoFile);
    let response;

    if (product.id) {
      response = await apiClient.put(`/products/${product.id}`, payload);
    } else {
      response = await apiClient.post('/products', payload);
    }

    const savedProductId = response.data?.id || product.id;
    if (response.data?.offlineQueued) {
      return response.data;
    }

    if (photo && savedProductId) {
      await this.uploadPhoto(savedProductId, photo);
    }

    return response.data;
  },

  async uploadPhoto(productId, photo) {
    const formData = new FormData();
    formData.append('photo', photo);
    const response = await apiClient.post(`/products/${productId}/photo`, formData);
    return response.data;
  },

  async importProducts(file) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/products/import', formData, {
      __disableOfflineQueue: true
    });
    return response.data;
  },

  async exportProductsCsv() {
    const response = await apiClient.get('/products/export.csv', {
      responseType: 'blob',
      __disableOfflineCache: true
    });
    const filename = filenameFromDisposition(response.headers?.['content-disposition'], 'keen-products.csv');
    const blob = response.data instanceof Blob ? response.data : new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(filename, blob);
  },

  async deleteProduct(productId) {
    const response = await apiClient.delete(`/products/${productId}`, {
      __disableOfflineQueue: true
    });
    return response.data;
  },

  async search(query) {
    const products = await this.list();
    const normalized = query.toLowerCase();
    return products.filter((product) => `${product.name} ${product.sku} ${product.barcode}`.toLowerCase().includes(normalized));
  }
};
