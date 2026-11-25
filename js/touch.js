// ===== Touch controls (v0.23): on-screen D-pad and buttons for the Retroid touch screen, phones and tablets =====
// Shows after the first finger touch (or ?touch=1). Feeds Player 1 only (2 players on one touch screen is not supported).
// Buttons are 46x46 game pixels or bigger. Left thumb: D-pad. Right thumb: A jump/OK, X attack, Y gadget, B back. Start at the bottom center.
const TOUCH={on:/[?&]touch=1/.test(location.search),ptr:{},held:{}};
const TB={
 dpad:{x:86,y:386,r:70},
 A:{x:560,y:430,r:26,l:'A',b:['jump','ok'],c:'#59d96b'},
 X:{x:514,y:388,r:26,l:'X',b:['attack'],c:'#4aa8ff'},
 Y:{x:606,y:388,r:26,l:'Y',b:['gadget'],c:'#ffd23a'},
 B:{x:560,y:346,r:26,l:'B',b:['back'],c:'#ff6a6a'},
 S:{x:320,y:456,w:84,h:30,l:'START',b:['start'],c:'#cfd8ff'}};
function touchPos(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];}
function touchRecalc(){const h={};
 for(const id in TOUCH.ptr){const [x,y]=TOUCH.ptr[id];
  const d=TB.dpad,dx=x-d.x,dy=y-d.y,dist=Math.hypot(dx,dy);
  if(dist<d.r*1.25&&dist>10){const a=Math.atan2(dy,dx);if(Math.cos(a)>.38)h.right=1;if(Math.cos(a)<-.38)h.left=1;if(Math.sin(a)>.38)h.down=1;if(Math.sin(a)<-.38)h.up=1;}
  for(const k of ['A','X','Y','B','S']){const b=TB[k];const hit=b.r?Math.hypot(x-b.x,y-b.y)<b.r+8:(Math.abs(x-b.x)<b.w/2+6&&Math.abs(y-b.y)<b.h/2+8);if(hit)for(const n of b.b)h[n]=1;}}
 TOUCH.held=h;}
['pointerdown','pointermove'].forEach(t=>canvas.addEventListener(t,e=>{if(e.pointerType==='mouse')return;if(t==='pointermove'&&!(e.pointerId in TOUCH.ptr))return;TOUCH.on=true;TOUCH.ptr[e.pointerId]=touchPos(e);touchRecalc();e.preventDefault();}));
['pointerup','pointercancel','pointerleave'].forEach(t=>canvas.addEventListener(t,e=>{delete TOUCH.ptr[e.pointerId];touchRecalc();}));
canvas.style.touchAction='none';
function touchApply(I){if(!TOUCH.on)return;for(const b in TOUCH.held)I[b]=true;}
function touchBtn(b,down){const x=b.x,y=b.y;ctx.globalAlpha=down?.85:.45;
 if(b.r){ctx.fillStyle=down?'#fff':'rgba(10,20,40,.8)';ctx.beginPath();ctx.arc(x,y,b.r,0,7);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=b.c;ctx.stroke();}
 else{rrect(x-b.w/2,y-b.h/2,b.w,b.h,10,down?'#fff':'rgba(10,20,40,.8)',b.c,3);}
 ctx.globalAlpha=down?1:.9;text(b.l,x,y+(b.r?6:4),b.r?18:11,down?'#000':b.c,'center',null);ctx.globalAlpha=1;}
function drawTouch(){if(!TOUCH.on||typeof scene==='undefined'||!scene)return;ctx.save();
 const h=TOUCH.held,d=TB.dpad;ctx.globalAlpha=.4;ctx.fillStyle='rgba(10,20,40,.8)';ctx.beginPath();ctx.arc(d.x,d.y,d.r,0,7);ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#2de2f5';ctx.stroke();
 for(const [n,ax,ay] of [['up',0,-1],['down',0,1],['left',-1,0],['right',1,0]]){const on=h[n];ctx.globalAlpha=on?.95:.55;ctx.fillStyle=on?'#ffd23a':'#2de2f5';const cx=d.x+ax*44,cy=d.y+ay*44;ctx.beginPath();ctx.moveTo(cx+ax*13,cy+ay*13);ctx.lineTo(cx-ax*9-ay*12,cy-ay*9+ax*12);ctx.lineTo(cx-ax*9+ay*12,cy-ay*9-ax*12);ctx.closePath();ctx.fill();}
 for(const k of ['A','X','Y','B','S'])touchBtn(TB[k],TB[k].b.some(n=>h[n]));ctx.restore();}
