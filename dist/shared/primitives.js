export const uid = () => {
  if (globalThis.crypto?.randomUUID) return crypto.randomUUID();
  // getRandomValues is available on HTTP development origins as well as HTTPS.
  const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};
export const clone = (value) => structuredClone(value);
export const clamp = (n, min = 0, max = 100) => Math.min(max, Math.max(min, n));
/** User text is always inserted as text or escaped HTML, never interpreted as markup. */
export function escapeHTML(value = '') { return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
