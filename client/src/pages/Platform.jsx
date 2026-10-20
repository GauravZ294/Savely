import { useMemo } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import Analyzer from '../components/Analyzer.jsx';
import { Doodle } from '../components/Art.jsx';
import { Brand } from '../components/Icons.jsx';
import { AppBanner, Faq, Platforms, Steps } from '../components/Sections.jsx';
import { APP_NAME, PLATFORMS, SEO } from '../data.js';
import useReveal from '../useReveal.js';
import useSeo from '../useSeo.js';

export default function Platform() {
  const { slug } = useParams();
  const p = PLATFORMS.find((x) => x.slug === slug);
  const faq = useMemo(() => p ? [
    { q: `How do I download a ${p.name} video online for free?`, a: `Open the video in the ${p.name} app or website, tap Share → Copy link, paste it in the Savely box above and tap Analyze. Pick 1080p, 720p, 480p or MP3 and tap Download — free, no sign-up.` },
    { q: `Does the ${p.name} downloader work on iPhone, Android and PC?`, a: `Yes. Savely runs in any browser — Chrome, Safari, Edge, Firefox — on iPhone, Android, Windows and Mac. Android users can also install the free Savely app for one-tap downloads while browsing.` },
    { q: `Can I download private ${p.name} videos?`, a: `No — the website can only read public videos. For private or login-only videos use the ${APP_NAME} Android app: log in to ${p.name} inside the app's browser, open the video and tap Download.` },
    { q: 'Is there a watermark?', a: `${APP_NAME} never adds a watermark. If the original video already carries one (for example TikTok's), it stays as the source provides it.` },
    { q: 'Can I save just the audio as MP3?', a: 'Yes — choose "Audio only" in the quality list to convert the video to MP3.' },
  ] : [], [p]);
  const jsonLd = useMemo(() => p ? ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) }) : null, [p, faq]);
  useSeo(p ? { ...SEO.platform(p), path: `/${p.slug}`, jsonLd } : { title: APP_NAME, description: '' });
  useReveal([slug]);
  if (!p) return <Navigate to="/404" replace />;
  return (
    <>
      <section className="hero plat-hero">
        <Doodle kind="orbit" className="doodle-corner" />
        <div className="wrap">
          <div className="reveal in" style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}><Brand p={p} size={72} radius={22} className="badge-float" /></div>
          <div className="chips reveal in"><span className="chip caps">{p.name} downloader</span><span className="chip">MP4</span><span className="chip">MP3</span><span className="chip grey">Free</span></div>
          <h1 className="reveal in">Download <em>{p.name}</em> videos online</h1>
          <p className="lead reveal in d1">{p.blurb} Free {p.name} video downloader for Android, iPhone and PC — HD MP4 up to 1080p or MP3, no watermark added.</p>
          <Analyzer placeholder={`Paste a ${p.name} link, e.g. ${p.example}`} />
        </div>
      </section>
      <Steps />
      <AppBanner />
      <Faq items={faq} title={`${p.name} video downloader FAQ`} />
      <Platforms title="Other downloaders" except={p.slug} />
    </>
  );
}
