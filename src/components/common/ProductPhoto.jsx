import { useState } from 'react';

function resolveProductPhotoUrl(src) {
  const imageUrl = typeof src === 'string' ? src.trim() : '';
  if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  if (!/^https?:\/\//i.test(apiBaseUrl)) {
    return imageUrl;
  }

  try {
    return new URL(imageUrl, apiBaseUrl).toString();
  } catch {
    return imageUrl;
  }
}

export function ProductPhoto({ src, alt = 'Product photo', size = 'thumb', className = '' }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = resolveProductPhotoUrl(src);
  const showImage = imageUrl && !failed;
  const classes = ['product-photo', `product-photo-${size}`, className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {showImage ? (
        <img src={imageUrl} alt={alt} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span className="product-photo-placeholder" aria-label={`${alt} unavailable`} role="img">
          <i className="bi bi-image" aria-hidden="true" />
        </span>
      )}
    </span>
  );
}
