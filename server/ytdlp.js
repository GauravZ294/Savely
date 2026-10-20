import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const BIN_DIR = path.join(here, '..', 'bin');
const LOCAL_BIN = path.join(BIN_DIR, process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp');
/** Resolved at startup by ensureYtdlp(): env → local download → PATH. */
let BIN = process.env.YTDLP_PATH || (fs.existsSync(LOCAL_BIN) ? LOCAL_BIN : 'yt-dlp');

/** ffmpeg: FFMPEG_PATH → the binary bundled by the `ffmpeg-static` npm package → `ffmpeg` on PATH. */
let FFMPEG = process.env.FFMPEG_PATH || null;
async function resolveFfmpeg() {
  if (FFMPEG) return FFMPEG;
  try { const m = await import('ffmpeg-static'); const p = m.default || m; if (p && fs.existsSync(p)) { FFMPEG = p; return p; } } catch { /* package missing or binary not downloaded */ }
  FFMPEG = 'ffmpeg';
  return FFMPEG;
}
const ffmpegArgs = () => (FFMPEG && FFMPEG !== 'ffmpeg' ? ['--ffmpeg-location', FFMPEG] : []);

function versionOf(bin) {
  return new Promise((resolve) => {
    try {
      const p = spawn(bin, ['--version']);
      let out = '';
      p.stdout.on('data', (d) => { out += d; });
      p.on('error', () => resolve(null));
      p.on('close', (code) => resolve(code === 0 ? out.trim() : null));
    } catch { resolve(null); }
  });
}

/** Official standalone build for this OS (no Python needed). */
function releaseAsset() {
  if (process.platform === 'darwin') return 'yt-dlp_macos';
  if (process.platform === 'win32') return 'yt-dlp.exe';
  return process.arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux';
}

/**
 * Makes sure a working yt-dlp exists: tries YTDLP_PATH / ./bin / PATH, otherwise downloads the latest
 * release binary into ./bin. Returns { bin, version, ffmpeg } for the startup log.
 */
export async function ensureYtdlp() {
  let version = await versionOf(BIN);
  if (!version && BIN !== LOCAL_BIN) { version = await versionOf(LOCAL_BIN); if (version) BIN = LOCAL_BIN; }
  if (!version) {
    const url = `https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/${releaseAsset()}`;
    console.log(`yt-dlp not found – downloading ${url} → ${LOCAL_BIN}`);
    try {
      fs.mkdirSync(BIN_DIR, { recursive: true });
      const r = await fetch(url, { redirect: 'follow' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      fs.writeFileSync(LOCAL_BIN, Buffer.from(await r.arrayBuffer()));
      if (process.platform !== 'win32') fs.chmodSync(LOCAL_BIN, 0o755);
      BIN = LOCAL_BIN;
      version = await versionOf(BIN);
    } catch (e) { console.error('yt-dlp auto-install failed:', e.message); }
  }
  const ffBin = await resolveFfmpeg();
  const ffmpeg = await versionOf(ffBin);
  return { bin: BIN, version, ffmpegBin: ffBin, ffmpeg: ffmpeg ? ffmpeg.split('\n')[0].replace(/^ffmpeg version\s*/, '').split(' ')[0] : null };
}

/** Updates the local binary in place (yt-dlp -U). Call from a cron/weekly. */
export function updateYtdlp() { return new Promise((resolve) => { const p = spawn(BIN, ['--update-to', 'nightly']); p.on('error', () => resolve(false)); p.on('close', (c) => resolve(c === 0)); }); }
const YT_HOSTS = ['youtube.com', 'youtu.be', 'youtube-nocookie.com', 'music.youtube.com'];
/** ALLOW_YOUTUBE=false in .env turns YouTube off again (the Android app keeps it blocked regardless). */
const ALLOW_YT = process.env.ALLOW_YOUTUBE !== 'false';
const BLOCKED = ALLOW_YT ? ['googlevideo.com'] : [...YT_HOSTS, 'googlevideo.com'];

/** Extra yt-dlp args: cookies file (needed for YouTube from server IPs). Keep yt-dlp itself up to date – that matters more than flags. */
function commonArgs(url) {
  const a = [];
  if (process.env.YTDLP_COOKIES && fs.existsSync(process.env.YTDLP_COOKIES)) a.push('--cookies', process.env.YTDLP_COOKIES);
  if (isYouTube(url)) a.push('--no-check-certificates', '--extractor-retries', '2');
  return a;
}

export const ytdlpVersion = () => versionOf(BIN);

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** Validates a user-supplied link; returns the normalised URL or throws HttpError. */
export function checkUrl(raw) {
  let u;
  try { u = new URL(String(raw || '').trim()); } catch { throw new HttpError(400, 'Enter a valid link starting with http:// or https://'); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new HttpError(400, 'Only http and https links are supported.');
  const h = u.hostname.toLowerCase();
  if (BLOCKED.some((b) => h === b || h.endsWith('.' + b))) throw new HttpError(400, ALLOW_YT ? "That link isn't supported." : 'YouTube downloads are disabled on this site.');
  if (h === 'localhost' || h.endsWith('.local') || /^(\d+\.){3}\d+$/.test(h) || h.includes(':')) throw new HttpError(400, "That link isn't supported.");
  if (isYouTube(u.toString()) && /[?&]list=/.test(u.search) && !/[?&]v=/.test(u.search)) throw new HttpError(400, 'Playlists are not supported — open one video and paste its link.');
  return u.toString();
}

export const isYouTube = (url) => { try { const h = new URL(url).hostname.toLowerCase(); return YT_HOSTS.some((b) => h === b || h.endsWith('.' + b)); } catch { return false; } };

function runYtdlp(args, { timeoutMs }) {
  return new Promise((resolve, reject) => {
    const p = spawn(BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = ''; let err = '';
    p.stdout.on('data', (d) => { out += d; });
    p.stderr.on('data', (d) => { err += d; });
    const timer = setTimeout(() => p.kill('SIGKILL'), timeoutMs);
    p.on('error', (e) => {
      clearTimeout(timer);
      reject(e.code === 'ENOENT' ? new HttpError(503, 'The downloader (yt-dlp) is not installed on this server yet. Owner: install yt-dlp + ffmpeg or set YTDLP_PATH in .env.') : e);
    });
    p.on('close', (code, signal) => {
      clearTimeout(timer);
      if (signal === 'SIGKILL') return reject(new HttpError(504, 'The site took too long to respond. Try again.'));
      if (code !== 0) { console.error('[yt-dlp]', err.trim().split('\n').slice(-3).join(' | ')); return reject(new HttpError(422, friendly(err))); }
      resolve(out);
    });
  });
}

/** yt-dlp -J for one page. */
export async function info(url) {
  const out = await runYtdlp(['-J', '--no-playlist', '--no-warnings', '--socket-timeout', '15', ...commonArgs(url), url], { timeoutMs: 60_000 });
  try { return JSON.parse(out); } catch { throw new HttpError(422, 'Could not read this video.'); }
}

/** Quality choices from yt-dlp formats, best first – mirrors Ytdl.options() in the Android app. */
export function options(meta) {
  const f = meta.formats || [];
  const sizeOf = (x) => x.filesize || x.filesize_approx || 0;
  const bestAudio = Math.max(0, ...f.filter((x) => x.acodec !== 'none' && x.vcodec === 'none').map(sizeOf));
  const byHeight = new Map();
  for (const x of f) {
    if (x.vcodec === 'none' || !x.height) continue;
    const score = (x.ext === 'mp4' ? 1e12 : 0) + sizeOf(x);
    const cur = byHeight.get(x.height);
    if (!cur || score > cur.score) byHeight.set(x.height, { x, score });
  }
  const out = [...byHeight.entries()].sort((a, b) => b[0] - a[0]).slice(0, 8).map(([h, { x }]) => {
    let size = sizeOf(x);
    if (size && x.acodec === 'none') size += bestAudio;
    return { id: `v${h}`, label: `${h}p`, ext: 'mp4', size: size || null, height: h };
  });
  if (!out.length && f.length) out.push({ id: 'best', label: 'Best quality', ext: 'mp4', size: null });
  if (f.some((x) => x.acodec !== 'none')) out.push({ id: 'audio', label: 'Audio only', ext: 'mp3', size: bestAudio || null });
  return out;
}

/** Format spec for an option id coming back from the client (whitelisted – never pass raw specs through). */
export function specFor(id) {
  if (id === 'best') return { spec: 'b', ext: 'mp4' };
  if (id === 'audio') return { spec: 'ba[ext=m4a]/ba', ext: 'mp3' };
  const m = /^v(\d{2,4})$/.exec(id || '');
  if (!m) throw new HttpError(400, 'Unknown quality.');
  const h = m[1];
  return { spec: `bv*[height=${h}][ext=mp4]+ba[ext=m4a]/bv*[height=${h}]+ba/b[height=${h}]/bv*[height<=${h}]+ba/b`, ext: 'mp4' };
}

/**
 * Downloads into a temp dir and resolves with the finished file path.
 * Caller must delete the directory. [onProcess] receives the child so the caller can kill it if the client leaves.
 */
export function download(url, id, onProcess = () => {}) {
  const { spec, ext } = specFor(id);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savely-'));
  const args = ['-f', spec, '--no-playlist', '--no-warnings', '--no-mtime', '--socket-timeout', '20', '-o', path.join(dir, 'video.%(ext)s')];
  if (ext === 'mp3') args.push('-x', '--audio-format', 'mp3'); else args.push('--merge-output-format', 'mp4');
  if (process.env.MAX_FILESIZE) args.push('--max-filesize', process.env.MAX_FILESIZE);
  args.push(...ffmpegArgs(), ...commonArgs(url), url);
  return new Promise((resolve, reject) => {
    const p = spawn(BIN, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    onProcess(p);
    let err = '';
    p.stderr.on('data', (d) => { err += d; });
    const timer = setTimeout(() => p.kill('SIGKILL'), 30 * 60_000);
    p.on('error', (e) => { clearTimeout(timer); fs.rmSync(dir, { recursive: true, force: true }); reject(e.code === 'ENOENT' ? new HttpError(503, 'The downloader (yt-dlp) is not installed on this server yet.') : e); });
    p.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) console.error('[yt-dlp dl]', err.trim().split('\n').slice(-3).join(' | '));
      const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => !n.endsWith('.part') && !n.endsWith('.ytdl')) : [];
      const file = files.map((n) => path.join(dir, n)).sort((a, b) => fs.statSync(b).size - fs.statSync(a).size)[0];
      if (code !== 0 || !file || fs.statSync(file).size === 0) {
        fs.rmSync(dir, { recursive: true, force: true });
        return reject(new HttpError(422, /max-filesize|File is larger/i.test(err) ? 'This video is larger than the size limit of this server.' : friendly(err)));
      }
      resolve({ file, dir, ext: path.extname(file).slice(1) || ext });
    });
  });
}

export const safeName = (s) => String(s || 'video').replace(/[\\/:*?"<>|\x00-\x1f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'video';

function friendly(m = '') {
  const l = m.toLowerCase();
  if (l.includes('not a bot') || l.includes('sign in to confirm')) return 'YouTube is asking this server to verify it is not a bot. The site owner needs to add a cookies file (YTDLP_COOKIES) or update yt-dlp. Please try again later.';
  if (l.includes('age') && l.includes('confirm')) return 'This video is age-restricted and needs a signed-in account; it cannot be downloaded here.';
  if (l.includes('video unavailable')) return 'This video is unavailable (removed, region-locked or private).';
  if (l.includes('login') || l.includes('cookies') || l.includes('private')) return 'This video needs a login or is private, so it cannot be downloaded here. Try the Android app, where you can log in to the site.';
  if (m.includes('Unsupported URL')) return "This link isn't a video page. Open the video itself and copy its link.";
  if (l.includes('is live') || l.includes('live stream')) return 'Live streams cannot be downloaded. Try again after the live video ends.';
  if (m.includes('DRM')) return 'This video is DRM-protected and cannot be downloaded.';
  if (m.includes('Requested format is not available')) return "That quality isn't available anymore. Pick another one.";
  if (l.includes('ffmpeg') || l.includes('ffprobe')) return 'ffmpeg is missing on this server, so video and audio cannot be merged. Owner: install ffmpeg.';
  if (l.includes('unable to extract') || l.includes('nsig') || l.includes('player') && l.includes('js')) return 'YouTube changed something and the downloader needs an update. Owner: run `yt-dlp -U`.';
  if (m.includes('HTTP Error 4') || m.includes('Unable to download')) return 'The site refused the request. Check the link and try again.';
  return "Couldn't get this video. Check the link or try again later.";
}
