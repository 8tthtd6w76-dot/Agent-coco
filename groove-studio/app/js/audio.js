// ===== Groove Studio audio core: context, buses, channel strips, drum kits, metronome, WAV, pitch shift =====
'use strict';
const MUSIC_LITE=false;
let MUS=null;               // {a: AudioContext, rev: reverb input} — the FM-1 engine reads this
let AC=null;                // the live AudioContext
const mtof=m=>440*Math.pow(2,(m-69)/12);
function gainTo(dest,send=0){const g=MUS.a.createGain();g.connect(dest);if(send&&MUS.rev){const s=MUS.a.createGain();s.gain.value=send;g.connect(s);s.connect(MUS.rev);}return g;}
function filt(type,f,q,out){const b=MUS.a.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;b.connect(out);return b;}

// one reverb impulse, made once per sample rate
const IR_CACHE={};
function makeIR(a,secs=2.4){const k=a.sampleRate+':'+secs;if(IR_CACHE[k])return IR_CACHE[k];const n=Math.floor(a.sampleRate*secs),b=a.createBuffer(2,n,a.sampleRate);
 for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++){const t=i/n;d[i]=(Math.random()*2-1)*Math.pow(1-t,3.2)*(i<a.sampleRate*.012?i/(a.sampleRate*.012):1);}}
 return IR_CACHE[k]=b;}

// The mixer for one context (live or offline export): master, reverb bus, echo bus, and a strip per track.
function makeMixer(a){const M={a,strips:{}};
 M.master=a.createGain();M.master.gain.value=.9;
 M.comp=a.createDynamicsCompressor();M.comp.threshold.value=-10;M.comp.knee.value=8;M.comp.ratio.value=4;M.comp.attack.value=.004;M.comp.release.value=.15;
 M.master.connect(M.comp);M.comp.connect(a.destination);
 M.rev=a.createConvolver();M.rev.buffer=makeIR(a);const rg=a.createGain();rg.gain.value=.55;M.rev.connect(rg);rg.connect(M.master);
 M.dly=a.createDelay(2);M.dlyFb=a.createGain();M.dlyFb.gain.value=.38;const dlp=a.createBiquadFilter();dlp.type='lowpass';dlp.frequency.value=3800;
 M.dly.connect(dlp);dlp.connect(M.dlyFb);M.dlyFb.connect(M.dly);dlp.connect(M.master);
 M.click=a.createGain();M.click.gain.value=.5;M.click.connect(a.destination);
 if(a.createAnalyser){M.an=a.createAnalyser();M.an.fftSize=1024;M.comp.connect(M.an);}
 return M;}
function setDelayTime(M,bpm){M.dly.delayTime.value=Math.min(1.9,60/bpm*.75);}   // dotted 8th echo
// channel strip: in -> tone (lowpass) -> pan -> vol -> master, with reverb + echo sends after the fader
function stripFor(M,tr){let s=M.strips[tr.id];const a=M.a;
 if(!s){s={};s.in=a.createGain();s.tone=a.createBiquadFilter();s.tone.type='lowpass';s.pan=a.createStereoPanner();s.vol=a.createGain();
  s.rev=a.createGain();s.dly=a.createGain();s.in.connect(s.tone);s.tone.connect(s.pan);s.pan.connect(s.vol);s.vol.connect(M.master);s.vol.connect(s.rev);s.vol.connect(s.dly);
  s.rev.connect(M.rev);s.dly.connect(M.dly);
  if(a.createAnalyser){s.an=a.createAnalyser();s.an.fftSize=256;s.vol.connect(s.an);}
  M.strips[tr.id]=s;}
 return s;}
function applyStrip(M,tr,audible){const s=stripFor(M,tr),t=M.a.currentTime,fx=tr.fx;
 s.vol.gain.setTargetAtTime(audible?tr.vol*tr.vol:0,t,.015);s.pan.pan.setTargetAtTime(tr.pan,t,.015);
 s.tone.frequency.setTargetAtTime(200*Math.pow(100,fx.tone),t,.02);s.rev.gain.setTargetAtTime(fx.rev*.8,t,.02);s.dly.gain.setTargetAtTime(fx.dly*.7,t,.02);return s;}
function meterLevel(an){if(!an)return 0;const d=new Float32Array(an.fftSize);an.getFloatTimeDomainData(d);let p=0;for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>p)p=v;}return p;}

// ---------- drum kits: 16 synthesized pads per kit, rendered once to buffers ----------
// one color per pad (drums warm, hats cool, toms green, percussion purple) so pads, step rows and clips match
const PAD_COLORS=['#ff5d5d','#ffa94d','#ffd43b','#4dd4ff','#3bc9db','#f783ac','#51cf66','#8ce99a','#c0eb75','#da77f2','#74c0fc','#e599f7','#66d9e8','#ffc078','#9775fa','#ff8787'];
const PAD_EMOJI=['🥁','🪘','👏','✨','💫','🥢','🛢️','🪣','🥫','🔔','🧂','🪇','💥','🫰','👾','💣'];
const PAD_NAMES=['Kick','Snare','Clap','Closed Hat','Open Hat','Rim','Low Tom','Mid Tom','High Tom','Cowbell','Shaker','Conga','Crash','Snap','Blip','Kick 2'];
const KITS_DEF=[
 {n:'Funk',k:{f:55,drop:120,dec:.38,click:.5},s:{tone:190,dec:.18,snap:.7},hat:{f:8000,dec:.05},tom:1,pitch:0},
 {n:'Boom Bap',k:{f:50,drop:90,dec:.5,click:.8,dirt:.4},s:{tone:170,dec:.22,snap:.9,dirt:.3},hat:{f:6500,dec:.07},tom:.9,pitch:-2,lofi:1},
 {n:'808',k:{f:46,drop:60,dec:1.3,click:.2,dirt:.15},s:{tone:230,dec:.16,snap:.6},hat:{f:9000,dec:.04},tom:1.1,pitch:0},
 {n:'House',k:{f:52,drop:140,dec:.32,click:.6},s:{tone:210,dec:.14,snap:.5},hat:{f:10000,dec:.035},tom:1,pitch:2},
 {n:'Lo-Fi',k:{f:58,drop:80,dec:.35,click:.3},s:{tone:180,dec:.2,snap:.5},hat:{f:5200,dec:.06},tom:.85,pitch:-3,lofi:2}];
function noiseBuf(a,secs){const n=Math.floor(a.sampleRate*secs),b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;return b;}
function envG(a,t,peak,att,dec,dest){const g=a.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(peak,t+att);g.gain.exponentialRampToValueAtTime(.0008,t+att+dec);g.connect(dest);return g;}
function oscAt(a,type,f,t,end,dest){const o=a.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);o.connect(dest);o.start(t);o.stop(end);return o;}
function noiseAt(a,t,end,dest){const s=a.createBufferSource();s.buffer=noiseBuf(a,end-t+.05);s.connect(dest);s.start(t);s.stop(end);return s;}
function bq(a,type,f,q,dest){const b=a.createBiquadFilter();b.type=type;b.frequency.value=f;b.Q.value=q;b.connect(dest);return b;}
function shaper(a,amt,dest){const w=a.createWaveShaper(),n=512,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(x*(1+amt*6))/Math.tanh(1+amt*6);}w.curve=c;w.connect(dest);return w;}
function drumVoice(a,K,pad,out){const t=0,p=Math.pow(2,(K.pitch||0)/12);
 const kick=(k,mul=1)=>{const g=envG(a,t,1,.001,k.dec,k.dirt?shaper(a,k.dirt,out):out);const o=oscAt(a,'sine',k.f*mul+k.drop,t,t+k.dec+.1,g);o.frequency.exponentialRampToValueAtTime(k.f*mul,t+.06);
  if(k.click){const cg=envG(a,t,.35*k.click,.0005,.012,out);noiseAt(a,t,t+.03,bq(a,'highpass',3000,.7,cg));}};
 const tom=f=>{f*=K.tom*p;const g=envG(a,t,.8,.001,.32,out);const o=oscAt(a,'sine',f*1.6,t,t+.4,g);o.frequency.exponentialRampToValueAtTime(f,t+.08);};
 switch(pad){
  case 0:kick(K.k);break;
  case 15:kick(Object.assign({},K.k,{dec:K.k.dec*.6,drop:K.k.drop*1.5}),1.25);break;
  case 1:{const s=K.s,dest=s.dirt?shaper(a,s.dirt,out):out;const g=envG(a,t,.55,.001,s.dec*.6,dest);const o=oscAt(a,'triangle',s.tone*p*1.6,t,t+.2,g);o.frequency.exponentialRampToValueAtTime(s.tone*p,t+.05);
   const ng=envG(a,t,.7*s.snap,.001,s.dec,dest);noiseAt(a,t,t+s.dec+.05,bq(a,'highpass',1200,.7,bq(a,'peaking',4500,1,ng)));break;}
  case 2:{for(let i=0;i<3;i++){const g=envG(a,t+i*.011,.45,.0008,i<2?.012:.16,out);noiseAt(a,t+i*.011,t+.25,bq(a,'bandpass',1250*p,1.4,g));}break;}
  case 3:{const g=envG(a,t,.35,.0008,K.hat.dec,out);noiseAt(a,t,t+K.hat.dec+.05,bq(a,'highpass',K.hat.f*p,.8,g));break;}
  case 4:{const g=envG(a,t,.3,.002,.42,out);noiseAt(a,t,t+.5,bq(a,'highpass',K.hat.f*.85*p,.8,g));break;}
  case 5:{const g=envG(a,t,.5,.0005,.05,out);oscAt(a,'square',1700*p,t,t+.08,bq(a,'bandpass',1700*p,3,g));noiseAt(a,t,t+.04,bq(a,'highpass',2500,1,envG(a,t,.25,.0005,.02,out)));break;}
  case 6:tom(90);break;case 7:tom(130);break;case 8:tom(185);break;
  case 9:{const g=envG(a,t,.3,.001,.28,out),f=bq(a,'bandpass',800*p,2.5,g);oscAt(a,'square',540*p,t,t+.32,f);oscAt(a,'square',800*p,t,t+.32,f);break;}
  case 10:{const g=envG(a,t,.28,.025,.07,out);noiseAt(a,t,t+.14,bq(a,'highpass',6500,1.2,g));break;}
  case 11:{const g=envG(a,t,.6,.001,.22,out);const o=oscAt(a,'sine',380*p,t,t+.3,g);o.frequency.exponentialRampToValueAtTime(300*p,t+.04);break;}
  case 12:{const g=envG(a,t,.32,.002,1.4,out);noiseAt(a,t,t+1.5,bq(a,'highpass',4200*p,.6,g));const g2=envG(a,t,.08,.001,.8,out);[310,467,598,832].forEach(f=>oscAt(a,'square',f*p*2,t,t+1,bq(a,'highpass',3000,1,g2)));break;}
  case 13:{const g=envG(a,t,.55,.0005,.07,out);noiseAt(a,t,t+.1,bq(a,'bandpass',2100*p,2,g));break;}
  case 14:{const g=envG(a,t,.25,.001,.14,out);const o=oscAt(a,'square',1320*p,t,t+.16,g);o.frequency.setValueAtTime(1980*p,t+.05);break;}}}
async function renderKit(K){const sr=44100,out=[];for(let pad=0;pad<16;pad++){const len=pad===12?1.6:pad===0||pad===15?Math.max(.6,K.k.dec+.2):.7;
  const o=new OfflineAudioContext(1,Math.ceil(sr*len),sr);const g=o.createGain();g.gain.value=.9;
  let dest=g;if(K.lofi){const lp=o.createBiquadFilter();lp.type='lowpass';lp.frequency.value=K.lofi>1?5200:8000;lp.connect(g);dest=lp;}
  g.connect(o.destination);drumVoice(o,K,pad,dest);out.push(await o.startRendering());}
 return out;}
const KIT_BUFS=[];   // KIT_BUFS[kit][pad] = AudioBuffer (filled at start)
async function loadKits(){for(let i=0;i<KITS_DEF.length;i++)KIT_BUFS[i]=await renderKit(KITS_DEF[i]);}

// ---------- metronome ----------
function clickAt(M,t,accent){const a=M.a,g=a.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(accent?.5:.3,t+.001);g.gain.exponentialRampToValueAtTime(.0005,t+.05);g.connect(M.click);
 const o=a.createOscillator();o.type='square';o.frequency.value=accent?1760:1175;o.connect(bq(a,'bandpass',accent?1760:1175,4,g));o.start(t);o.stop(t+.06);}

// ---------- audio pool helpers: mono Float32 at the context rate ----------
function toMono(buf){const n=buf.length,d=new Float32Array(n);for(let c=0;c<buf.numberOfChannels;c++){const s=buf.getChannelData(c);for(let i=0;i<n;i++)d[i]+=s[i]/buf.numberOfChannels;}return d;}
function bufFrom(a,data,sr){const b=a.createBuffer(1,Math.max(1,data.length),sr);b.getChannelData(0).set(data);return b;}
function peakOf(d){let p=0;for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>p)p=v;}return p;}
// pitch shift that keeps the length: resample, then overlap-add time-stretch back (simple and clean enough for vocals)
function pitchShift(d,sr,semis){if(!semis)return d;const r=Math.pow(2,semis/12),n=d.length;
 const rs=new Float32Array(Math.floor(n/r));for(let i=0;i<rs.length;i++){const x=i*r,i0=x|0,f=x-i0;rs[i]=(d[i0]||0)*(1-f)+(d[i0+1]||0)*f;}
 const W=Math.floor(sr*.046),H=W>>2,out=new Float32Array(n),norm=new Float32Array(n),win=new Float32Array(W);for(let i=0;i<W;i++)win[i]=.5-.5*Math.cos(2*Math.PI*i/W);
 const stretch=n/rs.length;let prevIn=0;
 for(let o=0;o<n;o+=H){let ip=Math.floor(o/stretch);
  // small search so grains line up (WSOLA-lite) to avoid phasey warble
  if(o>0){let best=ip,bs=-1e9;const tgt=prevIn+H;for(let k=-Math.floor(W/8);k<=Math.floor(W/8);k+=4){const c=ip+k;if(c<0||c+W>rs.length)continue;let s=0;for(let j=0;j<W;j+=8)s+=rs[c+j]*(rs[tgt+j]||0);if(s>bs){bs=s;best=c;}}ip=best;}
  prevIn=ip;for(let j=0;j<W&&o+j<n;j++){const v=rs[ip+j]||0;out[o+j]+=v*win[j];norm[o+j]+=win[j];}}
 for(let i=0;i<n;i++)out[i]=norm[i]>.05?out[i]/norm[i]:out[i];return out;}

// ---------- WAV encode / decode (16-bit) ----------
function wavBytes(chans,sr){const n=chans[0].length,nc=chans.length,buf=new ArrayBuffer(44+n*nc*2),v=new DataView(buf);let p=0;
 const S=s=>{for(let i=0;i<s.length;i++)v.setUint8(p++,s.charCodeAt(i));},U32=x=>{v.setUint32(p,x,true);p+=4;},U16=x=>{v.setUint16(p,x,true);p+=2;};
 S('RIFF');U32(36+n*nc*2);S('WAVEfmt ');U32(16);U16(1);U16(nc);U32(sr);U32(sr*nc*2);U16(nc*2);U16(16);S('data');U32(n*nc*2);
 for(let i=0;i<n;i++)for(let c=0;c<nc;c++){const x=Math.max(-1,Math.min(1,chans[c][i]));v.setInt16(p,x<0?x*32768:x*32767,true);p+=2;}return new Uint8Array(buf);}
function f32ToB64(d){const i16=new Int16Array(d.length);for(let i=0;i<d.length;i++){const x=Math.max(-1,Math.min(1,d[i]));i16[i]=x<0?x*32768:x*32767;}
 const u=new Uint8Array(i16.buffer);let s='';for(let i=0;i<u.length;i+=32768)s+=String.fromCharCode.apply(null,u.subarray(i,i+32768));return btoa(s);}
function b64ToF32(b){const s=atob(b),u=new Uint8Array(s.length);for(let i=0;i<s.length;i++)u[i]=s.charCodeAt(i);const i16=new Int16Array(u.buffer,0,u.length>>1),d=new Float32Array(i16.length);for(let i=0;i<d.length;i++)d[i]=i16[i]/32768;return d;}

// ---------- mic capture worklet: posts raw chunks stamped with the context time of their first frame ----------
// (the worklet lives in js/rec-worklet.js)

