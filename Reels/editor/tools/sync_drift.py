# Mede a sincronia: legenda do edit.json x voz real montada pelos segments.json (whisper small CPU), por janela de 10 s.
# Uso (na pasta do editor): python tools/sync_drift.py <ini_s> <fim_s>   (hl3_M01; normal = legenda +0,3 s)
import json,subprocess,sys,difflib,re
T0,T1=float(sys.argv[1]),float(sys.argv[2])
OUT='out/tmp/sync_drift_%d.wav'%int(T0)
S=json.load(open('src/videos/hl3_M01/segments.json',encoding='utf-8'))['segments']
parts=[]
for s in S:
  st=s['editStart']; en=st+s['frames']/30
  if en>T0 and st<T1: parts.append((s['a']+max(0,T0-st), s['a']+min(s['frames']/30,T1-st)))
import wave,numpy as np
w=wave.open('public/videos/hl3_M01/voice-f5eaca03a8.preview48.wav','rb'); sr=w.getframerate(); ch=w.getnchannels()
chunks=[]
for a_,b_ in parts:
  w.setpos(int(a_*sr)); x=np.frombuffer(w.readframes(int((b_-a_)*sr)),dtype=np.int16).reshape(-1,ch).mean(axis=1)
  chunks.append(x)
x=np.concatenate(chunks)[::3].astype(np.int16)
o=wave.open(OUT,'wb'); o.setnchannels(1); o.setsampwidth(2); o.setframerate(sr//3); o.writeframes(x.tobytes()); o.close()
from faster_whisper import WhisperModel
m=WhisperModel('small',device='cpu',compute_type='int8')
segs,_=m.transcribe(OUT,language='pt',word_timestamps=True,vad_filter=True)
real=[(re.sub(r'\W','',w.word.lower()),T0+w.start) for s in segs for w in s.words]
d=json.load(open('src/videos/hl3_M01/edit.json',encoding='utf-8'))
ws=d['captions']; ws=ws if isinstance(ws,list) else ws['words']
cap=[(re.sub(r'\W','',w['word'].lower()),w['start']) for w in ws if T0-3<w['start']<T1+8]
sm=difflib.SequenceMatcher(None,[c[0] for c in cap],[r[0] for r in real],autojunk=False)
pairs=[]
for blk in sm.get_matching_blocks():
  for k in range(blk.size): pairs.append((cap[blk.a+k][1],real[blk.b+k][1],cap[blk.a+k][0]))
json.dump({'real':real,'pairs':pairs},open(OUT.replace('.wav','.json'),'w'))
b=None
for c,r,w in pairs:
  bucket=int((r-T0)//10)
  if bucket!=b: b=bucket; print(f"{r:8.1f} ({int(r//3600)}:{int(r%3600//60):02d}:{r%60:04.1f})  legenda-real = {c-r:+.2f}s  [{w}]")
