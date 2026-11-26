# 🎬 Video Tool — Free Video Trimmer

Free video trimmer — standalone, one tool only. No server, no login, no payment.

## What it does

- 🎬 **Preview** — Play, pause, and seek with the built-in player
- ✂️ **Trim** — Start/end sliders with time display; loop the trimmed range
- 🔊 **Mute / unmute** — Toggle audio on and off
- ⏩ **Speed** — 0.5x / 1x / 1.5x / 2x playback
- 🖼️ **Thumbnail** — Save the current frame as a PNG
- ⬇️ **Export** — Download the trimmed clip (MP4 via ffmpeg.wasm when available, WebM re-record fallback)
- 📋 **Video info** — Duration, resolution, and file size

## How to use

1. Open `index.html` in a browser — or open the GitHub Pages link.
2. Choose a video file, or drag & drop it onto the upload area.
3. Drag the Start / End sliders to choose the part to keep.
4. Press **Preview trimmed clip** to check it.
5. Press **Export trimmed clip** to download it (named `<original>-trimmed.mp4`).
6. Press **Save thumbnail (PNG)** to save the current frame.

Export notes:

- The fast export uses ffmpeg.wasm loaded from a CDN. The first export downloads the converter, so it takes a little longer and needs internet.
- If the converter cannot load (offline or CDN blocked), the tool falls back to a built-in recorder and downloads a WebM copy instead. Preview and thumbnail still work either way.

## Deploy free on GitHub Pages

1. Create a new public repo on GitHub (for example `video-tool`).
2. Upload `index.html`, `style.css`, `app.js`, and `README.md` to the repo root.
3. Go to the repo → **Settings → Pages** → **Build and deployment → Source: Deploy from a branch** → Branch: `main`, Folder: `/ (root)` → **Save**.
4. Wait a moment, then open the Pages link (`https://<username>.github.io/video-tool/`).

## Privacy

- 🔒 Videos never leave this device — there is no server.
- 🔒 Export loads the ffmpeg.wasm converter from a CDN, but your file is not uploaded to any server.
- 🔒 No account, no tracking, no payment.

## Files

- `index.html` — page
- `style.css` — design
- `app.js` — player, trim, thumbnail, export (client-side only)
- `README.md` — this file
