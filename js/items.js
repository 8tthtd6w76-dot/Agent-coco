// ===== Items: crafting parts, gadgets, rides and ride upgrades (data + save helpers) =====
// Design: design/gadgets_parts_rides_spec.md. Art (optional): assets/items/<id>.png replaces the code icon.
// SAVE fields: coins (cash), parts{id:count} (common, used up), rare{id:true} (kept forever),
//  gadgets{id:quality 0 Basic,1 Good,2 Perfect}, smoke (pellets left), equip{char:[slot1,slot2]},
//  rides{id:true}, ride (picked for deliveries), upg{id:true}, deliveries (count), firstDelivery, bestTips.
const QUALITY=['Basic','Good','Perfect'];
const PARTS=[
 {id:'wire',n:'Wire Spool',price:3,col:'#d9822b',d:'Copper wire on a red spool.'},
 {id:'board',n:'Circuit Board',price:5,col:'#2f9a4a',d:'A small green board with gold dots.'},
 {id:'battery',n:'Battery Cell',price:4,col:'#ffd23a',d:'Chunky battery with a lightning cap.'},
 {id:'led',n:'LED Bulb',price:2,col:'#7ff',d:'Tiny glowing bulb.'},
 {id:'screws',n:'Screw Pack',price:2,col:'#b8c0cc',d:'Screws, nuts and bolts.'},
 {id:'spring',n:'Spring',price:3,col:'#dde',d:'A shiny coil spring.'},
 {id:'magnet',n:'Magnet',price:4,col:'#e83a3a',d:'Red horseshoe magnet.'},
 {id:'wheel',n:'Rubber Wheel',price:4,col:'#333',d:'Small black wheel, yellow hub.'},
 {id:'motor',n:'Mini Motor',price:8,col:'#6a7a9a',d:'A tiny electric motor.'},
 {id:'filament',n:'Filament Roll',price:5,col:'#ff8a1a',d:'Bright orange 3D-printer plastic.'},
 {id:'fabric',n:'Fabric Patch',price:3,col:'#2a3a8a',d:'Navy cloth for sewing.'},
 {id:'tape',n:'Duct Tape',price:2,col:'#aab',d:'Fix-it: turns a Basic craft into Good, once.'}];
// Rare parts: hidden in one stage each. lvl = mission id (null = later territory). Kept forever once found.
const RARE=[
 {id:'bank_gear',n:'Old Bank Gear',lvl:1,where:'Mission 1, up high near the old bank',col:'#c99a3a'},
 {id:'sun_chip',n:'Sun Chip',lvl:2,where:'Mission 2, in the air over a big rooftop gap',col:'#3a8aff'},
 {id:'turbo_coil',n:'Turbo Coil',lvl:3,where:'Mission 3, the Courier drops it',col:'#ff7a1a'},
 {id:'camera_lens',n:'Camera Lens',lvl:4,where:'Mission 4, crack file 3 with 20+ seconds left',col:'#9ad'},
 {id:'dozer_piston',n:'Dozer Piston',lvl:5,where:'Mission 5, beat a bulldozer',col:'#ffc21a'},
 {id:'taxi_horn',n:'Taxi Horn',lvl:null,where:'Downtown Phoenix',col:'#d9a520'},
 {id:'meter_chip',n:'Meter Chip',lvl:null,where:'Downtown Phoenix',col:'#4a5'},
 {id:'bubble_jar',n:'Bubble Jar',lvl:null,where:'Tempe',col:'#c8f'},
 {id:'stink_filter',n:'Stink Filter',lvl:null,where:'Tempe',col:'#6c3'},
 {id:'glitch_crystal',n:'Glitch Crystal',lvl:null,where:'Chandler',col:'#f6c'},
 {id:'rocket_booster',n:'Rocket Booster',lvl:null,where:'Chandler',col:'#ccd'}];
// Gadgets. craft: solder | print | snap. ch = charges per mission [Basic,Good,Perfect] (null = passive).
// use: what Down + Gadget does (gadgets.js). Fee is cash.
const GADGET_DEFS=[
 {id:'smoke',n:'Smoke Pellets',craft:'print',parts:{filament:1,battery:1},fee:5,ch:[3,4,5],consumable:true,buy:15,col:'#8a9ab8',
  d:'Drop a smoke cloud. Enemies inside lose you and wander for 4 seconds.'},
 {id:'shield',n:'Pizza Shield',craft:'print',parts:{filament:2,magnet:1},fee:10,ch:[2,3,4],col:'#ffb347',
  d:'Spinning pizza-pan shield for 3 seconds. Blocks hits and bounces bricks back.'},
 {id:'magnet_glove',n:'Magnet Glove',craft:'snap',parts:{magnet:2,wire:1,screws:1},fee:10,ch:[3,4,5],col:'#e83a3a',
  d:'Pulls coins, pizza and parts to you. Yanks the brick sack off throwers.'},
 {id:'grapple',n:'Grapple Hook',craft:'snap',parts:{spring:1,wire:2},rare:['bank_gear'],fee:20,ch:[99,99,99],cd:[2,2,1],col:'#c99a3a',
  d:'Zip up to the next ledge above you. Reach high secret spots.'},
 {id:'holo',n:'Holo-Sandy Decoy',craft:'solder',parts:{led:2,board:1},rare:['sun_chip'],fee:20,ch:[2,3,4],col:'#2de2f5',
  d:'A dancing Sandy hologram for 5 seconds. Enemies go stare at her.'},
 {id:'skates',n:'Hover Skates',craft:'solder',parts:{wheel:2,motor:1,battery:1},rare:['turbo_coil'],fee:25,ch:null,col:'#2de2f5',
  d:'Always on: run faster, floatier jumps. Hold jump while falling to glide over gaps.'},
 {id:'hamster',n:'Hamster Ray',craft:'solder',parts:{board:1,led:1,battery:1},rare:['camera_lens'],fee:25,ch:[3,4,5],col:'#ff9ac0',
  d:'Turns a henchman into a harmless hamster for 6 seconds. Bosses just get dizzy.'},
 {id:'drone',n:'Spy Drone',craft:'snap',parts:{motor:2,battery:1},rare:['camera_lens'],fee:25,ch:[1,2,3],col:'#4a6aff',
  d:'Fly the camera ahead for 6 seconds. Shows hidden items and enemies.'},
 {id:'honk',n:'Honk Blaster',craft:'solder',parts:{board:1,battery:2},rare:['taxi_horn'],fee:30,ch:[1,2,3],col:'#d9a520',
  d:'A giant HONK stuns every enemy on screen.'},
 {id:'bubble',n:'Bubble Vaporizer',craft:'solder',parts:{battery:1,wire:1,led:1},rare:['bubble_jar'],fee:30,ch:[2,3,4],col:'#c8f',
  d:'Bubbles up barrels and junk. Enemies float in a bubble for 3 seconds.'},
 {id:'wind',n:'Wind Fan',craft:'print',parts:{filament:2,motor:1},rare:['stink_filter'],fee:30,ch:[3,4,5],col:'#9fe',
  d:'A big gust pushes enemies, barrels and bricks away.'},
 {id:'goggles',n:'Glitch Goggles',craft:'print',parts:{filament:1,led:2,fabric:1},rare:['glitch_crystal'],fee:35,ch:null,col:'#f6c',
  d:'Always on: arrows point to hidden clues and parts. Perfect: early warning on boss attacks.'},
 {id:'space',n:'Send-to-Space',craft:'snap',parts:{battery:2,screws:1},rare:['dozer_piston','rocket_booster'],fee:50,ch:[1,1,2],col:'#ccd',
  d:'Rockets a henchman into the sky. Bosses lose their hat and get stunned.'}];
// Rides for pizza deliveries (top-down). Stats 1-5. Waymo and Metro are map rides for later.
const RIDES=[
 {id:'bike',n:"Barro's Delivery Bike",speed:3,turn:3,cap:4,col:'#d83a3a',perk:'Big back rack. A bit wobbly on grass.',how:'Lent by Barro\'s'},
 {id:'scooter',n:'Scooter',speed:4,turn:5,cap:3,col:'#2a3a8a',perk:'Jump button: curb hop over puddles, sprinklers and leashes.',how:'Win Mission 3'},
 {id:'agent_bike',n:'Agent Bike',speed:5,turn:4,cap:5,col:'#1a2a6a',perk:'Longer boost. Built-in thermal box keeps pizzas hot longer.',how:'Craft in the Gadget Lab',
  craft:'snap',parts:{wheel:2,spring:1,motor:1,screws:1},rare:['meter_chip'],fee:60},
 {id:'waymo',n:'Waymo',later:true,how:'Unlocks in Tempe'},{id:'metro',n:'Metro',later:true,how:'Unlocks in Chandler'}];
const UPGRADES=[
 {id:'bell',n:'Bell',price:10,d:'Jump button: ring it. Dogs and kids step aside.'},
 {id:'headlight',n:'Headlight',price:15,d:'Evening runs: see farther.'},
 {id:'basket',n:'Big Basket',price:20,d:'+1 pizza on any ride.'},
 {id:'thermal',n:'Thermal Bag',price:25,d:'Pizzas stay hot 10 seconds longer.'},
 {id:'fattires',n:'Fat Tires',price:30,d:'Grass and gravel do not slow you.'},
 {id:'turbo',n:'Turbo Battery',price:40,d:'+1 boost and faster recharge.'}];

// ---- save defaults ----
SAVE.parts=SAVE.parts||{};SAVE.rare=SAVE.rare||{};SAVE.gadgets=SAVE.gadgets||{};SAVE.smoke=SAVE.smoke||0;
SAVE.equip=SAVE.equip||{agent_coco:[null,null],agent_sisi:[null,null]};SAVE.rides=SAVE.rides||{bike:true};SAVE.ride=SAVE.ride||'bike';
SAVE.upg=SAVE.upg||{};SAVE.deliveries=SAVE.deliveries||0;
// anyone who already played Mission 1 before deliveries existed doesn't have to do the tutorial
if(SAVE.done&&SAVE.done[1])SAVE.firstDelivery=true;

const partDef=id=>PARTS.find(p=>p.id===id)||RARE.find(p=>p.id===id);
const gadgetDef=id=>GADGET_DEFS.find(g=>g.id===id);
const rideDef=id=>RIDES.find(r=>r.id===id);
const partCount=id=>SAVE.testing?99:(SAVE.parts[id]||0);
const rareFound=id=>!!(SAVE.rare[id]||SAVE.testing);
function hasGadget(id){return SAVE.testing||SAVE.gadgets[id]!=null||(id==='skates'&&ownsCheat('skates'));}
function gadgetQ(id){return SAVE.testing?2:(SAVE.gadgets[id]!=null?SAVE.gadgets[id]:1);}
function rideOwned(id){return SAVE.testing||!!SAVE.rides[id]||(id==='scooter'&&!!SAVE.vehicles.Scooter);}
const upgOwned=id=>SAVE.testing||!!SAVE.upg[id];
function slotsFor(){return (SAVE.xp>=200||SAVE.testing)?2:1;}   // 2nd slot at Agent rank
function equipped(ch){const e=(SAVE.equip[ch]||[]).slice(0,slotsFor());return e.filter(g=>g&&hasGadget(g));}
// can this recipe be made right now? returns {ok, missing:[{id,need,have,rare}]}
function recipeCheck(r){const miss=[];for(const id in r.parts){const have=partCount(id);if(have<r.parts[id])miss.push({id,need:r.parts[id],have});}
 for(const id of (r.rare||[]))if(!rareFound(id))miss.push({id,need:1,have:0,rare:true});
 const cash=SAVE.testing||SAVE.coins>=r.fee;return {ok:!miss.length&&cash,missing:miss,cash};}
function spendRecipe(r){if(SAVE.testing)return;for(const id in r.parts)SAVE.parts[id]=(SAVE.parts[id]||0)-r.parts[id];SAVE.coins-=r.fee;}
function giveRare(id){if(SAVE.rare[id])return false;SAVE.rare[id]=true;save();return true;}
function givePart(id,n=1){SAVE.parts[id]=(SAVE.parts[id]||0)+n;save();}

// ---- code-drawn item icon (real art in assets/items/<id>.png wins) ----
function itemIcon(id,cx,cy,s,dimmed){const k='items/'+id,im=IMG[k];
 if(im&&im.width){ctx.save();if(dimmed)ctx.filter='brightness(0) opacity(.45)';imgC(k,cx,cy,s);ctx.restore();return;}
 const d=partDef(id)||gadgetDef(id)||rideDef(id)||UPGRADES.find(u=>u.id===id)||{n:'?',col:'#888'};
 const rare=RARE.includes(d),r=s/2;ctx.save();
 if(dimmed){ctx.fillStyle='#141824';ctx.strokeStyle='#345';}else{ctx.fillStyle=d.col||'#888';ctx.strokeStyle=rare?'#ffd23a':'#000';}
 ctx.lineWidth=rare?3:2;ctx.beginPath();ctx.roundRect(cx-r,cy-r,s,s,s*.25);ctx.fill();ctx.stroke();
 if(!dimmed){ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(cx-r*.35,cy-r*.45,r*.4,r*.18,-.5,0,7);ctx.fill();
  const ab=d.n.replace(/[^A-Za-z ]/g,'').split(' ').filter(w=>w.length>1).map(w=>w[0]).join('').slice(0,2).toUpperCase();
  text(ab,cx,cy+s*.17,Math.round(s*.42),'#fff','center','#000');
  if(rare){ctx.fillStyle='#fff';const tw=Math.sin(TIME*4+cx)*.5+.5;ctx.globalAlpha=tw;ctx.fillRect(cx+r*.55,cy-r*.85,3,3);ctx.globalAlpha=1;}}
 else text('?',cx,cy+s*.17,Math.round(s*.45),'#567','center',null);
 ctx.restore();}
