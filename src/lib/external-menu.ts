export type ExternalMenuItem = Record<string, unknown>;
export type ExternalMenuCategory = Record<string, unknown>;
export type ExternalMenuPayload = Record<string, unknown> & { categories: ExternalMenuCategory[] };

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;

function isPrivateIpv4(hostname: string) {
  const parts = hostname.split('.');
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return false;
  const [a, b] = parts.map(Number);
  return a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19));
}

function isPrivateHostname(hostname: string) {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  const ipv6 = host.includes(':');
  return host === 'localhost' || host === '::1' || host === '0:0:0:0:0:0:0:1'
    || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')
    || (ipv6 && (host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')))
    || isPrivateIpv4(host);
}

export function resolveExternalMenuUrl(value: unknown, slug: string) {
  if (typeof value !== 'string' || !value.trim() || value.length > 2048) return null;
  try {
    const candidate = value.trim().replaceAll('{{slug}}', encodeURIComponent(slug));
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || isPrivateHostname(url.hostname)) return null;
    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

export function parseExternalMenuPayload(payload: unknown): ExternalMenuPayload | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const root = payload as Record<string, unknown>;
  const data = root.data && typeof root.data === 'object' && !Array.isArray(root.data)
    ? root.data as Record<string, unknown>
    : root;
  if (!Array.isArray(data.categories) || data.categories.length === 0 || data.categories.length > 100) return null;
  return data as ExternalMenuPayload;
}

export function externalCategoryItems(payload: ExternalMenuPayload, category: ExternalMenuCategory) {
  const inline = Array.isArray(category.items) ? category.items : Array.isArray(category.products) ? category.products : null;
  if (inline) return inline.filter((item): item is ExternalMenuItem => Boolean(item) && typeof item === 'object' && !Array.isArray(item)).slice(0, 500);
  if (!Array.isArray(payload.products)) return [];
  const categoryId = String(category.id ?? '');
  return payload.products
    .filter((item): item is ExternalMenuItem => Boolean(item) && typeof item === 'object' && !Array.isArray(item) && String((item as ExternalMenuItem).categoryId ?? '') === categoryId)
    .slice(0, 500);
}

export async function inspectExternalMenuSource(value: unknown, slug: string) {
  const url = resolveExternalMenuUrl(value, slug);
  if (!url) throw new Error('INVALID_URL');

  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json' },
    });
  } catch {
    throw new Error('CONNECTION_FAILED');
  }
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  if (!resolveExternalMenuUrl(response.url, slug)) throw new Error('UNSAFE_RESPONSE_URL');

  const declaredLength = Number(response.headers.get('content-length') || 0);
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error('RESPONSE_TOO_LARGE');
  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) throw new Error('RESPONSE_TOO_LARGE');

  let json: unknown;
  try {
    json = JSON.parse(body);
  } catch {
    throw new Error('INVALID_JSON');
  }
  const payload = parseExternalMenuPayload(json);
  if (!payload) throw new Error('INVALID_PAYLOAD');
  const productCount = payload.categories.reduce((total, category) => total + externalCategoryItems(payload, category).length, 0);
  if (productCount === 0) throw new Error('NO_PRODUCTS');
  return { url, payload, categoryCount: payload.categories.length, productCount };
}
