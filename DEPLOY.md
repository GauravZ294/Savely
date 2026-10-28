# Deploy Savely on Render

1. Push this website repository to GitHub. Deploy the Docker web service using
   `render.yaml`. Existing services can use **Manual Deploy > Deploy latest
   commit** after the changes are pushed.
2. YouTube uses `youtubei.js` directly from Node 22. FFmpeg merges HD video with
   audio and converts MP3. The image still includes yt-dlp for other platforms;
   YouTube requests never invoke it.
3. Remove `YTDLP_COOKIES` and the YouTube cookie secret if they were used solely
   for YouTube. The new flow does not read them.
4. Open `/api/health`, then paste a public YouTube link into the homepage or
   `/youtube`. The site opens `/download?url=...` with a thumbnail, optional
   embedded preview, and available MP4 resolutions and MP3 audio. Test a video
   you own or have permission to save, including HD MP4 with sound and MP3.
5. If YouTube requests verification or refuses transfers, configure a private
   HTTP(S) proxy in Render Environment as `YOUTUBE_PROXY_URL`, for example
   `http://username:password@proxy-host:port`. URL-encode credentials. Never
   commit this value or expose it in frontend code. Metadata, signatures, and
   media must use the same outbound IP. Optional matching session values are
   `YOUTUBE_PO_TOKEN` and `YOUTUBE_VISITOR_DATA`; they are not generated
   automatically, and tokens can expire. A proxy does not guarantee access:
   verify a full download before relying on it.

YouTube can refuse datacenter IPs regardless of the extraction library. There
is no unconditional cookie-free download API. Removing yt-dlp does not remove
YouTube's IP checks, authentication requirements, or internal API changes. The
new flow reports these failures on the page instead of redirecting to JSON.

Preparations run in a bounded queue with at most two active jobs, stream bytes
to temporary files rather than RAM, enforce `MAX_FILESIZE` (default 1G), and
expire after 15 minutes. Keep one Render instance: tickets are in memory and
files are ephemeral. Deploying or restarting clears jobs; prepare downloads
again. For multiple instances, add shared job storage and object storage.
MP3 conversion and MP4 merging use additional temporary disk space.

SQLite contact messages and the counter also reset when Render replaces
ephemeral storage. Configure SMTP privately if contact email is needed.

Before release, run `npm ci`, `npm ci --prefix client`, `npm test`, and
`npm run build`. These checks do not prove that a particular Render IP is
accepted by YouTube. Test full MP4 and MP3 downloads on the deployed service.

References:
- https://ytjs.dev/guide/getting-started
- https://ytjs.dev/guide/proxies
- https://render.com/docs/configure-environment-variables
