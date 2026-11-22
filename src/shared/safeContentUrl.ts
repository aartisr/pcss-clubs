/** Accept web links and same-site destinations from editable page content. */
export function safeContentUrl(value: unknown, allowFragment = false): string | null {
  if (typeof value !== 'string') return null;
  const url = value.trim();
  if (!url || /[\u0000-\u001f\u007f\\]/.test(url)) return null;
  if (allowFragment && /^#[a-zA-Z0-9_-]*$/.test(url)) return url;
  if (url.startsWith('/') && !url.startsWith('//')) return url;
  try {
    const parsed = new URL(url);
    if ((parsed.protocol === 'https:' || parsed.protocol === 'http:') && !parsed.username && !parsed.password) return parsed.href;
  } catch { /* Invalid or relative URL. */ }
  return null;
}
