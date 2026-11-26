// ===== Groove Studio app: top bar, keyboard, files, autosave, drag and drop =====
'use strict';
const NATIVE=window.native||null;
let FRAMES=0;   // Electron bridge (preload.js); the browser build falls back to downloads
let TOAST_T=0;
function toast(msg,bad){const t=$('#toast');t.textContent=msg;t.className='show'+(bad?' bad':'');clearTimeout(TOAST_T);TOAST_T=setTimeout(()=>t.className='',2600);}
function menu(x,y,items){const m=$('#ctx');m.innerHTML='';items.forEach(it=>{if(!it){m.appendChild(el('hr'));return;}const d=el('div','',esc(it[0])+(it[2]?`<span>${esc(it[2])}</span>`:''));d.onmousedown=e=>{e.stopPropagation();};d.onclick=()=>{hideMenu();it[1]();};m.appendChild(d);});
 m.style.display='block';const r=m.getBoundingClientRect();m.style.left=Math.min(x,innerWidth-r.width-6)+'px';m.style.top=Math.min(y,innerHeight-r.height-6)+'px';}
function hideMenu(){$('#ctx').style.display='none';}
addEventListener('mousedown',e=>{if(!e.target.closest('#ctx'))hideMenu();});
// small inline text prompt (window.prompt is not available in Electron)
function prompt2(label,val,ok){const m=$('#ctx');m.innerHTML=`<div style="cursor:default;flex-direction:column;align-items:stretch;gap:6px"><b>${esc(label)}</b><input type="text" value="${esc(val)}"></div>`;
 m.style.display='block';m.style.left=(innerWidth/2-110)+'px';m.style.top='120px';const i=m.querySelector('input');i.focus();i.select();
 i.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter'){hideMenu();ok(i.value.trim());}else if(e.key==='Escape')hideMenu();};}
function pickFile(accept,cb){const i=document.createElement('input');i.type='file';i.accept=accept;i.style.display='none';i.onchange=()=>{const f=i.files[0];i.remove();if(f)cb(f);};document.body.appendChild(i);i.click();}
function download(name,data,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);}
const safeName=n=>String(n||'song').replace(/[^A-Za-z0-9 _-]+/g,'').trim().replace(/\s+/g,'_')||'song';
let FILE_PATH=null;

// ---------- top bar ----------
function syncTop(){$('#songName').value=P.name;$('#bpm').value=P.bpm;$('#keySel').value=P.key;$('#scaleSel').value=P.scale;$('#swing').value=P.swing;
 $('#tLoop').classList.toggle('on',P.loop.on);$('#tMetro').classList.toggle('on',P.metro);$('#tCount').classList.toggle('on',P.countIn);
 $('#bPlay').textContent=T.playing?'■':'▶';$('#bRec').classList.toggle('on',!!T.rec);$('#snapSel').value=UI.snap;document.title=(DIRTY?'• ':'')+P.name+' — Groove Studio';}
function refreshAll(){updateMix();syncTop();renderTimeline();renderPanel();}
function initTop(){NOTE_NAMES.forEach((n,i)=>{const o=el('option','',n);o.value=i;$('#keySel').appendChild(o);});SCALES.forEach((s,i)=>{const o=el('option','',s.n);o.value=i;$('#scaleSel').appendChild(o);});
 $('#songName').onchange=e=>{commit();P.name=e.target.value.slice(0,40)||'Untitled Song';syncTop();};
 $('#songName').onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')e.target.blur();};
 const bpm=$('#bpm');bpm.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')bpm.blur();};
 bpm.onchange=()=>setBpm(+bpm.value);
 $('.bpm').addEventListener('mousedown',e=>{if(e.target===bpm&&document.activeElement===bpm)return;e.preventDefault();const y0=e.clientY,b0=P.bpm;let moved=false;
  const mv=ev=>{const nb=Math.round(b0+(y0-ev.clientY)/2);if(nb!==P.bpm){if(!moved)commit();moved=true;P.bpm=Math.max(40,Math.min(240,nb));bpm.value=P.bpm;}};
  const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up);if(moved)setBpm(P.bpm,true);else{bpm.focus();bpm.select();}};addEventListener('mousemove',mv);addEventListener('mouseup',up);});
 $('.bpm').addEventListener('wheel',e=>{e.preventDefault();setBpm(P.bpm+(e.deltaY<0?1:-1));},{passive:false});
 $('#keySel').onchange=e=>{commit();P.key=+e.target.value;renderPanel();};$('#scaleSel').onchange=e=>{commit();P.scale=+e.target.value;renderPanel();};
 $('#swing').onpointerdown=()=>commit();$('#swing').oninput=e=>{P.swing=+e.target.value;};
 $('#bPlay').onclick=()=>togglePlay();$('#bStart').onclick=()=>{seek(P.loop.on&&T.head>P.loop.a?P.loop.a:0);};
 $('#bRec').onclick=()=>recordButton();
 $('#tLoop').onclick=()=>{commit();P.loop.on=!P.loop.on;if(P.loop.b<=P.loop.a)P.loop={on:true,a:0,b:16};renderTimeline();syncTop();};
 $('#tMetro').onclick=()=>{P.metro=!P.metro;syncTop();};$('#tCount').onclick=()=>{P.countIn=!P.countIn;syncTop();};
 $('#snapSel').onchange=e=>{UI.snap=+e.target.value;};
 $('#bUndo').onclick=doUndo;$('#bRedo').onclick=doRedo;$('#bFile').onclick=e=>{const r=e.target.getBoundingClientRect();fileMenu(r.left,r.bottom+4);};
 $('#zIn').onclick=()=>zoom(1.25);$('#zOut').onclick=()=>zoom(.8);
 document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{commit();const t=newTrack(b.dataset.add);if(t.type==='audio')P.tracks.forEach(x=>{if(x.type==='audio')x.arm=false;});P.tracks.push(t);updateMix();select(t.id,null);});}
function setBpm(v,noCommit){v=Math.max(40,Math.min(240,Math.round(v)||100));if(!noCommit&&v!==P.bpm)commit();const was=T.playing&&!T.rec;if(was)stop(true);P.bpm=v;updateMix();syncTop();renderTimeline();if(was)play(T.head);}
function zoom(f){const W=$('#lanesWrap'),h=T.head;UI.ppb=Math.max(4,Math.min(120,UI.ppb*f));renderTimeline();W.scrollLeft=Math.max(0,h*UI.ppb-W.clientWidth/3);}
async function togglePlay(){if(T.playing){stop();}else await play();syncTop();}
function recordButton(){if(T.rec){stop();syncTop();return;}let tr=selTrack();
 if(!tr||tr.type==='audio'){tr=P.tracks.find(t=>t.type==='audio'&&t.arm)||(tr&&tr.type==='audio'?tr:null)||P.tracks.find(t=>t.type==='audio');
  if(!tr){commit();tr=newTrack('audio','Vocals');P.tracks.push(tr);}}
 select(tr.id,UI.sel.clip);startRecord(tr).then(()=>{syncTop();renderTimeline();renderPanel();});}
function doUndo(){if(undo()){if(T.rec)return;refreshAll();toast('Undo');}}
function doRedo(){if(redo()){refreshAll();toast('Redo');}}
T.listeners.push(e=>{syncTop();if(e==='edit'||e==='stop'){renderTimeline();if(e==='edit'&&EDIT)EDIT.draw();else renderPanel();}if(e==='rec'){renderTimeline();renderPanel();}});

// ---------- file menu ----------
function fileMenu(x,y){menu(x,y,[
 ['New song',newSong,'⌘N'],['Open…',openSong,'⌘O'],['Save',()=>saveSong(false),'⌘S'],['Save as…',()=>saveSong(true),'⇧⌘S'],null,
 ['Import audio onto a Voice track…',()=>{let tr=selTrack();if(!tr||tr.type!=='audio')tr=P.tracks.find(t=>t.type==='audio');if(!tr){commit();tr=newTrack('audio');P.tracks.push(tr);}pickFile('audio/*',f=>importToTrack(tr,f,T.head));}],
 ['Import Agent Coco song (file)…',()=>pickFile('.json,.txt,.cocosong,application/json,text/plain',async f=>importCoco(await f.text()))],
 ['Import Agent Coco song code (clipboard)',async()=>{try{importCoco(await navigator.clipboard.readText());}catch(e){toast('Copy a COCO1: code first, then try again',true);}}],null,
 ['Export song as WAV',()=>exportWav(false),'⌘E'],['Export the loop as WAV',()=>exportWav(true)]]);}
function importCoco(text){const S=parseCocoSong(text);if(!S){toast('That is not an Agent Coco song or COCO1 code',true);return;}stop();commit();const keepU=HIST.u.slice();importCocoSong(S);HIST.u=keepU;
 UI.sel={track:P.tracks[0].id,clip:null,sec:null};T.head=0;FILE_PATH=null;refreshAll();toast('Imported "'+P.name+'" from Agent Coco: beat, bass, chords and lead');}
async function confirmLose(){if(!DIRTY)return true;if(NATIVE)return NATIVE.confirm('Your changes to "'+P.name+'" are not saved. Continue anyway?');return confirm('Your changes are not saved. Continue anyway?');}
async function newSong(){if(!await confirmLose())return;stop();newProject();HIST.u=[];HIST.r=[];DIRTY=false;FILE_PATH=null;UI.sel={track:P.tracks[0].id,clip:P.tracks[0].clips[0].id,sec:null};T.head=0;BUFC.clear();refreshAll();}
async function openSong(){if(!await confirmLose())return;
 const load=(text,path)=>{try{stop();if(/COCO1:|"bass"/.test(text)&&!/groove-studio/.test(text.slice(0,200))){importCoco(text);return;}deserialize(text);BUFC.clear();FILE_PATH=path||null;UI.sel={track:P.tracks[0]&&P.tracks[0].id,clip:null,sec:null};T.head=0;refreshAll();toast('Opened '+P.name);}catch(e){toast('Could not open that file',true);}};
 if(NATIVE){const r=await NATIVE.openFile();if(r)load(r.text,r.path);}else pickFile('.groovestudio,.json',async f=>load(await f.text()));}
async function saveSong(as){const data=serialize(),name=safeName(P.name)+'.groovestudio';
 if(NATIVE){const p=await NATIVE.saveFile({path:as?null:FILE_PATH,name,data,kind:'song'});if(!p)return;FILE_PATH=p;}else download(name,data,'application/json');
 DIRTY=false;syncTop();toast('Saved '+name);}
async function exportWav(loop){const a=loop&&P.loop.on?P.loop.a:0,b=loop&&P.loop.on?P.loop.b:Math.max(4,Math.ceil(songEnd()/4)*4);if(b<=a){toast('Nothing to export yet',true);return;}
 toast('Rendering…');const bytes=await renderWav([a,b]),name=safeName(P.name)+(loop?'_loop':'')+'.wav';
 if(NATIVE){const p=await NATIVE.saveFile({name,data:bytes,kind:'wav'});if(p)toast('Exported '+name);}else{download(name,bytes,'audio/wav');toast('Exported '+name);}}

// ---------- keyboard ----------
const DOWN={};
addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input[type=text],input[type=number],#songName'))return;
 const k=e.key.toLowerCase(),mod=e.metaKey||e.ctrlKey;
 if(mod){const map={z:e.shiftKey?doRedo:doUndo,y:doRedo,s:()=>saveSong(e.shiftKey),o:openSong,n:newSong,e:()=>exportWav(false),r:recordButton,l:()=>$('#tLoop').click(),k:()=>$('#tMetro').click(),
   d:()=>{const r=clipById(UI.sel.clip);if(r)dupClip(r.t,r.c);},b:()=>{const r=clipById(UI.sel.clip);if(r)splitClip(r.t,r.c,T.playing?headNow():T.head);},'=':()=>zoom(1.25),'-':()=>zoom(.8)};
  if(map[k]){e.preventDefault();map[k]();}return;}
 if(k===' '){e.preventDefault();togglePlay();return;}
 if(k==='enter'){e.preventDefault();$('#bStart').click();return;}
 if(k==='backspace'||k==='delete'){const r=clipById(UI.sel.clip);if(r){e.preventDefault();delClip(r.t,r.c);}return;}
 if(k==='escape'){hideMenu();return;}
 if(e.repeat||DOWN[e.code])return;const tr=selTrack();if(!tr)return;
 if(tr.type==='drums'){const p=PAD_KEYS.indexOf(k);if(p>=0){DOWN[e.code]=1;ensureAudio().then(()=>{livePad(tr,p,e.shiftKey?.5:1);flashPad(p);});}}
 else if(tr.type==='synth'){if(k==='z'){PANEL.oct=Math.max(1,PANEL.oct-1);renderPanel();return;}if(k==='x'){PANEL.oct=Math.min(7,PANEL.oct+1);renderPanel();return;}
  const i=PIANO_KEYS.indexOf(k);if(i>=0){const m=PANEL.oct*12+12+i;DOWN[e.code]=m;ensureAudio().then(()=>{liveKeyDown(tr,m);document.querySelectorAll(`.keys [data-m="${m}"]`).forEach(x=>x.classList.add('down'));});}}});
addEventListener('keyup',e=>{const m=DOWN[e.code];delete DOWN[e.code];const tr=selTrack();if(tr&&tr.type==='synth'&&typeof m==='number'){liveKeyUp(tr,m);document.querySelectorAll(`.keys [data-m="${m}"]`).forEach(x=>x.classList.remove('down'));}});
addEventListener('blur',()=>{for(const c in DOWN)delete DOWN[c];});

// ---------- drag and drop audio files onto lanes / the window ----------
let DRAG_N=0;
addEventListener('dragenter',e=>{if(e.dataTransfer.types.includes('Files')){DRAG_N++;$('#drop').classList.add('show');}});
addEventListener('dragleave',()=>{if(--DRAG_N<=0){DRAG_N=0;$('#drop').classList.remove('show');}});
addEventListener('dragover',e=>e.preventDefault());
addEventListener('drop',async e=>{e.preventDefault();DRAG_N=0;$('#drop').classList.remove('show');const f=e.dataTransfer.files[0];if(!f)return;
 if(/\.(groovestudio|json|txt|cocosong)$/i.test(f.name)){const t=await f.text();if(/groove-studio/.test(t.slice(0,200))){if(await confirmLose()){deserialize(t);BUFC.clear();refreshAll();}}else importCoco(t);return;}
 const lane=document.elementsFromPoint(e.clientX,e.clientY).find(x=>x.classList&&x.classList.contains('lane'));let tr=lane&&trackById(lane.dataset.id);
 const at=lane?Math.floor(beatAtX(e.clientX)):T.head;if(!tr||tr.type!=='audio'){commit();tr=newTrack('audio',f.name.replace(/\.[^.]+$/,'').slice(0,20));P.tracks.push(tr);updateMix();}
 importToTrack(tr,f,at);});

// ---------- splitter between the timeline and the tool panel ----------
function initSplit(){const s=$('#split');s.onmousedown=e=>{const y0=e.clientY,h0=$('#panel').offsetHeight;
 const mv=ev=>{const h=Math.max(180,Math.min(innerHeight-200,h0+(y0-ev.clientY)));document.documentElement.style.setProperty('--panelh',h+'px');};
 const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up);renderPanel();};addEventListener('mousemove',mv);addEventListener('mouseup',up);};}
// keep the track headers scrolled with the lanes
function initScroll(){const W=$('#lanesWrap'),H=$('#headList');W.addEventListener('scroll',()=>{H.scrollTop=W.scrollTop;});
 W.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(e.deltaY<0?1.12:.9);}},{passive:false});
 H.addEventListener('wheel',e=>{W.scrollTop+=e.deltaY;},{passive:true});}

// ---------- every frame: playhead, meters, live editor ----------
function frame(){drawHead();runLights();quickTick();if(!(FRAMES=(FRAMES+1)%15))renderNow();if(MIX){const m=$('#master'),g=m.getContext('2d'),lv=Math.min(1,meterLevel(MIX.an));g.clearRect(0,0,14,36);g.fillStyle=lv>.95?'#ff4d5e':'#6bcb77';g.fillRect(2,36-lv*36,10,lv*36);
  document.querySelectorAll('.th').forEach(h=>{const s=MIX.strips[h.dataset.id];const i=h.querySelector('.meter i');if(i)i.style.height=Math.min(100,(s?meterLevel(s.an):0)*100)+'%';});}
 const vu=$('#micVu');if(vu&&MIC){vu.style.width=Math.min(100,MIC.lvl*100)+'%';MIC.lvl*=.92;}
 if(T.playing&&EDIT)EDIT.draw();requestAnimationFrame(frame);}

// ---------- autosave (so a crash or quit never loses a song) ----------
const DB={open(){return new Promise((ok,no)=>{const r=indexedDB.open('groove-studio',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error);});},
 async put(k,v){const d=await this.open();return new Promise(ok=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>ok();t.onerror=()=>ok();});},
 async get(k){const d=await this.open();return new Promise(ok=>{const r=d.transaction('kv').objectStore('kv').get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>ok(null);});}};
let LAST_AUTO='';
async function autosave(){try{if(T.rec)return;const s=serialize();if(s===LAST_AUTO)return;LAST_AUTO=s;await DB.put('autosave',{s,path:FILE_PATH,dirty:DIRTY});}catch(e){}}

async function boot(){newProject();
 try{const a=await DB.get('autosave');if(a&&a.s){deserialize(a.s);FILE_PATH=a.path||null;DIRTY=!!a.dirty;LAST_AUTO=a.s;}}catch(e){newProject();}
 UI.sel.track=P.tracks[0]&&P.tracks[0].id;initTop();initRuler();initSections();initSplit();initScroll();refreshAll();requestAnimationFrame(frame);
 setInterval(autosave,8000);addEventListener('beforeunload',()=>{autosave();});
 if(NATIVE){NATIVE.onMenu(cmd=>({new:newSong,open:openSong,save:()=>saveSong(false),saveAs:()=>saveSong(true),export:()=>exportWav(false),exportLoop:()=>exportWav(true),undo:doUndo,redo:doRedo,record:recordButton,
   importCoco:()=>pickFile('.json,.txt,.cocosong',async f=>importCoco(await f.text())),
   saveThenQuit:async()=>{await saveSong(false);await autosave();if(!DIRTY)NATIVE.quitNow();}})[cmd]?.());
  NATIVE.openWith(async o=>{if(!await confirmLose())return;try{stop();if(/groove-studio/.test(o.text.slice(0,200))){deserialize(o.text);BUFC.clear();FILE_PATH=o.path;T.head=0;UI.sel={track:P.tracks[0]&&P.tracks[0].id,clip:null,sec:null};refreshAll();}else importCoco(o.text);}catch(e){toast('Could not open that file',true);}});
  NATIVE.onQuit(async()=>{await autosave();return DIRTY;});}
 // first click anywhere unlocks audio (browsers need a gesture)
 addEventListener('pointerdown',()=>ensureAudio(),{once:true});}
boot();
