// ===== v0.46 control feel: one layer on top of pollInput for every screen (loaded right after mouse_ui.js) =====
// 1) Menus: hold a direction and the cursor keeps moving (after a short pause), like the Music Room already did.
// 2) Menus: the analog stick only moves along its stronger axis (engine.js STICK_MENU), so a diagonal push moves once.
// 3) Any new screen ignores button presses for a moment, so mashing A through a results card can't also pick the
//    first thing on the next screen.
// 4) Prompts follow the last thing you touched: "A: buy" reads "Space: buy" on the keyboard, A/B/X/Y on a pad or touch.
// Engine side (engine.js): quick key taps between two frames are never lost (KTAP), stick hysteresis, AXES[], LAST_DEV.
const MENU_SCENES=['title','map','watch','extras','lairmenu','shop','lab','equip','craft','trophies','eggshelf','dpick','charselect','results','dresults','story','ldmenu','ldshop'];
const STICK_MENU_SCENES=MENU_SCENES.concat(['code','musicroom','songlist','jukebox','themepicker','groove','studio']);
const FEEL_REP={delay:.36,rate:.085,mapRate:.16},FEEL_LOCK=.14;
const _feelHold=[{},{}];let _feelScene=null,_feelLock=0,_feelLast=0;
const _feelPoll=pollInput;
pollInput=function(){
 const now=performance.now()/1000,dt=Math.min(.1,now-(_feelLast||now));_feelLast=now;
 const nm=typeof scene!=='undefined'&&scene?scene.name:'';
 STICK_MENU=STICK_MENU_SCENES.includes(nm);
 const mouse=typeof MUI!=='undefined'&&MUI.press?new Set(MUI.press):new Set();
 _feelPoll();
 // new screen: swallow fresh button presses for a moment (mouse clicks still go through)
 if(scene!==_feelScene){_feelScene=scene;_feelLock=FEEL_LOCK;}
 if(_feelLock>0){_feelLock-=dt;for(let p=0;p<2;p++)for(const b of ['ok','back','start','attack','jump','gadget'])if(!mouse.has(b))PREV[p][b]=INPUT[p][b];}
 // hold-to-repeat on menus (the Music Room screens have their own in mouse_ui.js)
 const rep=MENU_SCENES.includes(nm)&&!(nm==='craft'&&scene.kind==='solder');
 const rate=nm==='map'&&scene.mode!=='list'?FEEL_REP.mapRate:FEEL_REP.rate;
 for(let p=0;p<2;p++)for(const b of ['up','down','left','right']){const H=_feelHold[p];
  if(!rep||!INPUT[p][b]){H[b]=0;continue;}
  const t0=H[b]||0,t1=t0+dt;H[b]=t1;const d=FEEL_REP.delay;
  if(t0>=d&&Math.floor((t1-d)/rate)>Math.floor((t0-d)/rate))PREV[p][b]=false;}
 // solo: Player 1 may use either stick
 if(typeof NPLAYERS!=='undefined'&&NPLAYERS===1&&!AXES[0].x&&!AXES[0].y){AXES[0].x=AXES[1].x;AXES[0].y=AXES[1].y;}
};
// stick or held keys as one number (-1..1) for smooth steering; keys give a full push
function feelAxis(p,neg,pos,axis){let v=AXES[p][axis]||0;if(INPUT[p][neg])v=-1;if(INPUT[p][pos])v=1;return v;}
function feelAxisAny(neg,pos,axis){const a=feelAxis(0,neg,pos,axis),b=feelAxis(1,neg,pos,axis);return Math.abs(a)>=Math.abs(b)?a:b;}

// ---------- prompts that follow the device ----------
const PT_KEY={A:'Space',B:'Q',X:'F',Y:'G',Start:'Esc',START:'Esc',Select:'Q',SELECT:'Q','D-pad':'Arrows',LB:'W',RB:'G'};
const PT_RE=/(^|[\s(\/])(A|B|X|Y|Start|START|Select|SELECT|D-pad|LB|RB)(?=:|  |\s?\/|\)| or [A-Z]| to | again| = | \+ )/g;
const PT_RE2=/(press |Press |PRESS )(A|B|X|Y|Start|START)\b/g;
const _ptCache=new Map();
function promptText(s){
 if(LAST_DEV!=='key'||typeof s!=='string'||s.length<2)return s;
 if(typeof scene!=='undefined'&&scene&&scene.name==='code')return s;  // letters are typed there
 let r=_ptCache.get(s);if(r!==undefined)return r;
 r=s.replace(PT_RE,(m,pre,t)=>pre+PT_KEY[t]).replace(PT_RE2,(m,pre,t)=>pre+PT_KEY[t]);
 if(_ptCache.size>4000)_ptCache.clear();_ptCache.set(s,r);return r;}
const _ptText=text,_ptWrap=wrap;
text=function(t,...a){return _ptText(promptText(t),...a);};
wrap=function(t,...a){return _ptWrap(promptText(t),...a);};
if(typeof MUI!=='undefined'&&MUI.chips){const _c=MUI.chips;MUI.chips=function(items,...a){return _c.call(this,items.map(it=>it&&typeof it.t==='string'?Object.assign({},it,{t:promptText(it.t)}):it),...a);};}
