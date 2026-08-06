#!/usr/bin/env python3
"""Decode PhysioNet format-212 records to CSV (pure stdlib, deterministic).

Format 212: two channels packed into 3 bytes per sample pair; 12-bit
two's-complement values. Header line k (1-indexed signals): gain in ADU/mV
(0 means unspecified, use 200) and ADC zero (5th numeric field after format).

Usage: python3 decode_212.py <record> <seconds> <out.csv>
Writes: t_s, ch0_mV, ch1_mV rows for the first <seconds> seconds.
"""
import sys

def read_header(path):
    with open(path) as fh:
        lines = [l.strip() for l in fh if l.strip() and not l.startswith("#")]
    name, nsig, fs, _n = lines[0].split()[:4]
    sigs = []
    for l in lines[1 : 1 + int(nsig)]:
        parts = l.split()
        gain = float(parts[2].split("(")[0].split("/")[0]) or 200.0
        adczero = int(parts[4])
        sigs.append((gain, adczero))
    return float(fs), sigs

def decode(record, seconds, out):
    fs, sigs = read_header(record + ".hea")
    n = int(fs * seconds)
    with open(record + ".dat", "rb") as fh:
        data = fh.read(((n + 1) // 2) * 3 * 2)  # 3 bytes per 2-channel pair
    rows = []
    for i in range(n):
        b = data[i * 3 : i * 3 + 3]
        if len(b) < 3:
            break
        v0 = ((b[1] & 0x0F) << 8) | b[0]
        v1 = ((b[1] & 0xF0) << 4) | b[2]
        if v0 > 2047:
            v0 -= 4096
        if v1 > 2047:
            v1 -= 4096
        mv0 = (v0 - sigs[0][1]) / sigs[0][0]
        mv1 = (v1 - sigs[1][1]) / sigs[1][0]
        rows.append(f"{i / fs:.6f},{mv0:.6f},{mv1:.6f}")
    with open(out, "w") as fh:
        fh.write("t_s,ch0_mV,ch1_mV\n" + "\n".join(rows) + "\n")
    print(f"{out}: {len(rows)} rows at {fs:g} Hz")

if __name__ == "__main__":
    decode(sys.argv[1], float(sys.argv[2]), sys.argv[3])
