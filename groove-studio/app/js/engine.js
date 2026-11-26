// ===== Groove Studio engine: transport, scheduler, live playing, recording (audio + notes), WAV export =====
'use strict';
let MIX=null;
// VIS: sounds about to play, so the screen can light each instrument up in its color at the moment it is heard
const VIS=[];
const T={playing:false,rec:null,b0:0,t0:0,L:0,timer:null,head:0,lastHead:0,listeners:[]};
async function ensureAudio(){if(AC){if(AC.state!=='running')await AC.resume();return;}
 AC=new (window.AudioContext||window.webkitAudioContext)({latencyHint:'interactive'});MIX=makeMixer(AC);MUS={a:AC,rev:MIX.rev};
 await loadKits();updateMix();}
const spb=()=>60/P.bpm;
const anySolo=()=>P.tracks.some(t=>t.solo);
const audible=t=>anySolo()?t.solo:!t.mute;
function updateMix(M=MIX){if(!M)return;P.tracks.forEach(t=>applyStrip(M,t,audible(t)));setDelayTime(M,P.bpm);
 for(const id in M.strips)if(!trackById(id)){const s=M.strips[id];try{s.vol.disconnect();}catch(e){}delete M.strips[id];}}

// ---------- buffers ----------
const BUFC=new Map();
function poolBuf(id){const A=AUDIO[id];if(!A)return null;let b=BUFC.get(id);if(!b){b=bufFrom(AC||new OfflineAudioContext(1,1,44100),A.d,A.sr);BUFC.set(id,b);}return b;}
function clipBuf(c){const k=c.src+'|'+(c.pitch||0)+'|'+(c.rev?1:0);let b=BUFC.get(k);if(b)return b;const A=AUDIO[c.src];if(!A)return null;
 let d=A.d;if(c.pitch)d=pitchShift(d,A.sr,c.pitch);if(c.rev){d=d.slice().reverse();}b=bufFrom(AC||new OfflineAudioContext(1,1,44100),d,A.sr);BUFC.set(k,b);return b;}
function padBuf(tr,p){const pd=tr.pads[p];if(pd&&pd.sample&&AUDIO[pd.sample])return poolBuf(pd.sample);return (KIT_BUFS[tr.kit]||KIT_BUFS[0]||[])[p];}
function playPad(M,tr,p,t,v){const b=padBuf(tr,p);if(!b)return;const a=M.a,pd=tr.pads[p]||{vol:1,tune:0},s=a.createBufferSource();s.buffer=b;s.playbackRate.value=Math.pow(2,(pd.tune||0)/12);
 const g=a.createGain();g.gain.value=v*(pd.vol==null?1:pd.vol);s.connect(g);g.connect(stripFor(M,tr).in);s.start(Math.max(t,a.currentTime));}
function playNote(M,tr,m,t,dur,v){const old=MUS;MUS={a:M.a,rev:M.rev};try{fm1Note(tr.patch,Math.max(t,M.a.currentTime),mtof(m),dur,v,stripFor(M,tr).in,spb()/4);}finally{MUS=old;}}

// ---------- scheduling one stretch of the song ----------
// sch(M, s0, s1, timeOf, jump): play everything whose start is in song beats [s0,s1). timeOf(beat)->context time.
// jump: s0 is where playback starts or lands after a loop, so audio that is already sounding there starts mid-way.
function sch(M,s0,s1,timeOf,jump,stopAt){const sp=spb(),sw=P.swing*sp/4;
 for(const tr of P.tracks){for(const c of tr.clips){const ce=c.start+c.len;if(ce<=s0||c.start>=s1)continue;const pl=Math.max(.0625,c.plen||c.len);
  if(tr.type==='audio'){if(!c.src)continue;const b=clipBuf(c);if(!b)continue;
   for(let k=Math.max(0,Math.floor((s0-c.start)/pl));;k++){const rs=c.start+k*pl;if(rs>=s1||rs>=ce)break;const re=Math.min(rs+pl,ce);
    let st=null;if(rs>=s0)st=rs;else if(jump&&s0<re)st=s0;if(st==null)continue;
    const en=Math.min(re,stopAt==null?Infinity:stopAt);if(en<=st)continue;
    playAudio(M,tr,c,b,timeOf(st),(st-rs)*sp,timeOf(en),rs===c.start&&st===rs,re===ce);
    if(M===MIX)for(let q=Math.ceil(st*2)/2;q<en;q+=.5)VIS.push({t:timeOf(q),tr:tr.id,p:-1});}   // a voice glows on every 8th while it sounds
   continue;}
  for(let k=Math.max(0,Math.floor((s0-c.start)/pl)-1);;k++){const rs=c.start+k*pl;if(rs>=s1||rs>=ce)break;
   for(const n of c.notes){if(n.t>=pl)continue;const at=rs+n.t;if(at<s0||at>=s1||at>=ce)continue;
    const st16=Math.round(at*4);const swung=Math.abs(at*4-st16)<.01&&st16%2?sw:0;const t=timeOf(at)+swung;
    if(tr.type==='drums')playPad(M,tr,n.p,t,n.v);else playNote(M,tr,n.m,t,Math.min(n.d,ce-at)*sp,n.v);
    if(M===MIX)VIS.push({t,tr:tr.id,p:tr.type==='drums'?n.p:-1});}}}}
 if(M===MIX&&P.metro||T.rec&&T.rec.click)for(let b=Math.ceil(s0-1e-6);b<s1;b++)if(M===MIX)clickAt(M,timeOf(b),((b%4)+4)%4===0);}
function playAudio(M,tr,c,b,t,off,tEnd,fadeIn,fadeOut){const a=M.a,s=a.createBufferSource();s.buffer=b;const g=a.createGain(),gv=c.gain==null?1:c.gain,sp=spb();
 const now=a.currentTime,lag=Math.max(0,now-t);t+=lag;off+=lag;const so=(c.off||0)+off;if(so>=b.duration||tEnd<=t)return;
 const fi=fadeIn&&c.fin?c.fin*sp:.004,fo=fadeOut&&c.fout?c.fout*sp:.004;
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gv,t+Math.min(fi,(tEnd-t)/2));g.gain.setValueAtTime(gv,Math.max(t+Math.min(fi,(tEnd-t)/2),tEnd-fo));g.gain.linearRampToValueAtTime(0,tEnd);
 s.connect(g);g.connect(stripFor(M,tr).in);s.start(t,so);s.stop(tEnd+.01);T.srcs.push(s);}
T.srcs=[];

// linear beats since Play -> song beat, honoring the loop
function loopOn(){return P.loop.on&&P.loop.b>P.loop.a;}
function songAt(L){const b=T.b0+L;if(!loopOn()||T.b0>=P.loop.b)return b;const {a,b:lb}=P.loop;if(b<lb)return b;return a+((b-lb)%(lb-a));}
// split linear [L1,L2) into song stretches: [{s0,s1,l0,jump}]
function pieces(L1,L2){const out=[];let L=L1;
 while(L<L2-1e-9){const s=songAt(L);let end=L2;if(loopOn()&&T.b0<P.loop.b&&s<P.loop.b){const toEnd=P.loop.b-s;end=Math.min(L2,L+toEnd);}
  const wrapped=L>0&&Math.abs(s-P.loop.a)<1e-6&&loopOn()&&T.b0<P.loop.b;out.push({s0:s,s1:s+(end-L),l0:L,jump:L===0||wrapped});if(end===L)break;L=end;}
 return out;}
const AHEAD=.15;
function tick(){if(!T.playing)return;const sp=spb(),Lnow=(AC.currentTime-T.t0)/sp,Lto=Lnow+AHEAD/sp;
 if(Lto>T.L){for(const p of pieces(T.L,Lto)){const lp=loopOn()&&T.b0<P.loop.b&&p.s0<P.loop.b?P.loop.b:null;
   sch(MIX,p.s0,p.s1,x=>T.t0+(p.l0+x-p.s0)*sp,p.jump,lp);}T.L=Lto;}}
function headNow(){if(!T.playing)return T.head;return songAt((AC.currentTime-T.t0)/spb());}
async function play(from){await ensureAudio();if(T.playing)stop(true);updateMix();
 T.b0=from==null?T.head:from;T.t0=AC.currentTime+.06;T.L=0;T.playing=true;T.srcs=[];tick();T.timer=setInterval(tick,25);emit('play');}
function stop(keep){if(!T.playing)return;const h=headNow();T.playing=false;clearInterval(T.timer);
 T.srcs.forEach(s=>{try{s.stop();}catch(e){}});T.srcs=[];VIS.length=0;
 // cut ringing synth notes / drum tails by ducking each strip briefly
 if(MIX)for(const id in MIX.strips){const g=MIX.strips[id].in.gain,t=AC.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(0,t+.03);g.setValueAtTime(0,t+.25);g.linearRampToValueAtTime(1,t+.27);}
 if(T.rec)finishRecord();if(!keep)T.head=Math.max(0,h<0?0:h);emit('stop');}
function emit(e){T.listeners.forEach(f=>f(e));}

// ---------- live input (pads + keys), and recording notes ----------
const HELD={};
function livePad(tr,p,v=1){if(!AC)return;playPad(MIX,tr,p,AC.currentTime,v);VIS.push({t:0,tr:tr.id,p});if(T.rec&&T.rec.kind==='notes'&&T.rec.tr===tr.id)recNote({p,v});}
function liveKeyDown(tr,m,v=.9){if(!AC||HELD[tr.id+':'+m])return;VIS.push({t:0,tr:tr.id,p:-1});const old=MUS;MUS={a:AC,rev:MIX.rev};
 const h=fm1Start(tr.patch,AC.currentTime,mtof(m),v,stripFor(MIX,tr).in);MUS=old;HELD[tr.id+':'+m]={h,b:T.playing?headNow():null,m,v};}
function liveKeyUp(tr,m){const k=tr.id+':'+m,H=HELD[k];if(!H)return;delete HELD[k];H.h.stop(AC.currentTime);
 if(T.rec&&T.rec.kind==='notes'&&T.rec.tr===tr.id&&H.b!=null){let d=headNow()-H.b;if(d<0)d+=P.loop.b-P.loop.a;recNote({m,v:H.v,d:Math.max(.125,d)},H.b);}}
function recNote(n,at){const R=T.rec,tr=trackById(R.tr);if(!tr)return;let b=at==null?headNow():at;if(b<0)return;
 if(P.quant)b=Math.round(b*4)/4;if(loopOn()&&b>=P.loop.b)b=P.loop.a;
 let c=tr.clips.find(c=>b>=c.start&&b<c.start+c.len);
 if(!c){if(!R.committed){commit();R.committed=true;}const st=loopOn()?P.loop.a:Math.floor(b/4)*4,len=loopOn()?P.loop.b-P.loop.a:16;c=newClip(tr.type,st,len,len);tr.clips.push(c);}
 else if(!R.committed){commit();R.committed=true;}
 const t=((b-c.start)%c.plen+c.plen)%c.plen;
 if(tr.type==='drums')c.notes.push({t,p:n.p,v:n.v});else c.notes.push({t,d:Math.min(n.d,c.plen-t),m:n.m,v:n.v});
 c.notes.sort((x,y)=>x.t-y.t);emit('edit');}

// ---------- mic ----------
let MIC=null;
async function micOn(){await ensureAudio();if(MIC)return MIC;
 const st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1}});
 await AC.audioWorklet.addModule('js/rec-worklet.js');
 const src=AC.createMediaStreamSource(st),node=new AudioWorkletNode(AC,'rec-tap',{numberOfInputs:1,numberOfOutputs:0});src.connect(node);
 // input monitoring (off by default: headphones recommended)
 const mon=AC.createGain();mon.gain.value=0;src.connect(mon);mon.connect(MIX.master);
 MIC={st,src,node,mon,lvl:0,chunks:null};
 node.port.onmessage=e=>{MIC.lvl=Math.max(e.data.lvl,MIC.lvl*.9);if(e.data.d&&MIC.chunks)MIC.chunks.push({t:e.data.t,d:e.data.d});};
 return MIC;}
function micMonitor(on){if(MIC)MIC.mon.gain.setTargetAtTime(on?1:0,AC.currentTime,.02);}

// ---------- recording ----------
// kind 'audio': captures the mic; with the loop on, every pass becomes its own layer (loop-station overdub).
// kind 'notes': pads / keys you play go into the selected track's clip under the playhead.
async function startRecord(tr){await ensureAudio();if(T.rec){stop();return;}
 const from=T.head,pre=P.countIn?4:0;
 if(tr.type==='audio'){try{await micOn();}catch(e){toast('Microphone is blocked. Allow it in System Settings > Privacy > Microphone.',true);return;}
  MIC.chunks=[];MIC.node.port.postMessage({on:true});}
 T.rec={kind:tr.type==='audio'?'audio':'notes',tr:tr.id,from,pre,click:true,committed:false};
 if(loopOn())T.head=P.loop.a;   // loop recording always starts at the top of the loop, like a loop pedal
 await play(T.head-pre);T.rec.from=T.head;T.rec.tStart=T.t0+pre*spb();emit('rec');}
function finishRecord(){const R=T.rec;T.rec=null;if(R.kind!=='audio'){emit('edit');return;}
 MIC.node.port.postMessage({on:false});const chunks=MIC.chunks;MIC.chunks=null;if(!chunks.length)return;
 const sr=AC.sampleRate,lat=(AC.outputLatency||0)+(AC.baseLatency||0)+(P.latency||0)/1000,first=chunks[0].t;
 let n=0;chunks.forEach(c=>n+=c.d.length);const all=new Float32Array(n);let o=0;chunks.forEach(c=>{all.set(c.d,o);o+=c.d.length;});
 // cut the stretch [ta,tb) of context time out of the capture; silence fills any part the mic had not started yet
 const cut=(ta,tb)=>{const n=Math.round((tb-ta)*sr),o=new Float32Array(Math.max(0,n)),s0=Math.round((ta+lat-first)*sr);let got=0;
  for(let i=0;i<n;i++){const j=s0+i;if(j>=0&&j<all.length){o[i]=all[j];got++;}}return got>sr*.2?o:null;};
 const sp=spb(),tEnd=AC.currentTime,tr=trackById(R.tr);if(!tr)return;commit();
 // passes: song stretches between loop wraps, from where recording began
 const L0=R.pre,Lend=(tEnd-T.t0)/sp,ps=pieces(L0,Math.max(L0,Lend));let layer=0;
 const loopLen=loopOn()?P.loop.b-P.loop.a:0;
 for(const p of ps){const len=p.s1-p.s0;if(len<.5)continue;if(layer>0&&loopLen&&len<loopLen*.75)continue;   // a short last pass is just the stop, not a layer
 const d=cut(T.t0+p.l0*sp,T.t0+(p.l0+len)*sp);if(!d||d.length<sr*.2)continue;
  const id=uid('a');AUDIO[id]={sr,d};let dest=tr;
  if(layer>0){dest=newTrack('audio',tr.name.replace(/ layer \d+$/,'')+' layer '+(layer+1));dest.color=tr.color;dest.fx=Object.assign({},tr.fx);dest.arm=false;P.tracks.splice(P.tracks.indexOf(tr)+layer,0,dest);}
  const c=newClip('audio',p.s0,len,len);c.src=id;c.name='Take';dest.clips=dest.clips.filter(x=>x.start>=p.s0+len||x.start+x.len<=p.s0||x===c);dest.clips.push(c);layer++;}
 toast(layer>1?'Recorded '+layer+' loop layers':layer?'Recorded a take':'Nothing recorded');updateMix();emit('edit');}

// ---------- export: render the song (or the loop) to a WAV ----------
async function renderWav(range){await ensureAudio();const sr=44100,sp=spb(),[a,b]=range,len=(b-a)*sp+2.5;
 const oc=new OfflineAudioContext(2,Math.ceil(len*sr),sr),M=makeMixer(oc);updateMix(M);
 P.tracks.forEach(t=>{const s=stripFor(M,t);s.vol.gain.value=audible(t)?t.vol*t.vol:0;s.pan.pan.value=t.pan;s.tone.frequency.value=200*Math.pow(100,t.fx.tone);s.rev.gain.value=t.fx.rev*.8;s.dly.gain.value=t.fx.dly*.7;});
 M.dly.delayTime.value=Math.min(1.9,sp*.75);const keep=T.srcs;T.srcs=[];
 const old=MUS;MUS={a:oc,rev:M.rev};try{sch(M,a,b,x=>(x-a)*sp,true,b);}finally{MUS=old;T.srcs=keep;}
 const buf=await oc.startRendering();return wavBytes([buf.getChannelData(0),buf.getChannelData(1)],sr);}
