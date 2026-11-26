// ===== Controls: one place for the key layout labels, the Controls screen, and in-mission key hints =====
// The real bindings live in KMAP (engine.js). This file only DRAWS them, so keep the two in sync.
// Layout: Player 1 (Coco) owns the LEFT of the keyboard, Player 2 (Sisi) owns the RIGHT.
const CTL_P=[
 {tag:'PLAYER 1',who:'AGENT COCO',col:'#2de2f5',bg:'#0b3d58',short:'COCO',
  rows:[[['W'],'Jump / double jump'],[['A','S','D'],'Move'],[['F'],'Attack / combo'],[['G'],'Gadget'],[['Q'],'Swap gadget'],[['Tab'],'Pause / Watch']],
  hint:{move:'WASD',jump:'W',attack:'F',gadget:'G'}},
 {tag:'PLAYER 2',who:'AGENT SISI',col:'#ff6fb5',bg:'#5a1240',short:'SISI',
  rows:[[['↑'],'Jump / double jump'],[['←','↓','→'],'Move'],[['.'],'Attack / combo'],[['/'],'Gadget'],[['R Shift'],'Swap gadget'],[['Enter'],'Pause / Watch']],
  hint:{move:'ARROWS',jump:'↑',attack:'.',gadget:'/'}}];
// what each key does in each kind of mission, for the hint pills
const CTL_SCENE={
 level:[['move','move'],['jump','jump'],['attack','attack'],['gadget','gadget']],
 stealth:[['move','sneak'],['attack','takedown'],['gadget','gadget']],
 pursuit:[['move','steer'],['jump','hop']],
 delivery:[['move','ride'],['attack','toss pizza'],['gadget','boost']],
 hack:[['move','cursor'],['attack','turn'],['gadget','turn back']],
 // v0.46
 wirecut:[['move','pick wire'],['attack','cut'],['gadget','trace']],
 lockpick:[['jump','top lane'],['attack','bottom lane']],
 codedrop:[['move','move'],['jump','rotate'],['attack','rotate back'],['gadget','slam']]};
// v0.46: a player who last used a gamepad sees pad buttons in their pill instead of keys
const PAD_HINT={move:'STICK',jump:'A',attack:'X',gadget:'Y'};
function padLive(p){try{return [...(navigator.getGamepads?navigator.getGamepads():[])].filter(g=>g&&g.connected).length>p;}catch(e){return false;}}
function hintFor(P,p){return LAST_DEV==='pad'&&padLive(p)?Object.assign({},P,{hint:PAD_HINT}):P;}

function keycap(x,y,label,col,h){h=h||24;ctx.font='bold '+(label.length>1?11:13)+'px "Trebuchet MS",Verdana,sans-serif';
 const w=Math.max(h,Math.ceil(ctx.measureText(label).width)+14);
 rrect(x,y+2,w,h,6,'#050a14',null);rrect(x,y,w,h,6,'#16243a',col,2);
 text(label,x+w/2,y+h*0.7,label.length>1?11:13,'#fff','center',null);return w;}
function keycapsRow(x,y,labels,col,h){let cx=x;for(const l of labels)cx+=keycap(cx,y,l,col,h)+4;return cx-x-4;}

function drawControlsPanel(){
 dim(.84);rrect(24,24,592,432,16,'rgba(6,20,36,.97)','#2de2f5',3);
 text('CONTROLS',W/2,62,26,'#ffd23a','center');
 text('Two players share one keyboard: Player 1 on the left, Player 2 on the right.',W/2,84,13,'#cfe','center',null);
 CTL_P.forEach((P,i)=>{const x=40+i*288,w=272;
  rrect(x,98,w,34,10,P.bg,P.col,2);text(P.tag+'  ·  '+P.who,x+w/2,121,14,'#fff','center',null);
  P.rows.forEach((r,j)=>{const y=142+j*36;
   if(j%2===0)rrect(x,y-2,w,34,8,'rgba(255,255,255,.05)',null);
   keycapsRow(x+8,y+3,r[0],P.col);
   text(r[1],x+98,y+22,13,'#fff','left',null);});});
 // neutral keys and solo note
 rrect(40,362,560,34,10,'rgba(255,255,255,.06)','#456',1.5);
 let cx=52;[['Space','Confirm'],['Esc','Pause'],['N','Mute']].forEach(([k,t])=>{cx+=keycap(cx,368,k,'#9fb',22)+6;text(t,cx,384,12,'#cfe','left',null);cx+=ctx.measureText(t).width+22;});
 text('1 player: either side works.',588,384,12,'#ffd23a','right',null);
 // pads
 text('GAMEPAD   A jump  ·  X attack  ·  Y gadget  ·  Select swap gadget  ·  Start pause',W/2,418,12,'#fff','center',null);
 text('Pad 1 is Player 1 and pad 2 is Player 2. Press any pad button once so the game sees it.',W/2,436,11,'#9fb','center',null);
 text('Press Esc, Enter or A to close',W/2,451,11,'#9fb','center',null);}

// small pills at the bottom of the screen for the first seconds of a mission
let _hintScene=null,_hintT=0;
function hintPill(x,y,P,items,np){
 ctx.font='bold 12px "Trebuchet MS",Verdana,sans-serif';
 const cells=items.map(([k,l])=>({k:P.hint[k],l}));
 const showName=np===1,gap=np===2?7:12,nameW=showName?ctx.measureText(P.short).width+10:0;
 let w=14+nameW;
 for(const c of cells){ctx.font='bold 11px "Trebuchet MS",Verdana,sans-serif';const cw=Math.max(18,Math.ceil(ctx.measureText(c.k).width)+14);c.cw=cw;ctx.font='bold 12px "Trebuchet MS",Verdana,sans-serif';c.tw=ctx.measureText(c.l).width;w+=cw+4+c.tw+gap;}
 if(x==='r')x=W-8-w;else if(x==='c')x=(W-w)/2;
 rrect(x,y,w,26,10,'rgba(6,14,28,.88)',P.col,2);
 let cx=x+10;if(showName){text(P.short,cx,y+18,12,P.col,'left',null);cx+=nameW;}
 for(const c of cells){keycap(cx,y+4,c.k,P.col,18);cx+=c.cw+4;text(c.l,cx,y+18,12,'#fff','left',null);cx+=c.tw+gap;}}
function drawKeyHints(dt){
 if(typeof TOUCH!=='undefined'&&TOUCH.on)return;  // touch players see the on-screen buttons instead
 const s=scene;const items=s&&CTL_SCENE[s.name];
 if(s!==_hintScene){_hintScene=s;_hintT=items?9:0;}
 if(!items||s.paused||_hintT<=0||typeof NPLAYERS==='undefined')return;
 if(s.state&&s.state!=='intro'&&s.state!=='play')return;
 if(s.state!=='intro')_hintT-=dt;
 ctx.save();ctx.globalAlpha=Math.min(1,_hintT/1.5);
 const y=s.name==='stealth'?H-62:H-34;
 if(NPLAYERS>1){hintPill(8,y,hintFor(CTL_P[0],0),items,2);hintPill('r',y,hintFor(CTL_P[1],1),items,2);}
 else{const P=Object.assign({},CTL_P[0],{short:'1 PLAYER',hint:{move:'WASD / ARROWS',jump:'W / ↑',attack:'F / .',gadget:'G / /'}});hintPill('c',y,hintFor(P,0),items,1);}
 ctx.restore();}
