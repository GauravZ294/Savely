import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import ffmpeg from 'ffmpeg-static';
import { youtubeId, qualityOptions, selectFormats, sizeLimit, saveFormat, downloadYouTube, youtubeError, createYouTubeFetch } from '../youtube.js';
import { createYouTubeJobs } from '../youtube-jobs.js';
import { HttpError } from '../errors.js';
import { info, download, checkUrl } from '../ytdlp.js';

const id = 'aqz-KE-bpKQ';
const url = `https://www.youtube.com/watch?v=${id}`;
const base = { url: 'https://r1.googlevideo.com/videoplayback', mime_type: 'video/mp4; codecs="avc1"', bitrate: 1000 };
const video = { ...base, itag: 137, has_video: true, has_audio: false, height: 1080, content_length: 10 };
const audio = { ...base, itag: 140, mime_type: 'audio/mp4; codecs="mp4a"', has_audio: true, has_video: false, content_length: 5 };
const combined = { ...base, itag: 18, has_video: true, has_audio: true, height: 360, content_length: 7 };

test('proxy transport preserves native Request methods and bodies through an HTTP CONNECT proxy', { timeout: 10000 }, async () => {
  const server = createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ method: req.method, body }));
  });
  const proxy = createServer();
  let tunnels = 0;
  proxy.on('connect', (req, client, head) => {
    tunnels++;
    const [host, port] = req.url.split(':');
    const upstream = connect(Number(port), host, () => {
      client.write('HTTP/1.1 200 Connection Established\r\n\r\n');
      if (head.length) upstream.write(head);
      client.pipe(upstream); upstream.pipe(client);
    });
    upstream.on('error', () => client.destroy());
    client.on('error', () => upstream.destroy());
    client.on('close', () => upstream.destroy());
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  await new Promise((r) => proxy.listen(0, '127.0.0.1', r));
  const transport = createYouTubeFetch(`http://127.0.0.1:${proxy.address().port}`);
  try {
    const request = new Request(`http://127.0.0.1:${server.address().port}/player`, { method: 'POST', body: 'videoId=example' });
    const response = await transport(request);
    assert.deepEqual(await response.json(), { method: 'POST', body: 'videoId=example' });
    assert.equal(tunnels, 1);
  } finally {
    await transport.close();
    await Promise.all([new Promise((r) => proxy.close(r)), new Promise((r) => server.close(r))]);
  }
});

test('normalizes watch, short, embed, mobile and short-domain links', () => {
  for (const link of [url, `https://youtu.be/${id}?si=abc`, `https://m.youtube.com/shorts/${id}`, `https://www.youtube-nocookie.com/embed/${id}`, `https://youtube.com/live/${id}`, `https://youtube.com./watch?v=${id}`]) assert.equal(youtubeId(link), id);
  for (const link of ['https://youtube.com/playlist?list=abc', 'https://youtube.com/watch?v=bad', `https://youtube.com.evil.test/watch?v=${id}`, `https://evil.test/${id}`, `file://youtube.com/watch?v=${id}`, `https://user:pass@youtube.com/watch?v=${id}`, `https://youtube.com:8080/watch?v=${id}`]) assert.throws(() => youtubeId(link), HttpError);
});

test('YouTube requests cannot fall back to yt-dlp', async () => {
  await assert.rejects(info(url), /YouTube preview/);
  assert.throws(() => download(url, 'v1080'), /YouTube preview/);
  assert.equal(checkUrl(`https://youtube.com./watch?v=${id}`), `https://youtube.com/watch?v=${id}`);
});

test('qualities reflect source heights, include sound, and reject unsupported qualities', () => {
  assert.deepEqual(qualityOptions([video, audio, combined]).map((x) => [x.id, x.size]), [['v1080', 15], ['v360', 7], ['audio', null]]);
  assert.equal(selectFormats([video, audio], 'v1080').audio, audio);
  assert.equal(selectFormats([video, audio, combined], 'v360').audio, null);
  assert.equal(selectFormats([combined], 'audio').audio, combined);
  assert.throws(() => selectFormats([video, audio], 'v720'), /no longer available/);
  assert.throws(() => selectFormats([video, audio], '137+140'), /Unknown/);
  assert.deepEqual(qualityOptions([video]), []);
  assert.deepEqual(qualityOptions([{ ...video, content_length: undefined }]), []);
  assert.deepEqual(qualityOptions([{ ...video, drm_families: ['widevine'] }, audio]).map((x) => x.id), ['audio']);
});

test('size limit parsing and upstream errors are actionable without leaking details', () => {
  assert.equal(sizeLimit('1G'), 1024 ** 3);
  assert.equal(sizeLimit('500MiB'), 500 * 1024 ** 2);
  for (const value of ['0', 'NaN', '-1G']) assert.throws(() => sizeLimit(value));
  const error = new HttpError(413, 'Too big');
  assert.equal(youtubeError(error), error);
  assert.equal(youtubeError(new Error('secret proxy password')).status, 503);
  assert.doesNotMatch(youtubeError(new Error('secret proxy password')).message, /secret/);
});

test('media transfer enforces length and byte budget, rejects arbitrary hosts', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savely-test-'));
  const signal = AbortSignal.timeout(5000);
  const f = { ...video, content_length: 3, decipher: async () => base.url };
  try {
    const budget = { remaining: 3 };
    const calls = [];
    await saveFormat(f, null, path.join(dir, 'file'), budget, signal, async (target) => { calls.push(target.searchParams.get('range')); return new Response(new Uint8Array([1, 2, 3])); });
    assert.equal(fs.statSync(path.join(dir, 'file')).size, 3);
    assert.equal(budget.remaining, 0);
    assert.deepEqual(calls, ['0-2']);
    await assert.rejects(saveFormat(f, null, path.join(dir, 'large'), { remaining: 2 }, signal), { status: 413 });
    await assert.rejects(saveFormat({ ...f, decipher: async () => 'https://internal.example/file' }, null, path.join(dir, 'bad'), { remaining: 3 }, signal), /unsupported media/);
    await assert.rejects(saveFormat(f, null, path.join(dir, 'truncated'), { remaining: 3 }, signal, async () => new Response(new Uint8Array([1]))), /incomplete/);
    await assert.rejects(saveFormat(f, null, path.join(dir, 'oversized'), { remaining: 3 }, signal, async () => new Response(new Uint8Array([1, 2, 3, 4]))), { status: 413 });
    await assert.rejects(saveFormat(f, null, path.join(dir, 'refused'), { remaining: 3 }, signal, async () => new Response('', { status: 403 })), /refused/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('preparation queue reports ready/failure, limits active work, and removes files', async () => {
  const pending = [];
  const dirs = [];
  let started = 0;
  const jobs = createYouTubeJobs(() => { started++; return new Promise((resolve) => pending.push(resolve)); });
  try {
    const tokens = Array.from({ length: 3 }, () => jobs.create(url, 'v1080'));
    await new Promise((r) => setImmediate(r));
    assert.equal(started, 2);
    assert.equal(jobs.get(tokens[2]).state, 'queued');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savely-job-test-')); dirs.push(dir);
    pending.shift()({ dir, file: path.join(dir, 'file'), ext: 'mp4' });
    await new Promise((r) => setImmediate(r));
    assert.equal(jobs.get(tokens[0]).state, 'ready');
    assert.equal(started, 3);
    for (let n = 3; n < 12; n++) jobs.create(url, 'v360');
    assert.throws(() => jobs.create(url, 'v360'), { status: 503 });
    assert.throws(() => jobs.get('unknown'), { status: 410 });
    jobs.close();
    assert.equal(fs.existsSync(dir), false);
  } finally { jobs.close(); for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true }); }
  const failed = createYouTubeJobs(async () => { throw new HttpError(422, 'Video unavailable'); });
  try {
    const token = failed.create(url, 'audio');
    await new Promise((r) => setImmediate(r));
    assert.equal(failed.get(token).state, 'failed');
    assert.equal(failed.get(token).error.status, 422);
  } finally { failed.close(); }
});

test('closing a job queue cleans up a late preparation result', async () => {
  let finish;
  const jobs = createYouTubeJobs(() => new Promise((resolve) => { finish = resolve; }));
  jobs.create(url, 'v1080');
  await new Promise((r) => setImmediate(r));
  jobs.close();
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savely-late-test-'));
  finish({ dir });
  await new Promise((r) => setImmediate(r));
  assert.equal(fs.existsSync(dir), false);
});

test('media transfer requests consecutive bounded chunks and respects cancellation', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savely-chunk-test-'));
  const total = 5 * 1024 * 1024 + 3;
  const f = { ...video, content_length: total, decipher: async () => base.url };
  const ranges = [];
  try {
    await saveFormat(f, null, path.join(dir, 'chunks'), { remaining: total }, AbortSignal.timeout(5000), async (target) => {
      const range = target.searchParams.get('range'); ranges.push(range);
      const [start, end] = range.split('-').map(Number);
      return new Response(new Uint8Array(end - start + 1));
    });
    assert.deepEqual(ranges, ['0-5242879', '5242880-5242882']);
    assert.equal(fs.statSync(path.join(dir, 'chunks')).size, total);
    const controller = new AbortController(); controller.abort();
    await assert.rejects(saveFormat(f, null, path.join(dir, 'cancelled'), { remaining: total }, controller.signal), { name: 'AbortError' });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('FFmpeg produces an MP4 with video+audio and an MP3 from separate source tracks', { timeout: 30_000 }, async () => {
  const bin = process.env.FFMPEG_PATH || ffmpeg;
  assert.ok(bin && fs.existsSync(bin), 'Install FFmpeg to run the conversion test');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savely-ffmpeg-test-'));
  const run = (args) => {
    const result = spawnSync(bin, ['-nostdin', '-hide_banner', '-loglevel', 'error', ...args], { encoding: 'utf8', timeout: 15000 });
    assert.equal(result.status, 0, result.stderr);
    return result;
  };
  const results = [];
  try {
    const picture = path.join(dir, 'source.mp4');
    const sound = path.join(dir, 'source.m4a');
    run(['-f', 'lavfi', '-i', 'color=c=blue:s=160x90:r=10', '-t', '0.5', '-an', '-c:v', 'libx264', picture]);
    run(['-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100', '-t', '0.5', '-c:a', 'aac', sound]);
    const dependencies = {
      getVideo: async () => ({ formats: [video, audio], player: null, video: { basic_info: { title: 'Test fixture' } } }),
      saveFormat: async (format, _player, file) => fs.copyFileSync(format.has_video ? picture : sound, file),
    };
    const mp4 = await downloadYouTube(url, 'v1080', AbortSignal.timeout(10000), dependencies); results.push(mp4);
    const mp3 = await downloadYouTube(url, 'audio', AbortSignal.timeout(10000), dependencies); results.push(mp3);
    assert.equal(mp4.ext, 'mp4'); assert.equal(mp3.ext, 'mp3');
    run(['-i', mp4.file, '-map', '0:v:0', '-map', '0:a:0', '-f', 'null', '-']);
    run(['-i', mp3.file, '-map', '0:a:0', '-f', 'null', '-']);
    assert.ok(fs.statSync(mp4.file).size > 0); assert.ok(fs.statSync(mp3.file).size > 0);
  } finally {
    for (const result of results) fs.rmSync(result.dir, { recursive: true, force: true });
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
