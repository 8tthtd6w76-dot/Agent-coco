// ===== Laser Vault Stealth: top-down sneaking mission mode (v0.17) =====
// LEVEL_DEFS entry with type:'stealth' and floors:[{name, map:[20 strings of 20 chars], guards, cams, lasers}].
// Map: # wall, c crate (blocks walking and sight), s shadow floor (guards see you at half range), . floor,
//  P start, K keycard, E exit door (needs the floor's keycard), C clue, $ coin.
// Guards walk their path (tile waypoints). Vision cones fill the shared ALERT meter; full meter = alarm, guards chase.
// Lasers blink on/off ({a:[x,y],b:[x,y]} in tile-corner units, on/off seconds, ph phase). Cameras sweep.
// Controls: move with D-pad/stick. ATTACK from behind a guard = karate takedown (dizzy 12s).
//  GADGET = toss a pizza crust; nearby guards go sniff it. Getting caught costs a team heart and restarts the floor.
const ST_T=32,ST_Y0=32,ST_C=20,ST_R=14;

// ---------- music: a sneaky spy groove and an alarm groove, built with the Music Room song format ----------
(function(){if(typeof registerSong!=='function')return;
 const b16='.'.repeat(16);
 registerSong('vault_sneak',{name:'Vault Sneak',bpm:92,sw:2,key:9,sc:0,pr:1,kit:2,bi:2,ci:4,li:4,pad:1,skin:4,
  k:'x.......x.x.....',s:'....x.......x...',c:b16,h:'..x...x...x...x.',O:b16,p:'.x...x.....x..x.',
  bass:'2..2..5.2...7.5.',ch:'...x.......x....',lead:'e...g.h...g.e...'+'................'+'e...g.h...j.h.g.'+'f...............'});
 registerSong('vault_alarm',{name:'Vault Alarm!',bpm:132,sw:1,key:9,sc:0,pr:1,kit:3,bi:1,ci:3,li:2,pad:0,skin:2,
  k:'x...x...x...x...',s:'....x.......x...',c:'....x.......x..x',h:'xxxxxxxxxxxxxxxx',O:b16,p:b16,
  bass:'2.2.2.2.5.5.7.7.',ch:'x..x..x...x..x..',lead:'j.j.j.j.h.h.h.h.'+'j.j.j.j.k.k.k.k.'+'j.j.j.j.h.h.h.h.'+'g.g.g.g.h.h.h.h.'});
 TR.vault_sneak.title='Vault Sneak';TR.vault_sneak.desc='Tiptoe spy funk for the stealth missions.';
 TR.vault_alarm.title='Vault Alarm!';TR.vault_alarm.desc='The alarm went off. RUN (funkily).';
 if(typeof MUSIC_LIST!=='undefined')MUSIC_LIST.push({name:'vault_sneak',title:TR.vault_sneak.title,desc:TR.vault_sneak.desc},{name:'vault_alarm',title:TR.vault_alarm.title,desc:TR.vault_alarm.desc});})();

// ---------- the first stealth mission ----------
const ST_CLUE0=CLUES.length;
CLUES.push({lvl:9,name:'Vault Ledger 1912',text:'The old bank ledger: 40 gold bars stored in the vault in 1912. Never taken out.'},
 {lvl:9,name:'Fresh Tunnel Dust',text:'Brick dust on the records hall floor. Someone is tunneling in from below.'},
 {lvl:9,name:'Hardhat Footprints',text:'Muddy boot prints lead right up to the vault door. The hardhat crew got here first.'});
LEVELS.splice(5,0,{id:9,name:'Old Bank Vault (Stealth)',terr:'Gilbert',x:500,y:364,icon:'stealth_eye',req:1,blurb:'Bonus stealth mission! Sneak into the old bank past guards, cameras and lasers. Opens after Mission 1.'});
LEVEL_CODES.VAULT=9;
LEVEL_DEFS[9]={id:9,type:'stealth',music:'vault_sneak',title:'OLD BANK VAULT',sub:'Stealth mission: Gilbert Heritage District',
 goal:'Grab the keycard on each floor, then reach the exit. Stay out of the light!',
 intro:['The crew is digging toward the old Gilbert bank. Let\'s see what they\'re after. Quietly.',
  'Guards see in a cone. Shadows (dark floor) make you harder to spot. Red lasers blink on and off: time it!',
  'Sneak up BEHIND a guard and press ATTACK for a karate takedown. GADGET tosses a pizza crust to distract them.',
  'Each floor has a keycard. Grab it, then head for the exit door. If the alert meter fills, the alarm goes off. Run and hide!'],
 introExpr:['thinking','smug','wink','proud'],
 outro:{lines:['The vault is empty, but there\'s a fresh tunnel under the floor. They\'re digging for the 1912 gold.','We need to find out where that tunnel goes. Nice sneaking, agents!'],expr:['alarmed','proud']},
 winText:'VAULT CRACKED!',reward:{base:140,perClue:50,perKill:5,tips:20},
 floors:[
  {name:'FLOOR 1: BANK LOBBY',map:[
   '####################',
   '#P.....#.....c....K#',
   '#......#.....c.....#',
   '#..cc..#..sss......#',
   '#......#..sss...cc.#',
   '#..................#',
   '####..########..####',
   '#..........#.......#',
   '#..sss.....#..cc...#',
   '#..sss..$..#.......#',
   '#.......C......$...#',
   '#####.....##.......#',
   '#E........##.......#',
   '####################'],
   guards:[{path:[[8,5],[18,5],[18,2],[14,2],[14,5]],sp:42},{path:[[2,7],[9,7],[9,10],[2,10]],sp:38}],
   cams:[{x:18.5,y:7.2,a:Math.PI,sw:.65,r:175}],lasers:[]},
  {name:'FLOOR 2: RECORDS HALL',map:[
   '####################',
   '#P..#..........#..K#',
   '#...#..cc..cc..#...#',
   '#...#..........#...#',
   '#...#..cc..cc..#...#',
   '#..................#',
   '#..ssss....ssss....#',
   '###.##########.#####',
   '#..................#',
   '#..cc..sss..cc..$..#',
   '#..........C.......#',
   '#..cc..sss..cc.....#',
   '#$................E#',
   '####################'],
   guards:[{path:[[2,5],[17,5]],sp:45},{path:[[2,10],[17,10]],sp:40},{path:[[15,8],[15,12],[5,12],[15,12]],sp:40}],
   cams:[],lasers:[{a:[15.5,5],b:[15.5,7],on:1.5,off:1.4,ph:0},{a:[14,7.5],b:[15,7.5],on:1,off:1.2,ph:.6},{a:[9.5,8],b:[9.5,13],on:2,off:1.6,ph:1}]},
  {name:'FLOOR 3: THE VAULT',map:[
   '####################',
   '#P.......#.......K.#',
   '#..ss....#..c...c..#',
   '#..ss....#.........#',
   '#........#..c...c..#',
   '#....##..#.........#',
   '#....##........ss..#',
   '#........#######.###',
   '##.#######.........#',
   '#.........ss...$...#',
   '#..ss.....ss..C....#',
   '#..ss..######.######',
   '#$.....#E.....$....#',
   '####################'],
   guards:[{path:[[10,3],[18,3],[18,5],[10,5]],sp:46},{path:[[1,9],[18,9]],sp:44},{path:[[2,10],[2,12],[6,12],[2,12]],sp:36}],
   cams:[{x:18.6,y:8.4,a:Math.PI*.8,sw:.5,r:185},{x:8.6,y:1.4,a:Math.PI*.75,sw:.55,r:160}],
   lasers:[{a:[9.5,6],b:[9.5,7],on:1.2,off:1.1,ph:0},{a:[16,7.5],b:[17,7.5],on:1.4,off:1,ph:.5},{a:[13,11.5],b:[14,11.5],on:1,off:1,ph:.3},{a:[12.5,9],b:[12.5,11],on:2,off:1.5,ph:1.2}]}]};

// ---------- helpers ----------
function stAng(a){while(a>Math.PI)a-=Math.PI*2;while(a<-Math.PI)a+=Math.PI*2;return a;}
function segDist(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,l=dx*dx+dy*dy||1;let t=((px-ax)*dx+(py-ay)*dy)/l;t=Math.max(0,Math.min(1,t));return Math.hypot(px-ax-dx*t,py-ay-dy*t);}

function makeStealth(def,np){
 const S={name:'stealth',def,np,state:'intro',introIdx:0,outroIdx:0,t:0,paused:false,fi:0,hearts:3,alert:0,alarm:0,clues:[],coins:0,kos:0,
  floats:[],crusts:[],banner:0,caughtT:0,endT:0,players:[],laserHits:0,alarms:0,decoys:0};
 const R=(typeof achRunStart==='function')?achRunStart(def,np):{};S.R=R;
 const solid=(c,r)=>{if(c<0||r<0||c>=ST_C||r>=ST_R)return true;const k=S.map[r][c];return k==='#'||k==='c';};
 const tileAt=(x,y)=>{const c=Math.floor(x/ST_T),r=Math.floor((y-ST_Y0)/ST_T);return (c<0||r<0||c>=ST_C||r>=ST_R)?'#':S.map[r][c];};
 const blocked=(x,y)=>{const k=tileAt(x,y);return k==='#'||k==='c';};
 const tc=(c,r)=>[c*ST_T+ST_T/2,ST_Y0+r*ST_T+ST_T/2];
 function los(x1,y1,x2,y2){const d=Math.hypot(x2-x1,y2-y1),n=Math.ceil(d/8);for(let i=1;i<n;i++){const k=i/n;if(blocked(x1+(x2-x1)*k,y1+(y2-y1)*k))return false;}return true;}
 // BFS path for chasing guards: returns the next tile centre toward the target
 function nextStep(fx,fy,tx,ty){const sc=Math.floor(fx/ST_T),sr=Math.floor((fy-ST_Y0)/ST_T),gc=Math.floor(tx/ST_T),gr=Math.floor((ty-ST_Y0)/ST_T);
  if(sc===gc&&sr===gr)return [tx,ty];const prev=new Int16Array(ST_C*ST_R).fill(-1),q=[gr*ST_C+gc];prev[gr*ST_C+gc]=gr*ST_C+gc;
  while(q.length){const cur=q.shift(),c=cur%ST_C,r=(cur-c)/ST_C;if(c===sc&&r===sr){const n=prev[cur],nc=n%ST_C;return tc(nc,(n-nc)/ST_C);}
   for(const [dc,dr] of [[1,0],[-1,0],[0,1],[0,-1]]){const nc=c+dc,nr=r+dr;if(solid(nc,nr))continue;const id=nr*ST_C+nc;if(prev[id]>=0)continue;prev[id]=cur;q.push(id);}}
  return [tx,ty];}
 function loadFloor(keepItems){const F=def.floors[S.fi];S.map=F.map;S.alert=0;S.alarm=0;S.crusts=[];
  if(!keepItems){S.items=[];S.hasKey=false;S.map.forEach((row,r)=>{for(let c=0;c<ST_C;c++){const k=row[c],[x,y]=tc(c,r);
   if(k==='P')S.start=[x,y];if(k==='K')S.items.push({k:'key',x,y});if(k==='C')S.items.push({k:'clue',x,y,i:(def.clue0!=null?def.clue0:ST_CLUE0)+S.fi});if(k==='$')S.items.push({k:'coin',x,y});if(k==='E')S.exit=[x,y];}});
   R.coinTotal=(R.coinTotal||0)+S.items.filter(i=>i.k==='coin').length;}
  S.players=[];for(let i=0;i<np;i++){const ch=i?p2Char():p1Char();S.players.push({i,ch,x:S.start[0]+i*18,y:S.start[1],face:1,dir:0,moving:false,t:0,hp:S.hearts,down:false,inv:1});}
  S.guards=F.guards.map(g=>{const [x,y]=tc(g.path[0][0],g.path[0][1]);return {path:g.path.map(p=>tc(p[0],p[1])),wp:1,x,y,dir:0,sp:g.sp,state:'patrol',t:0,dizzy:0,look:0,sees:false,walk:0};});
  S.cams=(F.cams||[]).map(c=>({x:c.x*ST_T,y:ST_Y0+c.y*ST_T,a0:c.a,sw:c.sw,r:c.r,a:c.a,sees:false}));
  S.lasers=(F.lasers||[]).map(l=>({ax:l.a[0]*ST_T,ay:ST_Y0+l.a[1]*ST_T,bx:l.b[0]*ST_T,by:ST_Y0+l.b[1]*ST_T,on:l.on,off:l.off,ph:l.ph||0,live:false}));}
 S.fi=0;loadFloor(false);S.banner=2;
 const float=(x,y,t,c='#fff')=>S.floats.push({x,y,t,c,life:1.3});
 const inShadow=p=>tileAt(p.x,p.y)==='s';
 function canSee(ox,oy,dir,half,range,p){const d=Math.hypot(p.x-ox,p.y-oy),r=inShadow(p)?range*.5:range;if(d>r)return 0;
  if(Math.abs(stAng(Math.atan2(p.y-oy,p.x-ox)-dir))>half)return 0;if(!los(ox,oy,p.x,p.y))return 0;return 1-d/r;}
 function setAlarm(target){if(S.alarm<=0){S.alarms++;playStinger('lose');startMusic('vault_alarm');float(W/2,120,'ALARM!','#ff5a5a');}S.alarm=7;S.alert=1;
  for(const g of S.guards)if(g.dizzy<=0){g.state='chase';g.target=target;}}
 function caught(p){S.hearts--;S.R.hits=(S.R.hits||0)+1;SFX.hurt();float(p.x,p.y-40,'CAUGHT!','#ff5a8a');
  if(S.hearts<=0){S.hearts=0;finish(false);return;}S.caughtT=1.4;}
 function finish(win){S.state='end';S.win=win;S.endT=0;stopMusic();playStinger(win?'win':'lose');}
 function payout(){for(const p of S.players)p.hp=S.hearts;S.R.kos=S.kos;S.R.coinsGot=S.coins;S.R.oops=0;S.R.t=S.R.t||0;
  if(typeof lv==='function'){const V=lv(def.id);if(S.alarms===0)V.ghost=1;if(S.laserHits===0)V.noLaser=1;if(S.kos===0)V.pacifistSt=1;}
  missionPayout(def,np,{clues:S.clues,coins:S.coins,kills:S.kos,total:def.floors.length});}
 S.enter=function(){startMusic(def.music||'vault_sneak');};
 S.resume=function(){};
 S.update=function(dt){S.t+=dt;
  for(const f of S.floats){f.life-=dt;f.y-=24*dt;}S.floats=S.floats.filter(f=>f.life>0);
  if(S.state==='intro'){if(anyPressed('ok')||anyPressed('attack')){SFX.move();S.introIdx++;if(S.introIdx>=def.intro.length)S.state='play';}return;}
  if(S.state==='outro'){S.endT+=dt;if(S.endT>.4&&(anyPressed('ok')||anyPressed('attack'))){SFX.move();S.outroIdx++;S.endT=0;if(S.outroIdx>=def.outro.lines.length)payout();}return;}
  if(S.paused)return;
  if(S.state==='end'){S.endT+=dt;if(S.endT>2.2){if(S.win){S.state='outro';S.outroIdx=0;S.endT=0;startMusic('cutscene');}else Results.show({win:0,name:levelName(def.id),id:def.id});}return;}
  if(anyPressed('start')){S.paused=true;push(Watch.make('level'));return;}
  if(S.banner>0)S.banner-=dt;
  if(S.caughtT>0){S.caughtT-=dt;if(S.caughtT<=0){loadFloor(true);startMusic(def.music||'vault_sneak');}return;}
  S.R.t=(S.R.t||0)+dt;
  // players
  for(const p of S.players){const I=INPUT[p.i];let mx=(I.right?1:0)-(I.left?1:0),my=(I.down?1:0)-(I.up?1:0);
   if(np===1){const J=INPUT[1];mx=mx||((J.right?1:0)-(J.left?1:0));my=my||((J.down?1:0)-(J.up?1:0));}
   const m=Math.hypot(mx,my);p.moving=m>0;p.inv=Math.max(0,p.inv-dt);
   if(m){mx/=m;my/=m;if(mx)p.face=mx>0?1:-1;p.dir=Math.atan2(my,mx);const sp=100*(cheatOn('turbo')?1.3:1),rr=9;
    const nx=p.x+mx*sp*dt;if(!blocked(nx+rr*Math.sign(mx),p.y-6)&&!blocked(nx+rr*Math.sign(mx),p.y+6))p.x=nx;
    const ny=p.y+my*sp*dt;if(!blocked(p.x-6,ny+rr*Math.sign(my))&&!blocked(p.x+6,ny+rr*Math.sign(my)))p.y=ny;p.t+=dt;}
   const act=pressed(p.i,'attack')||(np===1&&pressed(1,'attack'));
   if(act){let done=false;for(const g of S.guards){if(g.dizzy>0)continue;const d=Math.hypot(g.x-p.x,g.y-p.y);if(d>34)continue;
     const behind=Math.abs(stAng(Math.atan2(p.y-g.y,p.x-g.x)-g.dir))>1.2||g.state==='investigate'&&g.look>0;
     if(behind&&g.state!=='chase'){g.dizzy=12;g.state='patrol';S.kos++;bump&&bump('kos');SFX.smash();float(g.x,g.y-40,'KA-CHOP!','#ffd23a');done=true;break;}
     else{float(p.x,p.y-40,'THEY SEE YOU!','#ff9ac0');SFX.hurt();done=true;break;}}
    if(!done)SFX.whoosh();p.chop=.25;}
   if(p.chop>0)p.chop-=dt;
   const gad=pressed(p.i,'gadget')||(np===1&&pressed(1,'gadget'));p.cd=Math.max(0,(p.cd||0)-dt);
   if(gad){if(p.cd>0){float(p.x,p.y-40,'RELOADING...','#9fb');}else{let tx=p.x,ty=p.y;const dx=Math.cos(p.dir||0),dy=Math.sin(p.dir||0);for(let k=0;k<90;k+=6){if(blocked(p.x+dx*k,p.y+dy*k))break;tx=p.x+dx*k;ty=p.y+dy*k;}
     S.crusts.push({x:tx,y:ty,life:4,fx:p.x,fy:p.y,fly:0});p.cd=4;S.decoys++;bump&&bump('gadgets');SFX.gadget();
     for(const g of S.guards)if(g.dizzy<=0&&g.state!=='chase'&&Math.hypot(g.x-tx,g.y-ty)<170){g.state='investigate';g.tx=tx;g.ty=ty;g.look=0;}}}
   // items
   for(const it of S.items){if(it.got||Math.hypot(it.x-p.x,it.y-p.y)>20)continue;it.got=true;
    if(it.k==='key'){S.hasKey=true;playStinger('unlock');float(it.x,it.y-30,'KEYCARD!','#7ff');}
    else if(it.k==='coin'){S.coins++;SFX.pick();float(it.x,it.y-20,'+$','#ffd23a');bump&&bump('coins');}
    else if(it.k==='clue'){S.clues.push(it.i);playStinger('clue');float(it.x,it.y-30,'CLUE: '+CLUES[it.i].name,'#ffd23a');}}
   if(Math.hypot(S.exit[0]-p.x,S.exit[1]-p.y)<22){if(S.hasKey){SFX.ok();if(S.fi+1>=def.floors.length){finish(true);return;}S.fi++;loadFloor(false);S.banner=2;startMusic(def.music||'vault_sneak');return;}
    else if(!p.lockMsg){float(S.exit[0],S.exit[1]-30,'LOCKED: find the keycard','#ff9ac0');p.lockMsg=1.5;}}
   if(p.lockMsg>0)p.lockMsg-=dt;}
  for(const c of S.crusts){c.life-=dt;c.fly=Math.min(1,c.fly+dt*4);}S.crusts=S.crusts.filter(c=>c.life>0);
  // lasers
  for(const l of S.lasers){const per=l.on+l.off,ph=((S.t+l.ph)%per+per)%per;l.live=ph<l.on;
   if(l.live)for(const p of S.players)if(p.inv<=0&&segDist(p.x,p.y,l.ax,l.ay,l.bx,l.by)<9){p.inv=1.2;S.laserHits++;SFX.hurt();float(p.x,p.y-40,'LASER!','#ff5a5a');S.alert=Math.min(1,S.alert+.55);if(S.alert>=1)setAlarm(p);}}
  // cameras
  let seen=0,seenP=null;
  for(const c of S.cams){c.a=c.a0+Math.sin(S.t*.8)*c.sw;c.sees=false;for(const p of S.players){const k=canSee(c.x,c.y,c.a,.42,c.r,p);if(k>0){c.sees=true;if(k+.2>seen){seen=k+.2;seenP=p;}}}}
  // guards
  for(const g of S.guards){g.sees=false;if(g.dizzy>0){g.dizzy-=dt;continue;}
   let tx,ty,sp=g.sp;
   if(g.state==='chase'){const p=g.target&&S.players.includes(g.target)?g.target:S.players[0];[tx,ty]=nextStep(g.x,g.y,p.x,p.y);sp=g.sp*2.3;
    if(Math.hypot(p.x-g.x,p.y-g.y)<18){caught(p);return;}
    if(S.alarm<=0){g.state='patrol';}}
   else if(g.state==='investigate'){[tx,ty]=nextStep(g.x,g.y,g.tx,g.ty);if(Math.hypot(g.tx-g.x,g.ty-g.y)<10){g.look+=dt;tx=g.x;ty=g.y;g.dir+=dt*2.2;if(g.look>3){g.state='return';}}}
   else{if(g.state==='return'){const w=g.path[g.wp];[tx,ty]=nextStep(g.x,g.y,w[0],w[1]);if(Math.hypot(w[0]-g.x,w[1]-g.y)<6)g.state='patrol';}
    else{const w=g.path[g.wp];tx=w[0];ty=w[1];if(Math.hypot(tx-g.x,ty-g.y)<3){g.wp=(g.wp+1)%g.path.length;g.pause=.6;}}}
   if(g.pause>0){g.pause-=dt;continue;}
   const dx=tx-g.x,dy=ty-g.y,d=Math.hypot(dx,dy);if(d>1){const s=Math.min(d,sp*dt);g.x+=dx/d*s;g.y+=dy/d*s;const want=Math.atan2(dy,dx);g.dir+=stAng(want-g.dir)*Math.min(1,dt*8);g.walk+=s;}
   for(const p of S.players){const k=canSee(g.x,g.y,g.dir,.55,g.state==='chase'?200:150,p);if(k>0){g.sees=true;if(k>seen){seen=k;seenP=p;}}}}
  if(seen>0){S.alert=Math.min(1,S.alert+dt*(.55+seen*1.5));if(S.alert>=1)setAlarm(seenP);}
  else if(S.alarm>0){S.alarm-=dt;if(S.alarm<=0){S.alert=.6;startMusic(def.music||'vault_sneak');float(W/2,120,'They lost you. Phew!','#9fb');for(const g of S.guards)if(g.state==='chase')g.state='return';}}
  else S.alert=Math.max(0,S.alert-dt*.22);
 };
 // ---------- drawing ----------
 function drawTiles(){for(let r=0;r<ST_R;r++)for(let c=0;c<ST_C;c++){const k=S.map[r][c],x=c*ST_T,y=ST_Y0+r*ST_T;
   const PL=def.palette||{};if(k==='#'){ctx.fillStyle=PL.wall||'#2a2140';ctx.fillRect(x,y,ST_T,ST_T);ctx.fillStyle=PL.wallTop||'#3d3260';ctx.fillRect(x,y,ST_T,6);continue;}
   ctx.fillStyle=(c+r)%2?(PL.a||'#5b5470'):(PL.b||'#625a78');ctx.fillRect(x,y,ST_T,ST_T);
   if(k==='s'){ctx.fillStyle='rgba(8,4,24,.62)';ctx.fillRect(x,y,ST_T,ST_T);}
   if(k==='c'){rrect(x+3,y+3,ST_T-6,ST_T-6,4,'#9a6a3a','#1a0f08',2);ctx.strokeStyle='#5a3a1a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+6,y+6);ctx.lineTo(x+ST_T-6,y+ST_T-6);ctx.moveTo(x+ST_T-6,y+6);ctx.lineTo(x+6,y+ST_T-6);ctx.stroke();}
   if(k==='E'){rrect(x+3,y+2,ST_T-6,ST_T-4,4,S.hasKey?'#3aa35a':'#8a2a3a','#000',2);ctx.fillStyle='#ffd23a';ctx.fillRect(x+ST_T-11,y+ST_T/2-2,4,4);if(S.fi===def.floors.length-1){ctx.strokeStyle='#ffd23a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x+ST_T/2,y+ST_T/2,9,0,7);ctx.stroke();}if(typeof stExitLock==='function')stExitLock(x+ST_T/2,y+ST_T/2,S.hasKey);}}}
 function cone(ox,oy,dir,half,range,col){ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(ox,oy);const n=18;
  for(let i=0;i<=n;i++){const a=dir-half+2*half*i/n,dx=Math.cos(a),dy=Math.sin(a);let d=0;while(d<range&&!blocked(ox+dx*d,oy+dy*d))d+=6;ctx.lineTo(ox+dx*d,oy+dy*d);}
  ctx.closePath();ctx.fill();}
 function drawGuard(g){const dz=g.dizzy>0,fr=dz?'hurt_2':'walk_'+(1+Math.floor(g.walk/10)%4),flip=Math.cos(g.dir)<0;
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(g.x,g.y+10,12,5,0,0,7);ctx.fill();
  if(typeof stGuardArt==='function'&&stGuardArt(g,def,S.t));
  else if(SHEETS.hench_walker)drawSprite('hench_walker',fr,g.x,g.y+12,flip,1,.62);else{rrect(g.x-9,g.y-24,18,34,6,'#ffb020','#000',2);}
  if(dz){for(let i=0;i<3;i++){const a=TIME*4+i*2.1;text('*',g.x+Math.cos(a)*12,g.y-46+Math.sin(a)*4,14,'#ffd23a','center');}}
  else if(typeof stMark==='function'&&icoImg('st_alert'))stMark(g,g.y-48);
  else if(g.state==='chase')text('!',g.x,g.y-50,22,'#ff5a5a','center');else if(g.state==='investigate')text('?',g.x,g.y-50,20,'#ffd23a','center');else if(g.sees)text('?',g.x,g.y-50,16,'#fff','center');}
 const _td={};function tdSprite(ch){if(ch==='agent_sandy')return null;const k=ch==='agent_sisi'?'sisi':'coco';if(!_td[k]){const i=new Image();i.src='assets/topdown/'+k+'.png';_td[k]=i;}return _td[k];}
 function drawPlayer(p){ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(p.x,p.y+10,11,5,0,0,7);ctx.fill();
  const td=tdSprite(p.ch);
  if(td&&td.complete&&td.width){const row=S.caughtT>0?6:(Math.abs(Math.sin(p.dir))>.75?(Math.sin(p.dir)>0?0:1):2)+(inShadow(p)?3:0),col=S.caughtT>0?0:(p.moving?Math.floor(S.t*8)%4:0),fl=row%3===2&&p.face<0;
   ctx.save();ctx.globalAlpha=p.inv>0&&Math.floor(S.t*12)%2?0.4:(inShadow(p)?.8:1);ctx.translate(p.x,p.y+14);if(fl)ctx.scale(-1,1);ctx.drawImage(td,col*96,row*96,96,96,-24,-46,48,48);ctx.restore();
   text(p.i?'P2':'P1',p.x,p.y-34,10,CHARS[p.ch].tag,'center');return;}
  const fr=p.chop>0?(p.ch==='agent_coco'?'punch_1':'kick'):loopFrame(p.ch,p.moving?'run':'idle',S.t),f=outfitFilter(p.ch);
  if(f)ctx.filter=f;drawSprite(p.ch,(SHEETS[p.ch].frames[fr]?fr:loopFrame(p.ch,'idle',S.t)),p.x,p.y+12,p.face<0,p.inv>0&&Math.floor(S.t*12)%2?0.4:(inShadow(p)?.7:1),.42);ctx.filter='none';
  text(p.i?'P2':'P1',p.x,p.y-38,10,CHARS[p.ch].tag,'center');}
 function drawHud(){rrect(4,2,W-8,28,8,'rgba(6,20,36,.92)','#2de2f5',2);
  for(let i=0;i<3;i++)heart(18+i*22,12,i<S.hearts);
  if(!(typeof stHudIcons==='function'&&stHudIcons(S,def)))text('KEY',92,22,12,S.hasKey?'#7ff':'#456','left',null);imgC('markers/clue',138,16,20);text(S.clues.length+'/'+def.floors.length,150,21,13,'#ffd23a','left',null);text('$'+S.coins,186,21,13,'#fff','left',null);
  text('ALERT',248,21,12,S.alarm>0?'#ff5a5a':'#cfe','left',null);rrect(292,10,170,12,6,'#1a2240',null);
  rrect(292,10,Math.max(6,170*S.alert),12,6,S.alarm>0?(Math.floor(S.t*8)%2?'#ff2a2a':'#ffd23a'):S.alert>.6?'#ff7a3a':'#ffd23a',null);
  text(def.floors[S.fi].name,W-12,21,11,'#cfe','right',null);}
 S.draw=function(){drawTiles();
  for(const l of S.lasers){ctx.fillStyle='#552';ctx.fillRect(l.ax-3,l.ay-3,6,6);ctx.fillRect(l.bx-3,l.by-3,6,6);
   if(l.live){ctx.strokeStyle='rgba(255,40,40,.35)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(l.ax,l.ay);ctx.lineTo(l.bx,l.by);ctx.stroke();ctx.strokeStyle='#ff4a4a';ctx.lineWidth=2;ctx.stroke();}
   else{ctx.strokeStyle='rgba(255,90,90,.18)';ctx.setLineDash([3,6]);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(l.ax,l.ay);ctx.lineTo(l.bx,l.by);ctx.stroke();ctx.setLineDash([]);}}
  for(const g of S.guards)if(g.dizzy<=0)cone(g.x,g.y,g.dir,.55,g.state==='chase'?200:150,g.state==='chase'?'rgba(255,60,60,.28)':g.sees?'rgba(255,150,60,.3)':'rgba(255,240,150,.2)');
  for(const c of S.cams){cone(c.x,c.y,c.a,.42,c.r,c.sees?'rgba(255,80,80,.25)':'rgba(120,220,255,.16)');if(typeof stCamera==='function'&&stCamera(c))continue;rrect(c.x-7,c.y-5,14,10,3,'#ccd','#000',2);ctx.fillStyle=c.sees?'#f44':'#4f4';ctx.fillRect(c.x-2,c.y-2,4,4);}
  for(const it of S.items){if(it.got)continue;const b=Math.sin(TIME*4+it.x)*2;if(typeof stItem==='function'&&stItem(it,b))continue;
   if(it.k==='coin'){ctx.fillStyle='#ffd23a';ctx.strokeStyle='#6a4a00';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(it.x,it.y+b,6*Math.abs(Math.cos(TIME*3+it.x)+.2),7,0,0,7);ctx.fill();ctx.stroke();}
   else if(it.k==='key'){rrect(it.x-10,it.y-7+b,20,14,3,'#2de2f5','#000',2);ctx.fillStyle='#ffd23a';ctx.fillRect(it.x-6,it.y-2+b,8,3);ctx.globalAlpha=.4+.3*Math.sin(TIME*6);ctx.strokeStyle='#7ff';ctx.beginPath();ctx.arc(it.x,it.y+b,16,0,7);ctx.stroke();ctx.globalAlpha=1;}
   else imgC('markers/clue',it.x,it.y+b,28);}
  for(const c of S.crusts){const k=c.fly,x=c.fx+(c.x-c.fx)*k,y=c.fy+(c.y-c.fy)*k-Math.sin(k*Math.PI)*24;ctx.fillStyle='#e8b04a';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,6,Math.PI,0);ctx.closePath();ctx.fill();ctx.stroke();
   if(k>=1){ctx.globalAlpha=.5;text('~',x,y-10+Math.sin(TIME*5)*2,12,'#fff','center',null);ctx.globalAlpha=1;}}
  const ents=S.guards.map(g=>({y:g.y,d:()=>drawGuard(g)})).concat(S.players.map(p=>({y:p.y,d:()=>drawPlayer(p)})));ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
  if(S.alarm>0){ctx.fillStyle='rgba(255,0,0,'+(.08+.06*Math.sin(S.t*10))+')';ctx.fillRect(0,0,W,H);}
  for(const f of S.floats)text(f.t,Math.max(70,Math.min(W-70,f.x)),f.y,f.t.length>8?12:15,f.c,'center');
  drawHud();
  if(S.banner>0&&S.state==='play'){ctx.globalAlpha=Math.min(1,S.banner*2);rrect(W/2-160,H/2-30,320,50,12,'rgba(6,20,36,.92)','#ffd23a',2);text(def.floors[S.fi].name,W/2,H/2+2,18,'#ffd23a','center',null);ctx.globalAlpha=1;}
  if(S.caughtT>0){dim(.45);text('CAUGHT!',W/2,H/2-10,34,'#ff5a8a','center');text('Back to the start of the floor. Hearts left: '+S.hearts,W/2,H/2+20,14,'#fff','center',null);}
  if(S.state==='intro'){dim(.4);text(def.title,W/2,80,22,'#ffd23a','center');text(def.sub,W/2,104,13,'#cfe','center');const ex=def.introExpr;sandyBox(def.intro,ex[S.introIdx%ex.length],Math.min(S.introIdx,def.intro.length-1));}
  if(S.state==='play'&&S.t<9&&S.fi===0&&S.R.t<6){text(def.goal,W/2,H-12,12,'#fff','center');}
  if(S.state==='end'){dim(Math.min(.6,S.endT*.4));text(S.win?def.winText:'MISSION FAILED',W/2,H/2,32,S.win?'#ffd23a':'#ff5a8a','center');}
  if(S.state==='outro'){dim(.55);const ex=def.outro.expr;sandyBox(def.outro.lines,ex[S.outroIdx%ex.length],Math.min(S.outroIdx,def.outro.lines.length-1));}
  if(SAVE.testing)text('TESTING MODE',W/2,44,10,'#ff5ae0','center');};
 return S;}

// route type:'stealth' missions
const _startLevelSt=startLevel;
startLevel=function(l){const def=LEVEL_DEFS[l.id];if(def&&def.type==='stealth'){go(makeStealth(def,NPLAYERS));return;}return _startLevelSt.apply(this,arguments);};
// pause when the window loses focus
function stealthAutoPause(){if(scene&&scene.name==='stealth'&&scene.state==='play'&&!scene.paused){scene.paused=true;push(Watch.make('level'));}}
addEventListener('blur',stealthAutoPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)stealthAutoPause();});addEventListener('gamepaddisconnected',stealthAutoPause);

// ---------- stealth achievements (added to the Trophy Case) ----------
if(typeof ACH!=='undefined'){const add=(id,n,d,c,cash,ok,p,h)=>{a(id,n,d,c,cash,ok,p,h);const x=ACH[ACH.length-1];x.tier=x.cash>=100?3:x.cash>=50?2:x.cash>=20?1:0;ACH_BY[id]=x;
  const last=ACH.findIndex(y=>y.id==='f_all');if(last>=0){const L=ACH.splice(last,1)[0];ACH.push(L);}};
 add('m9_clear','Vault Visitor','Beat the Old Bank Vault stealth mission.','mission',20,()=>!!SAVE.done[9]);
 add('m9_clues','Vault Sleuth','Find all 3 clues in the Old Bank Vault.','mission',20,()=>cluesIn(9)>=3,()=>[cluesIn(9),3]);
 add('m9_ghost','Ghost in the Vault','Beat the Old Bank Vault without ever setting off the alarm.','mission',60,()=>!!lv(9).ghost);
 add('m9_nolaser','Laser Limbo','Beat the Old Bank Vault without touching a single laser.','mission',40,()=>!!lv(9).noLaser);
 add('m9_nocatch','Never Caught','Beat the Old Bank Vault without getting caught once.','mission',40,()=>!!lv(9).noHit);
 add('m9_coins','Vault Coin Vacuum','Grab every coin in the Old Bank Vault in one run.','mission',30,()=>!!lv(9).coinsAll);
 add('m9_pacifist','Shadow Only','Beat the Old Bank Vault without a single takedown and without an alarm.','mission',80,()=>!!lv(9).pacifistSt&&!!lv(9).ghost,null,1);
 add('m9_speed','Vault Sprint','Beat the Old Bank Vault in under 3:00 of play time.','mission',50,()=>lv(9).time>0&&lv(9).time<180,()=>lv(9).time?[0,0,'Best '+mmss(lv(9).time)]:null);}
