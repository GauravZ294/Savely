export const Logo = (p) => (
  <svg viewBox="0 0 108 108" aria-hidden="true" {...p}>
    <rect width="108" height="108" rx="24" fill="#111" />
    <circle cx="54" cy="52" r="30" fill="#FF6B00" />
    <circle cx="54" cy="52" r="25" fill="#111" />
    <path fill="#FF6B00" d="M50 36h8v16h10L54 66 40 52h10z" />
    <path fill="#FF8C1A" d="M40 70h28a2 2 0 0 1 0 4H40a2 2 0 0 1 0-4z" />
  </svg>
);

export const Search = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
);
export const Close = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const Chevron = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 9 6 6 6-6" /></svg>
);
export const Download = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" /></svg>
);
export const Menu = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const Play = (p) => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor" {...p}><path d="M8 5v14l11-7z" /></svg>
);
export const Mail = (p) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);

/**
 * Platform tile: brand colour + the platform's official mark loaded from the Simple Icons CDN (white),
 * falling back to the letter badge if the image can't load. Self-host the SVGs in /public/brands later if you prefer.
 */
export const Brand = ({ p, size = 44, radius = 13, className = '', style }) => (
  <span className={`brand-tile ${className}`} style={{ width: size, height: size, borderRadius: radius, background: p.color, fontSize: size * .36, ...style }} aria-label={p.name}>
    <img src={`https://cdn.simpleicons.org/${p.icon || p.slug}/ffffff`} alt="" width={size * .55} height={size * .55} loading="lazy" decoding="async"
      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }} />
    <i style={{ display: 'none' }}>{p.short}</i>
  </span>
);

/** Google Play button (text version, so no external image is needed). */
export const PlayBadge = ({ href }) => (
  <a className="play-badge" href={href} target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play">
    <svg viewBox="0 0 24 26" aria-hidden="true">
      <path fill="#00D7FE" d="M1 1.6c-.4.4-.6 1-.6 1.8v19.2c0 .8.2 1.4.6 1.8l.1.1L12 13.6v-.3L1.1 1.5 1 1.6z" />
      <path fill="#FFCE00" d="M15.6 17.2 12 13.6v-.3l3.6-3.6.1.1 4.3 2.4c1.2.7 1.2 1.8 0 2.5l-4.3 2.4-.1.1z" />
      <path fill="#FF3A44" d="M15.7 17.1 12 13.4 1 24.4c.4.4 1.1.5 1.8.1l12.9-7.4" />
      <path fill="#00F076" d="M15.7 9.8 2.8 2.5C2.1 2.1 1.4 2.1 1 2.6l11 10.9 3.7-3.7z" />
    </svg>
    <span><small>Get it on</small><b>Google Play</b></span>
  </a>
);
