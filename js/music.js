// ===== Agent Coco music: a tiny funk band synthesized with WebAudio (no samples, no files, works offline) =====
// v0.8 "every screen gets its own groove". Drop-in replacement for v0.7 js/music.js.
//
// API (all safe to call before audio is unlocked, and with unknown names):
//   startMusic(name)            play a track by name (aliases: menu, level, boss still work). Unknown -> fallback, never silence.
//   stopMusic()                 fade out the current track.
//   pushMusic(name) / popMusic() for overlays like the Gadget Watch: popMusic() restores the track underneath where it left off.
//   levelMusic(def) / bossMusic(def)  pick a track name for a LEVEL_DEFS entry: def.music / def.bossMusic win,
//                               then the mission id table (gilbert_1..5), then def.type, then def.theme prefix, then def.boss.type.
//   playStinger(name)           one-shot jingles: win, lose, clue, unlock, code_ok, code_bad.
//   setMusicLite(bool)          lighter CPU mode for small handhelds (no reverb sends, fewer voices). Auto-on for weak ARM devices.
//   MUSIC_LIST                  [{name,title,desc}] every track, for a jukebox / sound test screen.
//
// Signal flow: instruments -> track gain (crossfades) -> music bus (+ reverb) -> master -> compressor -> speakers. SFX share the master.
let MUS=null;
let MUSIC_LITE=(()=>{try{return (navigator.hardwareConcurrency||8)<=4&&/arm|aarch64|Android/i.test(navigator.userAgent);}catch(e){return false;}})();
function setMusicLite(on){MUSIC_LITE=!!on;}
function musBus(){const a=audio();if(!a)return null;if(MUS&&MUS.a===a)return MUS;
 const comp=a.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=8;comp.ratio.value=4;comp.attack.value=.003;comp.release.value=.18;
 const master=a.createGain();master.gain.value=muted?0:.9;master.connect(comp);comp.connect(a.destination);
 const bus=a.createGain();bus.gain.value=.6;bus.connect(master);
 const music=a.createGain();music.connect(bus);
 const sfx=a.createGain();sfx.gain.value=1;sfx.connect(master);
 // small room reverb from a generated impulse response: gives the band "depth"
 const len=(a.sampleRate*1.6)|0,ir=a.createBuffer(2,len,a.sampleRate);
 for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.8);}
 const rev=a.createConvolver();rev.buffer=ir;const revOut=a.createGain();revOut.gain.value=.55;rev.connect(revOut);revOut.connect(bus);
 const nb=a.createBuffer(1,a.sampleRate,a.sampleRate),nd=nb.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
 MUS={a,master,bus,music,sfx,rev,noise:nb,thF:0};return MUS;}
const mtof=m=>440*Math.pow(2,(m-69)/12);
const NT={C:0,'C#':1,Db:1,D:2,'D#':3,Eb:3,E:4,F:5,'F#':6,Gb:6,G:7,'G#':8,Ab:8,A:9,'A#':10,Bb:10,B:11};
const nm=s=>{const r=/^([A-G][#b]?)(-?\d)$/.exec(s);return 12*(+r[2]+1)+NT[r[1]];};
const nms=s=>s.split(' ').map(nm);

// ---- building blocks ----
function env(g,t,v,a,d,sus=0,rel=0,dur=0){const p=g.gain;p.setValueAtTime(0.0001,t);p.linearRampToValueAtTime(v,t+a);
 if(dur){p.setTargetAtTime(v*sus+0.0001,t+a,d/3);p.setTargetAtTime(0.0001,t+dur,rel/3);}else p.exponentialRampToValueAtTime(0.0001,t+a+d);}
function osc(type,f,t,stop,out,detune=0){const o=MUS.a.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(detune)o.detune.value=detune;o.connect(out);o.start(t);o.stop(stop);return o;}
function gainTo(dest,send=0){const g=MUS.a.createGain();g.connect(dest);if(send&&!MUSIC_LITE){const s=MUS.a.createGain();s.gain.value=send;g.connect(s);s.connect(MUS.rev);}return g;}
function noiseSrc(t,dur,out){const s=MUS.a.createBufferSource();s.buffer=MUS.noise;s.connect(out);s.start(t,(t*7.31)%.5);s.stop(t+dur);return s;}
function filt(type,f,q,out){const b=MUS.a.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;b.connect(out);return b;}
function vib(o,t,dur,rate,depth,delay){const l=MUS.a.createOscillator(),g=MUS.a.createGain();l.frequency.value=rate;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(depth,t+delay);l.connect(g);g.connect(o.frequency);l.start(t);l.stop(t+dur);}

// ---- drum kit ----
function kick(t,v=1,out=MUS.music){const g=gainTo(out);env(g,t,.72*v,.002,.3);const o=osc('sine',150,t,t+.4,g);o.frequency.exponentialRampToValueAtTime(42,t+.13);
 const c=gainTo(out);env(c,t,.25*v,.001,.02);noiseSrc(t,.03,filt('lowpass',3000,.7,c));}
function snare(t,v=1,out=MUS.music){const g=gainTo(out,.35);env(g,t,.42*v,.001,.17);noiseSrc(t,.2,filt('highpass',1300,.7,g));
 const b=gainTo(out);env(b,t,.25*v,.001,.07);osc('triangle',200,t,t+.1,b);}
function hat(t,v=1,open=false,out=MUS.music){const g=gainTo(out,.08);env(g,t,.22*v,.001,open?.22:.035);noiseSrc(t,open?.25:.05,filt('highpass',7500,.8,g));}
function clap(t,v=1,out=MUS.music){const g=gainTo(out,.4);const p=g.gain;p.setValueAtTime(0.0001,t);
 for(const d of [0,.012,.024]){p.setValueAtTime(.35*v,t+d);p.exponentialRampToValueAtTime(.05*v,t+d+.01);}p.exponentialRampToValueAtTime(0.0001,t+.2);noiseSrc(t,.22,filt('bandpass',1500,1.2,g));}
function scratch(t,v=1,out=MUS.music){const g=gainTo(out,.15);env(g,t,.26*v,.001,.045);const f=filt('bandpass',1800,4,g);f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(2600,t+.04);noiseSrc(t,.06,f);}
function rim(t,v=1,out=MUS.music){const g=gainTo(out,.2);env(g,t,.25*v,.001,.03);osc('square',1700,t,t+.04,filt('bandpass',1700,4,g));}
function cowbell(t,v=1,out=MUS.music){const g=gainTo(out,.15);env(g,t,.13*v,.001,.18);const b=filt('bandpass',800,2,g);osc('square',540,t,t+.2,b);osc('square',800,t,t+.2,b);}
function shaker(t,v=1,out=MUS.music){const g=gainTo(out);env(g,t,.12*v,.008,.05);noiseSrc(t,.07,filt('highpass',6000,.7,g));}
// construction clank (Gilbert): two clashing squares through a ringing band
function clank(t,v=1,out=MUS.music){const g=gainTo(out,.25);env(g,t,.12*v,.001,.14);const b=filt('bandpass',2400,6,g);osc('square',1230,t,t+.16,b);osc('square',1770,t,t+.16,b);
 const n=gainTo(out);env(n,t,.1*v,.001,.02);noiseSrc(t,.03,filt('highpass',3000,1,n));}
function conga(t,v=1,out=MUS.music){const g=gainTo(out,.15);env(g,t,.3*v,.002,.18);osc('sine',260,t,t+.2,g).frequency.exponentialRampToValueAtTime(190,t+.08);}
function tom(t,v=1,out=MUS.music){const g=gainTo(out,.2);env(g,t,.45*v,.002,.3);osc('sine',150,t,t+.32,g).frequency.exponentialRampToValueAtTime(85,t+.25);}
// taxi horn (Downtown): two detuned squares, a little nasal
function honk(t,v=1,out=MUS.music){const g=gainTo(out,.2);env(g,t,.075*v,.008,.1,.8,.04,.16);const l=filt('lowpass',1900,2,g);osc('square',370,t,t+.24,l);osc('square',466,t,t+.24,l);}
// trash-can lid (Tempe)
function can(t,v=1,out=MUS.music){const g=gainTo(out,.2);env(g,t,.32*v,.001,.2);noiseSrc(t,.22,filt('bandpass',520,5,g));const s=gainTo(out);env(s,t,.2*v,.001,.06);osc('sine',190,t,t+.08,s);}
// circuit glitch blip (Chandler / hacking)
const GL=[1800,2400,3100,1200,2700,1500];
function glitch(t,v=1,out=MUS.music){const g=gainTo(out,.1);env(g,t,.06*v,.001,.035);const o=osc('square',GL[(t*997|0)%6],t,t+.05,g);o.frequency.setValueAtTime(GL[(t*577|0)%6],t+.018);}
// villain boom: long sub drop
function boom(t,v=1,out=MUS.music){const g=gainTo(out,.3);env(g,t,.7*v,.003,1.1);osc('sine',72,t,t+1.2,g).frequency.exponentialRampToValueAtTime(30,t+.9);}

// ---- band: bass ----
// slap/envelope-filter bass with a sine sub for weight
function bass(t,m,dur,v=1,out=MUS.music){const f=mtof(m),g=gainTo(out);env(g,t,.34*v,.004,.12,.55,.06,dur);
 const lp=filt('lowpass',2600,9,g);lp.frequency.setValueAtTime(2600*Math.min(1.4,v+.2),t);lp.frequency.exponentialRampToValueAtTime(260,t+.16);
 osc('sawtooth',f,t,t+dur+.1,lp);if(!MUSIC_LITE)osc('square',f,t,t+dur+.1,lp,-6);
 const s=gainTo(out);env(s,t,.18*v,.004,.1,.8,.05,dur);osc('sine',f,t,t+dur+.1,s);}
// analog synth bass (Chandler, Dr. Glitch): resonant sweep, rubbery
function synbass(t,m,dur,v=1,out=MUS.music){const f=mtof(m),g=gainTo(out);env(g,t,.3*v,.003,.15,.6,.05,dur);
 const lp=filt('lowpass',3200,12,g);lp.frequency.setValueAtTime(3200*v,t);lp.frequency.exponentialRampToValueAtTime(180,t+.2);
 osc('sawtooth',f,t,t+dur+.1,lp);osc('square',f/2,t,t+dur+.1,lp,4);}
// sousaphone bass (Tempe, Stinky Pete): soft attack, scoops up into the note
function tuba(t,m,dur,v=1,out=MUS.music){const f=mtof(m),g=gainTo(out,.1);env(g,t,.36*v,.025,.12,.75,.06,dur);
 const lp=filt('lowpass',520,1.5,g);const o=osc('sawtooth',f*.94,t,t+dur+.1,lp);o.frequency.exponentialRampToValueAtTime(f,t+.05);
 const s=gainTo(out);env(s,t,.2*v,.02,.1,.8,.05,dur);osc('sine',f,t,t+dur+.1,s);}
// dark sub bass (villain, cutscenes): round with a little growl
function subbass(t,m,dur,v=1,out=MUS.music){const f=mtof(m),g=gainTo(out);env(g,t,.42*v,.006,.2,.8,.08,dur);osc('sine',f,t,t+dur+.12,g);
 const r=gainTo(out);env(r,t,.12*v,.004,.15,.4,.05,dur);osc('sawtooth',f,t,t+dur+.12,filt('lowpass',700,4,r));}

// ---- band: chords ----
// electric piano: sine body + bright bell partial that fades fast
function ep(t,ms,dur,v=1,out=MUS.music){for(const m of ms){const f=mtof(m),g=gainTo(out,.35);env(g,t,.1*v,.004,.4,.35,.12,dur);osc('sine',f,t,t+dur+.2,g,((m*37)%9)-4);
 if(!MUSIC_LITE){const b=gainTo(out,.35);env(b,t,.03*v,.002,.12);osc('triangle',f*3,t,t+.2,b);}}}
function pad(t,ms,dur,v=1,out=MUS.music){for(const m of ms){const g=gainTo(out,.6);env(g,t,.028*v,.25,.5,.8,.4,dur);const lp=filt('lowpass',1100,.5,g);osc('sawtooth',mtof(m),t,t+dur+.6,lp,-9);if(!MUSIC_LITE)osc('sawtooth',mtof(m),t,t+dur+.6,lp,9);}}
// "ooh" choir pad for villains: saws through a vowel formant
function choir(t,ms,dur,v=1,out=MUS.music){const g=gainTo(out,.7);env(g,t,.05*v,.35,.5,.85,.5,dur);const f1=filt('bandpass',650,3,g);
 for(const m of ms){osc('sawtooth',mtof(m),t,t+dur+.7,f1,-7);if(!MUSIC_LITE)osc('sawtooth',mtof(m),t,t+dur+.7,f1,7);}}
// horn section stab: detuned saws through a quick filter blip
function stab(t,ms,dur,v=1,out=MUS.music){for(const m of ms){const g=gainTo(out,.3);env(g,t,.095*v,.01,.1,.6,.05,dur);const lp=filt('lowpass',900,2,g);lp.frequency.setValueAtTime(900,t);lp.frequency.linearRampToValueAtTime(3200,t+.04);lp.frequency.exponentialRampToValueAtTime(1400,t+.2);
 osc('sawtooth',mtof(m),t,t+dur+.1,lp,-8);if(!MUSIC_LITE)osc('sawtooth',mtof(m),t,t+dur+.1,lp,8);}}
// clavinet: plucky pulse through a bright band, top three notes only
function clav(t,ms,dur,v=1,out=MUS.music){const g=gainTo(out,.12);env(g,t,.09*v,.002,.09,.25,.03,Math.min(dur,.25));const bp=filt('bandpass',1700,2.5,g);
 for(const m of ms.slice(-3))osc('square',mtof(m),t,t+Math.min(dur,.25)+.06,bp);}
// drawbar organ: fundamental + octave, gentle tremolo from detune
function organ(t,ms,dur,v=1,out=MUS.music){const g=gainTo(out,.3);env(g,t,.045*v,.01,.1,.9,.08,dur);
 for(const m of ms){const f=mtof(m);osc('sine',f,t,t+dur+.12,g,3);if(!MUSIC_LITE)osc('triangle',f*2,t,t+dur+.12,g,-3);}}
// wah guitar chord: one envelope-swept band filter over the whole chord
function wah(t,ms,dur,v=1,out=MUS.music){const g=gainTo(out,.25);env(g,t,.07*v,.004,.1,.6,.04,dur);const bp=filt('bandpass',450,5,g);
 bp.frequency.setValueAtTime(450,t);bp.frequency.exponentialRampToValueAtTime(2200,t+Math.min(.09,dur*.5));bp.frequency.exponentialRampToValueAtTime(700,t+dur+.05);
 for(const m of ms.slice(-3))osc('sawtooth',mtof(m),t,t+dur+.08,bp);}

// ---- band: leads (mono) ----
// square spy synth with delayed vibrato
function lead(t,m,dur,v=1,out=MUS.music){const g=gainTo(out,.45);env(g,t,.095*v,.012,.2,.7,.08,dur);const lp=filt('lowpass',2800,1,g);
 const o=osc('square',mtof(m),t,t+dur+.15,lp);vib(o,t,dur+.15,5.5,mtof(m)*.012,Math.min(.25,dur));osc('triangle',mtof(m+12),t,t+dur+.15,lp);}
// horn lead: brassy filter swell
function brass(t,m,dur,v=1,out=MUS.music){const f=mtof(m),g=gainTo(out,.35);env(g,t,.11*v,.025,.15,.75,.07,dur);const lp=filt('lowpass',800,2,g);
 lp.frequency.setValueAtTime(800,t);lp.frequency.linearRampToValueAtTime(2800,t+.05);lp.frequency.exponentialRampToValueAtTime(1600,t+.25);
 const o=osc('sawtooth',f,t,t+dur+.12,lp,-6);if(!MUSIC_LITE)osc('sawtooth',f,t,t+dur+.12,lp,6);if(dur>.3)vib(o,t,dur+.12,5,f*.01,.2);}
// whistle: pure and breezy
function whistle(t,m,dur,v=1,out=MUS.music){const f=mtof(m+12),g=gainTo(out,.45);env(g,t,.075*v,.03,.15,.8,.06,dur);const o=osc('sine',f,t,t+dur+.1,g);vib(o,t,dur+.1,6,f*.008,.12);}
// theremin: spooky glide from the previous note, wide vibrato
function theremin(t,m,dur,v=1,out=MUS.music){const f=mtof(m),g=gainTo(out,.6);env(g,t,.085*v,.05,.2,.85,.1,dur);const from=MUS.thF||f;
 const o=osc('sine',from,t,t+dur+.15,g);o.frequency.exponentialRampToValueAtTime(f,t+.07);vib(o,t,dur+.15,6.2,f*.018,.08);
 if(!MUSIC_LITE){const g2=gainTo(out);env(g2,t,.025*v,.05,.2,.8,.1,dur);osc('triangle',f*2,t,t+dur+.15,g2).frequency.setValueAtTime(from*2,t);}MUS.thF=f;}
// tech synth lead (Chandler): saw + square, resonant
function synlead(t,m,dur,v=1,out=MUS.music){const f=mtof(m),g=gainTo(out,.35);env(g,t,.08*v,.005,.12,.6,.05,dur);const lp=filt('lowpass',2200,6,g);
 lp.frequency.setValueAtTime(4000,t);lp.frequency.exponentialRampToValueAtTime(1500,t+.15);osc('sawtooth',f,t,t+dur+.1,lp,-5);osc('square',f,t,t+dur+.1,lp,5);}
// bell / vibes
function bell(t,m,dur,v=1,out=MUS.music){const f=mtof(m),g=gainTo(out,.5);env(g,t,.07*v,.002,Math.max(.4,dur));osc('sine',f,t,t+Math.max(.45,dur)+.05,g);
 const h=gainTo(out,.5);env(h,t,.025*v,.001,.12);osc('sine',f*2.76,t,t+.15,h);}

// ---- track compiler ----
// A track is pure data. 16 steps per bar.
//  prog:   one chord per bar, [root, quality]
//  drums:  named one-bar patterns, dseq picks one per bar ('AAAF'). Channels: k kick s snare c clap h hat r rim b cowbell
//          t shaker m clank z scratch p conga T tom n taxi-honk l can-lid g glitch d boom. Velocities: X 1, x .75, o .5, g .22, O open hat.
//  bass:   one 16-char string per bar (cycled). Chars are intervals from the chord root: 0-9, a=10 b=11 o=12 p=14 q=15 r=17 s=19,
//          K=-1 L=-2 J=-3 H=-5 I=-7; '-' holds the previous note, '.' rest, 'x' dead/muted thump.
//  comp:   chord parts {i:instrument, h:[hit strings per bar], v, o:octave shift}. 'x' hit 'X' accent 'g' ghost '-' hold.
//          i:'arp' plays chord tones one at a time on each hit (sound: a, default bell).
//  lead:   {i, at:bar, v, o, mel:'B4/3 r/1 D5/2 ...'} note/length-in-steps, played in sequence from bar `at`.
//  pad:    {i:'pad'|'choir', v}
const QUAL={m:[0,3,7,12],M:[0,4,7,12],m7:[0,3,7,10],m9:[3,7,10,14],m11:[3,10,14,17],7:[0,4,7,10],9:[4,7,10,14],13:[4,10,14,21],
 '7s9':[4,10,15],'7b9':[4,7,10,13],maj7:[0,4,7,11],maj9:[4,7,11,14],m6:[3,7,9,14],mM7:[0,3,7,11],dim7:[0,3,6,9],sus:[5,7,10,14],aug:[0,4,8,12],m7b5:[0,3,6,10]};
const BI={K:-1,L:-2,J:-3,H:-5,I:-7,a:10,b:11,o:12,p:14,q:15,r:17,s:19};
const DV={X:1,x:.75,o:.5,g:.22,O:.8};
const DRUM={k:kick,s:snare,c:clap,h:hat,r:rim,b:cowbell,t:shaker,m:clank,z:scratch,p:conga,T:tom,n:honk,l:can,g:glitch,d:boom};
const BASSI={slap:bass,synth:synbass,tuba,sub:subbass};
const COMPI={ep,clav,organ,wah,stab,pad,choir};
const LEADI={lead,brass,whistle,theremin,synth:synlead,bell};
const pc=s=>NT[s];
function voice(root,q,shift=0){const out=[];for(const i of QUAL[q]||QUAL.m7){let n=48+root+i;while(n<54+shift)n+=12;while(n>72+shift)n-=12;if(!out.includes(n))out.push(n);}return out.sort((a,b)=>a-b);}
function compileTrack(def){
 const sd=60/def.bpm/4,NB=def.prog.length,N=NB*16,ev=Array.from({length:N},()=>[]);
 const bars=def.prog.map(([r,q])=>{const p=pc(r);return {chord:voice(p,q,def.vo||0),root:28+((p-4+12)%12)+(def.bo||0)};});
 const bfn=BASSI[def.bassI||'slap'];
 const at=(b,st,e)=>ev[(b*16+st)%N].push(e);
 const holds=(s,i)=>{let n=1;while(s[i+n]==='-')n++;return n;};
 for(let b=0;b<NB;b++){const B=bars[b];
  // drums
  const dp=def.drums[(def.dseq||'A')[b%(def.dseq||'A').length]]||{};
  for(const ch in dp){const s=dp[ch],fn=DRUM[ch];for(let st=0;st<16;st++){const c=s[st],v=DV[c];if(v)at(b,st,ch==='h'?[fn,v*(def.dv||1),c==='O']:[fn,v*(def.dv||1)]);}}
  // bass
  if(def.bass){const s=def.bass[b%def.bass.length];for(let st=0;st<16;st++){const c=s[st];if(!c||c==='.'||c==='-')continue;
   if(c==='x'){at(b,st,[bfn,B.root,.035,.45]);continue;}
   const iv=BI[c]!==undefined?BI[c]:+c;const len=holds(s,st);at(b,st,[bfn,B.root+iv,len*sd*.9,st===0?1:c==='o'?.95:.82]);}}
  // chord parts
  for(const C of def.comp||[]){const hs=Array.isArray(C.h)?C.h:[C.h],s=hs[b%hs.length];if(!s)continue;const ch=B.chord.map(m=>m+(C.o||0));let ai=0;
   for(let st=0;st<16;st++){const c=s[st];if(c!=='x'&&c!=='X'&&c!=='g')continue;const len=c==='g'?.5:holds(s,st),v=(c==='X'?1:c==='g'?.4:.8)*(C.v||1);
    if(C.i==='arp'){const m=ch[ai%ch.length]+12*(Math.floor(ai/ch.length)%2);ai++;at(b,st,[LEADI[C.a||'bell'],m,len*sd,v]);}
    else at(b,st,[COMPI[C.i],ch,len*sd,v]);}}
  if(def.pad)at(b,0,[COMPI[def.pad.i||'pad'],B.chord,16*sd,def.pad.v||1]);}
 // leads
 for(const L of [].concat(def.lead||[])){let s=(L.at||0)*16;const fn=typeof L.i==='function'?L.i:LEADI[L.i||'lead'];
  for(const tok of L.mel.trim().split(/\s+/)){const [n,l]=tok.split('/'),len=+l;if(n!=='r')ev[s%N].push([fn,nm(n)+(L.o||0),len*sd*.92,L.v||1]);s+=len;}}
 return {def,sd,N,ev,swing:def.swing||0,vol:def.vol||1};}

// ---- drum pattern library ----
const R16='................';
const dr=(base,extra)=>Object.assign({},base,extra);
const DR={
 pocket:{k:'X.....x...x..x..',s:'....X..g.g..X..g',h:'xoxoxoxoxoxoxoxo',z:'...x..x....x..x.'},
 pocketF:{k:'X.....x...x.....',s:'....X..g.g..XgXX',h:'xoxoxoxoxoxoO...',z:'...x..x.........'},
 lounge:{k:'X.........x.....',s:'....x.......x...',h:'x.o.x.o.x.o.x.oO'},
 loungeF:{k:'X.........x..x..',s:'....x.......x.gg',h:'x.o.x.o.x.o.x.o.'},
 disco:{k:'X...X...X...X...',s:'....X.......X...',h:'o.O.o.O.o.O.o.O.',t:'.x.x.x.x.x.x.x.x'},
 discoF:{k:'X...X...X...X...',s:'....X.......X.XX',h:'o.O.o.O.o.O.o...',t:'.x.x.x.x.x.x....'},
 drive:{k:'X...x...X.x.x...',c:'....X.......X...',s:'............o...',h:'x.x.x.x.x.x.x.x.'},
 driveF:{k:'X...x...X.x.x...',c:'....X.......X...',s:'..........o.XXXX',h:'x.x.x.x.x.x.....'},
 brk:{k:'X.x.......x.....',s:'....X..g.g.xX..g',h:'x.x.x.x.x.xOx.x.'},
 brkF:{k:'X.x.......x..x..',s:'....X..g.g.xX.XX',h:'x.x.x.x.x.x.x...'},
 sneak:{k:'X.......x.x.....',s:'........X......g',h:'x.o.x.o.x.ooxo.o',r:'...x.......x....'},
 sneakF:{k:'X.......x.x.....',s:'........X...g.gX',h:'x.o.x.o.x.o.x...',r:'...x............'},
 heavy:{k:'X......x..X.....',s:'........X......g',h:'x.x.x.x.x.x.x.x.'},
 heavyF:{k:'X......x..X..x..',s:'........X...g.gX',h:'x.x.x.xOx.x.x...'}};

// ---- the tracks ----
const TR={};
// === SCREENS ===
TR.title={title:'Agent Coco Theme',desc:'Title screen. The main theme: slap bass, horns, the spy melody everyone hums.',
 bpm:104,swing:.12,prog:[['E','m9'],['A','13'],['E','m9'],['A','13'],['C','maj7'],['D','9'],['E','m9'],['B','7s9']],
 drums:{A:DR.pocket,F:DR.pocketF},dseq:'AAAF',
 bass:['0-.o..035.7a.oa7','0-.o..0.4.7a0.LJ','0-.o..035.7a.oa7','0-.o..0.4.7a0.LJ','0-.o..4.7.b.o.7.','0-.o..4.7.a.o.4.','0-.o..035.7a.oa7','0-.o.x0.4.7.a.o.'],
 comp:[{i:'ep',h:'..x-......x--...',v:.8},{i:'clav',h:'....g.x...g..x.g',v:.7},
  {i:'stab',o:12,h:[R16,R16,R16,'..........x..x-.',R16,R16,R16,'x..x..x-........']}],
 lead:{i:'brass',mel:'r/2 E5/1 r/1 D5/1 E5/2 G5/3 E5/2 D5/2 B4/2  A4/3 B4/1 C#5/2 E5/2 F#5/4 E5/2 C#5/2  r/2 E5/1 r/1 D5/1 E5/2 G5/3 A5/2 G5/2 E5/2  F#5/6 E5/2 C#5/2 B4/2 A4/4  G4/2 B4/2 E5/4 D5/2 B4/2 G4/4  F#4/2 A4/2 E5/4 D5/2 C5/2 A4/4  B4/3 D5/1 E5/4 G5/2 F#5/2 E5/2 D5/2  D#5/2 r/1 D5/1 B4/4 r/8'},
 pad:{v:.7}};
TR.map={title:'Valley Cruise',desc:'World map. Laid-back cruising groove, whistle hook in the second half.',
 bpm:92,swing:.18,prog:[['G','maj7'],['E','m9'],['A','m9'],['D','9'],['G','maj7'],['E','m9'],['A','m9'],['D','9']],
 drums:{A:dr(DR.lounge,{t:'..x...x...x...x.'}),F:DR.loungeF},dseq:'AAAF',
 bass:['0-....7-..o.7.4.','0-....7-..o.a.7.','0-....7-..o.a.7.','0-..x.7-..o.a.4.'],
 comp:[{i:'ep',h:'..x-.......x--..',v:.9},{i:'wah',h:'....x.......x...',v:.5}],
 lead:{i:'whistle',at:4,mel:'r/4 B4/2 D5/2 F#5/4 E5/2 D5/2  B4/6 G4/2 A4/2 B4/2 D5/4  C5/2 B4/2 A4/2 G4/2 E4/4 G4/4  A4/8 r/2 F#4/2 A4/2 C5/2'},
 pad:{v:.8}};
TR.watch={title:'Gadget Groove',desc:'Gadget Watch (pause hub). Quiet clav and vibes so menus feel calm but still bob.',
 bpm:98,swing:.14,vol:.8,prog:[['D','m9'],['G','13'],['D','m9'],['A','7s9']],
 drums:{A:dr(DR.brk,{k:'X.........x.....',s:'....o..g.g..o..g'}),F:dr(DR.brkF,{s:'....o..g.g..o.oo'})},dseq:'AAAF',dv:.7,
 bassI:'synth',bass:['0..0..o..0..a.7.','0..0..o..4..a.7.','0..0..o..0..a.7.','0..o..x..4..a.o.'],
 comp:[{i:'clav',h:'..x.x..g..x.x..g',v:.6}],
 lead:{i:'bell',v:.8,mel:'A5/1 r/1 F5/1 r/1 E6/2 D6/2 r/2 C6/1 A5/1 r/4  B5/1 r/1 G5/1 r/1 E6/2 F6/2 r/4 D6/4  A5/1 r/1 F5/1 r/1 E6/2 D6/2 r/2 C6/1 A5/1 r/4  C#6/2 C6/2 G5/2 E5/2 C#5/8'}};
TR.lair={title:'Rooftop Workshop',desc:'The Lair on the pizza-shop roof. Organ, soldering-iron chill, a happy whistle.',
 bpm:88,swing:.2,prog:[['F','maj7'],['Bb','9'],['F','maj7'],['Bb','9'],['A','m7'],['D','m9'],['G','m9'],['C','9']],
 drums:{A:dr(DR.lounge,{p:'......x..x....x.'}),F:DR.loungeF},dseq:'AAAF',
 bass:['0-..7.o..0.4.7..','0-..7.o..0.4.a..','0-..7.o..0.3.7..','0-..7.o.x0.4.a.L'],
 comp:[{i:'organ',h:'..x-.....x-...x-',v:.8},{i:'ep',h:'x-..........x...',v:.5}],
 lead:{i:'whistle',at:4,mel:'E5/3 C5/1 A4/2 C5/2 E5/4 G5/4  F5/4 E5/2 D5/2 C5/2 A4/2 F4/4  Bb4/2 A4/2 G4/2 F4/2 D5/4 C5/4  Bb4/4 r/2 G4/2 E4/8'}};
TR.enter_code={title:'Cipher Pocket',desc:'Enter Code screen. Computer-funk: clav, glitch blips, a bell that answers you.',
 bpm:104,swing:.1,vol:.85,prog:[['A','m9'],['A','m9'],['F','maj7'],['E','7s9']],
 drums:{A:dr(DR.brk,{g:'..x.....x...x..x'}),F:dr(DR.brkF,{g:'..x.x.x.x.......'})},dseq:'AAAF',dv:.8,
 bassI:'synth',bass:['0..o.0..7.0.a.o.','0..o.0..7.0.3.5.','0..o.0..7.0.b.o.','0..o.x..4.0.a.o.'],
 comp:[{i:'clav',h:'..x.xg.x..x.x.gx',v:.6}],
 lead:{i:'bell',v:.7,mel:'r/16 r/8 E6/1 r/1 G6/1 r/1 A6/4  r/16 r/8 G#6/1 r/1 E6/1 r/1 B5/4'}};
TR.results={title:'Case Closed',desc:'Results screen. Bright disco-funk victory lap, horns up.',
 bpm:112,swing:.08,prog:[['D','maj7'],['B','m7'],['E','m9'],['A','13']],
 drums:{A:DR.disco,F:DR.discoF},dseq:'AAAF',
 bass:['0.o.0.o.7.o.4.o.','0.o.0.o.7.o.3.o.','0.o.0.o.7.o.a.o.','0.o.0.o.4.7.a.o.'],
 comp:[{i:'clav',h:'..x...x...x...x.',v:.7},{i:'stab',o:12,h:['x..x............',R16,R16,'............x.x-']}],
 lead:{i:'brass',mel:'A4/2 D5/2 F#5/2 A5/4 F#5/2 E5/2 D5/2  F#5/4 E5/2 D5/2 B4/4 D5/4  G5/2 F#5/2 E5/2 D5/2 B4/4 E5/4  C#5/2 E5/2 F#5/4 E5/2 C#5/2 A4/4'},
 pad:{v:.6}};
TR.cutscene={title:'Pizza Shop Afternoon',desc:'Story scenes by day: warm Rhodes, soft pocket, room for dialog.',
 bpm:90,swing:.16,vol:.85,prog:[['F','maj7'],['E','m7'],['D','m9'],['G','13'],['C','maj7'],['A','m9'],['D','m9'],['G','13']],
 drums:{A:dr(DR.lounge,{h:'x.o.x.o.x.o.x.o.',t:'..x...x...x...x.'}),F:DR.loungeF},dseq:'AAAF',dv:.8,
 bass:['0-....7...o..4..','0-....7...o..3..','0-....7...o..a..','0-....7.x.o..4.5'],
 comp:[{i:'ep',h:'x-..x-....x-..x.',v:.85}],
 lead:{i:'whistle',v:.6,mel:'r/4 A4/2 C5/2 E5/6 r/2  D5/2 B4/2 G4/4 r/8  r/4 F4/2 A4/2 E5/6 r/2  D5/2 E5/2 B4/4 r/8'}};
TR.cutscene_dark={title:'Something Smells Fishy',desc:'Ominous story scenes. Slow sneaky pocket, theremin, minor-major creep. Still nods your head.',
 bpm:80,swing:.16,prog:[['C','mM7'],['C','mM7'],['Ab','maj7'],['G','7b9'],['C','mM7'],['C','mM7'],['Ab','maj7'],['G','7b9']],
 drums:{A:DR.sneak,F:DR.sneakF},dseq:'AAAF',
 bassI:'sub',bass:['0-...0..7-.3..o.','0-...0..7-.3.5.6','0-...0..7-.4..o.','0-...0.x4-.7.5.4'],
 comp:[{i:'ep',h:'..x-......x-....',v:.6},{i:'clav',h:'.......g......g.',v:.5}],
 lead:{i:'theremin',at:4,mel:'G4/4 B4/4 C5/2 D5/2 Eb5/4  D5/2 C5/2 B4/4 G4/8  Ab4/4 C5/4 Eb5/4 G5/4  Ab5/4 G5/2 F5/2 D5/8'},
 pad:{v:.6}};
TR.villain={title:'Bigg Buff Baldey',desc:'Villain reveals and Baldey scenes. Heavy half-time strut, choir, the evil tritone hook.',
 bpm:76,swing:.1,prog:[['C','m'],['C','m'],['Db','maj7'],['G','7b9']],
 drums:{A:dr(DR.heavy,{d:'X...............'}),B:DR.heavy,F:DR.heavyF},dseq:'ABBF',
 bassI:'sub',bass:['0--.o..0-..3.5.6','0--.o..0-..3.5.7','0--.o..0-..4.7.o','0--.o..0-..4.5.6'],
 comp:[{i:'organ',h:'x-.......x-.....',v:.7},{i:'stab',o:0,h:[R16,'..........x..x..',R16,'x..x..x.........'],v:.8}],
 lead:{i:'brass',mel:'C4/4 Eb4/2 G4/2 F#4/4 F4/4  Eb4/2 F4/2 Eb4/2 C4/2 G3/8  Ab4/4 F4/4 Db4/4 C4/4  B3/4 D4/4 F4/2 Ab4/2 G4/4'},
 pad:{i:'choir',v:.9}};
TR.gameover={title:'Back to the Lair',desc:'Game over / mission failed. Slow, bluesy, still swinging. Try again!',
 bpm:72,swing:.22,vol:.85,prog:[['A','m9'],['D','m9'],['F','maj7'],['E','7s9']],
 drums:{A:DR.lounge,F:DR.loungeF},dseq:'AAAF',dv:.8,
 bass:['0-....7-..o..3..','0-....7-..o..a..','0-....7-..o..4..','0-....4-..7.a.o.'],
 comp:[{i:'ep',h:'..x-......x-....',v:.8}],
 lead:{i:'whistle',v:.75,mel:'E5/4 C5/2 B4/2 A4/8  F5/4 E5/2 D5/2 C5/8  C5/2 E5/2 A5/4 G5/4 E5/4  G#4/4 G4/4 E4/8'}};
TR.coco={title:"Coco's Strut",desc:'Agent Coco character screen. Confident A-dorian swagger with a horn hook.',
 bpm:100,swing:.16,prog:[['A','m9'],['D','9'],['A','m9'],['D','9'],['A','m9'],['D','9'],['A','m9'],['D','9']],
 drums:{A:DR.pocket,F:DR.pocketF},dseq:'AAAF',
 bass:['0-.o..0.3.5.7.o.','0-.o..0.4.7.a.o.','0-.o..0.3.5.7.oa','0-.o.x0.4.7.a.oL'],
 comp:[{i:'wah',h:'..x.x...x.x.x...',v:.6},{i:'stab',o:12,h:[R16,R16,R16,'............x.x-']}],
 lead:{i:'brass',at:4,mel:'A4/2 r/1 C5/1 D5/2 E5/2 G5/4 E5/4  F#5/2 E5/2 D5/2 C5/2 A4/8  A4/2 r/1 C5/1 D5/2 E5/2 A5/4 G5/4  F#5/4 E5/4 D5/4 C5/4'}};
TR.sisi={title:'Sisi Spins',desc:'Agent Sisi character screen. Bouncy, quick, cartwheeling F-major disco whistle.',
 bpm:114,swing:.1,prog:[['F','maj7'],['G','m9'],['A','m7'],['C','9']],
 drums:{A:DR.disco,F:DR.discoF},dseq:'AAAF',
 bass:['0.o..0o.7.o.4.o.','0.o..0o.7.o.3.o.','0.o..0o.7.o.3.o.','0.o..0o.4.7.a.o.'],
 comp:[{i:'clav',h:'..x.x..x..x.x..x',v:.65}],
 lead:{i:'whistle',mel:'C5/1 F5/1 A5/2 G5/1 F5/1 E5/2 F5/2 C5/2 A4/4  Bb4/1 D5/1 F5/2 E5/1 D5/1 C5/2 D5/2 Bb4/2 G4/4  C5/1 E5/1 G5/2 F5/1 E5/1 D5/2 E5/2 C5/2 A4/4  Bb4/2 C5/2 D5/2 E5/2 G5/8'}};
// === MISSIONS ===
TR.gilbert={title:'Heritage Heist',desc:'Gilbert, Mission 1. The v0.4 mission groove plus construction clanks.',
 bpm:102,swing:.14,prog:[['E','m9'],['A','13'],['E','m9'],['A','13'],['E','m9'],['A','13'],['E','m9'],['A','13']],
 drums:{A:dr(DR.pocket,{m:'..............x.'}),F:dr(DR.pocket,{k:'X.....x...x...x.',m:'......x.......x.'})},dseq:'AAAF',
 bass:['0-.o..035.7a.oa7','0-.o..0.4.7a0.LJ'],
 comp:[{i:'ep',h:'..x-......x--...'},{i:'stab',o:12,h:[R16,'...............x',R16,'............x.x.',R16,'...............x',R16,'............x.x-']}],
 lead:{i:'lead',at:4,mel:'B4/3 r/1 D5/2 E5/4 r/2 D5/1 B4/1 A4/2  G4/2 A4/2 B4/6 r/2 E4/4  B4/3 r/1 D5/2 E5/2 G5/4 F#5/2 E5/2  D5/2 B4/2 A4/2 G4/2 E4/8'},
 pad:{v:1}};
TR.rooftop={title:'Rooftop Run',desc:'Gilbert, Mission 2. A pizza run turns into a rooftop chase: four-on-the-floor G-minor disco funk.',
 bpm:116,swing:.06,prog:[['G','m9'],['G','m9'],['Eb','maj7'],['F','9'],['G','m9'],['G','m9'],['Eb','maj7'],['F','9']],
 drums:{A:dr(DR.disco,{z:'...x.......x....'}),F:DR.discoF},dseq:'AAAF',
 bass:['0.o.x.o.0.o.x.oa','0.o.x.o.0.3.5.7.','0.o.x.o.0.o.7.4.','0.o.x.o.0.4.7.a.'],
 comp:[{i:'wah',h:'x.x...x.x.x...x.',v:.55},{i:'stab',o:12,h:['..x..x....x.....','..x..x....x.....',R16,R16]}],
 lead:{i:'brass',at:4,mel:'D5/2 F5/2 G5/4 F5/2 D5/2 Bb4/4  C5/2 D5/2 F5/2 D5/2 C5/4 Bb4/4  G5/4 F5/2 Eb5/2 D5/4 Bb4/4  A4/2 C5/2 Eb5/2 G5/2 F5/8'}};
TR.crane_chase={title:'Crane Yard Chase',desc:'Gilbert, Mission 3. Scooter chase: driving 16th-note bass, breakbeat, clanking cranes.',
 bpm:124,swing:.04,prog:[['A','m7'],['A','m7'],['F','9'],['G','9'],['A','m7'],['A','m7'],['F','9'],['G','9']],
 drums:{A:dr(DR.brk,{m:'......x.......x.'}),F:DR.brkF},dseq:'AAAF',
 bass:['0.0o0.0a0.0o0.7.','0.0o0.0a0.0o3.5.','0.0o0.0a0.0o0.4.','0.0o0.0a0.4.7.a.'],
 comp:[{i:'clav',h:'..x...x...x...x.',v:.6},{i:'stab',o:12,h:[R16,R16,'x..x..x.........','x..x..x.....x.x.']}],
 lead:{i:'lead',at:4,mel:'E5/2 A5/2 G5/1 E5/1 D5/2 E5/4 C5/2 A4/2  C5/2 D5/2 E5/4 G5/2 E5/2 D5/4  Eb5/2 C5/2 A4/4 G4/2 A4/2 C5/4  B4/2 D5/2 F5/4 E5/4 D5/4'}};
TR.site_hack={title:'Permit Server',desc:'Gilbert, Mission 4 (hacking puzzle). Head-nodding clav loop that stays out of the way while you think.',
 bpm:108,swing:.12,vol:.9,prog:[['D','m9'],['D','m9'],['Bb','maj7'],['A','7s9']],
 drums:{A:dr(DR.brk,{g:'......x.....x...'}),F:dr(DR.brkF,{g:'..x.x.x.x.......'})},dseq:'AAAF',
 bassI:'synth',bass:['0..o.0..7.0.a.o.','0..o.0..7.0.3.5.','0..o.0..7.0.b.o.','0..o.x..4.0.a.o.'],
 comp:[{i:'clav',h:'..x.xg.x..x.x.gx',v:.65}],
 lead:{i:'bell',v:.75,mel:'r/16 D6/1 r/1 F6/1 r/1 A6/2 G6/2 E6/4 r/4  r/16 C#6/1 r/1 E6/1 r/1 G6/2 F6/2 E6/4 r/4'}};
TR.yard={title:'Wrecking Yard Approach',desc:'Gilbert, Mission 5 before the boss. Tense C-minor creep with hammer clanks, building up.',
 bpm:100,swing:.1,prog:[['C','m9'],['C','m9'],['Ab','maj7'],['G','7s9']],
 drums:{A:dr(DR.sneak,{m:'..........x.....'}),F:dr(DR.sneakF,{m:'..........x.x.x.'})},dseq:'AAAF',
 bass:['0-.o..0.3.5.6.7.','0-.o..0.3.5.a.o.','0-.o..0.4.7.b.o.','0-.o.x0.4.7.a.o.'],
 comp:[{i:'wah',h:'....x.......x...',v:.55},{i:'stab',o:12,h:[R16,R16,R16,'x..x..x.........']}],
 lead:{i:'lead',at:2,mel:'Eb5/4 C5/2 G4/2 Bb4/4 C5/4  B4/2 D5/2 F5/4 Eb5/2 D5/2 B4/4'},pad:{v:.7}};
TR.downtown={title:'Taxi Town',desc:'Downtown Phoenix. Wah guitar, honking taxi horns and a horn line straight off a 70s cop show.',
 bpm:106,swing:.16,prog:[['F','9'],['F','9'],['Bb','13'],['Bb','13'],['F','9'],['F','9'],['C','7s9'],['Bb','13']],
 drums:{A:DR.pocket,H:dr(DR.pocket,{n:'..............x.'}),F:dr(DR.pocketF,{n:'x...............'})},dseq:'AHAF',
 bass:['0-.o.a.07.0-o.a.','0-.o.a.07.0.4.5.','0-.o.a.07.0-o.a.','0-.o.a.0x7.0.4.L'],
 comp:[{i:'wah',h:'..x-x...x-x.x...',v:.6},{i:'stab',o:12,h:[R16,'..........x.x-..',R16,'..........x.x-..']}],
 lead:{i:'brass',at:4,mel:'C5/2 Eb5/2 F5/2 G5/2 A5/4 G5/2 F5/2  Eb5/4 C5/2 A4/2 C5/8  E5/2 Eb5/2 C5/2 Bb4/2 G4/8  F4/2 G4/2 Ab4/2 A4/2 Bb4/2 C5/2 D5/4'}};
TR.tempe={title:'Trash Can Funk',desc:'Tempe. Second-line street funk: sousaphone bass, banging trash-can lids, a trombone-y horn.',
 bpm:96,swing:.22,prog:[['Bb','7'],['Eb','9'],['Bb','7'],['F','9'],['Bb','7'],['Eb','9'],['F','9'],['Bb','7']],
 drums:{A:{k:'X..x..X...X..x..',s:'..g.X.g..g..X.gg',h:'x.x.x.x.x.x.x.x.',l:'......x.....x...'},F:{k:'X..x..X...X.....',s:'..g.X.g..g..XXXX',h:'x.x.x.x.x.x.....',l:'x.....x.........'}},dseq:'AAAF',
 bassI:'tuba',bass:['0-.7-.o-.7-.4.5.','0-.7-.o-.7-.a.9.','0-.7-.o-.7-.4.3.','0-.7-.o.x7..4.2.'],
 comp:[{i:'wah',h:'..x...x...x...x.',v:.55},{i:'organ',h:'....x-......x-..',v:.5}],
 lead:{i:'brass',at:4,o:-12,mel:'F4/2 Bb4/2 D5/3 C5/1 Bb4/2 Ab4/2 F4/4  G4/2 Bb4/2 Db5/4 C5/2 Bb4/2 G4/4  A4/2 C5/2 Eb5/4 D5/2 C5/2 A4/4  Bb4/4 r/2 F4/2 Bb4/8'}};
TR.chandler={title:'Silicon Strut',desc:'Chandler. Rubber synth bass, sparkly arpeggios, glitch percussion: robot funk.',
 bpm:110,swing:.08,prog:[['F#','m9'],['F#','m9'],['D','maj7'],['E','9'],['F#','m9'],['F#','m9'],['B','m9'],['C#','7s9']],
 drums:{A:dr(DR.pocket,{z:R16,g:'..x.......x...x.'}),F:dr(DR.pocketF,{z:R16,g:'..x.x.x.x.x.x...'})},dseq:'AAAF',
 bassI:'synth',bass:['0..o.0o.7.0.a.o.','0..o.0o.7.0.3.5.','0..o.0o.7.0.b.o.','0..o.xo.4.7.a.o.'],
 comp:[{i:'arp',a:'bell',h:'x.x.x.x.x.x.x.x.',v:.6}],
 lead:{i:'synth',at:4,mel:'C#5/2 E5/2 F#5/2 A5/2 G#5/4 E5/4  F#5/2 E5/2 C#5/4 B4/2 C#5/2 E5/4  D5/2 F#5/2 A5/4 C#6/4 B5/4  F5/2 E5/2 C#5/4 B4/4 G#4/4'},
 pad:{v:.6}};
TR.tower={title:"Baldey's Tower",desc:'The finale territory. Dark C-minor funk: organ, horns, theremin playing the villain hook.',
 bpm:98,swing:.12,prog:[['C','m9'],['C','m9'],['Ab','maj7'],['G','7s9'],['C','m9'],['C','m9'],['Db','maj7'],['G','7b9']],
 drums:{A:DR.pocket,F:DR.pocketF},dseq:'AAAF',
 bassI:'sub',bass:['0-.o..0.36.7.oa7','0-.o..0.3.5.7.a.','0-.o..0.4.7.b.o.','0-.o.x0.4.7.a.o.'],
 comp:[{i:'organ',h:'..x-......x-....',v:.7},{i:'stab',o:12,h:[R16,R16,R16,'x..x..x.....x.x-']}],
 lead:{i:'theremin',at:4,mel:'C5/4 Eb5/2 G5/2 F#5/4 F5/4  Eb5/2 F5/2 Eb5/2 C5/2 G4/8  Ab5/4 F5/4 Db5/4 C5/4  B4/4 D5/4 F5/2 Ab5/2 G5/4'},
 pad:{i:'choir',v:.7}};
// === BOSSES ===
TR.foreman={title:'Hard Hat Hustle',desc:'Mini-boss (the Foreman). Stomping E-minor funk-rock with clanks on every hammer swing.',
 bpm:112,swing:.06,prog:[['E','m7'],['E','m7'],['G','7'],['A','7']],
 drums:{A:dr(DR.drive,{m:'..x.......x.....'}),F:dr(DR.driveF,{m:'..x.x.x.........'})},dseq:'AAAF',
 bass:['0.0o..0.3.0o5.7.','0.0o..0.3.0o7.a.','0.0o..0.4.0o7.4.','0.0o..0.4.7.a.o.'],
 comp:[{i:'stab',o:12,h:['x..x..x.........','x..x..x.........','x..x..x.........','x..x..x.x.x.x-..']},{i:'clav',h:'........x.x...x.',v:.5}],
 lead:{i:'lead',mel:'r/8 B4/2 D5/2 E5/4  r/8 G5/2 F#5/2 E5/4  r/8 F5/2 D5/2 B4/4  r/8 C#5/2 E5/2 G5/4'}};
TR.runner={title:'Catch That Courier',desc:'Chase boss (the fleeing courier). Fastest track in the game, galloping bass and cowbell.',
 bpm:132,swing:.02,prog:[['D','m7'],['D','m7'],['Bb','9'],['C','9']],
 drums:{A:dr(DR.disco,{b:'x..x..x.x..x..x.'}),F:DR.discoF},dseq:'AAAF',
 bass:['0.0o0.0o0.0o0.o7','0.0o0.0o0.3.5.7.','0.0o0.0o0.0o4.7.','0.0o0.0o4.7.a.o.'],
 comp:[{i:'wah',h:'x.x.x.x.x.x.x.x.',v:.45},{i:'stab',o:12,h:[R16,'............x.x-',R16,'x..x..x.........']}],
 lead:{i:'lead',mel:'A5/2 F5/2 D5/2 F5/2 A5/2 C6/2 A5/4  G5/2 F5/2 E5/2 F5/2 D5/8  F5/2 D5/2 Bb4/2 D5/2 F5/2 A5/2 G5/4  E5/2 G5/2 Bb5/2 A5/2 G5/8'}};
TR.papa_johnny={title:'Wrecking Yard',desc:'Papa Johnny boss. The v0.4 boss groove: driving C minor, horn stabs, now with clanks.',
 bpm:118,swing:.04,prog:[['C','m'],['C','m'],['Ab','M'],['G','M']],
 drums:{A:dr(DR.drive,{m:'......x.......x.'}),F:dr(DR.drive,{m:'......x...x.x.x.'})},dseq:'AAAF',
 bass:['0.o0o.0o0.oa0.o7'],
 comp:[{i:'stab',o:12,h:['x..x..x-........','x..x..x-........','x..x..x-........','x..x..x.x.x.x-..']}],
 lead:{i:'lead',mel:'r/8 G4/2 Ab4/2 G4/4  r/8 Eb5/2 D5/2 C5/4  r/8 Eb5/2 F5/2 Eb5/4  r/8 D5/2 B4/2 G4/4'},
 pad:{v:1}};
TR.honky_tony={title:"Honk If You're Funky",desc:'Honky Tony boss (Downtown). Frantic horn-and-honk disco, F mixolydian.',
 bpm:126,swing:.04,prog:[['F','7'],['F','7'],['Eb','7'],['C','7s9']],
 drums:{A:dr(DR.disco,{n:'x.....x.........'}),F:dr(DR.discoF,{n:'x.x.x...........'})},dseq:'AAAF',
 bass:['0.o.0.o.0.o.3.4.','0.o.0.o.0.o.7.a.','0.o.0.o.0.o.3.4.','0.o.0.o.4.7.a.o.'],
 comp:[{i:'stab',o:12,h:['..x..x....x.....']},{i:'wah',h:'x...x...x...x...',v:.5}],
 lead:{i:'brass',mel:'A5/2 r/2 A5/2 G5/2 F5/2 Eb5/2 C5/4  F5/2 r/2 F5/2 Eb5/2 C5/2 A4/2 C5/4  G5/2 r/2 G5/2 F5/2 Eb5/2 Db5/2 Bb4/4  E5/2 Eb5/2 C5/4 Bb4/2 G4/2 E4/4'}};
TR.stinky_pete={title:'Stink Cloud Stomp',desc:'Stinky Pete boss (Tempe). Sludgy half-time Eb-minor stomp: tuba, trash cans, a goofy blue-note horn.',
 bpm:92,swing:.2,prog:[['Eb','m9'],['Eb','m9'],['B','maj7'],['Bb','7s9']],
 drums:{A:dr(DR.heavy,{l:'....x.......x...'}),F:dr(DR.heavyF,{l:'....x...x.x.x...'})},dseq:'AAAF',
 bassI:'tuba',bass:['0--.0..7-.o..a.0','0--.0..7-.o..6.7','0--.0..7-.o..b.o','0--.0.x4-.7..a.o'],
 comp:[{i:'wah',h:'....x.......x-..',v:.6},{i:'organ',h:'x-..............',v:.5}],
 lead:{i:'brass',mel:'Eb4/4 Gb4/2 Ab4/2 A4/2 Bb4/6  Db5/4 Bb4/2 Gb4/2 Eb4/8  Gb4/4 Bb4/2 Eb5/2 Db5/4 Bb4/4  D5/2 Db5/2 Bb4/4 Ab4/4 F4/4'}};
TR.dr_glitch={title:'Glitch Funk',desc:'Dr. Glitch boss (Chandler). Fast robot funk: synth bass, arps, glitches everywhere.',
 bpm:128,swing:.02,prog:[['B','m9'],['B','m9'],['G','maj7'],['F#','7s9']],
 drums:{A:dr(DR.drive,{g:'..x.x...x.x.x..x'}),F:dr(DR.driveF,{g:'xxxx....x.x.....'})},dseq:'AAAF',
 bassI:'synth',bass:['0.0o.0o.0.0o.a.7','0.0o.0o.0.0o.3.5','0.0o.0o.0.0o.b.7','0.0o.xo.4.7.a.o.'],
 comp:[{i:'arp',a:'synth',h:'xxxxxxxxxxxxxxxx',v:.35}],
 lead:{i:'synth',mel:'F#5/1 r/1 F#5/1 A5/1 B5/2 A5/2 F#5/2 E5/2 D5/4  F#5/1 r/1 F#5/1 A5/1 C#6/2 B5/2 A5/2 F#5/2 E5/4  D6/2 B5/2 F#5/2 D5/2 B5/4 A5/4  A#5/2 A5/2 F#5/2 E5/2 C#5/8'}};
TR.baldey={title:'Final Showdown',desc:'Bigg Buff Baldey boss. The villain hook goes full band: choir, organ, horns, sub booms.',
 bpm:112,swing:.08,prog:[['C','m'],['C','m'],['Ab','7'],['G','7b9'],['C','m'],['C','m'],['Db','maj7'],['G','7b9']],
 drums:{A:dr(DR.drive,{d:'X...............'}),B:DR.drive,F:DR.driveF},dseq:'ABBF',
 bassI:'sub',bass:['0.o0..6.7.0.o.a.','0.o0..6.7.0.3.5.','0.o0..4.7.0.a.o.','0.o0.x4.7.a.o.7.'],
 comp:[{i:'organ',h:'x-......x-......',v:.6},{i:'stab',o:12,h:[R16,'..........x..x..',R16,'x..x..x.x.x.x-..']}],
 lead:{i:'brass',mel:'C5/4 Eb5/2 G5/2 F#5/4 F5/4  Eb5/2 F5/2 Eb5/2 C5/2 G4/8  Gb5/4 Eb5/4 C5/4 Ab4/4  B4/4 D5/4 F5/2 Ab5/2 G5/4  G5/2 G5/2 Bb5/2 C6/2 Bb5/2 G5/2 F5/4  Eb5/2 F5/2 G5/4 Eb5/2 C5/2 G4/4  F5/2 Ab5/2 C6/4 Ab5/2 F5/2 Db5/4  B4/2 D5/2 F5/2 Ab5/2 B5/8'},
 pad:{i:'choir',v:.8}};

// === v0.11: Barro's shop and pizza delivery runs ===
TR.shop={title:"Barro's Counter",desc:"Barro's Shop. Friendly corner-store boogie: Rhodes, clav and a whistle that sounds like a bell over the door.",
 bpm:100,swing:.16,prog:[['C','maj7'],['A','m9'],['D','m9'],['G','13']],
 drums:{A:dr(DR.lounge,{t:'..x...x...x...x.'}),F:DR.loungeF},dseq:'AAAF',
 bass:['0-..7.o..0.4.7..','0-..7.o..0.3.7..','0-..7.o..0.3.a..','0-..7.o.x0.4.a.L'],
 comp:[{i:'ep',h:'..x-.......x--..',v:.8},{i:'clav',h:'....g.x...g..x.g',v:.55}],
 lead:{i:'whistle',at:4,mel:'G5/2 E5/2 C5/2 E5/2 G5/4 A5/4  C6/2 A5/2 G5/2 E5/2 D5/4 r/4  F5/2 A5/2 C6/4 B5/2 A5/2 F5/4  G5/3 F5/1 E5/2 D5/2 B4/8'},
 pad:{v:.6}};
TR.delivery={title:'Hot Pizza Express',desc:'Pizza delivery runs. Up-tempo pedal-pushing disco funk: octave slap bass, cowbell, horn hits on every turn.',
 bpm:116,swing:.08,prog:[['F','9'],['F','9'],['Bb','13'],['C','7s9']],
 drums:{A:dr(DR.disco,{b:'..x...x...x...x.'}),F:DR.discoF},dseq:'AAAF',
 bass:['0.o.0.o.7.o.4.o.','0.o.0.o.7.o.a.o.','0.o.0.o.7.o.4.o.','0.o.0.o.4.7.a.o.'],
 comp:[{i:'clav',h:'..x...x...x...x.',v:.7},{i:'stab',o:12,h:['x..x............',R16,R16,'............x.x-']}],
 lead:{i:'brass',mel:'C5/2 F5/2 A5/2 C6/4 A5/2 G5/2 F5/2  A5/4 G5/2 F5/2 D5/4 F5/4  Bb5/2 A5/2 G5/2 F5/2 D5/4 G5/4  E5/2 G5/2 Bb5/4 A5/2 G5/2 E5/4'},
 pad:{v:.5}};

// names other code may use -> real tracks
const MUSIC_ALIAS={menu:'title',level:'gilbert',boss:'papa_johnny',
 gilbert_1:'gilbert',gilbert_2:'rooftop',gilbert_3:'crane_chase',gilbert_4:'site_hack',gilbert_5:'yard',
 downtown_1:'downtown',tempe_1:'tempe',chandler_1:'chandler',tower_1:'tower',
 hack:'site_hack',chase:'crane_chase',stealth:'cutscene_dark',
 char_coco:'coco',char_sisi:'sisi',cutscene_villain:'villain',lose:'gameover',game_over:'gameover',
 papa_johnny_final:'papa_johnny',bigg_buff_baldey:'baldey',lair_watch:'watch',code:'enter_code'};
const MUSIC_LIST=Object.keys(TR).map(k=>({name:k,title:TR[k].title,desc:TR[k].desc}));
function musicName(n){n=String(n||'');if(TR[n])return n;if(MUSIC_ALIAS[n])return MUSIC_ALIAS[n];
 const p=n.split('_')[0];for(const t of ['gilbert','downtown','tempe','chandler','tower'])if(p===t)return t;return 'gilbert';}
const THEME_MUSIC={gilbert_night:'gilbert',gilbert_rooftops:'rooftop',gilbert_craneyard:'crane_chase',gilbert_office:'site_hack',gilbert_wreckingyard:'yard'};
function levelMusic(def){def=def||{};
 for(const c of [def.music,def.type,THEME_MUSIC[def.theme]])if(c&&(TR[c]||MUSIC_ALIAS[c]))return musicName(c);
 if(def.theme)return musicName(def.theme);return 'gilbert';}
function bossMusic(def){def=def||{};const b=def.boss||{};
 for(const c of [def.bossMusic,b.music,b.type])if(c&&(TR[c]||MUSIC_ALIAS[c]))return musicName(c);
 const th=String(def.theme||'').split('_')[0];
 return {downtown:'honky_tony',tempe:'stinky_pete',chandler:'dr_glitch',tower:'baldey'}[th]||'papa_johnny';}
const COMPILED={};
function getTrack(n){return COMPILED[n]||(COMPILED[n]=compileTrack(TR[n]));}

// ---- sequencer: schedules 16th notes slightly ahead of time for tight timing ----
const MT={track:null,name:'',next:0,pos:0,timer:null,gain:null,stack:[],resume:{}};
function startMusic(name='level',from=0){const a=audio();if(!a)return;const M=musBus();if(!M)return;const n=musicName(name);if(MT.name===n&&MT.timer)return;
 stopMusic();const T=getTrack(n);MT.track=T;MT.name=n;MT.pos=from%T.N;MT.next=a.currentTime+.08;
 const g=a.createGain();g.gain.setValueAtTime(0.0001,a.currentTime);g.gain.linearRampToValueAtTime(T.vol,a.currentTime+.06);g.connect(M.bus);MT.gain=g;M.music=g;M.thF=0;
 MT.timer=setInterval(musicTick,25);}
function stopMusic(){if(MT.timer)clearInterval(MT.timer);MT.timer=null;if(MT.name)MT.resume[MT.name]=MT.pos;MT.name='';
 if(MT.gain&&MUS){const g=MT.gain,t=MUS.a.currentTime;g.gain.cancelScheduledValues(t);g.gain.setValueAtTime(g.gain.value,t);g.gain.linearRampToValueAtTime(0.0001,t+.25);setTimeout(()=>{try{g.disconnect();}catch(e){}},3000);}MT.gain=null;}
// overlays (Gadget Watch): remember what was playing, come back to the same bar
function pushMusic(name){MT.stack.push(MT.name);startMusic(name);}
function popMusic(){const prev=MT.stack.pop();if(prev===undefined)return;if(!prev){stopMusic();return;}const pos=MT.resume[prev]||0;startMusic(prev,pos-(pos%16));}
function musicTick(){const a=AC,M=MUS;if(!a||!M||!MT.track)return;M.master.gain.setTargetAtTime(muted?0:.9,a.currentTime,.03);
 if(document.hidden||a.state!=='running'){MT.next=a.currentTime+.05;return;}
 if(MT.next<a.currentTime-.05)MT.next=a.currentTime+.02;
 const T=MT.track;
 while(MT.next<a.currentTime+.12){const s=MT.pos;playStep(T,s,MT.next+((s%2)?T.sd*T.swing:0));MT.next+=T.sd;MT.pos=(s+1)%T.N;}}
function playStep(T,s,t){for(const e of T.ev[s])e[0](t,e[1],e[2],e[3]);}

// ---- stingers: short jingles that play on top of (or instead of) the music ----
const STINGERS={
 win:{bpm:120,f(t,q){for(const[s,n,l]of [[0,'C5',1],[1,'E5',1],[2,'G5',1],[3,'Bb5',1],[4,'C6',6]])brass(t+s*q,nm(n),l*q);
  stab(t+4*q,nms('E4 Bb4 D5'),3*q);stab(t+8*q,nms('E4 Bb4 D5'),4*q);kick(t);clap(t+4*q);kick(t+4*q);bass(t+4*q,nm('C2'),6*q);clap(t+8*q);hat(t+10*q,.8,true);}},
 lose:{bpm:80,f(t,q){[['G4',0],['F#4',2],['F4',4],['E4',6]].forEach(([n,s],i)=>brass(t+s*q,nm(n),(i===3?6:2)*q,.9));
  bass(t+6*q,nm('E2'),6*q);snare(t+6*q,.5);hat(t+8*q,.5,true);}},
 clue:{bpm:140,f(t,q){['E6','G6','B6','E7'].forEach((n,i)=>bell(t+i*q,nm(n),.5,.9));}},
 unlock:{bpm:140,f(t,q){['C5','E5','G5','C6','E6','G6'].forEach((n,i)=>bell(t+i*q*.6,nm(n),.5,.8));stab(t+4*q,nms('C5 E5 G5 B5'),3*q,.8);kick(t+4*q,.7);clap(t+4*q,.6);}},
 code_ok:{bpm:130,f(t,q){clav(t,nms('A4 C5 E5'),q*.8);clav(t+q,nms('A4 C5 E5'),q*.8);bell(t+2*q,nm('A6'),.4);bell(t+3*q,nm('E7'),.6);}},
 code_bad:{bpm:130,f(t,q){for(const s of [0,1.5]){const g=gainTo(MUS.music);env(g,t+s*q,.14,.004,.18);osc('square',110,t+s*q,t+s*q+.2,filt('lowpass',900,2,g));}}}};
function playStinger(name){const a=audio();if(!a)return;const M=musBus();if(!M||muted||document.hidden||a.state!=='running')return;const S=STINGERS[name];if(!S)return;
 const g=a.createGain();g.gain.value=1;g.connect(M.bus);const keep=M.music;M.music=g;try{S.f(a.currentTime+.02,60/S.bpm/4);}finally{M.music=keep;}
 setTimeout(()=>{try{g.disconnect();}catch(e){}},5000);}

// ---- punchier sound effects (override the simple beeps) ----
function sfxOk(){const M=musBus();return M&&!muted&&!document.hidden&&M.a.state==='running'?M:null;}
Object.assign(SFX,{
 swipe(){const M=sfxOk();if(!M)return;const t=M.a.currentTime,g=gainTo(M.sfx);env(g,t,.22,.002,.07);const f=filt('bandpass',1400,1.5,g);f.frequency.setValueAtTime(900,t);f.frequency.exponentialRampToValueAtTime(4200,t+.07);noiseSrc(t,.09,f);},
 whoosh(){const M=sfxOk();if(!M)return;const t=M.a.currentTime,g=gainTo(M.sfx);env(g,t,.3,.01,.16);const f=filt('bandpass',600,1.2,g);f.frequency.setValueAtTime(500,t);f.frequency.exponentialRampToValueAtTime(3000,t+.15);noiseSrc(t,.18,f);},
 hit(){const M=sfxOk();if(!M)return;const t=M.a.currentTime;const g=gainTo(M.sfx);env(g,t,.7,.001,.13);const o=osc('sine',170,t,t+.16,g);o.frequency.exponentialRampToValueAtTime(55,t+.1);
  const n=gainTo(M.sfx);env(n,t,.35,.001,.05);noiseSrc(t,.06,filt('lowpass',2400,1,n));},
 smash(){const M=sfxOk();if(!M)return;const t=M.a.currentTime;const g=gainTo(M.sfx);env(g,t,.9,.001,.25);const o=osc('sine',140,t,t+.3,g);o.frequency.exponentialRampToValueAtTime(40,t+.2);
  const n=gainTo(M.sfx,.4);env(n,t,.5,.001,.18);noiseSrc(t,.2,filt('lowpass',1800,.8,n));const c=gainTo(M.sfx);env(c,t,.12,.001,.12);osc('square',880,t,t+.12,c).frequency.exponentialRampToValueAtTime(300,t+.1);},
 jump(){const M=sfxOk();if(!M)return;const t=M.a.currentTime,g=gainTo(M.sfx);env(g,t,.12,.003,.16);const o=osc('square',320,t,t+.18,filt('lowpass',2500,1,g));o.frequency.exponentialRampToValueAtTime(820,t+.12);
  const s=gainTo(M.sfx);env(s,t,.08,.003,.12);osc('sine',640,t,t+.14,s).frequency.exponentialRampToValueAtTime(1400,t+.1);},
 jump2(){const M=sfxOk();if(!M)return;const t=M.a.currentTime;[0,.05,.1].forEach((d,i)=>{const g=gainTo(M.sfx,.3);env(g,t+d,.08,.002,.12);osc('triangle',[880,1175,1568][i],t+d,t+d+.15,g);});},
 land(){const M=sfxOk();if(!M)return;const t=M.a.currentTime,g=gainTo(M.sfx);env(g,t,.35,.001,.09);osc('sine',110,t,t+.1,g).frequency.exponentialRampToValueAtTime(50,t+.08);}
});
