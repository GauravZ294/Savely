async function req(path, opts) {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts });
  let data = null;
  try { data = await r.json(); } catch { /* non-JSON error page */ }
  if (!r.ok) throw new Error(data?.error || `Request failed (${r.status})`);
  return data;
}

export const analyze = (url, signal) => req('/api/analyze', { method: 'POST', body: JSON.stringify({ url }), signal });

export function isYouTubeLink(raw) {
  try {
    const h = new URL(raw).hostname.toLowerCase().replace(/\.$/, '');
    return ['youtube.com', 'youtu.be', 'youtube-nocookie.com'].some((domain) => h === domain || h.endsWith(`.${domain}`));
  } catch { return false; }
}

export async function prepareYouTubeDownload(url, id, signal) {
  const { token } = await req('/api/youtube/downloads', { method: 'POST', body: JSON.stringify({ url, id }), signal });
  while (!signal.aborted) {
    const status = await req(`/api/youtube/downloads/${token}`, { signal });
    if (status.state === 'ready') return status.download;
    await new Promise((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(new DOMException('Cancelled', 'AbortError')); };
      const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, 1500);
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) abort();
    });
  }
  throw new DOMException('Cancelled', 'AbortError');
}
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
