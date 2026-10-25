import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// yt-dlp writes its cookie jar on exit. Give each request a private writable
// copy so read-only host secrets and concurrent requests are both supported.
export function prepareCookies(source = process.env.YTDLP_COOKIES) {
  if (!source) return { args: [], cleanup() {} };
  let contents;
  try {
    contents = fs.readFileSync(source, 'utf8').replace(/^\uFEFF/, '');
    if (!/^# (?:Netscape )?HTTP Cookie File\r?$/m.test(contents)) throw new Error();
  } catch {
    throw new Error('YTDLP_COOKIES must point to a readable Netscape-format cookie file.');
  }
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'savely-cookies-'));
  const cleanup = () => fs.rmSync(dir, { recursive: true, force: true });
  try {
    fs.chmodSync(dir, 0o700);
    const file = path.join(dir, 'cookies.txt');
    fs.writeFileSync(file, contents, { mode: 0o600 });
    return { args: ['--cookies', file], cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}
