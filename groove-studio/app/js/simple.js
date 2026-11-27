// ===== Simple view: Groove Studio as one friendly jam screen =====
// Big Play, tempo, mood. Big drum pads and an in-key keyboard (you can't hit a wrong note). Everything you play
// snaps to the beat and joins a loop that just keeps going. Your layers show as cards: tap to mute, ✕ to remove.
// The full studio (timeline, editors, mixer) is behind the "Studio" button.
'use strict';
const SIMPLE={help:false};
const MOODS=[{n:'Happy',e:'😊',sc:0},{n:'Chill',e:'😎',sc:2},{n:'Dark',e:'🌙',sc:1}];
const SDRUMS=QDRUMS.slice(0,8);   // kick snare clap hat open-hat shaker cowbell conga
const SKEYS='asdfghjk';
const isSimple=()=>document.body.classList.contains('simple');
function setView(simple){document.body.classList.toggle('simple',simple);try{localStorage.setItem('gs-view',simple?'simple':'studio');}catch(e){}
 if(simple){PANEL.tab='quick';if(!SIMPLE.inst||!QSOUNDS.find(q=>q.id===SIMPLE.inst))SIMPLE.inst=QK.inst;}else{PANEL.tab='track';const b=$('#bJam');if(b)b.classList.remove('on');}
 refreshAll();}
// the 8 keys: the song's scale from the sound's octave (always in key)
function sNotes(q){const sc=SCALES[P.scale].s,o=12*(qOct(q)+1)+P.key,out=[];for(let i=0;i<8;i++)out.push(o+sc[i%sc.length]+12*Math.floor(i/sc.length));return out;}
// mood + key: notes already in the song move along, so it still sounds right
function sSetMood(sc,key){commit();const k=key==null?P.key:key;let d=((k-P.key)%12+12)%12;if(d>6)d-=12;P.key=k;P.scale=sc;
 P.tracks.forEach(t=>{if(t.type==='synth')t.clips.forEach(c=>c.notes.forEach(n=>{n.m=bSnapScale(n.m+d);}));});syncTop();renderSimple();}
function sTempo(d){setBpm(P.bpm+d);renderSimple();}
async function sPlay(){if(T.playing){stop();}else{if(!P.loop.on||P.loop.b<=P.loop.a){const end=songEnd();P.loop={on:true,a:0,b:end>8?Math.min(16,Math.ceil(end/4)*4):8};}await play(P.loop.a);}syncTop();renderSimple();}
const TYPE_EMOJI={drums:'🥁',audio:'🎤'};
function trackEmoji(t){if((t.quick||'').startsWith('buddy'))return '🤖';if(t.type!=='synth')return TYPE_EMOJI[t.type]||'🎵';const q=QSOUNDS.find(q=>q.id===t.quick);if(q)return q.e;
 return ['🎺','🎹','🛎️','🎸','🎷','⛪','🪵','🪕','🎹','🌙','〰️','🎶'][t.patch&&t.patch.p|0]||'🎵';}
function sLayerCard(t,nm){const has=t.clips.some(c=>t.type==='audio'?c.src:c.notes.length);if(!has)return null;
 const d=el('div','slayer'+(t.mute?' muted':''),`<span class="em">${trackEmoji(t)}</span><span class="nm">${esc(nm||t.name)}</span><button class="x" title="Remove this layer">✕</button>`);
 d.style.setProperty('--c',t.color);d.dataset.tr=t.id;d.title=t.mute?'Muted. Tap to bring it back.':'Tap to mute';
 d.onclick=e=>{if(e.target.closest('.x')){commit();P.tracks=P.tracks.filter(x=>x!==t);updateMix();renderTimeline();renderSimple();toast('Removed '+t.name+'. Undo brings it back.');return;}t.mute=!t.mute;updateMix();renderSimple();};return d;}
function renderSimple(){const S=$('#simple');if(!S)return;S.innerHTML='';const q=qInst();
 // ---- top: play, tempo, mood ----
 const top=el('div','stop');
 const name=el('input','sname');name.value=P.name;name.spellcheck=false;name.onkeydown=e=>{e.stopPropagation();if(e.key==='Enter')name.blur();};name.onchange=()=>{commit();P.name=name.value.slice(0,40)||'My Jam';syncTop();};
 const play=el('button','splay'+(T.playing?' on':''),T.playing?'■':'▶');play.title='Play / Stop (Space)';play.onclick=sPlay;
 const tempo=el('div','stempo');tempo.append(btn('−',()=>sTempo(-4),'Slower'),el('div','sbpm',`<b>${P.bpm}</b><small>tempo</small>`),btn('+',()=>sTempo(4),'Faster'));
 tempo.querySelector('.sbpm').onclick=()=>{qTapTempo();setTimeout(renderSimple,50);};tempo.querySelector('.sbpm').title='Tap here in time to set the tempo';
 const mood=el('div','smood');MOODS.forEach(M=>{const b=btn(M.e+' '+M.n,()=>sSetMood(M.sc),'Changes the feel of every note',P.scale===M.sc?'on':'');mood.appendChild(b);});
 const ks=sel(NOTE_NAMES,P.key,v=>sSetMood(P.scale,v),'Key');ks.className='skey';mood.appendChild(ks);
 const right=el('div','sright');right.append(btn('↶',()=>{doUndo();renderSimple();},'Undo (⌘Z)','sico'),btn('🎲 New groove',()=>{randomGroove();renderSimple();},'Start from a random groove'),
  btn('💾',e=>{const r=e.currentTarget.getBoundingClientRect();menu(r.left-160,r.bottom+4,[['Save',()=>saveSong(false),'⌘S'],['Open…',openSong,'⌘O'],['New jam',newSong,'⌘N'],null,['Presets ▾',()=>presetMenu(r.left-160,r.bottom+4)],['📚 Riff library',()=>riffMenu(r.left-160,r.bottom+4)],null,['Export as WAV',()=>exportWav(true)],['Copy Agent Coco code',qCopyCoco]]);},'Save, open, presets, export','sico'),
  btn('?',()=>{SIMPLE.help=!SIMPLE.help;renderSimple();},'How it works','sico'+(SIMPLE.help?' on':'')),btn('Studio ›',()=>setView(false),'The full studio: timeline, editors, mixer','sstudio'));
 top.append(name,play,tempo,mood,right);S.appendChild(top);
 // ---- the loop: beat lights + your layers ----
 const mid=el('div','smid');const L=P.loop.on&&P.loop.b>P.loop.a?P.loop.b-P.loop.a:8;
 const bar=el('div','sbeats');for(let i=0;i<L;i++){const d=el('i',i%4===0?'one':'');d.dataset.b=i;bar.appendChild(d);}mid.appendChild(bar);
 const lay=el('div','slayers');const seen={};P.tracks.forEach(t=>{const b=t.name.replace(/^(Jam |🤖 Buddy )/,'');seen[b]=(seen[b]||0)+1;const c=sLayerCard(t,b+(seen[b]>1?' '+seen[b]:''));if(c)lay.appendChild(c);});
 if(!lay.children.length)lay.appendChild(el('div','sempty',`<b>Hit a pad or a key to start.</b><span>Press ▶ and play along: everything snaps to the beat and joins the loop.<br>Or just play while it's stopped, pause for 2 seconds, and it turns into a loop.</span>`));
 mid.appendChild(lay);
 const st=el('div','sstatus','');st.id='qstatus';st.textContent=T.playing?'Play along! Every time around the loop is one layer. ↶ takes the last one out.':'Tip: press 1–8 for drums and A S D F G H J K for notes.';mid.appendChild(st);
 // buddy + listen
 const fr=el('div','sfriends');
 const bb=btn(BUDDY.on?'🤖 Jam Buddy: on':'🤖 Jam Buddy',()=>BUDDY.on?buddyStop():buddyStart(),'A band mate that plays along with you','sbig'+(BUDDY.on?' on':''));fr.appendChild(bb);
 if(BUDDY.on||BUDDY.show){const mc=el('div','smodes');['chill','groove','dance','chaos'].forEach(k=>{const M=BMODES[k];mc.appendChild(btn(M.e+' '+M.n.split(' ')[0],()=>{BUDDY.mode=k;BUDDY.chaosProg=null;if(BUDDY.on&&T.playing)BUDDY.added.forEach(bWrite);renderSimple();},M.d,BUDDY.mode===k?'on':''));});fr.appendChild(mc);
  const bs=el('span','stip',BUDDY.status||'');bs.id='bStatus';fr.appendChild(bs);}
 const lb=btn(GUIDE.on?'🎧 Listening':'🎧 Listen',()=>GUIDE.on?guideOff():guideOn(),'Hears music in the room and matches your jam to its tempo and key','sbig'+(GUIDE.on?' on':''));fr.appendChild(lb);
 if(GUIDE.on){const g=el('div','sguide');g.id='qguide';g.innerHTML=`<span>Hearing <b id="gBpm">…</b> · <b id="gKey">…</b></span>`;g.append(btn('Match it',guideMatch,'Set your jam to that tempo and key'),btn(COVER?'✓ Make my cover':'🎙 Cover it',()=>COVER?coverFinish():coverStart(),'Learns the song and makes your own lo-fi cover'),el('span','gtip stip',''));fr.appendChild(g);setTimeout(guideUpdateStrip,0);}
 mid.appendChild(fr);S.appendChild(mid);
 // ---- play area: drums + sound + keys ----
 const pa=el('div','splayarea');
 const dp=el('div','sdrums');SDRUMS.forEach((d,i)=>{const tr=qTrack(d,false),b=el('button','spad',`<span class="em">${d.e}</span><span>${d.n}</span><kbd>${i+1}</kbd>`);b.style.setProperty('--c',PAD_COLORS[d.p]);b.dataset.p=d.p;if(tr)b.dataset.tr=tr.id;
  b.onpointerdown=e=>{e.preventDefault();qTap(d,0,e.shiftKey?.5:1);glow(b,PAD_COLORS[d.p],true);};dp.appendChild(b);});pa.appendChild(dp);
 const kp=el('div','skeysbox');const chips=el('div','ssounds');QSOUNDS.forEach(it=>{const b=btn(it.e+' '+it.n,()=>{qPick(it.id);renderSimple();},'',it.id===QK.inst?'on':'');b.style.setProperty('--c',qColor(it));chips.appendChild(b);});kp.appendChild(chips);
 if(q.kind==='voice'){const v=el('div','svoice');const rb=el('button','qrec'+(QK.vrec?' on':''),QK.vrec?'■ Stop':'🎤 Sing a layer');rb.onclick=()=>QK.vrec?qVoiceStop(true):qVoiceRecord();
  v.append(rb,el('div','',`<div class="vu"><i id="micVu"></i></div><p>It counts you in and records one time around the loop. Press again to stack another. Headphones help.</p>`));kp.appendChild(v);}
 else{const ks=el('div','skeys');const col=qColor(q);sNotes(q).forEach((m,i)=>{const k=el('button','skey'+(m%12===P.key?' root':''),`<b>${NOTE_NAMES[m%12]}</b><kbd>${SKEYS[i].toUpperCase()}</kbd>`);k.style.setProperty('--c',col);k.dataset.m=m;k.dataset.i=i;
   k.onpointerdown=e=>{e.preventDefault();qTap(q,m);k.classList.add('down');glow(k,col,true);const up=()=>{qRelease(q,m);k.classList.remove('down');removeEventListener('pointerup',up);};addEventListener('pointerup',up);};ks.appendChild(k);});kp.appendChild(ks);
  const oc=el('div','soct');oc.append(btn('◀ lower (Z)',()=>{qOctShift(q,-1);renderSimple();}),el('span','',`${q.n} · every key fits the song`),btn('higher (X) ▶',()=>{qOctShift(q,1);renderSimple();}));kp.appendChild(oc);}
 pa.appendChild(kp);S.appendChild(pa);
 if(SIMPLE.help){const h=el('div','shelp',`<button class="x">✕</button><h3>How to jam</h3><ol>
  <li><b>Play drums</b> with the pads or keys <kbd>1</kbd>–<kbd>8</kbd>.</li>
  <li><b>Pick a sound</b> (Bass, Piano…) and play the big keys or <kbd>A</kbd>–<kbd>K</kbd>. Every key is in tune with the song.</li>
  <li><b>Press ▶</b> and play along. Everything snaps to the beat and loops. Each time around is one layer; <b>↶</b> takes the last one out.</li>
  <li><b>Tap a layer</b> to mute it, <b>✕</b> to remove it.</li>
  <li><b>🤖 Jam Buddy</b> plays along with you. <b>🎧 Listen</b> matches music in the room.</li></ol><p>Want the timeline and all the editors? Press <b>Studio ›</b>.</p>`);h.querySelector('.x').onclick=()=>{SIMPLE.help=false;renderSimple();};S.appendChild(h);}
 S.querySelectorAll('[data-tr]').forEach(x=>x.classList.add('qtile'));}
// beat lights move every frame
function simpleFrame(){if(!isSimple())return;const L=P.loop.on&&P.loop.b>P.loop.a?P.loop.b-P.loop.a:8;const cur=T.playing?Math.floor(((headNow()-P.loop.a)%L+L)%L):-1;
 if(cur===SIMPLE.cur)return;SIMPLE.cur=cur;document.querySelectorAll('.sbeats i').forEach(d=>d.classList.toggle('now',+d.dataset.b===cur));}
// keys in the simple view: 1-8 drums, A-K the 8 in-key notes, Z/X octave
addEventListener('keydown',e=>{if(!isSimple()||e.metaKey||e.ctrlKey||e.altKey)return;if(e.target.closest&&e.target.closest('input,select'))return;const k=e.key.toLowerCase();
 if(k==='?'){SIMPLE.help=!SIMPLE.help;renderSimple();e.preventDefault();e.stopImmediatePropagation();return;}
 const di='12345678'.indexOf(k),ki=SKEYS.indexOf(k);if(di<0&&ki<0&&k!=='z'&&k!=='x')return;e.preventDefault();e.stopImmediatePropagation();if(e.repeat)return;
 if(di>=0){const d=SDRUMS[di];qTap(d,0,e.shiftKey?.5:1);glow(document.querySelector(`.spad[data-p="${d.p}"]`),PAD_COLORS[d.p],true);return;}
 const q=qInst();if(q.kind==='voice')return;if(k==='z'||k==='x'){qOctShift(q,k==='z'?-1:1);renderSimple();return;}
 const m=sNotes(q)[ki];if(QK.keyDown[e.code])return;QK.keyDown[e.code]={m,q,s:-1};qTap(q,m);const kb=document.querySelector(`.skey[data-i="${ki}"]`);if(kb){kb.classList.add('down');glow(kb,qColor(q),true);}},true);
addEventListener('keyup',e=>{if(!isSimple())return;const kb=document.querySelector('.skey.down');document.querySelectorAll('.skey.down').forEach(x=>{if(!Object.values(QK.keyDown).some(H=>H.m===+x.dataset.m))x.classList.remove('down');});});
(function initSimple(){let v='simple';try{v=localStorage.getItem('gs-view')||'simple';}catch(e){}
 const b=document.createElement('button');b.id='bSimple';b.className='jam';b.textContent='✨ Simple';b.title='Back to the simple jam screen';b.onclick=()=>setView(true);const r=$('#top .right');if(r)r.prepend(b);
 if(v==='simple')setView(true);})();
