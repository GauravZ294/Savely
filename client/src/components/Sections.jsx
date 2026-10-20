import { Link } from 'react-router-dom';
import { APP_NAME, FAQ, PLATFORMS, PLAY_URL, STEPS } from '../data.js';
import { Brand, Chevron, PlayBadge } from './Icons.jsx';

const Head = ({ eyebrow, title, sub, right }) => (
  <div className="section-head reveal">
    <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h2>{title}</h2>{sub && <p className="sub">{sub}</p>}</div>
    {right}
  </div>
);

export function Steps() {
  return (
    <section className="section" id="how">
      <div className="wrap">
        <Head eyebrow="How it works" title="Three steps. No sign-up." sub="The same flow as the Android app — on any device with a browser." />
        <div className="grid-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className={`card hover step-card reveal d${i + 1}`}>
              <span className="big">{s.n}</span>
              <span className="num">{s.n}</span><h3>{s.title}</h3><p>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Platforms({ title = 'Download from YouTube, Instagram, Facebook & more', except }) {
  return (
    <section className="section" id="platforms">
      <div className="wrap">
        <Head eyebrow="Supported platforms" title={title} sub="Pick a platform for tips and examples, or just paste any supported link above."
          right={<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="chip">HD MP4</span><span className="chip">MP3</span><span className="chip">Free</span><span className="chip grey">8 platforms</span></div>} />
        <div className="grid-4">
          {PLATFORMS.filter((p) => p.slug !== except).map((p, i) => (
            <Link key={p.slug} to={`/${p.slug}`} className={`card hover plat reveal d${(i % 4) + 1}`}>
              <Brand p={p} size={46} radius={13} />
              <span><b>{p.name}</b><span>{p.tagline}</span></span>
              <Chevron className="go" style={{ transform: 'rotate(-90deg)' }} />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="phone" aria-hidden="true">
      <div className="screen">
        <div className="notch" />
        <div className="ph-bar"><i />instagram.com/reel/…</div>
        <div className="ph-video" />
        <div className="ph-fab">⬇ Download</div>
        <div className="ph-sheet">
          <b>Choose quality</b>
          <div className="ph-row on"><i />1080p<span>48.2 MB</span></div>
          <div className="ph-row"><i />720p<span>24.1 MB</span></div>
          <div className="ph-row"><i />480p<span>12.6 MB</span></div>
          <div className="ph-btn">Download</div>
        </div>
      </div>
    </div>
  );
}

export function AppBanner() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="card glow app-banner reveal">
          <div>
            <span className="chip caps"><span className="live" />Android app · Free</span>
            <h2>Download any video with one tap — <em>{APP_NAME} for Android</em></h2>
            <p>No more copying links. The {APP_NAME} app has a built-in browser that detects the video you are watching on Facebook, Instagram, TikTok, X and most other sites, shows a preview with every quality and size, and saves it to your Gallery. Wi-Fi-only downloads, dark theme, in-app player.</p>
            <div className="chips"><span className="chip grey">Built-in video browser</span><span className="chip grey">Works on 100+ sites</span><span className="chip grey">Login-only videos</span><span className="chip grey">Android 7+</span></div>
            <div className="cta"><PlayBadge href={PLAY_URL} /><small>No account needed · No ads · Free</small></div>
          </div>
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}

export function Stats({ downloads = 0 }) {
  const items = [
    [downloads > 0 ? downloads.toLocaleString() : '7', downloads > 0 ? 'videos saved on this site' : 'platforms supported'],
    ['1080p', 'max quality, when the source has it'],
    ['0', 'watermarks added, ever'],
    ['100+', 'sites in the Android app'],
  ];
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="stats">{items.map(([b, s], i) => <div key={s} className={`card stat reveal d${i + 1}`}><b>{b}</b><span>{s}</span></div>)}</div>
      </div>
    </section>
  );
}

export function Features() {
  const items = [
    ['🔍', 'Built around the link', 'Paste a link, or on Android just browse — the app detects the video for you.'],
    ['📐', 'Sizes before you download', 'Every quality shows its file size so you can choose between speed and sharpness.'],
    ['🎧', 'Video or audio', 'Save as MP4, or take only the sound as MP3.'],
    ['🛡️', 'No watermark, no login', 'We never add branding. Private videos need the app, where you log in to the site yourself.'],
  ];
  return (
    <section className="section">
      <div className="wrap">
        <Head eyebrow="Why Savely" title="HD MP4 downloads, your choice of quality" sub={`${APP_NAME} focuses on practical MP4 downloads in 480p, 720p and 1080p, plus MP3 — whatever the source provides.`} />
        <div className="grid-4">{items.map(([i, t, d], k) => <div key={t} className={`card hover feat reveal d${k + 1}`}><span className="ico">{i}</span><h3>{t}</h3><p>{d}</p></div>)}</div>
        <div className="qual-row">
          <div className="card qual reveal d1"><b>480p</b><span>Compact · small files</span></div>
          <div className="card qual on reveal d2"><b>720p</b><span>Balanced · most popular</span></div>
          <div className="card qual reveal d3"><b>1080p</b><span>Sharp · when the source has it</span></div>
        </div>
      </div>
    </section>
  );
}

export function Faq({ items = FAQ, title = 'Frequently asked questions' }) {
  return (
    <section className="section" id="faq">
      <div className="wrap">
        <Head eyebrow="FAQ" title={title} />
        <div className="faq">
          {items.map((f, i) => (
            <details key={f.q} className={`reveal d${(i % 4) + 1}`}>
              <summary><span className="q-ico">Q</span>{f.q}<Chevron className="chev" /></summary>
              <div className="a">{f.a}</div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
