import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { init, run, get } from './db.js';
import { checkUrl, info, options, download, safeName, ensureYtdlp, HttpError } from './ytdlp.js';
import { sendContact } from './mail.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));
if (process.env.NODE_ENV !== 'production') app.use(cors());

// ---------------------------------------------------------------- tiny per-IP rate limit (no dependency)
const hits = new Map();
function limit(max, windowMs) {
  return (req, res, next) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
    arr.push(now); hits.set(key, arr);
    next();
  };
}
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (!v.some((t) => now - t < 600_000)) hits.delete(k); }, 60_000).unref();

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ---------------------------------------------------------------- API
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/config', (_req, res) => res.json({
  playUrl: process.env.PLAY_URL || 'https://play.google.com/store/apps/details?id=com.savely.videodownloader',
  contactEmail: process.env.CONTACT_TO || 'allinoneapps12@gmail.com',
  youtube: process.env.ALLOW_YOUTUBE !== 'false',
}));

/** POST /api/analyze {url} → title, thumbnail, duration, uploader, options[] */
app.post('/api/analyze', limit(20, 10 * 60_000), wrap(async (req, res) => {
  const url = checkUrl(req.body?.url);
  const meta = await info(url);
  const opts = options(meta);
  if (!opts.length) throw new HttpError(422, 'No downloadable video was found on this page.');
  res.json({
    url,
    title: meta.title || meta.fulltitle || 'Video',
    thumbnail: meta.thumbnail || null,
    duration: meta.duration || null,
    uploader: meta.uploader || meta.channel || null,
    host: new URL(url).hostname.replace(/^www\./, ''),
    options: opts,
  });
}));

/** GET /api/download?url=&id=&title= → the file (Content-Disposition: attachment) */
app.get('/api/download', limit(10, 10 * 60_000), wrap(async (req, res) => {
  const url = checkUrl(req.query.url);
  const id = String(req.query.id || 'best');
  const title = safeName(req.query.title);
  let child = null; let gone = false;
  res.on('close', () => { gone = true; if (child && child.exitCode === null) child.kill('SIGKILL'); });
  const { file, dir, ext } = await download(url, id, (p) => { child = p; });
  if (gone) { fs.rmSync(dir, { recursive: true, force: true }); return; }
  run('INSERT INTO downloads (host, title, quality) VALUES (?, ?, ?)', [new URL(url).hostname, title, id]).catch(() => {});
  res.download(file, `${title}.${ext}`, () => fs.rmSync(dir, { recursive: true, force: true }));
}));

/** POST /api/contact {name,email,message} → saved to SQLite and emailed to CONTACT_TO */
app.post('/api/contact', limit(5, 10 * 60_000), wrap(async (req, res) => {
  const name = String(req.body?.name || '').trim().slice(0, 100);
  const email = String(req.body?.email || '').trim().slice(0, 200);
  const message = String(req.body?.message || '').trim().slice(0, 4000);
  if (name.length < 2) throw new HttpError(400, 'Please enter your name.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (message.length < 10) throw new HttpError(400, 'Please write a few more words in your message.');
  const row = await run('INSERT INTO contacts (name, email, message) VALUES (?, ?, ?)', [name, email, message]);
  let emailed = false;
  try { emailed = await sendContact({ name, email, message }); } catch (e) { console.error('[mail]', e.message); }
  if (emailed) run('UPDATE contacts SET emailed = 1 WHERE id = ?', [row.lastID]).catch(() => {});
  res.json({ ok: true, emailed });
}));

/** GET /api/stats → public counter for the home page */
app.get('/api/stats', wrap(async (_req, res) => {
  const d = await get('SELECT COUNT(*) AS n FROM downloads');
  res.json({ downloads: d?.n || 0 });
}));

// ---------------------------------------------------------------- static client (after `npm run build`)
const dist = path.join(here, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '1h', index: false }));
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

// ---------------------------------------------------------------- errors
app.use((err, _req, res, _next) => {
  const known = err instanceof HttpError;
  const status = known ? err.status : 500;
  if (!known || status >= 500) console.error('[api]', err);
  res.status(status).json({ error: known ? err.message : 'Something went wrong on the server. Check the server log.' });
});

const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || '0.0.0.0';
init().then(() => app.listen(port, host, async () => {
  console.log(`Savely web server → http://${host === '0.0.0.0' ? 'localhost' : host}:${port}`);
  const t = await ensureYtdlp();
  console.log(t.version ? `yt-dlp ${t.version} ready (${t.bin})${process.env.YTDLP_COOKIES ? ' · cookies: ' + process.env.YTDLP_COOKIES : ''}`
    : '!! yt-dlp unavailable and auto-download failed. Install it: macOS `brew install yt-dlp` · Linux `sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod +x /usr/local/bin/yt-dlp` · or set YTDLP_PATH in .env');
  console.log(t.ffmpeg ? `ffmpeg ${t.ffmpeg} ready (${t.ffmpegBin})` : '!! ffmpeg NOT found – 1080p/720p merging and MP3 will fail. Run `npm install` again (ffmpeg-static downloads it) or install: macOS `brew install ffmpeg` · Ubuntu/Debian `sudo apt install -y ffmpeg` · Windows `winget install Gyan.FFmpeg`');
}))
  .catch((e) => { console.error('DB init failed', e); process.exit(1); });
