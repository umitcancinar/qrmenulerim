const FALLBACK_APP_URL = 'https://qrmenulerim.store';

function removeWrappingQuotes(value: string) {
  let normalized = value.trim();

  while (
    normalized.length >= 2
    && ((normalized.startsWith('"') && normalized.endsWith('"'))
      || (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    normalized = normalized.slice(1, -1).trim();
  }

  return normalized;
}

export function normalizeAppUrl(value = process.env.NEXT_PUBLIC_APP_URL) {
  const candidate = removeWrappingQuotes(value || FALLBACK_APP_URL);

  try {
    const url = new URL(candidate);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return FALLBACK_APP_URL;

    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return FALLBACK_APP_URL;
  }
}

export const appUrl = normalizeAppUrl();
