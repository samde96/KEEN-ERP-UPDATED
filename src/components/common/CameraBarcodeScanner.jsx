import { useEffect, useRef, useState } from 'react';

const BARCODE_FORMATS = ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'];

export function CameraBarcodeScanner({ onScan, buttonLabel = 'Scan with camera', stopAfterScan = false }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const detectorRef = useRef(null);
  const onScanRef = useRef(onScan);
  const lastScanRef = useRef('');
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;

    const stopCamera = () => {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };

    async function startCamera() {
      if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
        setStatus('Camera scanning is not supported in this browser.');
        setActive(false);
        return;
      }

      try {
        detectorRef.current = new window.BarcodeDetector({ formats: BARCODE_FORMATS });
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus('Camera scanner active');

        intervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || !detectorRef.current) return;

          try {
            const results = await detectorRef.current.detect(videoRef.current);
            const value = results[0]?.rawValue?.trim();
            if (!value || value === lastScanRef.current) return;

            lastScanRef.current = value;
            onScanRef.current(value);
            if (stopAfterScan) {
              setStatus('Barcode scanned');
              setActive(false);
            }
            window.setTimeout(() => {
              if (lastScanRef.current === value) lastScanRef.current = '';
            }, 1200);
          } catch {
            // Keep the session open if a single frame cannot be decoded.
          }
        }, 450);
      } catch {
        setStatus('Unable to start camera scanner.');
        setActive(false);
      }
    }

    startCamera();
    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [active, stopAfterScan]);

  return (
    <div className="camera-barcode-scanner">
      <button
        className={`btn ${active ? 'btn-outline-danger' : 'btn-outline-primary'}`}
        type="button"
        onClick={() => {
          setStatus('');
          setActive((current) => !current);
        }}
      >
        <i className={`bi ${active ? 'bi-camera-video-off' : 'bi-camera-video'}`} aria-hidden="true" /> {active ? 'Stop camera' : buttonLabel}
      </button>
      {active ? <video ref={videoRef} className="camera-barcode-video" muted playsInline /> : null}
      {status ? <small className="text-muted">{status}</small> : null}
    </div>
  );
}
