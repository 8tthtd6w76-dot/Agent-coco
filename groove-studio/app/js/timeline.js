// ===== Groove Studio timeline: track headers, ruler + loop, sections, clips (move / stretch / copy / split) =====
'use strict';
const UI={sel:{track:null,clip:null,sec:null},ppb:26,snap:4,rowh:64};
const $=s=>document.querySelector(s);
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
const snapB=(b,alt)=>{const s=alt?0:UI.snap;return s?Math.round(b/s)*s:Math.round(b*16)/16;};
const TYPE_LABEL={audio:'VOICE',drums:'BEAT',synth:'SYNTH'};
function selTrack(){return trackById(UI.sel.track)||null;}
function selClip(){const r=clipById(UI.sel.clip);return r?r.c:null;}
function select(trId,clipId){UI.sel.track=trId;UI.sel.clip=clipId||null;renderTimeline();renderPanel();}

function timelineBeats(){return Math.max(64,Math.ceil((songEnd()+32)/4)*4,P.loop.b+16);}
function renderTimeline(){const W=timelineBeats()*UI.ppb;$('#lanesInner').style.width=W+'px';
 renderHeads();renderRuler();renderSections();renderLanes();renderLoop();}

// ---------- track headers ----------
function renderHeads(){const L=$('#headList');L.innerHTML='';
 P.tracks.forEach(tr=>{const h=el('div','th'+(UI.sel.track===tr.id?' sel':''));h.style.setProperty('--c',tr.color);h.dataset.id=tr.id;
  h.innerHTML=`<div class="cbar"></div><div class="tin"><div class="tname"><span class="ty">${TYPE_LABEL[tr.type]}</span><span class="nm">${esc(tr.name)}</span></div>
   <div class="tbtn"><button class="m${tr.mute?' on':''}" title="Mute">M</button><button class="s${tr.solo?' on':''}" title="Solo">S</button>
   ${tr.type==='audio'?`<button class="a${tr.arm?' on':''}" title="Arm for recording">●</button>`:''}
   <input type="range" min="0" max="1.2" step="0.01" value="${tr.vol}" title="Volume"></div></div><div class="meter"><i></i></div>`;
  h.addEventListener('mousedown',e=>{if(e.target.closest('button,input'))return;select(tr.id,UI.sel.track===tr.id?UI.sel.clip:null);});
  h.addEventListener('dblclick',e=>{if(e.target.closest('button,input'))return;renameTrack(tr);});
  h.addEventListener('contextmenu',e=>{e.preventDefault();trackMenu(tr,e.clientX,e.clientY);});
  h.querySelector('.m').onclick=()=>{tr.mute=!tr.mute;updateMix();renderHeads();};
  h.querySelector('.s').onclick=()=>{tr.solo=!tr.solo;updateMix();renderHeads();};
  const a=h.querySelector('.a');if(a)a.onclick=()=>{P.tracks.forEach(t=>{if(t.type==='audio')t.arm=t===tr?!t.arm:false;});renderHeads();};
  const v=h.querySelector('input');v.onpointerdown=()=>commit();v.oninput=()=>{tr.vol=+v.value;updateMix();if(UI.sel.track===tr.id)syncStrip();};
  L.appendChild(h);});
 L.style.height='';}
function renameTrack(tr){const n=prompt2('Track name',tr.name,v=>{commit();tr.name=v.slice(0,32)||tr.name;renderTimeline();renderPanel();});}
function trackMenu(tr,x,y){menu(x,y,[
 ['Rename',()=>renameTrack(tr)],
 ['Duplicate track',()=>{commit();const c=JSON.parse(JSON.stringify(tr));c.id=uid('t');c.name=tr.name+' copy';c.clips.forEach(k=>k.id=uid('c'));P.tracks.splice(P.tracks.indexOf(tr)+1,0,c);updateMix();renderTimeline();}],
 ['Color',()=>{commit();tr.color=COLORS[(COLORS.indexOf(tr.color)+1)%COLORS.length];renderTimeline();renderPanel();}],
 ['Move up',()=>{const i=P.tracks.indexOf(tr);if(i>0){commit();P.tracks.splice(i,1);P.tracks.splice(i-1,0,tr);renderTimeline();}}],
 ['Move down',()=>{const i=P.tracks.indexOf(tr);if(i<P.tracks.length-1){commit();P.tracks.splice(i,1);P.tracks.splice(i+1,0,tr);renderTimeline();}}],
 null,['Delete track',()=>{commit();P.tracks.splice(P.tracks.indexOf(tr),1);if(UI.sel.track===tr.id)UI.sel={track:null,clip:null,sec:null};updateMix();renderTimeline();renderPanel();}]]);}

// ---------- ruler: click = move playhead, drag = set loop ----------
function renderRuler(){const R=$('#ruler');R.innerHTML='';const n=timelineBeats()/4,step=UI.ppb<10?4:UI.ppb<16?2:1;
 for(let b=0;b<n;b+=step){const d=el('div','bar',String(b+1));d.style.left=b*4*UI.ppb+'px';R.appendChild(d);}
 const lb=el('div','loopband'+(P.loop.on?' on':''));lb.style.left=P.loop.a*UI.ppb+'px';lb.style.width=(P.loop.b-P.loop.a)*UI.ppb+'px';R.appendChild(lb);}
function renderLoop(){const s=$('#loopShade');s.style.display=P.loop.on?'block':'none';s.style.left=P.loop.a*UI.ppb+'px';s.style.width=(P.loop.b-P.loop.a)*UI.ppb+'px';$('#tLoop').classList.toggle('on',P.loop.on);}
function beatAtX(clientX){const r=$('#lanesInner').getBoundingClientRect();return Math.max(0,(clientX-r.left)/UI.ppb);}
function initRuler(){const R=$('#ruler');
 R.addEventListener('mousedown',e=>{const b0=beatAtX(e.clientX);let moved=false;const snap=v=>Math.round(v/(e.altKey?1:4))*(e.altKey?1:4);
  const mv=ev=>{const b1=beatAtX(ev.clientX);if(Math.abs(b1-b0)*UI.ppb>5){if(!moved)commit();moved=true;let a=snap(Math.min(b0,b1)),b=snap(Math.max(b0,b1));if(b<=a)b=a+(e.altKey?1:4);P.loop.a=a;P.loop.b=b;P.loop.on=true;renderRuler();renderLoop();}};
  const up=ev=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up);if(!moved)seek(ev.altKey?b0:Math.floor(b0));};
  addEventListener('mousemove',mv);addEventListener('mouseup',up);});}
function seek(b){T.head=Math.max(0,b);if(T.playing&&!T.rec)play(T.head);drawHead();}

// ---------- sections (Intro / Verse / Chorus ...) ----------
const SEC_NAMES=['Intro','Verse','Pre-Chorus','Chorus','Bridge','Drop','Outro'];
function renderSections(){const R=$('#secRow');R.innerHTML='';
 P.sections.forEach(s=>{const d=el('div','sec'+(UI.sel.sec===s.id?' sel':''),esc(s.name));d.style.left=s.bar*4*UI.ppb+'px';d.style.width=Math.max(10,s.len*4*UI.ppb-2)+'px';
  d.title='Drag to move, right-click for options, double-click to rename';
  d.addEventListener('mousedown',e=>{e.stopPropagation();if(e.button)return;UI.sel.sec=s.id;const x0=e.clientX,b0=s.bar;let moved=false;
   const mv=ev=>{const db=Math.round((ev.clientX-x0)/(UI.ppb*4));if(db&&!moved){commit();moved=true;}if(moved){s.bar=Math.max(0,b0+db);d.style.left=s.bar*4*UI.ppb+'px';}};
   const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up);renderSections();};addEventListener('mousemove',mv);addEventListener('mouseup',up);});
  d.addEventListener('dblclick',e=>{e.stopPropagation();prompt2('Section name',s.name,v=>{commit();s.name=v.slice(0,24)||s.name;renderSections();});});
  d.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();secMenu(s,e.clientX,e.clientY);});
  R.appendChild(d);});}
function initSections(){const R=$('#secRow');
 R.addEventListener('mousedown',e=>{if(e.target!==R||e.button)return;const b0=Math.floor(beatAtX(e.clientX)/4);const g=el('div','sec','New section');R.appendChild(g);
  const show=b1=>{const a=Math.min(b0,b1),b=Math.max(b0,b1)+1;g.style.left=a*4*UI.ppb+'px';g.style.width=(b-a)*4*UI.ppb-2+'px';return [a,b-a];};let cur=show(b0);
  const mv=ev=>{cur=show(Math.floor(beatAtX(ev.clientX)/4));};
  const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up);commit();
   const used=P.sections.map(s=>s.name),nm=SEC_NAMES.find(n=>!used.includes(n))||'Part '+(P.sections.length+1);
   const s={id:uid('s'),bar:cur[0],len:cur[1],name:nm};P.sections.push(s);UI.sel.sec=s.id;renderSections();};
  addEventListener('mousemove',mv);addEventListener('mouseup',up);});}
function clipsIn(a,b){const out=[];P.tracks.forEach(t=>t.clips.forEach(c=>{if(c.start>=a&&c.start<b)out.push({t,c});}));return out;}
function secMenu(s,x,y){const a=s.bar*4,b=a+s.len*4;
 menu(x,y,[
  ['Loop this section',()=>{commit();P.loop={on:true,a,b};renderTimeline();}],
  ['Play from here',()=>play(a)],
  ['Duplicate right after',()=>insertCopy(s,b),'pushes later parts right'],
  ['Copy to the end of the song',()=>insertCopy(s,Math.ceil(songEnd()/4)*4)],
  ['Rename',()=>prompt2('Section name',s.name,v=>{commit();s.name=v.slice(0,24)||s.name;renderSections();})],
  ...SEC_NAMES.filter(n=>n!==s.name).slice(0,4).map(n=>['Call it '+n,()=>{commit();s.name=n;renderSections();}]),
  null,
  ['Remove label only',()=>{commit();P.sections=P.sections.filter(x=>x!==s);renderSections();}],
  ['Delete section and its clips',()=>{commit();shiftFrom(b,-(b-a),s);P.tracks.forEach(t=>t.clips=t.clips.filter(c=>!(c.start>=a&&c.start<b)));P.sections=P.sections.filter(x=>x!==s);renderTimeline();}]]);}
// shift every clip/section starting at or after `at` by `by` beats
function shiftFrom(at,by,skip){P.tracks.forEach(t=>t.clips.forEach(c=>{if(c.start>=at)c.start+=by;}));P.sections.forEach(x=>{if(x!==skip&&x.bar*4>=at)x.bar+=by/4;});}
function insertCopy(s,at){commit();const a=s.bar*4,len=s.len*4,src=clipsIn(a,a+len);if(at<songEnd())shiftFrom(at,len);
 src.forEach(({t,c})=>{const k=JSON.parse(JSON.stringify(c));k.id=uid('c');k.start=c.start-a+at;t.clips.push(k);});
 P.sections.push({id:uid('s'),bar:at/4,len:s.len,name:s.name});renderTimeline();toast('Copied '+s.name);}

// ---------- lanes + clips ----------
function renderLanes(){const L=$('#lanes');L.innerHTML='';
 P.tracks.forEach(tr=>{const ln=el('div','lane'+(UI.sel.track===tr.id?' sel':''));ln.dataset.id=tr.id;
  ln.addEventListener('mousedown',e=>{if(e.target!==ln)return;select(tr.id,null);});
  ln.addEventListener('dblclick',e=>{if(e.target!==ln)return;if(tr.type==='audio'){toast('Press Record, or drop an audio file here');return;}
   commit();const st=Math.floor(beatAtX(e.clientX)/4)*4,len=4;const c=newClip(tr.type,st,len,len);tr.clips.push(c);select(tr.id,c.id);});
  tr.clips.forEach(c=>ln.appendChild(clipEl(tr,c)));
  if(T.rec&&T.rec.kind==='audio'&&T.rec.tr===tr.id){const r=el('div','clip recording');r.id='recClip';ln.appendChild(r);}
  L.appendChild(ln);});}
function clipEl(tr,c){const d=el('div','clip'+(UI.sel.clip===c.id?' sel':''));d.style.setProperty('--c',tr.color);d.dataset.id=c.id;
 const pos=()=>{d.style.left=c.start*UI.ppb+'px';d.style.width=Math.max(6,c.len*UI.ppb-1)+'px';};pos();
 const w=Math.min(6000,Math.max(6,Math.round(c.len*UI.ppb))),cv=document.createElement('canvas');cv.width=w*devicePixelRatio;cv.height=(UI.rowh-8)*devicePixelRatio;cv.style.width=w+'px';cv.style.height=(UI.rowh-8)+'px';
 d.appendChild(cv);drawClip(cv,tr,c);
 for(let k=c.plen;k<c.len-1e-6;k+=c.plen){const m=el('div','loopmark');m.style.left=k*UI.ppb+'px';d.appendChild(m);}
 d.appendChild(el('div','cn',esc(c.name||(tr.type==='audio'?'Take':tr.type==='drums'?'Beat':'Notes'))));
 const rr=el('div','rz r');rr.title='Drag to stretch (repeats the loop)';d.appendChild(rr);
 if(tr.type==='audio'){const rl=el('div','rz l');rl.title='Drag to trim the start';d.appendChild(rl);}
 d.addEventListener('mousedown',e=>{if(e.button)return;e.stopPropagation();const mode=e.target.classList.contains('r')?'r':e.target.classList.contains('l')?'l':'m';
  UI.sel.track=tr.id;UI.sel.clip=c.id;document.querySelectorAll('.clip.sel').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');
  const x0=e.clientX,y0=e.clientY,s0=c.start,l0=c.len,o0=c.off||0,p0=c.plen;let moved=false,copy=e.altKey,ghost=null,destTr=tr;
  const mv=ev=>{const db=(ev.clientX-x0)/UI.ppb;if(!moved&&Math.abs(ev.clientX-x0)+Math.abs(ev.clientY-y0)<4)return;
   if(!moved){commit();moved=true;if(copy&&mode==='m'){const k=JSON.parse(JSON.stringify(c));k.id=uid('c');tr.clips.push(k);ghost=clipEl(tr,k);d.parentNode.appendChild(ghost);}}
   const free=ev.altKey&&!copy||UI.snap===0;
   if(mode==='m'){c.start=Math.max(0,snapB(s0+db,free));
    // drag onto another track of the same kind
    const lane=document.elementsFromPoint(ev.clientX,ev.clientY).find(x=>x.classList&&x.classList.contains('lane'));const t2=lane&&trackById(lane.dataset.id);
    if(t2&&t2.type===tr.type&&t2!==destTr){destTr.clips=destTr.clips.filter(x=>x!==c);t2.clips.push(c);destTr=t2;lane.appendChild(d);d.style.setProperty('--c',t2.color);}}
   else if(mode==='r'){c.len=Math.max(.25,snapB(s0+l0+db,free)-c.start);if(c.len<.25)c.len=.25;if(tr.type!=='audio'&&c.len<c.plen&&!ev.shiftKey)c.plen=c.len;}
   else{const ns=Math.min(s0+l0-.25,Math.max(0,snapB(s0+db,free))),d2=ns-s0;const no=o0+d2*spb();if(no<0)return;c.start=ns;c.len=l0-d2;c.off=no;c.plen=Math.max(.25,p0-d2);}
   pos();};
  const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up);if(moved){UI.sel.track=destTr.id;renderTimeline();}renderPanel();};
  addEventListener('mousemove',mv);addEventListener('mouseup',up);});
 d.addEventListener('dblclick',e=>{e.stopPropagation();select(tr.id,c.id);document.querySelector('#panel .gridwrap,#panel canvas.wave')?.scrollIntoView({block:'nearest'});});
 d.addEventListener('contextmenu',e=>{e.preventDefault();e.stopPropagation();select(tr.id,c.id);clipMenu(tr,c,e.clientX,e.clientY);});
 return d;}
function clipMenu(tr,c,x,y){const items=[
 ['Duplicate',()=>dupClip(tr,c),'⌘D'],
 ['Split at playhead',()=>splitClip(tr,c,T.head),'⌘B'],
 ['Rename',()=>prompt2('Clip name',c.name||'',v=>{commit();c.name=v.slice(0,24);renderTimeline();})],
 ['Fit to one loop',()=>{commit();c.len=c.plen;renderTimeline();}],
 ['Make it 2× longer',()=>{commit();c.len*=2;renderTimeline();}]];
 if(tr.type==='audio')items.push(['Reverse',()=>{commit();c.rev=!c.rev;renderTimeline();renderPanel();}],['Chop onto beat pads…',()=>chopToPads(tr,c)]);
 items.push(null,['Delete',()=>delClip(tr,c),'⌫']);menu(x,y,items);}
function dupClip(tr,c){commit();const k=JSON.parse(JSON.stringify(c));k.id=uid('c');k.start=c.start+c.len;tr.clips.push(k);select(tr.id,k.id);}
function delClip(tr,c){commit();tr.clips=tr.clips.filter(x=>x!==c);UI.sel.clip=null;renderTimeline();renderPanel();}
function splitClip(tr,c,b){if(b<=c.start+.01||b>=c.start+c.len-.01){toast('Put the playhead inside the clip first');return;}commit();
 const k=JSON.parse(JSON.stringify(c));k.id=uid('c');const cut=b-c.start;c.len=cut;k.start=b;k.len-=cut;
 if(tr.type==='audio'){const inPl=cut%c.plen;k.off=(c.off||0)+inPl*spb();k.plen=c.plen-inPl;if(k.plen<=0)k.plen=c.plen;}
 else{const sh=cut%c.plen;k.notes=k.notes.map(n=>({...n,t:((n.t-sh)%c.plen+c.plen)%c.plen}));}
 tr.clips.push(k);select(tr.id,k.id);}

// ---------- clip drawings ----------
function drawClip(cv,tr,c){const g=cv.getContext('2d'),dp=devicePixelRatio,W=cv.width/dp,H=cv.height/dp;g.scale(dp,dp);g.clearRect(0,0,W,H);
 g.fillStyle=tr.color;g.strokeStyle=tr.color;
 if(tr.type==='audio'){const A=AUDIO[c.src];if(!A)return;const d=A.d,sr=A.sr,sp=spb(),mid=H/2+5,amp=(H-16)/2,gain=Math.min(3,(c.gain||1));
  g.globalAlpha=.85;for(let x=0;x<W;x++){const b=x/UI.ppb,inl=b%c.plen,s0=Math.floor(((c.off||0)+inl*sp)*sr),s1=Math.floor(((c.off||0)+(inl+1/UI.ppb)*sp)*sr);let p=0;
   for(let i=s0;i<s1&&i<d.length;i+=Math.max(1,(s1-s0)>>4)){const v=Math.abs(d[c.rev?d.length-1-i:i]);if(v>p)p=v;}const h=Math.max(.5,Math.min(1,p*gain)*amp);g.fillRect(x,mid-h,1,h*2);}return;}
 if(tr.type==='drums'){const rows=16,rh=(H-14)/rows;g.globalAlpha=.9;
  for(let k=0;k*c.plen<c.len;k++)for(const n of c.notes){const x=(k*c.plen+n.t)*UI.ppb;if(n.t>=c.plen||x>W)continue;g.globalAlpha=.4+.6*n.v;g.fillStyle=PAD_COLORS[n.p];g.fillRect(x,12+n.p*rh,Math.max(2,UI.ppb/4-1),Math.max(1.5,rh-.5));}return;}
 if(!c.notes.length)return;let lo=127,hi=0;c.notes.forEach(n=>{lo=Math.min(lo,n.m);hi=Math.max(hi,n.m);});lo-=2;hi+=2;const rh=(H-16)/Math.max(12,hi-lo);
 for(let k=0;k*c.plen<c.len;k++)for(const n of c.notes){if(n.t>=c.plen)continue;const x=(k*c.plen+n.t)*UI.ppb;if(x>W)continue;g.globalAlpha=.5+.5*n.v;g.fillRect(x,12+(hi-n.m)*rh,Math.max(2,n.d*UI.ppb-1),Math.max(2,rh));}}

// ---------- playhead + meters (every frame) ----------
function drawHead(){const h=headNow();$('#playhead').style.left=Math.max(0,h)*UI.ppb+'px';
 const bar=Math.floor(h/4)+1,beat=Math.floor(((h%4)+4)%4)+1;$('#pos').textContent=h<0?'count '+(Math.floor(-h)+1):bar+'.'+beat;
 if(T.playing){const W=$('#lanesWrap'),x=h*UI.ppb;if(x>W.scrollLeft+W.clientWidth-60||x<W.scrollLeft)W.scrollLeft=Math.max(0,x-80);}
 const R=$('#recClip');if(R&&T.rec){R.style.left=T.rec.from*UI.ppb+'px';R.style.width=Math.max(2,(h-T.rec.from)*UI.ppb)+'px';}}
