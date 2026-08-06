#!/usr/bin/env python3
"""Deterministic DTMF test corpus per ITU-T Q.23/Q.24 (pure stdlib).

Q.23: low group 697/770/852/941 Hz, high group 1209/1336/1477/1633 Hz;
sending frequency tolerance +/-1.8%. Q.24 (AT&T annex values used widely):
receivers must operate at <=1.5% frequency offset and must not operate at
>=3.5%; accept twist (high-vs-low level difference) within roughly
-8..+4 dB; accept tones >=40 ms and reject <23 ms.

Everything is synthesized at 8000 Hz, 16-bit mono WAV, with a fixed LCG
noise seed, so the corpus is exactly reproducible. Run: python3 generate.py
"""
import math, os, struct, wave

FS = 8000
LOW = {"1": 697, "2": 697, "3": 697, "A": 697,
       "4": 770, "5": 770, "6": 770, "B": 770,
       "7": 852, "8": 852, "9": 852, "C": 852,
       "*": 941, "0": 941, "#": 941, "D": 941}
HIGH = {"1": 1209, "2": 1336, "3": 1477, "A": 1633,
        "4": 1209, "5": 1336, "6": 1477, "B": 1633,
        "7": 1209, "8": 1336, "9": 1477, "C": 1633,
        "*": 1209, "0": 1336, "#": 1477, "D": 1633}
KEYS = "123A456B789C*0#D"

def lcg(seed):
    while True:
        seed = (1664525 * seed + 1013904223) % 2**32
        yield seed / 2**31 - 1.0  # roughly uniform in [-1,1)

def tone(key, ms, off_pct=0.0, twist_db=0.0, amp=0.35, phase=(0.0, 0.0)):
    """One DTMF key: equal-amplitude groups, then twist applied to the HIGH tone."""
    fl = LOW[key] * (1 + off_pct / 100)
    fh = HIGH[key] * (1 + off_pct / 100)
    g = 10 ** (twist_db / 20)
    n = int(FS * ms / 1000)
    return [amp * (math.cos(2 * math.pi * fl * t / FS + phase[0])
                   + g * math.cos(2 * math.pi * fh * t / FS + phase[1]))
            for t in range(n)]

def silence(ms):
    return [0.0] * int(FS * ms / 1000)

def add_noise(x, snr_db, seed=0x6D2B79F5):
    p = sum(v * v for v in x) / len(x)
    target = p / 10 ** (snr_db / 10)
    g = lcg(seed)
    noise = [next(g) for _ in x]
    pn = sum(v * v for v in noise) / len(noise)
    s = math.sqrt(target / pn)
    return [v + s * w for v, w in zip(x, noise)]

def phone_channel():
    """101-tap Hamming windowed-sinc bandpass, 300-3400 Hz: the Q.24 voice band."""
    taps, fc1, fc2 = 101, 300 / FS, 3400 / FS
    mid = taps // 2
    h = []
    for i in range(taps):
        k = i - mid
        lp2 = 2 * fc2 * (1.0 if k == 0 else math.sin(2 * math.pi * fc2 * k) / (2 * math.pi * fc2 * k))
        lp1 = 2 * fc1 * (1.0 if k == 0 else math.sin(2 * math.pi * fc1 * k) / (2 * math.pi * fc1 * k))
        w = 0.54 - 0.46 * math.cos(2 * math.pi * i / (taps - 1))
        h.append((lp2 - lp1) * w)
    return h

def conv(x, h):
    y = [0.0] * (len(x) + len(h) - 1)
    for i, xi in enumerate(x):
        if xi != 0.0:
            for j, hj in enumerate(h):
                y[i + j] += xi * hj
    return y

def write_wav(path, x):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(FS)
        w.writeframes(b"".join(struct.pack("<h", max(-32768, min(32767, round(v * 32767)))) for v in x))
    print(path, len(x), "samples")

def main():
    os.makedirs("clips", exist_ok=True)
    ch = phone_channel()
    with open("clips/phone-channel-ir.csv", "w") as f:
        f.write("n,h\n" + "\n".join(f"{i},{v:.10f}" for i, v in enumerate(ch)) + "\n")
    # 1. All sixteen keys, clean: 100 ms tone + 100 ms pause each.
    seq = []
    for k in KEYS:
        seq += tone(k, 100) + silence(100)
    write_wav("clips/all-keys-clean.wav", seq)
    # 2. Per-key single clips (clean) for unit tests.
    for k in KEYS:
        name = {"*": "star", "#": "hash"}.get(k, k)
        write_wav(f"clips/key-{name}-clean.wav", silence(50) + tone(k, 100) + silence(50))
    # 3. Q.24 stress variants on key 5 (770+1336 Hz).
    cases = {
        "offset+1.5pct-must-operate": dict(off_pct=1.5),
        "offset-1.5pct-must-operate": dict(off_pct=-1.5),
        "offset+3.5pct-must-reject": dict(off_pct=3.5),
        "twist+4dB-limit": dict(twist_db=4.0),
        "twist-8dB-limit": dict(twist_db=-8.0),
        "short-25ms-must-reject": dict(ms=25),
        "short-45ms-must-operate": dict(ms=45),
    }
    for name, kw in cases.items():
        ms = kw.pop("ms", 100)
        write_wav(f"clips/key5-{name}.wav", silence(50) + tone("5", ms, **kw) + silence(50))
    # 4. Noise variants of the full sequence (deterministic seed).
    for snr in (30, 15):
        write_wav(f"clips/all-keys-snr{snr}dB.wav", add_noise(seq, snr))
    # 5. Phone-band channel versions: clean and 15 dB SNR after the channel.
    write_wav("clips/all-keys-channel.wav", conv(seq, ch))
    write_wav("clips/all-keys-channel-snr15dB.wav", add_noise(conv(seq, ch), 15))

if __name__ == "__main__":
    main()
