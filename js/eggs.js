// ===== Easter Eggs: 16 hidden collectibles (Michael's Sequence 59 sheet), the Egg Shelf screen, Lair room backgrounds (v0.20) =====
// Art: assets/eggs/egg_<id>.png (tools/grid_props.py), rooms: assets/rooms/<room>.jpg (tools/slice_rooms.py).
// SAVE.eggs = {id: time found}. Each egg pays $10 the moment it's found and shows a banner.
// Kinds of egg:
//  pick: a glowing pickup hidden in a side-scroll mission (LEVEL_DEFS[lvl].eggs, added below). Picked up = found, even if the mission is lost.
//  ok(): found when the test passes (checked twice a second from drawOverlay), e.g. a mission record or a delivery count.
//  manual: given by code somewhere else (Sandy Mini: Y on the Lair roof, Tortoise: code SLOWPOKE).
// To add an egg: add art to assets/eggs, a row to EGGS, and a pickup or test.
ASSET_LIST.push(...['lair_workshop','lair_office','lair_maproom','lair_garage','lair_roof','lair_kitchen','barros_counter','barros_dining','school_class','school_hall','school_court','plaza_truck']
 .map(k=>['rooms/'+k,'assets/rooms/'+k+'.jpg']));
SAVE.eggs=SAVE.eggs||{};
const EGGS=[
 {id:'snowglobe',n:'Water Tower Snow Globe',d:"Gilbert's water tower in a tiny blizzard. It never snows in Gilbert. Except in here.",hint:'Mission 1: floating above an awning ledge in the Heritage District. Jump up from the ledge!',lvl:1,pick:{x:2270,y:228}},
 {id:'smileypizza',n:'Smiley Pizza',d:'A pepperoni pizza that is always happy to see you.',hint:'Mission 2: floating over the last big gap on the rooftops, above a skinny pole.',lvl:2,pick:{x:4570,y:205}},
 {id:'duck',n:'Hard Hat Duck',d:'A rubber duck with a safety helmet. Safety first, quack second.',hint:"Mission 3: up high near the end of the crane yard. Grab it before the screen scrolls away!",lvl:3,pick:{x:4470,y:212}},
 {id:'haybale',n:'Golden Hay Bale',d:'Gilbert was once the Hay Shipping Capital of the World. True story!',hint:'Mission 4: hack the Site Office without setting off a single alarm.',lvl:4,ok:()=>!!lv(4).silent},
 {id:'tractor',n:'Toy Tractor',d:'A little orange tractor from the old farm days.',hint:"Mission 5: above the last car rack before Papa Johnny.",lvl:5,pick:{x:2310,y:212}},
 {id:'flowerhat',n:'Flower Hard Hat',d:"Papa Johnny's old hard hat, now a flower pot. Much nicer.",hint:'Beat Papa Johnny and free Gilbert.',ok:()=>!!SAVE.done[5]},
 {id:'goldtooth',n:'Gold Tooth (Boxed)',d:'Not THAT gold tooth. A spare. Probably.',hint:'Old Bank Vault: get through without the alarm ever going off.',lvl:9,ok:()=>!!lv(9).ghost},
 {id:'roadrunner',n:'Roadrunner',d:'Beep beep! The fastest bird in the desert.',hint:'Getaway Truck: finish the chase without a single crash.',lvl:10,ok:()=>!!lv(10).noHit},
 {id:'handheld',n:'Pocket Game',d:'A tiny handheld with two familiar-looking heroes on the screen...',hint:"Finish your first pizza delivery for Barro's.",ok:()=>!!SAVE.firstDelivery},
 {id:'ticket',n:'Checkered Ticket',d:'A blank ticket with a racing stripe. Admit one speedy delivery kid.',hint:'Finish 5 pizza deliveries.',ok:()=>(SAVE.deliveries||0)>=5},
 {id:'goggles',n:'Spare Goggles',d:"Coco's backup goggles. The first pair got pizza sauce on them.",hint:'Earn 3 stars on any mission.',ok:()=>LEVELS.some(l=>!l.planned&&levelStars(l)>=3)},
 {id:'scrunchie',n:'Pink Scrunchie',d:"Sisi's lucky scrunchie. Do NOT lose this one.",hint:'Win any mission in 2-player co-op.',ok:()=>Object.keys(SAVE.lv||{}).some(k=>SAVE.lv[k].coop)},
 {id:'twintrophy',n:'Twin Agents Trophy',d:'Coco and Sisi in solid (plastic) gold.',hint:'Unlock 10 achievements.',ok:()=>achCount()>=10},
 {id:'phone',n:'Selfie Phone',d:'A phone with one photo: the mountains at sunset. Nice shot!',hint:'Save a song of your own in the Music Room.',ok:()=>(SAVE.songs||[]).length>0},
 {id:'sandymini',n:'Mini Sandy',d:'A tiny Sandy figure. Sandy says it is "not to scale" and she is "much cuter".',hint:'Look through the telescope on the Lair roof (press Y there).',manual:1},
 {id:'tortoise',n:'Cool Tortoise',d:'Slow, steady, and wearing sunglasses at night.',hint:'Some codes are slow and steady... try one that sounds like a slow tortoise.',manual:1}];
const EGG_BY={};EGGS.forEach(e=>{EGG_BY[e.id]=e;ASSET_LIST.push(['eggs/'+e.id,'assets/eggs/egg_'+e.id+'.png']);});
// hide the pickups in their missions
EGGS.forEach(e=>{if(e.pick&&LEVEL_DEFS[e.lvl])(LEVEL_DEFS[e.lvl].eggs=LEVEL_DEFS[e.lvl].eggs||[]).push({id:e.id,x:e.pick.x,y:e.pick.y});});
const eggCount=()=>EGGS.filter(e=>SAVE.eggs[e.id]).length;
const EGG_Q=[];let eggBanner=null,eggT=0;
function eggGive(id){if(SAVE.eggs[id]||!EGG_BY[id])return false;SAVE.eggs[id]=Date.now();SAVE.coins+=10;if(typeof ACH_LASTC!=='undefined')ACH_LASTC=SAVE.coins;save();EGG_Q.push({e:EGG_BY[id],life:3,n:eggCount()});return true;}
function eggCheck(){for(const e of EGGS){if(SAVE.eggs[e.id]||!e.ok)continue;let ok=false;try{ok=e.ok();}catch(x){}if(ok)eggGive(e.id);}}
function eggIcon(id,cx,cy,h,found){const k='eggs/'+id,i=IMG[k];if(!i||!i.width)return;
 if(found){imgC(k,cx,cy,h);return;}
 ctx.save();ctx.filter='brightness(0) opacity(.55)';imgC(k,cx,cy,h);ctx.restore();}
// banner at the bottom, so it never covers an achievement banner at the top
const _eggOverlay=drawOverlay;
drawOverlay=function(dt){_eggOverlay.apply(this,arguments);dt=dt||1/60;
 eggT-=dt;if(eggT<=0){eggT=.5;eggCheck();}
 if(!eggBanner&&EGG_Q.length){eggBanner=EGG_Q.shift();eggBanner.t=0;playStinger('clue');}
 const b=eggBanner;if(!b)return;b.t+=dt;if(b.t>b.life){eggBanner=null;return;}
 const s=Math.min(1,b.t*5,(b.life-b.t)*5),y=H+4-s*76,x=W/2-180;
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,s*1.2));rrect(x,y,360,62,14,'rgba(8,10,30,.96)','#ff7ad9',3);
 eggIcon(b.e.id,x+36,y+31,48,true);
 text('EASTER EGG FOUND!  '+b.n+' / '+EGGS.length,x+68,y+22,11,'#ff9ae0','left',null);
 text(b.e.n,x+68,y+45,16,'#fff','left',null);text('+$10',x+348,y+45,18,'#ffd23a','right',null);ctx.restore();};

// ---------- pickups in side-scroll missions ----------
const _eggMakeLevel=makeLevel;
makeLevel=function(def,np){const L=_eggMakeLevel(def,np);
 (def.eggs||[]).forEach(g=>{if(!SAVE.eggs[g.id])L.items.push({k:'egg',id:g.id,x:g.x,y:g.y,got:false});});
 const co=L.collect;L.collect=function(p,it){if(it.k==='egg'){eggGive(it.id);L.float(it.x,it.y-24,'EASTER EGG!','#ff9ae0');return;}return co.apply(this,arguments);};
 return L;};
function drawEggItem(it,x,y){ctx.save();ctx.globalAlpha=.35+.2*Math.sin(TIME*5);ctx.fillStyle='#ff7ad9';ctx.beginPath();ctx.arc(x,y,24,0,7);ctx.fill();ctx.restore();
 eggIcon(it.id,x,y,34,true);
 if(Math.sin(TIME*3+it.x)>.6){ctx.fillStyle='#fff';ctx.fillRect(x+14,y-20,2,8);ctx.fillRect(x+11,y-17,8,2);}}

// ---------- Tortoise code ----------
FUN_CODES.SLOWPOKE={title:'SLOW AND STEADY',text:'A tortoise in sunglasses wanders onto the screen, nods at you, and wanders off. Check the Egg Shelf!'};
const _eggCode=enterCode;enterCode=function(raw){const r=_eggCode.apply(this,arguments);if(String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'')==='SLOWPOKE')eggGive('tortoise');return r;};

// ---------- Egg Shelf screen (Lair menu) ----------
const EggShelf={name:'eggshelf',sel:0,
 make(){this.sel=0;return this;},enter(){startMusic('lair');},resume(){startMusic('lair');},
 update(){const n=EGGS.length;
  if(anyPressed('right')){this.sel=(this.sel+1)%n;SFX.move();}if(anyPressed('left')){this.sel=(this.sel+n-1)%n;SFX.move();}
  if(anyPressed('down')){this.sel=(this.sel+4)%n;SFX.move();}if(anyPressed('up')){this.sel=(this.sel+n-4)%n;SFX.move();}
  if(backPressed()||anyPressed('start')){SFX.move();pop();}},
 draw(){bgPic('rooms/lair_office',.55);text('EGG SHELF',W/2,40,28,'#ff9ae0','center');text(eggCount()+' / '+EGGS.length+' found',W-24,34,14,'#fff','right',null);
  panel(40,54,560,300,'#ff7ad9');
  EGGS.forEach((e,i)=>{const c=i%4,r=Math.floor(i/4),x=110+c*140,y=92+r*72,s=i===this.sel,got=!!(SAVE.eggs[e.id]||SAVE.testing);
   rrect(x-58,y-32,116,64,10,s?'rgba(255,122,217,.35)':'rgba(30,40,70,.6)',s?'#fff':'#3a4a6a',s?3:1.5);
   eggIcon(e.id,x,y,s?54+Math.sin(TIME*6)*2:48,got);if(!got)text('?',x,y+8,20,'#bcd','center',null);});
  const e=EGGS[this.sel],got=!!(SAVE.eggs[e.id]||SAVE.testing);panel(40,362,560,92,'#ff7ad9');
  text(got?e.n:'??? (not found yet)',58,388,17,got?'#fff':'#bcd','left',null);
  if(got&&SAVE.eggs[e.id])text('Found '+new Date(SAVE.eggs[e.id]).toLocaleDateString(),584,388,11,'#9fb','right',null);
  wrap(got?e.d:'Hint: '+e.hint,58,410,525,16,13,got?'#cfe':'#ffd9f2',null);
  if(got)wrap('Where: '+e.hint,58,442,525,14,10,'#9ab',null);
  text('D-pad: look   B: back',W/2,472,10,'#9fb','center',null);}};

// ---------- Lair menu: each choice shows its room ----------
const LAIR_ROOMS={'Pizza Delivery':['lair_kitchen','THE KITCHEN'],"Barro's Shop":['barros_counter',"BARRO'S COUNTER"],'Gadget Lab':['lair_workshop','THE WORKSHOP'],
 'Equip Gadgets':['lair_garage','THE GARAGE'],'Music Room':['barros_dining',"BARRO'S DINING ROOM"],'Trophy Case':['school_hall','SCHOOL TROPHY HALL'],
 'Egg Shelf':['lair_office','THE OFFICE'],'Gadget Watch':['lair_maproom','THE MAP ROOM'],'Back to map':['lair_roof','THE ROOF']};
const _lairItems=LairMenu.items;
LairMenu.items=function(){const I=_lairItems.apply(this,arguments);const i=I.findIndex(x=>x.n==='Gadget Watch');
 I.splice(i<0?I.length-1:i,0,{n:'Egg Shelf',d:'Your Easter Egg collection: '+eggCount()+' of '+EGGS.length+' found. Hints for the rest!',go:()=>push(EggShelf.make())});
 const b=I.find(x=>x.n==='Back to map');if(b)b.d=SAVE.eggs.sandymini?'Head back out into the night.':'Head back out into the night. Nice telescope up here...';
 return I;};
let lairPrev=null,lairFade=1;
const _lairUpd=LairMenu.update;
LairMenu.update=function(dt){const before=this.sel;
 const it=this.items()[this.sel];if(it&&it.n==='Back to map'&&anyPressed('gadget')){SFX.ok();
  if(eggGive('sandymini'))toast('You spot something tiny on the railing...','#ff9ae0');else toast('Stars, cacti and the Gilbert water tower. Pretty!','#9fb');return;}
 const r=_lairUpd.apply(this,arguments);if(this.sel!==before){lairPrev=LAIR_ROOMS[this.items()[before]?.n]?.[0]||null;lairFade=0;}lairFade=Math.min(1,lairFade+(dt||1/60)*5);return r;};
LairMenu.draw=function(){const I=this.items(),it=I[this.sel]||I[0],room=LAIR_ROOMS[it.n]||['lair_roof','THE LAIR'];
 const has=k=>IMG['rooms/'+k]&&IMG['rooms/'+k].width;
 if(has(room[0])){if(lairFade<1&&lairPrev&&has(lairPrev))img('rooms/'+lairPrev,0,0,W,H);ctx.globalAlpha=lairFade;img('rooms/'+room[0],0,0,W,H);ctx.globalAlpha=1;dim(.18);}
 else bgPic('scenes/lair_window',.35);
 const g=ctx.createLinearGradient(0,0,330,0);g.addColorStop(0,'rgba(6,10,30,.55)');g.addColorStop(1,'rgba(6,10,30,0)');ctx.fillStyle=g;ctx.fillRect(0,0,330,H);
 panel(24,88,280,326);text('THE LAIR',164,76,26,'#ffd23a','center');cashTag();
 rrect(W-230,52,206,26,8,'rgba(6,20,36,.85)','#ffd23a',2);text(room[1],W-127,70,13,'#ffd23a','center',null);
 I.forEach((x,i)=>{const y=96+i*35,s=i===this.sel;rrect(40,y,248,30,9,s?'rgba(255,210,58,.95)':'rgba(30,60,90,.82)',s?'#fff':'#2de2f5',2);
  text(x.n,164,y+21,15,s?'#102':'#fff','center',null);
  if(i===0&&!SAVE.firstDelivery){ctx.fillStyle='#ff5a8a';ctx.beginPath();ctx.arc(282,y+7,6+Math.sin(TIME*6)*1.5,0,7);ctx.fill();}});
 if(it.d){panel(24,420,592,48,'#456');wrap(it.d,40,450,560,16,14,'#cfe',null);}
 drawToast();};
// Trophy Case gets the school trophy hall behind it
const _tcDraw=TrophyCase.draw;TrophyCase.draw=function(){const k='rooms/school_hall';if(!(IMG[k]&&IMG[k].width))return _tcDraw.apply(this,arguments);
 const fr=ctx.fillRect;let first=true;ctx.fillRect=function(x,y,w,h){if(first&&x===0&&y===0&&w===W&&h===H){first=false;img(k,0,0,W,H);ctx.fillStyle='rgba(10,8,32,.62)';return fr.call(this,x,y,w,h);}return fr.apply(this,arguments);};
 try{_tcDraw.apply(this,arguments);}finally{ctx.fillRect=fr;}};

// ---------- egg achievements ----------
if(typeof ACH!=='undefined'){const add=(id,n,d,c,cash,ok,p,h)=>{a(id,n,d,c,cash,ok,p,h);const x=ACH[ACH.length-1];x.tier=x.cash>=100?3:x.cash>=50?2:x.cash>=20?1:0;ACH_BY[id]=x;
  const i=ACH.findIndex(y=>y.id==='f_all');if(i>=0)ACH.push(ACH.splice(i,1)[0]);};
 add('egg_1','Egg-cellent!','Find your first Easter Egg.','fun',10,()=>eggCount()>=1);
 add('egg_8','Egg Hunter','Find 8 Easter Eggs.','fun',40,()=>eggCount()>=8,()=>[Math.min(eggCount(),8),8]);
 add('egg_all','Golden Basket','Find all '+EGGS.length+' Easter Eggs.','fun',120,()=>eggCount()>=EGGS.length,()=>[eggCount(),EGGS.length]);}
