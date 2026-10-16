#!/usr/bin/env python3
"""Make square shareable MP4 clips (H.264 + AAC) of the NO button for each sound."""
import os, subprocess, numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); os.chdir(ROOT)
NAMES = {"zombie": "ZOMBIE NO", "demon": "DEMON NO", "banshee": "BANSHEE NO", "whisper_scream": "whisper... NO!",
         "old_man": "ANGRY OLD MAN NO", "creepy_girl": "creepy girl NO", "monster_roar": "MONSTER NOOO",
         "opera_diva": "OPERA DIVA NO", "chipmunk": "CHIPMUNK NO", "god_voice": "VOICE OF GOD NO",
         "robot_overlord": "ROBOT OVERLORD NO", "goat_scream": "GOAT NO"}
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
os.makedirs("assets/clips", exist_ok=True)
for n, cap in NAMES.items():
    snd = f"assets/sounds/{n}.mp3"
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", snd, "-f", "s16le", "-ac", "1", "-ar", "8000", "-"], capture_output=True).stdout
    a = np.abs(np.frombuffer(raw, np.int16).astype(float)); dur = len(a) / 8000
    win = 400; env = np.convolve(a, np.ones(win) / win, "same")
    hit = max(0.0, float(np.argmax(env > 0.5 * env.max())) / 8000 - 0.03) + 0.3   # 0.3s lead-in
    total = round(min(max(dur + 0.3 + 0.4, 2.2), 3.6), 2)
    T = f"(t-{hit:.2f})"
    s = f"if(between(t,{hit:.2f},{hit+0.6:.2f}),1-0.16*exp(-pow({T}/0.07,2))+0.05*exp(-3*{T})*sin(25*{T}),1)"  # squish+bounce
    w = f"trunc(380*({s})/2)*2"; h = f"trunc(380*(2-({s}))/2)*2*0.5+trunc(380*({s})/2)"  # wider/shorter on squish
    shake = f"if(between(t,{hit:.2f},{hit+0.5:.2f}),18*exp(-6*{T})*sin(90*{T}),0)"
    vf = (f"[1:v]scale=w='{w}':h='trunc(380*(1.12-0.12*(2-({s})))/2)*2':eval=frame[b];"
          f"color=c=0x141414:s=480x480:r=30:d={total}[bg];"
          f"[bg][b]overlay=x='(W-w)/2+{shake}':y='(H-h)/2-20+({shake})*0.4':eval=frame:shortest=1,"
          f"drawtext=fontfile={FONT}:text='{cap}':fontcolor=white:fontsize=30:x=(w-text_w)/2:y=h-62:borderw=3:bordercolor=0x8a0000,"
          f"format=yuv420p[v]")
    out = f"assets/clips/{n}.mp4"
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo:d={total}",
                    "-loop", "1", "-i", "assets/icon.png", "-i", snd,
                    "-filter_complex", vf + f";[2:a]adelay={int(hit*1000 - 0)}|{int(hit*1000)},apad[d];[0:a][d]amix=2:normalize=0:duration=first[a]",
                    "-map", "[v]", "-map", "[a]", "-t", str(total), "-c:v", "libx264", "-profile:v", "main", "-preset", "slow",
                    "-crf", "26", "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-movflags", "+faststart", out], check=True)
    print(n, total, os.path.getsize(out))
