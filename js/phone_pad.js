// ===== Phone pad (phone wrapper only): touch controls live in the black side bars, not on top of the game =====
// Left bar: D-pad. Right bar: A jump/OK, X attack, Y gadget, B back, START. Drives Player 1 like touch.js did.
// Also makes the Enter Code screen work by touch: tap the letters, or tap the code box / KEYBOARD to type.
(function(){
 const coarse=matchMedia('(pointer:coarse)').matches||/[?&]touch=1/.test(location.search);
 if(!coarse)return;
 document.documentElement.classList.add('phonepad');
 const SIDE={};                       // button name -> held
 const MAP={up:['up'],down:['down'],left:['left'],right:['right'],A:['jump','ok'],X:['attack'],Y:['gadget'],B:['back'],S:['start']};
 // take over touch.js: no drawing on the picture, no invisible hit zones on the picture
 TOUCH.on=true;
 window.touchRecalc=function(){};
 window.drawTouch=function(){};
 window.muiOnTouchPad=function(){return false;};   // v0.41 mouse_ui: no hidden pad zones on the picture
 window.touchApply=function(I){for(const b in SIDE)if(SIDE[b])I[b]=true;};
 // the Enter Code screen reads gamepads through padEdges(): add our buttons as edges
 const PREV={};
 if(typeof padEdges==='function'){const orig=padEdges;window.padEdges=function(){const o=orig();
  const st={ok:SIDE.ok,back:SIDE.back,start:SIDE.start,up:SIDE.up,down:SIDE.down,left:SIDE.left,right:SIDE.right};
  for(const k in st){if(st[k]&&!PREV[k])o[k]=true;PREV[k]=!!st[k];}return o;};}

 const L=document.getElementById('padL'),R=document.getElementById('padR');
 L.innerHTML='<div class="dpad"><button data-b="up" class="du">&#9650;</button><button data-b="left" class="dl">&#9664;</button><button data-b="right" class="dr">&#9654;</button><button data-b="down" class="dd">&#9660;</button><i class="hub"></i></div>';
 R.innerHTML='<div class="abxy"><button data-b="Y" class="by">Y</button><button data-b="X" class="bx">X</button><button data-b="B" class="bb">B</button><button data-b="A" class="ba">A</button></div><div class="row"><button data-b="S" class="bs">START</button><button id="kbBtn" class="bk">KEYS</button></div>';
 const ptr={};                        // pointerId -> button name
 function recalc(){for(const k in SIDE)delete SIDE[k];const held={};
  for(const id in ptr){const n=ptr[id];if(!n)continue;held[n]=1;for(const b of MAP[n])SIDE[b]=true;}
  document.querySelectorAll('.phonepad button[data-b]').forEach(el=>el.classList.toggle('on',!!held[el.dataset.b]));
  TOUCH.held=Object.assign({},SIDE);}
 function hit(x,y){const el=document.elementFromPoint(x,y);if(!el)return null;
  if(el.dataset&&el.dataset.b)return el.dataset.b;
  // between d-pad arrows: pick the nearest direction so thumbs can roll around
  const d=L.querySelector('.dpad').getBoundingClientRect();
  if(x>=d.left&&x<=d.right&&y>=d.top&&y<=d.bottom){const dx=x-(d.left+d.width/2),dy=y-(d.top+d.height/2);
   if(Math.hypot(dx,dy)<10)return null;return Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');}
  return null;}
 for(const P of [L,R]){
  P.addEventListener('pointerdown',e=>{if(e.target.id==='kbBtn')return;P.setPointerCapture&&P.setPointerCapture(e.pointerId);ptr[e.pointerId]=hit(e.clientX,e.clientY);recalc();e.preventDefault();
   try{audio()&&AC.state==='suspended'&&AC.resume();}catch(_){}
   if(navigator.vibrate)navigator.vibrate(8);});
  P.addEventListener('pointermove',e=>{if(!(e.pointerId in ptr))return;const n=hit(e.clientX,e.clientY);if(n!==ptr[e.pointerId]){ptr[e.pointerId]=n;recalc();}e.preventDefault();});
  for(const t of ['pointerup','pointercancel','lostpointercapture'])P.addEventListener(t,e=>{if(e.pointerId in ptr){delete ptr[e.pointerId];recalc();}});
  P.addEventListener('touchstart',e=>e.preventDefault(),{passive:false});
  P.addEventListener('contextmenu',e=>e.preventDefault());}

 // ---- Enter Code by touch ----
 const kb=document.getElementById('kbIn'),kbBtn=document.getElementById('kbBtn');
 function openKeys(){kb.value='';kb.focus();}
 kbBtn.addEventListener('click',openKeys);
 kb.addEventListener('input',()=>{const v=kb.value.toUpperCase().replace(/[^A-Z0-9]/g,'');for(const ch of v)CodeEntry.ev.push(['type',ch]);kb.value='';});
 kb.addEventListener('keydown',e=>{if(e.key==='Backspace'){CodeEntry.ev.push(['del']);e.preventDefault();}else if(e.key==='Enter'){CodeEntry.ev.push(['ok']);kb.blur();e.preventDefault();}e.stopPropagation();});
 canvas.addEventListener('pointerdown',e=>{if(typeof CodeEntry==='undefined'||scene!==CodeEntry)return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*W/r.width,y=(e.clientY-r.top)*H/r.height;
  if(CodeEntry.msgT>0){CodeEntry.msgT=0;return;}
  if(x>=140&&x<=500&&y>=100&&y<=150){openKeys();return;}
  for(let rr=0;rr<4;rr++)for(let c=0;c<7;c++){const kx=124+c*56,ky=172+rr*56;
   if(x>=kx-4&&x<=kx+52&&y>=ky-4&&y<=ky+50){CodeEntry.cx=c;CodeEntry.cy=rr;CodeEntry.press();return;}}});
 // show the KEYS button only on the code screen
 (function watch(){kbBtn.style.visibility=(typeof CodeEntry!=='undefined'&&scene===CodeEntry)?'visible':'hidden';if(scene!==CodeEntry&&document.activeElement===kb)kb.blur();requestAnimationFrame(watch);})();
})();
