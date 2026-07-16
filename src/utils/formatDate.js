export function formatDate(value, options = {}) {
  if (!value) return 'Not recorded';

  return new Intl.DateTimeFormat('en-KE', {
    dateStyle: options.dateStyle || 'medium',
    timeStyle: options.timeStyle || 'short',
    ...options
  }).format(new Date(value));
}
