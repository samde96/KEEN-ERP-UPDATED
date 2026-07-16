import { useCallback, useRef } from 'react';

export function useBarcodeScanner(onScan) {
  const bufferRef = useRef('');
  const timerRef = useRef(null);

  return useCallback(
    (event) => {
      if (event.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        bufferRef.current = '';
        if (barcode) onScan(barcode);
        return;
      }

      if (event.key.length === 1) {
        bufferRef.current += event.key;
      }

      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        bufferRef.current = '';
      }, 80);
    },
    [onScan]
  );
}
