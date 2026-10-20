import { useEffect, useRef, useState } from 'react';
import { analyze, downloadUrl, pushQueue } from '../api.js';
import { PLAY_URL, STEPS, fmtDur, fmtSize } from '../data.js';
import { Close, Download, Play, Search } from './Icons.jsx';

export default function Analyzer({ placeholder = 'Paste a video link (YouTube, Facebook, Instagram, TikTok, X, Vimeo, Dailymotion, Reddit)…', initial = '' }) {
  const [url, setUrl] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [res, setRes] = useState(null);
  const [sel, setSel] = useState(0);
  const [started, setStarted] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { setUrl(initial); setRes(null); setError(''); }, [initial]);

  const step = res ? (started ? 3 : 2) : 1;

  async function go(e) {
    e?.preventDefault();
    const u = url.trim();
    if (!u) { inputRef.current?.focus(); return; }
    setError(''); setRes(null); setStarted(false);
    try { new URL(u.startsWith('http') ? u : `https://${u}`); } catch { setError('Enter a valid link starting with http:// or https://'); return; }
    setBusy(true);
    try {
      const r = await analyze(u.startsWith('http') ? u : `https://${u}`);
      setRes(r); setSel(0);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function paste() {
    try { const t = await navigator.clipboard.readText(); if (t) setUrl(t.trim()); } catch { inputRef.current?.focus(); }
  }

  function download() {
    const o = res.options[sel];
    const href = downloadUrl(res.url, o.id, res.title);
    pushQueue({ title: res.title, quality: `${o.label} · ${o.ext.toUpperCase()}`, size: o.size, href, thumb: res.thumbnail, host: res.host });
    setStarted(true);
    window.location.assign(href);
  }

  return (
    <div className="analyzer">
      <form className="search" onSubmit={go} role="search">
        <Search />
        <input ref={inputRef} value={url} onChange={(e) => setUrl(e.target.value)} placeholder={placeholder} inputMode="url" autoComplete="off" spellCheck={false} aria-label="Video link" />
        {url ? (
          <button type="button" className="clear" onClick={() => { setUrl(''); setRes(null); setError(''); inputRef.current?.focus(); }} aria-label="Clear"><Close /></button>
        ) : (
          <button type="button" className="pill" style={{ height: 36 }} onClick={paste}>Paste</button>
        )}
        <button type="submit" className="btn" disabled={busy}>{busy ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <Search style={{ width: 18, height: 18, color: 'inherit' }} />}<span>{busy ? 'Analyzing' : 'Analyze'}</span></button>
      </form>
      <div className="steps-mini" aria-label={`Step ${step} of 3`}>
        {STEPS.map((s, i) => {
          const n = i + 1;
          const cls = n === step ? 'st on' : n < step ? 'st done' : 'st';
          return (
            <span key={s.n} style={{ display: 'contents' }}>
              {i > 0 && <span className={`sep${n <= step ? ' on' : ''}`} />}
              <span className={cls}><span className="num">{n < step ? '✓' : n}</span>{s.title}</span>
            </span>
          );
        })}
      </div>

      {error && <p className="err" style={{ marginTop: 18 }}>{error}</p>}

      {busy && (
        <div className="loading"><span className="spinner" /><b>Checking video qualities…</b><span style={{ fontSize: 13 }}>This usually takes a few seconds.</span></div>
      )}

      {!busy && !res && !error && (
        <div className="empty">
          No video yet. Paste a link above and tap Analyze.
          <Search />
        </div>
      )}

      {res && (
        <div className="card glow result">
          <div className="thumb">
            {res.thumbnail ? <img src={res.thumbnail} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <Play />}
            {res.duration ? <span className="dur">{fmtDur(res.duration)}</span> : null}
          </div>
          <div>
            <h3>{res.title}</h3>
            <p className="meta">{[res.uploader, res.host].filter(Boolean).join(' · ')}</p>
            <div className="qualities" role="radiogroup" aria-label="Quality">
              {res.options.map((o, i) => (
                <button type="button" key={o.id} className={`q${i === sel ? ' on' : ''}`} role="radio" aria-checked={i === sel} onClick={() => setSel(i)}>
                  <span className="radio" />
                  <b>{o.label}</b>
                  <span style={{ color: 'var(--sub)', fontSize: 13 }}>{o.ext.toUpperCase()}</span>
                  {i === 0 && o.id !== 'audio' && <span className="best">BEST</span>}
                  <span className="size">{o.size ? fmtSize(o.size) : ''}</span>
                </button>
              ))}
            </div>
            <div className="actions">
              <button className="btn" onClick={download}><Download /> Download {res.options[sel]?.label}</button>
              <button className="btn ghost" onClick={() => { setRes(null); setUrl(''); inputRef.current?.focus(); }}>Another link</button>
            </div>
            {started && <p className="ok" style={{ marginTop: 10 }}>Preparing your file… the download starts automatically in a moment. Large videos can take a minute.</p>}
            <p className="note">Need to download from inside the app you are browsing, or a login-only video? <a href={PLAY_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--mint)' }}>Get the Android app</a>.</p>
          </div>
        </div>
      )}
    </div>
  );
}
