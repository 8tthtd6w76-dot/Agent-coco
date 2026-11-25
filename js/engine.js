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
addEventListener('keydown',e=>{KEYS[e.code]=true;if(e.code.startsWith('Arrow')||e.code==='Space'||e.code==='Tab')e.preventDefault();});
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
function pollInput(){
 for(let p=0;p<2;p++)for(const b of BTN)PREV[p][b]=INPUT[p][b];
 const pads=(navigator.getGamepads?navigator.getGamepads():[])||[];const live=[];
 for(const g of pads)if(g&&g.connected)live.push(g);
 for(let p=0;p<2;p++){
  const I=INPUT[p];for(const b of BTN){I[b]=KMAP[p][b].some(k=>KEYS[k]);}
  const g=live[p];
  if(g){const bt=i=>g.buttons[i]&&g.buttons[i].pressed;const ax=g.axes;
   I.ok=I.ok||bt(0);I.jump=I.jump||bt(0);I.attack=I.attack||bt(2)||bt(1);I.gadget=I.gadget||bt(3)||bt(5)||bt(7);
   I.start=I.start||bt(9);I.back=I.back||bt(8)||bt(1)&&false;
   I.left=I.left||bt(14)||ax[0]<-0.5;I.right=I.right||bt(15)||ax[0]>0.5;
   I.up=I.up||bt(12)||ax[1]<-0.6;I.down=I.down||bt(13)||ax[1]>0.6;
   I.jump=I.jump||bt(4);I.back=I.back||bt(1);}
 }
 if(typeof touchApply==='function')touchApply(INPUT[0]);  // on-screen buttons (touch.js) drive Player 1
 // solo: one player may use either keyboard half (and Space also jumps), so the game never needs a second player
 if(typeof NPLAYERS!=='undefined'&&NPLAYERS===1){const A=INPUT[0],B=INPUT[1];for(const b of BTN)A[b]=A[b]||B[b];if(KEYS['Space'])A.jump=true;}
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
 if(typeof drawOverlay==='function')drawOverlay(dt);}  // achievement banner (achievements.js)
// mute toggle
addEventListener('keydown',e=>{if(e.code==='KeyP'&&scene&&scene.name!=='level'){}if(e.code==='KeyN'){muted=!muted;}});
addEventListener('pointerdown',()=>{audio()&&AC.state==='suspended'&&AC.resume();},{once:false});
