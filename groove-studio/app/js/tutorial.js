// ===== Groove Studio: guided tutorial (spotlight + animated arrow + text + "Show me" examples) =====
'use strict';
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const TUT_STEPS=[
 {title:'Hi! Let’s make a song',text:'This quick tour points at the real buttons. Press <b>Show me</b> on any step to watch it happen, or <b>Next</b> to keep going. You can open it again any time with <b>? Tutorial</b>.'},
 {sel:'#bDice',title:'🎲 Roll a groove',text:'One click makes a whole idea: a beat, a bass line, chords and a melody, all in the same key so it sounds good. Don’t like it? Roll again. <b>Undo</b> brings the last one back.',
  show:async()=>{randomGroove();}},
 {sel:'#bPresets',title:'Or start from a preset',text:'Ready-made grooves (Funk, Boom Bap, House, Lo-Fi, Disco, Trap, Reggaeton) plus the four Agent Coco Music Room songs.',
  show:async()=>{const r=$('#bPresets').getBoundingClientRect();presetMenu(r.left,r.bottom+4);}},
 {sel:'#bPlay',title:'Play and stop',text:'Click here or press <b>Space</b>. The white line on the timeline shows where you are.',show:async()=>{if(!T.playing)await play(P.loop.on?P.loop.a:0);syncTop();}},
 {sel:'#nowbar',title:'Watch the sounds light up',text:'Every instrument has its own color. Each light flashes the moment you hear that sound, so you can see what makes up the song right now.',
  show:async()=>{if(!T.playing)await play(P.loop.on?P.loop.a:0);syncTop();}},
 {sel:'#bJam',title:'⚡ Jam: the easy way to add layers',text:'Jam mode lets you play along live. Everything you play snaps to the beat and gets added to the loop.',before:()=>openJam()},
 {sel:'.qgrid',title:'1. Pick a sound',text:'Drums on top, notes (bass, piano, bells…) below, and 🎤 <b>Voice</b> to record yourself into the loop. Each tile has its own color.',before:()=>openJam()},
 {sel:'.qtap,.qkeys',title:'2. Just play',text:'Click the big pad, or press any letter key on your keyboard. Notes only play in the song’s key, so nothing sounds wrong.<br><br>• Song <b>playing</b>: each hit joins the loop right away.<br>• Song <b>stopped</b>: play a rhythm, then stop for 2 seconds. Groove Studio finds your tempo and turns it into a loop.',
  before:()=>openJam(),show:async()=>{if(QK.inst!=='clap')qPick('clap');await wait(150);const pad=document.querySelector('.qtap');const beats=[0,1,1.5,2,3,3.5];const ms=60000/P.bpm;
   if(!T.playing){await play(P.loop.on?P.loop.a:0);syncTop();}
   const start=performance.now(),loopStart=headNow();const next=Math.ceil(loopStart)-loopStart;await wait(next*ms);
   for(let i=0;i<beats.length;i++){const due=(beats[i]-beats[0])*ms;await wait(Math.max(0,due-(performance.now()-start-next*ms)));qTap(0,1);if(pad)glow(pad,qColor(qInst()),true);}}},
 {sel:'.qlive',title:'Your layers',text:'Every sound you add shows here and lights up as it plays. <b>Undo last layer</b> takes the last one out. <b>Repeat through whole song</b> makes it play start to finish.',before:()=>openJam()},
 {sel:'#lanesWrap',title:'The timeline',text:'Everything lives here as colored clips. <b>Drag</b> a clip to move it, <b>drag its right edge</b> to repeat it, <b>right-click</b> for more. Drag in the numbers at the top to set the loop.'},
 {sel:'#panel canvas.ed',title:'Fine-tune the beat',text:'Click a track on the left to open its tools. In the beat grid, <b>click squares</b> to add hits, and <b>double-click an instrument name</b> to make its row bigger.',
  before:()=>{const d=P.tracks.find(t=>t.type==='drums');PANEL.tab='track';$('#bJam').classList.remove('on');if(d)select(d.id,null);},
  show:async()=>{const d=P.tracks.find(t=>t.type==='drums'),c=d&&panelClip(d);if(!c)return;commit();const pat=[[0,0],[2,3],[4,1],[6,3],[8,0],[10,0],[12,1],[14,4]];
   for(const [s,p] of pat){if(!c.notes.some(n=>n.p===p&&Math.abs(n.t*4-s)<.5))c.notes.push({t:s/4,p,v:.9});livePad(d,p);EDIT&&EDIT.draw();await wait(180);}renderTimeline();}},
 {sel:'#bRec',title:'Record your voice',text:'Press the red button (or Cmd+R) to record from your mic. Turn <b>Loop</b> on and every pass around the loop becomes a new layer, like a loop pedal. Headphones help.'},
 {sel:'#bFile',title:'Save and share',text:'<b>File</b> saves your song and exports it as a WAV you can send to anyone. Your work also autosaves.'},
 {title:'You’re ready! 🎉',text:'Try this: 🎲 roll a groove, open ⚡ Jam, pick <b>Piano</b> and play along. Have fun!'}];
let TUT=null;
function tutOpen(){TUT={i:0};hideMenu();const W=document.getElementById('welcome');if(W)W.classList.remove('show');tutShow();}
function tutClose(){TUT=null;['tutSpot','tutArrow','tutCard'].forEach(id=>{const e=document.getElementById(id);if(e)e.remove();});}
function tutTarget(sel){if(!sel)return null;for(const s of sel.split(',')){const e=document.querySelector(s);if(e&&e.offsetParent!==null)return e;}return null;}
async function tutShow(){if(!TUT)return;const S=TUT_STEPS[TUT.i];if(S.before){S.before();await wait(120);}
 let spot=document.getElementById('tutSpot'),arrow=document.getElementById('tutArrow'),card=document.getElementById('tutCard');
 if(!spot){spot=el('div','');spot.id='tutSpot';document.body.appendChild(spot);arrow=el('div','','➜');arrow.id='tutArrow';document.body.appendChild(arrow);card=el('div','');card.id='tutCard';document.body.appendChild(card);}
 const t=tutTarget(S.sel);
 if(t){t.scrollIntoView({block:'nearest',inline:'nearest'});const r=t.getBoundingClientRect(),pad=6;
  Object.assign(spot.style,{display:'block',left:r.left-pad+'px',top:r.top-pad+'px',width:r.width+pad*2+'px',height:r.height+pad*2+'px'});
  // arrow: from below if the target is high on the screen, else from above
  const below=r.top<innerHeight/2;arrow.style.display='block';arrow.className=below?'up':'down';
  arrow.style.left=Math.min(innerWidth-60,Math.max(10,r.left+r.width/2-22))+'px';arrow.style.top=(below?r.bottom+10:r.top-60)+'px';
  const cw=360;card.style.left=Math.min(innerWidth-cw-16,Math.max(16,r.left+r.width/2-cw/2))+'px';
  if(below){card.style.top=Math.min(innerHeight-260,r.bottom+64)+'px';card.style.bottom='';}else{card.style.top='';card.style.bottom=Math.min(innerHeight-260,innerHeight-r.top+64)+'px';}}
 else{spot.style.display='block';Object.assign(spot.style,{left:innerWidth/2+'px',top:innerHeight/2+'px',width:'0px',height:'0px'});arrow.style.display='none';card.style.left=(innerWidth/2-180)+'px';card.style.top=(innerHeight/2-120)+'px';card.style.bottom='';}
 card.innerHTML=`<div class="tstep">Step ${TUT.i+1} of ${TUT_STEPS.length}</div><h3>${S.title}</h3><p>${S.text}</p><div class="trow"></div>`;
 const row=card.querySelector('.trow');
 if(S.show){const b=btn('▶ Show me',async()=>{b.disabled=true;b.textContent='Watch…';try{await S.show();}catch(e){}b.disabled=false;b.textContent='▶ Show me again';},'','tshow');row.appendChild(b);}
 if(TUT.i>0)row.appendChild(btn('Back',()=>{TUT.i--;tutShow();}));
 row.appendChild(btn(TUT.i<TUT_STEPS.length-1?'Next':'Finish',()=>{if(TUT.i<TUT_STEPS.length-1){TUT.i++;tutShow();}else tutClose();},'','on'));
 const x=btn('✕',tutClose,'Close the tutorial','tclose');card.appendChild(x);
 card.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});}
addEventListener('resize',()=>{if(TUT)tutShow();});
addEventListener('keydown',e=>{if(!TUT)return;if(e.key==='Escape'){if($('#ctx').style.display==='block'){hideMenu();}else tutClose();e.stopImmediatePropagation();}else if(e.key==='ArrowRight'){TUT.i=Math.min(TUT_STEPS.length-1,TUT.i+1);tutShow();e.stopImmediatePropagation();}else if(e.key==='ArrowLeft'){TUT.i=Math.max(0,TUT.i-1);tutShow();e.stopImmediatePropagation();}},true);
(function(){$('#bTut').onclick=tutOpen;$('#bDice').onclick=()=>randomGroove();$('#bPresets').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();presetMenu(r.left,r.bottom+4);};
 const w=document.getElementById('wTour');if(w)w.onclick=()=>{try{localStorage.setItem('gs-welcomed','1');}catch(e){}ensureAudio();tutOpen();};})();
