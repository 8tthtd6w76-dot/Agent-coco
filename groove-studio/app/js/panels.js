// ===== Groove Studio bottom panel: the selected track's tool (beat pads + steps, FM-1 synth + piano roll, voice recorder) =====
'use strict';
const SCALES=[{n:'Major',s:[0,2,4,5,7,9,11]},{n:'Minor',s:[0,2,3,5,7,8,10]},{n:'Dorian',s:[0,2,3,5,7,9,10]},{n:'Mixolydian',s:[0,2,4,5,7,9,10]},
 {n:'Minor Pentatonic',s:[0,3,5,7,10]},{n:'Major Pentatonic',s:[0,2,4,7,9]},{n:'Blues',s:[0,3,5,6,7,10]},{n:'Chromatic',s:[0,1,2,3,4,5,6,7,8,9,10,11]}];
const NOTE_NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const inScale=m=>SCALES[P.scale].s.includes((((m-P.key)%12)+12)%12);
const PAD_KEYS=['z','x','c','v','a','s','d','f','q','w','e','r','1','2','3','4'];   // pad 1 = Z (bottom-left), like a 4x4 pad controller
const PIANO_KEYS='awsedftgyhujkolp;\'';                                             // A = C, W = C# ...
const PANEL={pad:0,oct:4,len:.25,editClip:null,tab:'track'};
let EDIT=null;   // the live editor canvas (redrawn each frame while playing)

function panelClip(tr){let c=selClip();if(c&&tr.clips.includes(c))return c;c=tr.clips.find(c=>T.head>=c.start&&T.head<c.start+c.len)||tr.clips[0]||null;if(c)UI.sel.clip=c.id;return c;}
function slider(label,min,max,step,get,set,fmt){const w=el('label','knob');const v=get();
 w.innerHTML=`<b>${label}<em></em></b><input type="range" min="${min}" max="${max}" step="${step}" value="${v}">`;const i=w.querySelector('input'),em=w.querySelector('em');
 const show=()=>em.textContent=fmt?fmt(+i.value):'';show();i.onpointerdown=()=>commit();i.oninput=()=>{set(+i.value);show();};i.ondblclick=()=>{};return w;}
function btn(txt,fn,title,cls){const b=el('button',cls||'',txt);b.onclick=fn;if(title)b.title=title;return b;}
function sel(opts,val,fn,title){const s=el('select');opts.forEach((o,i)=>{const op=el('option','',esc(o));op.value=i;s.appendChild(op);});s.value=val;s.onchange=()=>fn(+s.value);if(title)s.title=title;return s;}

function renderPanel(){if(document.body.classList.contains('simple')&&typeof renderSimple==='function'){renderSimple();return;}const Pn=$('#panel');Pn.innerHTML='';EDIT=null;const tr=selTrack();
 if(PANEL.tab==='quick'){quickPanel(Pn);return;}
 if(!tr){const h0=el('div','ph');h0.append(panelTabs(),el('div','tt','Pick a track'));Pn.appendChild(h0);const b=el('div','pb');b.appendChild(el('div','empty','<div>Click a track on the left to open its tool here.</div><div class="hint">Voice = record and loop · Beat = pads and steps · Synth = FM-1 and piano roll</div>'));Pn.appendChild(b);return;}
 const h=el('div','ph');h.style.setProperty('--c',tr.color);h.innerHTML=`<div class="tt"><i></i>${esc(tr.name)}<span class="hint">${({audio:'Voice recorder',drums:'Beat pads',synth:'FM-1 synth'})[tr.type]}</span></div>`;
 h.prepend(panelTabs());const st=el('div','strip');st.id='strip';h.appendChild(st);Pn.appendChild(h);syncStrip();
 const body=el('div','pb');Pn.appendChild(body);
 ({audio:audioPanel,drums:drumPanel,synth:synthPanel})[tr.type](tr,body);}
function syncStrip(){const st=$('#strip'),tr=selTrack();if(!st||!tr)return;st.innerHTML='';const pct=v=>Math.round(v*100)+'%';
 st.append(slider('Volume',0,1.2,.01,()=>tr.vol,v=>{tr.vol=v;updateMix();const r=document.querySelector(`.th[data-id="${tr.id}"] input`);if(r)r.value=v;},pct),
  slider('Pan',-1,1,.01,()=>tr.pan,v=>{tr.pan=v;updateMix();},v=>Math.abs(v)<.02?'C':(v<0?'L':'R')+Math.round(Math.abs(v)*100)),
  slider('Tone',0,1,.01,()=>tr.fx.tone,v=>{tr.fx.tone=v;updateMix();},v=>v>.98?'open':pct(v)),
  slider('Reverb',0,1,.01,()=>tr.fx.rev,v=>{tr.fx.rev=v;updateMix();},pct),
  slider('Echo',0,1,.01,()=>tr.fx.dly,v=>{tr.fx.dly=v;updateMix();},pct));}
function noClip(body,tr,txt){const e=el('div','empty',`<div>${txt}</div>`);e.appendChild(btn(tr.type==='drums'?'New beat clip':'New melody clip',()=>{commit();const st=Math.floor(T.head/4)*4,c=newClip(tr.type,st,4,4);tr.clips.push(c);select(tr.id,c.id);},'','on'));
 const col=el('div','col');col.style.flex='1';col.appendChild(e);body.appendChild(col);}

// ================= BEAT PADS =================
function drumPanel(tr,body){const L=el('div','col');L.style.width='300px';L.style.flex='none';
 const top=el('div','row');top.append(sel(KITS_DEF.map(k=>k.n+' kit'),tr.kit,v=>{commit();tr.kit=v;renderPanel();},'Drum kit'),
  btn(P.quant?'Q 1/16 on':'Q off',()=>{P.quant=!P.quant;renderPanel();},'Snap pads you play live to the 16th-note grid',P.quant?'on':''));
 L.append(top);const pads=el('div','pads');
 for(let r=3;r>=0;r--)for(let c=0;c<4;c++){const p=r*4+c,pd=tr.pads[p],b=el('div','pad'+(PANEL.pad===p?' sel':'')+(pd.sample?' smp':''));b.style.setProperty('--c',PAD_COLORS[p]);b.dataset.p=p;
  b.innerHTML=`<span>${PAD_EMOJI[p]} ${esc(pd.name||PAD_NAMES[p])}</span><span class="k">${PAD_KEYS[p].toUpperCase()}</span>`;
  b.onmousedown=async e=>{await ensureAudio();PANEL.pad=p;livePad(tr,p,e.shiftKey?.5:1);flashPad(p);document.querySelectorAll('.pad.sel').forEach(x=>x.classList.remove('sel'));b.classList.add('sel');padTools(tr,pt);};
  b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();e.stopPropagation();const f=e.dataTransfer.files[0];if(f)loadSampleToPad(tr,p,f);};
  pads.appendChild(b);}
 L.append(pads);const pt=el('div','col');pt.style.padding='0';pt.style.border='0';L.append(pt);padTools(tr,pt);body.appendChild(L);
 const c=panelClip(tr);if(!c){noClip(body,tr,'This beat track has no clips yet.');return;}
 const R=el('div','col');const tools=el('div','row');
 tools.append(el('h4','','Steps'),sel(['1 bar','2 bars','4 bars'],[4,8,16].indexOf(c.plen)<0?0:[4,8,16].indexOf(c.plen),v=>{commit();const nl=[4,8,16][v];
   if(nl>c.plen){const add=[];for(let k=1;k*c.plen<nl;k++)c.notes.forEach(n=>add.push({...n,t:n.t+k*c.plen}));c.notes.push(...add.filter(n=>n.t<nl));}else c.notes=c.notes.filter(n=>n.t<nl);
   c.plen=nl;if(c.len<nl)c.len=nl;renderTimeline();renderPanel();},'Pattern length'),
  btn('🎲 Vary',()=>{commit();varyBeat(c);renderTimeline();drawEdit();},'Adds ghost notes, hat rolls and kick pushes: a fresh take on the same groove'),
  btn('Clear',()=>{commit();c.notes=[];renderTimeline();drawEdit();}),
  el('span','hint','Click or drag to paint · Shift = soft hit · right-click = erase · double-click a name to resize its row'),
  btn('Rows: all big',()=>{const all=tr.pads.every(x=>x.h==='full');tr.pads.forEach(x=>x.h=all?'thin':'full');DIRTY=true;renderPanel();},'Switch every row between thin bars and full squares'));
 R.append(tools);const wrap=el('div','gridwrap'),cv=el('canvas','ed');wrap.appendChild(cv);R.appendChild(wrap);body.appendChild(R);
 // each row's height is its own: thin bar, 3/4 or a full square (double-click the name to switch); stored per pad
 const LBL=110,cols=Math.round(c.plen*4);let CW=18;const SZ=['thin','mid','full'];
 const rh=p=>{const z=tr.pads[p].h||'thin';return z==='full'?Math.max(18,CW):z==='mid'?Math.max(16,Math.round(CW*.75)):16;};
 const ys=()=>{const o=[0];for(let p=0;p<16;p++)o.push(o[p]+rh(p));return o;};let Y=ys();
 const rowAt=y=>{for(let p=0;p<16;p++)if(y>=Y[p]&&y<Y[p+1])return p;return -1;};
 const size=()=>{CW=Math.max(16,Math.floor((wrap.clientWidth-LBL-2)/cols));Y=ys();const H=Y[16];cv.width=(LBL+cols*CW)*devicePixelRatio;cv.height=H*devicePixelRatio;cv.style.width=LBL+cols*CW+'px';cv.style.height=H+'px';draw();};
 const find=(col,p)=>c.notes.findIndex(n=>n.p===p&&Math.abs(n.t*4-col)<.5);
 const draw=()=>{const g=cv.getContext('2d'),dp=devicePixelRatio;g.setTransform(dp,0,0,dp,0,0);g.fillStyle='#0f1116';g.fillRect(0,0,cv.width,cv.height);
  const ph=T.playing&&headNow()>=c.start&&headNow()<c.start+c.len?Math.floor(((headNow()-c.start)%c.plen)*4):-1;
  for(let p=0;p<16;p++){const y=Y[p],h=Y[p+1]-y,big=h>=24;g.fillStyle=p===PANEL.pad?'#2a3160':p%2?'#151820':'#12141a';g.fillRect(0,y,LBL,h);g.fillStyle=PAD_COLORS[p];g.fillRect(0,y+1,4,h-2);
   g.font=(big?Math.min(20,h-8):11)+'px "Apple Color Emoji","Segoe UI Emoji",sans-serif';g.textBaseline='middle';g.fillText(PAD_EMOJI[p],8,y+h/2+1);
   g.fillStyle=p===PANEL.pad?'#fff':'#9aa1b3';g.font=(big?'12px':'10px')+' -apple-system,sans-serif';g.fillText((tr.pads[p].name||PAD_NAMES[p]).slice(0,13),big?Math.min(34,h+12):24,y+h/2+1);g.textBaseline='alphabetic';
   for(let s=0;s<cols;s++){const x=LBL+s*CW;g.fillStyle=s===ph?'#2b3040':(Math.floor(s/4)%2?'#1a1d25':'#1e222c');g.fillRect(x+1,y+1,CW-2,h-2);}}
  for(const n of c.notes){const s=Math.round(n.t*4);if(s>=cols)continue;const y=Y[n.p],h=Y[n.p+1]-y;g.fillStyle=PAD_COLORS[n.p];g.globalAlpha=.35+.65*n.v;
   const r=Math.min(6,h/4);g.beginPath();if(g.roundRect)g.roundRect(LBL+s*CW+2,y+2,CW-4,h-4,r);else g.rect(LBL+s*CW+2,y+2,CW-4,h-4);g.fill();}g.globalAlpha=1;
  g.fillStyle='rgba(255,255,255,.18)';for(let s=0;s<=cols;s+=16)g.fillRect(LBL+s*CW-1,0,2,Y[16]);};
 EDIT={draw};
 let paint=null;
 cv.onmousedown=e=>{const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,p=rowAt(y);if(p<0)return;
  if(x<LBL){PANEL.pad=p;ensureAudio().then(()=>livePad(tr,p));draw();renderPanelPads();return;}
  const s=Math.floor((x-LBL)/CW);if(s<0||s>=cols)return;commit();const i=find(s,p);paint={add:e.button===2?false:i<0,v:e.shiftKey?.45:.9,p:null};
  e.preventDefault();apply(s,p);const mv=ev=>{const rr=cv.getBoundingClientRect(),s2=Math.floor((ev.clientX-rr.left-LBL)/CW),p2=rowAt(ev.clientY-rr.top);if(s2>=0&&s2<cols&&p2>=0)apply(s2,p2);};
  const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up);paint=null;renderTimeline();};addEventListener('mousemove',mv);addEventListener('mouseup',up);};
 // double-click a name: thin bar -> 3/4 -> full square -> thin bar
 cv.ondblclick=e=>{const r=cv.getBoundingClientRect(),x=e.clientX-r.left,p=rowAt(e.clientY-r.top);if(p<0||x>=LBL)return;const pd=tr.pads[p];pd.h=SZ[(SZ.indexOf(pd.h||'thin')+1)%3];DIRTY=true;size();};
 const apply=(s,p)=>{const k=s+':'+p;if(paint.p===k)return;paint.p=k;const i=find(s,p);
  if(paint.add&&i<0){c.notes.push({t:s/4,p,v:paint.v});if(AC)livePad(tr,p,paint.v);}else if(!paint.add&&i>=0)c.notes.splice(i,1);draw();};
 cv.oncontextmenu=e=>e.preventDefault();
 requestAnimationFrame(size);}
function renderPanelPads(){document.querySelectorAll('.pad').forEach(b=>b.classList.toggle('sel',+b.dataset.p===PANEL.pad));}
function flashPad(p){const b=document.querySelector(`.pad[data-p="${p}"]`);if(!b)return;b.classList.add('hit');setTimeout(()=>b.classList.remove('hit'),90);}
function padTools(tr,box){box.innerHTML='';const p=PANEL.pad,pd=tr.pads[p];
 const h=el('div','row');h.append(el('h4','',`Pad ${p+1}: ${esc(pd.name||PAD_NAMES[p])}`));box.append(h);
 const g=el('div','grid2');g.append(slider('Level',0,1.5,.01,()=>pd.vol,v=>pd.vol=v,v=>Math.round(v*100)+'%'),slider('Tune',-12,12,1,()=>pd.tune,v=>pd.tune=v,v=>(v>0?'+':'')+v));box.append(g);
 const r=el('div','row');r.append(btn('Load sample…',()=>pickFile('audio/*',f=>loadSampleToPad(tr,p,f)),'Or drop an audio file on the pad'));
 if(pd.sample)r.append(btn('Use kit sound',()=>{commit();pd.sample=null;pd.name=null;renderPanel();}));box.append(r);}
async function loadSampleToPad(tr,p,file){try{const id=await importAudioFile(file);commit();tr.pads[p].sample=id;tr.pads[p].name=file.name.replace(/\.[^.]+$/,'').slice(0,14);PANEL.pad=p;renderPanel();toast('Loaded '+file.name+' on pad '+(p+1));}catch(e){toast('Could not read that audio file',true);}}
function varyBeat(c){const len=Math.round(c.plen*4),has=(s,p)=>c.notes.some(n=>n.p===p&&Math.round(n.t*4)===s),R=Math.random;
 // keep the backbone (kick on 1, snare on 2 and 4), vary the rest
 c.notes=c.notes.filter(n=>{const s=Math.round(n.t*4);const keep=(n.p===0&&s%16===0)||(n.p===1&&s%8===4);return keep||R()>.18;});
 for(let s=0;s<len;s++){if(R()<.12&&!has(s,1)&&s%2)c.notes.push({t:s/4,p:1,v:.35});if(R()<.1&&!has(s,0)&&s%4!==0)c.notes.push({t:s/4,p:0,v:.8});
  if(R()<.18&&!has(s,3))c.notes.push({t:s/4,p:3,v:.5+R()*.3});if(R()<.04&&!has(s,4))c.notes.push({t:s/4,p:4,v:.6});if(R()<.05)c.notes.push({t:s/4,p:[9,10,11,13][R()*4|0],v:.6});}
 c.notes.sort((a,b)=>a.t-b.t);}

// ================= FM-1 SYNTH + PIANO ROLL =================
function synthPanel(tr,body){const L=el('div','col');L.style.width='330px';L.style.flex='none';const Pt=tr.patch;
 const reset=()=>{renderPanel();};
 const top=el('div','row');top.append(sel(FM_PRESETS.map(p=>p.n),Pt.p|0,v=>{commit();const vol=Pt.vol;tr.patch=fm1Patch(v);tr.patch.vol=vol;reset();},'FM-1 preset'),
  sel(FM_ALGS.map((a,i)=>'Alg '+(i+1)+' '+a.n),Pt.alg,v=>{commit();Pt.alg=v;},'How the 6 operators feed each other'),
  btn('🎲 Tone',()=>{commit();mutatePatch(Pt);reset();toast('New tone variation');},'A new tone close to this one'));
 L.append(top);
 const g=el('div','grid3');const pc=v=>Math.round(v*100);
 g.append(slider('Brightness',0,1,.01,()=>Pt.tone,v=>Pt.tone=v,pc),slider('Bite',0,2,.01,()=>Pt.mod,v=>Pt.mod=v,v=>v.toFixed(2)),slider('Volume',0,1,.01,()=>Pt.vol,v=>Pt.vol=v,pc),
  slider('Attack',0,1.5,.005,()=>Pt.env[0],v=>Pt.env[0]=v,v=>v.toFixed(2)+'s'),slider('Decay',.02,2,.01,()=>Pt.env[1],v=>Pt.env[1]=v,v=>v.toFixed(2)+'s'),slider('Sustain',0,1,.01,()=>Pt.env[2],v=>Pt.env[2]=v,pc),
  slider('Release',.02,2,.01,()=>Pt.env[3],v=>Pt.env[3]=v,v=>v.toFixed(2)+'s'),slider('Vibrato',0,1,.01,()=>Pt.lfo[1],v=>Pt.lfo[1]=v,pc),slider('Wobble',0,1,.01,()=>Pt.lfo[2],v=>Pt.lfo[2]=v,pc),
  slider('LFO speed',.2,12,.1,()=>Pt.lfo[0],v=>Pt.lfo[0]=v,v=>v.toFixed(1)+'Hz'),slider('Glide',0,1,.01,()=>Pt.glide,v=>Pt.glide=v,pc),slider('Synth echo',0,.8,.01,()=>Pt.fx[1],v=>Pt.fx[1]=v,pc));
 L.append(g);
 const kb=el('div','row');kb.append(btn('Oct −',()=>{PANEL.oct=Math.max(1,PANEL.oct-1);renderPanel();},'Z'),el('span','hint',`Keys A–L play C${PANEL.oct}`),btn('Oct +',()=>{PANEL.oct=Math.min(7,PANEL.oct+1);renderPanel();},'X'));L.append(kb);
 L.append(miniKeys(tr));body.appendChild(L);
 const c=panelClip(tr);if(!c){noClip(body,tr,'This synth track has no clips yet.');return;}
 const R=el('div','col');const tools=el('div','row');
 tools.append(el('h4','','Notes'),sel(['1 bar','2 bars','4 bars','8 bars'],Math.max(0,[4,8,16,32].indexOf(c.plen)),v=>{commit();c.plen=[4,8,16,32][v];c.notes=c.notes.filter(n=>n.t<c.plen);if(c.len<c.plen)c.len=c.plen;renderTimeline();renderPanel();},'Loop length'),
  sel(['Draw 1/16','Draw 1/8','Draw 1/4','Draw 1/2'],[.25,.5,1,2].indexOf(PANEL.len),v=>{PANEL.len=[.25,.5,1,2][v];},'Length of new notes'),
  btn('🎲 Vary melody',()=>{commit();varyMelody(c);renderTimeline();draw();},'Keeps the rhythm, picks new notes from the scale'),
  btn('▲',()=>{commit();shiftNotes(c,1);},'Up one scale step'),btn('▼',()=>{commit();shiftNotes(c,-1);},'Down one scale step'),
  btn('Oct ▲',()=>{commit();c.notes.forEach(n=>n.m+=12);renderTimeline();draw();}),btn('Oct ▼',()=>{commit();c.notes.forEach(n=>n.m-=12);renderTimeline();draw();}),
  btn('Quantize',()=>{commit();c.notes.forEach(n=>{n.t=Math.round(n.t*4)/4;n.d=Math.max(.25,Math.round(n.d*4)/4);});renderTimeline();draw();}),
  btn('Clear',()=>{commit();c.notes=[];renderTimeline();draw();}));
 R.append(tools);const wrap=el('div','gridwrap'),cv=el('canvas','ed');wrap.appendChild(cv);R.appendChild(wrap);
 R.append(el('div','hint','Click to add · drag to move · drag the right end to resize · right-click or double-click to delete · scale notes are lighter'));body.appendChild(R);
 const LO=24,HI=96,RH=12,KW=38,rows=HI-LO+1;let CW=16,cols=Math.round(c.plen*4);
 const size=()=>{CW=Math.max(14,Math.floor((wrap.clientWidth-KW-14)/cols));cv.width=(KW+cols*CW)*devicePixelRatio;cv.height=rows*RH*devicePixelRatio;cv.style.width=KW+cols*CW+'px';cv.style.height=rows*RH+'px';draw();
  const mid=c.notes.length?c.notes.reduce((a,n)=>a+n.m,0)/c.notes.length:60;wrap.scrollTop=(HI-mid)*RH-wrap.clientHeight/2;};
 const yOf=m=>(HI-m)*RH,xOf=t=>KW+t*4*CW;
 const draw=()=>{const g=cv.getContext('2d'),dp=devicePixelRatio;g.setTransform(dp,0,0,dp,0,0);const W=KW+cols*CW;
  for(let m=LO;m<=HI;m++){const y=yOf(m),blk=[1,3,6,8,10].includes(m%12);g.fillStyle=inScale(m)?(blk?'#1c2029':'#20242e'):'#14161c';g.fillRect(KW,y,W-KW,RH);
   g.fillStyle=blk?'#262a33':'#d9dce4';g.fillRect(0,y,KW-2,RH-1);if(m%12===0){g.fillStyle='#555';g.font='9px -apple-system,sans-serif';g.fillText('C'+(m/12-1),3,y+9.5);}
   if(m%12===P.key%12){g.fillStyle='rgba(123,140,255,.08)';g.fillRect(KW,y,W-KW,RH);}}
  for(let s=0;s<=cols;s++){g.fillStyle=s%16===0?'rgba(255,255,255,.22)':s%4===0?'rgba(255,255,255,.09)':'rgba(255,255,255,.03)';g.fillRect(xOf(s/4),0,1,rows*RH);}
  if(T.playing){const h=headNow();if(h>=c.start&&h<c.start+c.len){g.fillStyle='rgba(255,255,255,.6)';g.fillRect(xOf((h-c.start)%c.plen),0,1.5,rows*RH);}}
  for(const n of c.notes){if(n.t>=c.plen)continue;const x=xOf(n.t),y=yOf(n.m),w=Math.max(4,n.d*4*CW-1);g.fillStyle=tr.color;g.globalAlpha=.55+.45*n.v;g.fillRect(x,y+1,w,RH-2);g.globalAlpha=1;g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x+w-3,y+2,2,RH-4);}};
 EDIT={draw};
 const hit=(x,y)=>{for(let i=c.notes.length-1;i>=0;i--){const n=c.notes[i],nx=xOf(n.t),ny=yOf(n.m),w=Math.max(4,n.d*4*CW-1);if(x>=nx&&x<=nx+w&&y>=ny&&y<ny+RH)return {i,edge:x>nx+w-6};}return null;};
 const audition=m=>{if(!AC)return;liveKeyDown(tr,m,.8);setTimeout(()=>liveKeyUp(tr,m),180);};
 cv.onmousedown=async e=>{await ensureAudio();const r=cv.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,m=HI-Math.floor(y/RH);
  if(x<KW){audition(m);return;}const H=hit(x,y);
  if(e.button===2||e.altKey){if(H){commit();c.notes.splice(H.i,1);draw();renderTimeline();}return;}
  commit();let n,mode;const t=Math.floor((x-KW)/CW)/4;
  if(H){n=c.notes[H.i];mode=H.edge?'r':'m';}else{if(t>=c.plen)return;n={t,d:PANEL.len,m,v:.85};c.notes.push(n);mode='r0';audition(m);draw();}
  const t0=n.t,m0=n.m,d0=n.d,x0=x,y0=y;
  const mv=ev=>{const rr=cv.getBoundingClientRect(),xx=ev.clientX-rr.left,yy=ev.clientY-rr.top,dt=Math.round((xx-x0)/CW)/4;
   if(mode==='m'){const nt=Math.max(0,Math.min(c.plen-.25,t0+dt)),nm=Math.max(LO,Math.min(HI,m0-Math.round((yy-y0)/RH)));if(nm!==n.m)audition(nm);n.t=nt;n.m=nm;}
   else{n.d=Math.max(.25,Math.min(c.plen-n.t,(mode==='r0'?PANEL.len:d0)+dt));}draw();};
  const up=()=>{removeEventListener('mousemove',mv);removeEventListener('mouseup',up);if(mode!=='m')PANEL.len=n.d;c.notes.sort((a,b)=>a.t-b.t);draw();renderTimeline();};
  addEventListener('mousemove',mv);addEventListener('mouseup',up);};
 cv.ondblclick=e=>{const r=cv.getBoundingClientRect(),H=hit(e.clientX-r.left,e.clientY-r.top);if(H){commit();c.notes.splice(H.i,1);draw();renderTimeline();}};
 cv.onmousemove=e=>{const r=cv.getBoundingClientRect(),H=hit(e.clientX-r.left,e.clientY-r.top);cv.style.cursor=H?(H.edge?'ew-resize':'grab'):'crosshair';};
 cv.oncontextmenu=e=>e.preventDefault();
 const shiftNotes=(c,dir)=>{c.notes.forEach(n=>{let m=n.m+dir;while(!inScale(m))m+=dir;n.m=m;});renderTimeline();draw();};
 requestAnimationFrame(size);}
function miniKeys(tr){const k=el('div','keys');const base=PANEL.oct*12+12;
 for(let i=0;i<15;i++){const semis=[0,2,4,5,7,9,11][i%7]+12*Math.floor(i/7),m=base+semis,w=el('div','w',i%7===0?'C'+(PANEL.oct+Math.floor(i/7)):'');w.dataset.m=m;
  w.onmousedown=async e=>{e.preventDefault();await ensureAudio();liveKeyDown(tr,m);w.classList.add('down');const up=()=>{liveKeyUp(tr,m);w.classList.remove('down');removeEventListener('mouseup',up);};addEventListener('mouseup',up);};
  if([0,1,3,4,5].includes(i%7)&&i<14){const b=el('div','b');b.dataset.m=m+1;b.onmousedown=async e=>{e.preventDefault();e.stopPropagation();await ensureAudio();liveKeyDown(tr,m+1);b.classList.add('down');const up=()=>{liveKeyUp(tr,m+1);b.classList.remove('down');removeEventListener('mouseup',up);};addEventListener('mouseup',up);};w.appendChild(b);}
  k.appendChild(w);}
 return k;}
function mutatePatch(Pt){const R=Math.random,cl=(v,a,b)=>Math.max(a,Math.min(b,v));
 Pt.ops.forEach((o,i)=>{if(i&&R()<.35)o[0]=FM_RATIOS[cl(FM_RATIOS.indexOf(o[0])+(R()<.5?-1:1),0,FM_RATIOS.length-1)]||o[0];o[1]=cl(o[1]*(0.75+R()*.5)+(R()<.15?.1:0),0,1);o[2]=cl(o[2]+(R()-.5)*4,-9,9);});
 Pt.tone=cl(Pt.tone+(R()-.5)*.2,.1,1);Pt.mod=cl(Pt.mod*(.8+R()*.4),.2,2);Pt.env[1]=cl(Pt.env[1]*(.8+R()*.4),.05,2);if(R()<.3)Pt.lfo[1]=cl(Pt.lfo[1]+R()*.2,0,1);}
function varyMelody(c){if(!c.notes.length)return;const sc=SCALES[P.scale].s,R=Math.random;
 const deg=m=>{const pc=(((m-P.key)%12)+12)%12;let best=0,bd=99;sc.forEach((s,i)=>{const d=Math.abs(s-pc);if(d<bd){bd=d;best=i;}});return Math.floor((m-P.key)/12)*sc.length+best;};
 const mid=d=>P.key+12*Math.floor(d/sc.length)+sc[((d%sc.length)+sc.length)%sc.length];
 const groups={};c.notes.forEach(n=>(groups[n.t]=groups[n.t]||[]).push(n));
 Object.keys(groups).forEach(t=>{const g=groups[t];if(+t%4===0&&R()<.6)return;if(R()<.4)return;const step=[-2,-1,1,2][R()*4|0];g.forEach(n=>{n.m=mid(deg(n.m)+step);});});}

// ================= VOICE RECORDER =================
function audioPanel(tr,body){const L=el('div','col');L.style.width='270px';L.style.flex='none';
 const rb=el('button','recbig'+(T.rec?' on':''),'●');rb.title='Record (Cmd+R)';rb.onclick=()=>{if(T.rec)stop();else{tr.arm=true;P.tracks.forEach(t=>{if(t!==tr&&t.type==='audio')t.arm=false;});startRecord(tr);}};
 L.append(rb,el('div','hint',P.loop.on?'Loop is on: each pass around the loop becomes a new layer, like a loop pedal.':'Loop is off: one long take. Turn Loop on to stack layers.'));
 const vu=el('div','vu','<i id="micVu"></i>');L.append(el('h4','','Input'),vu);
 const r=el('div','row');r.append(btn(MIC?'Mic ready':'Turn on mic',async()=>{try{await micOn();renderPanel();}catch(e){toast('Microphone is blocked. Allow it in System Settings > Privacy > Microphone.',true);}},'Lets the meter show your level before recording',MIC?'on':''),
  btn(PANEL.mon?'Hear myself: on':'Hear myself: off',async()=>{PANEL.mon=!PANEL.mon;if(PANEL.mon)await micOn().catch(()=>{});micMonitor(PANEL.mon);renderPanel();},'Plays your mic through the speakers. Use headphones.',PANEL.mon?'on':''));
 L.append(r);L.append(slider('Timing fix',-80,160,1,()=>P.latency||0,v=>P.latency=v,v=>v+' ms'));
 L.append(el('div','hint','If takes land late, raise Timing fix.'));
 L.append(btn('Import audio file…',()=>pickFile('audio/*',f=>importToTrack(tr,f,T.head))));
 body.appendChild(L);
 const c=panelClip(tr);const R=el('div','col');body.appendChild(R);
 if(!c||!c.src){R.appendChild(el('div','empty','<div>No takes yet.</div><div class="hint">Press the big red button to record. Space stops.</div>'));return;}
 const A=AUDIO[c.src],dur=A.d.length/A.sr;
 R.append(el('div','row',`<h4>Take</h4><span class="hint">${dur.toFixed(1)} s recorded · loop length ${c.plen.toFixed(2)} beats</span>`));
 const cv=el('canvas','wave');R.append(cv);
 const g=el('div','grid3');g.style.maxWidth='620px';
 g.append(slider('Gain',0,3,.01,()=>c.gain,v=>{c.gain=v;dw();},v=>(20*Math.log10(Math.max(v,.001))).toFixed(1)+' dB'),
  slider('Pitch',-12,12,1,()=>c.pitch||0,v=>{c.pitch=v;},v=>(v>0?'+':'')+v+' st'),
  slider('Fade in',0,4,.125,()=>c.fin||0,v=>c.fin=v,v=>v+' bt'),slider('Fade out',0,4,.125,()=>c.fout||0,v=>c.fout=v,v=>v+' bt'));
 R.append(g);
 const pr=g.querySelectorAll('input')[1];pr.onchange=()=>{toast(c.pitch?'Pitch shifted '+(c.pitch>0?'+':'')+c.pitch+' (length kept)':'Pitch back to normal');renderTimeline();};
 const row=el('div','row');row.append(btn(c.rev?'Reversed':'Reverse',()=>{commit();c.rev=!c.rev;renderTimeline();renderPanel();},'',c.rev?'on':''),
  btn('Normalize',()=>{commit();c.gain=Math.min(3,.95/Math.max(.001,peakOf(A.d)));renderTimeline();renderPanel();},'Make the take as loud as it can go without clipping'),
  btn('Loop = 1 bar',()=>{commit();c.plen=4;c.len=Math.max(c.len,4);renderTimeline();renderPanel();},'Turn the start of the take into a 1-bar loop'),
  btn('Loop = 2 bars',()=>{commit();c.plen=8;c.len=Math.max(c.len,8);renderTimeline();renderPanel();}),
  btn('Chop onto beat pads…',()=>chopToPads(tr,c),'Slices the take into 16 pads on a Beat track'));
 R.append(row);
 const dw=()=>{const dp=devicePixelRatio,W=cv.clientWidth,H=cv.clientHeight;cv.width=W*dp;cv.height=H*dp;const x=cv.getContext('2d');x.scale(dp,dp);x.fillStyle='#0f1116';x.fillRect(0,0,W,H);
  const d=A.d,per=Math.max(1,Math.floor(d.length/W)),gn=c.gain||1;x.fillStyle=tr.color;for(let i=0;i<W;i++){let p=0;for(let j=0;j<per;j+=Math.max(1,per>>5)){const v=Math.abs(d[(c.rev?d.length-1-(i*per+j):i*per+j)]||0);if(v>p)p=v;}const h=Math.min(1,p*gn)*(H/2-4);x.fillRect(i,H/2-h,1,Math.max(1,h*2));}
  const sp=spb(),a=(c.off||0)/dur*W,b=Math.min(W,((c.off||0)+c.plen*sp)/dur*W);x.fillStyle='rgba(123,140,255,.18)';x.fillRect(a,0,b-a,H);x.fillStyle='#fff';x.fillRect(a,0,1,H);x.fillRect(b-1,0,1,H);
  x.fillStyle='#9aa1b3';x.font='10px -apple-system,sans-serif';x.fillText('used part (the loop)',a+4,12);};
 requestAnimationFrame(dw);}
function chopToPads(tr,c){const A=AUDIO[c.src];if(!A)return;commit();
 const dt=newTrack('drums',(c.name&&c.name!=='Take'?c.name:tr.name)+' chops');dt.color=tr.color;P.tracks.push(dt);   // a fresh Beat track, so no kit gets overwritten
 const sp=spb(),a=Math.floor((c.off||0)*A.sr),len=Math.min(A.d.length-a,Math.floor(c.plen*sp*A.sr)),n=16,sl=Math.floor(len/n);
 for(let i=0;i<n;i++){const d=A.d.slice(a+i*sl,a+(i+1)*sl);for(let k=0;k<64&&k<d.length;k++){d[k]*=k/64;d[d.length-1-k]*=k/64;}
  const id=uid('a');AUDIO[id]={sr:A.sr,d};dt.pads[i].sample=id;dt.pads[i].name='Chop '+(i+1);}
 updateMix();select(dt.id,null);toast('Chopped into 16 pads on '+dt.name+'. Play them with Z X C V / A S D F / Q W E R / 1 2 3 4');}
async function importAudioFile(file){await ensureAudio();const ab=await file.arrayBuffer(),buf=await AC.decodeAudioData(ab);const id=uid('a');AUDIO[id]={sr:buf.sampleRate,d:toMono(buf)};return id;}
async function importToTrack(tr,file,at){try{const id=await importAudioFile(file);commit();const b=audioBeats(id),c=newClip('audio',Math.max(0,Math.floor(at)),b,b);c.src=id;c.name=file.name.replace(/\.[^.]+$/,'').slice(0,20);tr.clips.push(c);select(tr.id,c.id);toast('Imported '+file.name);}
 catch(e){toast('Could not read that audio file',true);}}
