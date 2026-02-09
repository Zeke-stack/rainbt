"""
Download all Chicken Cross game assets from Rainbet CDN.
Spritesheets (JSON + PNG) and audio files.
"""

import os
import urllib.request
import ssl
import json
import time

# Output dirs
BASE_DIR = os.path.join(os.path.dirname(__file__), "public", "chicken-cross_files", "assets")
IMG_DIR = os.path.join(BASE_DIR, "images")
AUDIO_DIR = os.path.join(BASE_DIR, "audio")
os.makedirs(IMG_DIR, exist_ok=True)
os.makedirs(AUDIO_DIR, exist_ok=True)

CDN_BASE = "https://assets.rbgcdn.com/223k2P3/raw/originals/chicken-cross"
IMG_CDN = f"{CDN_BASE}/images"
AUDIO_CDN = f"{CDN_BASE}/audio"

# SSL context that doesn't verify (in case of cert issues)
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def download(url, dest):
    if os.path.exists(dest):
        print(f"  [SKIP] {os.path.basename(dest)} (exists)")
        return True
    print(f"  [DL] {url}")
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            "Referer": "https://rainbet.com/",
            "Accept": "*/*",
        })
        with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
            data = resp.read()
            with open(dest, "wb") as f:
                f.write(data)
            print(f"  [OK] {os.path.basename(dest)} ({len(data):,} bytes)")
            return True
    except Exception as e:
        print(f"  [FAIL] {e}")
        return False

# ===== SPRITESHEET JSONs =====
spritesheet_jsons = [
    "chicken-body-content.json",
    "chicken-faces.json",
    "chicken-background-content-1.json",
    "chicken-background-content-2.json",
    "chicken-cross-cars.json",
    "blocker.json",
    "snow-theme.json",
]

# Animated spritesheets (multi-part)
animated_spritesheets = {
    "chicken-dust": {
        "parts": ["chicken-dust-part-1.json", "chicken-dust-part-2.json"],
    },
    "snow": {
        "parts": ["snow-1.json", "snow-2.json", "snow-3.json", "snow-4.json"],
    },
}

print("=" * 60)
print("DOWNLOADING CHICKEN CROSS ASSETS")
print("=" * 60)

# Download spritesheet JSONs
print("\n--- Spritesheet JSONs ---")
for name in spritesheet_jsons:
    download(f"{IMG_CDN}/{name}", os.path.join(IMG_DIR, name))

# Download animated spritesheet JSONs
for anim_name, info in animated_spritesheets.items():
    for part in info["parts"]:
        download(f"{IMG_CDN}/{part}", os.path.join(IMG_DIR, part))

# Now parse each JSON to find the PNG texture atlas references
print("\n--- Spritesheet PNGs (from JSON meta.image) ---")
all_pngs = set()
for fname in os.listdir(IMG_DIR):
    if fname.endswith(".json"):
        fpath = os.path.join(IMG_DIR, fname)
        try:
            with open(fpath, "r") as f:
                data = json.load(f)
            # Standard TexturePacker format: meta.image
            if "meta" in data and "image" in data["meta"]:
                png_name = data["meta"]["image"]
                all_pngs.add(png_name)
                print(f"  Found PNG ref in {fname}: {png_name}")
        except Exception as e:
            print(f"  [WARN] Could not parse {fname}: {e}")

# Download all referenced PNGs
print(f"\n--- Downloading {len(all_pngs)} PNG textures ---")
for png_name in sorted(all_pngs):
    download(f"{IMG_CDN}/{png_name}", os.path.join(IMG_DIR, png_name))

# Also try common PNG names that might not be in JSON
extra_pngs = [
    "chicken-body-content.png",
    "chicken-faces.png",
    "chicken-background-content-1.png",
    "chicken-background-content-2.png",
    "chicken-cross-cars.png",
    "blocker.png",
    "snow-theme.png",
    "chicken-dust-part-1.png",
    "chicken-dust-part-2.png",
    "snow-1.png",
    "snow-2.png",
    "snow-3.png",
    "snow-4.png",
]

print(f"\n--- Extra PNGs (fallback) ---")
for png_name in extra_pngs:
    if png_name not in all_pngs:
        download(f"{IMG_CDN}/{png_name}", os.path.join(IMG_DIR, png_name))

# ===== AUDIO FILES =====
audio_files = [
    "traffic-car-1-quite.mp3",
    "traffic-car-1-loud.mp3",
    "traffic-car-2-loud.mp3",
    "traffic-car-3-loud.mp3",
    "traffic-car-4-loud.mp3",
    "traffic-car-2-quite.mp3",
    "traffic-car-3-quite.mp3",
    "traffic-car-4-quite.mp3",
    "traffic-police-2-loud.mp3",
    "traffic-police-2-quite.mp3",
    "traffic-truck-1-loud.mp3",
    "traffic-truck-2-loud.mp3",
    "traffic-truck-1-quite.mp3",
    "traffic-truck-2-quite.mp3",
    "barrier-impact-0.mp3",
    "barrier-impact-1.mp3",
    "barrier-impact-2.mp3",
    "chirp-1.mp3",
    "chirp-2.mp3",
    "chirp-3.mp3",
    "chirp-4.mp3",
    "chirp-idle.mp3",
    "cluck-1.mp3",
    "cluck-2.mp3",
    "cluck-3.mp3",
    "cluck-4.mp3",
    "eating-seeds.mp3",
    "footstep-1.mp3",
    "footstep-2.mp3",
    "footstep-3.mp3",
    "footstep-4.mp3",
    "game-over.mp3",
    "ghost.mp3",
    "get-hit.mp3",
    "honk.mp3",
    "honk-1.mp3",
    "honk-2.mp3",
    "land.mp3",
    "safe-lane.mp3",
    "start-cross.mp3",
    "win.mp3",
    "cash-out.mp3",
]

print(f"\n--- Audio Files ({len(audio_files)}) ---")
for af in audio_files:
    download(f"{AUDIO_CDN}/{af}", os.path.join(AUDIO_DIR, af))

# Also download the UI click sound from a different path
UI_AUDIO = "https://assets.rbgcdn.com/223k2P3/raw/originals/audios/games/ui"
os.makedirs(os.path.join(BASE_DIR, "ui-audio"), exist_ok=True)
print("\n--- UI Audio ---")
download(f"{UI_AUDIO}/button-click-very-low.mp3", os.path.join(BASE_DIR, "ui-audio", "button-click-very-low.mp3"))

print("\n" + "=" * 60)
print("DOWNLOAD COMPLETE!")
print(f"Images: {IMG_DIR}")
print(f"Audio:  {AUDIO_DIR}")

# Summary
img_count = len([f for f in os.listdir(IMG_DIR) if not f.startswith('.')])
audio_count = len([f for f in os.listdir(AUDIO_DIR) if not f.startswith('.')])
print(f"Files: {img_count} images, {audio_count} audio")
print("=" * 60)
