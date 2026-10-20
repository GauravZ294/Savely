export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.savely.videodownloader';
export const CONTACT_EMAIL = 'allinoneapps12@gmail.com';
export const APP_NAME = 'Savely';
export const OWNER = 'Gaurav Zalavadiya';
/** Change to your real domain before deploying (used for canonical URLs, sitemap and JSON-LD). */
export const SITE_URL = 'https://savely.app';

export const SEO = {
  home: {
    title: 'Savely – Free Online Video Downloader | YouTube, Facebook, Instagram Reels, TikTok & X to HD MP4 / MP3 (2026)',
    description: 'Savely is a free online video downloader: paste a YouTube, Facebook, Instagram Reels, TikTok, Twitter/X, Vimeo, Dailymotion or Reddit link and download HD MP4 (1080p, 720p, 480p) or convert to MP3 — no watermark, no login, no app install. Fast, secure and mobile-friendly, plus a free Android app with a built-in video-detecting browser.',
  },
  platform: (p) => ({
    title: `${p.name} Video Downloader – Download ${p.name} Videos in HD MP4 & MP3 Free | Savely`,
    description: `Free ${p.name} video downloader online. Paste a ${p.name} link to download ${p.tagline.toLowerCase()} as HD MP4 (1080p/720p/480p) or MP3 — no watermark, no login, works on Android, iPhone and PC. Fast, safe and unlimited with Savely.`,
  }),
  contact: {
    title: 'Contact Savely – Support, Feedback & Copyright Requests | Gaurav Zalavadiya',
    description: 'Contact the Savely video downloader team for support, bug reports, feature requests or DMCA / copyright takedown. Replies from the developer, Gaurav Zalavadiya.',
  },
  privacy: { title: 'Privacy Policy – Savely Video Downloader', description: 'How the Savely website and Android app handle your data: no accounts, no tracking cookies, files deleted after download.' },
  terms: { title: 'Terms of Use – Savely Video Downloader', description: 'Terms for using the Savely online video downloader and Android app: permitted use, copyright, supported platforms, disclaimers.' },
};

export const PLATFORMS = [
  { slug: 'youtube', name: 'YouTube', short: '▶', color: '#FF0000', example: 'https://www.youtube.com/watch?v=…',
    tagline: 'Videos & Shorts · up to 1080p', blurb: 'Paste a YouTube video or Shorts link and download it as MP4 in 1080p, 720p, 480p or 360p — or just the audio as MP3.' },
  { slug: 'facebook', name: 'Facebook', short: 'f', color: '#1877F2', example: 'https://www.facebook.com/watch/?v=…',
    tagline: 'Reels, Watch videos & posts', blurb: 'Paste a public Facebook video, Reel or Watch link and download it as MP4 in the best quality the source offers.' },
  { slug: 'instagram', name: 'Instagram', short: 'IG', color: '#E1306C', example: 'https://www.instagram.com/reel/…',
    tagline: 'Reels, posts & IGTV', blurb: 'Paste a public Instagram Reel or post link and save the video as MP4 — or just the audio as MP3.' },
  { slug: 'tiktok', name: 'TikTok', short: '♪', color: '#111111', example: 'https://www.tiktok.com/@user/video/…',
    tagline: 'Videos without the app', blurb: 'Paste a TikTok video link (tiktok.com or vm.tiktok.com) and download it as MP4.' },
  { slug: 'x', name: 'X (Twitter)', short: 'X', color: '#000000', example: 'https://x.com/user/status/…',
    tagline: 'Videos & GIFs from posts', blurb: 'Paste a link to an X / Twitter post that contains a video and pick the quality you want.' },
  { slug: 'vimeo', name: 'Vimeo', short: 'V', color: '#1AB7EA', example: 'https://vimeo.com/123456789',
    tagline: 'HD videos', blurb: 'Paste a public Vimeo link and download the video as MP4 in up to 1080p when the creator allows it.' },
  { slug: 'dailymotion', name: 'Dailymotion', short: 'd', color: '#0066DC', example: 'https://www.dailymotion.com/video/…',
    tagline: 'Videos in every quality', blurb: 'Paste a Dailymotion video link and choose from the available qualities.' },
  { slug: 'reddit', name: 'Reddit', short: 'r', color: '#FF4500', example: 'https://www.reddit.com/r/…/comments/…',
    tagline: 'v.redd.it with sound', blurb: 'Paste a Reddit post link; video and audio are merged into one MP4 file.' },
];

export const STEPS = [
  { n: '01', title: 'Paste link', desc: 'Copy the video link from the app or site and paste it above.' },
  { n: '02', title: 'Pick quality', desc: '1080p, 720p, 480p… every option shows its file size.' },
  { n: '03', title: 'Download', desc: 'The MP4 (or MP3) is saved to your device. No login, no watermark added.' },
];

export const FAQ = [
  { q: 'What is the best free online video downloader in 2026?', a: 'Savely is a fast, free online video downloader that works in any browser: paste a Facebook, Instagram, TikTok, X, Vimeo, Dailymotion or Reddit link and save HD MP4 or MP3 with no watermark and no sign-up. For one-tap downloads while you browse, the Savely Android app is free on Google Play.' },
  { q: 'How does Savely work?', a: 'Paste a public video link, tap Analyze, pick a quality and download. On Android, the Savely app goes further: it has a built-in browser that detects the video on any page you are watching — no copying links at all.' },
  { q: 'Which sites are supported?', a: 'YouTube, Facebook, Instagram, TikTok, X (Twitter), Vimeo, Dailymotion and Reddit on the website. The Android app also sniffs videos on most other websites.' },
  { q: 'Can I download YouTube videos and Shorts?', a: 'Yes, on this website: paste a YouTube video or Shorts link, choose 1080p / 720p / 480p MP4 or MP3 and download. Playlists, live streams and age-restricted videos are not supported. The Android app does not download from YouTube because of Google Play policy.' },
  { q: 'Which qualities and formats are available?', a: 'Whatever the source offers — typically 1080p, 720p, 480p and 360p MP4, plus an Audio-only MP3 option. Each option shows its approximate size before you download.' },
  { q: 'Do I need to log in or install anything?', a: 'Nothing. The website works in any browser. For private or login-only videos, use the Android app, where you can sign in to the site inside the app\'s browser.' },
  { q: 'Where are my files saved?', a: 'On the website, in your browser\'s download folder. In the Android app, in Movies/Savely, visible in your Gallery and in the app\'s Downloads tab.' },
  { q: 'Is Savely free?', a: 'Yes. The website and the Android app are free. We do not add watermarks.' },
  { q: 'Can I download any video I find?', a: 'Only download content you own, that is in the public domain, or that you have permission to save. Savely does not host any content.' },
];

export const WHATS_NEW = [
  { icon: '📱', title: 'Savely Android app', sub: 'Built-in browser · detects the video on any page · Wi-Fi-only downloads', href: PLAY_URL, highlight: true },
  { icon: '🎧', title: 'Audio only (MP3)', sub: 'Save just the sound of any supported video' },
  { icon: '📐', title: 'Sizes before you download', sub: 'Every quality shows its file size' },
];

export const fmtSize = (b) => (b ? `${(b / 1048576).toFixed(1)} MB` : '');
export const fmtDur = (s) => { if (!s) return ''; s = Math.round(s); const m = Math.floor(s / 60); const h = Math.floor(m / 60); return h ? `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`; };
