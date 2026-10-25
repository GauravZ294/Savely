# Deploy from GitHub to Render

This repository contains the website at its root. GitHub Pages cannot run the
Node server, yt-dlp or FFmpeg. Use a Render Docker web service linked to this
repository instead.

1. Push the website changes to GitHub.
2. In Render, choose **New > Blueprint**, connect this repository, and use
   `render.yaml`. The Dockerfile installs FFmpeg and the official standalone
   yt-dlp build, which includes the YouTube JavaScript solver. Node 22 runs it.
   Check the plan shown by Render before creating the service.
3. To configure YouTube cookies, follow the official export instructions:
   https://github.com/yt-dlp/yt-dlp/wiki/Extractors#exporting-youtube-cookies
   Export only YouTube cookies in Netscape format. Use a dedicated account.
   Cookies grant access to that account; never commit or paste them into chat.
4. In your Render service, open **Environment > Secret Files > Add Secret File**.
   Name it `youtube-cookies.txt` and put the exported cookie contents there.
   The Blueprint sets `YTDLP_COOKIES=/etc/secrets/youtube-cookies.txt`.
   Add the secret file before testing YouTube. Without it, the server health
   endpoint can succeed but YouTube requests will report a configuration error.
5. Save and deploy. Open the URL Render assigns. Verify `/api/health` returns
   `{"ok":true}`, then analyze a public YouTube video you are authorized to
   download and test an MP4 and MP3 download.
6. When cookies expire, replace the Render secret file and redeploy.
   Cookie files are copied into a private temporary jar per YouTube request;
   the original secret is never modified and request copies are deleted.

For a local run, set `YTDLP_COOKIES` in the ignored `.env` to your cookie file's
absolute path. Install FFmpeg or restore the `ffmpeg-static` binary for merging
and audio conversion.

Cookies do not guarantee downloads: YouTube can reject a hosting IP, rotate
sessions, impose rate limits, or require a PO token. Diagnose actual server
errors before adding client overrides or token providers. Account use with
yt-dlp can also result in account restrictions; see the official guide.

Contact email is optional. Set SMTP variables privately in Render if needed;
messages are otherwise stored in SQLite. Render's ephemeral disk means the
SQLite database resets on service replacement. Verify hosting limits and
persistence requirements before relying on it for stored data.

References:
- https://render.com/docs/configure-environment-variables#secret-files
- https://github.com/yt-dlp/yt-dlp/wiki/EJS
