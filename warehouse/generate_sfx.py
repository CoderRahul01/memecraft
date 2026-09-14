"""
Synthesizes base meme sound effects using Python standard library (math, wave, struct, random).
No third-party packages required!
"""
import math
import wave
import struct
import random
import os

SAMPLE_RATE = 44100

def write_wav(filename, samples):
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with wave.open(filename, 'w') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        # Clamp and convert to 16-bit PCM
        raw_data = bytearray()
        for s in samples:
            s_clamped = max(-1.0, min(1.0, s))
            val = int(s_clamped * 32767.0)
            raw_data.extend(struct.pack('<h', val))
        wav_file.writeframes(raw_data)
    print(f"Generated: {filename} ({len(samples) / SAMPLE_RATE:.2f}s)")

def make_vine_boom(filepath):
    # Deep sub-bass drop with punch and decay (~1.8s)
    duration = 1.8
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Exponential pitch drop from 110Hz to 38Hz
        freq = 38.0 + 72.0 * math.exp(-t * 3.5)
        # Sine wave + saturation harmonic
        phase = 2.0 * math.pi * (38.0 * t - (72.0 / 3.5) * math.exp(-t * 3.5))
        sine = math.sin(phase)
        sub = math.sin(phase * 0.5) * 0.4
        
        # Click attack in the first 10ms
        attack = 0.0
        if t < 0.03:
            attack = (random.random() * 2.0 - 1.0) * (1.0 - t / 0.03) * 0.8
            
        # Amplitude envelope
        env = math.exp(-t * 2.2)
        val = (sine * 0.8 + sub + attack) * env
        # Slight soft clipping
        val = math.tanh(val * 1.6)
        samples.append(val)
    
    write_wav(filepath, samples)

def make_record_scratch(filepath):
    # Vinyl scratch sound (~0.55s)
    duration = 0.55
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Pitch oscillation
        mod = math.sin(2.0 * math.pi * 7.0 * t)
        freq = 350.0 + 400.0 * (1.0 - t / duration) + mod * 120.0
        noise = (random.random() * 2.0 - 1.0) * 0.4
        tone = math.sin(2.0 * math.pi * freq * t) * 0.6
        env = math.sin(math.pi * (t / duration)) ** 1.5
        val = (noise + tone) * env
        samples.append(val)
        
    write_wav(filepath, samples)

def make_dramatic_hit(filepath):
    # Minor triad suspense hit with sub impact (~2.0s)
    duration = 2.0
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    # C minor chord (C3=130.8Hz, Eb3=155.56Hz, G3=196.0Hz)
    chord = [65.4, 130.81, 155.56, 196.0, 311.13]
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        val = 0.0
        for f in chord:
            val += math.sin(2.0 * math.pi * f * t) * (1.0 / len(chord))
        
        # Low punch impact
        impact = math.sin(2.0 * math.pi * (55.0 * math.exp(-t * 4.0)) * t) * math.exp(-t * 6.0)
        env = math.exp(-t * 1.8)
        val = math.tanh((val * 0.7 + impact * 0.8) * env * 1.5)
        samples.append(val)
        
    write_wav(filepath, samples)

def make_bell_ping(filepath):
    # High crisp ding/ping (~1.2s)
    duration = 1.2
    num_samples = int(SAMPLE_RATE * duration)
    samples = []
    f1, f2 = 1760.0, 2637.0  # A6 and E7
    
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        val = (math.sin(2.0 * math.pi * f1 * t) * 0.6 + 
               math.sin(2.0 * math.pi * f2 * t) * 0.4)
        env = math.exp(-t * 4.0)
        samples.append(val * env * 0.8)
        
    write_wav(filepath, samples)

def make_lofi_beat(filepath):
    # 10-second looping chill/upbeat lofi-style background beat
    duration = 10.0
    num_samples = int(SAMPLE_RATE * duration)
    samples = [0.0] * num_samples
    
    bpm = 100.0
    beat_dur = 60.0 / bpm
    total_beats = int(duration / beat_dur)
    
    # Render kick & snare rhythm
    for b in range(total_beats):
        beat_time = b * beat_dur
        start_idx = int(beat_time * SAMPLE_RATE)
        
        # Kick on beats 0, 2
        if b % 2 == 0:
            kick_dur = 0.25
            for i in range(min(int(kick_dur * SAMPLE_RATE), num_samples - start_idx)):
                t = i / SAMPLE_RATE
                f = 110.0 * math.exp(-t * 18.0) + 40.0
                k_val = math.sin(2.0 * math.pi * f * t) * math.exp(-t * 14.0)
                samples[start_idx + i] += k_val * 0.6
                
        # Snare on beats 1, 3
        if b % 2 == 1:
            snare_dur = 0.2
            for i in range(min(int(snare_dur * SAMPLE_RATE), num_samples - start_idx)):
                t = i / SAMPLE_RATE
                noise = (random.random() * 2.0 - 1.0) * math.exp(-t * 16.0)
                body = math.sin(2.0 * math.pi * 180.0 * t) * math.exp(-t * 22.0)
                samples[start_idx + i] += (noise * 0.5 + body * 0.4) * 0.5
                
        # Hi-hat on every 8th note
        for sub in (0.0, beat_dur / 2.0):
            hat_idx = int((beat_time + sub) * SAMPLE_RATE)
            hat_dur = 0.05
            for i in range(min(int(hat_dur * SAMPLE_RATE), num_samples - hat_idx)):
                t = i / SAMPLE_RATE
                hat_val = (random.random() * 2.0 - 1.0) * math.exp(-t * 70.0)
                samples[hat_idx + i] += hat_val * 0.15

    # Add gentle chill chord progression (Am - F - C - G)
    chords = [
        [220.0, 261.63, 329.63], # Am
        [174.61, 220.0, 261.63], # F
        [130.81, 164.81, 196.0], # C
        [196.0, 246.94, 293.66], # G
    ]
    chord_dur = duration / len(chords)
    for c_idx, chord in enumerate(chords):
        c_start = int(c_idx * chord_dur * SAMPLE_RATE)
        c_samples = int(chord_dur * SAMPLE_RATE)
        for i in range(min(c_samples, num_samples - c_start)):
            t = i / SAMPLE_RATE
            val = 0.0
            for f in chord:
                # Soft electric piano chime
                val += math.sin(2.0 * math.pi * f * t) * 0.12
                val += math.sin(2.0 * math.pi * f * 2.0 * t) * 0.03
            samples[c_start + i] += val

    # Normalize gently
    max_amp = max(abs(s) for s in samples) or 1.0
    samples = [s / max_amp * 0.75 for s in samples]
    write_wav(filepath, samples)

if __name__ == "__main__":
    audio_dir = os.path.join(os.path.dirname(__file__), "assets", "audio")
    make_vine_boom(os.path.join(audio_dir, "vine-boom.wav"))
    make_record_scratch(os.path.join(audio_dir, "record-scratch.wav"))
    make_dramatic_hit(os.path.join(audio_dir, "dramatic-hit.wav"))
    make_bell_ping(os.path.join(audio_dir, "bell-ping.wav"))
    make_lofi_beat(os.path.join(audio_dir, "lofi-beat.wav"))
    print("All audio SFX generated successfully!")
