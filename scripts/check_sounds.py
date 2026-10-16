import sys,subprocess,numpy as np
from faster_whisper import WhisperModel
m=WhisperModel("/workspace/voices/whisper-base",device="cpu",compute_type="int8")
for f in sys.argv[1:]:
    raw=subprocess.run(["ffmpeg","-v","error","-i",f,"-af","apad=pad_dur=0.5","-f","s16le","-ac","1","-ar","16000","-"],capture_output=True).stdout
    a=np.frombuffer(raw,np.int16).astype(np.float32)/32768
    s,_=m.transcribe(a,language="en",beam_size=5,temperature=0,vad_filter=False)
    print(f.split('/')[-1], "|", " ".join(x.text for x in s).strip())
