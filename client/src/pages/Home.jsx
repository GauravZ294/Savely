import { useEffect, useMemo, useState } from 'react';
import Analyzer from '../components/Analyzer.jsx';
import { HeroArt, Marquee } from '../components/Art.jsx';
import { AppBanner, Faq, Features, Platforms, Stats, Steps } from '../components/Sections.jsx';
import { stats } from '../api.js';
import { APP_NAME, FAQ, PLAY_URL, SEO } from '../data.js';
import useReveal from '../useReveal.js';
import useSeo from '../useSeo.js';

export default function Home() {
  const [n, setN] = useState(0);
  useEffect(() => { stats().then((s) => setN(s.downloads || 0)); }, []);
  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'FAQPage', mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) },
      { '@type': 'HowTo', name: 'How to download a video online with Savely', totalTime: 'PT1M',
        step: [
          { '@type': 'HowToStep', name: 'Paste the link', text: 'Copy the video link from YouTube, Facebook, Instagram, TikTok, X, Vimeo, Dailymotion or Reddit and paste it into Savely.' },
          { '@type': 'HowToStep', name: 'Pick a quality', text: 'Choose 1080p, 720p, 480p MP4 or Audio-only MP3. Each option shows its file size.' },
          { '@type': 'HowToStep', name: 'Download', text: 'Tap Download and the file is saved to your device. No watermark, no login.' },
        ] },
    ],
  }), []);
  useSeo({ ...SEO.home, path: '/', jsonLd });
  useReveal([n]);
  return (
    <>
      <section className="hero hero-split">
        <div className="wrap">
          <div className="hero-copy">
            <div className="chips reveal in"><span className="chip caps"><span className="live" />{APP_NAME} · 2026</span><span className="chip">HD MP4</span><span className="chip">MP3</span><span className="chip grey">Free</span></div>
            <h1 className="reveal in">Free Online <em>Video Downloader</em><br />for every social app</h1>
            <p className="lead reveal in d1">Paste a YouTube, Facebook, Instagram Reels, TikTok, X (Twitter), Vimeo, Dailymotion or Reddit link, pick 1080p / 720p / 480p or MP3, and download in seconds — no watermark, no login, no software to install.</p>
            <div className="trust reveal in d2"><span>No sign-up</span><span>No watermark</span><span>1080p when available</span><span>Audio-only MP3</span><span>Works on Android, iPhone & PC</span></div>
          </div>
          <HeroArt />
        </div>
        <div className="wrap"><Analyzer /></div>
        <Marquee />
      </section>
      <Stats downloads={n} />
      <Platforms />
      <AppBanner />
      <Steps />
      <Features />
      <Faq />
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="card glow cta-final reveal">
            <h2>Ready to save your first video?</h2>
            <p>Paste a link above, or install the free <strong>{APP_NAME} video downloader app for Android</strong> and download straight from the page you are watching.</p>
            <a className="btn" href={PLAY_URL} target="_blank" rel="noopener noreferrer">Get {APP_NAME} on Google Play</a>
          </div>
        </div>
      </section>
    </>
  );
}
