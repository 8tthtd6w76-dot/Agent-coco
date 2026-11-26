// ===== Agent Coco engine =====
const W=640,H=480;
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
canvas.width=W;canvas.height=H;
function fit(){const s=Math.min(innerWidth/W,innerHeight/H);canvas.style.width=W*s+'px';canvas.style.height=H*s+'px';}
addEventListener('resize',fit);fit();
const IMG={};
function loadAssets(cb){let n=0;const tot=ASSET_LIST.length+Object.keys(SHEETS).length;
 const done=()=>{n++;if(n>=tot)cb();};
 ASSET_LIST.forEach(([k,p])=>{const i=new Image();i.onload=done;i.onerror=done;i.src=p;IMG[k]=i;});
 for(const ch in SHEETS){}
 Object.keys(SHEETS).forEach(ch=>{const i=new Image();i.onload=done;i.onerror=done;i.src='assets/'+ch+'/sheet.png';IMG['sheet_'+ch]=i;});}
// ===== Input: Player 1 (Coco) owns the LEFT of the keyboard, Player 2 (Sisi) the RIGHT. Solo accepts both. See design/controls_layout_spec.md =====
const KEYS={};
// v0.46: KTAP remembers every key that went down since the last frame, so a very quick tap (down and up between two frames,
// easy on a slow frame on the Retroid) still counts as a press. LAST_DEV = what the player last used ('key','pad','touch'), for prompts.
const KTAP={};
let LAST_DEV=/Android/i.test(navigator.userAgent)?'pad':(matchMedia&&matchMedia('(pointer:coarse)').matches?'touch':'key');
addEventListener('keydown',e=>{KEYS[e.code]=true;if(!e.repeat){KTAP[e.code]=true;if(e.code!=='KeyN')LAST_DEV='key';}if(e.code.startsWith('Arrow')||e.code==='Space'||e.code==='Tab')e.preventDefault();});
addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.pointerType==='pen')LAST_DEV='touch';},true);
addEventListener('keyup',e=>{KEYS[e.code]=false;});
const BTN=['jump','attack','gadget','start','up','down','left','right','back','ok'];
function mkInput(){const o={};BTN.forEach(b=>o[b]=false);return o;}
const INPUT=[mkInput(),mkInput()],PREV=[mkInput(),mkInput()];
const KMAP=[
 // Player 1, left hand: WASD, W jumps, F attacks, G gadget, Q swaps gadget, Tab pauses. Space/Enter confirm in menus.
 {ok:['Space','Enter'],jump:['KeyW'],attack:['KeyF'],gadget:['KeyG'],start:['Tab','Escape'],up:['KeyW'],down:['KeyS'],left:['KeyA'],right:['KeyD'],back:['KeyQ','Backspace']},
 // Player 2, right hand: arrows, Up jumps, "." attacks, "/" gadget, Right Shift swaps gadget, Enter pauses. Numpad 1/2 still work on a full keyboard.
 {ok:['Space','Enter','NumpadEnter'],jump:['ArrowUp'],attack:['Period','Numpad1'],gadget:['Slash','Numpad2'],start:['Enter','Escape'],up:['ArrowUp'],down:['ArrowDown'],left:['ArrowLeft'],right:['ArrowRight'],back:['ShiftRight']}];
let padOf=[-1,-1];
// v0.46 stick feel: a direction turns on past 0.5 and only turns off again under 0.3 (no flicker when a thumb rests near the edge).
// STICK_MENU (set by input_feel.js on menu screens) keeps only the stronger axis, so a slightly diagonal push never moves the cursor twice.
// AXES[p] = the analog stick (-1..1, small dead zone removed) for modes that want smooth steering (Gadget Lab soldering).
const AXES=[{x:0,y:0},{x:0,y:0}],STK=[{},{}],PADWAS=[0,0];let STICK_MENU=false;
function dz(v){const a=Math.abs(v);return a<.18?0:Math.sign(v)*Math.min(1,(a-.18)/.72);}
function stickDir(p,ax,ay){const S=STK[p];let x=ax,y=ay;
 if(STICK_MENU){if(Math.abs(x)>Math.abs(y)*1.15)y=0;else if(Math.abs(y)>Math.abs(x)*1.15)x=0;else{x=S.l||S.r?x:0;y=x?0:y;}}
 S.l=x<(S.l?-.3:-.5);S.r=x>(S.r?.3:.5);S.u=y<(S.u?-.3:-.55);S.d=y>(S.d?.3:.55);return S;}
function pollInput(){
 for(let p=0;p<2;p++)for(const b of BTN)PREV[p][b]=INPUT[p][b];
 const pads=(navigator.getGamepads?navigator.getGamepads():[])||[];const live=[];
 for(const g of pads)if(g&&g.connected)live.push(g);
 for(let p=0;p<2;p++){
  const I=INPUT[p];for(const b of BTN){I[b]=KMAP[p][b].some(k=>KEYS[k]||KTAP[k]);}
  const g=live[p];AXES[p].x=0;AXES[p].y=0;
  if(g){const bt=i=>g.buttons[i]&&g.buttons[i].pressed;const ax=g.axes;
   const sx=dz(ax[0]||0),sy=dz(ax[1]||0);AXES[p].x=sx;AXES[p].y=sy;const S=stickDir(p,ax[0]||0,ax[1]||0);
   I.ok=I.ok||bt(0);I.jump=I.jump||bt(0);I.attack=I.attack||bt(2)||(!STICK_MENU&&bt(1));  /* on menus B is only Back, never also X */I.gadget=I.gadget||bt(3)||bt(5)||bt(7);
   I.start=I.start||bt(9);I.back=I.back||bt(8);
   I.left=I.left||bt(14)||S.l;I.right=I.right||bt(15)||S.r;
   I.up=I.up||bt(12)||S.u;I.down=I.down||bt(13)||S.d;
   I.jump=I.jump||bt(4);I.back=I.back||bt(1);
   if(bt(12))AXES[p].y=-1;if(bt(13))AXES[p].y=1;if(bt(14))AXES[p].x=-1;if(bt(15))AXES[p].x=1;
   let n=0;for(let i=0;i<g.buttons.length&&i<17;i++)if(bt(i))n++;if(S.l||S.r||S.u||S.d)n++;if(n>PADWAS[p])LAST_DEV='pad';PADWAS[p]=n;}
  else PADWAS[p]=0;
 }
 if(typeof touchApply==='function')touchApply(INPUT[0]);  // on-screen buttons (touch.js) drive Player 1
 // solo: one player may use either keyboard half (and Space also jumps), so the game never needs a second player
 if(typeof NPLAYERS!=='undefined'&&NPLAYERS===1){const A=INPUT[0],B=INPUT[1];for(const b of BTN)A[b]=A[b]||B[b];if(KEYS['Space']||KTAP['Space'])A.jump=true;}
 for(const k in KTAP)delete KTAP[k];
}
const pressed=(p,b)=>INPUT[p][b]&&!PREV[p][b];
const anyPressed=b=>pressed(0,b)||pressed(1,b);
const anyHeld=b=>INPUT[0][b]||INPUT[1][b];
// ===== Audio (tiny chiptune synth) =====
let AC=null;function audio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}}return AC;}
let muted=false;
function beep(f,d=0.1,type='square',v=0.06,slide=0){const a=audio();if(!a||muted||document.hidden)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f;if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+slide),a.currentTime+d);g.gain.value=v;g.gain.exponentialRampToValueAtTime(0.0001,a.currentTime+d);o.connect(g);g.connect((typeof MUS!=='undefined'&&MUS)?MUS.sfx:a.destination);o.start();o.stop(a.currentTime+d);}
const SFX={jump:()=>beep(380,.15,'square',.05,420),hit:()=>beep(150,.12,'sawtooth',.07,-90),pick:()=>{beep(660,.08);setTimeout(()=>beep(990,.12),70)},move:()=>beep(520,.04,'triangle',.05),ok:()=>{beep(440,.07);setTimeout(()=>beep(660,.1),60)},hurt:()=>beep(200,.25,'sawtooth',.08,-140),win:()=>[523,659,784,1047].forEach((f,i)=>setTimeout(()=>beep(f,.18),i*120)),gadget:()=>beep(900,.2,'sine',.06,-500),whoosh:()=>beep(260,.12,'triangle',.06,500),smash:()=>{beep(120,.18,'sawtooth',.09,-70);beep(700,.08,'square',.04,-400);}};
// Music lives in music.js (startMusic/stopMusic)
// ===== Scenes =====
let scene=null,sceneStack=[];
function go(s){scene=s;if(s.enter)s.enter();}
function push(s){sceneStack.push(scene);scene=s;if(s.enter)s.enter();}
function pop(){scene=sceneStack.pop();if(scene.resume)scene.resume();}
// ===== Helpers =====
const SAVE={xp:0,clues:[],done:{},coins:0,unlocked:{1:true}};
try{const s=localStorage.getItem('agentcoco');if(s)Object.assign(SAVE,JSON.parse(s));}catch(e){}
function save(){try{localStorage.setItem('agentcoco',JSON.stringify(SAVE));}catch(e){}}
function rank(){return SAVE.xp>=600?['Super Agent','rank_super_gold']:SAVE.xp>=200?['Agent','rank_agent_silver']:['Rookie','rank_rookie_bronze'];}
function img(k,x,y,w,h){const i=IMG[k];if(!i)return;ctx.drawImage(i,x,y,w||i.width,h||i.height);}
function imgC(k,cx,cy,h){const i=IMG[k];if(!i)return;const s=h/i.height;ctx.drawImage(i,cx-i.width*s/2,cy-h/2,i.width*s,h);}
function text(t,x,y,size=16,col='#fff',align='left',stroke='#000'){ctx.font=`bold ${size}px "Trebuchet MS",Verdana,sans-serif`;ctx.textAlign=align;ctx.textBaseline='alphabetic';if(stroke){ctx.lineWidth=Math.max(3,size/5);ctx.strokeStyle=stroke;ctx.lineJoin='round';ctx.strokeText(t,x,y);}ctx.fillStyle=col;ctx.fillText(t,x,y);}
function wrap(t,x,y,maxw,lh,size=13,col='#fff',stroke=null){ctx.font=`bold ${size}px "Trebuchet MS",Verdana,sans-serif`;const ws=t.split(' ');let line='';for(const w of ws){const test=line?line+' '+w:w;if(ctx.measureText(test).width>maxw&&line){text(line,x,y,size,col,'left',stroke);y+=lh;line=w;}else line=test;}if(line)text(line,x,y,size,col,'left',stroke);return y;}
function rrect(x,y,w,h,r,fill,stroke,lw=3){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=lw;ctx.strokeStyle=stroke;ctx.stroke();}}
// Sprite drawing: feet at (x,y), anchored per sheet
const SPR_SCALE=0.66;
function drawSprite(ch,frame,x,y,flip,alpha=1,scaleMul=1,sx=1,sy=1,rot=0){const S=SHEETS[ch],f=S.frames[frame]||S.frames.idle_1,im=IMG['sheet_'+ch];if(!im)return;
 const s=S.scale*SPR_SCALE*scaleMul;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,y);if(rot)ctx.rotate(rot);if(sx!==1||sy!==1)ctx.scale(sx,sy);if(flip)ctx.scale(-1,1);
 ctx.drawImage(im,f.x,f.y,f.w,f.h,-(f.ax!=null?f.ax:S.anchorX)*s,-(f.h-S.padBottom)*s,f.w*s,f.h*s);ctx.restore();}
function rand(a,b){return a+Math.random()*(b-a);}
// Main loop
let last=0,TIME=0;
function frame(t){requestAnimationFrame(frame);const dt=Math.min(0.05,(t-last)/1000||0.016);last=t;TIME+=dt;pollInput();
 if(scene){scene.update&&scene.update(dt);ctx.clearRect(0,0,W,H);scene.draw&&scene.draw();}
 if(typeof drawKeyHints==='function')drawKeyHints(dt);
 if(typeof drawTouch==='function')drawTouch();  // key hint pills at mission start (controls.js)
 if(typeof drawOverlay==='function')drawOverlay(dt);
 drawMuteTag(dt);}  // achievement banner (achievements.js)
// mute toggle
// v0.40: N no longer mutes while you are typing a code (TESTING, MOONJUMP, TORNADO... have an N in them and used to switch all sound off).
function typingText(e){const t=e&&e.target;return (typeof scene!=='undefined'&&scene&&(scene.name==='code'||scene.name==='groove'&&scene.naming!=null))||!!(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable));}
addEventListener('keydown',e=>{if(e.code==='KeyN'&&!e.repeat&&!typingText(e)){muted=!muted;MUTE_T=2.5;}});
let MUTE_T=0;  // shows a MUTED / SOUND ON pill for a moment after N, and a small MUTED tag while muted
function drawMuteTag(dt){if(MUTE_T>0)MUTE_T-=dt;if(!muted&&MUTE_T<=0)return;ctx.save();ctx.globalAlpha=MUTE_T>0?1:.75;
 const s=muted?(MUTE_T>0?'SOUND OFF  (press N to turn it back on)':'MUTED (N)'):'SOUND ON';ctx.font='bold 11px "Trebuchet MS",Verdana,sans-serif';const w=ctx.measureText(s).width+16;
 rrect(8,H-26,w,18,9,'rgba(6,20,36,.85)',muted?'#ff5a8a':'#7f7',2);text(s,8+w/2,H-13,11,'#fff','center',null);ctx.restore();}
addEventListener('pointerdown',()=>{audio()&&AC.state==='suspended'&&AC.resume();},{once:false});
