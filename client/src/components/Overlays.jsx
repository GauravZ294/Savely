import { useEffect, useState } from 'react';
import { clearQueue, getQueue } from '../api.js';
import { WHATS_NEW, fmtSize } from '../data.js';
import { Chevron, Close, Download } from './Icons.jsx';

const SEEN = 'savely.whatsnew.v1';

/** "What's new" card shown once per browser. */
export function WhatsNew() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { if (!localStorage.getItem(SEEN)) setOpen(true); } catch { /* ignore */ }
  }, []);
  const close = () => { setOpen(false); try { localStorage.setItem(SEEN, '1'); } catch { /* ignore */ } };
  if (!open) return null;
  return (
    <div className="overlay" onClick={close} role="dialog" aria-modal="true" aria-labelledby="wn-title">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={close} aria-label="Close"><Close /></button>
        <span className="chip caps">● What's new</span>
        <h3 id="wn-title">Download videos<br /><em>without copying links</em></h3>
        <p>The Savely Android app detects the video on the page you are watching and saves it in one tap — plus Wi-Fi-only downloads and a built-in player.</p>
        <div className="wn-list">
          {WHATS_NEW.map((w) => {
            const inner = (<><span className="ico">{w.icon}</span><span><b>{w.title}</b><span>{w.sub}</span></span>{w.href && <Chevron className="arrow" style={{ transform: 'rotate(-90deg)' }} />}</>);
            return w.href
              ? <a key={w.title} className={`wn${w.highlight ? ' hi' : ''}`} href={w.href} target="_blank" rel="noopener noreferrer">{inner}</a>
              : <div key={w.title} className={`wn${w.highlight ? ' hi' : ''}`}>{inner}</div>;
          })}
        </div>
        <button className="btn ghost block" style={{ marginTop: 16 }} onClick={close}>Got it</button>
      </div>
    </div>
  );
}

/** Docked "recent downloads" panel (this browser only). */
export function Queue({ open, onClose }) {
  const [items, setItems] = useState(getQueue());
  useEffect(() => {
    const sync = () => setItems(getQueue());
    window.addEventListener('savely-queue', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('savely-queue', sync); window.removeEventListener('storage', sync); };
  }, []);
  if (!open) return null;
  return (
    <aside className="queue" aria-label="Recent downloads">
      <header>
        <Download /> Recent downloads
        <span className="sp" />
        {items.length > 0 && <button onClick={clearQueue} title="Clear" style={{ width: 'auto', padding: '0 8px', fontSize: 12 }}>Clear</button>}
        <button onClick={onClose} aria-label="Close"><Close /></button>
      </header>
      <div className="list" data-lenis-prevent>
        {items.length === 0 ? (
          <div className="none"><Download /> No downloads yet</div>
        ) : items.map((it) => (
          <div className="item" key={it.href}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <b>{it.title}</b>
              <span>{it.quality}{it.size ? ` · ${fmtSize(it.size)}` : ''} · {new Date(it.time).toLocaleString()}</span>
            </div>
            <a href={it.href}>Again</a>
          </div>
        ))}
      </div>
    </aside>
  );
}
