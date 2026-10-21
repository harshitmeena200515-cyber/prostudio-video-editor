# 🎬 ProStudio — Modern In-Browser Video & Audio Editor

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5 / CSS3](https://img.shields.io/badge/UI-HTML5%20%2F%20CSS3-orange.svg)](#)
[![Web Audio API](https://img.shields.io/badge/Audio-Web%20Audio%20API-red.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ProStudio** is an advanced, lightweight web-based multimedia editor featuring a sleek NLE (Non-Linear Editor) interface inspired by tools like CapCut and Premiere Pro. It runs entirely inside modern web browsers with zero installation required.

---

## ✨ Key Features

- 🎞️ **Multi-Track Timeline**: Non-linear editing interface with trim, split, cut, snap-to-grid, and seekhead scrubbing.
- 🎚️ **Web Audio Engine**: Live audio waveform visualization, volume gain control, background music mixing, and sound effects.
- 🎨 **Visual Effects & Shaders**: Real-time color grading, brightness/contrast adjustments, transitions, and video filters.
- ✍️ **Text & Sticker Overlays**: Customizable font styles, captions, titles, and graphical sticker layers.
- 🖥️ **Live Canvas Preview**: Real-time interactive playback with resolution controls and aspect ratio toggles (16:9, 9:16, 1:1).
- ⚡ **Zero Backend Required**: Runs 100% client-side for maximum speed, security, and privacy.

---

## 📁 Architecture & File Layout

```text
editing app/
├── index.html            # Main NLE Studio interface
├── styles/
│   ├── main.css          # Application layout & dark theme styling
│   ├── timeline.css      # Multi-track timeline styles
│   └── effects.css       # Visual filter & modal styling
├── js/
│   ├── app.js            # Main application bootstrap
│   ├── core/             # Project state, media manager, timeline logic
│   ├── audio/            # Web Audio API sound engine
│   ├── effects/          # Color grading, transitions, shaders
│   ├── photo/            # Image manipulation and filters
│   ├── text/             # Text layers and stickers
│   ├── ui/               # Context menus, shortcuts, themes
│   └── export/           # Media rendering and canvas export
└── README.md
```

---

## 🚀 How to Run Locally

Because ProStudio is a pure client-side web application, you can run it using any local static server or simply open `index.html`:

### Option A: Using Python
```bash
python -m http.server 8080
```
Open your browser at `http://localhost:8080`.

### Option B: Using VS Code Live Server
Right-click `index.html` and select **"Open with Live Server"**.

---

## 🔒 Privacy & Performance

- **No data leaves your device**: All media processing (images, audio, video frames) occurs completely within the user's browser runtime.
- **No external tracking or telemetries**.

---

## 📜 License

Distributed under the MIT License. Feel free to use, enhance, and contribute!
