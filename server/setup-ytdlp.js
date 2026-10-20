// Runs on `npm install` (postinstall) and via `npm run ytdlp:update`.
// Downloads the yt-dlp binary into ./bin if none is usable, and reports ffmpeg. Never fails the install.
import { ensureYtdlp, updateYtdlp } from './ytdlp.js';

try {
  let t = await ensureYtdlp();
  if (t.version) {
    const ok = await updateYtdlp();
    console.log(ok ? 'yt-dlp nightly updated.' : 'yt-dlp nightly update failed.');
    if (ok) t = await ensureYtdlp();
  }
  if (process.argv.includes('--update') && !t.version) console.log('yt-dlp update failed (binary missing or no network).');
  console.log(t.version ? `✓ yt-dlp ${t.version} → ${t.bin}` : '✗ yt-dlp could not be installed automatically (no network?). The server will retry at startup.');
  console.log(t.ffmpeg ? `✓ ffmpeg ${t.ffmpeg} → ${t.ffmpegBin}` : '✗ ffmpeg not found – install ffmpeg or let `ffmpeg-static` finish downloading.');
} catch (e) {
  console.warn('setup-ytdlp:', e.message);
}
