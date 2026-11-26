// ===== Scenes: title, map, watch hub, dialog, results =====
const LEVELS=[
 {id:1,name:'Heritage District Break-in',terr:'Gilbert',x:455,y:335,icon:'available',blurb:'Someone is cracking open old buildings at night. Find out who.'},
 {id:2,name:'Rooftop Delivery',terr:'Gilbert',x:497,y:308,icon:'chase_arrow',blurb:'Deliver a pizza across the rooftops. Mind the gaps between buildings!'},
 {id:3,name:'Crane Yard Chase',terr:'Gilbert',x:542,y:340,icon:'vehicle_scooter',blurb:'Chase the courier through the crane yard. The screen keeps moving! Unlocks the scooter.'},
 {id:4,name:'Site Office Hack',terr:'Gilbert',x:582,y:306,icon:'hacking_chip',blurb:'Hack Papa Johnny\'s computer. Turn the circuit tiles before the alarm goes off.'},
 {id:5,name:"Papa Johnny's Wrecking Yard",terr:'Gilbert',x:590,y:352,icon:'boss_construction',blurb:'Boss fight! Papa Johnny in three rounds.'},
 {id:6,name:'Taxi Blockade',terr:'Downtown Phoenix',x:112,y:195,icon:'locked',blurb:'Coming in a later build. Unlocks after Gilbert.'},
 {id:7,name:'Lake Cleanup',terr:'Tempe',x:432,y:162,icon:'locked',blurb:'Unlocks after Downtown.'},
 {id:8,name:'Chip Factory',terr:'Chandler',x:250,y:278,icon:'locked',blurb:'Unlocks after Tempe.'}
];
const LAIR={id:0,name:"The Lair + Barro's Pizza",x:290,y:372,icon:'lair_pizza'};
const CLUES=[
 {lvl:1,name:'Torn Blueprint',text:'Plans for digging under the old buildings. Why dig at night?'},
 {lvl:1,name:'Gold Tooth Receipt',text:'A dentist receipt for one gold tooth. Who has a gold tooth?'},
 {lvl:1,name:"Foreman's Work Order",text:"'Dig at night. Keep the kids out.' Signed P.J."},
 {lvl:2,name:'Lookout Binoculars',text:'The crew has lookouts on the roofs, all pointed at the old bank.'},
 {lvl:2,name:'Pizza Order Slip',text:"Large pepperoni for 'P.J.', delivered to the crane yard. Every night."},
 {lvl:2,name:'Crew Radio',text:"'Move the blueprints to the crane yard tonight.'"},
 {lvl:3,name:'Blueprint Tube',text:'Tunnels run from under the old bank to the crane yard.'},
 {lvl:3,name:'Office Key',text:"A key tag that says SITE OFFICE. Papa Johnny's computer is in there."},
 {lvl:3,name:'Muddy Gold Flake',text:'A flake of real gold stuck in the mud. Old bank gold?'},
 {lvl:4,name:'Fake Permits',text:'The dig permits are fake. The stamps were printed in the site office.'},
 {lvl:4,name:'Cash Payroll',text:'Papa Johnny pays the whole crew in cash. Lots of cash.'},
 {lvl:4,name:'Midnight Email',text:"'Wrecking yard. Midnight. Bring the gold.'"},
 {lvl:5,name:'Gold Bar Stamp',text:'Stamped GILBERT BANK 1912. The gold was buried under the old bank.'},
 {lvl:5,name:"Papa Johnny's Phone",text:'Last call: a number in Downtown Phoenix.'},
 {lvl:5,name:"Tony's Taxi Card",text:"Tony's Taxi, Downtown Phoenix. Someone in Downtown gives Papa Johnny his orders."}];
const GADGETS=[
 {n:'Grapple Beam',d:'Zaps enemies from a distance. [Gadget button]',own:true},
 {n:'Smoke Pellets',d:'Stealth missions. Build in the Lair.',own:false},
 {n:'Hover Skates',d:'Faster, floatier jumps. Build in the Lair (or find the code).',own:false,cheat:'skates'},
 {n:'Hamster Ray',d:'Rare cartoon one-shot. Needs 3 clues from every territory.',own:false}];
const VEHICLES=[{n:'On Foot',own:true,icon:'available'},{n:'Scooter',own:false,icon:'vehicle_scooter',d:'Finish Crane Yard Chase'},{n:'Bike',own:false,icon:'chase_arrow',d:'Unlocks in Downtown'},{n:'Waymo',own:false,icon:'locked',d:'Unlocks in Tempe'},{n:'Metro',own:false,icon:'locked',d:'Unlocks in Chandler'}];
let NPLAYERS=1;
const levelAvail=l=>!!LEVEL_DEFS[l.id]&&(l.req?(!!SAVE.done[l.req]||!!SAVE.unlocked[l.id]||!!SAVE.testing):(l.id===1&&(SAVE.firstDelivery||SAVE.testing||!!SAVE.done[1]))||!!SAVE.done[l.id-1]||!!SAVE.unlocked[l.id]||!!SAVE.testing);
function dim(a=0.6){ctx.fillStyle=`rgba(5,3,20,${a})`;ctx.fillRect(0,0,W,H);}
function sandyBox(lines,expr='happy',idx=0){
 rrect(18,H-132,W-36,116,14,'rgba(6,20,36,.92)','#2de2f5',3);
 const im=IMG['sandy/'+expr];if(im)ctx.drawImage(im,28,H-128+Math.sin(TIME*3)*2,im.width*.82,im.height*.82);
 text('SANDY',150,H-100,14,'#2de2f5','left');
 wrap(lines[idx],150,H-78,W-190,19,15,'#fff',null);
 text(idx<lines.length-1?'A: next':'A: ok',W-40,H-26,12,'#9fb',"right",null);}
// ---------- Title ----------
const Title={name:'title',sel:0,items:['1 PLAYER','2 PLAYER CO-OP','ENTER CODE','EXTRAS','CONTROLS'],controls:false,
 enter(){startMusic('title');},
 update(){if(this.controls){if(anyPressed('ok')||anyPressed('back')||anyPressed('start')){this.controls=false;SFX.move();}return;}
  const n=this.items.length;if(anyPressed('down')){this.sel=(this.sel+1)%n;SFX.move();}if(anyPressed('up')){this.sel=(this.sel+n-1)%n;SFX.move();}
  if(anyPressed('ok')||anyPressed('start')){audio()&&AC.state==='suspended'&&AC.resume();SFX.ok();
   if(this.sel===4)this.controls=true;else if(this.sel===2)go(CodeEntry);else if(this.sel===3)go(Extras);else{NPLAYERS=this.sel+1;go(CharSelect);}}},
 draw(){img('main_menu',0,0,W,H);
  ctx.fillStyle='rgba(10,0,40,.25)';ctx.fillRect(0,0,W,120);
  const t='AGENT COCO';ctx.save();ctx.translate(W/2,78);ctx.rotate(-0.02);
  text(t,0,0,64,'#ffd23a','center','#1b0a3a');ctx.restore();
  text('A Gilbert Adventures Mission',W/2,106,16,'#2de2f5','center','#1b0a3a');
  for(let i=0;i<this.items.length;i++){const x=405,y=212+i*46,s=i===this.sel;
   rrect(x,y,210,38,12,s?'rgba(255,210,58,.95)':'rgba(15,10,50,.82)',s?'#fff':(i===2||i===3?'#ff5ae0':'#2de2f5'),3);
   text(this.items[i],x+105,y+26,18,s?'#1b0a3a':'#fff','center',null);}
  if(SAVE.testing)text('TESTING MODE',W-18,H-30,12,'#ff5ae0','right','#000');
  text('Press A / Enter. Press N to mute.',W-18,H-14,11,'#cdb','right','#000');
  if(this.controls)drawControlsPanel();}};
// ---------- World Map ----------
const MapScene={name:'map',sel:1,msg:'',msgT:0,
 enter(){startMusic('map');if(!SAVE.firstDelivery&&!SAVE.testing)this.sel=0;},resume(){startMusic('map');},
 nodes(){return [LAIR,...LEVELS];},
 update(dt){this.msgT-=dt;const N=this.nodes(),c=N[this.sel];
  const dirs={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
  for(const d in dirs)if(anyPressed(d)){let best=-1,bs=1e9;N.forEach((n,i)=>{if(i===this.sel)return;const dx=n.x-c.x,dy=n.y-c.y,dot=(dx*dirs[d][0]+dy*dirs[d][1]);if(dot<=4)return;const dist=Math.hypot(dx,dy),off=Math.abs(dx*dirs[d][1]-dy*dirs[d][0]);const sc=dist+off*1.6;if(sc<bs){bs=sc;best=i;}});if(best>=0){this.sel=best;SFX.move();}}
  if(anyPressed('start')){SFX.ok();push(Watch.make('map'));return;}
  if(anyPressed('back')){go(Title);return;}
  if(anyPressed('ok')){const n=N[this.sel];if(n.id===0){SFX.ok();push(LairMenu);}
   else if(levelAvail(n)){SFX.ok();startLevel(n);}else{this.msg=n.id===1?"First, do your pizza delivery for Barro's (at the Lair)!":n.blurb;this.msgT=2.5;SFX.hurt();}}},
 draw(){img('world_map',0,0,W,H);
  const lab=[['DOWNTOWN PHX',100,88],['TEMPE',338,95],['CHANDLER',245,235],['GILBERT',515,238]];
  lab.forEach(l=>text(l[0],l[1],l[2],14,'#3a2410','center',null));
  const N=this.nodes();
  N.forEach((n,i)=>{let k=n.icon;if(n.id>0){if(SAVE.done[n.id])k='completed';else if(!levelAvail(n)&&n.icon==='available')k='locked';}
   const locked=n.id>0&&!levelAvail(n)&&!SAVE.done[n.id];ctx.globalAlpha=locked?0.75:1;imgC('markers/'+(locked&&n.icon!=='locked'?n.icon:k),n.x,n.y,n.id===0?46:36);ctx.globalAlpha=1;
   if(locked&&n.icon!=='locked'){ctx.fillStyle='rgba(20,10,40,.55)';ctx.beginPath();ctx.arc(n.x,n.y,15,0,7);ctx.fill();}
   if(i===this.sel){ctx.strokeStyle='#2de2f5';ctx.lineWidth=4;ctx.beginPath();ctx.arc(n.x,n.y,22+Math.sin(TIME*6)*2,0,7);ctx.stroke();}});
  const s=N[this.sel];rrect(10,H-62,W-20,52,10,'rgba(6,20,36,.9)','#2de2f5',2);
  text(s.name,22,H-38,16,'#ffd23a','left',null);
  const sub=s.id===0?(SAVE.firstDelivery?'Deliveries, shop, Gadget Lab, equip (A)':'START HERE: your first pizza delivery (A)'):(s.terr+': '+(levelAvail(s)?(SAVE.done[s.id]?'Cleared. A to replay':'A to start'):'Locked'));text(sub,22,H-18,13,'#cfe','left',null);
  const r=rank();text(r[0]+'  XP '+SAVE.xp+'   $'+SAVE.coins,W-20,22,14,'#fff','right');if(SAVE.testing)text('TESTING MODE',20,22,12,'#ff5ae0','left');text('Start: Gadget Watch',W-20,40,11,'#fff','right');
  if(this.msgT>0){rrect(120,200,400,50,10,'rgba(6,20,36,.92)','#ff5a8a',2);text(this.msg,W/2,231,15,'#fff','center',null);}}};
// ---------- Gadget Watch ----------
function watchLevels(){return LEVELS.filter(l=>LEVEL_DEFS[l.id]);}
function casePages(){return [...new Set(CLUES.map(c=>c.lvl))];}
const TABS=[['tab_level_select','LEVEL SELECT'],['tab_map','MAP'],['tab_inventory','INVENTORY'],['tab_gadget_lab','GADGET LAB'],['tab_case_board','CASE BOARD'],['tab_trophies','XP & TROPHIES'],['tab_sandy_chat','SANDY CHAT'],['tab_garage','GARAGE & RIDES']];
const SANDY_HINTS=["Hold DOWN and press GADGET to use your equipped gadget. UP + GADGET switches slots.","Rare parts hide in missions. The little part icon at the top shows if this mission's part is found.","Pizza deliveries pay tips any time. Hot pizza and no crashes = biggest tips!","Tip: Sisi can double jump and does a flip. Coco's beam hits from far away.","Pizza slices heal you. Cash tips are for the gadget shop later.","Three clues are hidden in each mission. Check high platforms.","Rooftop gaps: run, jump, then jump again in the air to clear the big ones.","Beat a mission and you get a code for the next one. Try it on the title screen!","If a hardhat guy flashes red, he's about to swing. Back away or jump."];
const Watch={name:'watch',tab:0,sel:0,hint:0,ctxMode:'map',
 make(mode){this.ctxMode=mode;this.tab=0;this.sel=0;this.page=0;pushMusic('watch');return this;},
 close(){popMusic();pop();if(this.ctxMode==='level'&&scene.paused!=null)scene.paused=false;},
 update(){
  if(anyPressed('left')){this.tab=(this.tab+7)%8;this.sel=0;SFX.move();}
  if(anyPressed('right')){this.tab=(this.tab+1)%8;this.sel=0;SFX.move();}
  const WL=watchLevels(),max=this.tab===0?(this.ctxMode==='level'?WL.length+2:WL.length):0;
  if(this.tab===0&&max){if(anyPressed('down')){this.sel=(this.sel+1)%max;SFX.move();}if(anyPressed('up')){this.sel=(this.sel+max-1)%max;SFX.move();}}
  if(this.tab===7){const n=RIDES.length;if(anyPressed('down')){this.sel=(this.sel+1)%n;SFX.move();}if(anyPressed('up')){this.sel=(this.sel+n-1)%n;SFX.move();}}
  if(this.tab===4){const n=casePages().length;if(anyPressed('down')){this.page=(this.page+1)%n;SFX.move();}if(anyPressed('up')){this.page=(this.page+n-1)%n;SFX.move();}}
  if(anyPressed('back')||anyPressed('start')){SFX.move();this.close();return;}
  if(anyPressed('ok')){
   if(this.tab===0){
    if(this.ctxMode==='level'&&this.sel===0){SFX.ok();this.close();return;}
    if(this.ctxMode==='level'&&this.sel===1){SFX.ok();sceneStack.length=0;go(MapScene);return;}
    const l=WL[this.sel-(this.ctxMode==='level'?2:0)];if(l&&levelAvail(l)&&(typeof cityOpen!=='function'||cityOpen(cityOf(l)))){SFX.ok();sceneStack.length=0;startLevel(l);}else SFX.hurt();}
   if(this.tab===2&&this.ctxMode==='map'){SFX.ok();push(Equip.make());return;}
   if(this.tab===3&&this.ctxMode==='map'){SFX.ok();push(Lab.make());return;}
   if(this.tab===7){const r=RIDES[this.sel];if(r&&!r.later&&rideOwned(r.id)){SAVE.ride=r.id;save();SFX.ok();}else SFX.hurt();}
   if(this.tab===6){this.hint=(this.hint+1)%SANDY_HINTS.length;SFX.move();}}},
 draw(){if(sceneStack.length&&sceneStack[sceneStack.length-1].draw)sceneStack[sceneStack.length-1].draw();dim(.55);
  img('watch_frame',0,0,W,H);
  for(let i=0;i<8;i++){const x=80+i*60,s=i===this.tab;if(s){rrect(x-4,34,58,50,8,'rgba(45,226,245,.25)','#2de2f5',2);}ctx.globalAlpha=s?1:.55;imgC('ui/'+TABS[i][0],x+25,59,38);ctx.globalAlpha=1;}
  text(TABS[this.tab][1],W/2,112,20,'#2de2f5','center','#002');
  const t=this.tab,X=60,Y=130;
  if(t===0){const items=[];if(this.ctxMode==='level'){items.push({n:'Resume mission',o:1},{n:'Quit to map',o:1});}
   watchLevels().forEach(l=>items.push({n:(typeof CITY!=='undefined'?CITY[cityOf(l)].name+': ':'')+l.id+'. '+l.name,l:l,o:levelAvail(l)}));
   const top=Math.max(0,Math.min(this.sel-4,items.length-9));
   items.slice(top,top+9).forEach((it,j)=>{const i=top+j,y=Y+j*30,s=i===this.sel;rrect(X,y,520,26,6,s?'rgba(255,210,58,.9)':'rgba(30,60,90,.7)',s?'#fff':'#2de2f5',2);
    text(it.n,X+12,y+19,14,s?'#102':(it.o?'#fff':'#789'),'left',null);if(it.l){const st=SAVE.done[it.l.id]?'CLEARED':levelAvail(it.l)?'READY':'LOCKED';text(st,X+508,y+19,12,s?'#102':'#9fb','right',null);}});
   const sel=items[this.sel];if(sel&&sel.l)wrap(sel.l.blurb,X,Y+9*30+22,520,18,13,'#cfe',null);}
  if(t===1){ctx.save();ctx.globalAlpha=.95;img('world_map',70,128,500,375*0.8);ctx.restore();if(typeof CITIES!=='undefined'){rrect(70,350,500,82,8,'rgba(6,20,36,.85)','#2de2f5',1.5);CITIES.forEach((c,i)=>{const S=cityStats(c.id),o=cityOpen(c.id),y=366+i*15;text(c.name,84,y,12,o?c.col:'#889','left',null);text(o?(S.done+'/'+S.total+' cleared   stars '+S.stars+'/'+S.maxStars+'   clues '+S.cf+'/'+S.ct+'   parts '+S.pf+'/'+S.pt):'LOCKED: '+c.hint,556,y,11,o?'#cfe':'#99a','right',null);});}}
  if(t===2){text('Cash: $'+SAVE.coins,X,Y+6,18,'#ffd23a','left',null);text('Smoke Pellets x'+(SAVE.testing?99:SAVE.smoke),X+520,Y+6,13,'#cde','right',null);
   text('PARTS',X,Y+30,12,'#2de2f5','left',null);PARTS.forEach((p,i)=>{const x=X+(i%6)*88,y=Y+40+Math.floor(i/6)*52;img('ui/slot_frame',x,y,46,46);itemIcon(p.id,x+23,y+23,30,partCount(p.id)<=0);text('x'+partCount(p.id),x+50,y+38,12,'#fff','left',null);});
   text('RARE PARTS (kept forever)',X,Y+158,12,'#2de2f5','left',null);RARE.forEach((r,i)=>{const x=X+i*47,f=rareFound(r.id);itemIcon(r.id,x+20,Y+186,32,!f);});
   const eq=c=>equipped(c).map(g=>gadgetDef(g).n).join(' + ')||'nothing';
   text('Coco carries: '+eq('agent_coco'),X,Y+232,13,'#7ff','left',null);text('Sisi carries: '+eq('agent_sisi'),X,Y+252,13,'#ff9ae0','left',null);
   text(this.ctxMode==='map'?'A: equip gadgets':'Equip gadgets from the map or the Lair',X+520,Y+290,12,'#9fb','right',null);}
  if(t===3){const L=labList();L.forEach((it,i)=>{const x=X+(i%2)*262,y=Y-6+Math.floor(i/2)*40,r=it.def,own=it.kind==='ride'?rideOwned('agent_bike'):(SAVE.gadgets[r.id]!=null||SAVE.testing),ok=recipeCheck(r).ok;
    rrect(x,y,256,36,7,'rgba(30,60,90,.7)',own?'#ffd23a':ok?'#7f7':'#456',2);itemIcon(r.id,x+20,y+18,26,!own&&!ok);text(r.n,x+40,y+23,13,own?'#ffd23a':'#cfe','left',null);
    text(own?(it.kind==='ride'?'BUILT':QUALITY[gadgetQ(r.id)]):ok?'READY':'',x+248,y+23,11,own?'#9fb':'#7f7','right',null);});
   text(this.ctxMode==='map'?'A: open the Gadget Lab to craft':'Craft at the Lair between missions',W/2,Y+288,12,'#9fb','center',null);}
  if(t===4){const pg=casePages()[this.page%casePages().length];text('Mission '+pg+': '+levelName(pg)+'   (Up/Down: page)',X,Y-2,12,'#2de2f5','left',null);
   CLUES.map((c,i)=>[c,i]).filter(([c])=>c.lvl===pg).forEach(([c,i],j)=>{const f=SAVE.clues.includes(i),y=Y+8+j*72;rrect(X,y,520,62,8,f?'rgba(70,50,20,.85)':'rgba(30,40,60,.7)',f?'#ffd23a':'#456',2);imgC('markers/clue',X+34,y+31,44);
    text(f?c.name:'???',X+70,y+26,15,f?'#ffd23a':'#789','left',null);wrap(f?c.text:'Mission '+c.lvl+': not found yet.',X+70,y+46,430,15,12,'#cfe',null);});
   const sus=SAVE.done[5]?'Papa Johnny: CAUGHT. Who sends his orders? Check Downtown.':SAVE.done[1]?'Suspect: Papa Johnny, boss of the hardhat crew':'Suspect: the hardhat crew. But who is their boss?';
   text('Clues found: '+SAVE.clues.length+' / '+CLUES.length+'   '+sus,X,Y+240,12,'#ff9ac0','left',null);}
  if(t===5){const r=rank();imgC('ui/'+r[1],W/2,Y+48,90);text(r[0],W/2,Y+112,20,'#ffd23a','center');
   const next=SAVE.xp>=600?600:SAVE.xp>=200?600:200,pct=Math.min(1,SAVE.xp/next);
   img('ui/xp_track',120,Y+130,400,34);ctx.save();ctx.beginPath();ctx.rect(128,Y+130,384*pct,34);ctx.clip();img('ui/xp_fill',120,Y+130,400,34);ctx.restore();
   text('XP '+SAVE.xp+' / '+next,W/2,Y+186,14,'#fff','center',null);
   const got=achCount(),tot=ACH.length;text('TROPHIES  '+got+' / '+tot,X,Y+218,15,'#2de2f5','left',null);text('$'+achCash()+' earned',X+520,Y+218,14,'#ffd23a','right',null);
   rrect(X,Y+226,520,10,5,'#1a2240',null);rrect(X,Y+226,Math.max(10,520*got/tot),10,5,'#ffd23a',null);
   const rec=ACH.filter(x=>SAVE.ach[x.id]).sort((a,b)=>SAVE.ach[b.id]-SAVE.ach[a.id]).slice(0,2);
   if(rec.length)rec.forEach((x,i)=>{trophyIcon(X+12+i*262,Y+256,20,x.tier,true);text(x.n,X+28+i*262,Y+261,12,'#fff','left',null);});else text('No trophies yet. Every one pays cash!',X,Y+261,12,'#9ab','left',null);
   text('A: open the Trophy Case',W/2,Y+290,13,'#ffd23a','center',null);}
  if(t===6){const ex=['happy','smug','thinking','proud'][this.hint%4];const im=IMG['sandy/'+ex];if(im)ctx.drawImage(im,X+10,Y+20,im.width*1.4,im.height*1.4);
   rrect(X+190,Y+30,330,150,12,'rgba(30,60,90,.8)','#2de2f5',2);wrap(SANDY_HINTS[this.hint],X+205,Y+62,300,22,16,'#fff',null);text('A: next tip',X+510,Y+170,12,'#9fb','right',null);}
  if(t===7){const R=RIDES;R.forEach((r,i)=>{const y=Y-4+i*40,o=!r.later&&rideOwned(r.id),s=i===this.sel,pick=SAVE.ride===r.id;rrect(X,y,520,36,8,s?'rgba(255,210,58,.9)':'rgba(30,60,90,.7)',pick?'#7f7':o?'#ffd23a':'#456',2);
    itemIcon(r.id,X+20,y+18,26,!o);text(r.n+(pick?'  (riding)':''),X+42,y+24,14,s?'#102':o?'#fff':'#89a','left',null);text(o?'Speed '+r.speed+'  Turn '+r.turn+'  Pizzas '+r.cap:r.how,X+508,y+24,12,s?'#102':'#9fb','right',null);});
   text('UPGRADES: '+(UPGRADES.filter(u=>upgOwned(u.id)).map(u=>u.n).join(', ')||"none yet (Barro's Shop)"),X,Y+214,12,'#cfe','left',null);
   const r=R[this.sel];if(r)wrap(r.later?'Map ride, coming with later territories.':r.perk,X,Y+240,520,16,12,'#cfe',null);text('Up/Down: choose   A: ride it on deliveries',W/2,Y+288,12,'#9fb','center',null);}
  text('Left/Right: tabs   A: select   Start/B: close',W/2,448,11,'#9fb','center',null);}};
// ---------- Results ----------
const Results={name:'results',data:null,t:0,
 show(d){this.data=d;this.t=0;this.np=NPLAYERS;go(this);},
 enter(){startMusic(this.data&&!this.data.win?'gameover':'results');},
 update(dt){this.t+=dt;if(this.t>1&&(anyPressed('ok')||anyPressed('start'))){SFX.ok();go(MapScene);}},
 draw(){const d=this.data;img('world_map',0,0,W,H);dim(.7);rrect(110,70,420,340,16,'rgba(6,20,36,.95)',d.win?'#ffd23a':'#ff5a8a',4);
  text(d.win?'MISSION COMPLETE':'MISSION FAILED',W/2,115,28,d.win?'#ffd23a':'#ff5a8a','center');text(d.name||LEVELS[0].name,W/2,142,14,'#cfe','center',null);
  if(d.win){const r=[['XP earned','+'+d.xp],['Pizza tips','$'+d.coins],['Clues found',d.clues+' / '+(d.total||3)],['Enemies beaten',d.kills]];r.forEach((x,i)=>{const y=185+i*40;if(this.t>0.3*i){text(x[0],150,y,18,'#fff','left',null);text(x[1],490,y,18,'#ffd23a','right',null);}});
   const wc=typeof winCodes==='function'?winCodes(d.id||1):[];
   if(this.t>1.4){if(wc.length){rrect(130,336,380,30,8,'rgba(255,90,224,.2)','#ff5ae0',2);
     const ct=wc.length===1?(wc[0].city?'CITY CODE:  '+wc[0].code+'  ('+wc[0].city.name+')':'CODE FOR '+wc[0].what+':  '+wc[0].code):'CODES:  '+wc.slice(0,3).map(w=>w.code+' ('+(w.city?w.city.name:w.what.toLowerCase())+')').join('   ');
     text(ct,W/2,357,wc.length===1?14:12,'#ff9ae0','center',null);}
    else text('More missions coming in the next build!',W/2,357,13,'#9fb','center',null);}
   if(this.t>1.2&&d.rare)text('RARE PART FOUND: '+partDef(d.rare).n.toUpperCase()+'! (Gadget Lab)',W/2,324,14,'#ffd23a','center',null);
   if(this.t>1.6&&d.ride)text('NEW RIDE IN THE GARAGE: '+d.ride.toUpperCase()+'!',W/2,380,13,'#ffd23a','center',null);}
  else text('Sandy: Regroup in the lair and try again.',W/2,220,16,'#fff','center',null);
  if(this.t>1)text('Press A to continue',W/2,402,14,'#2de2f5','center',null);
  // agents celebrate beside the panel (victory dance art for Coco)
  if(d.win){const hop=(ch,x,flip)=>{const [sx,sy,r,oy]=danceHop(ch,TIME+(flip?.25:0));drawSprite(ch,loopFrame(ch,'dance',TIME+(flip?.25:0)),x,452+oy,flip,1,1.45,sx,sy,r);};
   hop(p1Char(),64,false);if(this.np>1)hop(p2Char(),W-64,true);}}};
