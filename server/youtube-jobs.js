import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { HttpError } from './errors.js';
import { downloadYouTube, youtubeError } from './youtube.js';

// A bounded queue avoids tying up an HTTP connection while HD files are merged.
// Tokens are unguessable, files expire, and only two preparations run at once.
export function createYouTubeJobs(prepare = downloadYouTube) {
  const jobs = new Map();
  let active = 0;
  const ttl = 15 * 60_000;
  const remove = (job) => {
    if (job.readers) return;
    job.controller.abort();
    if (job.result) fs.rmSync(job.result.dir, { recursive: true, force: true });
    jobs.delete(job.token);
  };
  function pump() {
    for (const job of jobs.values()) {
      if (active >= 2) break;
      if (job.state !== 'queued') continue;
      active++; job.state = 'preparing';
      const timer = setTimeout(() => job.controller.abort(), ttl);
      timer.unref();
      Promise.resolve().then(() => prepare(job.url, job.quality, job.controller.signal))
        .then((result) => {
          if (!jobs.has(job.token)) { fs.rmSync(result.dir, { recursive: true, force: true }); return; }
          job.result = result; job.state = 'ready';
        })
        .catch((error) => { job.error = youtubeError(error); job.state = 'failed'; })
        .finally(() => { clearTimeout(timer); job.expires = Date.now() + ttl; active--; pump(); });
    }
  }
  const timer = setInterval(() => {
    for (const job of jobs.values()) if (job.expires <= Date.now()) remove(job);
  }, 60_000);
  timer.unref();
  return {
    create(url, quality) {
      if (jobs.size >= 12) throw new HttpError(503, 'Downloads are busy. Please try again in a few minutes.');
      const job = { token: randomUUID(), url, quality, state: 'queued', controller: new AbortController(), expires: Date.now() + ttl, readers: 0 };
      jobs.set(job.token, job); pump();
      return job.token;
    },
    get(token) {
      const job = jobs.get(token);
      if (!job || job.expires <= Date.now()) throw new HttpError(410, 'This download expired. Please prepare it again.');
      return job;
    },
    close() { clearInterval(timer); for (const job of jobs.values()) remove(job); },
  };
}
