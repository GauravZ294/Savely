import { PLATFORMS } from '../data.js';
import { Brand } from './Icons.jsx';

/** Hero illustration: a glowing download orb with the platform badges orbiting it, a dashed orbit and a falling arrow. */
export function HeroArt() {
  const inner = PLATFORMS.slice(0, 4); const outer = PLATFORMS.slice(4);
  return (
    <div className="hero-art" aria-hidden="true">
      <svg viewBox="0 0 420 420" className="orbits">
        <defs>
          <radialGradient id="g-core" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#7ff5d8" /><stop offset=".55" stopColor="#2ee6b6" /><stop offset="1" stopColor="#27d0e0" stopOpacity=".2" /></radialGradient>
          <linearGradient id="g-arrow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#dffcf3" /></linearGradient>
          <filter id="soft"><feGaussianBlur stdDeviation="6" /></filter>
        </defs>
        <circle cx="210" cy="210" r="196" fill="none" stroke="rgba(255,255,255,.08)" strokeDasharray="3 9" className="spin-slow" />
        <circle cx="210" cy="210" r="132" fill="none" stroke="rgba(46,230,182,.22)" strokeDasharray="2 7" className="spin-rev" />
        <circle cx="210" cy="210" r="86" fill="rgba(46,230,182,.18)" filter="url(#soft)" className="breathe" />
        <circle cx="210" cy="210" r="58" fill="url(#g-core)" className="breathe" />
        <g className="arrow-drop"><path d="M202 182h16v26h14l-22 24-22-24h14z" fill="url(#g-arrow)" /><rect x="188" y="238" width="44" height="5" rx="2.5" fill="#fff" opacity=".9" /></g>
      </svg>
      <div className="orbit o1">{inner.map((p, i) => <span key={p.slug} className="sat" style={{ '--a': `${i * 90}deg` }}><span className="up"><Brand p={p} size={46} radius={14} /></span></span>)}</div>
      <div className="orbit o2">{outer.map((p, i) => <span key={p.slug} className="sat" style={{ '--a': `${i * 90 + 45}deg` }}><span className="up"><Brand p={p} size={38} radius={12} /></span></span>)}</div>
      <span className="spark s1" /><span className="spark s2" /><span className="spark s3" /><span className="spark s4" />
    </div>
  );
}

/** Thin decorative line-art placed behind section headings. */
export function Doodle({ kind = 'wave', className = '' }) {
  if (kind === 'wave') return (
    <svg className={`doodle ${className}`} viewBox="0 0 600 60" aria-hidden="true"><path d="M0 30c50-30 100-30 150 0s100 30 150 0 100-30 150 0 100 30 150 0" fill="none" stroke="url(#dw)" strokeWidth="2" className="dash" /><defs><linearGradient id="dw" x1="0" x2="1"><stop offset="0" stopColor="#2ee6b6" stopOpacity="0" /><stop offset=".5" stopColor="#2ee6b6" /><stop offset="1" stopColor="#27d0e0" stopOpacity="0" /></linearGradient></defs></svg>
  );
  return (
    <svg className={`doodle ${className}`} viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="rgba(46,230,182,.35)" strokeWidth="1.5"><circle cx="100" cy="100" r="80" strokeDasharray="4 8" className="spin-slow" /><circle cx="100" cy="100" r="50" strokeDasharray="2 6" className="spin-rev" /><path d="M100 70v40m0 0 14-14m-14 14-14-14" stroke="#2ee6b6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="arrow-drop" /></g></svg>
  );
}

/** Marquee of platform names for the trust strip. */
export function Marquee() {
  const items = [...PLATFORMS, ...PLATFORMS];
  return (
    <div className="marquee" aria-hidden="true">
      <div className="track">{items.map((p, i) => <span key={i}><Brand p={p} size={20} radius={6} />{p.name} video downloader</span>)}</div>
    </div>
  );
}
