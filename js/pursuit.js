// ===== Scooter Pursuit: top-down vertical chase mode (v0.18) =====
// LEVEL_DEFS entry with type:'pursuit'. Tail the getaway pickup up a 5-lane road (lane 0 = oncoming).
// Keep it in the GREEN band: too close fills SPOTTED (the driver dumps boxes and speeds off),
// too far fills LOST (fill it and they get away = mission failed). Oncoming cars and ramming the truck cost a heart; bumping cars and boxes slows you; puddles slip.
// Controls: Up = speed up, Down = brake, Left/Right = steer, JUMP = curb hop (over puddles and boxes),
//  GADGET = turbo boost (3 per run), ATTACK = snap a photo when a PHOTO OP is up and you are in the green band.
// Art: assets/pursuit/*.png cut from Michael's Seq 51/53/55 sheets by tools/pursuit_art.py (code shapes if missing).
const PU_ROAD0=160,PU_LANE=64,PU_LANES=5,PU_ROAD1=PU_ROAD0+PU_LANE*PU_LANES;
['car_red','car_teal','car_yellow','car_white','pickup','icecream','puddle','box','dog','side_agave','side_grass','side_tracks','side_cactus']
 .forEach(k=>ASSET_LIST.push(['pursuit/'+k,'assets/pursuit/'+k+'.png']));
const puImg=k=>{const i=IMG['pursuit/'+k];return i&&i.complete&&i.naturalWidth?i:null;};

(function(){if(typeof registerSong!=='function')return;
 registerSong('pursuit',{name:'Tailgate Funk',bpm:128,sw:1,key:2,sc:1,pr:0,kit:0,bi:0,ci:1,li:1,pad:0,skin:1,
  k:'x..x..x...x..x..',s:'....x.......x...',c:'............x...',h:'x.xxx.xxx.xxx.xx',O:'..x.......x.....',p:'.x...x...x...x..',
  bass:'2.2..2.52.2..7.5',ch:'.x..x..x.x..x..x',lead:'h.h.j.h.g...e...'+'h.h.j.h.k...j...'+'h.h.j.h.g...e.g.'+'h...g...e...d...'});
 TR.pursuit.title='Tailgate Funk';TR.pursuit.desc='Scooter chase groove. Keep them in sight!';
 if(typeof MUSIC_LIST!=='undefined')MUSIC_LIST.push({name:'pursuit',title:TR.pursuit.title,desc:TR.pursuit.desc});})();

const PU_CLUE0=CLUES.length;
CLUES.push({lvl:10,name:'Muddy License Plate',text:'Plate GLB-D1G, caked in tunnel mud. It belongs to Papa Johnny\'s company.'},
 {lvl:10,name:'Gold-Dusted Dirt',text:'The truck bed is full of tunnel dirt that sparkles. They\'re hauling dirt from the gold dig.'},
 {lvl:10,name:'Wrecking Yard Pass',text:'A gate pass taped to the dashboard: WRECKING YARD, NIGHT CREW.'});
LEVELS.splice(LEVELS.findIndex(l=>l.id===6),0,{id:10,name:'Getaway Truck (Scooter Pursuit)',terr:'Gilbert',x:548,y:394,icon:'vehicle_scooter',req:3,
 blurb:'Bonus chase! Tail the crew\'s pickup through Gilbert traffic on your scooter. Opens after Mission 3.'});
LEVEL_CODES.TAILGATE=10;
LEVEL_DEFS[10]={id:10,type:'pursuit',music:'pursuit',title:'GETAWAY TRUCK',sub:'Scooter pursuit: Gilbert Road',length:14000,
 goal:'Stay in the GREEN zone behind the truck. Too close and they spot you, too far and they get away!',
 intro:['That pickup just left the bank dig with a bed full of dirt. Let\'s see where they dump it.',
  'Tail them, but not too close! Stay in the green zone. UP speeds up, DOWN brakes.',
  'JUMP does a curb hop over puddles and boxes. GADGET is a turbo boost. Bumping cars slows you down, and the oncoming lane on the left costs a heart!',
  'When a PHOTO OP pops up, press ATTACK while you\'re in the green zone. Three photos = three clues!'],
 introExpr:['thinking','smug','wink','proud'],
 photos:[{at:.22,what:'the license plate'},{at:.52,what:'the cargo'},{at:.82,what:'the dashboard'}],
 outro:{lines:['They turned into the wrecking yard! So that\'s where all the dig dirt goes.','Papa Johnny\'s whole operation runs through that yard. Great tailing, agents!'],expr:['alarmed','proud']},
 winText:'TRUCK TRACKED!',reward:{base:130,perClue:50,perKill:0,tips:15}};

function makePursuit(def,np){
 const P={name:'pursuit',def,np,state:'intro',introIdx:0,outroIdx:0,t:0,paused:false,hearts:3,spotted:0,lost:0,clues:[],coins:0,
  floats:[],cars:[],props:[],coinsL:[],dogs:[],camY:0,photoI:0,photo:null,endT:0,spots:0,hops:0,coinTotal:0,crashes:0};
 const R=(typeof achRunStart==='function')?achRunStart(def,np):{};P.R=R;
 const laneX=l=>PU_ROAD0+PU_LANE*l+PU_LANE/2;
 const rng=(()=>{let s=(Date.now()%9973)+7;return ()=>((s=(s*16807)%2147483647)/2147483647);})();
 P.players=[];for(let i=0;i<np;i++){const ch=i?p2Char():p1Char();
  P.players.push({i,ch,x:laneX(2+i),y:0,v:150,boosts:3,boost:0,hop:0,inv:0,stun:0,hp:3,down:false,wob:0});}
 P.truck={x:laneX(2),y:-200,v:180,tl:2,lc:3,drop:5,rush:0};
 P.endY=-def.length;
 // coins in short lines, puddles, parked ice cream trucks
 for(let y=-600;y>P.endY+400;y-=380+rng()*300){const l=1+Math.floor(rng()*4),r=rng();
  if(r<.45){for(let k=0;k<5;k++)P.coinsL.push({x:laneX(l),y:y-k*34});P.coinTotal+=5;}
  else if(r<.75)P.props.push({k:'puddle',x:laneX(l)+(rng()-.5)*20,y,w:62,h:30});}
 R.coinTotal=P.coinTotal;
 const float=(x,y,t,c='#fff')=>P.floats.push({x,y,t,c,life:1.3});
 const lead=()=>P.players.reduce((a,p)=>p.y<a.y?p:a,P.players[0]);
 const closest=()=>P.players.reduce((a,p)=>Math.abs(p.y-P.truck.y)<Math.abs(a.y-P.truck.y)?p:a,P.players[0]);
 const prog=()=>Math.min(1,-lead().y/def.length);
 function spawnTraffic(){const top=P.camY-120;
  if(P.cars.filter(c=>c.y<P.camY+H).length<5&&rng()<.03){const l=Math.floor(rng()*PU_LANES),onc=l===0;
   const k=onc?['car_red','car_teal','car_white','car_yellow'][Math.floor(rng()*4)]:rng()<.12?'icecream':['car_red','car_teal','car_white','car_yellow'][Math.floor(rng()*4)];
   const big=k==='icecream',c={k,x:laneX(l),y:top-rng()*200,v:onc?-230:big?70:95+rng()*60,w:big?50:36,h:big?88:60,onc,l};
   if(!P.cars.some(o=>o.l===l&&Math.abs(o.y-c.y)<130)&&Math.abs(c.x-P.truck.x)+Math.abs(c.y-P.truck.y)>90)P.cars.push(c);}
  if(rng()<.0035&&!P.dogs.length){const d=rng()<.5?-1:1;P.dogs.push({x:d<0?PU_ROAD1+30:PU_ROAD0-30,y:P.camY+80+rng()*120,vx:d*-150});}}
 function crash(p,why,heart,count){if(p.inv>0)return;p.stun=.4;p.v=heart?40:70;p.inv=1.3;p.wob=.6;SFX.hurt();float(p.x,p.y-30,why,'#ff5a8a');
  if(count||heart){P.crashes++;R.hits=(R.hits||0)+1;}
  if(heart){P.hearts--;if(P.hearts<=0){P.hearts=0;finish(false,'Too many crashes!');}}}
 function finish(win,why){P.state='end';P.win=win;P.why=why;P.endT=0;stopMusic();playStinger(win?'win':'lose');}
 function payout(){for(const p of P.players)p.hp=P.hearts;R.coinsGot=P.coins;R.kos=0;R.oops=0;
  if(typeof lv==='function'){const V=lv(def.id);if(P.spots===0)V.unspotted=1;if(P.hops>=10)V.hopper=1;if(P.crashes===0&&P.spots===0&&P.clues.length>=3)V.perfect=1;}
  missionPayout(def,np,{clues:P.clues,coins:P.coins,kills:0,total:def.photos.length});}
 P.enter=function(){startMusic(def.music||'pursuit');};P.resume=function(){};
 P.update=function(dt){P.t+=dt;for(const f of P.floats){f.life-=dt;f.y-=28*dt;}P.floats=P.floats.filter(f=>f.life>0);
  if(P.state==='intro'){P.camY=lead().y-340;if(anyPressed('ok')||anyPressed('attack')){SFX.move();P.introIdx++;if(P.introIdx>=def.intro.length)P.state='play';}return;}
  if(P.state==='outro'){P.endT+=dt;if(P.endT>.4&&(anyPressed('ok')||anyPressed('attack'))){SFX.move();P.outroIdx++;P.endT=0;if(P.outroIdx>=def.outro.lines.length)payout();}return;}
  if(P.paused)return;
  if(P.state==='end'){P.endT+=dt;P.truck.y-=P.truck.v*dt;if(P.endT>2.2){if(P.win){P.state='outro';P.outroIdx=0;P.endT=0;startMusic('cutscene');}else Results.show({win:0,name:levelName(def.id),id:def.id});}return;}
  if(anyPressed('start')){P.paused=true;push(Watch.make('level'));return;}
  R.t=(R.t||0)+dt;
  // players
  for(const p of P.players){const I=INPUT[p.i],J=np===1?INPUT[1]:{};const hold=b=>I[b]||J[b],tap=b=>pressed(p.i,b)||(np===1&&pressed(1,b));
   p.inv=Math.max(0,p.inv-dt);p.wob=Math.max(0,p.wob-dt);if(p.hop>0)p.hop-=dt;if(p.boost>0)p.boost-=dt;
   if(p.stun>0){p.stun-=dt;}else{const want=hold('up')?285:hold('down')?70:175;p.v+=(want-p.v)*Math.min(1,dt*(want<p.v?3:1.6));
    if(p.boost>0)p.v=Math.max(p.v,360);
    const steer=(hold('right')?1:0)-(hold('left')?1:0);p.x+=steer*200*dt;p.tilt=(p.tilt||0)+(steer*.35-(p.tilt||0))*Math.min(1,dt*10);}
   p.x=Math.max(PU_ROAD0-6,Math.min(PU_ROAD1+6,p.x));if(p.x<PU_ROAD0+8||p.x>PU_ROAD1-8)p.v=Math.min(p.v,150);  // rough curb
   if(tap('jump')&&p.hop<=0&&p.stun<=0){p.hop=.5;SFX.jump();}
   if(tap('gadget')){if(p.boosts>0&&p.boost<=0){p.boosts--;p.boost=1.4;SFX.gadget();float(p.x,p.y-30,'TURBO!','#7ff');bump&&bump('gadgets');}else if(p.boosts<=0)float(p.x,p.y-30,'NO BOOSTS LEFT','#9fb');}
   if(tap('attack')){const g=p.y-P.truck.y;if(P.photo&&!P.photo.got){if(g>=110&&g<=300){P.photo.got=1;const ci=(def.clue0!=null?def.clue0:PU_CLUE0)+P.photoI-1;P.clues.push(ci);playStinger('clue');float(p.x,p.y-40,'SNAP! CLUE: '+CLUES[ci].name,'#ffd23a');P.flash=.25;}
     else float(p.x,p.y-30,g<110?'TOO CLOSE TO SNAP!':'TOO FAR TO SNAP!','#ff9ac0');}else SFX.whoosh();}
   p.y-=p.v*dt;}
  // co-op: keep the trailing rider on screen
  const L=lead();if(np>1)for(const p of P.players)if(p.y>L.y+300){p.y=L.y+300;}
  P.camY+=((L.y-340)-P.camY)*Math.min(1,dt*8);
  // truck: lane changes, speed waves, drops boxes; rushes after spotting you
  const T=P.truck;T.lc-=dt;T.drop-=dt;if(T.rush>0)T.rush-=dt;
  if(T.lc<=0){T.tl=Math.max(1,Math.min(4,T.tl+(rng()<.5?-1:1)));T.lc=2.5+rng()*2.5;}
  T.x+=(laneX(T.tl)-T.x)*Math.min(1,dt*2);
  const tv=200+Math.sin(P.t*.35)*40+(T.rush>0?110:0);T.v+=(tv-T.v)*Math.min(1,dt*1.5);
  if(-T.y<def.length+200)T.y-=T.v*dt;
  if(T.drop<=0){T.drop=T.rush>0?.5:4+rng()*3;P.props.push({k:'box',x:T.x+(rng()-.5)*14,y:T.y+52,w:38,h:30});}
  // tail band
  const C=closest(),gap=C.y-T.y;
  if(gap<110)P.spotted=Math.min(1,P.spotted+dt*.45);else P.spotted=Math.max(0,P.spotted-dt*.12);
  if(gap>300)P.lost=Math.min(1,P.lost+dt*(gap>520?.4:.15));else P.lost=Math.max(0,P.lost-dt*.25);
  if(P.spotted>=1){P.spotted=0;P.spots++;T.rush=2.5;T.drop=0;float(T.x,T.y+60,'HE SPOTTED YOU!','#ff5a5a');SFX.hurt();}
  if(P.lost>=1){finish(false,'They got away!');return;}
  // photo ops
  const pr=prog(),po=def.photos[P.photoI];if(po&&pr>=po.at){P.photo={what:po.what,t:7,got:0};P.photoI++;playStinger('unlock');}
  if(P.photo){P.photo.t-=dt;if(P.photo.t<=0||P.photo.got&&P.photo.t>1.5)P.photo.t=Math.min(P.photo.t,1.5);if(P.photo.t<=0)P.photo=null;}
  if(P.flash>0)P.flash-=dt;
  // traffic and hazards
  spawnTraffic();
  for(const c of P.cars){c.y-=c.v*dt;
   const ahead=P.cars.find(o=>o!==c&&o.l===c.l&&!o.onc&&o.y<c.y&&c.y-o.y<c.h+20);if(ahead&&!c.onc)c.y=Math.max(c.y,ahead.y+ahead.h+20);
   if(!c.onc)for(const p of P.players)if(Math.abs(c.x-p.x)<c.w/2+10&&c.y>p.y&&c.y-p.y<c.h/2+44){c.y=p.y+c.h/2+44;if(!c.honk){c.honk=1;float(c.x,c.y,'HONK!','#fff');beep(330,.15,'square',.04);}}}  // cars behind you brake instead of ramming
  P.cars=P.cars.filter(c=>c.y<P.camY+H+200&&c.y>P.camY-900);
  P.props=P.props.filter(o=>o.y<P.camY+H+100);
  for(const d of P.dogs)d.x+=d.vx*dt;P.dogs=P.dogs.filter(d=>d.x>PU_ROAD0-60&&d.x<PU_ROAD1+60);
  for(const p of P.players){
   for(const c of P.cars)if(Math.abs(c.x-p.x)<c.w/2+7&&Math.abs(c.y-p.y)<c.h/2+14){if(c.onc)crash(p,'CRASH!',true);else{crash(p,'BUMP!',false,true);c.y=Math.min(c.y,p.y-c.h/2-16);}if(P.state!=='play')return;}
   if(Math.abs(T.x-p.x)<30&&Math.abs(T.y-p.y)<56){crash(p,'BONK! (too close!)',true);P.spotted=1;}
   for(const o of P.props){if(o.hit||Math.abs(o.x-p.x)>o.w/2+6||Math.abs(o.y-p.y)>o.h/2+10)continue;
    if(p.hop>0){o.hit=1;P.hops++;float(p.x,p.y-30,'HOP!','#9ff');continue;}
    o.hit=1;if(o.k==='puddle'){p.v*=.55;p.wob=.8;float(p.x,p.y-30,'SPLASH!','#7cf');}else crash(p,'BOXED!',false,true);}
   for(const d of P.dogs)if(!d.hit&&Math.abs(d.x-p.x)<26&&Math.abs(d.y-p.y)<20){d.hit=1;p.v=30;p.stun=.4;float(p.x,p.y-30,'WOOF! (brake for dogs!)','#ffd23a');}
   for(const k of P.coinsL)if(!k.got&&Math.abs(k.x-p.x)<20&&Math.abs(k.y-p.y)<22){k.got=1;P.coins++;SFX.pick();bump&&bump('coins');}}
  if(P.state==='play'&&-L.y>=def.length)finish(true);};
 // ---------- drawing ----------
 const sy=y=>y-P.camY;
 function drawImgC(k,x,y,w,h,rot,fb){const im=puImg(k);ctx.save();ctx.translate(x,y);if(rot)ctx.rotate(rot);
  if(im)ctx.drawImage(im,-w/2,-h/2,w,h);else fb&&fb(w,h);ctx.restore();}
 function carFallback(col){return (w,h)=>{rrect(-w/2,-h/2,w,h,8,col,'#000',2);rrect(-w/2+5,-h/2+10,w-10,14,4,'#3cc','#000',1.5);}}
 function drawRoad(){const SZ=160,off=((-P.camY)%SZ+SZ)%SZ;
  for(let yy=-SZ+off;yy<H;yy+=SZ){const row=Math.floor((P.camY+yy)/SZ),pick=n=>['side_agave','side_tracks','side_cactus','side_tracks','side_agave','side_cactus'][((n%6)+6)%6];
   for(const [x,n] of [[0,row*7],[PU_ROAD1+16,row*5+3]]){const im=puImg(pick(n));if(im)ctx.drawImage(im,x,yy,144,SZ);else{ctx.fillStyle='#e2a05a';ctx.fillRect(x,yy,144,SZ);}}}
  ctx.fillStyle='#bfb2a0';ctx.fillRect(PU_ROAD0-16,0,16,H);ctx.fillRect(PU_ROAD1,0,16,H);ctx.fillStyle='#8a7e70';for(let y=-(P.camY%24+24)%24;y<H;y+=24){ctx.fillRect(PU_ROAD0-16,y,16,2);ctx.fillRect(PU_ROAD1,y,16,2);}
  ctx.fillStyle='#3a2a52';ctx.fillRect(PU_ROAD0,0,PU_ROAD1-PU_ROAD0,H);ctx.fillStyle='#2e2244';ctx.fillRect(PU_ROAD0,0,PU_LANE,H);
  ctx.fillStyle='#ffd23a';ctx.fillRect(PU_ROAD0+PU_LANE-4,0,3,H);ctx.fillRect(PU_ROAD0+PU_LANE+1,0,3,H);
  ctx.fillStyle='#e8e0d0';const d=((-P.camY)%60+60)%60;for(let l=2;l<PU_LANES;l++)for(let y=-60+d;y<H;y+=60)ctx.fillRect(PU_ROAD0+PU_LANE*l-2,y,4,28);
  // finish gate
  const gy=sy(-def.length-60);if(gy>-60&&gy<H){ctx.fillStyle='#555';ctx.fillRect(PU_ROAD0-10,gy-6,PU_ROAD1-PU_ROAD0+20,12);for(let x=PU_ROAD0;x<PU_ROAD1;x+=32){ctx.fillStyle=(x/32)%2?'#ffd23a':'#222';ctx.fillRect(x,gy-6,32,12);}text(def.finishName||'WRECKING YARD',W/2,gy-14,16,'#ffd23a','center');}}
 function drawRiderTop(p){const x=p.x,y=sy(p.y),s=1.45*(1+(p.hop>0?Math.sin(p.hop/.5*Math.PI)*.35:0));ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(4,6,10,22,0,0,7);ctx.fill();
  ctx.rotate((p.tilt||0)+(p.wob>0?Math.sin(P.t*30)*.25:0));ctx.scale(s,s);if(p.inv>0&&Math.floor(P.t*14)%2)ctx.globalAlpha=.45;
  ctx.lineWidth=2;ctx.strokeStyle='#111';ctx.fillStyle='#222';ctx.fillRect(-3,-24,6,10);ctx.fillRect(-3,14,6,10);
  ctx.fillStyle=p.ch==='agent_sisi'?'#c33c9a':p.ch==='agent_sandy'?'#5a6a7a':'#2a3a8a';ctx.fillRect(-4,-16,8,32);ctx.strokeRect(-4,-16,8,32);ctx.fillStyle='#ccd';ctx.fillRect(-12,-20,24,3);if(p.ch==='agent_sandy')sandyTop(ctx);else{
  ctx.fillStyle=p.ch==='agent_sisi'?'#ff5ae0':'#1c2a5a';ctx.beginPath();ctx.ellipse(0,-2,10,8,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle=p.ch==='agent_sisi'?'#6a3a1a':'#3a2210';ctx.beginPath();ctx.arc(0,-6,7,0,7);ctx.fill();ctx.stroke();
  if(p.ch==='agent_coco'){ctx.fillStyle='#2de2f5';ctx.fillRect(-6,-12,12,3);}else{ctx.fillStyle='#ff5ae0';ctx.fillRect(-2,0,4,4);}}
  if(p.boost>0){ctx.globalAlpha=.8;ctx.fillStyle='#7ff';ctx.beginPath();ctx.moveTo(-5,24);ctx.lineTo(0,40+Math.random()*10);ctx.lineTo(5,24);ctx.fill();}
  ctx.restore();text(p.i?'P2':'P1',x,y-42,10,CHARS[p.ch].tag,'center');}
 function bar(x,lab,v,col){text(lab,x,22,11,'#cfe','left',null);rrect(x+62,11,90,11,5,'#1a2240',null);rrect(x+62,11,Math.max(5,90*v),11,5,col,null);}
 P.draw=function(){drawRoad();
  for(const o of P.props){const y=sy(o.y);if(y<-60||y>H+60)continue;if(o.k==='puddle')drawImgC('puddle',o.x,y,62,34,0,(w,h)=>{ctx.fillStyle='#6cf';ctx.beginPath();ctx.ellipse(0,0,w/2,h/2,0,0,7);ctx.fill();});
   else drawImgC('box',o.x,y,o.hit?32:40,o.hit?24:30,o.hit?.4:0,(w,h)=>rrect(-w/2,-h/2,w,h,3,'#e8d6b0','#000',2));}
  for(const k of P.coinsL){if(k.got)continue;const y=sy(k.y);if(y<-20||y>H+20)continue;ctx.fillStyle='#ffd23a';ctx.strokeStyle='#6a4a00';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(k.x,y,7*Math.abs(Math.cos(TIME*3+k.y)+.2),8,0,0,7);ctx.fill();ctx.stroke();}
  for(const c of P.cars){const y=sy(c.y);if(y<-80||y>H+80)continue;drawImgC(c.k,c.x,y,c.w,c.h,c.onc?Math.PI:0,carFallback('#c44'));}
  const T=P.truck,ty=sy(T.y);
  // tail-band guide on the road behind the truck
  if(P.state==='play'){ctx.fillStyle='rgba(80,255,120,.08)';ctx.fillRect(PU_ROAD0+PU_LANE,ty+110,PU_ROAD1-PU_ROAD0-PU_LANE,190);}
  if(ty>-100&&ty<H+100)drawImgC(def.target||'pickup',T.x,ty,def.targetW||47,def.targetH||86,0,carFallback(def.targetCol||'#999'));
  else if(ty<=-100){ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.moveTo(T.x,46);ctx.lineTo(T.x-10,62);ctx.lineTo(T.x+10,62);ctx.fill();text('TRUCK',T.x,76,11,'#ffd23a','center');}
  for(const d of P.dogs)drawImgC('dog',d.x,sy(d.y),52,30,0,(w,h)=>rrect(-w/2,-h/2,w,h,8,'#e0a040','#000',2)),d.vx>0&&0;
  for(const p of P.players)drawRiderTop(p);
  for(const f of P.floats)text(f.t,Math.max(90,Math.min(W-90,f.x)),sy(f.y),f.t.length>10?12:15,f.c,'center');
  if(P.flash>0){ctx.fillStyle='rgba(255,255,255,'+P.flash*3+')';ctx.fillRect(0,0,W,H);}
  // HUD
  rrect(4,2,W-8,28,8,'rgba(6,20,36,.92)','#2de2f5',2);for(let i=0;i<3;i++)heart(16+i*22,12,i<P.hearts);
  bar(84,'SPOTTED',P.spotted,P.spotted>.6?'#ff5a5a':'#ffb347');bar(248,'LOST',P.lost,P.lost>.6?'#ff5a5a':'#9cf');
  imgC('markers/clue',418,16,18);text(P.clues.length+'/3',430,21,12,'#ffd23a','left',null);text('$'+P.coins,466,21,12,'#fff','left',null);
  text('TURBO x'+P.players[0].boosts,W-14,21,11,'#7ff','right',null);
  rrect(W-14,40,6,H-60,3,'#1a2240',null);const pr=prog();rrect(W-14,40+(H-60)*(1-pr)-4,6,8,3,'#ffd23a',null);
  const gap=closest().y-T.y,zone=gap<110?['TOO CLOSE!','#ff5a5a']:gap>300?['TOO FAR!','#9cf']:['GREEN ZONE','#7f7'];if(P.state==='play')text(zone[0],W/2,H-14,14,zone[1],'center');
  if(P.photo){rrect(W/2-150,40,300,36,10,'rgba(6,20,36,.92)','#ffd23a',2);text(P.photo.got?'GOT IT!':'PHOTO OP: '+P.photo.what+' (ATTACK)',W/2,63,13,P.photo.got?'#7f7':'#ffd23a','center',null);}
  if(P.state==='intro'){dim(.4);text(def.title,W/2,80,22,'#ffd23a','center');text(def.sub,W/2,104,13,'#cfe','center');sandyBox(def.intro,def.introExpr[P.introIdx%4],Math.min(P.introIdx,def.intro.length-1));}
  if(P.state==='play'&&R.t<7)text(def.goal,W/2,H-34,11,'#fff','center');
  if(P.state==='end'){dim(Math.min(.6,P.endT*.4));text(P.win?def.winText:'MISSION FAILED',W/2,H/2,32,P.win?'#ffd23a':'#ff5a8a','center');if(!P.win)text(P.why||'',W/2,H/2+30,16,'#fff','center');}
  if(P.state==='outro'){dim(.55);sandyBox(def.outro.lines,def.outro.expr[P.outroIdx%2],Math.min(P.outroIdx,def.outro.lines.length-1));}
  if(SAVE.testing)text('TESTING MODE',W/2,44,10,'#ff5ae0','center');};
 return P;}

const _startLevelPu=startLevel;
startLevel=function(l){const def=LEVEL_DEFS[l.id];if(def&&def.type==='pursuit'){go(makePursuit(def,NPLAYERS));return;}return _startLevelPu.apply(this,arguments);};
function pursuitAutoPause(){if(scene&&scene.name==='pursuit'&&scene.state==='play'&&!scene.paused){scene.paused=true;push(Watch.make('level'));}}
addEventListener('blur',pursuitAutoPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pursuitAutoPause();});addEventListener('gamepaddisconnected',pursuitAutoPause);

if(typeof ACH!=='undefined'){const add=(id,n,d,c,cash,ok,p,h)=>{a(id,n,d,c,cash,ok,p,h);const x=ACH[ACH.length-1];x.tier=x.cash>=100?3:x.cash>=50?2:x.cash>=20?1:0;ACH_BY[id]=x;
  const i=ACH.findIndex(y=>y.id==='f_all');if(i>=0)ACH.push(ACH.splice(i,1)[0]);};
 add('m10_clear','Tailgater','Track the getaway truck all the way to its hideout.','mission',20,()=>!!SAVE.done[10]);
 add('m10_photos','Paparazzi','Snap all 3 photo-op clues in the Getaway Truck chase.','mission',25,()=>cluesIn(10)>=3,()=>[cluesIn(10),3]);
 add('m10_nocrash','Clean Driving Record','Beat the Getaway Truck chase without crashing once.','mission',50,()=>!!lv(10).noHit);
 add('m10_unspotted','Invisible Scooter','Beat the Getaway Truck chase without the driver ever spotting you.','mission',60,()=>!!lv(10).unspotted);
 add('m10_coins','Road Coin Vacuum','Grab every coin on the road in one chase.','mission',40,()=>!!lv(10).coinsAll);
 add('m10_hops','Hop To It','Curb-hop over 10 puddles or boxes in one chase.','mission',20,()=>!!lv(10).hopper,null,1);
 add('m10_perfect','Shadow on Wheels','No crashes, never spotted AND all 3 photos in one chase.','mission',120,()=>!!lv(10).perfect,null,1);}
