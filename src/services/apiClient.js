import axios from 'axios';
import {
  cacheResponse,
  cachedResponse,
  createOfflineId,
  enqueueRequest,
  queuedRequestCount,
  queuedRequests,
  removeQueuedRequest,
  updateQueuedRequest
} from './offlineStore';

export const offlineEvents = {
  queueChanged: 'keen:offline-queue-changed',
  syncStarted: 'keen:offline-sync-started',
  syncFinished: 'keen:offline-sync-finished',
  connectivityChanged: 'keen:offline-connectivity-changed'
};

const API_VERSION_PATH = '/api/v1';
const CSRF_COOKIE_NAME = 'KEEN_CSRF';
const CSRF_HEADER_NAME = 'X-CSRF-Token';

function normalizeApiBaseUrl(value) {
  const raw = (value || API_VERSION_PATH).trim();
  if (!raw) {
    return API_VERSION_PATH;
  }

  const baseUrl = raw.replace(/\/+$/, '');
  if (/\/api\/v\d+$/i.test(baseUrl)) {
    return baseUrl;
  }

  if (/\/api$/i.test(baseUrl)) {
    return `${baseUrl}/v1`;
  }

  return `${baseUrl}${API_VERSION_PATH}`;
}

function normalizeEndpointPath(value) {
  if (!value || /^https?:\/\//i.test(value)) {
    return value;
  }

  const suffixIndex = value.search(/[?#]/);
  const pathEnd = suffixIndex === -1 ? value.length : suffixIndex;
  const path = value.slice(0, pathEnd);
  const suffix = value.slice(pathEnd);
  const normalizedPath = path
    .replace(/^\/api\/v\d+(?=\/|$)/i, '')
    .replace(/^\/api(?=\/|$)/i, '');

  return `${normalizedPath || '/'}${suffix}`;
}

export const apiClient = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

let syncInFlight = false;

function dispatchOfflineEvent(name, detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name, { detail }));
  }
}

function dispatchConnectivity(online) {
  dispatchOfflineEvent(offlineEvents.connectivityChanged, { online });
}

function requestMethod(config) {
  return (config.method || 'get').toUpperCase();
}

function isMutation(config) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(requestMethod(config));
}

function isAuthRequest(config) {
  return normalizeEndpointPath(config.url || '').startsWith('/auth/');
}

function isFormDataPayload(value) {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function responseText(error) {
  const data = error.response?.data;
  if (typeof data === 'string') {
    return data;
  }
  if (data && typeof data === 'object') {
    return `${data.detail || ''} ${data.message || ''}`;
  }
  return '';
}

function isProxyOfflineResponse(error) {
  const status = Number(error.response?.status || 0);
  if ([502, 503, 504].includes(status)) {
    return true;
  }

  if (status !== 500) {
    return false;
  }

  return /proxy|ECONNREFUSED|ECONNRESET|ENOTFOUND|ETIMEDOUT|fetch failed|network error/i.test(responseText(error));
}

function isOfflineFailure(error) {
  if (isProxyOfflineResponse(error)) {
    return true;
  }

  return !error.response && (typeof navigator === 'undefined' || navigator.onLine === false || ['ERR_NETWORK', 'ECONNABORTED'].includes(error.code));
}

function headersToObject(headers) {
  if (!headers) {
    return {};
  }

  if (typeof headers.toJSON === 'function') {
    return headers.toJSON();
  }

  return { ...headers };
}

function getHeader(headers, name) {
  const normalized = name.toLowerCase();
  return Object.entries(headersToObject(headers)).find(([key]) => key.toLowerCase() === normalized)?.[1];
}

function setHeader(config, name, value) {
  if (!config.headers) {
    config.headers = {};
  }

  if (typeof config.headers.set === 'function') {
    config.headers.set(name, value);
  } else {
    config.headers[name] = value;
  }
}

function removeHeader(config, name) {
  if (!config.headers) {
    return;
  }

  if (typeof config.headers.delete === 'function') {
    config.headers.delete(name);
    return;
  }

  const normalized = name.toLowerCase();
  Object.keys(config.headers).forEach((key) => {
    if (key.toLowerCase() === normalized) {
      delete config.headers[key];
    }
  });
}

function getCookie(name) {
  if (typeof document === 'undefined') {
    return '';
  }

  return document.cookie
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1) || '';
}

function stableClone(value) {
  if (value == null || typeof value === 'string') {
    return value;
  }

  if (isFormDataPayload(value)) {
    return value;
  }

  return JSON.parse(JSON.stringify(value));
}

function serializePayload(value) {
  if (value == null) {
    return { type: 'empty', value: null };
  }

  if (typeof value === 'string') {
    return { type: 'text', value };
  }

  if (isFormDataPayload(value)) {
    throw new Error('File uploads require an active connection.');
  }

  return { type: 'json', value: stableClone(value) };
}

function deserializePayload(body) {
  if (!body || body.type === 'empty') {
    return undefined;
  }

  return body.value;
}

function cacheKey(config) {
  const url = new URL(config.url || '', window.location.origin);
  const params = config.params || {};

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  });

  return `${requestMethod(config)} ${url.pathname}${url.search}`;
}

function syntheticQueuedResponse(entry, config) {
  return {
    data: {
      id: entry.id,
      message: 'Saved offline. It will sync when the network is available.',
      offlineQueued: true,
      queuedAt: entry.createdAt
    },
    status: 202,
    statusText: 'Accepted',
    headers: { 'X-Offline-Queued': 'true' },
    config
  };
}

async function queueOfflineRequest(config) {
  if (!isMutation(config) || isAuthRequest(config) || config.__offlineReplay) {
    throw new Error('This request requires an active connection.');
  }

  const createdAt = new Date().toISOString();
  const idempotencyKey = getHeader(config.headers, 'Idempotency-Key') || createOfflineId('idem');
  const entry = {
    id: createOfflineId('request'),
    idempotencyKey,
    method: requestMethod(config),
    url: config.url,
    params: stableClone(config.params || {}),
    body: serializePayload(config.__offlineOriginalData ?? config.data),
    createdAt,
    updatedAt: createdAt,
    attempts: 0,
    status: 'queued'
  };

  await enqueueRequest(entry);
  dispatchOfflineEvent(offlineEvents.queueChanged, { pending: await queuedRequestCount() });
  return syntheticQueuedResponse(entry, config);
}

export async function getOfflineQueueCount() {
  return queuedRequestCount();
}

export async function syncOfflineQueue() {
  if (syncInFlight) {
    return { synced: 0, pending: await queuedRequestCount() };
  }

  syncInFlight = true;
  dispatchOfflineEvent(offlineEvents.syncStarted);

  let synced = 0;
  try {
    const entries = await queuedRequests();

    for (const entry of entries) {
      const normalizedUrl = normalizeEndpointPath(entry.url || '');
      if (normalizedUrl.startsWith('/auth/')) {
        await removeQueuedRequest(entry.id);
        continue;
      }

      await updateQueuedRequest(entry.id, {
        attempts: (entry.attempts || 0) + 1,
        status: 'syncing',
        lastAttemptAt: new Date().toISOString()
      });

      try {
        await apiClient.request({
          method: entry.method,
          url: normalizedUrl,
          params: entry.params,
          data: deserializePayload(entry.body),
          headers: { 'Idempotency-Key': entry.idempotencyKey },
          __offlineReplay: true
        });
        await removeQueuedRequest(entry.id);
        synced += 1;
      } catch (syncError) {
        await updateQueuedRequest(entry.id, {
          status: 'queued',
          lastError: syncError.response?.data?.detail || syncError.message || 'Unable to sync request.'
        });

        if (isOfflineFailure(syncError)) {
          break;
        }
      }
    }

    const pending = await queuedRequestCount();
    dispatchOfflineEvent(offlineEvents.queueChanged, { pending });
    return { synced, pending };
  } finally {
    syncInFlight = false;
    dispatchOfflineEvent(offlineEvents.syncFinished, { synced, pending: await queuedRequestCount() });
  }
}

apiClient.interceptors.request.use((config) => {
  const requestUrl = normalizeEndpointPath(config.url || '');
  config.url = requestUrl;

  if (isFormDataPayload(config.data)) {
    removeHeader(config, 'Content-Type');
  }

  if (requestUrl.startsWith('/auth/') && requestUrl !== '/auth/logout') {
    return config;
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (typeof config.headers?.delete === 'function') {
      config.headers.delete('Content-Type');
    } else if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }

  if (isMutation(config) && !config.__offlineReplay) {
    if (!isFormDataPayload(config.data) && !getHeader(config.headers, 'Idempotency-Key')) {
      setHeader(config, 'Idempotency-Key', createOfflineId('idem'));
    }
    const csrfToken = getCookie(CSRF_COOKIE_NAME);
    if (csrfToken && !getHeader(config.headers, CSRF_HEADER_NAME)) {
      setHeader(config, CSRF_HEADER_NAME, decodeURIComponent(csrfToken));
    }
    config.__offlineOriginalData = stableClone(config.data);
  }

  return config;
});

apiClient.interceptors.response.use(
  async (response) => {
    dispatchConnectivity(true);

    if (requestMethod(response.config) === 'GET' && !isAuthRequest(response.config) && !response.config.__disableOfflineCache) {
      try {
        await cacheResponse({
          key: cacheKey(response.config),
          data: response.data,
          status: response.status,
          statusText: response.statusText
        });
      } catch {
        // The live response should still be used if local cache storage is unavailable.
      }
    }

    return response;
  },
  async (error) => {
    const failedConfig = error.config || {};

    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    if (isOfflineFailure(error)) {
      dispatchConnectivity(false);

      if (requestMethod(failedConfig) === 'GET' && !isAuthRequest(failedConfig) && !failedConfig.__disableOfflineCache) {
        try {
          const cached = await cachedResponse(cacheKey(failedConfig));
          if (cached) {
            return {
              data: cached.data,
              status: cached.status || 200,
              statusText: 'Offline Cache',
              headers: { 'X-Offline-Cache': 'true' },
              config: failedConfig,
              offlineCache: true
            };
          }
        } catch {
          // Continue to the original network failure.
        }
      }

      if (isMutation(failedConfig) && !failedConfig.__disableOfflineQueue && !failedConfig.__offlineReplay) {
        return queueOfflineRequest(failedConfig);
      }
    }

    return Promise.reject(error);
  }
);

if (typeof window !== 'undefined' && !window.__keenOfflineSyncRegistered) {
  window.__keenOfflineSyncRegistered = true;
  window.addEventListener('online', () => {
    syncOfflineQueue();
  });
  window.setInterval(() => {
    syncOfflineQueue();
  }, 30000);
  window.setTimeout(() => {
    syncOfflineQueue();
  }, 1500);
}
