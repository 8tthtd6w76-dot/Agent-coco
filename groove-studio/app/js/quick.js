// ===== Groove Studio: instrument light-ups + the Quick Loop tab =====
// Every sound lights up its instrument in that instrument's color (pads, track headers, Quick Loop tiles), right when you hear it.
// Quick Loop: pick an instrument, press Play, tap a rhythm. Taps snap to the beat and are layered into the song as you go.
'use strict';
function instColor(trId,p){const tr=trackById(trId);if(!tr)return '#fff';return tr.type==='drums'&&p>=0?PAD_COLORS[p]:tr.color;}
function glow(e,col,strong){if(!e||!e.animate)return;e.animate([{boxShadow:`0 0 0 2px ${col}, 0 0 ${strong?22:14}px ${col}`,filter:'brightness(1.6)'},{boxShadow:'0 0 0 0 transparent',filter:'none'}],{duration:strong?260:200,easing:'ease-out'});}
function lightUp(ev){const col=instColor(ev.tr,ev.p);
 const h=document.querySelector(`.th[data-id="${ev.tr}"] .cbar`);if(h)h.animate([{background:col,boxShadow:`0 0 12px 3px ${col}`,transform:'scaleX(2.5)'},{background:col,boxShadow:'none',transform:'none'}],{duration:220});
 const hd=document.querySelector(`.th[data-id="${ev.tr}"]`);if(hd)hd.animate([{backgroundColor:col+'33'},{backgroundColor:'transparent'}],{duration:220});
 if(ev.p>=0&&UI.sel.track===ev.tr&&PANEL.tab!=='quick'){const pd=document.querySelector(`.pad[data-p="${ev.p}"]`);if(pd)pd.animate([{background:col,color:'#111'},{}],{duration:180});}
 document.querySelectorAll(`.qtile[data-tr="${ev.tr}"]`).forEach(q=>{if(+q.dataset.p===ev.p||q.dataset.p==='-1'&&ev.p<0)glow(q,col,true);});
 const dot=document.querySelector(`.qlive [data-tr="${ev.tr}"][data-p="${ev.p<0?-1:ev.p}"]`);if(dot)glow(dot,col,true);
 const nl=document.querySelector(`#nowLights [data-tr="${ev.tr}"][data-p="${ev.p<0?-1:ev.p}"]`);if(nl){nl.animate([{background:col+'55',borderColor:col,color:'#fff'},{}],{duration:260});nl.firstChild.animate([{opacity:1,boxShadow:`0 0 10px 2px ${col}`},{}],{duration:260});}}
// the Now playing strip: one light per sound in the song
function renderNow(){const box=$('#nowLights');if(!box)return;const items=[];
 P.tracks.forEach(t=>{if(t.type==='drums'){const ps=new Set();t.clips.forEach(c=>c.notes.forEach(n=>ps.add(n.p)));[...ps].sort((a,b)=>a-b).forEach(p=>items.push({tr:t,p,n:(t.pads[p].name||PAD_NAMES[p]),c:PAD_COLORS[p]}));}
  else if(t.clips.some(c=>t.type==='audio'?c.src:c.notes.length))items.push({tr:t,p:-1,n:t.name,c:t.color});});
 const key=items.map(i=>i.tr.id+i.p+i.n+i.c).join('|');if(key===box.dataset.k)return;box.dataset.k=key;box.innerHTML='';
 items.forEach(i=>{const s=el('span','','<i></i>'+esc(i.n));s.style.setProperty('--c',i.c);s.dataset.tr=i.tr.id;s.dataset.p=i.p;s.onclick=()=>{PANEL.tab='track';select(i.tr.id,null);if(i.p>=0){PANEL.pad=i.p;renderPanel();}};box.appendChild(s);});
 if(!items.length)box.appendChild(el('span','','<i></i>Nothing yet: add a beat or press Record'));}
function runLights(){if(!AC||!VIS.length)return;const now=AC.currentTime;let keep=0;
 for(let i=0;i<VIS.length;i++){const e=VIS[i];if(e.t<=now+.01)lightUp(e);else VIS[keep++]=e;}VIS.length=keep;}

// ---------- Quick Loop ----------
// drums go onto one "Quick Beat" track (one pad each); melodic sounds each get their own FM-1 track
const QUICK_INST=[
 {id:'kick',n:'Kick',e:'🥁',kind:'pad',p:0},{id:'snare',n:'Snare',e:'🪘',kind:'pad',p:1},{id:'clap',n:'Clap',e:'👏',kind:'pad',p:2},
 {id:'hat',n:'Hi-Hat',e:'✨',kind:'pad',p:3},{id:'ohat',n:'Open Hat',e:'💫',kind:'pad',p:4},{id:'shaker',n:'Shaker',e:'🧂',kind:'pad',p:10},
 {id:'cowbell',n:'Cowbell',e:'🔔',kind:'pad',p:9},{id:'conga',n:'Conga',e:'🪇',kind:'pad',p:11},{id:'snap',n:'Snap',e:'🫰',kind:'pad',p:13},{id:'tom',n:'Tom',e:'🛢️',kind:'pad',p:7},
 {id:'bass',n:'Bass',e:'🎸',kind:'keys',preset:3,oct:2,col:'#ff922b'},{id:'keys',n:'Piano',e:'🎹',kind:'keys',preset:1,oct:4,col:'#4dabf7'},
 {id:'bell',n:'Bells',e:'🛎️',kind:'keys',preset:2,oct:5,col:'#ffe066'},{id:'pluck',n:'Pluck',e:'🪕',kind:'keys',preset:7,oct:4,col:'#63e6be'},
 {id:'lead',n:'Lead',e:'🎺',kind:'keys',preset:0,oct:4,col:'#e599f7'},{id:'organ',n:'Organ',e:'⛪',kind:'keys',preset:5,oct:3,col:'#ff8787'}];
const QK={snap:2,inst:'kick',layers:[],tapT:[],armedSnap:null,held:{}};
const qInst=()=>QUICK_INST.find(q=>q.id===QK.inst)||QUICK_INST[0];
function qColor(q){return q.kind==='pad'?PAD_COLORS[q.p]:q.col;}
// the track a Quick instrument plays on (made on first use)
function qTrack(q,make){if(q.kind==='pad'){let t=P.tracks.find(t=>t.quick==='beat');if(!t&&make){t=newTrack('drums','Quick Beat');t.quick='beat';t.color='#ff5d5d';P.tracks.push(t);updateMix();QK.needPanel=true;}return t;}
 let t=P.tracks.find(t=>t.quick===q.id);if(!t&&make){t=newTrack('synth','Quick '+q.n);t.quick=q.id;t.color=q.col;t.patch=fm1Patch(q.preset);P.tracks.push(t);updateMix();QK.needPanel=true;}return t;}
// 8 big keys: the song's scale from the instrument's octave
function qNotes(q){const sc=SCALES[P.scale].s,out=[];for(let i=0;i<8;i++)out.push(12*(q.oct+1)+P.key+sc[i%sc.length]+12*Math.floor(i/sc.length));return out;}
function qEnsureLoop(){if(!P.loop.on||P.loop.b<=P.loop.a){const a=Math.floor(T.head/4)*4,end=songEnd();P.loop={on:true,a:end>a?a:0,b:(end>a?a:0)+Math.max(8,Math.min(16,Math.ceil((end-(end>a?a:0))/4)*4||8))};renderTimeline();syncTop();}}
async function qPlay(){if(T.playing){stop();syncTop();renderPanel();return;}qEnsureLoop();await play(P.loop.a);syncTop();renderPanel();}
// a tap: hear it now, and (while playing) write it into the loop, snapped to the nearest 16th
function qTap(m,vel=1){const q=qInst();ensureAudio().then(()=>{const tr=qTrack(q,true);if(!tr)return;
  if(q.kind==='pad')livePad(tr,q.p,vel);else liveKeyDown(tr,m,.9*vel);
  if(!T.playing)return;
  if(!QK.armedSnap){QK.armedSnap=JSON.stringify(P);}
  const late=((AC.outputLatency||0)+(AC.baseLatency||0))*P.bpm/60;let b=headNow()-late;
  if(loopOn()&&b<P.loop.a)b+=P.loop.b-P.loop.a;const g=QK.snap;b=Math.round(b*g)/g;if(loopOn()&&b>=P.loop.b)b=P.loop.a;
  let c=tr.clips.find(c=>b>=c.start&&b<c.start+c.len);
  if(!c){c=newClip(tr.type,P.loop.a,P.loop.b-P.loop.a,P.loop.b-P.loop.a);c.name='Quick';tr.clips.push(c);}
  const t=((b-c.start)%c.plen+c.plen)%c.plen;
  if(q.kind==='pad'){if(!c.notes.some(n=>n.p===q.p))QK.needPanel=true;if(!c.notes.some(n=>n.p===q.p&&Math.abs(n.t-t)<.01))c.notes.push({t,p:q.p,v:vel});}
  else{if(!c.notes.length)QK.needPanel=true;const n={t,d:.5,m,v:.85};c.notes=c.notes.filter(x=>!(x.m===m&&Math.abs(x.t-t)<.01));c.notes.push(n);QK.held[m]={n,b:headNow(),tr};}
  c.notes.sort((x,y)=>x.t-y.t);DIRTY=true;QK.dirtyDraw=true;});}
function qRelease(m){const q=qInst(),tr=qTrack(q,false);if(tr)liveKeyUp(tr,m);const H=QK.held[m];delete QK.held[m];
 if(H&&T.playing){let d=headNow()-H.b;if(d<0)d+=P.loop.b-P.loop.a;H.n.d=Math.max(1/QK.snap,Math.round(d*QK.snap)/QK.snap);}}
// a layer = everything tapped since you picked the instrument; it is saved for "Undo last layer"
function qFinishLayer(){if(QK.armedSnap){HIST.u.push(QK.armedSnap);HIST.r=[];QK.layers.push({snap:QK.armedSnap,name:qInst().n});QK.armedSnap=null;}}
function qPick(id){qFinishLayer();QK.inst=id;renderPanel();}
function qUndoLayer(){qFinishLayer();const L=QK.layers.pop();if(!L){toast('No layers to undo yet');return;}P=JSON.parse(L.snap);HIST.u.push(JSON.stringify(P));updateMix();renderTimeline();renderPanel();toast('Removed the '+L.name+' layer');}
function qClearInst(){const q=qInst(),tr=qTrack(q,false);if(!tr){toast(q.n+' has nothing yet');return;}qFinishLayer();commit();
 tr.clips.forEach(c=>{if(c.start<P.loop.b&&c.start+c.len>P.loop.a)c.notes=q.kind==='pad'?c.notes.filter(n=>n.p!==q.p):[];});renderTimeline();toast('Cleared '+q.n+' in the loop');}
// tap tempo: 4+ taps set the BPM
function qTapTempo(){const now=performance.now();QK.tapT=QK.tapT.filter(t=>now-t<2500);QK.tapT.push(now);const n=QK.tapT.length;
 if(n>=4){const iv=(QK.tapT[n-1]-QK.tapT[0])/(n-1),bpm=Math.round(60000/iv);if(bpm>=50&&bpm<=200){setBpm(bpm);toast('Tempo: '+bpm+' BPM');}}else toast('Keep tapping… '+(4-n)+' more');}

function quickPanel(Pn){const q=qInst(),col=qColor(q);
 const h=el('div','ph');h.appendChild(panelTabs());h.appendChild(el('span','hint',T.playing?'Tap along! Each tap snaps to the beat and joins the loop.':'1. Pick a sound  2. Press Play  3. Tap a rhythm'));Pn.appendChild(h);
 const body=el('div','pb quick');Pn.appendChild(body);
 // sounds
 const L=el('div','col');L.style.width='420px';L.style.flex='none';L.append(el('h4','','1 · Pick a sound'));
 const g=el('div','qgrid');QUICK_INST.forEach(it=>{const tr=qTrack(it,false),b=el('button','qtile'+(it.id===QK.inst?' on':''),`<span class="em">${it.e}</span><span>${it.n}</span>`);
  b.style.setProperty('--c',qColor(it));if(tr){b.dataset.tr=tr.id;b.dataset.p=it.kind==='pad'?it.p:-1;}b.onclick=()=>qPick(it.id);g.appendChild(b);});
 L.append(g);body.appendChild(L);
 // play + tap
 const M=el('div','col');M.style.flex='1';
 const top=el('div','row');const pb=el('button','qplay'+(T.playing?' on':''),T.playing?'■ Stop':'▶ Play');pb.onclick=qPlay;
 top.append(el('h4','','2 · Play'),pb,el('span','hint',P.loop.on?`Looping bars ${P.loop.a/4+1}–${P.loop.b/4}`:'Plays a 2–4 bar loop'));M.append(top);
 const sn=el('div','row');sn.append(el('h4','',`3 · Tap ${q.n}`),el('span','hint','Snap taps to:'));const sg=el('div','qsnap');
 [[4,'Tight (1/16)'],[2,'Normal (1/8)'],[1,'Simple (beats)']].forEach(([v,n])=>{const b=btn(n,()=>{QK.snap=v;renderPanel();},'',QK.snap===v?'on':'');sg.appendChild(b);});sn.append(sg);M.append(sn);
 if(q.kind==='pad'){const t=el('button','qtap',`<span class="em">${q.e}</span><b>TAP</b><span class="hint">click, or press any letter key</span>`);t.style.setProperty('--c',col);
  const tr=qTrack(q,false);if(tr){t.dataset.tr=tr.id;t.dataset.p=q.p;t.classList.add('qtile');}
  t.onpointerdown=e=>{e.preventDefault();qTap(0,e.shiftKey?.5:1);glow(t,col,true);};M.append(t);}
 else{const ks=el('div','qkeys');qNotes(q).forEach((m,i)=>{const k=el('button','qkey',`<b>${NOTE_NAMES[((m%12)+12)%12]}</b><span>${'ASDFGHJK'[i]}</span>`);k.style.setProperty('--c',col);k.dataset.m=m;
   k.onpointerdown=e=>{e.preventDefault();qTap(m);glow(k,col,true);const up=()=>{qRelease(m);removeEventListener('pointerup',up);};addEventListener('pointerup',up);};ks.appendChild(k);});
  M.append(ks,el('div','hint','Keys play the song\'s scale ('+NOTE_NAMES[P.key]+' '+SCALES[P.scale].n+'), so every note fits. Hold for longer notes.'));}
 body.appendChild(M);
 // layers + tempo
 const R=el('div','col');R.style.width='230px';R.style.flex='none';R.append(el('h4','','Layers'));
 R.append(btn('↶ Undo last layer',qUndoLayer,'Takes out everything you tapped with the last sound'),btn('Clear '+q.n,qClearInst,'Removes this sound from the loop'),btn('Repeat through whole song',qRepeatAll,'Stretches your Quick layers so they play from the start to the end of the song'));
 const live=el('div','qlive');P.tracks.filter(t=>t.quick).forEach(t=>{if(t.type==='drums'){const ps=new Set();t.clips.forEach(c=>c.notes.forEach(n=>ps.add(n.p)));ps.forEach(p=>{const d=el('span','',esc(t.pads[p].name||PAD_NAMES[p]));d.style.setProperty('--c',PAD_COLORS[p]);d.dataset.tr=t.id;d.dataset.p=p;live.appendChild(d);});}
  else if(t.clips.some(c=>c.notes.length)){const d=el('span','',esc(t.name.replace('Quick ','')));d.style.setProperty('--c',t.color);d.dataset.tr=t.id;d.dataset.p=-1;live.appendChild(d);}});
 R.append(el('div','hint',live.children.length?'In your loop (they light up as they play):':'Your layers will show up here.'),live);
 R.append(el('h4','','Tempo'),el('div','row',`<span class="hint">${P.bpm} BPM</span>`));const tt=btn('Tap tempo',qTapTempo,'Tap 4 or more times at the speed you want');R.append(tt);
 body.appendChild(R);}
function panelTabs(){const w=el('div','tabs');
 [['track','Track tools'],['quick','⚡ Quick Loop']].forEach(([k,n])=>{const b=el('button',PANEL.tab===k?'on':'',n);b.onclick=()=>{if(k!=='quick')qFinishLayer();PANEL.tab=k;renderPanel();};w.appendChild(b);});return w;}
// keyboard while Quick Loop is open: letters tap the drum, A–K play the 8 scale keys
addEventListener('keydown',e=>{if(PANEL.tab!=='quick'||e.metaKey||e.ctrlKey||e.altKey||e.repeat)return;if(e.target.closest&&e.target.closest('input[type=text],input[type=number],#songName'))return;
 const k=e.key.toLowerCase();if(k.length!==1||!/[a-z0-9]/.test(k))return;const q=qInst();e.stopImmediatePropagation();e.preventDefault();
 if(q.kind==='pad'){qTap(0,e.shiftKey?.5:1);glow(document.querySelector('.qtap'),qColor(q),true);}
 else{const i='asdfghjk'.indexOf(k);if(i<0)return;const m=qNotes(q)[i];if(QK.held[m])return;qTap(m);const kb=document.querySelector(`.qkey[data-m="${m}"]`);glow(kb,qColor(q),true);QK.keyDown=QK.keyDown||{};QK.keyDown[e.code]=m;}},true);
addEventListener('keyup',e=>{if(PANEL.tab!=='quick'||!QK.keyDown)return;const m=QK.keyDown[e.code];if(m!=null){delete QK.keyDown[e.code];qRelease(m);}},true);
// after taps: redraw the timeline (and the panel when a new sound joined), a few times a second at most
function quickTick(){if(!QK.dirtyDraw&&!QK.needPanel)return;const now=performance.now();if(now-(QK.lastDraw||0)<150)return;QK.lastDraw=now;
 if(QK.dirtyDraw){QK.dirtyDraw=false;renderTimeline();}if(QK.needPanel&&PANEL.tab==='quick'){QK.needPanel=false;renderPanel();}else QK.needPanel=false;}
function qRepeatAll(){qFinishLayer();const end=Math.max(songEnd(),P.loop.b);let n=0;commit();
 P.tracks.filter(t=>t.quick).forEach(t=>t.clips.forEach(c=>{if(!c.notes.length)return;const st=c.start-Math.floor(c.start/c.plen)*c.plen;c.start=st;c.len=Math.max(c.plen,end-st);n++;}));
 renderTimeline();toast(n?'Your Quick layers now play through the whole song':'Tap something first');}
