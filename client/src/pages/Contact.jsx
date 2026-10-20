import { useState } from 'react';
import { sendContact } from '../api.js';
import { Doodle } from '../components/Art.jsx';
import { Mail, PlayBadge } from '../components/Icons.jsx';
import { APP_NAME, CONTACT_EMAIL, OWNER, PLAY_URL, SEO } from '../data.js';
import useReveal from '../useReveal.js';
import useSeo from '../useSeo.js';

export default function Contact() {
  const [f, setF] = useState({ name: '', email: '', message: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState('');
  useSeo({ ...SEO.contact, path: '/contact', jsonLd: { '@context': 'https://schema.org', '@type': 'ContactPage', name: `Contact ${APP_NAME}`, url: 'https://savely.app/contact', mainEntity: { '@type': 'Person', name: OWNER, email: CONTACT_EMAIL, jobTitle: 'Developer' } } });
  useReveal();

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true);
    try { const r = await sendContact(f); setDone(r); setF({ name: '', email: '', message: '' }); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <section className="page">
      <Doodle kind="orbit" className="doodle-corner" />
      <div className="wrap">
        <div className="contact-grid">
          <div>
            <div className="eyebrow reveal in">Contact</div>
            <h1 className="reveal in" style={{ marginTop: 12 }}>Tell us what's wrong — <span className="gradient-text">or what's great</span></h1>
            <p className="lead reveal in d1">Bug reports, a site that stopped working, feature ideas, or copyright / takedown requests. Messages go straight to <b style={{ color: 'var(--text)' }}>{OWNER}</b>, the developer of {APP_NAME}, at {CONTACT_EMAIL}.</p>
            <div className="info-list">
              <div className="card info reveal d1"><span className="ico"><Mail /></span><span><b>Email us directly</b><span><a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--mint)' }}>{CONTACT_EMAIL}</a></span></span></div>
              <div className="card info reveal d2"><span className="ico">👤</span><span><b>Site owner & developer</b><span>{OWNER} — builder of the {APP_NAME} video downloader website and Android app.</span></span></div>
              <div className="card info reveal d3"><span className="ico">⚖️</span><span><b>Copyright or takedown</b><span>{APP_NAME} does not host any content. Send the link and proof of ownership and we will respond quickly.</span></span></div>
              <div className="card info reveal d4"><span className="ico">📱</span><span><b>Problem in the Android app?</b><span>Include your Android version, the site, and the link you tried — that lets us reproduce it quickly.</span></span></div>
            </div>
            <div style={{ marginTop: 24 }}><PlayBadge href={PLAY_URL} /></div>
          </div>

          {done ? (
            <div className="card glow form reveal in" style={{ textAlign: 'center', padding: 40 }}>
              <div style={{ fontSize: 44 }}>✅</div>
              <h3 style={{ fontSize: 20 }}>Message sent</h3>
              <p style={{ color: 'var(--sub)' }}>{done.emailed ? `Thanks! Your message is on its way to ${CONTACT_EMAIL}.` : 'Thanks! Your message has been saved and we will read it shortly.'}</p>
              <button className="btn ghost" onClick={() => setDone(null)}>Send another</button>
            </div>
          ) : (
            <form className="card glow form reveal in d2" onSubmit={submit} noValidate>
              <div className="field"><label htmlFor="c-name">Your name</label><input id="c-name" value={f.name} onChange={set('name')} required minLength={2} maxLength={100} autoComplete="name" placeholder="Gaurav" /></div>
              <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" type="email" value={f.email} onChange={set('email')} required maxLength={200} autoComplete="email" placeholder="gaurav@example.com" /></div>
              <div className="field"><label htmlFor="c-msg">Message</label><textarea id="c-msg" value={f.message} onChange={set('message')} required minLength={10} maxLength={4000} placeholder="Which site, which link, what happened?" /></div>
              {error && <p className="err">{error}</p>}
              <button className="btn block" disabled={busy}>{busy ? 'Sending…' : 'Send message'}</button>
              <p style={{ color: 'var(--mute)', fontSize: 12, textAlign: 'center' }}>Your message goes to {CONTACT_EMAIL}. We never share your email.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
