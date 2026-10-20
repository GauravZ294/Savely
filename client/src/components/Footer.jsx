import { Link } from 'react-router-dom';
import { APP_NAME, CONTACT_EMAIL, OWNER, PLATFORMS, PLAY_URL, STEPS } from '../data.js';
import { Logo } from './Icons.jsx';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="cols">
          <div>
            <Link to="/" className="brand" style={{ color: 'var(--text)' }}><Logo /> {APP_NAME}</Link>
            <p style={{ marginTop: 12 }}>Free online video downloader: paste a link, pick HD MP4 or MP3, download. Works for Facebook, Instagram Reels, TikTok, X, Vimeo, Dailymotion and Reddit on Android, iPhone and PC — plus an Android app with a built-in video-detecting browser.</p>
            <p style={{ marginTop: 10, fontSize: 13 }}>Built and maintained by <b style={{ color: 'var(--text)' }}>{OWNER}</b>.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
              {STEPS.map((s) => <span key={s.n} className="chip grey"><span className="num" style={{ width: 18, height: 18, fontSize: 9 }}>{s.n}</span>{s.title}</span>)}
            </div>
          </div>
          <div>
            <h4>Downloaders</h4>
            <div className="links">{PLATFORMS.map((p) => <Link key={p.slug} to={`/${p.slug}`}>{p.name} video downloader</Link>)}</div>
          </div>
          <div>
            <h4>Savely</h4>
            <div className="links">
              <a href={PLAY_URL} target="_blank" rel="noopener noreferrer">Android app on Google Play</a>
              <Link to="/contact">Contact</Link>
              <Link to="/privacy">Privacy policy</Link>
              <Link to="/terms">Terms of use</Link>
            </div>
            <h4 style={{ marginTop: 22 }}>Disclaimer</h4>
            <p style={{ fontSize: 13 }}>{APP_NAME} does not host or store any video. Only download content you own or have permission to save.</p>
            <p style={{ fontSize: 13, marginTop: 8 }}>Copyright or takedown requests: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--mint)' }}>{CONTACT_EMAIL}</a></p>
          </div>
        </div>
        <div className="bottom">
          <span>© {new Date().getFullYear()} {APP_NAME} · {OWNER}. All rights reserved.</span>
          <span>Not affiliated with YouTube, Facebook, Instagram, TikTok, X, Vimeo, Dailymotion or Reddit.</span>
        </div>
      </div>
    </footer>
  );
}
