// ===== 🎙 Listen & cover: the Smart Guide learns a song from the mic and makes your own lo-fi cover of it =====
// While it listens it keeps: the beat (from the guide), which notes ring in each bar (chords), the lowest note (bass),
// the main melody line (a pitch tracker for 180-1000 Hz), and where the kicks land. Then it writes a slow, swingy lo-fi version
// with Rhodes-style 7th chords, a soft bass, the melody on a mellow FM-1 sound and a dusty beat. Nothing is recorded or copied:
// it's your own cover, played on Groove Studio's instruments. Covers can be saved as presets (Presets ▾ › My covers).
'use strict';
let COVER=null;const COVER_KEY='gs-mycovers';
function coverFeat(m){if(!COVER||!COVER.rec)return;const f=m.feat;for(let i=0;i<f.length;i+=3)COVER.hops.push([m.t0+(i/3)*m.hop,f[i],f[i+1]]);}
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
 COVER={rec:true,t0:AC.currentTime,hops:[],frames:[],pitches:[],mel:[]};clearInterval(COVER.timer);COVER.timer=setInterval(coverFrame,40);
 const an2=AC.createAnalyser();an2.fftSize=4096;an2.smoothingTimeConstant=0;MIC.src.connect(an2);COVER.an2=an2;COVER.fb=new Float32Array(an2.frequencyBinCount);COVER.mtimer=setInterval(coverMelFrame,23);
 COVER.ui=setInterval(()=>{if(!COVER||!COVER.rec)return;const s=AC.currentTime-COVER.t0,bars=GUIDE.period>0&&GUIDE.bpmConf>.35?Math.floor(s/GUIDE.period/4):0;
  const e=document.getElementById('cvStatus');if(e)e.textContent=GUIDE.bpmConf>.35?`🎙 Learning the song… ${bars} bar${bars===1?'':'s'} so far. Press "Make my cover" after 4 or 8 bars.`:'🎙 Listening for the beat…';},250);
 renderPanel();toast('🎙 Play the song near your Mac. After 4 to 8 bars, press "Make my cover".');}
function coverCancel(){if(!COVER)return;clearInterval(COVER.timer);clearInterval(COVER.mtimer);try{COVER.an2.disconnect();}catch(e){}clearInterval(COVER.ui);COVER=null;renderPanel();}
// the lead line: what just changed in the spectrum (held chords and pads fade out of a slow average),
// then for each note from G3 to F#6 add up its harmonics. The strongest one is the melody in that moment.
function coverMelFrame(){const C=COVER;if(!C||!C.rec||!C.an2)return;const an=C.an2,sr=AC.sampleRate,F=C.fb;an.getFloatFrequencyData(F);
 const bw=sr/an.fftSize,nb=Math.min(F.length,Math.ceil(6000/bw));if(!C.avg){C.avg=new Float32Array(nb);C.w=new Float32Array(nb);}
 const avg=C.avg,w=C.w;let e=0;for(let i=0;i<nb;i++){const v=Math.pow(10,F[i]/20);w[i]=Math.max(0,v-1.15*avg[i]);avg[i]=avg[i]*.88+v*.12;e+=w[i];}
 if(e<=0)return;const pk=f=>{const i=Math.round(f/bw);return i<1||i>=nb-1?0:Math.max(w[i-1],w[i],w[i+1]);};
 let best=-1,bs=0,second=0;for(let m=55;m<=90;m++){const f0=440*Math.pow(2,(m-69)/12),h1=pk(f0);if(h1<=0)continue;let s=h1;for(let h=2;h<=6;h++)s+=Math.pow(.8,h-1)*pk(f0*h);
  if(s>bs){second=bs;bs=s;best=m;}else if(s>second)second=s;}
 if(best>0)C.mel.push({t:AC.currentTime-.045,m:best,s:bs});}
function coverMelody(C,first,per,nb){const fr=C.mel.filter(f=>f.t>=first-.05&&f.t<first+nb*4*per);if(fr.length<8)return [];
 const ss=fr.map(f=>f.s).sort((a,b)=>a-b),thr=ss[Math.floor(ss.length*.6)]*.35;const ok=fr.filter(f=>f.s>thr);
 // smooth single-frame blips, then cut into notes wherever the pitch changes
 for(let i=1;i<ok.length-1;i++)if(ok[i-1].m===ok[i+1].m&&ok[i].m!==ok[i-1].m&&ok[i+1].t-ok[i-1].t<.07)ok[i].m=ok[i-1].m;
 const notes=[];ok.forEach(f=>{const L=notes[notes.length-1];if(L&&L.m===f.m&&f.t-L.e<.06){L.e=f.t;L.s+=f.s;L.n++;}else notes.push({t:f.t,e:f.t,m:f.m,s:f.s,n:1});});
 const sp=per/4,out=[];notes.filter(n=>n.n>=2).forEach(n=>{const st=Math.round((n.t-first)/sp);if(st<0||st>=nb*16)return;const q=out.find(o=>o.st===st);
  if(q){if(n.s>q.s)Object.assign(q,{m:n.m,s:n.s});return;}out.push({st,m:n.m,s:n.s,len:Math.max(1,Math.round((n.e-n.t+.05)/sp))});});
 out.sort((a,b)=>a.st-b.st);
 // pop songs repeat their phrases: if 1, 2 or 4 bars come back mostly the same, vote across the repeats (fixes stray notes) and use the clean phrase everywhere
 for(const PB of [2,1,4]){const reps=Math.floor(nb/PB);if(reps<2)continue;const W=PB*16,grid=[...Array(W)].map(()=>[]);out.forEach(o=>grid[o.st%W].push(o));
  let agree=0,used=0;grid.forEach(g=>{if(!g.length)return;used++;const c={};g.forEach(o=>c[o.m%12]=(c[o.m%12]||0)+1);if(Math.max(...Object.values(c))>=Math.max(2,reps*.5))agree++;});
  if(used>=4&&agree/used>=.6){const clean=[];grid.forEach((g,i)=>{if(g.length<Math.max(2,reps*.5))return;const c={};g.forEach(o=>c[o.m]=(c[o.m]||0)+o.s);const m=+Object.keys(c).sort((a,b)=>c[b]-c[a])[0];
    clean.push({st:i,m,s:c[m]/g.length,len:Math.round(g.reduce((a,o)=>a+o.len,0)/g.length)});});
   out.length=0;for(let r=0;r<reps;r++)clean.forEach(o=>out.push(Object.assign({},o,{st:o.st+r*W})));C.phrase=PB;break;}}
 const smax=Math.max(...out.map(o=>o.s))||1;
 return out.map((o,i)=>{const nx=i+1<out.length?out[i+1].st:nb*16;return {t:o.st/4,d:Math.max(.25,Math.min(o.len,nx-o.st))/4,m:o.m,v:Math.min(1,.55+.45*o.s/smax)};});}
// ---------- turn what it heard into a song ----------
function coverFinish(){if(!COVER)return;clearInterval(COVER.timer);clearInterval(COVER.mtimer);try{COVER.an2.disconnect();}catch(e){}clearInterval(COVER.ui);COVER.rec=false;const C=COVER;COVER=null;
 if(!(GUIDE.period>0)||GUIDE.bpmConf<.3){toast('I couldn\'t find a steady beat. Try again with the song a bit louder.',true);renderPanel();return;}
 const per=GUIDE.period,t1=AC.currentTime;let first=GUIDE.beatT+Math.ceil((C.t0-GUIDE.beatT)/per)*per;const nBeats=Math.floor((t1-first)/per);
 if(nBeats<8){toast('I need at least 2 bars. Let it listen a little longer.',true);renderPanel();return;}
 // onset strength per hop, split into lows (kick) and the rest
 const H=C.hops,on=[];let pF=0,pL=0;for(const [t,f,l] of H){const lf=Math.log(1e-7+f),ll=Math.log(1e-7+l);on.push([t,Math.max(0,ll-pL),Math.max(0,lf-pF)]);pF=lf;pL=ll;}
 const near=(t,w,k)=>{let m=0;for(const o of on)if(Math.abs(o[0]-t)<w&&o[k]>m)m=o[k];return m;};
 // which beat is "1": the one where the kicks hit hardest
 // which beat is "1": where the chords change (most of all) and the kick hits hardest
 const bch=[...Array(nBeats)].map((_,j)=>{const v=new Float32Array(12);C.frames.forEach(f=>{if(f.t>=first+j*per&&f.t<first+(j+1)*per)for(let i=0;i<12;i++)v[i]+=f.c[i]+f.bass[i]*2;});return v;});
 const cos=(a,b)=>{let x=0,y=0,z=0;for(let i=0;i<12;i++){x+=a[i]*b[i];y+=a[i]*a[i];z+=b[i]*b[i];}return y&&z?x/Math.sqrt(y*z):1;};
 const nov=bch.map((v,j)=>j?1-cos(bch[j-1],v):0),kk=[...Array(nBeats)].map((_,j)=>near(first+j*per,.05,1)),nm=Math.max(...nov)||1,km0=Math.max(...kk)||1;
 let off=0,bo=-1;for(let o=0;o<4;o++){let s=0,c=0;for(let b=o;b<nBeats;b+=4){s+=nov[b]/nm+.4*kk[b]/km0;c++;}s/=c||1;if(s>bo){bo=s;off=o;}}
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
 const mel2=coverMelody(C,first,per,nb);if(mel2.length>=4)mel=mel2;
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
 coverSave(P.name,true);riffArchive(P.name+' melody',lc.notes.filter(n=>n.t<Math.min(L,(C.phrase||2)*4)),'cover',chords.map(([r,mi])=>NOTE_NAMES[r]+(mi?'m':'')).join(' '));
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

// ---------- 📚 Riff library: every melody the app learns is archived automatically ----------
// Stored relative to the key (so it can be played back in any key), with its rhythm, chords and where it came from.
const RIFF_KEY='gs-riffs';
function riffList(){try{return JSON.parse(localStorage.getItem(RIFF_KEY)||'[]');}catch(e){return [];}}
function riffArchive(name,notes,src,chords){if(!notes||notes.length<3)return;const L=riffList();
 const sig=notes.map(n=>((n.m-P.key)%12+12)%12+'@'+n.t).join(',');if(L.some(r=>r.sig===sig))return;
 L.unshift({n:name,src,when:Date.now(),bpm:P.bpm,minor:P.scale===1||P.scale===2||P.scale===4||P.scale===6,sig,chords:chords||null,
  notes:notes.map(n=>({t:+n.t.toFixed(3),d:+(n.d||.25).toFixed(3),r:n.m-P.key-60,v:+(n.v||.8).toFixed(2)}))});while(L.length>80)L.pop();
 try{localStorage.setItem(RIFF_KEY,JSON.stringify(L));}catch(e){}}
function riffNotes(r){return r.notes.map(n=>({t:n.t,d:n.d,m:bSnapScale(60+P.key+n.r),v:n.v}));}
function riffDelete(i){const L=riffList(),it=L.splice(i,1)[0];try{localStorage.setItem(RIFF_KEY,JSON.stringify(L));}catch(e){}if(it)toast('Deleted '+it.n);}
// bring a saved riff back: the buddy makes it its theme (sections, covers and all), or it goes on its own track
function riffUse(i,how){const r=riffList()[i];if(!r)return;const notes=riffNotes(r);
 if(how==='buddy'){const sp=Math.max(...notes.map(n=>n.t+n.d));BUDDY.theme={notes:notes.filter(n=>n.t<8),cover:true};BUDDY.newRiff=false;BUDDY.pinned=true;if(BUDDY.on&&BUDDY.added.includes('lead'))bWrite('lead');else if(BUDDY.on){bWrite('lead');BUDDY.added.push('lead');}
  toast('🤖 The buddy is playing "'+r.n+'" now'+(BUDDY.on?'':'. Press Start buddy.'));return;}
 commit();qEnsureLoop();const t=newTrack('synth',r.n.slice(0,20));t.patch=fm1Patch(6);t.fx.rev=.25;const L=P.loop.b-P.loop.a,c=newClip('synth',P.loop.a,L,L);
 notes.forEach(n=>{if(n.t<L)c.notes.push({t:n.t,d:Math.min(n.d,L-n.t),m:n.m,v:n.v});});t.clips.push(c);P.tracks.push(t);updateMix();renderTimeline();renderPanel();toast('Added "'+r.n+'" in '+NOTE_NAMES[P.key]);}
function riffMenu(x,y){const L=riffList();if(!L.length){menu(x,y,[['No riffs yet. Play a riff for the buddy, or make a lo-fi cover.',()=>{}]]);return;}
 menu(x,y,[...L.slice(0,14).map((r,i)=>['📚 '+r.n,()=>menu(x,y,[['🤖 Buddy plays it (as its theme)',()=>riffUse(i,'buddy')],['➕ Add it as a new track',()=>riffUse(i,'track')],['🗑 Delete it',()=>riffDelete(i)]]),
   (r.src==='cover'?'from a song':'your riff')+' · '+r.notes.length+' notes']),null,['Save the buddy\'s current theme',()=>{if(BUDDY.theme)prompt2('Riff name','My riff',n=>{riffArchive(n||'My riff',BUDDY.theme.notes,'mine');toast('Saved');});else toast('The buddy has no theme yet');}]]);}
