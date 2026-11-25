// ===== Pizza delivery runs for Barro's (top-down) =====
// v0.34 rework: tight steering (analog stick + touch D-pad as 360° steering), wall sliding instead of getting stuck,
// fair crashes (heading kept, short knockback, blink invincibility), smooth camera, GPS dotted route, minimap,
// toss prompt + auto-aim, combos, drive-by tosses, close calls, tip jars, boost pads, rush orders, 2-player co-op bikes.
// The first run is the tutorial (3 houses, required before Mission 1). After that deliveries are always open from the Lair.
// Controls (each rider): stick/D-pad = point where you want to go, ATTACK toss a pizza, GADGET boost, JUMP bell / curb hop (scooter).
// Co-op: Player 1 rides the picked kid, Player 2 rides the other one on their own bike. Shared tips, one camera.
// Real art hook: assets/rides/<ride>_<char>.png = 4-frame top-down strip facing UP (prompts Sequences 40-42).
const RIDE_ART={};  // e.g. RIDE_ART['bike_agent_coco']='rides/bike_agent_coco' once the strips exist
const DT_=32,DP=13,DBX=4,DBY=6;           // tile size, block period (3 road + 1 walk + 8 lots + 1 walk), blocks across/down
const DMW=(DP*DBX+3)*DT_,DMH=(DP*DBY+3)*DT_,DNX=DMW/DT_,DNY=DMH/DT_;
// feel knobs in one place (tweak here)
const DTUNE={turnBase:4.2,turnPer:.7,accel:2.6,brake:.18,crashSpeed:170,inv:1.6,crashT:.55,tossRange:150,comboTime:14,camLerp:6,lookAhead:.45,catchUp:1.2};
const CUSTOMERS=['Mrs. Nguyen','Mr. Okafor','Grandpa Ruiz','the Patel twins','Ms. Begay','Coach Kowalski','Abuela Rosa','Mr. Kim','Dr. Haddad','the Johnsons',
 'Mrs. Goldberg','Officer Diaz','Auntie Mae','Mr. Takahashi','the Hernandez family','Ms. Svensson','Pastor Williams','Mr. Ali','Nana Lopez','the Chen kids'];
const MOODS=[{k:'big',n:'Big tipper',bonus:4,c:'#ffd23a'},{k:'kid',n:'Hungry kid (hot = +$2)',bonus:2,c:'#ff9ac0',hot:true},{k:'bday',n:'Birthday party',bonus:3,c:'#c8f'},
 {k:'neighbor',n:'Friendly neighbor',bonus:1,c:'#9fb'},{k:'grumpy',n:'Grumpy, but fair',bonus:0,c:'#aab'}];
function rideStats(id){const r=rideDef(id)||RIDES[0];return {speed:95+r.speed*28,turn:DTUNE.turnBase+r.turn*DTUNE.turnPer,cap:r.cap+(upgOwned('basket')?1:0),thermal:(id==='agent_bike'?10:0)+(upgOwned('thermal')?10:0),boostMul:id==='agent_bike'?1.5:1,r};}
// in 1-player both keyboard halves (WASD and arrows) and both pads drive the bike (engine.js merges them into INPUT[0])
function mergedInput(){const o={};for(const b of BTN)o[b]=INPUT[0][b]||INPUT[1][b];return o;}
const dPressed=b=>NPLAYERS>1?pressed(0,b):anyPressed(b);
function dRng(seed){let s=seed>>>0||1;return ()=>((s=Math.imul(s^s>>>15,2246822519)+0x9e3779b9>>>0)/4294967296);}
function dPads(){try{return [...(navigator.getGamepads?navigator.getGamepads():[])].filter(g=>g&&g.connected);}catch(e){return [];}}
// steering vector for player p: {x,y,m} (m = 0..1 throttle). Analog stick and the touch D-pad give full 360° steering.
function dSteer(p){const I=INPUT[p],solo=NPLAYERS<2;let x=(I.right?1:0)-(I.left?1:0),y=(I.down?1:0)-(I.up?1:0),m=(x||y)?1:0;
 if(x&&y){x*=.7071;y*=.7071;}
 dPads().forEach((g,i)=>{if(!solo&&i!==p)return;const ax=g.axes[0]||0,ay=g.axes[1]||0,mm=Math.hypot(ax,ay);
  if(mm>.28){const k=Math.max(.4,Math.min(1,(mm-.28)/.55));x=ax/mm;y=ay/mm;m=k;}});
 if(p===0&&typeof TOUCH!=='undefined'&&TOUCH.on){const d=TB.dpad;for(const id in TOUCH.ptr){const [tx,ty]=TOUCH.ptr[id],dx=tx-d.x,dy=ty-d.y,dd=Math.hypot(dx,dy);
  if(dd<d.r*1.45&&dd>8){x=dx/dd;y=dy/dd;m=Math.max(.45,Math.min(1,dd/(d.r*.55)));}}}
 return {x,y,m};}
// which button label to show for "toss" for player p
function dKey(p,what){const pad=dPads().length>(NPLAYERS<2?0:p);if(p===0&&typeof TOUCH!=='undefined'&&TOUCH.on)return {toss:'X',boost:'Y',bell:'A'}[what];
 if(pad)return {toss:'X',boost:'Y',bell:'A'}[what];return NPLAYERS<2?{toss:'F',boost:'G',bell:'W'}[what]:(p?{toss:'.',boost:'/',bell:'↑'}:{toss:'F',boost:'G',bell:'W'})[what];}

// ---------- pick rider and ride (background: Sandy's hologram map) ----------
const DeliveryPick={name:'dpick',sel:2,rider:'agent_coco',
 rides(){return RIDES.filter(r=>!r.later&&rideOwned(r.id));},
 enter(){this.sel=2;this.rider=p1Char();if(!rideOwned(SAVE.ride))SAVE.ride='bike';startMusic('delivery');},resume(){},
 update(){navList(this,3);const R=this.rides();
  if(anyPressed('left')||anyPressed('right')||(anyPressed('ok')&&this.sel<2)){const d=anyPressed('left')?-1:1;
   if(this.sel===0){const L=AGENT_LIST.filter(c=>NPLAYERS<2||c!==p2Char());let i=L.indexOf(this.rider);this.rider=L[(i+d+L.length)%L.length];SFX.move();}
   if(this.sel===1){let i=R.findIndex(r=>r.id===SAVE.ride);i=(i+d+R.length)%R.length;SAVE.ride=R[i].id;save();SFX.move();}return;}
  if(anyPressed('ok')&&this.sel===2){SFX.ok();sceneStack.length=0;go(makeDelivery(this.rider,SAVE.ride));return;}
  if(backPressed()||anyPressed('start')){SFX.move();pop();}},
 draw(){bgPic('scenes/lair_map',.45);const tut=!SAVE.firstDelivery,coop=NPLAYERS>1;text(tut?'FIRST DELIVERY':'PIZZA DELIVERY',W/2,40,28,'#ffd23a','center');cashTag();
  const st=rideStats(SAVE.ride),r=st.r;panel(40,64,560,300);
  const lab=c=>c==='agent_coco'?'Coco':c==='agent_sisi'?'Sisi':'Sandy',other=lab(p2Char()),me=lab(this.rider);
  const rows=[['RIDER',coop?`P1 ${me} + P2 ${other} (two bikes!)`:(this.rider==='agent_coco'?'Coco: boost burns a gadget charge (3 per run)':this.rider==='agent_sandy'?'Sandy: free hover sprint, recharges':'Sisi: free sprint, recharges')],['RIDE',r.n],['','START THE RUN!']];
  rows.forEach((q,i)=>{const y=80+i*58,s=i===this.sel;rrect(56,y,528,48,10,s?'rgba(255,210,58,.92)':'rgba(30,60,90,.75)',s?'#fff':'#2de2f5',2);
   if(q[0])text(q[0],72,y+30,13,s?'#102':'#9fb','left',null);text(q[1],i===2?W/2:150,y+31,i===2?20:15,s?'#102':'#fff',i===2?'center':'left',null);
   if(i<2)text('< >',570,y+31,14,s?'#102':'#9fb','right',null);});
  if(this.rider){const f=IMG['faces/'+this.rider+'_happy'];if(f&&f.width)ctx.drawImage(f,520,78,52,52);}
  text('Speed '+r.speed+'   Turning '+r.turn+'   Pizzas '+st.cap+(coop?' each':''),W/2,272,15,'#ffd23a','center',null);wrap(r.perk,72,298,500,18,13,'#cfe',null);
  const ups=UPGRADES.filter(u=>upgOwned(u.id)).map(u=>u.n);text(ups.length?'Upgrades: '+ups.join(', '):'No ride upgrades yet (Barro\'s Shop)',W/2,350,12,'#9fb','center',null);
  panel(40,380,560,86,'#456');wrap(tut?"Barro's needs 3 pizzas delivered. Follow the dotted line to each house. Get close and press ATTACK when you see TOSS! Hot pizza = bigger tips!":
   'Point the stick where you want to ride. ATTACK: toss a pizza. GADGET: boost. JUMP: bell (curb hop on the scooter). Chain deliveries for combos, toss while zooming for drive-by bonuses!',56,406,530,18,14,'#fff',null);}};

// ---------- the run ----------
function makeDelivery(rider,rideId){
 const st=rideStats(rideId),tut=!SAVE.firstDelivery,coop=NPLAYERS>1,rng=dRng(1000+SAVE.deliveries*7919+(Date.now()%100000)),evening=!tut&&SAVE.deliveries%3===2;
 const D={name:'delivery',state:'intro',introIdx:0,t:0,paused:false,rider,rideId,st,tut,evening,coop,
  riders:[],houses:[],solids:[],trees:[],dogs:[],kids:[],cars:[],sprink:[],boxes:[],floats:[],orders:[],jars:[],pads:[],parts:[],skids:[],
  crashes:0,cash:0,ping:0,cam:{x:0,y:0},shake:0,endT:0,combo:0,comboT:0,bon:{combo:0,drive:0,close:0,jars:0,rush:0},closeN:0,rushN:0};
 // --- build the neighborhood ---
 const tileType=(tx,ty)=>{const mx=tx%DP,my=ty%DP;if(tx<0||ty<0||tx*DT_>=DMW||ty*DT_>=DMH)return 'x';if(mx<3||my<3)return 'road';if(mx===3||mx===12||my===3||my===12)return 'walk';return 'grass';};
 D.tileType=tileType;
 const cols=['#f2c38b','#a9d1f5','#f5a9b8','#c9f2a9','#f5e6a9','#d0b8f5','#f5c9a9','#b8f5e6'],roofs=['#b23a2a','#3a5a8a','#6a3a8a','#3a7a4a','#8a5a2a','#444a5a'];
 const bbx=1,bby=DBY-1;   // Barro's block (bottom row)
 const names=CUSTOMERS.slice();for(let i=names.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[names[i],names[j]]=[names[j],names[i]];}let nameI=0;
 for(let by=0;by<DBY;by++)for(let bx=0;bx<DBX;bx++){const ix=bx*DP+4,iy=by*DP+4;
  for(let q=0;q<4;q++){const qx=ix+(q%2)*4,qy=iy+Math.floor(q/2)*4,top=q<2;
   if(bx===bbx&&by===bby&&!top)continue;
   const hx=(qx+.5)*DT_,hw=3*DT_,hh=2.6*DT_,hy=top?(qy+1.1)*DT_:(qy+.3)*DT_;
   const h={x:hx,y:hy,w:hw,h:hh,door:{x:hx+hw/2,y:top?hy:hy+hh},top,col:cols[Math.floor(rng()*cols.length)],roof:roofs[Math.floor(rng()*roofs.length)],name:names[nameI++%names.length],spr:Math.floor(rng()*7),lawn:rng()<.45};
   D.houses.push(h);D.solids.push(h);
   const yardY=top?qy*DT_+6:(qy+2.6)*DT_;
   if(rng()<.45)D.trees.push({x:(qx+(rng()<.5?.5:3.5))*DT_,y:top?(qy+.55)*DT_:(qy+3.45)*DT_,r:13,kind:DLV_TREES[Math.floor(rng()*DLV_TREES.length)],rot:rng()*6.28});
   if(rng()<.22&&!tut)D.dogs.push({breed:rng()<.5?'golden':'fluffy',hx:h.door.x+(rng()<.5?-34:34),hy:top?yardY+18:yardY+14,x:0,y:0,state:'sit',t:0,house:h});
   if(rng()<.2)D.sprink.push({x:(qx+(rng()<.5?1:3))*DT_,y:top?(qy+.8)*DT_:(qy+3.2)*DT_,r:22});}}
 // Barro's: big building on the top half of its block, door facing north
 const bw=4.3*DT_,bh=3.85*DT_,bxp=(bbx*DP+8)*DT_-bw/2,byp=(bby*DP+8.1)*DT_;D.barros={x:bxp,y:byp,w:bw,h:bh,door:{x:bxp+bw/2,y:byp+bh}};D.solids.push(D.barros);
 for(const d of D.dogs){d.x=d.hx;d.y=d.hy;}
 // kids on scooters cruise the sidewalks; cars drive the lanes
 for(let i=0;i<(tut?2:5);i++){const by=1+Math.floor(rng()*(DBY-1)),x0=(Math.floor(rng()*DBX)*DP+4)*DT_;D.kids.push({x0,x:x0,y:(by*DP+3.5)*DT_,len:5*DT_,dir:1,sp:45+rng()*25,t:rng()*5,col:['#ff5a8a','#5ad1ff','#ffd23a','#7f7'][i%4],calm:0});}
 const nCars=tut?3:7+Math.min(4,SAVE.deliveries);
 for(let i=0;i<nCars;i++){const horiz=i%2===0,road=Math.floor(rng()*(horiz?DBY+1:DBX+1)),fwd=rng()<.5;
  const lanePos=(road*DP+(fwd?2.1:.9))*DT_,along=rng()*(horiz?DMW:DMH);
  {const spr=DLV_CARS[Math.floor(rng()*DLV_CARS.length)],[cw,cl]=dlvCarSize(spr);D.cars.push({spr,w:cw,l:cl,horiz,dir:fwd?1:-1,x:horiz?along:lanePos,y:horiz?lanePos:along,sp:(tut?70:90)+rng()*40,col:['#ffd23a','#e03a3a','#3a7ad8','#eee','#7a4ab8','#3aa86a'][i%6],v:0,honk:0,nm:0});}}
 // tip jars on sidewalks, boost pads in road lanes
 const randTile=(kind)=>{for(let k=0;k<200;k++){const tx=Math.floor(rng()*DNX),ty=Math.floor(rng()*DNY);if(tileType(tx,ty)===kind)return [tx,ty];}return null;};
 for(let i=0;i<(tut?0:6);i++){const t=randTile('walk');if(t)D.jars.push({x:(t[0]+.5)*DT_,y:(t[1]+.5)*DT_,got:false});}
 for(let i=0;i<(tut?2:6);i++){const t=randTile('road');if(!t)continue;const mx=t[0]%DP,my=t[1]%DP;if(mx<3&&my<3){i--;continue;}  // skip intersections
  const horiz=my<3;D.pads.push({x:(t[0]+.5)*DT_,y:(t[1]+.5)*DT_,horiz,cd:0});}
 // walkable grid for the GPS route (1 = blocked). Grass costs more, so the route prefers streets.
 const isSolidPt=(x,y,r)=>{for(const s of D.solids)if(x>s.x-r&&x<s.x+s.w+r&&y>s.y-r&&y<s.y+s.h+r)return true;for(const t of D.trees)if(Math.hypot(t.x-x,t.y-y)<t.r+r)return true;return false;};
 const GRID=new Uint8Array(DNX*DNY);for(let ty=0;ty<DNY;ty++)for(let tx=0;tx<DNX;tx++){const k=tileType(tx,ty);GRID[ty*DNX+tx]=isSolidPt((tx+.5)*DT_,(ty+.5)*DT_,6)?0:k==='grass'?4:1;}
 // orders
 const n=(tut?3:Math.min(6,4+Math.floor(SAVE.deliveries/3)))+(coop&&!tut?2:0);
 const pool=D.houses.slice().sort((a,b)=>Math.hypot(a.door.x-D.barros.door.x,a.door.y-D.barros.door.y)-Math.hypot(b.door.x-D.barros.door.x,b.door.y-D.barros.door.y));
 const pick=tut?pool.slice(2,10):pool.slice(4);
 for(let i=0;i<n;i++){const h=pick.splice(Math.floor(rng()*Math.min(pick.length,tut?6:12+SAVE.deliveries*4)),1)[0];if(!h)break;
  const dog=D.dogs.some(d=>d.house===h);const mood=dog?{k:'dog',n:'Grumpy dog in the yard',bonus:3,c:'#ff9a3a'}:MOODS[Math.floor(rng()*MOODS.length)];
  D.orders.push({h,mood,done:false,tip:0,cust:mood.k==='bday'?'bday':rng()<.5?'dad':'grandpa'});}
 D.rushLeft=tut?0:(coop?2:1);D.rushAt=10+rng()*8;
 // riders
 function mkR(p,ch,x,y){return {p,ch,x,y,a:-Math.PI/2,v:0,crash:0,spin:0,inv:0,kx:0,ky:0,slip:0,hop:0,boost:0,boostCd:0,
  boosts:(ch==='agent_coco'?3:99)+(upgOwned('turbo')?1:0),ring:0,carry:0,bakeT:0,squish:0,off:0,path:null,pathT:p*.2,tgt:null,bump:0,
  col:ch==='agent_coco'?'#2de2f5':ch==='agent_sandy'?'#bff6ff':'#ff6fb5',name:CHARS[ch]?CHARS[ch].label:'COCO'};}
 D.riders.push(mkR(0,rider,D.barros.door.x-(coop?24:0),D.barros.door.y+40));
 if(coop)D.riders.push(mkR(1,p2Char()!==rider?p2Char():AGENT_LIST.find(c=>c!==rider),D.barros.door.x+24,D.barros.door.y+40));
 D.bike=D.riders[0];
 const undone=()=>D.orders.filter(o=>!o.done).length;
 {let left=D.orders.length;for(const R of D.riders){R.carry=Math.min(st.cap,Math.ceil(left/(D.riders.length-D.riders.indexOf(R))));left-=R.carry;}}
 Object.defineProperty(D,'carry',{get(){return D.riders.reduce((s,R)=>s+R.carry,0);}});
 Object.defineProperty(D,'squish',{get(){return D.riders.reduce((s,R)=>s+R.squish,0);}});
 const cam0=D.riders[0];D.cam.x=Math.max(0,Math.min(DMW-W,cam0.x-W/2));D.cam.y=Math.max(0,Math.min(DMH-H,cam0.y-H/2));
 const T=dKey(0,'toss'),B=dKey(0,'boost');
 const intro=tut?["Welcome to your first shift at Barro's! Three neighbors are hungry.","Point where you want to ride. Follow the dotted line, and when a house says TOSS!, press "+T+" to throw the pizza.",
   B+" gives you a boost. Cars, trees and kids on scooters make you crash and squish a pizza. Hot pizza means bigger tips!"]
  :[`${D.orders.length} orders tonight${evening?', and it is getting dark':''}. ${D.orders.length>D.carry?'You can carry '+D.carry+', so swing back to Barro\'s to reload.':'They all fit on your '+(coop?'bikes':'ride')+'.'}`,
   'Deliver fast for COMBOS, toss while zooming for DRIVE-BY bonuses, grab tip jars, and hit the yellow arrow pads for free speed.',
   'Watch for dogs, and answer RUSH ORDERS for big tips! '+(rideId==='scooter'?'JUMP hops the scooter over puddles and sprinklers.':upgOwned('bell')?'JUMP rings your bell.':'')+(coop?' Stay close: the camera follows you both.':'')];
 D.intro=intro;
 D.enter=function(){startMusic('delivery');};
 D.float=(x,y,t,c='#fff')=>D.floats.push({x,y,t,c,life:1.3});
 const hitSolid=(x,y,r)=>{if(x<r||y<r||x>DMW-r||y>DMH-r)return true;return isSolidPt(x,y,r);};
 D.hitSolid=hitSolid;
 const puff=(x,y,c,n,sp)=>{for(let i=0;i<n;i++){const a=Math.random()*7,s=(sp||60)*(.4+Math.random());D.parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.4+Math.random()*.3,c,r:2+Math.random()*3});}};
 function crash(R,why,fx,fy){if(R.crash>0||R.hop>0||R.inv>0)return;R.crash=DTUNE.crashT;R.inv=DTUNE.inv;R.dizzy=DTUNE.crashT+.55;R.toss=0;
  const a=fx==null?R.a+Math.PI:Math.atan2(R.y-fy,R.x-fx);R.kx=Math.cos(a)*150;R.ky=Math.sin(a)*150;R.v=0;
  D.crashes++;if(R.carry>0){R.squish=Math.min(R.carry,R.squish+1);}D.combo=0;D.comboT=0;D.shake=.45;SFX.hurt();puff(R.x,R.y,'#fff',8,90);dlvFx(D,'impact',(R.x+(fx==null?R.x:fx))/2,(R.y+(fy==null?R.y:fy))/2,.35,20,46,Math.random()*6);dlvFx(D,'dust',R.x,R.y,.5,24,48);
  D.float(R.x,R.y-30,(why||'CRASH!')+(R.carry>0?' (squished!)':''),'#ff5a8a');}
 function bonus(k,amt,x,y,label,c){D.bon[k]+=amt;D.cash+=amt;D.float(x,y,label,c||'#7f7');}
 function deliver(o,R,drive){const el=D.t-R.bakeT,hot=30+st.thermal;const base=el<hot?6:el<hot+20?4:2,temp=el<hot?'HOT':el<hot+20?'WARM':'COLD';
  let tip=base+(o.mood.hot?(el<hot?o.mood.bonus:0):o.mood.bonus);if(R.squish>0){tip=Math.max(1,tip-1);R.squish--;}if(cheatOn('bigtips'))tip*=2;
  o.done=true;o.doneT=D.t;o.tip=tip;o.temp=temp;o.by=R.p;D.cash+=tip;playStinger('clue');D.float(o.h.door.x,o.h.door.y-30,temp+' PIZZA! +$'+tip,'#ffd23a');
  if(D.comboT>0){D.combo++;const c=Math.min(2,D.combo);bonus('combo',c,o.h.door.x,o.h.door.y-50,'COMBO x'+(D.combo+1)+'! +$'+c,'#ff9ae0');}else D.combo=0;
  D.comboT=DTUNE.comboTime;
  if(drive)bonus('drive',1,o.h.door.x,o.h.door.y-70,'DRIVE-BY! +$1','#2de2f5');
  if(o.rush&&D.t<o.deadline)bonus('rush',5,o.h.door.x,o.h.door.y-90,'RUSH DELIVERED! +$5','#ff7a3a');
  puff(o.h.door.x,o.h.door.y,'#ffd23a',10,80);dlvFx(D,'sparkle',o.h.door.x,o.h.door.y-6,.7,24,54);}
 function finish(){D.state='end';D.endT=0;const real=D.orders;const allHot=real.every(o=>o.temp==='HOT');D.perfect=allHot&&D.crashes===0;if(D.perfect)D.cash+=cheatOn('bigtips')?10:5;
  D.stars=D.perfect?3:real.every(o=>o.temp!=='COLD')?2:1;playStinger('win');}
 function payout(){const first=!SAVE.firstDelivery;SAVE.coins+=D.cash;SAVE.deliveries++;SAVE.firstDelivery=true;SAVE.bestTips=Math.max(SAVE.bestTips||0,D.cash);
  SAVE.dstars=Math.max(SAVE.dstars||0,D.stars);save();DeliveryResults.show(D,first);}
 // --- GPS: cheapest route from a rider to the nearest place they need to go (Dijkstra on the tile grid) ---
 const DIST=new Float32Array(DNX*DNY),PREVT=new Int32Array(DNX*DNY);
 function route(R){const tx0=Math.max(0,Math.min(DNX-1,Math.floor(R.x/DT_))),ty0=Math.max(0,Math.min(DNY-1,Math.floor(R.y/DT_)));
  const goals=[];const needReload=R.carry<=0&&undone()>0;
  if(needReload)goals.push({x:D.barros.door.x,y:D.barros.door.y+16,c:'#7f7',barros:true});
  else for(const o of D.orders)if(!o.done&&!D.boxes.some(b=>b.o===o))goals.push({x:o.h.door.x,y:o.h.door.y+(o.h.top?-16:16),c:o.rush?'#ff7a3a':'#ffd23a',o});
  if(!goals.length){R.path=null;R.tgt=null;return;}
  DIST.fill(1e9);PREVT.fill(-1);const s0=ty0*DNX+tx0;DIST[s0]=0;const hp=[[0,s0]];
  const pushH=(d,i)=>{hp.push([d,i]);let k=hp.length-1;while(k>0){const p=(k-1)>>1;if(hp[p][0]<=hp[k][0])break;[hp[p],hp[k]]=[hp[k],hp[p]];k=p;}};
  const popH=()=>{const top=hp[0],e=hp.pop();if(hp.length){hp[0]=e;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<hp.length&&hp[l][0]<hp[m][0])m=l;if(r<hp.length&&hp[r][0]<hp[m][0])m=r;if(m===k)break;[hp[m],hp[k]]=[hp[k],hp[m]];k=m;}}return top;};
  while(hp.length){const [d,i]=popH();if(d>DIST[i])continue;const x=i%DNX,y=(i/DNX)|0;
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=DNX||ny>=DNY)continue;const j=ny*DNX+nx,c=GRID[j];if(!c&&j!==s0)continue;
    const nd=d+(c||1);if(nd<DIST[j]){DIST[j]=nd;PREVT[j]=i;pushH(nd,j);}}}
  let best=null,bd=1e9;for(const g of goals){const gi=Math.floor(g.y/DT_)*DNX+Math.floor(g.x/DT_);if(DIST[gi]<bd){bd=DIST[gi];best={g,gi};}}
  if(!best){R.path=null;R.tgt=goals[0];return;}
  const pts=[];let i=best.gi;while(i>=0&&i!==s0&&pts.length<400){pts.push(i);i=PREVT[i];}pts.reverse();R.path=pts;R.tgt=best.g;}
 // --- per-rider physics ---
 function moveRider(R,dt){
  R.crash-=dt;R.inv-=dt;R.dizzy=(R.dizzy||0)-dt;R.toss=(R.toss||0)-dt;R.pd=(R.pd||0)+Math.abs(R.v)*dt;R.slip-=dt;R.hop-=dt;R.boost-=dt;R.boostCd-=dt;R.ring-=dt;R.bump-=dt;
  const grass=tileType(Math.floor(R.x/DT_),Math.floor(R.y/DT_))==='grass'&&R.hop<=0;
  const mine=R.ch==='agent_coco';
  let max=st.speed*(R.boost>0?(mine?1.6:1.45):1)*(grass&&!upgOwned('fattires')?.62:1);
  let vx,vy;
  if(R.crash>0){R.spin+=dt*16;R.kx*=Math.pow(.02,dt);R.ky*=Math.pow(.02,dt);vx=R.kx;vy=R.ky;}
  else{R.spin=0;const S=dSteer(R.p);
   if(S.m>0){const ta=Math.atan2(S.y,S.x);let da=((ta-R.a+Math.PI*3)%(Math.PI*2))-Math.PI;
    const uturn=Math.abs(da)>2.2;let tr=st.turn*(R.slip>0?.5:1)*(1+.6*(1-Math.min(1,R.v/max)))*(uturn?1.5:1);
    R.a+=Math.max(-tr*dt,Math.min(tr*dt,da));
    const want=max*S.m*(uturn?.45:Math.abs(da)>1.1?.7:1);R.v+=(want-R.v)*Math.min(1,dt*(want<R.v?5:DTUNE.accel));
    if(uturn&&R.v>70&&Math.random()<.6){R.skidOn=true;}else R.skidOn=false;}
   else{R.v*=Math.pow(DTUNE.brake,dt);R.skidOn=false;}
   if(R.slip>0){R.a+=Math.sin(D.t*20)*dt*2;R.skidOn=true;}
   if(grass&&rideId==='bike'&&!upgOwned('fattires')&&R.v>60)R.a+=Math.sin(D.t*13)*dt*.35;   // Barro's old bike wobbles a little on grass
   vx=Math.cos(R.a)*R.v;vy=Math.sin(R.a)*R.v;}
  // move each axis separately so you slide along walls instead of sticking
  const rad=9;let hx=false,hy=false;
  if(!hitSolid(R.x+vx*dt,R.y,rad))R.x+=vx*dt;else hx=true;
  if(!hitSolid(R.x,R.y+vy*dt,rad))R.y+=vy*dt;else hy=true;
  if((hx||hy)&&R.crash<=0){
   // corner assist: if the way ahead is blocked, nudge sideways toward the open side
   if(hx&&!hy&&Math.abs(vx)>Math.abs(vy)){for(const s of [6,-6,12,-12]){if(!hitSolid(R.x+vx*dt,R.y+s,rad)){R.y+=Math.sign(s)*Math.min(Math.abs(s),80*dt);break;}}}
   if(hy&&!hx&&Math.abs(vy)>Math.abs(vx)){for(const s of [6,-6,12,-12]){if(!hitSolid(R.x+s,R.y+vy*dt,rad)){R.x+=Math.sign(s)*Math.min(Math.abs(s),80*dt);break;}}}
   const vn=(hx?Math.abs(vx):0)+(hy?Math.abs(vy):0);
   if(vn>DTUNE.crashSpeed&&R.boost>0)crash(R,'BONK!',R.x+Math.cos(R.a)*20,R.y+Math.sin(R.a)*20);
   else{const along=Math.hypot(hx?0:vx,hy?0:vy);R.v=Math.max(along,R.v*.55);if(vn>60&&R.bump<=0){R.bump=.35;beep(140,.06,'triangle',.05);D.shake=Math.max(D.shake,.12);}}}
  if(R.skidOn){D.skids.push({x:R.x-Math.cos(R.a)*12,y:R.y-Math.sin(R.a)*12,life:2.5});if(D.skids.length>160)D.skids.shift();}
  if(R.boost>0&&Math.random()<.5)D.parts.push({x:R.x-Math.cos(R.a)*20,y:R.y-Math.sin(R.a)*20,vx:-Math.cos(R.a)*40,vy:-Math.sin(R.a)*40,life:.3,c:mine?'#2de2f5':'#ff9ae0',r:3});
  if(grass&&R.v>80&&Math.random()<.25)D.parts.push({x:R.x,y:R.y,vx:(Math.random()-.5)*30,vy:(Math.random()-.5)*30,life:.35,c:'#3c8a2c',r:2});}
 function riderButtons(R){const P=b=>pressed(R.p,b)||(NPLAYERS<2&&pressed(1,b));const mine=R.ch==='agent_coco';
  if(R.crash>0)return;
  if(P('gadget')&&R.boost<=0&&R.boostCd<=0){
   if(mine){if(R.boosts>0){R.boosts--;R.boost=1.4*st.boostMul;R.boostCd=1.6*st.boostMul;R.v=Math.max(R.v,st.speed);SFX.gadget();D.float(R.x,R.y-30,'GADGET BOOST!','#2de2f5');}else D.float(R.x,R.y-30,'NO CHARGES','#9fb');}
   else{R.boost=1*st.boostMul;R.boostCd=(upgOwned('turbo')?3:4);R.v=Math.max(R.v,st.speed);SFX.whoosh();D.float(R.x,R.y-30,'SPRINT!','#ff9ae0');}}
  if(P('attack')){const near=tossTarget(R);
   if(R.carry<=0){D.float(R.x,R.y-30,undone()?"OUT OF PIZZA! BACK TO BARRO'S":'ALL DONE!','#ff9ac0');SFX.hurt();}
   else if(near){R.carry--;R.toss=.4;R.tossL=(Math.cos(R.a)*(near.h.door.y-R.y)-Math.sin(R.a)*(near.h.door.x-R.x))<0;D.boxes.push({x:R.x,y:R.y,tx:near.h.door.x,ty:near.h.door.y+(near.h.top?-6:6),t:0,o:near,R,drive:R.v>st.speed*.85});SFX.whoosh();}
   else{D.float(R.x,R.y-30,'NO ORDER HERE','#9fb');SFX.move();}}
  if(P('jump')){if(rideId==='scooter'&&R.hop<=-.2){R.hop=.5;SFX.jump();}
   if(upgOwned('bell')){R.ring=.5;beep(1700,.12,'triangle',.06);setTimeout(()=>beep(1700,.15,'triangle',.05),120);
    for(const d of D.dogs)if(Math.hypot(d.x-R.x,d.y-R.y)<170){d.state='calm';d.t=3;}for(const k of D.kids)if(Math.hypot(k.x-R.x,k.y-R.y)<170)k.calm=3;}}}
 function tossTarget(R){return D.orders.filter(o=>!o.done&&!D.boxes.some(x=>x.o===o)&&Math.hypot(o.h.door.x-R.x,o.h.door.y-R.y)<DTUNE.tossRange)
  .sort((p,q)=>Math.hypot(p.h.door.x-R.x,p.h.door.y-R.y)-Math.hypot(q.h.door.x-R.x,q.h.door.y-R.y))[0];}
 D.update=function(dt){
  if(D.state==='intro'){if(anyPressed('ok')||anyPressed('attack')){SFX.move();D.introIdx++;if(D.introIdx>=D.intro.length)D.state='play';}return;}
  if(D.state==='pause'){navList(D,3);if(anyPressed('ok')||anyPressed('attack')){SFX.ok();if(D.sel===0)D.state='play';else if(D.sel===1){go(makeDelivery(rider,rideId));D.state='play';}else go(MapScene);}else if(anyPressed('start')||backPressed())D.state='play';return;}
  if(D.state==='end'){D.endT+=dt;for(const p of D.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}if(D.endT>1.6&&(anyPressed('ok')||anyPressed('attack')))payout();return;}
  if(anyPressed('start')){D.state='pause';D.sel=0;return;}
  D.t+=dt;dlvFxStep(D,dt);D.ping-=dt;D.comboT-=dt;D.shake=Math.max(0,D.shake-dt);
  for(const R of D.riders){moveRider(R,dt);riderButtons(R);
   // reload at Barro's
   const need=Math.min(st.cap,undone()-D.boxes.length-D.riders.filter(q=>q!==R).reduce((s,q)=>s+q.carry,0));
   if(R.carry<need&&Math.hypot(R.x-D.barros.door.x,R.y-D.barros.door.y)<95){R.carry=need;R.squish=0;R.bakeT=D.t;SFX.pick();D.float(R.x,R.y-30,'FRESH & HOT! x'+R.carry,'#7f7');}
   R.pathT-=dt;if(R.pathT<=0){R.pathT=.35;route(R);}}
  // rush orders: the phone rings mid-run
  if(D.rushLeft>0&&D.t>D.rushAt&&undone()>=1){const R=D.riders[0];
   const cand=D.houses.filter(h=>!D.orders.some(o=>o.h===h)&&(()=>{const d=Math.hypot(h.door.x-R.x,h.door.y-R.y);return d>350&&d<1000;})());
   if(cand.length){const h=cand[Math.floor(rng()*cand.length)],d=Math.hypot(h.door.x-R.x,h.door.y-R.y);
    D.orders.push({h,mood:{k:'rush',n:'Rush order',bonus:0,c:'#ff7a3a'},done:false,tip:0,cust:rng()<.5?'dad':'grandpa',rush:true,deadline:D.t+18+d/st.speed*1.6});
    D.rushLeft--;D.rushN++;D.rushMsg=2.5;for(let i=0;i<3;i++)setTimeout(()=>beep(1320,.08,'square',.05),i*140);}
   D.rushAt=D.t+18+rng()*10;}
  D.rushMsg=(D.rushMsg||0)-dt;
  for(const o of D.orders)if(o.rush&&!o.done&&!D.boxes.some(b=>b.o===o)&&D.t>o.deadline){o.cancel=true;D.float(o.h.door.x,o.h.door.y-30,'RUSH ORDER CANCELLED','#ff9ac0');}
  D.orders=D.orders.filter(o=>!o.cancel);
  // thrown boxes
  for(const x of D.boxes){x.t+=dt/.35;if(x.t>=1&&!x.o.done)deliver(x.o,x.R,x.drive);}D.boxes=D.boxes.filter(x=>x.t<1);
  if(D.orders.every(q=>q.done)&&D.boxes.length===0){finish();return;}
  // pickups: tip jars and boost pads
  for(const R of D.riders){if(R.crash>0)continue;
   for(const j of D.jars)if(!j.got&&Math.hypot(j.x-R.x,j.y-R.y)<20){j.got=true;bonus('jars',1,j.x,j.y-20,'TIP JAR +$1','#ffd23a');SFX.pick();puff(j.x,j.y,'#ffd23a',6,60);}
   for(const p of D.pads)if(p.cd<=0&&Math.abs(p.x-R.x)<20&&Math.abs(p.y-R.y)<20){p.cd=1.2;R.boost=Math.max(R.boost,.9);R.v=Math.max(R.v,st.speed*1.2);SFX.whoosh();D.float(R.x,R.y-30,'ZOOM!','#ffd23a');}}
  for(const p of D.pads)p.cd-=dt;
  // hazards
  const ridersOK=D.riders.filter(R=>R.hop<=0);
  for(const d of D.dogs){d.t-=dt;let tgt=null,dd=1e9;for(const R of ridersOK){const q=Math.hypot(d.x-R.x,d.y-R.y);if(q<dd){dd=q;tgt=R;}}
   if(d.state==='calm'){if(d.t<=0)d.state='sit';}
   else if(d.state==='sit'&&tgt&&dd<130){d.state='alert';d.t=.45;}
   else if(d.state==='alert'&&d.t<=0){d.state='chase';d.t=2.2;beep(300,.08,'square',.05);}
   if(d.state==='chase'&&tgt){const a=Math.atan2(tgt.y-d.y,tgt.x-d.x);d.x+=Math.cos(a)*140*dt;d.y+=Math.sin(a)*140*dt;if(dd<16){crash(tgt,'WOOF!',d.x,d.y);d.state='home';}if(d.t<=0||Math.hypot(d.x-d.hx,d.y-d.hy)>170){d.state='home';}}
   if(d.state==='home'||d.state==='calm'){const a=Math.atan2(d.hy-d.y,d.hx-d.x),h=Math.hypot(d.hy-d.y,d.hx-d.x);if(h>3){d.x+=Math.cos(a)*90*dt;d.y+=Math.sin(a)*90*dt;}else if(d.state==='home')d.state='sit';}}
  for(const k of D.kids){k.calm-=dt;if(k.calm>0)continue;k.x+=k.dir*k.sp*dt;if(k.x>k.x0+k.len)k.dir=-1;if(k.x<k.x0)k.dir=1;for(const R of ridersOK)if(Math.hypot(k.x-R.x,k.y-R.y)<17)crash(R,k.npc==='grandma'?'OOPS, SORRY!':k.npc?'WATCH IT!':'WHOA!',k.x,k.y);}
  for(const s of D.sprink)if(Math.sin(D.t*2+s.x)>-.2)for(const R of ridersOK)if(Math.hypot(s.x-R.x,s.y-R.y)<s.r&&R.slip<=0){R.slip=.6;D.float(R.x,R.y-30,'SPLASH!','#7ff');}
  for(const c of D.cars){c.nm-=dt;c.honk-=dt;let block=false;
   for(const R of D.riders){const ahead=c.horiz?(R.x-c.x)*c.dir:(R.y-c.y)*c.dir,side=c.horiz?Math.abs(R.y-c.y):Math.abs(R.x-c.x);
    if(ahead>0&&ahead<95&&side<24){block=true;if(c.honk<=0&&c.v>50){c.honk=2;beep(330,.1,'square',.04);setTimeout(()=>beep(300,.12,'square',.04),110);}}}
   c.v+=((block?0:c.sp)-c.v)*Math.min(1,dt*(block?6:2));
   if(c.horiz){c.x+=c.dir*c.v*dt;if(c.x>DMW+60)c.x=-60;if(c.x<-60)c.x=DMW+60;}else{c.y+=c.dir*c.v*dt;if(c.y>DMH+60)c.y=-60;if(c.y<-60)c.y=DMH+60;}
   const hw=c.horiz?c.l/2-2:c.w/2-2,hh=c.horiz?c.w/2-2:c.l/2-2;
   for(const R of D.riders){const dx=Math.abs(R.x-c.x),dy=Math.abs(R.y-c.y);
    if(dx<hw+7&&dy<hh+7)crash(R,'HONK!',c.x,c.y);
    else if(dx<hw+30&&dy<hh+30&&c.v>50&&R.v>110&&R.crash<=0&&c.nm<=0&&D.closeN<4){const ca=c.horiz?0:Math.PI/2;if(Math.abs(Math.cos(R.a-ca))<.5){c.nm=4;D.closeN++;bonus('close',1,R.x,R.y-44,'CLOSE CALL! +$1','#2de2f5');}}}}
  for(const f of D.floats){f.life-=dt;f.y-=26*dt;}D.floats=D.floats.filter(f=>f.life>0);
  for(const p of D.parts){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}D.parts=D.parts.filter(p=>p.life>0);if(D.parts.length>200)D.parts.splice(0,D.parts.length-200);
  for(const s of D.skids)s.life-=dt;while(D.skids.length&&D.skids[0].life<=0)D.skids.shift();
  // camera: smooth follow (both riders in co-op), looking ahead where you are heading
  let tx=0,ty=0;for(const R of D.riders){tx+=R.x+Math.cos(R.a)*R.v*DTUNE.lookAhead*(R.crash>0?0:1);ty+=R.y+Math.sin(R.a)*R.v*DTUNE.lookAhead*(R.crash>0?0:1);}
  tx/=D.riders.length;ty/=D.riders.length;const k=Math.min(1,dt*DTUNE.camLerp);
  D.cam.x+=(Math.max(0,Math.min(DMW-W,tx-W/2))-D.cam.x)*k;D.cam.y+=(Math.max(0,Math.min(DMH-H,ty-H/2))-D.cam.y)*k;
  // co-op: a rider who stays off screen gets zipped back next to their partner
  if(coop)for(const R of D.riders){const o=D.riders.find(q=>q!==R),out=R.x<D.cam.x-8||R.x>D.cam.x+W+8||R.y<D.cam.y+30||R.y>D.cam.y+H+8;
   R.off=out?R.off+dt:0;if(R.off>DTUNE.catchUp){for(const [ox,oy] of [[-30,0],[30,0],[0,30],[0,-30],[0,0]]){if(!hitSolid(o.x+ox,o.y+oy,10)){puff(R.x,R.y,'#fff',6);R.x=o.x+ox;R.y=o.y+oy;R.a=o.a;R.v=0;R.off=0;R.inv=Math.max(R.inv,1);puff(R.x,R.y,R.col,10);D.float(R.x,R.y-30,'CATCH UP!',R.col);break;}}}}};
 // ---------- drawing ----------
 function drawRider(R){const x=R.x-D.cam.x,y=R.y-D.cam.y,ch=R.ch,carry=R.carry,hop=R.hop;
  if(R.inv>0&&R.crash<=0&&!(R.dizzy>0)&&Math.floor(D.t*12)%2)return;
  const k='rides/'+rideId+'_'+ch,im=IMG[RIDE_ART[rideId+'_'+ch]||k];const s=1+(hop>0?Math.sin(hop/.5*Math.PI)*.3:0);
  if(dlvDrawRider(D,R,x,y,s)){if(coop)text(R.name,x,y-32,10,R.col,'center');return;}
  ctx.save();ctx.translate(x,y);ctx.rotate(R.a+R.spin+Math.PI/2);ctx.scale(s,s);
  if(im&&im.width){const fw=im.width/4,fr=Math.floor(D.t*Math.max(2,R.v/20))%4,h=64;ctx.drawImage(im,fr*fw,0,fw,im.height,-h*fw/im.height/2,-h/2,h*fw/im.height,h);ctx.restore();return;}
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(3,4,10,22,0,0,7);ctx.fill();
  const scoot=rideId==='scooter',body=st.r.col;ctx.lineWidth=2;ctx.strokeStyle='#111';
  ctx.fillStyle='#222';ctx.fillRect(-2.5,-24,5,11);ctx.fillRect(-2.5,13,5,11);          // tires
  ctx.fillStyle=body;ctx.fillRect(-3,-14,6,30);ctx.strokeRect(-3,-14,6,30);           // frame / deck
  ctx.fillStyle='#ccc';ctx.fillRect(-11,-16,22,3);                                     // handlebar
  if(!scoot){ctx.fillStyle=rideId==='agent_bike'?'#26408a':'#8a6a4a';ctx.fillRect(-9,9,18,14);ctx.strokeRect(-9,9,18,14);}  // back rack / thermal box
  for(let i=0;i<Math.min(carry,4);i++){ctx.fillStyle='#f5efe0';ctx.fillRect(-8,scoot?-28-i*2:10-i*2,16,12);ctx.strokeRect(-8,scoot?-28-i*2:10-i*2,16,12);}   // pizza boxes
  if(ch==='agent_sandy'){sandyTop(ctx);}else{const ped=Math.sin(D.t*Math.max(4,R.v/10));ctx.fillStyle=ch==='agent_coco'?'#1a2a6a':'#8a3ab8';
  ctx.beginPath();ctx.ellipse(-6,2+ped*3,3,6,0,0,7);ctx.ellipse(6,2-ped*3,3,6,0,0,7);ctx.fill();   // knees
  ctx.beginPath();ctx.ellipse(0,-2,9,7,0,0,7);ctx.fill();ctx.stroke();                              // shoulders
  ctx.fillStyle='#e8b58a';ctx.fillRect(-10,-14,4,8);ctx.fillRect(6,-14,4,8);                       // arms
  ctx.fillStyle='#6a3a1a';ctx.beginPath();ctx.arc(0,-3,7,0,7);ctx.fill();ctx.stroke();               // hair
  if(ch==='agent_coco'){ctx.fillStyle='#2de2f5';ctx.fillRect(-7,-8,14,3);}else{ctx.fillStyle='#6a3a1a';ctx.beginPath();ctx.ellipse(0,7,3,6,0,0,7);ctx.fill();ctx.fillStyle='#ff9ac0';ctx.fillRect(-2,2,4,3);}}
  ctx.restore();
  if(R.crash>0)for(let i=0;i<3;i++){const a=D.t*8+i*2.1;text('*',x+Math.cos(a)*16,y-18+Math.sin(a)*5,14,'#ffd23a','center');}
  if(coop)text(R.name,x,y-30,10,R.col,'center');}
 // minimap: drawn once, then dots on top every frame
 const MMS=.05,MM=document.createElement('canvas');MM.width=Math.ceil(DMW*MMS);MM.height=Math.ceil(DMH*MMS);
 {const m=MM.getContext('2d');for(let ty=0;ty<DNY;ty++)for(let tx=0;tx<DNX;tx++){const k=tileType(tx,ty);m.fillStyle=k==='road'?'#6a6a7a':k==='walk'?'#8a8478':'#3f7a34';m.fillRect(tx*DT_*MMS,ty*DT_*MMS,DT_*MMS+.5,DT_*MMS+.5);}
  m.fillStyle='#223';for(const h of D.houses)m.fillRect(h.x*MMS,h.y*MMS,h.w*MMS,h.h*MMS);const Bb=D.barros;m.fillStyle='#d8682a';m.fillRect(Bb.x*MMS,Bb.y*MMS,Bb.w*MMS,Bb.h*MMS);}
 const DARK=document.createElement('canvas');DARK.width=W;DARK.height=H;
 function drawMinimap(){const mx=W-MM.width-8,my=52;ctx.save();ctx.globalAlpha=.88;rrect(mx-3,my-3,MM.width+6,MM.height+6,6,'#061424','#ffd23a',2);ctx.drawImage(MM,mx,my);ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=1;ctx.strokeRect(mx+D.cam.x*MMS,my+D.cam.y*MMS,W*MMS,H*MMS);
  const blink=Math.floor(D.t*4)%2;
  for(const o of D.orders)if(!o.done){ctx.fillStyle=o.rush?'#ff7a3a':'#ffd23a';const r=blink||o.rush?3.2:2.4;ctx.beginPath();ctx.arc(mx+o.h.door.x*MMS,my+o.h.door.y*MMS,r,0,7);ctx.fill();}
  if(D.riders.some(R=>R.carry<=0)&&undone()>0){ctx.fillStyle='#7f7';ctx.beginPath();ctx.arc(mx+D.barros.door.x*MMS,my+D.barros.door.y*MMS,blink?4:3,0,7);ctx.fill();}
  for(const R of D.riders){const x=mx+R.x*MMS,y=my+R.y*MMS;ctx.fillStyle=R.col;ctx.strokeStyle='#000';ctx.beginPath();ctx.arc(x,y,3.4,0,7);ctx.fill();ctx.stroke();ctx.strokeStyle=R.col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(R.a)*7,y+Math.sin(R.a)*7);ctx.stroke();}
  ctx.restore();}
 function heatBar(R,x,y,w){const hot=30+st.thermal,tl=hot-(D.t-R.bakeT);const f=tl>0?tl/hot:tl>-20?(tl+20)/20:0,c=tl>0?'#ff7a3a':tl>-20?'#ffb347':'#9ad';
  rrect(x,y,w,11,5,'#223',null);if(f>0&&R.carry>0)rrect(x,y,Math.max(10,w*f),11,5,c,null);text(R.carry<=0?'EMPTY':tl>0?'HOT':tl>-20?'WARM':'COLD',x+w/2,y+9.5,9,R.carry<=0?'#9fb':'#fff','center','#000');if(R.carry>0)dIcon(tl>0?'temp_hot':tl>-20?'temp_warm':'temp_cold',x+w+6,y+3,22);}
 D.bg=dlvPaintBG(D,dRng(4242+D.houses.length));
 D.draw=function(){const sh=D.shake>0?D.shake*10:0,cx=D.cam.x+(Math.random()-.5)*sh,cy=D.cam.y+(Math.random()-.5)*sh;const b=D.riders[0];
  const t0x=Math.floor(cx/DT_),t0y=Math.floor(cy/DT_);
  if(D.bg)ctx.drawImage(D.bg,Math.round(cx),Math.round(cy),W,H,0,0,W,H);else for(let ty=t0y;ty<=t0y+H/DT_+1;ty++)for(let tx=t0x;tx<=t0x+W/DT_+1;tx++){const k=tileType(tx,ty),x=tx*DT_-cx,y=ty*DT_-cy;
   ctx.fillStyle=k==='road'?'#4a4a58':k==='walk'?'#c8c0b0':k==='grass'?((tx+ty)%2?'#6cbf4a':'#64b544'):'#222';ctx.fillRect(x,y,DT_+1,DT_+1);
   if(k==='road'){const mx=tx%DP,my=ty%DP;ctx.fillStyle='#ffd23a';if(my===1&&mx>=3)ctx.fillRect(x+4,y+15,14,3);if(mx===1&&my>=3)ctx.fillRect(x+15,y+4,3,14);}}
  ctx.fillStyle='rgba(20,20,20,.35)';for(const s of D.skids){if(s.x<cx-10||s.x>cx+W+10||s.y<cy-10||s.y>cy+H+10)continue;ctx.globalAlpha=Math.min(1,s.life)*.6;ctx.fillRect(s.x-cx-2,s.y-cy-2,4,4);}ctx.globalAlpha=1;
  // boost pads
  for(const p of D.pads){const x=p.x-cx,y=p.y-cy;if(x<-30||x>W+30||y<-30||y>H+30)continue;ctx.save();ctx.translate(x,y);if(!p.horiz)ctx.rotate(Math.PI/2);rrect(-16,-12,32,24,5,'rgba(255,210,58,.85)','#000',2);if(dIcon('bolt',0,0,20+Math.sin(D.t*8)*2,null,p.horiz?0:-Math.PI/2)){ctx.restore();continue;}
   ctx.strokeStyle='#b5582a';ctx.lineWidth=3;const o=(D.t*30)%10;for(const dx of [-8,2])for(const sg of [1,-1]){ctx.beginPath();ctx.moveTo(dx+o*.3-4,-6);ctx.lineTo(dx+o*.3+(sg>0?2:2),0);ctx.lineTo(dx+o*.3-4,6);ctx.stroke();break;}ctx.restore();}
  for(const s of D.sprink){const x=s.x-cx,y=s.y-cy;if(x<-40||x>W+40||y<-40||y>H+40)continue;const on=Math.sin(D.t*2+s.x)>-.2;if(dlvDrawSprinkler(D,s,x,y,on))continue;ctx.fillStyle='#555';ctx.fillRect(x-3,y-3,6,6);
   if(on){ctx.strokeStyle='rgba(150,230,255,.8)';ctx.lineWidth=2;for(let i=0;i<5;i++){const a=D.t*3+i*1.25;ctx.beginPath();ctx.arc(x,y,s.r*.9,a,a+.4);ctx.stroke();}}}
  // GPS route dots (behind houses and riders)
  for(const R of D.riders){if(!R.path||!R.tgt)continue;const c=coop?R.col:R.tgt.c;ctx.fillStyle=c;const ph=(D.t*6)%3;
   for(let i=1;i<R.path.length;i++){if((i+Math.floor(ph))%3)continue;const ti=R.path[i],x=(ti%DNX+.5)*DT_-cx,y=(((ti/DNX)|0)+.5)*DT_-cy;if(x<-10||x>W+10||y<-10||y>H+10)continue;
    ctx.globalAlpha=Math.max(.25,1-i/60);ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();}ctx.globalAlpha=1;}
  if(!D.bg)for(const h of D.houses){const x=h.x-cx,y=h.y-cy;if(x>W+10||x+h.w<-10||y>H+10||y+h.h<-30)continue;
   ctx.fillStyle='#d8cfc0';ctx.fillRect(h.door.x-cx-6,h.top?h.door.y-cy-36:h.door.y-cy,12,36);     // front path
   ctx.fillStyle=h.roof;ctx.strokeStyle='#111';ctx.lineWidth=2.5;ctx.fillRect(x,y,h.w,h.h);ctx.strokeRect(x,y,h.w,h.h);
   ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x,y+h.h/2,h.w,h.h/2);ctx.beginPath();ctx.moveTo(x,y+h.h/2);ctx.lineTo(x+h.w,y+h.h/2);ctx.stroke();
   ctx.fillStyle=h.col;ctx.fillRect(h.door.x-cx-8,h.door.y-cy-(h.top?0:5),16,5);}
  {const B=D.barros,x=B.x-cx,y=B.y-cy;if(x<W&&x+B.w>0&&y<H+90&&y+B.h>-30){if(!D.bg){ctx.fillStyle='#b5582a';ctx.strokeStyle='#111';ctx.lineWidth=3;ctx.fillRect(x,y,B.w,B.h);ctx.strokeRect(x,y,B.w,B.h);
   for(let i=0;i<12;i++){ctx.fillStyle=i%2?'#f5efe0':'#d83a3a';ctx.fillRect(x+i*B.w/12,y-10,B.w/12,12);}ctx.strokeRect(x,y-10,B.w,12);
   ctx.fillStyle='#8a5a2a';ctx.fillRect(x+B.w*.35,y+12,B.w*.3,B.h*.55);ctx.strokeRect(x+B.w*.35,y+12,B.w*.3,B.h*.55);   // the Lair on the roof
   text("BARRO'S",x+B.w/2,y+B.h-10,16,'#ffd23a','center');}
   if(D.riders.some(R=>R.carry<=0)&&undone()>0){const r=40+Math.sin(D.t*6)*6;ctx.strokeStyle='#7f7';ctx.lineWidth=3;ctx.beginPath();ctx.arc(B.door.x-cx,B.door.y-cy+14,r,0,7);ctx.stroke();text('RELOAD HERE',B.door.x-cx,B.door.y-cy+66,12,'#7f7','center');}}}
  if(!D.bg)for(const t of D.trees){const x=t.x-cx,y=t.y-cy;if(x<-30||x>W+30||y<-30||y>H+30)continue;ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.arc(x+4,y+4,t.r,0,7);ctx.fill();ctx.fillStyle='#2f8a3a';ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,t.r,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#4aaa4a';ctx.beginPath();ctx.arc(x-4,y-4,t.r*.5,0,7);ctx.fill();}
  // tip jars
  for(const j of D.jars){if(j.got)continue;const x=j.x-cx,y=j.y-cy-Math.abs(Math.sin(D.t*3+j.x))*4;if(x<-20||x>W+20||y<-20||y>H+20)continue;if(dIcon('tipjar',x,y,22))continue;
   rrect(x-7,y-9,14,16,4,'rgba(200,240,255,.85)','#111',2);ctx.fillStyle='#ffd23a';ctx.fillRect(x-5,y-1,10,6);text('$',x,y+5,9,'#7a5a00','center',null);}
  // orders: bouncing pin on each waiting house, toss target ring when a rider is in range
  const inRange=new Set();for(const R of D.riders)if(R.carry>0&&R.crash<=0){const o=tossTarget(R);if(o)inRange.add(o);}
  const custArt=!!dImg('cust_dad');
  if(custArt)for(const o of D.orders){const x=o.h.door.x-cx,y=o.h.door.y-cy+(o.h.top?-6:28);if(x<-40||x>W+40||y<-60||y>H+60)continue;dlvDrawCustomer(D,o,x,y);}
  for(const o of D.orders){if(o.done)continue;const dx=o.h.door.x-cx,dy=o.h.door.y-cy;const x=dx,y=(custArt?dy+(o.h.top?-42:-14):dy+(o.h.top?-18:14))-Math.abs(Math.sin(D.t*4))*8;if(x<-60||x>W+60||y<-60||y>H+60)continue;
   if(inRange.has(o)&&dIc('ring')){const r=1+Math.sin(D.t*10)*.1;dIcon('ring',dx,dy+(o.h.top?-6:14),34*r);}
   else if(inRange.has(o)){const r=18+Math.sin(D.t*10)*3;ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(dx,dy+(o.h.top?-6:6),r,0,7);ctx.stroke();ctx.strokeStyle='#ffd23a';ctx.beginPath();ctx.arc(dx,dy+(o.h.top?-6:6),r+5,0,7);ctx.stroke();}
   if(dIc('pin')){dIcon('pin',x,y-8,24);dIcon(dlvMood(o),x+17,y-18,18);text(o.h.name,x,y-24,10,'#fff','center');}
   else{ctx.fillStyle=o.rush?'#ff7a3a':'#ffd23a';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-10,9,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.moveTo(x-6,y-5);ctx.lineTo(x,y+6);ctx.lineTo(x+6,y-5);ctx.fill();
   ctx.fillStyle='#e03030';ctx.beginPath();ctx.arc(x,y-10,3.5,0,7);ctx.fill();text(o.h.name,x,y-24,10,'#fff','center');}
   if(o.rush){const tl=Math.max(0,o.deadline-D.t);text('RUSH '+Math.ceil(tl)+'s',x,y-36,11,tl<6&&Math.floor(D.t*6)%2?'#fff':'#ff7a3a','center');}}
  for(const k of D.kids){const x=k.x-cx,y=k.y-cy;if(x<-20||x>W+20||y<-20||y>H+20)continue;if(k.npc&&typeof drawDeliveryNpc==='function'&&drawDeliveryNpc(k,x,y))continue;if(!k.npc&&dlvDrawKid(D,k,x,y))continue;ctx.save();ctx.translate(x,y);ctx.rotate(k.dir>0?0:Math.PI);ctx.fillStyle='#555';ctx.fillRect(-12,-2,24,4);ctx.fillStyle=k.col;ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.beginPath();ctx.arc(2,0,6,0,7);ctx.fill();ctx.stroke();ctx.restore();}
  for(const d of D.dogs){const x=d.x-cx,y=d.y-cy;if(x<-20||x>W+20||y<-20||y>H+20)continue;if(dlvDrawDog(D,d,x,y)){if(d.state==='chase'||d.state==='alert')text('!',x,y-30,d.state==='alert'?18:14,'#ff3a3a','center');if(d.state==='calm')text('z',x+10,y-28,11,'#cfe','center');continue;}ctx.fillStyle='#a8743a';ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,9,6,0,0,7);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(x+8,y-3,4.5,0,7);ctx.fill();ctx.stroke();
   if(d.state==='chase'||d.state==='alert')text('!',x,y-12,d.state==='alert'?18:14,'#ff3a3a','center');if(d.state==='calm')text('z',x+8,y-12,11,'#cfe','center');}
  for(const c of D.cars){const x=c.x-cx,y=c.y-cy;if(x<-40||x>W+40||y<-40||y>H+40)continue;if(dlvDrawCar(c,x,y)){if(c.honk>1.6)text('HONK!',x,y-20,11,'#fff','center');continue;}ctx.save();ctx.translate(x,y);ctx.rotate(c.horiz?(c.dir>0?0:Math.PI):(c.dir>0?Math.PI/2:-Math.PI/2));
   ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(-21,-10,46,24);ctx.fillStyle=c.col;ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-24,-13,48,26,7);ctx.fill();ctx.stroke();
   ctx.fillStyle='#9ee8ff';ctx.fillRect(4,-10,9,20);ctx.fillRect(-16,-10,6,20);ctx.fillStyle='#fff6a0';ctx.fillRect(21,-11,3,5);ctx.fillRect(21,6,3,5);
   if(c.v<c.sp*.5){ctx.fillStyle='#ff3a3a';ctx.fillRect(-25,-11,3,5);ctx.fillRect(-25,6,3,5);}ctx.restore();
   if(c.honk>1.6)text('HONK!',x,y-20,11,'#fff','center');}
  for(const x of D.boxes){const px=x.x+(x.tx-x.x)*x.t-cx,py=x.y+(x.ty-x.y)*x.t-cy-Math.sin(x.t*Math.PI)*26;if(dIcon('box',px,py,18,null,x.t*9))continue;ctx.save();ctx.translate(px,py);ctx.rotate(x.t*9);ctx.fillStyle='#f5efe0';ctx.strokeStyle='#111';ctx.lineWidth=2;ctx.fillRect(-8,-8,16,16);ctx.strokeRect(-8,-8,16,16);ctx.restore();}
  for(const p of D.parts){ctx.globalAlpha=Math.min(1,p.life*3);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x-cx,p.y-cy,p.r,0,7);ctx.fill();}ctx.globalAlpha=1;
  dlvFxDraw(D,cx,cy);
  for(const R of D.riders){if(dlvRiderFx(D,R,R.x-cx,R.y-cy))continue;if(R.boost>0){ctx.strokeStyle=R.ch==='agent_coco'?'rgba(45,226,245,.7)':R.ch==='agent_sandy'?'rgba(255,242,122,.8)':'rgba(255,154,224,.7)';ctx.lineWidth=3;for(let i=0;i<4;i++){const o=(i-1.5)*6,bx=R.x-cx-Math.cos(R.a)*(26+i*6),by=R.y-cy-Math.sin(R.a)*(26+i*6);ctx.beginPath();ctx.moveTo(bx-Math.sin(R.a)*o,by+Math.cos(R.a)*o);ctx.lineTo(bx-Math.cos(R.a)*18-Math.sin(R.a)*o,by-Math.sin(R.a)*18+Math.cos(R.a)*o);ctx.stroke();}}
   if(R.ring>0){ctx.strokeStyle='rgba(255,230,120,'+R.ring*2+')';ctx.lineWidth=3;ctx.beginPath();ctx.arc(R.x-cx,R.y-cy,30+(.5-R.ring)*200,0,7);ctx.stroke();}}
  const sv=D.cam;D.cam={x:cx,y:cy};for(const R of D.riders)drawRider(R);D.cam=sv;
  if(D.evening){const dc=DARK.getContext('2d');dc.globalCompositeOperation='source-over';dc.clearRect(0,0,W,H);dc.fillStyle='rgba(10,8,40,.8)';dc.fillRect(0,0,W,H);dc.globalCompositeOperation='destination-out';
   const r=upgOwned('headlight')?250:170;for(const R of D.riders){const x=R.x-cx+Math.cos(R.a)*40,y=R.y-cy+Math.sin(R.a)*40,g=dc.createRadialGradient(x,y,r*.3,x,y,r);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');dc.fillStyle=g;dc.fillRect(0,0,W,H);}
   for(const o of D.orders)if(!o.done){const x=o.h.door.x-cx,y=o.h.door.y-cy,g=dc.createRadialGradient(x,y,4,x,y,50);g.addColorStop(0,'rgba(0,0,0,.9)');g.addColorStop(1,'rgba(0,0,0,0)');dc.fillStyle=g;dc.fillRect(x-50,y-50,100,100);}  // porch lights
   ctx.drawImage(DARK,0,0);}
  for(const f of D.floats)text(f.t,f.x-cx,f.y-cy,13,f.c,'center');
  // TOSS! prompt above a rider who can throw right now
  for(const R of D.riders)if(R.carry>0&&R.crash<=0&&tossTarget(R)){const x=R.x-cx,y=R.y-cy-(coop?46:36),pulse=1+Math.sin(D.t*12)*.08;ctx.save();ctx.translate(x,y);ctx.scale(pulse,pulse);rrect(-38,-13,76,24,10,'#ffd23a','#000',2);text(dKey(R.p,'toss')+': TOSS!',0,4,13,'#102','center',null);ctx.restore();}
  // edge arrows to waiting houses (and Barro's when someone needs to reload), and to an off-screen partner
  const targets=D.orders.filter(o=>!o.done).map(o=>({x:o.h.door.x,y:o.h.door.y,c:o.rush?'#ff7a3a':'#ffd23a'}));if(D.riders.some(R=>R.carry<=0)&&targets.length)targets.push({x:D.barros.door.x,y:D.barros.door.y,c:'#7f7'});
  if(coop)for(const R of D.riders)targets.push({x:R.x,y:R.y,c:R.col,who:R});
  const mid={x:D.riders.reduce((s,R)=>s+R.x,0)/D.riders.length-cx,y:D.riders.reduce((s,R)=>s+R.y,0)/D.riders.length-cy};
  for(const tg of targets){const x=tg.x-cx,y=tg.y-cy;if(x>0&&x<W&&y>48&&y<H)continue;const a=Math.atan2(y-mid.y,x-mid.x),ex=Math.max(18,Math.min(W-18,W/2+Math.cos(a)*300)),ey=Math.max(62,Math.min(H-18,H/2+Math.sin(a)*220));
   const tgtd=D.riders.some(R=>R.tgt&&Math.hypot(R.tgt.x-tg.x,R.tgt.y-tg.y)<40),s=tg.who?1.3:tgtd?1.5:.9;ctx.save();ctx.translate(ex,ey);ctx.rotate(a);ctx.fillStyle=tg.c;ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(14*s,0);ctx.lineTo(-8*s,-9*s);ctx.lineTo(-8*s,9*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
   if(tg.who)text(tg.who.name,ex,ey+22,10,tg.c,'center');}
  // HUD
  rrect(6,6,W-12,40,10,'rgba(6,20,36,.88)','#ffd23a',2);
  const group=(R,x0)=>{if(dIc('box')){for(let i=0;i<st.cap;i++)dIcon(i<R.carry?(i<R.squish?'box_squished':'box'):'box',x0+6+i*15,19,11,i<R.carry?1:.25);heatBar(R,x0,30,Math.max(48,st.cap*15-3));return;}for(let i=0;i<st.cap;i++){ctx.fillStyle=i<R.carry?(i<R.squish?'#e0b080':'#f5efe0'):'#334';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.fillRect(x0+i*15,13,12,12);ctx.strokeRect(x0+i*15,13,12,12);}
   heatBar(R,x0,30,Math.max(48,st.cap*15-3));};
  if(!coop){group(b,14);const bx=14+Math.max(60,st.cap*15)+18;if(dIcon('coin',bx+8,26,18))text(''+D.cash,bx+20,33,20,'#ffd23a','left',null);else text('$'+D.cash,bx,33,20,'#ffd23a','left',null);
   if(dIcon('home',bx+98,25,20))text('x'+undone(),bx+110,32,14,'#fff','left',null);else text('Left: '+undone(),bx+90,32,14,'#fff','left',null);
   dIcon('bolt',W-MM.width-(rider==='agent_coco'?96:128),26,18);text(rider==='agent_coco'?'BOOST x'+Math.min(b.boosts,99):(b.boostCd>0?'SPRINT...':'SPRINT READY'),W-MM.width-20,32,13,'#2de2f5','right',null);}
  else{group(D.riders[0],14);group(D.riders[1],W-MM.width-26-Math.max(60,st.cap*15));dIcon('coin',W/2-92,26,18);text('$'+D.cash,W/2-60,33,20,'#ffd23a','center',null);text('Left: '+undone(),W/2+30,32,14,'#fff','center',null);}
  if(D.state==='play'&&D.comboT>0&&D.orders.some(o=>o.done)){const f=D.comboT/DTUNE.comboTime;rrect(W/2-80,50,160,16,8,'rgba(6,20,36,.85)','#ff9ae0',2);rrect(W/2-78,52,156*f,12,6,'#ff9ae0',null);text('COMBO x'+(D.combo+2)+' if you hurry!',W/2,63,10,'#102','center',null);}
  if(D.rushMsg>0){const s=1+Math.sin(D.t*14)*.05;ctx.save();ctx.translate(W/2,150);ctx.scale(s,s);rrect(-130,-22,260,40,12,'#ff7a3a','#fff',3);text('RING RING! RUSH ORDER!',0,6,18,'#fff','center');ctx.restore();}
  drawMinimap();
  if(D.state==='intro')sandyBox(D.intro,['happy','proud','smug'][D.introIdx%3],Math.min(D.introIdx,D.intro.length-1));
  if(D.state==='pause'){dim(.6);panel(200,150,240,176);['RESUME','RESTART RUN','QUIT TO MAP (no tips)'].forEach((t,i)=>{const s=i===(D.sel||0);rrect(216,170+i*48,208,38,10,s?'#ffd23a':'rgba(30,60,90,.8)','#fff',2);text(t,W/2,195+i*48,14,s?'#102':'#fff','center',null);});}
  if(D.state==='end'){dim(Math.min(.6,D.endT*.5));text('ALL DELIVERED!',W/2,H/2-10,32,'#ffd23a','center');if(D.perfect)text('PERFECT RUN!',W/2,H/2+24,18,'#7f7','center');if(D.endT>1.6)text('Press A',W/2,H/2+54,14,'#cfe','center');}};
 return D;}

// ---------- results ----------
const DeliveryResults={name:'dresults',D:null,t:0,
 show(D,first){this.D=D;this.first=first;this.t=0;go(this);},
 enter(){startMusic('results');},
 update(dt){this.t+=dt;if(this.t>1&&(anyPressed('ok')||anyPressed('start'))){SFX.ok();if(this.first){MapScene.mode='city';MapScene.city='gilbert';}go(MapScene);if(this.first){MapScene.sel=1;MapScene.msg='Mission 1 is open! Head to the Heritage District.';MapScene.msgT=3;}}},
 draw(){const D=this.D;bgPic('scenes/lair_fistbump',.55);panel(90,24,460,432,'#ffd23a');text('SHIFT COMPLETE',W/2,62,28,'#ffd23a','center');
  for(let i=0;i<3;i++){if(dIcon('star',W/2-50+i*50,94,36,i<D.stars?1:.25))continue;ctx.save();ctx.translate(W/2-50+i*50,94);ctx.fillStyle=i<D.stars?'#ffd23a':'#334';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<10;k++){const r=k%2?8:18,a=-Math.PI/2+k*Math.PI/5;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();}
  const n=D.orders.length,rh=n>8?19:n>6?22:26;
  D.orders.forEach((o,i)=>{const y=134+i*rh;if(this.t<.15*i)return;const who=D.coop?(o.by?D.riders[1]:D.riders[0]):null;
   text(o.h.name,112,y,13,who?who.col:'#fff','left',null);text(o.temp+(o.rush?'  RUSH':o.mood.bonus?'  '+o.mood.n:''),290,y,11,o.temp==='HOT'?'#ff9a5a':'#9ad','left',null);text('$'+o.tip,528,y,14,'#ffd23a','right',null);});
  let y=134+n*rh+6;const B=D.bon||{};const extras=[['Combos',B.combo],['Drive-by tosses',B.drive],['Close calls',B.close],['Tip jars',B.jars],['Rush bonus',B.rush]].filter(e=>e[1]);
  if(extras.length&&this.t>.15*n){text(extras.map(e=>e[0]+' $'+e[1]).join('   '),W/2,y,11,'#7ff','center',null);y+=18;}
  if(D.perfect)text('Perfect run bonus',112,y,13,'#7f7','left',null),text('$'+(cheatOn('bigtips')?10:5),528,y,14,'#7f7','right',null);
  if(D.crashes)text('Crashes: '+D.crashes,112,y+(D.perfect?20:0),12,'#ff9ac0','left',null);
  text('TIPS: $'+D.cash,W/2,398,24,'#ffd23a','center');text('Cash now: $'+SAVE.coins,W/2,420,13,'#cfe','center',null);
  if(this.t>1)text(this.first?'A: continue. Mission 1 is unlocked!':'A: continue',W/2,442,14,'#2de2f5','center',null);}};
