# Savely – Video Downloader website

Website for the **Savely** Android app ([Google Play](https://play.google.com/store/apps/details?id=com.savely.videodownloader)).
Paste a Facebook / Instagram / TikTok / X / Vimeo / Dailymotion / Reddit link → pick a quality → download MP4 or MP3.
YouTube is blocked, same as in the app.

- **Client:** React 18 + Vite + React Router, plain CSS (dark theme, responsive, no UI framework)
- **Server:** Node 18+ / Express, `yt-dlp` for link analysis and downloading, SQLite (`sqlite3`) for contact messages and a download counter, Nodemailer for the contact form
- Pages: Home, one page per platform (`/facebook`, `/instagram`, …), Contact, Privacy, Terms, 404
- Extras: "What's new" card (once per browser), docked "Recent downloads" panel, Get-the-app banner with Play Store badge

## Requirements

| Tool | Why | Install |
|---|---|---|
| Node.js ≥ 18.17 | server + build | https://nodejs.org |
| yt-dlp | reads video qualities & downloads | **auto-installed by `npm install`** (postinstall downloads the official binary into `website/bin/`; the server also retries at startup). Update any time: `npm run ytdlp:update`. Manual: `brew install yt-dlp` (macOS) · `sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && sudo chmod +x /usr/local/bin/yt-dlp` (Linux) · `winget install yt-dlp` (Windows) |
| ffmpeg | merges video+audio to MP4, makes MP3 | **bundled by the `ffmpeg-static` npm dependency** (downloaded during `npm install`; the server passes it to yt-dlp automatically). If that download is blocked on your network, install it manually – macOS: `brew install ffmpeg` (no Homebrew? `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` first) · Ubuntu/Debian: `sudo apt update && sudo apt install -y ffmpeg` · Windows: `winget install Gyan.FFmpeg` |

The server prints the detected yt-dlp and ffmpeg versions at startup; a line starting with `!!` tells you what is still missing. Update yt-dlp weekly: `website/bin/yt-dlp -U` (or `yt-dlp -U` if installed globally).

## Run locally

```bash
cd website
npm run setup          # installs server + client dependencies
cp .env.example .env   # then edit .env (see below)
npm run dev            # server on :4000, client on :5173 (proxied /api)
```

Open http://localhost:5173.

## Deploy for free (Render)

Vercel / Netlify / GitHub Pages only host static files – they cannot run yt-dlp or ffmpeg, so the downloader would not work there.
Render's free tier runs a Docker container, which is exactly what this needs.

1. Push the repo to GitHub.
2. https://dashboard.render.com → **New → Blueprint** → select the repo. Render reads `website/render.yaml` and builds `website/Dockerfile` (Node + ffmpeg + yt-dlp, client pre-built).
3. When asked, paste the Gmail App Password into `SMTP_PASS`. Everything else is pre-filled.
4. First deploy takes ~5 min. Your site is at `https://savely-web.onrender.com` (rename the service for a different subdomain, or add your own domain under Settings → Custom Domains – free, with HTTPS).
5. Put that URL into `client/src/data.js` (`SITE_URL`), `index.html`, `robots.txt`, `sitemap.xml`, commit, and Render redeploys automatically.

Free-tier facts to know: the service sleeps after 15 min without traffic and the first request afterwards takes ~30–60 s (the page shows "Checking…" a bit longer – that's it waking up); 750 free hours/month covers one service 24/7; disk is wiped on each deploy, so the SQLite file resets – contact messages are emailed anyway, only the download counter restarts; 512 MB RAM, so `MAX_FILESIZE=1G` is set. yt-dlp self-updates on every boot.

Also free and workable: **Koyeb** (same Dockerfile, no sleep but 1 service) and an **Oracle Cloud Always-Free ARM VM** (no limits, but you manage a Linux server yourself). Not free any more: Railway, Fly.io, Heroku.

## Production (your own server / VPS)

```bash
npm run build          # builds client/dist
NODE_ENV=production npm start   # Express serves the API and the built site on PORT (default 4000)
```

Or build the container: `docker build -t savely-web . && docker run -p 4000:4000 --env-file .env savely-web`. Put it behind nginx/Caddy with HTTPS. The host needs `yt-dlp` and `ffmpeg` on the PATH (or set `YTDLP_PATH`). Keep yt-dlp updated (`yt-dlp -U`) – sites change often.

## .env

| Key | Meaning |
|---|---|
| `PORT` | server port (4000) |
| `CONTACT_TO` | where contact messages are emailed – `allinoneapps12@gmail.com` |
| `SMTP_HOST/PORT/USER/PASS` | mail account used to send. For Gmail: enable 2-Step Verification, create an **App Password**, use it as `SMTP_PASS`. If left empty, messages are still saved in SQLite (`data/savely.db`, table `contacts`) and the form still succeeds. |
| `YTDLP_PATH` | path to yt-dlp (default `yt-dlp`) |
| `MAX_FILESIZE` | cap per download, e.g. `2G` |
| `PLAY_URL` | Play Store link |

## API

| Route | Body / query | Returns |
|---|---|---|
| `POST /api/analyze` | `{ url }` | `{ title, thumbnail, duration, uploader, host, options:[{id,label,ext,size}] }` |
| `GET /api/download` | `url, id, title` | the file as an attachment (`id` = `v720`, `v1080`, `best`, `audio`) |
| `POST /api/contact` | `{ name, email, message }` | `{ ok, emailed }` |
| `GET /api/stats` | – | `{ downloads }` |
| `GET /api/health` | – | `{ ok }` |

Rate limits: 20 analyses / 10 min, 10 downloads / 10 min, 5 contact messages / 10 min per IP (in-memory).

## Database

`data/savely.db` is created automatically (git-ignored). Tables: `contacts(name,email,message,emailed,created_at)` and `downloads(host,title,quality,created_at)`.

## Project layout

```
website/
├─ package.json          server deps + scripts (dev / build / start)
├─ .env.example
├─ server/
│  ├─ index.js           Express app, API routes, static client
│  ├─ ytdlp.js           URL validation, yt-dlp info/download, quality mapping
│  ├─ db.js              sqlite3 helpers + schema
│  └─ mail.js            nodemailer
└─ client/               Vite + React
   ├─ index.html
   ├─ vite.config.js     /api proxy in dev
   └─ src/
      ├─ App.jsx, main.jsx, styles.css, data.js, api.js
      ├─ components/     Header, Footer, Analyzer, Sections, Overlays, Icons
      └─ pages/          Home, Platform, Contact, Legal (Privacy, Terms, 404)
```

## YouTube

Enabled by default on the website (`ALLOW_YOUTUBE=true`); the Android app keeps YouTube blocked (Google Play policy).
Two realities to plan for:

- **Bot checks.** From a server / datacenter IP YouTube often replies "Sign in to confirm you're not a bot". Fix: export cookies from a browser logged into a *throwaway* Google account (Netscape `cookies.txt`, e.g. the "Get cookies.txt LOCALLY" extension) and set `YTDLP_COOKIES=/path/cookies.txt`. Keep `yt-dlp` current (`yt-dlp -U`, ideally a weekly cron) — YouTube changes break old versions within days.
- **Takedowns.** YouTube downloading is the feature most likely to bring DMCA/abuse complaints to your host. Keep the Terms page, answer takedown mail at `allinoneapps12@gmail.com`, and flip `ALLOW_YOUTUBE=false` if the host objects.

Not supported: playlists (paste a single video link), live streams, age-restricted videos.

## Smooth scrolling

`client/src/components/SmoothScroll.jsx` handles native smooth scrolling for in-page anchor links (`#how`, `#faq`) and route transitions, respecting `prefers-reduced-motion`.

## SEO checklist (before going live)

1. Replace `https://savely.app` with your real domain in `client/src/data.js` (`SITE_URL`), `client/index.html`, `client/public/robots.txt` and `client/public/sitemap.xml`.
2. Serve over HTTPS; submit `sitemap.xml` in Google Search Console; verify the domain.
3. Already in place: unique title/description per page, canonical, Open Graph + Twitter cards, `og.svg` share image, JSON-LD (Organization with founder Gaurav Zalavadiya, WebSite, SoftwareApplication, WebApplication, FAQPage, HowTo, ContactPage), robots meta, manifest, semantic headings, keyword-rich copy (free online video downloader, HD MP4, no watermark, Instagram Reels / TikTok / Facebook / X downloader…).
4. Optional: add Google Search Console / Analytics tags in `index.html`; replace `og.svg` with a 1200×630 PNG (some platforms ignore SVG previews).

## Security

Never commit real passwords. `.env` is git-ignored; `.env.example` is **committed** — keep only placeholders in it. If a Gmail App Password was ever written into a committed file, revoke it in Google Account › Security › App passwords and create a new one.

## Legal

The site downloads only publicly available media the user links to, does not host content, blocks YouTube, and shows Terms/Privacy pages. Keep it that way – do not add title-search of movies/TV or adult platforms; that is what gets sites and Play Store apps taken down.
