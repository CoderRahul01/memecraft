# 🎬 MemeCraft Content Creation Warehouse

An autonomous, zero-cost pipeline that transforms meme images and ideas into viral **10-second vertical videos (9:16 for TikTok, Shorts, Reels)** and **animated GIFs** driven entirely by **Markdown (`.md`) storyboards**.

---

## ✨ Features

- **Decoupled Architecture**: 100% separated from the frontend web application. Runs locally via CLI or automated queue.
- **Markdown-Driven Storyboards**: The LLM reads and writes simple, clean `.md` files. You can hand-tune captions, punchline timestamps, voices, and audio cues in seconds.
- **100% Free AI Vision & Generation**: Connects to OpenRouter free models (`google/gemini-2.0-flash-exp:free`, `meta-llama/llama-3.2-11b-vision-instruct:free`). Also works out of the box with zero API keys via built-in meme intelligence.
- **Zero-Cost Neural Narration**: Uses Microsoft Edge Neural TTS (`edge-tts`) for ultra-realistic, expressive voiceovers.
- **Dynamic Video Compositing**:
  - Blurred 1080x1920 vertical background filling.
  - Centered meme image with smooth Ken Burns drift.
  - **Screen-shake effect** synced to the punchline impact (`vine-boom.wav`).
  - High-readability stylized typography cards rendered at 60fps.
  - Generates both full 1080x1920 MP4 video and lightweight animated GIF preview.

---

## 🚀 Quick Start

### 1. Run the Self-Test
Render a 10-second video and animated GIF in ~5 seconds:
```bash
warehouse/.venv/bin/python warehouse/pipeline.py test
```
Outputs are saved directly to `warehouse/exports/`.

---

### 2. Connect Free OpenRouter Models (Optional)
To have AI analyze any custom image or brainstorm jokes using free models:
```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```
*(Or create a `.env` file in the project root with `OPENROUTER_API_KEY=your_key`)*.

---

### 3. CLI Commands

#### A. Generate Directly from an Idea / Prompt
```bash
warehouse/.venv/bin/python warehouse/pipeline.py create --prompt "When you push directly to production on Friday afternoon"
```

#### B. Analyze an Image into a Markdown Storyboard
```bash
warehouse/.venv/bin/python warehouse/pipeline.py analyze --image templates/drake.jpg --topic "AI video generation"
```
This generates a markdown file in `warehouse/scripts/drake_approves_ai_video_generation.md`.

#### C. Render from a Markdown Storyboard
Edit your `.md` file, then compile it into video + GIF:
```bash
warehouse/.venv/bin/python warehouse/pipeline.py render --script warehouse/scripts/drake_approves_ai_video_generation.md
```

#### D. List Available Templates & Neural Voices
```bash
warehouse/.venv/bin/python warehouse/pipeline.py list-templates
warehouse/.venv/bin/python warehouse/pipeline.py list-voices
```

---

## 📝 Markdown Storyboard Specification

Every storyboard is a human-readable and LLM-friendly `.md` file:

```markdown
---
title: "Drake Approves Free Tools"
format: "9:16"
duration: 10.0
voice: "en-US-ChristopherNeural"
bgm: "lofi-beat"
bgm_volume: 0.20
punchline_sfx: "vine-boom"
punchline_time: 4.8
motion: "ken-burns-shake"
image: "templates/drake.jpg"
---

# Scene 1: The Setup (0.0s - 4.8s)
- **Top Text**: Spending $50/mo on bloated AI video SaaS
- **Narration**: When you've been paying fifty dollars every single month for slow video tools...
- **Visual Focus**: Setup / Top Panel

# Scene 2: The Punchline (4.8s - 10.0s)
- **Bottom Text**: 1-click free pipeline that runs in 2 seconds
- **Narration**: And then you realize a free local script generates viral shorts in two seconds flat.
- **Visual Focus**: Punchline / Bottom Panel with Screen Shake
```

### Available Customizations:
- **`voice`**: `en-US-ChristopherNeural` (energetic), `en-US-GuyNeural` (casual), `en-US-JennyNeural` (expressive female), `en-GB-RyanNeural` (British).
- **`punchline_sfx`**: `vine-boom`, `record-scratch`, `dramatic-hit`, `bell-ping`.
- **`bgm`**: `lofi-beat`.
- **`punchline_time`**: Timestamp in seconds where the video punches in, screen shakes, and drops the SFX.

---

## 📂 Directory Structure

```
warehouse/
├── assets/
│   ├── audio/           # Synthesized SFX (vine-boom, record-scratch, lofi beat)
│   └── fonts/           # Bundled meme typography (Impact.ttf)
├── exports/             # Rendered MP4s and animated GIFs (git-ignored)
├── scripts/             # Generated & editable Markdown storyboards
├── templates/           # Storyboard structure templates
├── .venv/               # Isolated virtual environment (git-ignored)
├── generate_sfx.py      # Audio SFX synthesizer (zero dependencies)
├── pipeline.py          # Main CLI orchestrator & renderer
└── README.md            # Documentation
```
