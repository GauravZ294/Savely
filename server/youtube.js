import { Innertube, Platform, UniversalCache, Log } from 'youtubei.js';
import { ProxyAgent } from 'undici';
import vm from 'node:vm';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { HttpError } from './errors.js';

// The library extracts the player's signature code; it needs an interpreter.
// Keep execution time bounded and do not expose Node globals to player scripts.
Platform.shim.eval = async (data) => vm.runInNewContext(`(function(){${data.output}\n})()`, {}, { timeout: 2000 });
Log.setLevel(Log.Level.ERROR);

export function youtubeId(raw) {
  let u;
  try { u = new URL(raw); } catch { throw new HttpError(400, 'Enter a valid YouTube video link.'); }
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!['http:', 'https:'].includes(u.protocol) || u.username || u.password || u.port) throw new HttpError(400, 'Enter a valid YouTube video link.');
  let id;
  if (host === 'youtu.be') id = u.pathname.split('/')[1];
  else if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com')) {
    id = u.pathname === '/watch' ? u.searchParams.get('v') : /^\/(?:shorts|embed|live)\/([^/]+)/.exec(u.pathname)?.[1];
  }
  if (!/^[\w-]{11}$/.test(id || '')) throw new HttpError(400, 'Paste a single YouTube video or Shorts link, rather than a channel or playlist.');
  return id;
}

export function createYouTubeFetch(proxyUrl = process.env.YOUTUBE_PROXY_URL) {
  const agent = proxyUrl ? new ProxyAgent(proxyUrl) : undefined;
  const transport = async (input, init = {}) => {
    const signals = [AbortSignal.timeout(30_000)];
    if (input?.signal) signals.push(input.signal);
    if (init.signal) signals.push(init.signal);
    // Use the runtime's fetch so YouTube.js's native Request objects retain
    // their method, headers and body. A second fetch implementation can treat
    // those Request objects as the string "[object Request]".
    return fetch(input, { ...init, signal: AbortSignal.any(signals), ...(agent ? { dispatcher: agent } : {}) });
  };
  transport.close = async () => { await agent?.close(); };
  return transport;
}
const youtubeFetch = createYouTubeFetch();

let session;
let sessionTime = 0;
async function getSession() {
  if (!session || Date.now() - sessionTime > 30 * 60_000) {
    sessionTime = Date.now();
    session = Innertube.create({
      cache: new UniversalCache(false),
      fetch: youtubeFetch,
      generate_session_locally: true,
      po_token: process.env.YOUTUBE_PO_TOKEN || undefined,
      visitor_data: process.env.YOUTUBE_VISITOR_DATA || undefined,
    }).catch((e) => { session = null; throw e; });
  }
  return session;
}

export function youtubeError(error) {
  if (error instanceof HttpError) return error;
  const message = String(error?.message || '');
  if (/abort|timeout/i.test(message)) return new HttpError(504, 'YouTube took too long to respond. Please try again.');
  return new HttpError(503, 'YouTube could not provide this video to the server. Try another public video or try again later.');
}

// Cache only server-side format objects, never expose expiring media URLs.
const videos = new Map();
export async function getVideo(url) {
  const id = youtubeId(url);
  const cached = videos.get(id);
  if (cached && Date.now() - cached.time < 3 * 60_000) return cached.value;
  try {
    const yt = await getSession();
    const video = await yt.getBasicInfo(id, { client: 'ANDROID_VR' });
    if (video.playability_status?.status !== 'OK') {
      const status = video.playability_status?.status;
      if (status === 'LOGIN_REQUIRED') throw new HttpError(422, 'YouTube requires verification or sign-in for this video. Try another public video.');
      throw new HttpError(422, 'This YouTube video is unavailable, private, or restricted.');
    }
    if (video.basic_info.is_live || video.basic_info.is_upcoming || video.basic_info.is_post_live_dvr) throw new HttpError(422, 'Live and upcoming videos are not supported. Try a finished video.');
    const formats = [...(video.streaming_data?.formats || []), ...(video.streaming_data?.adaptive_formats || [])];
    const value = { video, player: yt.session.player, formats, id };
    if (!qualityOptions(formats).length) throw new HttpError(422, 'YouTube returned no downloadable formats for this video. Please try again later.');
    if (videos.size >= 50) videos.delete(videos.keys().next().value);
    videos.set(id, { time: Date.now(), value });
    return value;
  } catch (error) {
    console.error('[youtube metadata]', error?.message);
    throw youtubeError(error);
  }
}

const usable = (f) => !f.drm_families?.length && !f.drm_track_type && !f.is_type_otf && Number.isSafeInteger(Number(f.content_length)) && Number(f.content_length) > 0 && !!(f.url || f.signature_cipher || f.cipher);
const mp4 = (f) => /^(video|audio)\/mp4\b/.test(f.mime_type || '');
const audioFormat = (formats) => formats.filter((f) => usable(f) && f.has_audio && mp4(f))
  .sort((a, b) => Number(a.has_video) - Number(b.has_video) || Number(!!b.is_original) - Number(!!a.is_original) || b.bitrate - a.bitrate)[0];

export function selectFormats(formats, id) {
  const audio = audioFormat(formats);
  if (id === 'audio') {
    if (!audio) throw new HttpError(422, 'Audio is unavailable for this video.');
    return { audio, ext: 'mp3' };
  }
  const match = /^v(\d{2,4})$/.exec(id || '');
  if (!match) throw new HttpError(400, 'Unknown YouTube quality.');
  const height = Number(match[1]);
  const video = formats.filter((f) => usable(f) && f.has_video && mp4(f) && f.height === height && (f.has_audio || audio))
    .sort((a, b) => Number(b.has_audio) - Number(a.has_audio) || b.bitrate - a.bitrate)[0];
  if (!video) throw new HttpError(422, 'That quality is no longer available. Analyze the video again.');
  return { video, audio: video.has_audio ? null : audio, ext: 'mp4' };
}

export function qualityOptions(formats) {
  const heights = [...new Set(formats.filter((f) => usable(f) && f.has_video && mp4(f) && f.height).map((f) => f.height))].sort((a, b) => b - a);
  const result = [];
  for (const height of heights) {
    try {
      const { video, audio } = selectFormats(formats, `v${height}`);
      const size = video.content_length && (!audio || audio.content_length) ? Number(video.content_length) + Number(audio?.content_length || 0) : null;
      result.push({ id: `v${height}`, label: `${height}p${video.fps > 30 ? ` ${video.fps}fps` : ''}`, ext: 'mp4', height, size, hasAudio: true });
    } catch { /* Video-only formats without a usable audio track cannot be offered. */ }
  }
  if (audioFormat(formats)) result.push({ id: 'audio', label: 'Audio only', ext: 'mp3', size: null });
  return result;
}

export async function analyzeYouTube(url) {
  const { video, formats, id } = await getVideo(url);
  const basic = video.basic_info;
  return {
    url: `https://www.youtube.com/watch?v=${id}`, videoId: id,
    title: basic.title || 'YouTube video',
    thumbnail: basic.thumbnail?.at(-1)?.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    duration: basic.duration || null, uploader: basic.author || basic.channel?.name || null,
    host: 'youtube.com', options: qualityOptions(formats),
  };
}

export function sizeLimit(value = process.env.MAX_FILESIZE || '1G') {
  const m = /^(\d+(?:\.\d+)?)\s*([KMGT]?)(?:i?B)?$/i.exec(value);
  if (!m || Number(m[1]) <= 0) throw new HttpError(503, 'The server download size limit is configured incorrectly.');
  return Number(m[1]) * 1024 ** ('KMGT'.indexOf(m[2].toUpperCase()) + 1);
}

// All metadata and bytes use the same outbound IP (including a configured proxy).
// Stream to disk in bounded chunks so a Render instance never buffers a video in RAM.
export async function saveFormat(format, player, file, budget, signal, transport = youtubeFetch) {
  const source = new URL(await format.decipher(player));
  if (source.protocol !== 'https:' || !source.hostname.endsWith('.googlevideo.com')) throw new HttpError(422, 'YouTube returned an unsupported media address.');
  const total = Number(format.content_length);
  if (!Number.isSafeInteger(total) || total <= 0) throw new HttpError(422, 'YouTube did not provide a complete file for this quality.');
  if (total > budget.remaining) throw new HttpError(413, 'This video exceeds the server download size limit. Choose a lower quality.');
  const chunkSize = 5 * 1024 * 1024;
  let received = 0;
  for (let start = 0; start < total; start += chunkSize) {
    signal.throwIfAborted();
    const end = Math.min(total - 1, start + chunkSize - 1);
    const target = new URL(source);
    target.searchParams.set('range', `${start}-${end}`);
    const response = await transport(target, { signal, redirect: 'error', headers: { 'User-Agent': 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12; en_US; Quest 3 Build/SQ3A.220605.009.A1) gzip', Origin: 'https://www.youtube.com', Referer: 'https://www.youtube.com/' } });
    if (!response.ok || !response.body) {
      await response.body?.cancel();
      throw new HttpError(503, 'YouTube refused the video transfer. Please try again later.');
    }
    let bytes = 0;
    const meter = new Transform({ transform(chunk, _encoding, callback) {
      bytes += chunk.length; received += chunk.length; budget.remaining -= chunk.length;
      if (bytes > end - start + 1 || budget.remaining < 0) callback(new HttpError(413, 'The video transfer exceeded the expected size.'));
      else callback(null, chunk);
    } });
    await pipeline(Readable.fromWeb(response.body), meter, fs.createWriteStream(file, { flags: start ? 'a' : 'w' }), { signal });
    if (bytes !== end - start + 1) throw new HttpError(503, 'The video transfer was incomplete. Please try again.');
  }
  return received;
}

export async function runFfmpeg(args, signal) {
  const bundled = (await import('ffmpeg-static')).default;
  const bin = process.env.FFMPEG_PATH || (bundled && fs.existsSync(bundled) ? bundled : 'ffmpeg');
  return new Promise((resolve, reject) => {
    const p = spawn(bin, ['-nostdin', '-hide_banner', '-loglevel', 'error', ...args], { signal, stdio: ['ignore', 'ignore', 'pipe'] });
    let errors = '';
    p.stderr.on('data', (d) => { errors = (errors + d).slice(-2000); });
    p.on('error', () => reject(new HttpError(503, 'The server could not prepare this format. Please try again later.')));
    p.on('close', (code) => {
      if (code === 0) resolve();
      else { console.error('[youtube merge]', errors); reject(new HttpError(503, 'The server could not prepare this format. Please try again later.')); }
    });
  });
}

export async function downloadYouTube(url, quality, signal, dependencies = {}) {
  const { formats, player, video } = await (dependencies.getVideo || getVideo)(url);
  const selected = selectFormats(formats, quality);
  const max = sizeLimit();
  const budget = { remaining: max };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savely-youtube-'));
  const save = dependencies.saveFormat || saveFormat;
  const merge = dependencies.runFfmpeg || runFfmpeg;
  try {
    const output = path.join(dir, `video.${selected.ext}`);
    const videoFile = path.join(dir, 'picture.mp4');
    const audioFile = path.join(dir, 'sound.m4a');
    if (selected.video) await save(selected.video, player, videoFile, budget, signal);
    if (selected.audio) await save(selected.audio, player, audioFile, budget, signal);
    signal.throwIfAborted();
    if (selected.ext === 'mp3') await merge(['-i', audioFile, '-vn', '-c:a', 'libmp3lame', '-b:a', '192k', '-fs', String(max), output], signal);
    else if (selected.audio) await merge(['-i', videoFile, '-i', audioFile, '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy', '-movflags', '+faststart', '-fs', String(max), output], signal);
    else fs.renameSync(videoFile, output);
    if (!fs.existsSync(output) || !fs.statSync(output).size) throw new HttpError(503, 'The server could not prepare the video.');
    if (fs.statSync(output).size >= max) throw new HttpError(413, 'The prepared file exceeds the server size limit. Choose a lower quality.');
    for (const f of [videoFile, audioFile]) fs.rmSync(f, { force: true });
    signal.throwIfAborted();
    return { dir, file: output, ext: selected.ext, title: video.basic_info.title || 'YouTube video' };
  } catch (error) {
    fs.rmSync(dir, { recursive: true, force: true });
    throw youtubeError(error);
  }
}
