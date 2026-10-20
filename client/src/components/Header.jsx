import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { APP_NAME, PLATFORMS, PLAY_URL, STEPS } from '../data.js';
import { Brand, Chevron, Close, Download, Logo, Menu } from './Icons.jsx';

export default function Header({ onQueue, queueCount }) {
  const [menu, setMenu] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const menuRef = useRef(null);
  const loc = useLocation();

  useEffect(() => { setMenu(false); setDrawer(false); }, [loc.pathname]);
  useEffect(() => {
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('pointerdown', onDoc);
    return () => document.removeEventListener('pointerdown', onDoc);
  }, []);

  const Dot = ({ p }) => <Brand p={p} size={22} radius={6} style={{ boxShadow: 'none' }} />;

  return (
    <>
      <header className="header">
        <div className="wrap">
          <Link to="/" className="brand"><Logo /> {APP_NAME}</Link>
          <div className="steps-inline" aria-hidden="true">
            {STEPS.map((s) => <span key={s.n} className="pill"><span className="num">{s.n}</span>{s.title}</span>)}
          </div>
          <div className="spacer" />
          <nav className="nav" aria-label="Main">
            <div className="menu" ref={menuRef}>
              <button className="pill" onClick={() => setMenu((v) => !v)} aria-expanded={menu} aria-haspopup="menu">
                Downloaders
                <span style={{ display: 'flex', gap: 3 }}>{PLATFORMS.slice(0, 4).map((p) => <Brand key={p.slug} p={p} size={16} radius={4} style={{ boxShadow: 'none' }} />)}</span>
                <Chevron style={{ transform: menu ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
              </button>
              {menu && (
                <div className="menu-pop" role="menu">
                  {PLATFORMS.map((p) => <Link key={p.slug} to={`/${p.slug}`} role="menuitem"><Dot p={p} />{p.name}</Link>)}
                </div>
              )}
            </div>
            <NavLink to="/contact" className="pill">Contact</NavLink>
            <a className="pill gold" href={PLAY_URL} target="_blank" rel="noopener noreferrer">★ Get the app</a>
            <button className="pill icon" onClick={onQueue} aria-label="Download queue" title="Recent downloads" style={{ position: 'relative' }}>
              <Download />
              {queueCount > 0 && <span style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, background: 'var(--mint)', color: '#06251f', fontSize: 11, fontWeight: 800, display: 'grid', placeItems: 'center', padding: '0 5px' }}>{queueCount}</span>}
            </button>
          </nav>
          <button className="burger" onClick={() => setDrawer((v) => !v)} aria-label="Menu" aria-expanded={drawer}>{drawer ? <Close /> : <Menu />}</button>
        </div>
      </header>
      {drawer && (
        <div className="drawer">
          <div className="group">Downloaders</div>
          {PLATFORMS.map((p) => <Link key={p.slug} to={`/${p.slug}`}><Dot p={p} />{p.name}</Link>)}
          <div className="group">More</div>
          <Link to="/contact">Contact</Link>
          <button onClick={() => { setDrawer(false); onQueue(); }}><Download /> Recent downloads{queueCount ? ` (${queueCount})` : ''}</button>
          <a href={PLAY_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--gold)', fontWeight: 600 }}>★ Get the Android app</a>
        </div>
      )}
    </>
  );
}
