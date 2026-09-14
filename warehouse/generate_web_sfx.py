"""
Generate complete soundboard assets for MemeCraft Web Studio into assets/audio/
Includes:
- Laugh track (crowd giggles and chuckle bursts)
- Bruh sound effect (resonant vocal formant hit)
- Whoosh transition sound (whip pan transition)
- Vine boom, record scratch, dramatic hit, bell ping, lofi beat
"""
import math
import wave
import struct
import random
import os
import shutil

SAMPLE_RATE = 44100
ROOT_DIR = os.path.dirname(os.path.dirname(__file__))
OUT_DIR = os.path.join(ROOT_DIR, "assets", "audio")
os.makedirs(OUT_DIR, exist_ok=True)

def write_wav(filename, samples):
    with wave.open(filename, 'w') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(SAMPLE_RATE)
        raw = bytearray()
        for s in samples:
            s_clamped = max(-1.0, min(1.0, s))
            val = int(s_clamped * 32767.0)
            raw.extend(struct.pack('<h', val))
        wav.writeframes(raw)
    print(f"✅ Created: {filename} ({len(samples)/SAMPLE_RATE:.2f}s)")

def make_whoosh(filepath):
    # Dynamic camera whip transition whoosh (0.35s)
    duration = 0.35
    n = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Envelope rises and falls symmetrically
        env = math.sin(math.pi * (t / duration)) ** 2.0
        # White noise
        noise = (random.random() * 2.0 - 1.0)
        # Sweeping low-pass / bandpass tone
        center_freq = 300.0 + 1200.0 * math.sin(math.pi * (t / duration))
        tone = math.sin(2.0 * math.pi * center_freq * t)
        val = (noise * 0.7 + tone * 0.4) * env
        samples.append(val)
    write_wav(filepath, samples)

def make_bruh(filepath):
    # Iconic deep resonant 'bruh' vocal punch (~0.7s)
    duration = 0.7
    n = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Vocal pitch glide from 135Hz down to 80Hz
        f0 = 80.0 + 55.0 * math.exp(-t * 4.0)
        phase0 = 2.0 * math.pi * (80.0 * t - (55.0 / 4.0) * math.exp(-t * 4.0))
        
        # Vocal formants for 'uh' sound (~500Hz and ~1050Hz)
        formant1 = math.sin(phase0 * (500.0 / f0)) * 0.5
        formant2 = math.sin(phase0 * (1050.0 / f0)) * 0.3
        sub = math.sin(phase0) * 0.8
        
        # Attack and release
        if t < 0.05:
            env = t / 0.05
        else:
            env = math.exp(-(t - 0.05) * 3.2)
            
        val = (sub + formant1 + formant2) * env
        val = math.tanh(val * 1.5)  # Saturation warmth
        samples.append(val)
    write_wav(filepath, samples)

def make_laugh_track(filepath):
    # Realistic sitcom audience chuckle & laugh burst (~2.6s)
    duration = 2.6
    n = int(SAMPLE_RATE * duration)
    samples = [0.0] * n
    
    # Layer 5 distinct laughter voices with differing pitches and rhythms
    voices = [
        {"base_f": 260.0, "rate": 5.2, "offset": 0.0, "amp": 0.35},
        {"base_f": 320.0, "rate": 6.1, "offset": 0.15, "amp": 0.30},
        {"base_f": 210.0, "rate": 4.8, "offset": 0.25, "amp": 0.32},
        {"base_f": 380.0, "rate": 6.8, "offset": 0.35, "amp": 0.22},
        {"base_f": 180.0, "rate": 4.2, "offset": 0.40, "amp": 0.28},
    ]
    
    for v in voices:
        start_sample = int(v["offset"] * SAMPLE_RATE)
        v_dur = duration - v["offset"]
        v_samples = int(v_dur * SAMPLE_RATE)
        for i in range(v_samples):
            idx = start_sample + i
            if idx >= n:
                break
            t = i / SAMPLE_RATE
            # Staccato "ha-ha-ha" pulse modulation
            pulse = (math.sin(2.0 * math.pi * v["rate"] * t) + 1.0) * 0.5
            pulse = pulse ** 3.0  # Sharp chuckle pulses
            
            # Vocal pitch
            f = v["base_f"] + 25.0 * math.sin(2.0 * math.pi * 2.5 * t)
            tone = math.sin(2.0 * math.pi * f * t) + 0.3 * math.sin(2.0 * math.pi * f * 2.0 * t)
            
            # Breathiness / chuckle noise
            breath = (random.random() * 2.0 - 1.0) * 0.3
            
            # Overall rise and fall envelope
            overall_env = math.sin(math.pi * (t / v_dur)) ** 1.3
            val = (tone * 0.7 + breath) * pulse * overall_env * v["amp"]
            samples[idx] += val
            
    # Normalize gently
    max_amp = max(abs(s) for s in samples) or 1.0
    samples = [s / max_amp * 0.85 for s in samples]
    write_wav(filepath, samples)

if __name__ == "__main__":
    src_dir = os.path.join(ROOT_DIR, "warehouse", "assets", "audio")
    # Copy existing synthesized SFX
    for fname in ["vine-boom.wav", "record-scratch.wav", "dramatic-hit.wav", "bell-ping.wav", "lofi-beat.wav"]:
        src = os.path.join(src_dir, fname)
        dst = os.path.join(OUT_DIR, fname)
        if os.path.exists(src):
            shutil.copyfile(src, dst)
            print(f"Copied: {fname}")
            
    # Generate new sound effects
    make_whoosh(os.path.join(OUT_DIR, "whoosh.wav"))
    make_bruh(os.path.join(OUT_DIR, "bruh.wav"))
    make_laugh_track(os.path.join(OUT_DIR, "laugh-track.wav"))
    print("\n🎉 All 8 web sound assets generated in assets/audio/!")
