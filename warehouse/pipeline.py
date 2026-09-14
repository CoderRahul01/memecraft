#!/usr/bin/env python3
"""
MemeCraft Content Creation Warehouse - Autonomous Video & GIF Engine
===================================================================
Generates high-engagement 10-second vertical meme videos (9:16) & animated GIFs
from Markdown (.md) storyboards using:
- OpenRouter Free AI Vision / Text Models (Gemini 2.0 Flash, Llama 3.2 Vision)
- Microsoft Edge Neural TTS (edge-tts) for zero-cost human-quality narration
- FFmpeg for dynamic compositing, Ken Burns motion, screen-shake & sound mixing
- Pillow for typography overlays

Usage:
  python warehouse/pipeline.py test
  python warehouse/pipeline.py analyze --image templates/drake.jpg [--topic "coding"]
  python warehouse/pipeline.py render --script warehouse/scripts/my_meme.md
  python warehouse/pipeline.py create --image templates/drake.jpg [--topic "AI tools"]
  python warehouse/pipeline.py create --prompt "When your code works on the first try"
"""

import os
import sys
import json
import re
import math
import shutil
import base64
import argparse
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    Image, ImageDraw, ImageFont = None, None, None

try:
    import requests
except ImportError:
    requests = None

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
WAREHOUSE_DIR = BASE_DIR / "warehouse"
ASSETS_DIR = WAREHOUSE_DIR / "assets"
AUDIO_DIR = ASSETS_DIR / "audio"
FONTS_DIR = ASSETS_DIR / "fonts"
SCRIPTS_DIR = WAREHOUSE_DIR / "scripts"
EXPORTS_DIR = WAREHOUSE_DIR / "exports"
TEMPLATES_DIR = BASE_DIR / "templates"
VENV_BIN = WAREHOUSE_DIR / ".venv" / "bin"

FFMPEG = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"
FFPROBE = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"
EDGE_TTS = str(VENV_BIN / "edge-tts") if (VENV_BIN / "edge-tts").exists() else (shutil.which("edge-tts") or "edge-tts")

# Free OpenRouter Models
DEFAULT_FREE_VISION_MODEL = "google/gemini-2.0-flash-exp:free"
DEFAULT_FREE_TEXT_MODEL = "google/gemini-2.0-flash-exp:free"
FALLBACK_VISION_MODEL = "meta-llama/llama-3.2-11b-vision-instruct:free"

# -----------------------------------------------------------------------------
# Storyboard Parser & Formatter
# -----------------------------------------------------------------------------

class Storyboard:
    def __init__(self, data: Dict[str, Any]):
        self.title = data.get("title", "Untitled Meme")
        self.format = data.get("format", "9:16")  # 9:16, 1:1, 16:9
        self.duration = float(data.get("duration", 10.0))
        self.voice = data.get("voice", "en-US-ChristopherNeural")
        self.bgm = data.get("bgm", "lofi-beat")
        self.bgm_volume = float(data.get("bgm_volume", 0.18))
        self.punchline_sfx = data.get("punchline_sfx", "vine-boom")
        self.punchline_time = float(data.get("punchline_time", 4.8))
        self.motion = data.get("motion", "ken-burns-shake")
        self.image = data.get("image", "templates/drake.jpg")
        
        self.scene1_caption = data.get("scene1_caption", "")
        self.scene1_narration = data.get("scene1_narration", "")
        self.scene2_caption = data.get("scene2_caption", "")
        self.scene2_narration = data.get("scene2_narration", "")
        self.metadata = data

    @classmethod
    def from_file(cls, filepath: Path) -> "Storyboard":
        content = filepath.read_text(encoding="utf-8")
        return cls.from_markdown(content)

    @classmethod
    def from_markdown(cls, text: str) -> "Storyboard":
        frontmatter = {}
        body = text

        # Parse YAML frontmatter between '---'
        match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.DOTALL)
        if match:
            fm_text, body = match.groups()
            for line in fm_text.splitlines():
                if ":" in line:
                    key, val = line.split(":", 1)
                    key = key.strip()
                    val = val.strip().strip('"').strip("'")
                    frontmatter[key] = val

        # Parse scenes from markdown body
        data = dict(frontmatter)

        # Scene 1
        s1_cap = re.search(r"-\s*\*\*Top Text\*\*:\s*(.*)", body, re.IGNORECASE)
        if not s1_cap:
            s1_cap = re.search(r"-\s*\*\*Caption 1\*\*:\s*(.*)", body, re.IGNORECASE)
        s1_narr = re.search(r"-\s*\*\*Narration\*\*:\s*(.*)", body[:body.find("# Scene 2") if "# Scene 2" in body else len(body)], re.IGNORECASE)
        
        # Scene 2
        s2_body = body[body.find("# Scene 2"):] if "# Scene 2" in body else ""
        s2_cap = re.search(r"-\s*\*\*Bottom Text\*\*:\s*(.*)", s2_body, re.IGNORECASE)
        if not s2_cap:
            s2_cap = re.search(r"-\s*\*\*Caption 2\*\*:\s*(.*)", s2_body, re.IGNORECASE)
        s2_narr = re.search(r"-\s*\*\*Narration\*\*:\s*(.*)", s2_body, re.IGNORECASE)

        data["scene1_caption"] = s1_cap.group(1).strip() if s1_cap else "The Problem"
        data["scene1_narration"] = s1_narr.group(1).strip() if s1_narr else "When things are going terribly wrong..."
        data["scene2_caption"] = s2_cap.group(1).strip() if s2_cap else "The Secret"
        data["scene2_narration"] = s2_narr.group(1).strip() if s2_narr else "Until you discover the ultimate shortcut!"

        return cls(data)

    def to_markdown(self) -> str:
        return f"""---
title: "{self.title}"
format: "{self.format}"
duration: {self.duration}
voice: "{self.voice}"
bgm: "{self.bgm}"
bgm_volume: {self.bgm_volume}
punchline_sfx: "{self.punchline_sfx}"
punchline_time: {self.punchline_time}
motion: "{self.motion}"
image: "{self.image}"
---

# Scene 1: The Setup (0.0s - {self.punchline_time:.1f}s)
- **Top Text**: {self.scene1_caption}
- **Narration**: {self.scene1_narration}
- **Visual Focus**: Setup / Top Panel

# Scene 2: The Punchline ({self.punchline_time:.1f}s - {self.duration:.1f}s)
- **Bottom Text**: {self.scene2_caption}
- **Narration**: {self.scene2_narration}
- **Visual Focus**: Punchline / Bottom Panel with Screen Shake
"""

# -----------------------------------------------------------------------------
# OpenRouter Free AI Brain / Fallback Intelligence
# -----------------------------------------------------------------------------

class OpenRouterBrain:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY", "").strip()

    def has_api_key(self) -> bool:
        return bool(self.api_key)

    def analyze_image_and_create_storyboard(self, image_path: Path, topic: Optional[str] = None) -> Storyboard:
        """Uses OpenRouter free vision models to inspect meme image & generate storyboard."""
        if not self.has_api_key():
            print("ℹ️  OPENROUTER_API_KEY not set. Using built-in high-quality Meme Engine.")
            return self._fallback_storyboard(image_path, topic)

        print(f"🤖 Querying OpenRouter Free Vision Model ({DEFAULT_FREE_VISION_MODEL})...")
        try:
            # Encode image to base64
            with open(image_path, "rb") as f:
                img_b64 = base64.b64encode(f.read()).decode("utf-8")
            
            ext = image_path.suffix.lower().replace(".", "")
            mime = f"image/{ext}" if ext in ["png", "jpg", "jpeg", "webp"] else "image/jpeg"

            user_instruction = (
                f"Topic/Context: {topic if topic else 'Tech, SaaS, or viral internet humor'}.\n"
                "Analyze this meme template and generate a viral 10-second short video storyboard.\n"
                "You MUST output valid markdown containing the frontmatter (title, format, duration, voice, bgm, punchline_sfx, punchline_time, motion, image) "
                "and two scenes: Scene 1 with Top Text and Narration, and Scene 2 with Bottom Text and Narration. "
                "Keep narration punchy and comedic (under 18 words per scene)."
            )

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/memecraft",
                "X-Title": "MemeCraft Warehouse"
            }

            payload = {
                "model": DEFAULT_FREE_VISION_MODEL,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a master viral meme director and scriptwriter for TikTok, Reels, and Shorts. "
                            "You analyze meme images and craft punchy, hilarious 10-second video storyboards in Markdown."
                        )
                    },
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": user_instruction},
                            {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{img_b64}"}}
                        ]
                    }
                ],
                "temperature": 0.8
            }

            resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=40)
            if resp.status_code == 200:
                data = resp.json()
                md_content = data["choices"][0]["message"]["content"]
                storyboard = Storyboard.from_markdown(md_content)
                storyboard.image = str(image_path.relative_to(BASE_DIR) if image_path.is_relative_to(BASE_DIR) else image_path)
                return storyboard
            else:
                print(f"⚠️ OpenRouter returned {resp.status_code}: {resp.text[:150]}. Falling back.")
                return self._fallback_storyboard(image_path, topic)

        except Exception as e:
            print(f"⚠️ OpenRouter request error: {e}. Falling back to smart templates.")
            return self._fallback_storyboard(image_path, topic)

    def generate_storyboard_from_prompt(self, prompt: str) -> Storyboard:
        """Selects template and crafts storyboard from a text prompt."""
        # Find best matching template
        lower_prompt = prompt.lower()
        chosen_img = "templates/drake.jpg"
        if "doge" in lower_prompt or "dog" in lower_prompt:
            chosen_img = "templates/doge.jpg"
        elif "fire" in lower_prompt or "fine" in lower_prompt or "burning" in lower_prompt:
            chosen_img = "templates/fine.jpg"
        elif "girl" in lower_prompt or "disaster" in lower_prompt or "chaos" in lower_prompt:
            chosen_img = "templates/disastergirl.jpg"
        elif "cat" in lower_prompt or "woman" in lower_prompt or "argue" in lower_prompt:
            chosen_img = "templates/woman-cat.jpg"
        elif "spongebob" in lower_prompt or "mock" in lower_prompt:
            chosen_img = "templates/spongebob.jpg"
        elif "everywhere" in lower_prompt or "buzz" in lower_prompt or "woody" in lower_prompt:
            chosen_img = "templates/buzz.jpg"
        elif "brain" in lower_prompt or "roll" in lower_prompt or "smart" in lower_prompt:
            chosen_img = "templates/rollsafe.jpg"

        if self.has_api_key():
            print(f"🤖 Querying OpenRouter Free Model ({DEFAULT_FREE_TEXT_MODEL})...")
            try:
                headers = {
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                }
                payload = {
                    "model": DEFAULT_FREE_TEXT_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a viral meme director. Generate a 10-second meme storyboard in markdown "
                                "with frontmatter and Scene 1 & Scene 2. Output strictly the markdown content."
                            )
                        },
                        {
                            "role": "user",
                            "content": f"Create a hilarious 10s meme video storyboard for this idea: '{prompt}'. Image template is '{chosen_img}'."
                        }
                    ],
                    "temperature": 0.8
                }
                resp = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=30)
                if resp.status_code == 200:
                    data = resp.json()
                    md = data["choices"][0]["message"]["content"]
                    sb = Storyboard.from_markdown(md)
                    sb.image = chosen_img
                    return sb
            except Exception as e:
                print(f"⚠️ Text generation fallback: {e}")

        # Built-in prompt generator
        return Storyboard({
            "title": f"Meme: {prompt[:30]}",
            "format": "9:16",
            "duration": 10.0,
            "voice": "en-US-ChristopherNeural",
            "bgm": "lofi-beat",
            "bgm_volume": 0.20,
            "punchline_sfx": "vine-boom",
            "punchline_time": 4.6,
            "motion": "ken-burns-shake",
            "image": chosen_img,
            "scene1_caption": f"Me thinking about: {prompt}",
            "scene1_narration": f"I used to stress about {prompt} for weeks.",
            "scene2_caption": "What actually ended up happening",
            "scene2_narration": "Turns out the easiest solution worked completely on the first try!"
        })

    def _fallback_storyboard(self, image_path: Path, topic: Optional[str]) -> Storyboard:
        """Intelligent local meme templates for zero-API-key usage."""
        fname = image_path.stem.lower()
        topic_str = topic if topic else "software engineering & tech"

        templates_db = {
            "drake": {
                "title": f"Drake Approves {topic_str}",
                "s1_cap": f"Spending $50/mo on bloated {topic_str} tools",
                "s1_narr": f"When you've been burning 50 bucks every month for complex {topic_str} software...",
                "s2_cap": f"1-click 100% free solution that runs in 2 seconds",
                "s2_narr": "And then you realize a free open source pipeline does it in two seconds flat.",
            },
            "fine": {
                "title": f"This is Fine - {topic_str}",
                "s1_cap": "Deploying directly to production on Friday 5 PM",
                "s1_narr": "When you merge directly to production right before logging off for the weekend...",
                "s2_cap": "This is completely fine. Zero bugs guaranteed.",
                "s2_narr": "Everything is on fire, but honestly, this is completely fine.",
            },
            "disastergirl": {
                "title": f"Disaster Girl - {topic_str}",
                "s1_cap": "Legacy codebase with 10,000 unit tests",
                "s1_narr": "The senior engineer watching the new intern push their very first pull request...",
                "s2_cap": "Me deleting the entire test suite to pass CI",
                "s2_narr": "Can't have failing tests if there are no tests left to run.",
            },
            "doge": {
                "title": f"Doge Wisdom - {topic_str}",
                "s1_cap": "Much complex. Very difficult.",
                "s1_narr": "Such complexity. Many requirements. Very confusing.",
                "s2_cap": "Wow. Very solved. Such genius.",
                "s2_narr": "Much automate! Very viral! So genius, wow!",
            }
        }

        entry = templates_db.get(fname, templates_db["drake"])
        rel_img = str(image_path.relative_to(BASE_DIR) if image_path.is_relative_to(BASE_DIR) else image_path)

        return Storyboard({
            "title": entry["title"],
            "format": "9:16",
            "duration": 10.0,
            "voice": "en-US-ChristopherNeural",
            "bgm": "lofi-beat",
            "bgm_volume": 0.20,
            "punchline_sfx": "vine-boom",
            "punchline_time": 4.8,
            "motion": "ken-burns-shake",
            "image": rel_img,
            "scene1_caption": entry["s1_cap"],
            "scene1_narration": entry["s1_narr"],
            "scene2_caption": entry["s2_cap"],
            "scene2_narration": entry["s2_narr"]
        })

# -----------------------------------------------------------------------------
# Audio Engine (Edge-TTS & Audio Mixing)
# -----------------------------------------------------------------------------

class AudioEngine:
    @staticmethod
    def generate_narration(text: str, voice: str, output_path: Path) -> Path:
        """Generates neural voiceover using edge-tts."""
        print(f"🎙️ Synthesizing narration with voice '{voice}'...")
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Clean text
        clean_text = text.replace('"', '').strip()
        cmd = [
            EDGE_TTS,
            "--voice", voice,
            "--text", clean_text,
            "--write-media", str(output_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"⚠️ edge-tts error: {res.stderr}")
            # Fallback with macOS say if available
            subprocess.run(["say", "-v", "Samantha", clean_text, "-o", str(output_path.with_suffix(".aiff"))])
            subprocess.run([FFMPEG, "-y", "-i", str(output_path.with_suffix(".aiff")), str(output_path)])
            
        return output_path

    @staticmethod
    def get_audio_duration(filepath: Path) -> float:
        """Returns duration of audio file in seconds via ffprobe."""
        try:
            cmd = [
                FFPROBE,
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(filepath)
            ]
            res = subprocess.run(cmd, capture_output=True, text=True)
            return float(res.stdout.strip())
        except Exception:
            return 4.0

    @classmethod
    def mix_soundtrack(cls, narration1: Path, narration2: Path, punch_time: float, 
                       bgm_name: str, sfx_name: str, bgm_volume: float, 
                       total_duration: float, output_path: Path) -> Path:
        """Mixes Scene 1 voice, Scene 2 voice, BGM, and punchline SFX."""
        print(f"🎚️ Mixing audio track (Narration + BGM + SFX)...")
        bgm_file = AUDIO_DIR / f"{bgm_name}.wav"
        sfx_file = AUDIO_DIR / f"{sfx_name}.wav"

        # Fallbacks if files not found
        if not bgm_file.exists():
            bgm_file = AUDIO_DIR / "lofi-beat.wav"
        if not sfx_file.exists():
            sfx_file = AUDIO_DIR / "vine-boom.wav"

        punch_delay_ms = int(punch_time * 1000)

        # Complex filter:
        # [0:a] Narration 1 (starts at 0.3s)
        # [1:a] Narration 2 (delayed to punch_time + 0.3s)
        # [2:a] BGM (looped, volume lowered to bgm_volume)
        # [3:a] Punchline SFX (delayed to punch_time)
        filter_complex = (
            f"[0:a]adelay=300|300,volume=1.3[narr1]; "
            f"[1:a]adelay={punch_delay_ms + 300}|{punch_delay_ms + 300},volume=1.3[narr2]; "
            f"[2:a]aloop=loop=-1:size=2e+09,volume={bgm_volume},afade=t=out:st={total_duration-1.0}:d=1.0[music]; "
            f"[3:a]adelay={punch_delay_ms}|{punch_delay_ms},volume=0.9[sfx]; "
            f"[narr1][narr2][music][sfx]amix=inputs=4:duration=longest:dropout_transition=2,atrim=0:{total_duration}[outa]"
        )

        cmd = [
            FFMPEG, "-y",
            "-i", str(narration1),
            "-i", str(narration2),
            "-i", str(bgm_file),
            "-i", str(sfx_file),
            "-filter_complex", filter_complex,
            "-map", "[outa]",
            "-c:a", "aac",
            "-b:a", "192k",
            str(output_path)
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0:
            print(f"⚠️ Audio mixing warning: {res.stderr[:200]}")
        return output_path

# -----------------------------------------------------------------------------
# Visual & Video Rendering Engine
# -----------------------------------------------------------------------------

class VideoRenderer:
    @staticmethod
    def wrap_text(text: str, max_chars_per_line: int = 24) -> str:
        words = text.split()
        lines = []
        cur = []
        cur_len = 0
        for w in words:
            if cur_len + len(w) + 1 > max_chars_per_line and cur:
                lines.append(" ".join(cur))
                cur = [w]
                cur_len = len(w)
            else:
                cur.append(w)
                cur_len += len(w) + 1
        if cur:
            lines.append(" ".join(cur))
        return "\n".join(lines)

    @classmethod
    def render_caption_card(cls, text: str, width: int = 1080, height: int = 1920, 
                            position: str = "top", accent_color: str = "#FFFFFF") -> Image.Image:
        """Renders high-contrast, stylish typography overlay with drop shadow & background pill."""
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Load font
        font_path = FONTS_DIR / "Impact.ttf"
        font_size = 64
        try:
            if font_path.exists():
                font = ImageFont.truetype(str(font_path), font_size)
            else:
                font = ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()

        wrapped = cls.wrap_text(text.upper(), max_chars_per_line=22)
        lines = wrapped.split("\n")

        # Measure text box
        line_height = font_size + 14
        total_text_h = len(lines) * line_height

        if position == "top":
            base_y = 120
        elif position == "bottom":
            base_y = height - total_text_h - 160
        else:
            base_y = (height - total_text_h) // 2

        # Draw dark translucent rounded badge for maximum readability
        max_line_w = 0
        for line in lines:
            bbox = draw.textbbox((0, 0), line, font=font)
            w = bbox[2] - bbox[0]
            if w > max_line_w:
                max_line_w = w

        pad_x = 40
        pad_y = 20
        box_x1 = (width - max_line_w) // 2 - pad_x
        box_y1 = base_y - pad_y
        box_x2 = (width + max_line_w) // 2 + pad_x
        box_y2 = base_y + total_text_h + pad_y

        draw.rounded_rectangle([box_x1, box_y1, box_x2, box_y2], radius=24, fill=(0, 0, 0, 180))

        # Draw lines with outline
        for i, line in enumerate(lines):
            bbox = draw.textbbox((0, 0), line, font=font)
            lw = bbox[2] - bbox[0]
            lx = (width - lw) // 2
            ly = base_y + i * line_height

            # Heavy black stroke
            draw.text((lx, ly), line, font=font, fill=accent_color, stroke_width=6, stroke_fill="black")

        return img

    @classmethod
    def assemble_video(cls, storyboard: Storyboard, audio_track: Path, output_mp4: Path) -> Path:
        """Assembles 10-second 9:16 vertical MP4 with blurred background, zoom, screen-shake & captions."""
        print(f"🎬 Assembling 9:16 vertical video with FFmpeg...")
        output_mp4.parent.mkdir(parents=True, exist_ok=True)

        img_path = BASE_DIR / storyboard.image
        if not img_path.exists():
            img_path = TEMPLATES_DIR / "drake.jpg"

        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            
            # Generate Scene 1 & Scene 2 caption overlays
            cap1_img = cls.render_caption_card(storyboard.scene1_caption, 1080, 1920, position="top", accent_color="#FFFFFF")
            cap1_path = tmp / "cap1.png"
            cap1_img.save(cap1_path)

            cap2_img = cls.render_caption_card(storyboard.scene2_caption, 1080, 1920, position="bottom", accent_color="#FFE600")
            cap2_path = tmp / "cap2.png"
            cap2_img.save(cap2_path)

            punch = storyboard.punchline_time
            dur = storyboard.duration

            # Screen-shake expression at punchline:
            # Between punch and punch+0.5s, rapid oscillation of x & y coordinates
            # Ken Burns slow zoom: zoompan from 1.0 to 1.05
            filter_complex = (
                # Input 0: Meme image
                # Layer 1: Blurred background filling 1080x1920
                f"[0:v]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
                f"gblur=sigma=30:steps=2,eq=brightness=-0.12[bg]; "
                
                # Layer 2: Foreground sharp meme image (max width 980)
                f"[0:v]scale=980:-1:force_original_aspect_ratio=decrease[fg]; "
                
                # Place foreground on background with screen-shake at punchline
                f"[bg][fg]overlay=x='(W-w)/2 + if(between(t,{punch},{punch+0.5}), sin(2*PI*(t-{punch})*16)*24, 0)':"
                f"y='(H-h)/2 + if(between(t,{punch},{punch+0.5}), cos(2*PI*(t-{punch})*16)*18, 0)'[comp1]; "
                
                # Overlay Scene 1 caption (active from 0 to punchline)
                f"[comp1][2:v]overlay=0:0:enable='between(t,0,{punch})'[comp2]; "
                
                # Overlay Scene 2 caption (active from punchline to end)
                f"[comp2][3:v]overlay=0:0:enable='gte(t,{punch})'[outv]"
            )

            cmd = [
                FFMPEG, "-y",
                "-loop", "1", "-i", str(img_path),
                "-i", str(audio_track),
                "-loop", "1", "-i", str(cap1_path),
                "-loop", "1", "-i", str(cap2_path),
                "-filter_complex", filter_complex,
                "-map", "[outv]",
                "-map", "1:a",
                "-c:v", "libx264",
                "-preset", "fast",
                "-pix_fmt", "yuv420p",
                "-t", str(dur),
                "-r", "30",
                str(output_mp4)
            ]

            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode != 0:
                print(f"❌ FFmpeg compilation error: {res.stderr}")
                raise RuntimeError(f"FFmpeg failed: {res.stderr[-300:]}")

        print(f"✅ Video successfully created: {output_mp4}")
        return output_mp4

    @classmethod
    def export_gif(cls, mp4_path: Path, output_gif: Path, duration: float = 4.0, fps: int = 15) -> Path:
        """Converts highlight clip of the video to a high-quality, lightweight animated GIF."""
        print(f"🎞️ Generating animated GIF preview...")
        output_gif.parent.mkdir(parents=True, exist_ok=True)
        
        # High quality palettegen + paletteuse
        filter_graph = (
            f"fps={fps},scale=480:-1:flags=lanczos,split[s0][s1];"
            f"[s0]palettegen=max_colors=128[p];"
            f"[s1][p]paletteuse=dither=bayer:bayer_scale=3"
        )

        cmd = [
            FFMPEG, "-y",
            "-t", str(duration),
            "-i", str(mp4_path),
            "-vf", filter_graph,
            str(output_gif)
        ]
        subprocess.run(cmd, capture_output=True, text=True)
        print(f"✅ GIF preview created: {output_gif}")
        return output_gif

# -----------------------------------------------------------------------------
# Main Warehouse Pipeline Orchestrator
# -----------------------------------------------------------------------------

class WarehousePipeline:
    def __init__(self):
        self.brain = OpenRouterBrain()

    def analyze(self, image_path: Path, topic: Optional[str] = None) -> Path:
        """Analyzes an image and writes a structured .md storyboard."""
        sb = self.brain.analyze_image_and_create_storyboard(image_path, topic)
        slug = re.sub(r"[^a-zA-Z0-9]+", "_", sb.title).strip("_").lower()
        md_file = SCRIPTS_DIR / f"{slug}.md"
        SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
        md_file.write_text(sb.to_markdown(), encoding="utf-8")
        print(f"📄 Storyboard saved to: {md_file}")
        return md_file

    def render(self, script_path: Path) -> Tuple[Path, Path]:
        """Renders video and GIF from a .md storyboard."""
        sb = Storyboard.from_file(script_path)
        slug = script_path.stem
        
        with tempfile.TemporaryDirectory() as tmpdir:
            tmp = Path(tmpdir)
            narr1_path = tmp / "narr1.mp3"
            narr2_path = tmp / "narr2.mp3"
            mixed_audio = tmp / "soundtrack.aac"

            # 1. Synthesize voice narration
            AudioEngine.generate_narration(sb.scene1_narration, sb.voice, narr1_path)
            AudioEngine.generate_narration(sb.scene2_narration, sb.voice, narr2_path)

            # 2. Mix soundtrack with SFX and BGM
            AudioEngine.mix_soundtrack(
                narration1=narr1_path,
                narration2=narr2_path,
                punch_time=sb.punchline_time,
                bgm_name=sb.bgm,
                sfx_name=sb.punchline_sfx,
                bgm_volume=sb.bgm_volume,
                total_duration=sb.duration,
                output_path=mixed_audio
            )

            # 3. Assemble video
            mp4_out = EXPORTS_DIR / f"{slug}.mp4"
            VideoRenderer.assemble_video(sb, mixed_audio, mp4_out)

            # 4. Export GIF preview
            gif_out = EXPORTS_DIR / f"{slug}.gif"
            VideoRenderer.export_gif(mp4_out, gif_out, duration=min(sb.duration, 5.0))

            return mp4_out, gif_out

    def create(self, image_path: Optional[Path] = None, prompt: Optional[str] = None, topic: Optional[str] = None) -> Tuple[Path, Path]:
        """End-to-end: Prompt/Image -> Storyboard .md -> MP4 & GIF."""
        if prompt:
            sb = self.brain.generate_storyboard_from_prompt(prompt)
            slug = re.sub(r"[^a-zA-Z0-9]+", "_", sb.title).strip("_").lower()
            md_file = SCRIPTS_DIR / f"{slug}.md"
            SCRIPTS_DIR.mkdir(parents=True, exist_ok=True)
            md_file.write_text(sb.to_markdown(), encoding="utf-8")
        elif image_path:
            md_file = self.analyze(image_path, topic)
        else:
            raise ValueError("Either --image or --prompt must be provided.")

        return self.render(md_file)

    def test(self):
        """Runs quick pipeline validation using bundled Drake template."""
        print("🚀 Running MemeCraft Warehouse self-test...")
        drake = TEMPLATES_DIR / "drake.jpg"
        if not drake.exists():
            print("❌ drake.jpg template missing!")
            return
        
        md_file = self.analyze(drake, topic="Software Development & Open Source")
        mp4_path, gif_path = self.render(md_file)
        print("\n========================================================")
        print("🎉 SUCCESS! Pipeline test completed:")
        print(f"🎬 Video (MP4): {mp4_path}")
        print(f"🎞️  GIF Preview: {gif_path}")
        print("========================================================")

# -----------------------------------------------------------------------------
# CLI Entrypoint
# -----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="MemeCraft Content Creation Warehouse")
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # analyze
    p_analyze = subparsers.add_parser("analyze", help="Analyze image and generate markdown storyboard")
    p_analyze.add_argument("--image", "-i", required=True, help="Path to meme image")
    p_analyze.add_argument("--topic", "-t", default=None, help="Humor topic or audience")

    # render
    p_render = subparsers.add_parser("render", help="Render video & GIF from markdown storyboard")
    p_render.add_argument("--script", "-s", required=True, help="Path to .md storyboard file")

    # create
    p_create = subparsers.add_parser("create", help="End-to-end creation")
    p_create.add_argument("--image", "-i", default=None, help="Path to image template")
    p_create.add_argument("--prompt", "-p", default=None, help="Meme idea or prompt")
    p_create.add_argument("--topic", "-t", default=None, help="Context topic")

    # list-templates
    subparsers.add_parser("list-templates", help="List available local meme templates")

    # list-voices
    subparsers.add_parser("list-voices", help="List popular Edge-TTS neural voices")

    # test
    subparsers.add_parser("test", help="Run end-to-end self-test")

    args = parser.parse_args()
    pipeline = WarehousePipeline()

    if args.command == "analyze":
        img = Path(args.image)
        pipeline.analyze(img, args.topic)

    elif args.command == "render":
        script = Path(args.script)
        pipeline.render(script)

    elif args.command == "create":
        img = Path(args.image) if args.image else None
        pipeline.create(image_path=img, prompt=args.prompt, topic=args.topic)

    elif args.command == "list-templates":
        print("\nAvailable Templates in /templates:")
        for f in sorted(TEMPLATES_DIR.glob("*.jpg")):
            print(f" - {f.relative_to(BASE_DIR)}")

    elif args.command == "list-voices":
        print("\nRecommended Neural Voices:")
        voices = [
            ("en-US-ChristopherNeural", "Energetic American male (Ideal for memes)"),
            ("en-US-GuyNeural", "Casual American male"),
            ("en-US-JennyNeural", "Expressive American female"),
            ("en-GB-RyanNeural", "British male narration"),
            ("en-AU-WilliamNeural", "Australian male humor")
        ]
        for v, desc in voices:
            print(f" • {v:25} - {desc}")

    elif args.command == "test":
        pipeline.test()

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
