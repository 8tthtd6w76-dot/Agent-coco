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

// ---------- Jam ----------
// Drums are always ready on keys 1-0. The mini keyboard (A to ' plus W E T Y U O P) plays the sound you pick. Each sound is an FM-1 synth.
// While the song plays, everything you play snaps to the beat and joins the loop. Each time around the loop is one layer (Undo takes it out).
const QDRUMS=[
 {id:'kick',n:'Kick',e:'🥁',kind:'pad',p:0},{id:'snare',n:'Snare',e:'🪘',kind:'pad',p:1},{id:'clap',n:'Clap',e:'👏',kind:'pad',p:2},
 {id:'hat',n:'Hi-Hat',e:'✨',kind:'pad',p:3},{id:'ohat',n:'Open Hat',e:'💫',kind:'pad',p:4},{id:'shaker',n:'Shaker',e:'🧂',kind:'pad',p:10},
 {id:'cowbell',n:'Cowbell',e:'🔔',kind:'pad',p:9},{id:'conga',n:'Conga',e:'🪇',kind:'pad',p:11},{id:'snap',n:'Snap',e:'🫰',kind:'pad',p:13},{id:'tom',n:'Tom',e:'🛢️',kind:'pad',p:7}];
QDRUMS.forEach((d,i)=>d.key='1234567890'[i]);
const QSOUNDS=[
 {id:'bass',n:'Bass',e:'🎸',kind:'keys',preset:3,oct:2,col:'#ff922b'},{id:'keys',n:'Piano',e:'🎹',kind:'keys',preset:1,oct:4,col:'#4dabf7'},
 {id:'bell',n:'Bells',e:'🛎️',kind:'keys',preset:2,oct:5,col:'#ffe066'},{id:'pluck',n:'Pluck',e:'🪕',kind:'keys',preset:7,oct:4,col:'#63e6be'},
 {id:'lead',n:'Lead',e:'🎺',kind:'keys',preset:0,oct:4,col:'#e599f7'},{id:'organ',n:'Organ',e:'⛪',kind:'keys',preset:5,oct:3,col:'#ff8787'},
 {id:'pad',n:'Dream Pad',e:'🌙',kind:'keys',preset:9,oct:4,col:'#9775fa'},{id:'voice',n:'Voice',e:'🎤',kind:'voice',col:'#ffd93d'}];
const QUICK_INST=[...QDRUMS,...QSOUNDS];
// computer keys of the mini keyboard: semitones above the C on the left
const QPIANO={a:0,w:1,s:2,e:3,d:4,f:5,t:6,g:7,y:8,h:9,u:10,j:11,k:12,o:13,l:14,p:15,';':16,"'":17};
const QK={snap:2,inst:'keys',layers:[],tapT:[],armedSnap:null,armed:new Set(),held:{},oct:{},inKey:true,help:false,keyDown:{}};
const qInst=()=>QSOUNDS.find(q=>q.id===QK.inst)||QSOUNDS[1];
const qSound=()=>{const q=qInst();return q.kind==='voice'?(QSOUNDS.find(x=>x.id===QK.lastKeys)||QSOUNDS[1]):q;};   // what a MIDI keyboard plays while Voice is picked
function qColor(q){return q.kind==='pad'?PAD_COLORS[q.p]:q.col;}
function qOct(q){return Math.max(1,Math.min(6,(q.oct||4)+(QK.oct[q.id]||0)));}
function qVoiceTrack(){return P.tracks.filter(t=>t.quick==='voice').slice(-1)[0]||null;}
// the track a Jam sound plays on (made on first use)
function qTrack(q,make){if(q.kind==='pad'){let t=P.tracks.find(t=>t.quick==='beat');if(!t&&make){t=newTrack('drums','Jam Beat');t.quick='beat';t.color='#ff5d5d';P.tracks.push(t);updateMix();QK.needPanel=true;}return t;}
 let t=P.tracks.find(t=>t.quick===q.id);if(!t&&make){t=newTrack('synth','Jam '+q.n);t.quick=q.id;t.color=q.col;t.patch=fm1Patch(q.preset);P.tracks.push(t);updateMix();QK.needPanel=true;}return t;}
// the note a mini-keyboard key plays. With the in-key helper on, a key outside the song's scale slides to the nearest scale note.
function qNoteFor(q,semi){const m=12*(qOct(q)+1)+semi;if(!QK.inKey||inScale(m))return m;for(const d of [-1,1,-2,2])if(inScale(m+d))return m+d;return m;}
function qEnsureLoop(){if(!P.loop.on||P.loop.b<=P.loop.a){const a=Math.floor(T.head/4)*4,end=songEnd();P.loop={on:true,a:end>a?a:0,b:(end>a?a:0)+Math.max(8,Math.min(16,Math.ceil((end-(end>a?a:0))/4)*4||8))};renderTimeline();syncTop();}}
async function qPlay(){if(T.playing){stop();syncTop();renderPanel();return;}qEnsureLoop();await play(P.loop.a);syncTop();renderPanel();}
// a hit: hear it now, and (while playing) write it into the loop, snapped to the beat
function qTap(q,m,vel=1){ensureAudio().then(()=>{
  if(T.playing&&!QK.armedSnap)QK.armedSnap=JSON.stringify(P);
  const tr=qTrack(q,true);if(!tr)return;
  if(q.kind==='pad')livePad(tr,q.p,vel);else liveKeyDown(tr,m,.9*vel);
  if(!T.playing){qFreeTap(q,m,vel);return;}
  QK.armed.add(q.n);if(typeof buddyHearTap==='function')buddyHearTap(q,m,headNow(),vel);
  const late=((AC.outputLatency||0)+(AC.baseLatency||0))*P.bpm/60;let b=headNow()-late;
  if(loopOn()&&b<P.loop.a)b+=P.loop.b-P.loop.a;const g=QK.snap;b=Math.round(b*g)/g;if(loopOn()&&b>=P.loop.b)b=P.loop.a;
  let c=tr.clips.find(c=>b>=c.start&&b<c.start+c.len);
  if(!c){c=newClip(tr.type,P.loop.a,P.loop.b-P.loop.a,P.loop.b-P.loop.a);c.name='Jam';tr.clips.push(c);}
  const t=((b-c.start)%c.plen+c.plen)%c.plen;
  if(q.kind==='pad'){if(!c.notes.some(n=>n.p===q.p))QK.needPanel=true;if(!c.notes.some(n=>n.p===q.p&&Math.abs(n.t-t)<.01))c.notes.push({t,p:q.p,v:vel});}
  else{if(!c.notes.length)QK.needPanel=true;const n={t,d:.5,m,v:.85*vel};c.notes=c.notes.filter(x=>!(x.m===m&&Math.abs(x.t-t)<.01));c.notes.push(n);QK.held[q.id+':'+m]={n,b:headNow()};}
  c.notes.sort((x,y)=>x.t-y.t);DIRTY=true;QK.dirtyDraw=true;});}
function qRelease(q,m){const tr=qTrack(q,false);if(tr)liveKeyUp(tr,m);
 if(QK.free){const tp=[...QK.free.taps].reverse().find(x=>x.q===q&&x.m===m&&x.up==null);if(tp)tp.up=performance.now()/1000;}
 const k=q.id+':'+m,H=QK.held[k];delete QK.held[k];
 if(H&&T.playing){let d=headNow()-H.b;if(d<0)d+=P.loop.b-P.loop.a;H.n.d=Math.max(1/QK.snap,Math.round(d*QK.snap)/QK.snap);}}
// a layer = everything played during one time around the loop; it is saved for "Undo last layer"
function qFinishLayer(){if(QK.armedSnap){HIST.u.push(QK.armedSnap);HIST.r=[];QK.layers.push({snap:QK.armedSnap,name:[...QK.armed].join(' + ')||'Jam'});QK.armedSnap=null;QK.armed.clear();}}
function qPick(id){qFinishLayer();QK.inst=id;const q=qInst();if(q.kind==='keys')QK.lastKeys=id;renderPanel();}
function qUndoLayer(){qFinishLayer();const L=QK.layers.pop();if(!L){toast('No layers to undo yet');return;}P=JSON.parse(L.snap);HIST.u.push(JSON.stringify(P));updateMix();renderTimeline();renderPanel();toast('Removed the '+L.name+' layer');}
function qClearInst(){const q=qInst(),tr=q.kind==='voice'?qVoiceTrack():qTrack(q,false);if(!tr){toast(q.n+' has nothing yet');return;}qFinishLayer();commit();
 if(q.kind==='voice'){P.tracks=P.tracks.filter(t=>t!==tr);updateMix();}else tr.clips.forEach(c=>{if(c.start<P.loop.b&&c.start+c.len>P.loop.a)c.notes=[];});renderTimeline();renderPanel();toast('Cleared '+(q.kind==='voice'?tr.name:q.n));}
function qClearDrums(){const tr=P.tracks.find(t=>t.quick==='beat');if(!tr){toast('No Jam drums yet');return;}qFinishLayer();commit();tr.clips.forEach(c=>{if(c.start<P.loop.b&&c.start+c.len>P.loop.a)c.notes=[];});renderTimeline();renderPanel();toast('Cleared the Jam drums');}
function qOctShift(q,d){const o=qOct(q);QK.oct[q.id]=(QK.oct[q.id]||0)+(Math.max(1,Math.min(6,o+d))-o);renderPanel();}
// tap tempo: 4+ taps set the BPM
function qTapTempo(){const now=performance.now();QK.tapT=QK.tapT.filter(t=>now-t<2500);QK.tapT.push(now);const n=QK.tapT.length;
 if(n>=4){const iv=(QK.tapT[n-1]-QK.tapT[0])/(n-1),bpm=Math.round(60000/iv);if(bpm>=50&&bpm<=200){setBpm(bpm);toast('Tempo: '+bpm+' BPM');}}else toast('Keep tapping… '+(4-n)+' more');}

// ---------- the Jam panel ----------
function qPadBtn(d){const tr=qTrack(d,false),b=el('button','qtile qpad',`<span class="em">${d.e}</span><span>${d.n}</span><kbd>${d.key}</kbd>`);
 b.style.setProperty('--c',PAD_COLORS[d.p]);b.dataset.key=d.key;b.dataset.p=d.p;if(tr)b.dataset.tr=tr.id;b.title=d.n+': click or press '+d.key;
 b.onpointerdown=e=>{e.preventDefault();qTap(d,0,e.shiftKey?.5:1);glow(b,PAD_COLORS[d.p],true);};return b;}
function qPiano(q){const col=qColor(q),wrap=el('div','qkeys qpiano');wrap.style.setProperty('--c',col);const base=12*(qOct(q)+1);
 const W=['a','s','d','f','g','h','j','k','l',';',"'"],WS=[0,2,4,5,7,9,11,12,14,16,17],B={1:'w',3:'e',6:'t',8:'y',10:'u',13:'o',15:'p'};
 const bind=(e,s)=>{e.onpointerdown=ev=>{ev.preventDefault();ev.stopPropagation();const m=qNoteFor(q,s);qTap(q,m);e.classList.add('down');glow(e,col,true);
   const up=()=>{qRelease(q,m);e.classList.remove('down');removeEventListener('pointerup',up);};addEventListener('pointerup',up);};};
 const cls=m=>inScale(m)?' ink':QK.inKey?' out':'';
 W.forEach((k,i)=>{const s=WS[i],m=base+s,w=el('div','pw'+cls(m)+(m%12===P.key?' root':''),`<span class="nn">${NOTE_NAMES[m%12]}${m%12===0?Math.floor(m/12)-1:''}</span><kbd>${k.toUpperCase()}</kbd>`);
  w.dataset.s=s;w.dataset.pc=m%12;bind(w,s);wrap.appendChild(w);
  if(B[s+1]){const bm=m+1,b=el('div','pbk'+cls(bm),`<kbd>${B[s+1].toUpperCase()}</kbd>`);b.dataset.s=s+1;b.dataset.pc=bm%12;bind(b,s+1);w.appendChild(b);}});
 return wrap;}
// FM-1 controls for the picked sound: preset, new tone, 4 knobs (a MIDI keyboard's knobs can turn them too)
const QKNOBS=[['tone','Brightness',0,1,.01,P=>P.tone,(P,v)=>P.tone=v],['mod','Bite',0,2,.01,P=>P.mod,(P,v)=>P.mod=v],['wob','Wobble',0,1,.01,P=>P.lfo[2],(P,v)=>P.lfo[2]=v],
 ['echo','Echo',0,.8,.01,P=>P.fx[1],(P,v)=>P.fx[1]=v],['rel','Release',.02,2,.01,P=>P.env[3],(P,v)=>P.env[3]=v],['vib','Vibrato',0,1,.01,P=>P.lfo[1],(P,v)=>P.lfo[1]=v]];
function qFmRow(q){const row=el('div','qfm');const tr=qTrack(q,false),Pt=tr?tr.patch:fm1Patch(q.preset);
 const need=()=>qTrack(q,true);
 row.append(el('span','fmtag','FM-1'),sel(FM_PRESETS.map(p=>p.n),Pt.p|0,v=>{commit();const t=need(),vol=t.patch.vol;t.patch=fm1Patch(v);t.patch.vol=vol;renderPanel();toast(q.n+' now uses the FM-1 '+FM_PRESETS[v].n+' sound');},'Pick any FM-1 sound for '+q.n),
  btn('🎲',()=>{commit();mutatePatch(need().patch);renderPanel();toast('New tone variation');},'A new tone close to this one'));
 QKNOBS.slice(0,4).forEach(([id,n,a,b,st,get,set])=>{const k=slider(n+(MIDI.map&&Object.keys(MIDI.map).find(c=>MIDI.map[c]===id)?' 🎛':''),a,b,st,()=>get(Pt),v=>set(need().patch,v),v=>Math.round((v-a)/(b-a)*100));k.classList.add('qknob');row.append(k);});
 row.append(btn('Full FM-1 ›',()=>{const t=need();qFinishLayer();PANEL.tab='track';$('#bJam').classList.remove('on');select(t.id,null);},'Open every FM-1 control for this sound'));
 return row;}
function qHelpBox(){const b=el('div','qhelp',`<button class="x" title="Close">✕</button><h4>How to jam</h4>
 <ol><li><b>Drums:</b> keys <kbd>1</kbd>–<kbd>0</kbd>, or click the pads.</li>
 <li><b>Notes:</b> pick a sound, then play the mini keyboard with <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd>… (black keys <kbd>W</kbd> <kbd>E</kbd> <kbd>T</kbd> <kbd>Y</kbd> <kbd>U</kbd>). <kbd>Z</kbd>/<kbd>X</kbd> = octave down/up. Colored keys fit the song.</li>
 <li><b>Make a loop:</b> press <b>▶ Play</b> and play along. Everything snaps to the beat. Or play while stopped, then pause 2 seconds: Groove Studio finds your tempo and loops it.</li>
 <li><b>Layers:</b> every time around the loop is one layer. <b>Undo last layer</b> takes it out.</li>
 <li><b>🎧 Smart Guide:</b> play music near your Mac. It hears the tempo and key, can match your song to it, keep your loop locked to its beat, and lights up the keys to try.</li>
 <li><b>🤖 Jam Buddy:</b> pick a mode and press Start. It adds its own parts a little at a time. Play a riff, leave a gap, and it answers with a cover of it.</li>
 <li><b>🎹 MIDI:</b> plug in a MIDI keyboard (like an M-VAVE). Its keys play the picked sound, its pads play drums, its knobs turn the FM-1 knobs.</li></ol>
 <div class="hint">Press <kbd>?</kbd> any time to show or hide this.</div>`);b.querySelector('.x').onclick=()=>{QK.help=false;renderPanel();};return b;}
function quickPanel(Pn){const q=qInst(),col=qColor(q);
 if(QK.help==null||QK.helpAuto==null){QK.helpAuto=1;try{if(!localStorage.getItem('gs-jamhelp')){QK.help=true;localStorage.setItem('gs-jamhelp','1');}}catch(e){}}
 const h=el('div','ph');h.appendChild(panelTabs());const st=el('span','hint qstatus',T.playing?'Play along! Everything snaps to the beat and joins the loop.':'Just play! Hit some drums or keys. Pause 2 seconds and it becomes a loop.');st.id='qstatus';h.appendChild(st);
 const hr=el('div','qhead');
 const gb=btn(GUIDE.on?'🎧 Smart Guide: on':'🎧 Smart Guide',()=>GUIDE.on?guideOff():guideOn(),'Listens to music in the room through your mic and helps you play along','qguideb'+(GUIDE.on?' on':''));
 const mb=btn(MIDI.names.length?'🎹 '+MIDI.names[0]:'🎹 MIDI',()=>midiMenu(mb),MIDI.names.length?'MIDI keyboard connected':'Connect a MIDI keyboard','qmidib'+(MIDI.names.length?' on':''));
 const bb=btn(BUDDY.on?'🤖 Buddy: on':'🤖 Jam Buddy',()=>{BUDDY.show=!BUDDY.show||BUDDY.on;renderPanel();},'A band mate that listens to you and plays along','qbuddyb'+(BUDDY.on||BUDDY.show?' on':''));
 hr.append(bb,gb,mb,btn('💾 Save & share ▾',e=>{const r=e.currentTarget.getBoundingClientRect();qShareMenu(r.left,r.bottom+4);},'Save your jam, take it to Agent Coco or your phone, or add a sound file'),btn('?',()=>{QK.help=!QK.help;renderPanel();},'How to jam (?)','qhelpb'+(QK.help?' on':'')));
 h.appendChild(hr);Pn.appendChild(h);
 const outer=el('div','pb quick');Pn.appendChild(outer);
 if(BUDDY.show||BUDDY.on)outer.appendChild(buddyStrip());
 if(GUIDE.on)outer.appendChild(guideStrip());
 const body=el('div','qbody');outer.appendChild(body);
 // drums
 const L=el('div','col qdcol');const dh=el('div','row');dh.append(el('h4','','🥁 Drums'),el('span','hint','keys 1–0'));L.append(dh);
 const g=el('div','qgrid qdrums');QDRUMS.forEach(d=>g.appendChild(qPadBtn(d)));L.append(g);
 const sn=el('div','row');sn.append(el('span','hint','Snap to:'));const sg=el('div','qsnap');
 [[4,'1/16'],[2,'1/8'],[1,'Beat']].forEach(([v,n])=>{sg.appendChild(btn(n,()=>{QK.snap=v;renderPanel();},['','Simple: hits land on the beat','Normal: hits land on 8th notes','','Tight: hits land on 16th notes'][v],QK.snap===v?'on':''));});sn.append(sg);L.append(sn);
 body.appendChild(L);
 // sounds + keyboard
 const M=el('div','col qmcol');const ch=el('div','qsounds');
 QSOUNDS.forEach(it=>{const tr=it.kind==='voice'?qVoiceTrack():qTrack(it,false),b=el('button','qtile qchip'+(it.id===QK.inst?' on':''),`<span class="em">${it.e}</span><span>${it.n}</span>`);
  b.style.setProperty('--c',qColor(it));if(tr){b.dataset.tr=tr.id;b.dataset.p=-1;}b.onclick=()=>qPick(it.id);ch.appendChild(b);});
 M.append(ch);
 if(q.kind==='voice'){const v=el('div','qvoice');const rb=el('button','qrec'+(QK.vrec?' on':''),QK.vrec?'■ Stop':'🎤 Record a layer');
  rb.onclick=()=>QK.vrec?qVoiceStop(true):qVoiceRecord();
  v.append(rb,el('div','qvinfo',`<div class="vu"><i id="micVu"></i></div><div class="hint">It counts you in, records <b>one time around the loop</b>, then plays it back as a new layer. Press again to stack another (harmonies, ad-libs, beatbox…). Headphones help so the mic doesn't hear the speakers.</div>`));
  const hm=btn(PANEL.mon?'Hear myself: on':'Hear myself: off',async()=>{PANEL.mon=!PANEL.mon;if(PANEL.mon)await micOn().catch(()=>{});micMonitor(PANEL.mon);renderPanel();},'Plays your mic through the speakers. Use headphones.',PANEL.mon?'on':'');
  v.querySelector('.qvinfo').appendChild(hm);M.append(v);}
 else{M.append(qPiano(q));
  const kr=el('div','row qkrow');kr.append(btn('Oct − (Z)',()=>qOctShift(q,-1)),el('span','hint','C'+qOct(q)),btn('Oct + (X)',()=>qOctShift(q,1)),
   btn(QK.inKey?'In-key helper: on':'In-key helper: off',()=>{QK.inKey=!QK.inKey;renderPanel();},'On: keys outside the song\'s key slide to the nearest note that fits, so nothing sounds wrong',QK.inKey?'on':''),
   el('span','hint',NOTE_NAMES[P.key]+' '+SCALES[P.scale].n));
  M.append(kr,qFmRow(q));}
 body.appendChild(M);
 // play + layers
 const R=el('div','col qrcol');const pb=el('button','qplay'+(T.playing?' on':''),T.playing?'■ Stop':'▶ Play');pb.onclick=qPlay;
 R.append(pb,el('div','hint',P.loop.on?`Looping bars ${P.loop.a/4+1}–${P.loop.b/4} · ${P.bpm} BPM`:`Plays a 2–4 bar loop · ${P.bpm} BPM`));
 const lr=el('div','row');lr.append(btn('↶ Undo last layer',qUndoLayer,'Takes out the last time around the loop'),btn('Tap tempo',qTapTempo,'Tap 4 or more times at the speed you want'),btn(QK.lockTempo?'🔒 Tempo locked':'🔓 Lock tempo',()=>{QK.lockTempo=!QK.lockTempo;renderPanel();},'Locked: free play and the buddy never change the tempo','qlockt'+(QK.lockTempo?' on':'')));R.append(lr);
 const cr=el('div','row');cr.append(btn('Clear drums',qClearDrums,'Removes the Jam drums from the loop'),btn('Clear '+q.n,qClearInst,'Removes this sound from the loop'));R.append(cr);
 R.append(btn('Repeat through whole song',qRepeatAll,'Stretches your Jam layers so they play from the start to the end of the song'));
 const live=el('div','qlive');P.tracks.filter(t=>t.quick).forEach(t=>{if(t.type==='drums'){const ps=new Set();t.clips.forEach(c=>c.notes.forEach(n=>ps.add(n.p)));ps.forEach(p=>{const d=el('span','',esc(t.pads[p].name||PAD_NAMES[p]));d.style.setProperty('--c',PAD_COLORS[p]);d.dataset.tr=t.id;d.dataset.p=p;live.appendChild(d);});}
  else if(t.clips.some(c=>t.type==='audio'?c.src:c.notes.length)){const d=el('span','',esc(t.name.replace('Jam ','')));d.style.setProperty('--c',t.color);d.dataset.tr=t.id;d.dataset.p=-1;live.appendChild(d);}});
 R.append(el('div','hint',live.children.length?'In your loop (they light up as they play):':'Your layers will show up here.'),live);
 body.appendChild(R);
 if(QK.help)outer.appendChild(qHelpBox());}
function panelTabs(){const w=el('div','tabs');
 [['track','Track tools'],['quick','⚡ Jam (easy)']].forEach(([k,n])=>{const b=el('button',PANEL.tab===k?'on':'',n);b.onclick=()=>{if(k!=='quick')qFinishLayer();PANEL.tab=k;$('#bJam').classList.toggle('on',k==='quick');renderPanel();};w.appendChild(b);});return w;}
// keyboard while Jam is open: 1-0 drums, A..' and W E T Y U O P the mini keyboard, Z/X octave, ? help
addEventListener('keydown',e=>{if(PANEL.tab!=='quick'||e.metaKey||e.ctrlKey||e.altKey)return;if(e.target.closest&&e.target.closest('input[type=text],input[type=number],#songName,select'))return;
 const k=e.key.toLowerCase();
 if(k==='?'){e.preventDefault();e.stopImmediatePropagation();QK.help=!QK.help;renderPanel();return;}
 const di='1234567890'.indexOf(k),piano=Object.prototype.hasOwnProperty.call(QPIANO,k);
 if(di<0&&!piano&&k!=='z'&&k!=='x')return;e.stopImmediatePropagation();e.preventDefault();if(e.repeat)return;
 if(di>=0){const d=QDRUMS[di];qTap(d,0,e.shiftKey?.5:1);glow(document.querySelector(`.qpad[data-key="${d.key}"]`),PAD_COLORS[d.p],true);return;}
 const q=qInst();if(q.kind==='voice')return;
 if(k==='z'||k==='x'){qOctShift(q,k==='z'?-1:1);return;}
 const s=QPIANO[k],m=qNoteFor(q,s);if(QK.keyDown[e.code])return;QK.keyDown[e.code]={m,q,s};qTap(q,m);
 const kb=document.querySelector(`.qpiano [data-s="${s}"]`);if(kb){kb.classList.add('down');glow(kb,qColor(q),true);}},true);
addEventListener('keyup',e=>{const H=QK.keyDown[e.code];if(!H)return;delete QK.keyDown[e.code];qRelease(H.q,H.m);const kb=document.querySelector(`.qpiano [data-s="${H.s}"]`);if(kb)kb.classList.remove('down');},true);
addEventListener('blur',()=>{for(const c in QK.keyDown){const H=QK.keyDown[c];qRelease(H.q,H.m);}QK.keyDown={};});
// every frame: close a layer each time the loop comes around; redraw a few times a second at most
function quickTick(){
 if(T.playing&&loopOn()){const h=headNow();if(QK.lastH!=null&&h<QK.lastH-.5&&QK.armedSnap&&!Object.keys(QK.held).length)qFinishLayer();QK.lastH=h;}else{QK.lastH=null;if(!T.playing&&QK.armedSnap)qFinishLayer();}
 if(GUIDE.on)guideFrame();
 buddyTick();
 if(!QK.dirtyDraw&&!QK.needPanel)return;const now=performance.now();if(now-(QK.lastDraw||0)<150)return;QK.lastDraw=now;
 if(QK.dirtyDraw){QK.dirtyDraw=false;renderTimeline();}if(QK.needPanel&&PANEL.tab==='quick'&&!document.querySelector('.qpanel-busy')){QK.needPanel=false;renderPanel();}else QK.needPanel=false;}
function qRepeatAll(){qFinishLayer();const end=Math.max(songEnd(),P.loop.b);let n=0;commit();
 P.tracks.filter(t=>t.quick).forEach(t=>t.clips.forEach(c=>{if(t.type==='audio'?!c.src:!c.notes.length)return;const st=c.start-Math.floor(c.start/c.plen)*c.plen;c.start=st;c.len=Math.max(c.plen,end-st);n++;}));
 renderTimeline();toast(n?'Your Jam layers now play through the whole song':'Play something first');}

// ---------- Save & share: jam files, Agent Coco songs (game + phone), sound uploads ----------
function qShareMenu(x,y){menu(x,y,[
 ['Save this jam',()=>saveSong(false),'⌘S'],['Open a jam or song…',openSong,'⌘O'],null,
 ['Copy Agent Coco code (game + phone)',qCopyCoco],['Save as Agent Coco song file…',qSaveCoco],['Open an Agent Coco song or code…',()=>pickFile('.json,.txt,.cocosong,application/json,text/plain',async f=>importCoco(await f.text()))],null,
 ['Upload a sound as a new layer…',()=>pickFile('audio/*',qUploadLayer)],['Export the loop as WAV',()=>exportWav(true)]]);}
async function qCopyCoco(){try{const S=exportCocoSong(),code=cocoCode(S);await navigator.clipboard.writeText(code);toast('Copied! Paste it into Enter Code in the Music Room or the phone Groove Studio');}catch(e){toast('Could not copy the code',true);}}
async function qSaveCoco(){const S=exportCocoSong(),data=JSON.stringify({format:'agent-coco-song',v:1,song:S}),name=safeName(P.name)+'.cocosong.json';
 if(NATIVE){const p=await NATIVE.saveFile({name,data,kind:'coco'});if(p)toast('Saved '+name+' for Agent Coco');}else{download(name,data,'application/json');toast('Saved '+name);}}
// a sound file (a loop, a sample, a recording from your phone) goes on a new layer at the start of the loop
async function qUploadLayer(f){try{qFinishLayer();qEnsureLoop();const id=await importAudioFile(f);commit();QK.layers.push({snap:HIST.u[HIST.u.length-1],name:f.name});
 const tr=newTrack('audio',f.name.replace(/\.[^.]+$/,'').slice(0,20));tr.quick='upload';tr.arm=false;tr.color='#ffa8a8';
 const b=audioBeats(id),len=P.loop.b-P.loop.a,c=newClip('audio',P.loop.a,Math.max(len,Math.min(b,64)),b>len*1.05?b:Math.max(.5,Math.min(len,b)));c.src=id;c.name=tr.name;tr.clips.push(c);P.tracks.push(tr);
 updateMix();renderTimeline();renderPanel();toast('Added '+f.name+' as a layer');}catch(e){toast('Could not read that sound file',true);}}

// ---------- Free play: nothing is playing, you just play. Stop for 2 seconds and it works out your tempo,
// snaps what you played to the beat, turns it into a loop and starts playing it, so you can add the next layer. ----------
function qStatus(t){const e=document.getElementById('qstatus');if(e)e.textContent=t;}
function qFreeTap(q,m,vel){const now=performance.now()/1000;if(!QK.free)QK.free={taps:[]};
 QK.free.taps.push({q,t:now,m,v:vel,up:null});clearTimeout(QK.free.timer);
 const n=QK.free.taps.length;qStatus(n<3?`Listening… keep playing (${n})`:`Listening… ${n} hits. Stop for 2 seconds when you're done.`);
 QK.free.timer=setTimeout(qFreeFinish,2000);}
function qFreeFinish(){const F=QK.free;QK.free=null;if(!F)return;const taps=F.taps;
 if(Object.keys(QK.held).length||Object.keys(QK.keyDown).length){QK.free=F;F.timer=setTimeout(qFreeFinish,500);return;}   // still holding a key
 if(taps.length<3){qStatus('Play at least 3 hits, then stop for 2 seconds.');return;}
 const t0=taps[0].t;
 // the beat: the typical gap between hits, folded into 70-150 BPM
 const ts=[...new Set(taps.map(x=>Math.round(x.t*50)/50))].sort((a,b)=>a-b),gaps=[];for(let i=1;i<ts.length;i++){const g=ts[i]-ts[i-1];if(g>.08)gaps.push(g);}gaps.sort((a,b)=>a-b);
 let beat=gaps.length?gaps[Math.floor(gaps.length/2)]:.5;while(beat<.4)beat*=2;while(beat>.86)beat/=2;
 const empty=!P.tracks.some(t=>t.clips.some(c=>t.type==='audio'?c.src:c.notes.length));
 let bpm=Math.round(60/beat);
 // only trust a new tempo when the hits were steady and it's clearly different; otherwise keep the song's tempo (and never with 🔒 Lock tempo)
 const cvg=gaps.length>2?Math.sqrt(gaps.reduce((a,g)=>a+Math.pow(g/((gaps[gaps.length>>1])||1)-Math.round(g/((gaps[gaps.length>>1])||1)),2),0)/gaps.length):1;
 const steady=taps.length>=4&&cvg<.18,close=Math.abs(bpm-P.bpm)/P.bpm<.12;
 if(empty&&!QK.lockTempo&&steady&&(!QK.freeBpmSet||!close)){setBpm(bpm,false);QK.freeBpmSet=true;}else{beat=60/P.bpm;bpm=P.bpm;}   // a song that already has music keeps its tempo: your take is fitted to it
 const snap=QK.snap||2,pos=taps.map(x=>Math.round((x.t-t0)/beat*snap)/snap);
 const lenB=Math.max(...pos)+1,bars=lenB<=4?1:lenB<=8?2:lenB<=16?4:8,L=bars*4;
 commit();const names=[...new Set(taps.map(x=>x.q.n))];QK.layers.push({snap:HIST.u[HIST.u.length-1],name:names.join(' + ')});
 if(empty||!P.loop.on){P.loop={on:true,a:empty?0:Math.floor(T.head/4)*4,b:(empty?0:Math.floor(T.head/4)*4)+L};}
 const la=P.loop.a,ll=P.loop.b-P.loop.a,clips=new Map();
 taps.forEach((x,i)=>{const q=x.q,tr=qTrack(q,true);let c=clips.get(tr);
  if(!c){c=tr.clips.find(c=>la>=c.start&&la<c.start+c.len);if(!c){c=newClip(tr.type,la,ll,Math.min(ll,Math.max(L,4)));c.name='Jam';tr.clips.push(c);}clips.set(tr,c);}
  const t=((pos[i]+(la-c.start))%c.plen+c.plen)%c.plen;
  if(q.kind==='pad'){if(!c.notes.some(n=>n.p===q.p&&Math.abs(n.t-t)<.01))c.notes.push({t,p:q.p,v:x.v});}
  else{const d=x.up?Math.max(1/snap,Math.round((x.up-x.t)/beat*snap)/snap):.5;c.notes.push({t,d:Math.min(d,c.plen-t),m:x.m,v:.85*x.v});}});
 clips.forEach(c=>c.notes.sort((a,b)=>a.t-b.t));updateMix();renderTimeline();syncTop();
 toast(empty?`Got it! ${bpm} BPM, ${bars} bar loop. Now add another sound and play along.`:`Added your ${names.join(' + ')} to the loop. Keep going!`);
 play(P.loop.a).then(()=>{syncTop();renderPanel();});}

function openJam(){PANEL.tab='quick';const cur=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--panelh'))||360;if(cur<440&&innerHeight>=780)document.documentElement.style.setProperty('--panelh',Math.min(440,innerHeight-340)+'px');renderPanel();const b=document.getElementById('bJam');if(b)b.classList.add('on');midiInit();}
(function initJam(){const b=document.getElementById('bJam');if(b)b.onclick=()=>{if(PANEL.tab==='quick'){qFinishLayer();PANEL.tab='track';b.classList.remove('on');renderPanel();}else openJam();};
 let seen=false;try{seen=!!localStorage.getItem('gs-welcomed');}catch(e){}
 const W=document.getElementById('welcome');const done=go=>{W.classList.remove('show');try{localStorage.setItem('gs-welcomed','1');}catch(e){}if(go){ensureAudio();openJam();}};
 document.getElementById('wGo').onclick=()=>done(true);document.getElementById('wSkip').onclick=()=>done(false);
 if(!seen){W.classList.add('show');}})();

// ---------- 🎤 Voice in Jam: record exactly one pass of the loop onto a new layer, without stopping the music ----------
async function qVoiceRecord(){try{await micOn();}catch(e){toast('Microphone is blocked. Allow it in System Settings > Privacy & Security > Microphone.',true);return;}
 qFinishLayer();qEnsureLoop();const sp=()=>60/P.bpm;
 if(!T.playing){await play(P.loop.a-4);syncTop();}   // one bar count-in
 const L0=(AC.currentTime-T.t0)/sp(),s0=songAt(L0);
 const Lstart=s0<P.loop.a?L0+(P.loop.a-s0):L0+(P.loop.b-s0)<L0+.5?L0+(P.loop.b-s0)+(P.loop.b-P.loop.a):L0+(P.loop.b-s0);
 const len=P.loop.b-P.loop.a,tA=T.t0+Lstart*sp(),tB=tA+len*sp();
 MIC.chunks=[];MIC.node.port.postMessage({on:true});QK.vrec={tA,tB,len,start:P.loop.a,timer:null};renderPanel();
 const tickV=()=>{if(!QK.vrec)return;const now=AC.currentTime,R=QK.vrec;
  if(now<R.tA){const beats=Math.ceil((R.tA-now)/sp());qStatus(`Get ready… ${beats}`);}else qStatus(`🔴 Recording… sing! ${Math.max(0,Math.ceil((R.tB-now)/sp()))} beats left`);
  if(now>=R.tB+.25)qVoiceStop(false);else R.timer=setTimeout(tickV,60);};tickV();}
function qVoiceStop(cancel){const R=QK.vrec;if(!R)return;QK.vrec=null;clearTimeout(R.timer);MIC.node.port.postMessage({on:false});const chunks=MIC.chunks||[];MIC.chunks=null;
 if(cancel||!chunks.length||AC.currentTime<R.tA+.5){qStatus('Recording cancelled.');renderPanel();return;}
 const sr=AC.sampleRate,lat=(AC.outputLatency||0)+(AC.baseLatency||0)+(P.latency||0)/1000,first=chunks[0].t;let n=0;chunks.forEach(c=>n+=c.d.length);
 const all=new Float32Array(n);let o=0;chunks.forEach(c=>{all.set(c.d,o);o+=c.d.length;});
 const tEnd=Math.min(R.tB,AC.currentTime),N=Math.round((tEnd-R.tA)*sr),d=new Float32Array(N),s0=Math.round((R.tA+lat-first)*sr);
 for(let i=0;i<N;i++){const j=s0+i;if(j>=0&&j<all.length)d[i]=all[j];}
 commit();QK.layers.push({snap:HIST.u[HIST.u.length-1],name:'Voice'});
 const id=uid('a');AUDIO[id]={sr,d};const k=P.tracks.filter(t=>t.quick==='voice').length+1;const tr=newTrack('audio','Voice '+k);tr.quick='voice';tr.color='#ffd93d';tr.arm=false;tr.fx.rev=.2;
 const beats=(tEnd-R.tA)*P.bpm/60,c=newClip('audio',R.start,R.len,Math.max(.5,Math.min(R.len,beats)));c.src=id;c.name='Voice '+k;tr.clips.push(c);P.tracks.push(tr);
 if(peakOf(d)>.001)c.gain=Math.min(3,.8/peakOf(d));   // even out quiet takes
 updateMix();renderTimeline();renderPanel();qStatus('Added Voice '+k+'! Record another layer, or pick a different sound.');toast('Voice layer added');}
