import { useCallback, useEffect, useState } from 'react';
import { getOfflineQueueCount, offlineEvents, syncOfflineQueue } from '../../services/apiClient';

export function OfflineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    try {
      setPending(await getOfflineQueueCount());
    } catch {
      setPending(0);
    }
  }, []);

  useEffect(() => {
    refreshPending();

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleQueueChanged = (event) => {
      if (typeof event.detail?.pending === 'number') {
        setPending(event.detail.pending);
      } else {
        refreshPending();
      }
    };
    const handleSyncStarted = () => setSyncing(true);
    const handleSyncFinished = (event) => {
      setSyncing(false);
      if (typeof event.detail?.pending === 'number') {
        setPending(event.detail.pending);
      } else {
        refreshPending();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener(offlineEvents.queueChanged, handleQueueChanged);
    window.addEventListener(offlineEvents.syncStarted, handleSyncStarted);
    window.addEventListener(offlineEvents.syncFinished, handleSyncFinished);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener(offlineEvents.queueChanged, handleQueueChanged);
      window.removeEventListener(offlineEvents.syncStarted, handleSyncStarted);
      window.removeEventListener(offlineEvents.syncFinished, handleSyncFinished);
    };
  }, [refreshPending]);

  if (online && pending === 0 && !syncing) {
    return null;
  }

  return (
    <div className={`offline-status ${online ? 'is-online' : 'is-offline'}`} role="status" aria-live="polite">
      <span className="offline-status-icon">
        <i className={`bi ${online ? 'bi-cloud-check' : 'bi-wifi-off'}`} aria-hidden="true" />
      </span>
      <span>
        <strong>{online ? (syncing ? 'Syncing' : 'Online') : 'Offline'}</strong>
        <small>{pending} queued</small>
      </span>
      {online && pending > 0 ? (
        <button
          className="btn btn-sm btn-light"
          type="button"
          title="Sync queued work"
          aria-label="Sync queued work"
          onClick={() => syncOfflineQueue()}
          disabled={syncing}
        >
          <i className="bi bi-arrow-repeat" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
