async function req(path, opts) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  let data = null;
  try { data = await r.json(); } catch { /* non-JSON error page */ }
  if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
  return data;
}

export const analyze = (url) => req('/api/analyze', { method: 'POST', body: JSON.stringify({ url }) });
export const sendContact = (body) => req('/api/contact', { method: 'POST', body: JSON.stringify(body) });
export const stats = () => req('/api/stats').catch(() => ({ downloads: 0 }));
export const downloadUrl = (url, id, title) => `/api/download?${new URLSearchParams({ url, id, title })}`;

// ---------------------------------------------------------------- recent downloads (this browser only)
const KEY = 'savely.queue';
export function getQueue() { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } }
export function pushQueue(item) {
  const list = [{ ...item, time: Date.now() }, ...getQueue().filter((x) => x.href !== item.href)].slice(0, 20);
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* private mode */ }
  window.dispatchEvent(new Event('savely-queue'));
  return list;
}
export function clearQueue() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } window.dispatchEvent(new Event('savely-queue')); }
