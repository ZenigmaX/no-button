#!/usr/bin/env python3
"""Animated APNG stickers (408x408, transparent) of the NO button squishing, with character captions."""
import os, subprocess
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
CAPS = {"zombie": "ZOMBIE NO", "demon": "DEMON NO", "banshee": "BANSHEE NO", "whisper_scream": "no... NO!",
        "old_man": "OLD MAN NO", "creepy_girl": "creepy NO", "monster_roar": "MONSTER NOOO", "opera_diva": "DIVA NO",
        "chipmunk": "CHIPMUNK NO", "god_voice": "GOD SAYS NO", "robot_overlord": "ROBOT NO", "goat_scream": "GOAT NO"}
OUT = "targets/messages/Resources/stickers"; os.makedirs(OUT, exist_ok=True)
S = 408; FPS = 12; N = 16
src = Image.open("assets/adaptive-icon.png").convert("RGBA")
bb = src.getbbox(); btn = src.crop(bb)
font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 44)
# squish curve per frame: rest, press, overshoot, settle, rest
sq = [1, 1, .97, .86, .80, .84, .95, 1.06, 1.03, .99, 1, 1, 1, 1, 1, 1]
sh = [0, 0, 0, 10, -10, 8, -8, 5, -4, 2, 0, 0, 0, 0, 0, 0]
for n, cap in CAPS.items():
    tmp = f"/tmp/stk_{n}"; os.makedirs(tmp, exist_ok=True)
    for i in range(N):
        im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        base = 300; w = int(base * (2 - sq[i]) ** 0.5 * (1 if sq[i] >= 1 else 1.06)); h = int(base * sq[i])
        b = btn.resize((w, h), Image.LANCZOS)
        im.alpha_composite(b, ((S - w) // 2 + sh[i], 20 + (base - h)))
        d = ImageDraw.Draw(im)
        d.text((S // 2 + sh[i] // 2, S - 40), cap, font=font, anchor="mm", fill="white", stroke_width=5, stroke_fill=(140, 0, 0, 255))
        im.save(f"{tmp}/{i:02d}.png")
    out = f"{OUT}/{n}.png"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-framerate", str(FPS), "-i", f"{tmp}/%02d.png", "-plays", "0", "-filter_complex", "split[a][b];[a]palettegen=reserve_transparent=1:stats_mode=full[p];[b][p]paletteuse=alpha_threshold=128:dither=none",
                    "-f", "apng", "-pred", "mixed", out], check=True)
    print(n, os.path.getsize(out))
