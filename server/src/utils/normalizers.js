/**
 * Normalizes URLs and identifiers across the Node backend to match Python detection normalization.
 */

export function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  try {
    let url = rawUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    const parsed = new URL(url);
    let hostname = parsed.hostname.toLowerCase();
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    const pathname = parsed.pathname.replace(/\/+$/, '').toLowerCase();
    return `${hostname}${pathname}`;
  } catch (err) {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
  }
}

export function normalizeIdentifier(identifier) {
  if (!identifier || typeof identifier !== 'string') return '';
  let clean = identifier.trim().toLowerCase();
  if (clean.startsWith('@')) {
    clean = clean.substring(1);
  }
  return clean;
}
