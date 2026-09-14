# MemeCraft

> 🚀 **Live Production Site:** [https://coderrahul01.github.io/memecraft/](https://coderrahul01.github.io/memecraft/)

A modern, distraction-free meme studio & autonomous video creation engine built with vanilla HTML, CSS, and JavaScript. 100% client-side, ultra-fast, and privacy-friendly.

---

## ✨ Web Studio Features

- **10 Bundled Offline Templates**: Drake, Cat Yelling, This is Fine, Disaster Girl, Doge, Mocking Spongebob, Roll Safe, Futurama Fry, Change My Mind, and Buzz Everywhere.
- **Custom Images & Clipboard Paste**: Upload files, drag-and-drop directly onto the canvas, or paste from your clipboard (<kbd>⌘V</kbd> / <kbd>Ctrl+V</kbd>).
- **Multi-Layer Image & Logo Overlays**: Add secondary stickers, watermarks, brand logos with live drag, resize, and horizontal flip.
- **Freehand Marker**: Draw directly over memes with variable brush size and vibrant color palette.
- **Multi-Text Freeform Dragging**: Touch-optimized pointer events (`touch-action: none`) for flawless mobile and desktop dragging.
- **Fonts & High-Visibility Styles**:
  - **4 Font Families**: Impact, Inter, Comic Neue, Courier New.
  - **3 Text Colors**: White outline, Yellow subtitle style, and Black inverted.
- **1-Click Template Flip**: Flip base templates horizontally.
- **Social Aspect Ratios**: Original, 1:1 Square (Instagram/Twitter), 16:9 Wide (YouTube thumbnails), and 9:16 Story (TikTok/Shorts/Reels).
- **Instant Export**: 1-click PNG download or direct clipboard copy.

---

## 🎬 Autonomous Content Creation Warehouse

Located in `warehouse/`, a decoupled CLI engine that turns meme ideas and templates into viral **10-second vertical videos (9:16)** and **animated GIFs** driven by **Markdown (`.md`) storyboards**:

- **Markdown-Driven Storyboards**: Script setup & punchline in `.md`.
- **OpenRouter Free AI Vision**: Analyze memes using free Gemini 2.0 Flash or Llama 3.2 Vision.
- **Edge Neural Narration**: Ultra-expressive human-sounding voiceovers.
- **Dynamic FFmpeg Compositing**: Blurred 9:16 background, Ken Burns drift, punchline screen shake, and synthesized audio SFX (`vine-boom.wav`, `record-scratch.wav`, `lofi-beat.wav`).

### Quick CLI Usage:
```bash
# Test rendering
warehouse/.venv/bin/python warehouse/pipeline.py test

# Create from prompt
warehouse/.venv/bin/python warehouse/pipeline.py create --prompt "When your code compiles on the first try"
```

---

## 🏃 Running Locally

Open `index.html` directly in any browser, or start a local dev server:

```sh
python3 -m http.server 8085
```

---

## 📄 License

MIT
