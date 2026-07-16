import { useState } from 'react';

export function ProductPhoto({ src, alt = 'Product photo', size = 'thumb', className = '' }) {
  const [failed, setFailed] = useState(false);
  const imageUrl = typeof src === 'string' ? src.trim() : '';
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
