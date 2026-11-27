// ===== 🤖 Jam Buddy: a band mate that listens and plays along =====
// It listens to what you play in Jam and to what it hears on the mic (notes, rhythm, how loud: the "inflection"),
// answers with short catchy synth covers of your riff, and slowly layers its own on-beat parts into the loop.
// While you're playing it holds back; when you lay out, it adds something. Everything it adds is a normal track you can keep, mute or delete.
'use strict';
const BMODES={
 chill:{n:'Chill',e:'😌',bpm:[78,90],every:3,max:4,order:['keys','bass','hat','lead'],prog:[0,3,5,4],pre:{bass:3,keys:9,lead:6},snap:2,d:'Slow and steady. Soft pads, a round bass, room to breathe.'},
 groove:{n:'Groove / Funk',e:'🕺',bpm:[96,108],every:2,max:6,order:['hat','bass','keys','snare','perc','lead'],prog:[0,0,3,3],pre:{bass:3,keys:8,lead:7},snap:4,d:'Laid-back funk: ghost-note hats, a slap-style bass, clav stabs on the off-beats.'},
 dance:{n:'Dance',e:'💃',bpm:[122,128],every:2,max:7,order:['kick','ohat','bass','clap','keys','perc','lead'],prog:[0,5,3,4],pre:{bass:3,keys:1,lead:0},snap:2,d:'Four on the floor, off-beat hats, pumping chords. Made to move.'},
 chaos:{n:'Chaotic',e:'🌀',bpm:[130,160],every:1,max:5,order:['perc','bass','lead','keys','hat','kick'],prog:null,pre:{bass:10,keys:2,lead:11},snap:4,d:'Wild and unpredictable. Parts mutate every time around.'}};
const BUDDY={drum:{},fill:null,song:true,sec:null,secPass:0,secIdx:-1,theme:null,on:false,show:false,mode:'groove',energy:.5,pass:0,lastH:null,stepDone:-1,added:[],heard:[],userHits:0,status:'',motif:null,lastAdd:0,pitch:{m:-1,n:0,start:0,v:0}};
const bKind={kick:'drum',snare:'drum',clap:'drum',hat:'drum',ohat:'drum',perc:'drum',bass:'synth',keys:'synth',lead:'synth'};
// ---------- what it hears ----------
// your Jam hits (called from qTap while the song plays)
function buddyHearTap(q,m,b,v){if(!BUDDY.on)return;BUDDY.userHits++;if(q.kind==='keys')BUDDY.heard.push({m,b,v,d:.5,src:'keys',at:performance.now()});if(BUDDY.heard.length>40)BUDDY.heard.shift();}
// sung / played notes on the mic: a small pitch tracker (autocorrelation), a note = a pitch that holds for ~90 ms
let BPBUF=null;
function buddyPitch(){if(!BUDDY.on||!GUIDE.phones||!GUIDE.an||!MIC||!T.playing)return;const an=GUIDE.an;if(!BPBUF)BPBUF=new Float32Array(2048);an.getFloatTimeDomainData(BPBUF);
 const x=BPBUF,N=1024,sr=AC.sampleRate;let rms=0;for(let i=0;i<N;i++)rms+=x[i]*x[i];rms=Math.sqrt(rms/N);
 const P_=BUDDY.pitch;let m=-1;
 if(rms>.015){const maxL=Math.ceil(sr/70),minL=Math.floor(sr/1000),d=new Float32Array(maxL+2);let run=0,bl=0;   // YIN: the first dip of the normalized difference
  for(let L=1;L<=maxL+1;L++){let s=0;for(let i=0;i<N;i++){const q=x[i]-x[i+L];s+=q*q;}run+=s;d[L]=run?s*L/run:1;}
  for(let L=minL;L<=maxL;L++)if(d[L]<.15){while(L+1<=maxL&&d[L+1]<d[L])L++;bl=L;break;}
  if(bl){const a=d[bl-1],b=d[bl],c=d[bl+1],den=a-2*b+c,Lf=bl+(den?.5*(a-c)/den:0);m=Math.round(69+12*Math.log2(sr/Lf/440));}}
 if(m===P_.m&&m>0){P_.n++;P_.v=Math.max(P_.v,rms);if(P_.n===3){P_.note={m,b:headNow()-.1*P.bpm/60,v:Math.min(1,.4+rms*6),d:.25,src:'mic',at:performance.now()};BUDDY.heard.push(P_.note);if(BUDDY.heard.length>40)BUDDY.heard.shift();}
  else if(P_.note)P_.note.d=Math.max(.25,(P_.n*.04)*P.bpm/60);}
 else{P_.m=m;P_.n=1;P_.v=rms;P_.note=null;}}
// ---------- music helpers ----------
const bR=()=>Math.random(),bPick=a=>a[Math.floor(bR()*a.length)];
function bScale(){return SCALES[P.scale].s;}
function bDeg(deg,base){const sc=bScale(),n=sc.length;return base+P.key+sc[((deg%n)+n)%n]+12*Math.floor(deg/n);}
function bProg(L){const M=BMODES[BUDDY.mode],bars=Math.max(1,L/4);const p=M.prog||BUDDY.chaosProg||(BUDDY.chaosProg=[0,1,2,3].map(()=>bPick([0,1,2,3,4,5])));return [...Array(bars)].map((_,i)=>p[i%p.length]);}
function bSnapScale(m){if(inScale(m))return m;for(const d of [-1,1,-2,2])if(inScale(m+d))return m+d;return m;}
// one track per part, made on first use
function bTrack(kind){const k='buddy-'+(bKind[kind]==='drum'?'drums':kind);let t=P.tracks.find(t=>t.quick===k);if(t)return t;
 const M=BMODES[BUDDY.mode],names={drums:'🤖 Buddy Drums',bass:'🤖 Buddy Bass',keys:'🤖 Buddy Keys',lead:'🤖 Buddy Riff'};
 t=newTrack(bKind[kind]==='drum'?'drums':'synth',names[k.slice(6)]);t.quick=k;t.color={drums:'#74c0fc',bass:'#ffa94d',keys:'#63e6be',lead:'#f783ac'}[k.slice(6)];
 if(t.type==='synth')t.patch=fm1Patch(M.pre[kind]!=null?M.pre[kind]:0);t.vol=.42+.35*BUDDY.energy;if(kind==='keys')t.fx.rev=.25;if(kind==='lead')t.fx.dly=.18;
 P.tracks.push(t);updateMix();return t;}
function bClip(t){const L=P.loop.b-P.loop.a;let c=t.clips.find(c=>c.start===P.loop.a&&c.plen===L);if(!c){c=newClip(t.type,P.loop.a,L,L);c.name='Buddy';t.clips.push(c);}return c;}
const DPAD={kick:0,snare:1,clap:2,hat:3,ohat:4};
// does the song (outside the buddy) already have this sound? then the buddy leaves it alone
function songHas(kind){const pads={kick:[0],snare:[1,2],clap:[1,2],hat:[3,10],ohat:[4]}[kind];
 return P.tracks.some(t=>!(t.quick||'').startsWith('buddy')&&!t.mute&&t.clips.some(c=>{if(pads)return t.type==='drums'&&c.notes.some(n=>pads.includes(n.p));
  if(kind==='bass')return t.type==='synth'&&c.notes.length&&c.notes.reduce((a,n)=>a+n.m,0)/c.notes.length<50;if(kind==='keys')return t.type==='synth'&&c.notes.length>8&&/chord|keys|piano|organ|pad/i.test(t.name);return false;}));}
// ---------- the parts it can add ----------
function bWrite(kind){const M=BMODES[BUDDY.mode],L=P.loop.b-P.loop.a,mode=BUDDY.mode,E=BUDDY.energy,t=bTrack(kind),c=bClip(t),prog=bProg(L),out=[];
 const vel=v=>Math.max(.15,Math.min(1,v*(.75+.4*E)));
 if(bKind[kind]==='drum'){let p=DPAD[kind],steps=[];
  for(let s=0;s<L*4;s++){const b=s%16;
   if(kind==='kick')(mode==='dance'?b%4===0:mode==='chaos'?bR()<.22:[0,6,10].includes(b))&&steps.push([s,.9]);
   if(kind==='snare'||kind==='clap')b%8===4&&steps.push([s,.85]),mode==='groove'&&bR()<.15&&b%2&&steps.push([s,.3]);
   if(kind==='hat'){if(mode==='chill'){b%4===2&&steps.push([s,.45]);}else if(mode==='chaos'){bR()<.4&&steps.push([s,.3+bR()*.5]);}else if(b%2===0)steps.push([s,b%4===0?.65:.5]);else if(mode==='groove'&&bR()<.35)steps.push([s,.28]);}
   if(kind==='ohat')b%4===2&&steps.push([s,.6]);}
  if(kind==='perc'){p=mode==='groove'?bPick([9,11]):mode==='dance'?10:bPick([9,10,11,13,14]);
   for(let s=0;s<L*4;s++){const b=s%16;if(p===10?(s%2===1||bR()<.3):mode==='chaos'?bR()<.25:[3,7,10,14].includes(b)&&bR()<.8)steps.push([s,p===10?.35:.55]);}}
  BUDDY.drum[kind]=steps.map(([s,v])=>({t:s/4,p,v:vel(v)}));bDrumRebuild();return {kind,p,track:t.id};}
 c.notes=[];
 if(kind==='bass'){const R={chill:[[0,2],[2,1.5]],groove:[[0,.5],[.75,.25],[1.5,.25],[2,.5],[2.5,.25,12],[3.25,.25,7]],dance:[[.5,.4],[1.5,.4],[2.5,.4],[3.5,.4]],chaos:null}[mode];
  prog.forEach((deg,bar)=>{const root=bDeg(deg,36);const rh=R||[...Array(3+Math.floor(bR()*4))].map(()=>[Math.floor(bR()*8)/2,.25+bR()*.5,bPick([0,0,7,12,3])]);
   rh.forEach(([t0,d,iv])=>c.notes.push({t:bar*4+t0,d,m:iv?bSnapScale(root+iv):root,v:vel(.85)}));});}
 if(kind==='keys'){const R={chill:[[0,3.8]],groove:[[.5,.2],[1.75,.2],[2.5,.2],[3.5,.2]],dance:[[.5,.35],[1.5,.35],[2.5,.35],[3.5,.35]],chaos:null}[mode];
  prog.forEach((deg,bar)=>{const ch=[0,2,4].map(i=>bDeg(deg+i,60)),rh=R||[...Array(2+Math.floor(bR()*3))].map(()=>[Math.floor(bR()*16)/4,.25]);
   rh.forEach(([t0,d])=>ch.forEach(m=>c.notes.push({t:bar*4+t0,d,m,v:vel(mode==='chill'?.55:.7)})));});}
 if(kind==='lead'){const mel=BUDDY.song&&BUDDY.sec?BSEC[BUDDY.sec].mel:null;let mo;
  if(mel&&BUDDY.theme&&!BUDDY.newRiff)mo=bMelody(BUDDY.theme,mel);else{mo=buddyMotif();if(!BUDDY.theme||mo.cover)BUDDY.theme=mo;BUDDY.newRiff=false;}
  BUDDY.motif=mo;const half=L>=8&&mel!=='chorus'?L/2:0;
  // call and response: your phrase is the call, the buddy's cover answers in the second half of the loop
  for(let rep=0;rep*4<L-half;rep++){if(mode!=='chaos'&&rep%2===1&&L-half>4&&bR()<.5)continue;
   mo.notes.forEach((n,i)=>{let m=n.m;if(rep%2===1){if(mode==='chaos')m=bSnapScale(2*mo.notes[0].m-m);else if(i===mo.notes.length-1)m=bDeg(0,Math.floor((m-P.key)/12)*12);}
    const tt=half+rep*4+n.t;if(tt<L)c.notes.push({t:tt,d:Math.min(n.d,L-tt),m,v:vel(n.v)});});}}
 c.notes.sort((a,b)=>a.t-b.t);return {kind,track:t.id};}
// the riff: a cover of what you just played or sang (rhythm, contour, accents), or a fresh hook if it heard nothing
function buddyMotif(){const L=P.loop.b-P.loop.a,now=performance.now(),win=L*60/P.bpm*2000,mode=BUDDY.mode;
 const rec=BUDDY.heard.filter(n=>now-n.at<win),keys=rec.filter(n=>n.src==='keys');const src=(keys.length>=3?keys:rec.filter(n=>n.src==='mic')).slice(-8);const g=BMODES[mode].snap;
 if(src.length>=3){const ms=src.map(n=>n.m).sort((a,b)=>a-b),med=ms[ms.length>>1];src.forEach(n=>{while(n.m-med>7)n.m-=12;while(med-n.m>7)n.m+=12;});}
 if(src.length>=3){const t0=src[0].b;let notes=src.map(n=>{let t=n.b-t0;while(t<0)t+=L;return {t:Math.round(t*g)/g,d:n.d,m:n.m,v:n.v};}).filter(n=>n.t<4);
  const seen=new Set();notes=notes.filter(n=>{const k=n.t;if(seen.has(k))return false;seen.add(k);return true;});
  if(notes.length>=2){const avg=notes.reduce((a,n)=>a+n.m,0)/notes.length,shift=Math.round((72-avg)/12)*12;
   const vmax=Math.max(...notes.map(n=>n.v))||1;
   notes=notes.map(n=>({t:n.t,d:Math.max(1/g,Math.min(1,n.d)),m:bSnapScale(n.m+shift),v:.55+.45*(n.v/vmax)}));   // louder notes stay accented
   if(mode==='groove')notes.forEach(n=>n.d=Math.min(n.d,.25));if(mode==='chill')notes.forEach(n=>n.d=Math.max(n.d,.5));
   return {notes,cover:true};}}
 const rh={chill:[0,1.5,2,3],groove:[0,.75,1.5,2.5,2.75],dance:[0,.5,1,1.5,2.5,3],chaos:[...Array(5)].map(()=>Math.floor(bR()*16)/4).sort((a,b)=>a-b)}[mode];
 let d=bPick([0,2,4]);const notes=rh.map((t,i)=>{if(i)d+=bPick(mode==='chaos'?[-3,-2,2,3,4]:[-1,-1,1,1,2,-2,0]);d=Math.max(-2,Math.min(9,d));return {t,d:mode==='chill'?.75:.25,m:bDeg(d,72),v:i===0?1:.7};});
 if(mode!=='chaos')notes[notes.length-1].m=bDeg(bPick([0,2,4]),72);return {notes,cover:false};}
// ---------- each time around the loop ----------
function buddyStep(){const M=BMODES[BUDDY.mode],E=BUDDY.energy;BUDDY.pass++;
 const busy=BUDDY.userHits>0;BUDDY.userHits=0;const now=performance.now(),loopMs=(P.loop.b-P.loop.a)*60/P.bpm*1000+300;
 const keysNow=BUDDY.heard.filter(n=>n.src==='keys'&&now-n.at<loopMs),micNow=BUDDY.heard.filter(n=>n.src==='mic'&&now-n.at<loopMs*2);
 const every=Math.max(1,Math.round(M.every*(1.5-E)));
 // you played a riff on the keys: answer it with a cover on the next time around (call and response)
 if(keysNow.length>=3){BUDDY.newRiff=true;bWrite('lead');BUDDY.lastCover=BUDDY.pass;if(!BUDDY.added.includes('lead'))BUDDY.added.push('lead');bSay(`Answering your riff: a ${BUDDY.motif.notes.length}-note cover on its ${FM_PRESETS[bTrack('lead').patch.p].n} synth`);QK.needPanel=true;return;}
 if(busy&&BUDDY.mode!=='chaos'){bSay('Listening to you… it answers when you leave a gap.');return;}
 // a melody from the music in the room: now and then it picks up the line and covers it
 if(GUIDE.phones&&BUDDY.added.includes('lead')&&micNow.length>=4&&BUDDY.pass-(BUDDY.lastCover||0)>=every*3){BUDDY.newRiff=true;bWrite('lead');BUDDY.lastCover=BUDDY.pass;bSay('Picked up a line from the music and made a cover of it');return;}
 const songMoved=bSongStep();
 if(BUDDY.mode==='chaos'&&BUDDY.added.length){const k=bPick(BUDDY.added);bWrite(k);if(bR()<.3)BUDDY.chaosProg=null;}
 if(songMoved&&BUDDY.mode!=='chaos')return;
 if(BUDDY.pass-BUDDY.lastAdd<every)return;BUDDY.lastAdd=BUDDY.pass;
 const max=Math.round(M.max*(.6+.6*E));
 if(BUDDY.added.length<max){const next=M.order.find(k=>!BUDDY.added.includes(k)&&!songHas(k));
  if(next){bWrite(next);BUDDY.added.push(next);bSay('Added '+({kick:'a kick',snare:'a snare backbeat',clap:'claps on 2 and 4',hat:'hi-hats',ohat:'off-beat open hats',perc:'some percussion',bass:'a bass line',keys:'chords',lead:'a little riff'})[next]);QK.needPanel=true;return;}}
 // full band: keep it alive with a small change now and then
 if(BUDDY.added.length&&bR()<.5+E*.4){const k=bPick(BUDDY.added);bWrite(k);bSay('Switched up the '+({kick:'kick',snare:'snare',clap:'claps',hat:'hats',ohat:'open hats',perc:'percussion',bass:'bass',keys:'chords',lead:'riff'})[k]);}}
function bSay(t){BUDDY.status=t;const e=document.getElementById('bStatus');if(e)e.textContent=t;}
// called every frame from quickTick: one step just before the loop comes around (so the new notes are ready in time)
function buddyTick(){if(!BUDDY.on)return;if(!T.playing||!loopOn()){BUDDY.lastH=null;return;}const h=headNow();
 if(BUDDY.lastH!=null&&h<BUDDY.lastH-.5)BUDDY.cycle=(BUDDY.cycle||0)+1;BUDDY.lastH=h;
 if(h>=P.loop.b-.6&&BUDDY.stepDone!==BUDDY.cycle){BUDDY.stepDone=BUDDY.cycle;buddyStep();QK.dirtyDraw=true;}
 const now=performance.now();if(now-(BUDDY.pt||0)>40){BUDDY.pt=now;buddyPitch();}}
async function buddyStart(){await ensureAudio();BUDDY.on=true;BUDDY.show=true;BUDDY.pass=0;BUDDY.lastAdd=-99;BUDDY.heard=[];BUDDY.userHits=0;BUDDY.chaosProg=null;BUDDY.sec=null;BUDDY.fill=null;BUDDY.drum={};BUDDY.theme=null;
 BUDDY.added=[...new Set(P.tracks.filter(t=>(t.quick||'').startsWith('buddy')).flatMap(t=>t.type==='drums'?[]:[t.quick.slice(6)]))];
 if(!GUIDE.on)await guideOn().catch(()=>{});
 const M=BMODES[BUDDY.mode],empty=!P.tracks.some(t=>t.clips.some(c=>t.type==='audio'?c.src:c.notes.length));
 if(!T.playing){if(empty){const heardT=GUIDE.on&&GUIDE.bpmConf>.35?Math.round(GUIDE.bpm):0;if(!QK.lockTempo)setBpm(heardT||Math.round(M.bpm[0]+bR()*(M.bpm[1]-M.bpm[0])),true);
   if(GUIDE.on&&GUIDE.keyConf>.4){P.key=GUIDE.key;P.scale=GUIDE.minor?1:0;}P.loop={on:true,a:0,b:8};}
  qEnsureLoop();const first=M.order.find(k=>!songHas(k));if(first&&!BUDDY.added.includes(first)){bWrite(first);BUDDY.added.push(first);}
  if(GUIDE.on&&GUIDE.bpmConf>.35)await guideSync();else await play(P.loop.a);}
 bSay(`${M.e} ${M.n} buddy is in! Play something, then leave a gap and it answers.`);syncTop();renderTimeline();renderPanel();}
function buddyStop(){BUDDY.on=false;BUDDY.sec=null;BUDDY.fill=null;bApplySection();bSay('Buddy stopped. Its parts stay in your song (the 🤖 tracks). Remove them below if you like.');renderPanel();}
function buddyRemove(){commit();P.tracks=P.tracks.filter(t=>!(t.quick||'').startsWith('buddy'));BUDDY.added=[];updateMix();renderTimeline();renderPanel();toast('Removed the Buddy parts');}
function buddyKeep(){commit();BUDDY.sec=null;BUDDY.fill=null;bApplySection();let n=0;P.tracks.forEach(t=>{if((t.quick||'').startsWith('buddy')){t.quick=null;t.name=t.name.replace('🤖 Buddy','Buddy');n++;}});BUDDY.added=[];renderTimeline();renderPanel();toast(n?'Kept! The buddy\'s parts are now your tracks':'Nothing to keep yet');}
function buddyStrip(){const s=el('div','qbuddy');s.append(el('span','bear','🤖'),el('b','','Jam Buddy'));
 const mc=el('div','bmodes');Object.entries(BMODES).forEach(([k,M])=>{const b=btn(M.e+' '+M.n,()=>{BUDDY.mode=k;BUDDY.chaosProg=null;
   P.tracks.filter(t=>(t.quick||'').startsWith('buddy')&&t.type==='synth').forEach(t=>{const kind=t.quick.slice(6);if(M.pre[kind]!=null){const v=t.patch.vol;t.patch=fm1Patch(M.pre[kind]);t.patch.vol=v;}});
   if(BUDDY.on&&T.playing)BUDDY.added.forEach(bWrite);renderPanel();toast(M.e+' '+M.n+': '+M.d);},M.d,BUDDY.mode===k?'on':'');mc.appendChild(b);});
 s.append(mc);const en=slider('Energy',0,1,.01,()=>BUDDY.energy,v=>{BUDDY.energy=v;P.tracks.forEach(t=>{if((t.quick||'').startsWith('buddy'))t.vol=.42+.35*v;});updateMix();},v=>v<.34?'shy':v<.67?'steady':'bold');en.classList.add('bknob');s.append(en);
 s.append(btn(BUDDY.song?'🎼 Song mode: on':'🎼 Song mode: off',()=>{BUDDY.song=!BUDDY.song;if(!BUDDY.song){BUDDY.sec=null;BUDDY.fill=null;}bApplySection();renderPanel();},'On: the buddy arranges a song, with verses, choruses and breaks, bringing its parts in and out and writing a melody for each part. Off: it just keeps the loop going','bsong'+(BUDDY.song?' on':'')));
 s.append(BUDDY.on?btn('■ Stop buddy',buddyStop,'Stops the buddy. Its parts stay in the song.','bgo on'):btn('▶ Start buddy',buddyStart,'The buddy starts the loop (in time with any music it hears) and joins in','bgo'),
  btn('Keep its parts',buddyKeep,'Turns the buddy\'s 🤖 tracks into your own tracks'),btn('Remove its parts',buddyRemove,'Deletes the buddy\'s 🤖 tracks'));
 const st=el('span','btip',BUDDY.status||BMODES[BUDDY.mode].d);st.id='bStatus';s.append(st);return s;}

// ---------- song mode: the buddy arranges a song out of the loop ----------
// It cycles sections, bringing its background parts in and out, writes a melody for each section from the theme
// (your riff, or its own hook), and plays a drum fill going into each new section. The beat keeps going the whole time.
const BSEC={intro:{n:'Intro',on:['kick','hat','ohat','keys','perc'],say:'Intro: just the groove and chords'},
 verse:{n:'Verse',on:['kick','hat','ohat','snare','clap','bass','keys','lead'],mel:'verse',say:'Verse: the main tune'},
 chorus:{n:'Chorus',on:'all',mel:'chorus',say:'Chorus: everybody in, with a higher hook'},
 break:{n:'Break',on:['hat','keys','lead','perc'],mel:'bridge',say:'Break: drums drop back, the melody turns around'}};
const BSONG=['verse','chorus','verse','break','chorus'];
// move a note up or down k steps of the song's scale
function bShiftDeg(m,k){let x=m,step=Math.sign(k);for(let i=0;i<Math.abs(k);i++){x+=step;while(!inScale(x))x+=step;}return x;}
function bMelody(th,mel){const n=th.notes.map(x=>Object.assign({},x));
 if(mel==='chorus'){n.forEach(x=>{x.m=bShiftDeg(x.m,2);x.d=Math.min(1,x.d*1.6);x.v=Math.min(1,x.v+.1);});const lm=n[n.length-1].m;let r=bDeg(0,Math.floor((lm-P.key)/12)*12);if(r<lm-2)r+=12;n[n.length-1].m=r;}
 if(mel==='bridge'){const a=n[0].m;n.forEach((x,i)=>{x.m=bSnapScale(2*a-x.m);x.d=Math.max(x.d,.5);});for(let i=n.length-1;i>0;i-=2)if(n.length>3)n.splice(i,1);}
 return {notes:n,cover:th.cover,mel};}
function bDrumRebuild(){const t=P.tracks.find(t=>t.quick==='buddy-drums');if(!t)return;const c=bClip(t),on=BUDDY.song&&BUDDY.sec?BSEC[BUDDY.sec].on:'all';
 c.notes=[];for(const k in BUDDY.drum)if(on==='all'||on.includes(k))c.notes.push(...BUDDY.drum[k]);
 if(BUDDY.fill){const L=P.loop.b-P.loop.a;c.notes=c.notes.filter(n=>n.t<L-1||n.p===0);c.notes.push(...BUDDY.fill);}c.notes.sort((a,b)=>a.t-b.t);}
function bApplySection(){const on=BUDDY.song&&BUDDY.sec?BSEC[BUDDY.sec].on:'all';
 P.tracks.forEach(t=>{const q=t.quick||'';if(!q.startsWith('buddy-')||t.type!=='synth')return;t.mute=!(on==='all'||on.includes(q.slice(6)));});bDrumRebuild();}
// called from buddyStep once the band has 3+ parts. Returns true when it changed something this time around.
function bSongStep(){if(!BUDDY.song||BUDDY.added.length<3)return false;const L=P.loop.b-P.loop.a,len=Math.max(2,Math.round(16/L))*(BUDDY.mode==='chill'?2:1);
 if(BUDDY.fill){BUDDY.fill=null;}
 if(BUDDY.sec==null){BUDDY.secIdx=-1;BUDDY.sec='intro';BUDDY.secPass=0;bApplySection();bSay('🎼 Song mode: '+BSEC.intro.say);return true;}
 BUDDY.secPass++;
 if(BUDDY.secPass===len-1&&BUDDY.mode!=='chill'){const p=BUDDY.mode==='dance'?2:1;BUDDY.fill=[0,1,2,3].map(i=>({t:L-1+i/4,p,v:.45+i*.15}));if(BUDDY.mode!=='chaos')BUDDY.fill.push({t:L-.5,p:3,v:.6});bDrumRebuild();}
 if(BUDDY.secPass>=len){BUDDY.secIdx=(BUDDY.secIdx+1)%BSONG.length;BUDDY.sec=BSONG[BUDDY.secIdx];BUDDY.secPass=0;BUDDY.fill=null;
  if(BUDDY.added.includes('lead'))bWrite('lead');if(BUDDY.sec==='chorus'&&BUDDY.added.includes('keys'))bWrite('keys');
  bApplySection();bSay('🎼 '+BSEC[BUDDY.sec].say);QK.needPanel=true;return true;}
 return false;}
