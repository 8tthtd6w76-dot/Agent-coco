// ===== 🎙 Listen & cover: the Smart Guide learns a song from the mic and makes your own lo-fi cover of it =====
// While it listens it keeps: the beat (from the guide), which notes ring in each bar (chords), the lowest note (bass),
// the main melody line (a pitch tracker for 180-1000 Hz), and where the kicks land. Then it writes a slow, swingy lo-fi version
// with Rhodes-style 7th chords, a soft bass, the melody on a mellow FM-1 sound and a dusty beat. Nothing is recorded or copied:
// it's your own cover, played on Groove Studio's instruments. Covers can be saved as presets (Presets ▾ › My covers).
'use strict';
let COVER=null;const COVER_KEY='gs-mycovers';
function coverFeat(m){if(!COVER||!COVER.rec)return;const f=m.feat;for(let i=0;i<f.length;i+=2)COVER.hops.push([m.t0+(i/2)*m.hop,f[i],f[i+1]]);}
let CVBUF=null,CVF=null;
function coverFrame(){if(!COVER||!COVER.rec||!GUIDE.an||!MIC)return;const an=GUIDE.an,sr=AC.sampleRate,t=AC.currentTime;
 if(!CVF)CVF=new Float32Array(an.frequencyBinCount);an.getFloatFrequencyData(CVF);const bw=sr/an.fftSize,c=new Float32Array(12),bass=new Float32Array(12);
 for(let i=Math.ceil(35/bw);i<Math.min(CVF.length-1,2100/bw);i++){const v=CVF[i];if(v<-80||v<CVF[i-1]||v<CVF[i+1])continue;const f=i*bw,pc=((Math.round(69+12*Math.log2(f/440))%12)+12)%12,mag=Math.pow(10,v/20);
  if(f<170)bass[pc]+=mag*mag;else c[pc]+=mag*mag;}
 COVER.frames.push({t,c,bass});
 // melody: YIN on 1024 samples, only 180-1000 Hz so the bass and kick don't count
 if(!CVBUF)CVBUF=new Float32Array(2048);an.getFloatTimeDomainData(CVBUF);const x=CVBUF,N=1024;let rms=0;for(let i=0;i<N;i++)rms+=x[i]*x[i];rms=Math.sqrt(rms/N);if(rms<.01)return;
 const minL=Math.floor(sr/1000),maxL=Math.ceil(sr/180),d=new Float32Array(maxL+2);let run=0,bl=0;
 for(let L=1;L<=maxL+1;L++){let s=0;for(let i=0;i<N;i++){const q=x[i]-x[i+L];s+=q*q;}run+=s;d[L]=run?s*L/run:1;}
 for(let L=minL;L<=maxL;L++)if(d[L]<.2){while(L+1<=maxL&&d[L+1]<d[L])L++;bl=L;break;}
 if(bl)COVER.pitches.push({t,m:Math.round(69+12*Math.log2(sr/bl/440)),v:rms});}
async function coverStart(){if(!GUIDE.on)await guideOn();if(!GUIDE.on)return;if(T.playing){stop();syncTop();}
 COVER={rec:true,t0:AC.currentTime,hops:[],frames:[],pitches:[]};clearInterval(COVER.timer);COVER.timer=setInterval(coverFrame,40);
 COVER.ui=setInterval(()=>{if(!COVER||!COVER.rec)return;const s=AC.currentTime-COVER.t0,bars=GUIDE.period>0&&GUIDE.bpmConf>.35?Math.floor(s/GUIDE.period/4):0;
  const e=document.getElementById('cvStatus');if(e)e.textContent=GUIDE.bpmConf>.35?`🎙 Learning the song… ${bars} bar${bars===1?'':'s'} so far. Press "Make my cover" after 4 or 8 bars.`:'🎙 Listening for the beat…';},250);
 renderPanel();toast('🎙 Play the song near your Mac. After 4 to 8 bars, press "Make my cover".');}
function coverCancel(){if(!COVER)return;clearInterval(COVER.timer);clearInterval(COVER.ui);COVER=null;renderPanel();}
// ---------- turn what it heard into a song ----------
function coverFinish(){if(!COVER)return;clearInterval(COVER.timer);clearInterval(COVER.ui);COVER.rec=false;const C=COVER;COVER=null;
 if(!(GUIDE.period>0)||GUIDE.bpmConf<.3){toast('I couldn\'t find a steady beat. Try again with the song a bit louder.',true);renderPanel();return;}
 const per=GUIDE.period,t1=AC.currentTime;let first=GUIDE.beatT+Math.ceil((C.t0-GUIDE.beatT)/per)*per;const nBeats=Math.floor((t1-first)/per);
 if(nBeats<8){toast('I need at least 2 bars. Let it listen a little longer.',true);renderPanel();return;}
 // onset strength per hop, split into lows (kick) and the rest
 const H=C.hops,on=[];let pF=0,pL=0;for(const [t,f,l] of H){const lf=Math.log(1e-7+f),ll=Math.log(1e-7+l);on.push([t,Math.max(0,ll-pL),Math.max(0,lf-pF)]);pF=lf;pL=ll;}
 const near=(t,w,k)=>{let m=0;for(const o of on)if(Math.abs(o[0]-t)<w&&o[k]>m)m=o[k];return m;};
 // which beat is "1": the one where the kicks hit hardest
 let off=0,bo=-1;for(let o=0;o<4;o++){let s=0;for(let b=o;b<nBeats;b+=4)s+=near(first+b*per,.05,1);if(s>bo){bo=s;off=o;}}
 first+=off*per;const bars=Math.floor((nBeats-off)/4),nb=bars>=8?8:bars>=4?4:Math.max(1,bars),L=nb*4,sp=per/4;
 if(bars<1){toast('I need a bit more of the song. Let it listen longer.',true);renderPanel();return;}
 // chords + bass per bar
 const key=GUIDE.keyConf>.3?GUIDE.key:0,minor=GUIDE.keyConf>.3?GUIDE.minor:true,chords=[];
 for(let b=0;b<nb;b++){const a=first+b*4*per,e=a+4*per,c=new Float32Array(12),bs=new Float32Array(12);
  C.frames.forEach(f=>{if(f.t>=a&&f.t<e)for(let i=0;i<12;i++){c[i]+=f.c[i];bs[i]+=f.bass[i];}});
  let s=0;for(let i=0;i<12;i++)s+=c[i];if(s>0)for(let i=0;i<12;i++)c[i]/=s;let bsum=0;for(let i=0;i<12;i++)bsum+=bs[i];const broot=bsum?bs.indexOf(Math.max(...bs)):-1;
  let best=[key,minor],bsc=-9;for(let r=0;r<12;r++)for(const mi of [false,true]){const tones=[0,mi?3:4,7].map(i=>(r+i)%12);let sc=0;for(let i=0;i<12;i++)sc+=tones.includes(i)?c[i]:-.35*c[i];if(r===broot)sc+=.12;if(sc>bsc){bsc=sc;best=[r,mi];}}
  chords.push(best);}
 // melody: the most common pitch in each 8th note, joined into notes
 const slots=[];for(let i=0;i<nb*8;i++)slots.push({});C.pitches.forEach(p=>{const i=Math.round((p.t-first)/(per/2));if(i>=0&&i<slots.length)slots[i][p.m]=(slots[i][p.m]||0)+p.v;});
 let mel=[];slots.forEach((s,i)=>{const ks=Object.keys(s);if(!ks.length)return;const m=+ks.sort((a,b)=>s[b]-s[a])[0];if(s[m]<.02)return;const last=mel[mel.length-1];
  if(last&&last.m===m&&last.t+last.d===i/2)last.d+=.5;else mel.push({t:i/2,d:.5,m,v:Math.min(1,.5+s[m]*4)});});
 const cv=Math.round(mel.reduce((a,n)=>a+n.m,0)/(mel.length||1));mel.forEach(n=>{while(n.m-cv>9)n.m-=12;while(cv-n.m>9)n.m+=12;});
 // ---- build the lo-fi cover ----
 stop();commit();const keep=HIST.u.slice();newProject();HIST.u=keep;
 const B=60/per;let bpm=B>=140?B/2:B>=100?B*.82:B*.95;bpm=Math.round(Math.max(66,Math.min(92,bpm)));
 const n=(coverList().length+1);P.name='Lo-Fi Cover '+n;P.bpm=bpm;P.key=key;P.scale=minor?1:0;P.swing=.3;P.loop={on:true,a:0,b:L};P.sections=[{id:uid('s'),bar:0,len:nb,name:'Cover'}];
 const dr=newTrack('drums','Lo-Fi Beat');dr.kit=4;dr.fx.tone=.75;const dc=newClip('drums',0,L,Math.min(L,16));
 const kick=[...Array(16)].map((_,s)=>{let v=0;for(let b=0;b<Math.min(nb,4);b++)v+=near(first+b*4*per+s*sp,.035,1);return v;}),km=Math.max(...kick)||1;
 for(let b=0;b<Math.min(4,nb);b++)for(let s=0;s<16;s++){const t=b*4+s/4;
  if(kick[s]>.55*km||s===0)dc.notes.push({t,p:0,v:s===0?.95:.8});if(s===4||s===12)dc.notes.push({t,p:1,v:.85});
  if(s%2===0)dc.notes.push({t,p:3,v:s%4===0?.5:.32});if((s===7||s===15)&&Math.random()<.3)dc.notes.push({t,p:1,v:.25});}
 dc.notes.sort((a,b)=>a.t-b.t);dr.clips.push(dc);
 const bs=newTrack('synth','Lo-Fi Bass');bs.patch=fm1Patch(3);bs.patch.tone=.35;bs.patch.vol=.75;const bc=newClip('synth',0,L,L);
 const ky=newTrack('synth','Lo-Fi Keys');ky.patch=fm1Patch(1);ky.patch.tone=.55;ky.patch.lfo[2]=.12;ky.fx.rev=.3;ky.fx.tone=.7;ky.vol=.6;const kc=newClip('synth',0,L,L);
 chords.forEach(([r,mi],b)=>{const root=36+r;bc.notes.push({t:b*4,d:1.6,m:root,v:.9},{t:b*4+2.5,d:.9,m:root+(Math.random()<.5?7:0),v:.75});
  const v=[0,mi?3:4,7,mi?10:11].map(i=>60+((r+i)%12));v.sort((a,b)=>a-b);v.forEach((m,i)=>{kc.notes.push({t:b*4+i*.04,d:1.8,m,v:.6},{t:b*4+2.5+i*.03,d:1.3,m,v:.5});});});
 bs.clips.push(bc);ky.clips.push(kc);
 const ld=newTrack('synth','Lo-Fi Melody');ld.patch=fm1Patch(6);ld.patch.tone=.6;ld.fx.rev=.35;ld.fx.dly=.15;ld.vol=.7;const lc=newClip('synth',0,L,L);
 if(mel.length>=4)mel.forEach(x=>lc.notes.push({t:x.t,d:Math.min(x.d,L-x.t),m:bSnapScale(x.m),v:x.v}));
 else chords.forEach(([r,mi],b)=>[0,1,1.5,3].forEach((t,i)=>lc.notes.push({t:b*4+t,d:.5,m:72+((r+[0,mi?3:4,7,mi?3:4][i])%12),v:.7})));   // heard no clear melody: a soft line on the chords
 ld.clips.push(lc);
 P.tracks=[dr,bs,ky,ld];P.tracks.forEach((t,i)=>{if(!t.color||i<4)t.color=['#ff8787','#ffa94d','#63e6be','#f783ac'][i];});
 BUFC.clear();T.head=0;UI.sel={track:dr.id,clip:null,sec:null};updateMix();refreshAll();
 coverSave(P.name,true);
 const cn=chords.map(([r,mi])=>NOTE_NAMES[r]+(mi?'m':'')).join(' ');
 toast(`Your lo-fi cover: ${bpm} BPM (was ${Math.round(B)}), chords ${cn}${mel.length>=4?', melody '+mel.length+' notes':''}. Saved in Presets › My covers.`);
 play(0).then(syncTop);}
// ---------- my presets (saved in this app on this Mac) ----------
function coverList(){try{return JSON.parse(localStorage.getItem(COVER_KEY)||'[]');}catch(e){return [];}}
function coverSave(name,quiet){const L=coverList(),p=JSON.parse(JSON.stringify(P));p.tracks=p.tracks.filter(t=>t.type!=='audio');p.name=name||p.name;
 L.unshift({n:p.name,when:Date.now(),p});while(L.length>40)L.pop();try{localStorage.setItem(COVER_KEY,JSON.stringify(L));}catch(e){toast('Could not save the preset',true);return;}if(!quiet)toast('Saved "'+p.name+'" in Presets › My presets');}
function coverLoad(i){const it=coverList()[i];if(!it)return;stop();commit();const keep=HIST.u.slice();P=fixProject(JSON.parse(JSON.stringify(it.p)));HIST.u=keep;
 BUFC.clear();T.head=0;UI.sel={track:P.tracks[0]&&P.tracks[0].id,clip:null,sec:null};refreshAll();toast('Loaded '+it.n);}
function coverDelete(i){const L=coverList();const it=L.splice(i,1)[0];try{localStorage.setItem(COVER_KEY,JSON.stringify(L));}catch(e){}if(it)toast('Deleted '+it.n);}
