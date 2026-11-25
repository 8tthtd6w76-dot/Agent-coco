// ===== Lair menu, Barro's shop, Gadget Lab, crafting minigames, equip screen =====
// All screens are pushed over the map (push/pop) and work with D-pad + A/B only (handheld friendly).
function bgPic(k,a=.55){if(IMG[k]&&IMG[k].width)img(k,0,0,W,H);else{ctx.fillStyle='#120a2a';ctx.fillRect(0,0,W,H);}dim(a);}
function panel(x,y,w,h,col='#2de2f5'){rrect(x,y,w,h,14,'rgba(6,20,36,.93)',col,3);}
function cashTag(x=W-24,y=34){text('$'+SAVE.coins,x,y,20,'#ffd23a','right');}
function navList(o,n){if(!n)return;if(anyPressed('down')){o.sel=(o.sel+1)%n;SFX.move();}if(anyPressed('up')){o.sel=(o.sel+n-1)%n;SFX.move();}if(o.sel>=n)o.sel=n-1;}
const backPressed=()=>anyPressed('back');
let TOAST=null;function toast(t,c='#ffd23a'){TOAST={t,c,life:1.8};}
function drawToast(dt){if(!TOAST)return;TOAST.life-=dt||1/60;if(TOAST.life<=0){TOAST=null;return;}ctx.globalAlpha=Math.min(1,TOAST.life*2);rrect(W/2-200,H/2-26,400,48,12,'rgba(6,20,36,.97)',TOAST.c,3);text(TOAST.t,W/2,H/2+6,16,TOAST.c,'center',null);ctx.globalAlpha=1;}

// ---------- Lair menu (map node) ----------
const LairMenu={name:'lairmenu',sel:0,
 items(){return [
  {n:'Pizza Delivery',d:SAVE.firstDelivery?"Ride for Barro's and earn cash tips. Always open!":"Your first delivery for Barro's. Do this before Mission 1!",go:()=>push(DeliveryPick)},
  {n:"Barro's Shop",d:'Buy crafting parts, Smoke Pellets and ride upgrades.',go:()=>push(Shop.make())},
  {n:'Gadget Lab',d:'Craft gadgets from your parts. Rare parts are hidden in missions.',go:()=>push(Lab.make())},
  {n:'Equip Gadgets',d:'Pick the gadget each agent takes on missions. Down + Gadget uses it.',go:()=>push(Equip.make())},
  {n:'Music Room',d:'Jukebox, the Groove Machine, your saved songs and the theme picker.',go:()=>push(MusicRoom.make())},
  {n:'Trophy Case',d:'Every achievement, its cash reward and your progress. Secret ones hide as ???',go:()=>push(TrophyCase.make())},
  {n:'Gadget Watch',d:'Missions, case board, garage, Sandy.',go:()=>push(Watch.make('map'))},
  {n:'Back to map',d:'',go:()=>pop()}];},
 enter(){this.sel=SAVE.firstDelivery?0:0;startMusic('lair');},resume(){startMusic('lair');},
 update(dt){const I=this.items();navList(this,I.length);if(anyPressed('ok')){SFX.ok();I[this.sel].go();return;}if(backPressed()||anyPressed('start')){SFX.move();pop();}},
 draw(){bgPic('scenes/lair_window',.35);panel(24,90,280,328);text('THE LAIR',164,76,26,'#ffd23a','center');cashTag();
  this.items().forEach((it,i)=>{const y=100+i*40,s=i===this.sel;rrect(40,y,248,34,10,s?'rgba(255,210,58,.95)':'rgba(30,60,90,.8)',s?'#fff':'#2de2f5',2);
   text(it.n,164,y+23,16,s?'#102':'#fff','center',null);if(i===0&&!SAVE.firstDelivery){ctx.fillStyle='#ff5a8a';ctx.beginPath();ctx.arc(282,y+8,6+Math.sin(TIME*6)*1.5,0,7);ctx.fill();}});
  const it=this.items()[this.sel];if(it.d){panel(24,420,592,48,'#456');wrap(it.d,40,450,560,16,14,'#cfe',null);}
  drawToast();}};

// ---------- Barro's shop ----------
const Shop={name:'shop',tab:0,sel:0,
 make(){this.tab=0;this.sel=0;return this;},
 enter(){startMusic('shop');},resume(){startMusic('shop');},
 rows(){if(this.tab===0)return PARTS.map(p=>({id:p.id,n:p.n,d:p.d,price:p.price,own:'x'+partCount(p.id),buy:()=>givePart(p.id)}));
  if(this.tab===1)return [{id:'smoke',n:'Smoke Pellets (pack of 3)',d:gadgetDef('smoke').d+' Bought packs are Good quality.',price:15,own:'x'+(SAVE.testing?99:SAVE.smoke),buy:()=>{SAVE.smoke+=3;if(SAVE.gadgets.smoke==null)SAVE.gadgets.smoke=1;autoEquip('smoke');}}];
  return UPGRADES.map(u=>({id:u.id,n:u.n,d:u.d,price:u.price,own:upgOwned(u.id)?'OWNED':'',sold:upgOwned(u.id),buy:()=>{SAVE.upg[u.id]=true;}}));},
 update(dt){if(anyPressed('left')){this.tab=(this.tab+2)%3;this.sel=0;SFX.move();}if(anyPressed('right')){this.tab=(this.tab+1)%3;this.sel=0;SFX.move();}
  const R=this.rows();navList(this,R.length);
  if(anyPressed('ok')){const r=R[this.sel];if(r.sold){toast('Already owned','#9fb');SFX.move();}
   else if(SAVE.coins<r.price){toast('Not enough cash. Do a pizza delivery!','#ff5a8a');SFX.hurt();}
   else{SAVE.coins-=r.price;r.buy();save();SFX.ok();toast('Bought: '+r.n);}}
  if(backPressed()||anyPressed('start')){SFX.move();pop();}},
 draw(){bgPic('scenes/barros',.45);text("BARRO'S SHOP",W/2,40,28,'#ffd23a','center');cashTag();
  ['PARTS','GADGETS','RIDE UPGRADES'].forEach((t,i)=>{const x=110+i*150,s=i===this.tab;rrect(x-65,54,130,28,8,s?'#ffd23a':'rgba(30,60,90,.85)',s?'#fff':'#2de2f5',2);text(t,x,74,13,s?'#102':'#fff','center',null);});
  const R=this.rows();panel(20,90,600,326);const top=Math.max(0,Math.min(this.sel-4,R.length-9));
  R.slice(top,top+9).forEach((r,j)=>{const i=top+j,y=100+j*34,s=i===this.sel;rrect(32,y,576,30,7,s?'rgba(255,210,58,.9)':'rgba(30,60,90,.6)',s?'#fff':'#2de2f5',1.5);
   itemIcon(r.id,50,y+15,24);text(r.n,70,y+21,14,s?'#102':'#fff','left',null);text(r.own,470,y+21,13,s?'#102':'#9fb','right',null);text('$'+r.price,596,y+21,14,s?'#102':(SAVE.coins>=r.price?'#ffd23a':'#a66'),'right',null);});
  const r=R[this.sel];panel(20,424,600,48,'#456');wrap(r.d,36,453,570,16,13,'#cfe',null);
  text('Left/Right: tabs   A: buy   B: back',W-24,H-4,10,'#9fb','right',null);drawToast();}};

// ---------- Gadget Lab: pick a gadget (or the Agent Bike), see parts, craft ----------
function labList(){return GADGET_DEFS.map(g=>({kind:'gadget',def:g})).concat([{kind:'ride',def:rideDef('agent_bike')}]);}
function autoEquip(id){for(const ch of ['agent_coco','agent_sisi']){const e=SAVE.equip[ch]||(SAVE.equip[ch]=[null,null]);if(!e[0])e[0]=id;}}
const Lab={name:'lab',sel:0,
 make(){this.sel=0;return this;},enter(){startMusic('lair');},resume(){startMusic('lair');},
 update(){const L=labList();navList(this,L.length);
  if(anyPressed('ok')){const it=L[this.sel],r=it.def,c=recipeCheck(r);
   if(it.kind==='ride'&&rideOwned('agent_bike')){toast('You already built the Agent Bike!','#9fb');return;}
   if(!c.ok){toast(c.missing.some(m=>m.rare)?'Missing a rare part: find it in a mission':!c.cash?'Not enough cash for the fee':'Missing parts: buy them at Barro\'s','#ff5a8a');SFX.hurt();return;}
   spendRecipe(r);save();SFX.ok();push(Craft.make(it));return;}
  if(backPressed()||anyPressed('start')){SFX.move();pop();}},
 draw(){bgPic('scenes/lair_lab',.5);text('GADGET LAB',W/2,40,28,'#2de2f5','center');cashTag();
  const L=labList();panel(14,60,250,410);const top=Math.max(0,Math.min(this.sel-5,L.length-11));
  L.slice(top,top+11).forEach((it,j)=>{const i=top+j,y=70+j*36,s=i===this.sel,r=it.def,own=it.kind==='ride'?rideOwned('agent_bike'):SAVE.gadgets[r.id]!=null||SAVE.testing,ok=recipeCheck(r).ok;
   rrect(24,y,230,32,7,s?'rgba(255,210,58,.9)':'rgba(30,60,90,.6)',s?'#fff':(ok?'#7f7':'#2de2f5'),1.5);itemIcon(r.id,42,y+16,24);
   text(r.n,60,y+21,13,s?'#102':'#fff','left',null);if(own)text(it.kind==='ride'?'BUILT':QUALITY[gadgetQ(r.id)][0],246,y+21,12,s?'#102':'#ffd23a','right',null);});
  const it=L[this.sel],r=it.def,c=recipeCheck(r);panel(276,60,350,410);
  itemIcon(r.id,316,104,52);text(r.n,352,100,18,'#ffd23a','left',null);
  text({solder:'SOLDERING',print:'3D PRINTING',snap:'PART SNAPPING'}[r.craft]+'   fee $'+r.fee,352,120,12,'#2de2f5','left',null);
  wrap(it.kind==='ride'?r.perk+' Speed '+r.speed+', turning '+r.turn+', carries '+r.cap+' pizzas.':r.d,292,150,320,17,13,'#fff',null);
  if(it.kind==='gadget'&&r.ch)text('Charges per mission: '+r.ch.join(' / ')+'  (Basic / Good / Perfect)',292,212,11,'#9fb','left',null);
  text('PARTS NEEDED',292,240,13,'#2de2f5','left',null);let y=262;
  for(const id in r.parts){const have=partCount(id),need=r.parts[id];itemIcon(id,304,y-4,20);text(partDef(id).n,320,y+1,13,'#fff','left',null);text((SAVE.testing?'':have+' / ')+need,610,y+1,13,have>=need?'#7f7':'#ff7a8a','right',null);y+=26;}
  for(const id of (r.rare||[])){const f=rareFound(id),d=partDef(id);itemIcon(id,304,y-4,20,!f);text(f?d.n:'??? (rare part)',320,y+1,13,f?'#ffd23a':'#89a','left',null);
   text(f?'FOUND':'found in: ???',610,y+1,12,f?'#7f7':'#ff9ac0','right',null);y+=26;}
  text(c.ok?'A: CRAFT IT!':'Not ready yet',451,452,16,c.ok?'#7f7':'#89a','center',null);
  drawToast();}};

// ---------- Crafting minigames ----------
const SHAPES=['circle','square','tri','star','diamond','hex'];
function drawShape(k,x,y,r,fill,stroke='#000'){ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=3;ctx.beginPath();
 if(k==='circle')ctx.arc(x,y,r,0,7);else if(k==='square')ctx.rect(x-r*.85,y-r*.85,r*1.7,r*1.7);
 else{const n={tri:3,star:10,diamond:4,hex:6}[k];for(let i=0;i<n;i++){const a=-Math.PI/2+i*Math.PI*2/n,rr=k==='star'&&i%2?r*.45:r;ctx.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}ctx.closePath();}
 ctx.fill();ctx.stroke();}
const Craft={name:'craft',
 make(it){this.it=it;this.r=it.def;this.kind=it.def.craft;this.t=0;this.state='how';this.q=0;this.tapeAsk=false;
  if(this.kind==='solder'){this.tipY=240;this.good=0;this.tot=0;this.trail=[];this.seed=Math.random()*10;}
  if(this.kind==='print'){this.layer=0;this.hits=0;this.pos=0;this.dir=1;this.zone=this.newZone();this.layers=[];}
  if(this.kind==='snap'){const ids=Object.keys(this.r.parts).concat(this.r.rare||[]).slice(0,4);while(ids.length<4)ids.push(PARTS[ids.length+3].id);
   const sh=SHAPES.slice().sort(()=>Math.random()-.5);this.slots=ids.map((id,i)=>({id,shape:sh[i],done:false}));this.tray=this.slots.map(s=>s).sort(()=>Math.random()-.5);this.cur=0;this.si=0;this.miss=0;this.time=15;}
  return this;},
 newZone(){const w=.26-this.layer*.035;return {a:.1+Math.random()*(.8-w),w};},
 enter(){startMusic('lair');},
 solderY(x){const s=this.seed;return 240+Math.sin(x*.012+s)*70+Math.sin(x*.031+s*2)*30;},
 update(dt){this.t+=dt;
  if(this.state==='how'){if(this.t>.3&&(anyPressed('ok')||anyPressed('attack'))){this.state='play';this.t=0;SFX.ok();}if(backPressed()){/* refund: crafting not started */if(!SAVE.testing){for(const id in this.r.parts)SAVE.parts[id]=(SAVE.parts[id]||0)+this.r.parts[id];SAVE.coins+=this.r.fee;save();}pop();}return;}
  if(this.state==='done'){if(this.tapeAsk){if(anyPressed('ok')){SAVE.parts.tape--;this.q=1;this.tapeAsk=false;this.apply();SFX.ok();}else if(backPressed()){this.tapeAsk=false;this.apply();}return;}
   if(this.t>.6&&(anyPressed('ok')||backPressed())){SFX.ok();pop();}return;}
  if(this.kind==='solder'){const x=80+this.t/7*480;const u=anyHeld('up')?-1:anyHeld('down')?1:0;this.tipY=Math.max(90,Math.min(400,this.tipY+u*230*dt));
   const ok=Math.abs(this.tipY-this.solderY(x))<16;this.tot++;if(ok)this.good++;if(this.tot%3===0)this.trail.push([x,this.tipY,ok]);
   if(ok&&this.tot%9===0)beep(1200+Math.random()*200,.03,'triangle',.02);
   if(this.t>=7){const k=this.good/this.tot;this.score=Math.round(k*100);this.finish(k>=.85?2:k>=.6?1:0);}}
  if(this.kind==='print'){const sp=.7+this.layer*.18;this.pos+=this.dir*sp*dt;if(this.pos>1){this.pos=1;this.dir=-1;}if(this.pos<0){this.pos=0;this.dir=1;}
   if(anyPressed('ok')||anyPressed('attack')||anyPressed('jump')){const hit=this.pos>=this.zone.a&&this.pos<=this.zone.a+this.zone.w;this.layers.push(hit);if(hit){this.hits++;SFX.ok();}else SFX.hurt();
    this.layer++;if(this.layer>=5){this.score=this.hits;this.finish(this.hits>=5?2:this.hits>=3?1:0);}else this.zone=this.newZone();}}
  if(this.kind==='snap'){this.time-=dt;if(anyPressed('left')){this.cur=(this.cur+3)%4;SFX.move();}if(anyPressed('right')){this.cur=(this.cur+1)%4;SFX.move();}
   if(anyPressed('ok')||anyPressed('attack')){const pick=this.tray[this.cur],slot=this.slots[this.si];
    if(pick.done){SFX.move();}else if(pick===slot){slot.done=true;this.si++;beep(900,.08,'square',.05);beep(1300,.1,'square',.04);if(this.si>=4){this.finish(this.miss===0&&this.time>5?2:this.miss<=1?1:0);}}
    else{this.miss++;SFX.hurt();}}
   if(this.time<=0&&this.state==='play'){this.finish(0);}}},
 finish(q){this.q=q;this.state='done';this.t=0;playStinger(q===2?'unlock':'clue');
  if(q===0&&partCount('tape')>0&&!SAVE.testing)this.tapeAsk=true;else this.apply();},
 apply(){const r=this.r;
  if(this.it.kind==='ride'){SAVE.rides.agent_bike=true;SAVE.ride='agent_bike';}
  else{const old=SAVE.gadgets[r.id];SAVE.gadgets[r.id]=old==null?this.q:Math.max(old,this.q);if(r.consumable)SAVE.smoke+=r.ch[this.q];autoEquip(r.id);}
  save();},
 draw(){const r=this.r;bgPic('scenes/lair_lab',.75);text('CRAFTING: '+r.n.toUpperCase(),W/2,36,20,'#2de2f5','center');
  if(this.state==='how'){panel(80,120,480,240);itemIcon(r.id,W/2,170,56);
   const how={solder:'SOLDERING: hold Up and Down to keep the hot tip on the glowing wire. Steady hands make a better gadget!',
    print:'3D PRINTING: press A to stop the nozzle in the GREEN zone. 5 layers. It gets faster!',
    snap:'PART SNAPPING: find the part that fits the glowing slot. Left/Right to pick, A to snap it in. 15 seconds!'}[this.kind];
   wrap(how,110,226,420,22,16,'#fff',null);text('A: start    B: cancel (parts back)',W/2,346,13,'#9fb','center',null);return;}
  if(this.kind==='solder'){rrect(60,80,520,340,14,'#0f4a2a','#000',3);ctx.fillStyle='rgba(255,215,0,.25)';for(let i=0;i<40;i++)ctx.fillRect(70+(i*97)%500,90+(i*53)%320,5,5);
   ctx.strokeStyle='#2de2f5';ctx.lineWidth=10;ctx.globalAlpha=.35;ctx.beginPath();for(let x=80;x<=560;x+=8)ctx.lineTo(x,this.solderY(x));ctx.stroke();ctx.globalAlpha=1;ctx.lineWidth=3;ctx.strokeStyle='#bff';ctx.stroke();
   for(const [x,y,ok] of this.trail){ctx.fillStyle=ok?'#ffd23a':'#888';ctx.beginPath();ctx.arc(x,y,ok?4:3,0,7);ctx.fill();}
   const x=this.state==='done'?560:80+this.t/7*480;ctx.fillStyle='#555';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,this.tipY);ctx.lineTo(x+14,this.tipY-60);ctx.lineTo(x+26,this.tipY-56);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#ff7a1a';ctx.beginPath();ctx.arc(x,this.tipY,5,0,7);ctx.fill();
   if(this.state==='play')text(Math.round(this.good/Math.max(1,this.tot)*100)+'% on the wire',W/2,446,16,'#fff','center');}
  if(this.kind==='print'){const bx=120,bw=400;rrect(bx,380,bw,30,8,'#223','#000',2);ctx.fillStyle='#2c2';ctx.fillRect(bx+this.zone.a*bw,382,this.zone.w*bw,26);
   const px=bx+this.pos*bw;ctx.fillStyle='#aab';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.fillRect(px-14,330,28,26);ctx.strokeRect(px-14,330,28,26);ctx.fillStyle='#ff8a1a';ctx.beginPath();ctx.moveTo(px-6,356);ctx.lineTo(px+6,356);ctx.lineTo(px,370);ctx.fill();
   rrect(220,300,200,10,4,'#334','#000',2);this.layers.forEach((h,i)=>{ctx.fillStyle=h?'#ff8a1a':'#a86';ctx.fillRect(250-(h?0:8)+i*0,288-i*16,140+(h?0:16),14);ctx.strokeStyle='#000';ctx.strokeRect(250-(h?0:8),288-i*16,140+(h?0:16),14);});
   text('Layer '+Math.min(5,this.layer+1)+' / 5     A: stop in the green!',W/2,446,15,'#fff','center');}
  if(this.kind==='snap'){panel(70,80,500,150,'#2de2f5');this.slots.forEach((s,i)=>{const x=130+i*126,y=150,glow=i===this.si&&this.state==='play';
    rrect(x-44,y-44,88,88,14,glow?'rgba(45,226,245,.35)':'#102030',s.done?'#ffd23a':glow?'#2de2f5':'#456',glow?4:2);
    if(s.done){drawShape(s.shape,x,y,30,'#ffd23a');itemIcon(s.id,x,y,26);}else drawShape(s.shape,x,y,30,'rgba(0,0,0,.4)',glow?'#2de2f5':'#567');});
   panel(70,260,500,140,'#456');text('PART TRAY',W/2,282,12,'#9fb','center',null);this.tray.forEach((s,i)=>{const x=130+i*126,y=336,c=i===this.cur;if(c)rrect(x-46,y-46,92,92,12,'rgba(255,210,58,.3)','#ffd23a',3);
    if(!s.done){drawShape(s.shape,x,y,28,partDef(s.id).col||'#888');itemIcon(s.id,x,y+2,22);}});
   text('Time '+Math.max(0,Math.ceil(this.time))+'   Mistakes '+this.miss,W/2,446,15,this.time<5?'#ff5a8a':'#fff','center');}
  if(this.state==='done'){dim(.5);panel(110,150,420,170,this.q===2?'#ffd23a':'#2de2f5');
   text(QUALITY[this.q].toUpperCase()+'!',W/2,196,34,['#cfe','#7f7','#ffd23a'][this.q],'center');itemIcon(r.id,150,256,46);
   if(this.tapeAsk){wrap('Wobbly build... Use 1 Duct Tape to make it Good?  A: yes   B: no',186,240,330,20,15,'#fff',null);}
   else{wrap(this.it.kind==='ride'?'The Agent Bike is in your garage! Pick it for deliveries.':r.n+' is ready'+(r.ch?': '+r.ch[this.q]+(r.consumable?' pellets added.':' charges per mission.'):'. It works whenever it is equipped.'),190,240,320,20,15,'#fff',null);
    text('A: done',W/2,306,13,'#9fb','center',null);}}}};

// ---------- Equip: what each agent takes on missions ----------
const Equip={name:'equip',sel:0,
 make(){this.sel=0;return this;},enter(){},resume(){},
 owned(){return GADGET_DEFS.filter(g=>hasGadget(g.id)).map(g=>g.id);},
 rows(){const R=[];for(const ch of ['agent_coco','agent_sisi'])for(let s=0;s<2;s++)R.push({ch,s,locked:s>=slotsFor()});return R;},
 update(){const R=this.rows();navList(this,R.length);const r=R[this.sel];
  if(anyPressed('ok')||anyPressed('right')||anyPressed('left')){if(r.locked){toast('2nd slot unlocks at Agent rank (200 XP)','#ff9ac0');SFX.hurt();return;}
   const O=[null].concat(this.owned()),e=SAVE.equip[r.ch]||(SAVE.equip[r.ch]=[null,null]);let i=O.indexOf(e[r.s]);const d=anyPressed('left')?-1:1;
   for(let k=0;k<O.length;k++){i=(i+d+O.length)%O.length;if(!O[i]||e[1-r.s]!==O[i])break;}e[r.s]=O[i];save();SFX.move();}
  if(backPressed()||anyPressed('start')){SFX.move();pop();}},
 draw(){bgPic('scenes/lair_beg',.65);text('EQUIP GADGETS',W/2,40,26,'#ffd23a','center');panel(40,60,560,330);
  this.rows().forEach((r,i)=>{const y=74+i*72+(r.ch==='agent_sisi'?14:0),s=i===this.sel,id=(SAVE.equip[r.ch]||[])[r.s],g=id&&hasGadget(id)?gadgetDef(id):null;
   if(r.s===0){const f=IMG['faces/'+r.ch+'_happy'];if(f&&f.width)ctx.drawImage(f,58,y+4,56,56);text(r.ch==='agent_coco'?'COCO':'SISI',86,y+76,12,r.ch==='agent_coco'?'#7ff':'#ff9ae0','center',null);}
   rrect(130,y,450,58,10,s?'rgba(255,210,58,.9)':'rgba(30,60,90,.7)',s?'#fff':(r.locked?'#456':'#2de2f5'),2);
   text('SLOT '+(r.s+1),146,y+22,11,s?'#102':'#9fb','left',null);
   if(r.locked)text('LOCKED: unlocks at Agent rank',146,y+44,14,s?'#102':'#789','left',null);
   else if(g){itemIcon(g.id,222,y+30,36);text(g.n,250,y+26,16,s?'#102':'#fff','left',null);text(g.ch?(QUALITY[gadgetQ(g.id)]+' '+(g.consumable?'x'+(SAVE.testing?99:SAVE.smoke):g.id==='grapple'?'unlimited':g.ch[gadgetQ(g.id)]+' per mission')):'Always on',250,y+46,12,s?'#102':'#9fb','left',null);}
   else text(this.owned().length?'(empty) A: pick a gadget':'(empty) Craft a gadget in the Gadget Lab first',146,y+44,14,s?'#102':'#89a','left',null);});
  panel(40,400,560,64,'#456');wrap('In a mission: hold DOWN and press GADGET to use it. UP + GADGET (or Select) switches slots. Tap GADGET alone for the watch beam.',56,424,530,17,13,'#cfe',null);
  drawToast();}};
