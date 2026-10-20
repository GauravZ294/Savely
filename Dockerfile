# Savely website – one container: Node server + built React client + yt-dlp + ffmpeg
FROM node:20-bookworm-slim

# ffmpeg (merging / MP3), ca-certificates + curl (yt-dlp download), python3 (yt-dlp's own updater)
RUN apt-get update \
 && apt-get install -y --no-install-recommends ffmpeg ca-certificates curl python3 \
 && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
 && chmod a+rx /usr/local/bin/yt-dlp \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# server deps
COPY package*.json ./
RUN npm install --omit=dev

# client deps + build
COPY client/package*.json ./client/
RUN npm install --prefix client
COPY client ./client
RUN npm run build --prefix client

# server code
COPY server ./server

ENV NODE_ENV=production PORT=4000 HOST=0.0.0.0 YTDLP_PATH=/usr/local/bin/yt-dlp
EXPOSE 4000

# refresh yt-dlp on every boot (free hosts restart often; YouTube changes weekly), then start
CMD sh -c "yt-dlp -U >/dev/null 2>&1 || true; node server/index.js"
