import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { APP_NAME, CONTACT_EMAIL, OWNER, SEO } from '../data.js';
import useSeo from '../useSeo.js';

const Page = ({ title, seo, path, children }) => {
  useSeo({ ...seo, path });
  return (
    <section className="page"><div className="wrap">
      <div className="eyebrow">Legal</div>
      <h1 style={{ marginTop: 12 }}>{title}</h1>
      <p className="lead">Effective October 2026 · {APP_NAME} website and Android app · Operated by {OWNER}</p>
      <div className="prose">{children}</div>
    </div></section>
  );
};

export function Privacy() {
  return (
    <Page title="Privacy policy" seo={SEO.privacy} path="/privacy">
      <h2>What the website collects</h2>
      <p>When you analyze or download a video, the link you paste is sent to our server so it can read the video's qualities and fetch the file for you. We keep a download history (site name, video title, quality and time) to count usage. YouTube links and preparation details are held temporarily while your file is prepared. Prepared YouTube files expire after about 15 minutes; an active transfer can finish before its file is deleted. Other download files are deleted after being sent.</p>
      <p>YouTube thumbnails load from YouTube, and playing the optional embedded preview connects your browser to YouTube. YouTube's privacy policy applies to those requests.</p>
      <p>The contact form stores the name, email and message you send so we can reply, and forwards them to {CONTACT_EMAIL}. Your "recent downloads" list lives only in your browser's local storage.</p>
      <h2>What the Android app collects</h2>
      <p>The app runs entirely on your phone. Videos are resolved and downloaded by your device, using the cookies of the sites you log in to inside the app's browser; those cookies never leave your phone. The app uses Firebase Analytics for anonymous usage events (screens opened, buttons tapped, sites opened, download started) to improve the app. No account, no personal data, no ads.</p>
      <h2>Cookies</h2>
      <p>The website sets no tracking cookies.</p>
      <h2>Children</h2>
      <p>{APP_NAME} is not directed at children under 13.</p>
      <h2>Contact</h2>
      <p>Questions or deletion requests: <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--mint)' }}>{CONTACT_EMAIL}</a>. See also our <Link to="/terms" style={{ color: 'var(--mint)' }}>Terms of use</Link>.</p>
    </Page>
  );
}

export function Terms() {
  return (
    <Page title="Terms of use" seo={SEO.terms} path="/terms">
      <h2>1. What {APP_NAME} does</h2>
      <p>{APP_NAME} lets you save video files that a website makes publicly available. Some videos cannot be downloaded, including DRM-protected content, live streams, playlists, age-restricted and private content. Downloading from YouTube is available on the website only, not in the Android app; you are responsible for complying with each platform's terms. Websites change often, so we cannot guarantee that any particular video can be downloaded.</p>
      <h2>2. Your responsibility — copyright</h2>
      <p>You may only download content that you own, that is in the public domain, that is licensed for downloading, or that you have the copyright owner's permission to save. Downloading, re-uploading, sharing or using content without permission may infringe copyright and violate the website's terms. You are solely responsible for how you use {APP_NAME} and the content you download. We do not host, store, index or provide any content.</p>
      <h2>3. Prohibited use</h2>
      <p>You must not use {APP_NAME} to infringe intellectual property rights, circumvent technical protection measures, break any law, or violate the terms of any website or of your social media account. Automated or bulk use of the website is not allowed.</p>
      <h2>4. No affiliation</h2>
      <p>{APP_NAME} is independent and is not affiliated with, endorsed by or sponsored by Facebook, Instagram, TikTok, X, Vimeo, Dailymotion, Reddit or any other platform. All trademarks belong to their owners.</p>
      <h2>5. Disclaimer and liability</h2>
      <p>{APP_NAME} is provided "as is" and "as available", without warranties of any kind. To the maximum extent permitted by law, we are not liable for any indirect, incidental or consequential damages, or for any claim arising from content you download or how you use it.</p>
      <h2>6. Takedown requests</h2>
      <p>Rights holders can write to <a href={`mailto:${CONTACT_EMAIL}`} style={{ color: 'var(--mint)' }}>{CONTACT_EMAIL}</a>; we act on valid requests promptly.</p>
      <h2>7. Changes</h2>
      <p>We may change {APP_NAME} or these Terms. Continued use after changes means you accept them.</p>
    </Page>
  );
}

export function NotFound() {
  useEffect(() => { document.title = `Page not found – ${APP_NAME}`; }, []);
  return (
    <section className="page" style={{ textAlign: 'center' }}><div className="wrap">
      <div style={{ fontSize: 56 }}>🔍</div>
      <h1>Page not found</h1>
      <p className="lead" style={{ margin: '10px auto 24px' }}>That page doesn't exist. Paste your video link on the home page instead.</p>
      <Link to="/" className="btn">Go home</Link>
    </div></section>
  );
}
