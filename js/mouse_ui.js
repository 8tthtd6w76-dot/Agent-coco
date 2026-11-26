// ===== Mouse + tap targets for menu screens (v0.41) =====
// Scenes register clickable boxes while they draw: MUI.add(x,y,w,h,{click,right,wheel,down,hover,arrows,hl}).
// The list is rebuilt every frame, so the boxes always match what is on screen. Last added = on top.
//  click(mx,my)  left click / tap        right()  right click (falls back to wheel(-1))
//  wheel(d)      scroll, d = +1 up / -1 down
//  down(mx,my)   start a drag; return {move(mx,my),up()} to follow the pointer until release
//  hover()       mouse moved onto it      arrows:true draws < > hints on hover, hl:false = no outline
// MUI.btn('ok'|'back'|'gadget'|'attack'|'start'|'left'|'right'|'up'|'down') presses a pad button for one frame,
// so a click runs exactly the same code as the keyboard or a gamepad.
// MUI.chips([{t,b}|{t,fn}],y) draws a row of clickable button-hint chips (they replace the old hint text lines).
const MUI={hits:[],press:new Set(),mx:-1,my:-1,lastMouse:-99,moved:false,drag:null,wheelAcc:0,
 add(x,y,w,h,o){o.x=x;o.y=y;o.w=w;o.h=h;this.hits.push(o);return o;},
 btn(b){this.press.add(b);},
 at(mx,my,pred){for(let i=this.hits.length-1;i>=0;i--){const o=this.hits[i];if(mx>=o.x&&mx<o.x+o.w&&my>=o.y&&my<o.y+o.h&&(!pred||pred(o)))return o;}return null;},
 mouseRecent(){return TIME-this.lastMouse<6;},
 chips(items,y,h=22){ctx.font='bold 11px "Trebuchet MS",Verdana,sans-serif';const pad=12,gap=8,ws=items.map(it=>ctx.measureText(it.t).width+pad*2);
  let x=W/2-(ws.reduce((a,b)=>a+b,0)+gap*(items.length-1))/2;
  items.forEach((it,i)=>{const w=ws[i],hov=this.mouseRecent()&&this.mx>=x&&this.mx<x+w&&this.my>=y&&this.my<y+h;
   rrect(x,y,w,h,8,hov?'#ffd23a':'rgba(8,16,34,.88)',hov?'#fff':'#2de2f5',1.5);text(it.t,x+w/2,y+h/2+4,11,hov?'#102':'#fff','center',null);
   this.add(x,y,w,h,{hl:false,click:()=>{SFX.move();if(it.fn)it.fn();else this.btn(it.b);}});x+=w+gap;});}};
function muiPos(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height];}
// fingers on the on-screen pad (touch.js) belong to the pad, not to the menu under it
function muiOnTouchPad(x,y){if(typeof TOUCH==='undefined'||!TOUCH.on||typeof TB==='undefined')return false;const d=TB.dpad;if(Math.hypot(x-d.x,y-d.y)<d.r*1.25)return true;
 for(const k of ['A','X','Y','B','S']){const b=TB[k];if(b.r?Math.hypot(x-b.x,y-b.y)<b.r+8:(Math.abs(x-b.x)<b.w/2+6&&Math.abs(y-b.y)<b.h/2+8))return true;}return false;}
canvas.addEventListener('pointerdown',e=>{const [x,y]=muiPos(e);if(e.pointerType==='mouse'){MUI.lastMouse=TIME;MUI.mx=x;MUI.my=y;}
 else if(muiOnTouchPad(x,y))return;
 if(e.button===2){const o=MUI.at(x,y,o=>o.right||o.wheel);if(o){e.preventDefault();if(o.right)o.right();else o.wheel(-1);}return;}
 if(e.button!==0&&e.pointerType==='mouse')return;
 const o=MUI.at(x,y,o=>o.click||o.down);if(!o)return;e.preventDefault();if(typeof unlockAudio==='function')unlockAudio();
 if(o.down){const d=o.down(x,y);if(d){MUI.drag=d;try{canvas.setPointerCapture(e.pointerId);}catch(_){}}}else o.click(x,y);});
canvas.addEventListener('pointermove',e=>{const [x,y]=muiPos(e);if(e.pointerType==='mouse'){MUI.lastMouse=TIME;MUI.mx=x;MUI.my=y;MUI.moved=true;}
 if(MUI.drag&&MUI.drag.move)MUI.drag.move(x,y);});
['pointerup','pointercancel'].forEach(t=>canvas.addEventListener(t,()=>{const d=MUI.drag;MUI.drag=null;if(d&&d.up)d.up();}));
canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'){MUI.mx=-1;MUI.my=-1;}});
canvas.addEventListener('contextmenu',e=>{if(MUI.hits.length)e.preventDefault();});
// mouse wheel: one notch = one step; trackpads add up until they reach a step
canvas.addEventListener('wheel',e=>{const [x,y]=muiPos(e);MUI.lastMouse=TIME;MUI.mx=x;MUI.my=y;const o=MUI.at(x,y,o=>o.wheel);if(!o)return;e.preventDefault();
 let d=0;if(Math.abs(e.deltaY)>=50)d=e.deltaY<0?1:-1;else{MUI.wheelAcc+=e.deltaY;if(Math.abs(MUI.wheelAcc)>=60){d=MUI.wheelAcc<0?1:-1;MUI.wheelAcc=0;}}
 if(d)o.wheel(d);},{passive:false});
// pressed buttons go in after the keyboard/gamepad poll; the box list is cleared before each new draw
const _muiPoll=pollInput;
// Music Room screens: Esc = back (MUI.esc), and holding a direction (or Y/X in the studio) repeats it
const MUI_SCENES=['musicroom','songlist','jukebox','themepicker','groove'],MUI_HOLD={},MUI_REP=['up','down','left','right','gadget','attack'];let muiEscWas=false,muiLast=0;
pollInput=function(){_muiPoll();const now=performance.now()/1000,dt=Math.min(.1,now-muiLast);muiLast=now;
 const inRoom=typeof scene!=='undefined'&&scene&&MUI_SCENES.includes(scene.name);
 MUI.esc=inRoom&&!!KEYS.Escape&&!muiEscWas;muiEscWas=!!KEYS.Escape;
 for(const b of MUI_REP){const held=INPUT[0][b]||INPUT[1][b];if(!held||!inRoom||(b==='gadget'||b==='attack')&&scene.name!=='groove'){MUI_HOLD[b]=0;continue;}
  const t0=MUI_HOLD[b]||0,t1=t0+dt;MUI_HOLD[b]=t1;if(t0>=.34&&Math.floor((t1-.34)/.07)>Math.floor((t0-.34)/.07)){PREV[0][b]=false;PREV[1][b]=false;INPUT[0][b]=true;}}
 for(const b of MUI.press){INPUT[0][b]=true;PREV[0][b]=false;}MUI.press.clear();MUI.hits=[];};
// hover outline + pointer cursor, drawn over the scene
function drawMouseHover(){const o=MUI.mouseRecent()?MUI.at(MUI.mx,MUI.my):null;canvas.style.cursor=o?'pointer':'';if(!o)return;
 if(MUI.moved&&o.hover)o.hover();MUI.moved=false;if(o.hl===false||MUI.drag)return;
 ctx.save();rrect(o.x,o.y,o.w,o.h,5,'rgba(255,255,255,.10)','rgba(255,255,255,.85)',1.5);
 if(o.arrows){ctx.fillStyle='#ffd23a';const cy=o.y+o.h/2;for(const [x,s] of [[o.x+4,1],[o.x+o.w-4,-1]]){ctx.beginPath();ctx.moveTo(x,cy);ctx.lineTo(x+s*6,cy-5);ctx.lineTo(x+s*6,cy+5);ctx.closePath();ctx.fill();}}
 ctx.restore();}
const _muiDrawTouch=drawTouch;
drawTouch=function(){drawMouseHover();_muiDrawTouch();};
