// ===== Achievements: catalog, tracking hooks, cash payouts, unlock banner, Trophy Case screen (v0.14) =====
// Every achievement pays CASH (SAVE.coins) once, the moment it unlocks. Harder / more niche = more cash.
// Tiers come from the payout: Bronze < $20, Silver < $50, Gold < $100, Platinum $100+.
// Hidden (h:1) ones show as "???" until found (testing mode reveals their names for review).
// SAVE fields: ach{id:unlockTime}, st{stat:count} (lifetime counters), lv{mission:{records}}, codesUsed{CODE:1}, achV (1 = old saves were back-filled).
// Hooks are wrappers, so the other files stay untouched apart from: engine.js frame() calls drawOverlay(dt), Watch tab 5 opens the Trophy Case, Lair menu entry.
SAVE.ach=SAVE.ach||{};SAVE.st=SAVE.st||{};SAVE.lv=SAVE.lv||{};SAVE.codesUsed=SAVE.codesUsed||{};
const st=k=>SAVE.st[k]||0;
function bump(k,n=1){SAVE.st[k]=(SAVE.st[k]||0)+n;}
function stMax(k,v){if(v>(SAVE.st[k]||0))SAVE.st[k]=v;}
const lv=m=>SAVE.lv[m]||(SAVE.lv[m]={});
const GIL=[1,2,3,4,5],ACTION=[1,2,3,5];
const cluesIn=m=>CLUES.reduce((n,c,i)=>n+(c.lvl===m&&SAVE.clues.includes(i)?1:0),0);
const cluesTot=m=>CLUES.filter(c=>c.lvl===m).length;
const rareOf=m=>RARE.find(r=>r.lvl===m);
const mmss=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
const ownedGadgets=()=>GADGET_DEFS.filter(g=>SAVE.gadgets[g.id]!=null).length;
const perfectGadgets=()=>GADGET_DEFS.filter(g=>SAVE.gadgets[g.id]===2).length;
const commonParts=()=>PARTS.reduce((n,p)=>n+(SAVE.parts[p.id]||0),0);
// Par times (seconds of play, intro and outro not counted)
const PAR={1:150,2:105,5:120};
const ACH_CATS=[['all','ALL'],['mission','MISSIONS'],['story','STORY'],['count','COUNTERS'],['deliv','DELIVERY'],['lair','LAIR'],['fun','FUN'],['secret','SECRETS']];
const ACH=[];
// a(id, name, description, category, cash, test, progress, hidden)
function a(id,n,d,c,cash,ok,p,h){ACH.push({id,n,d,c,cash,ok,p,h:!!h});}
// counter tiers: one achievement per tier
const ROMAN=['I','II','III','IV','V'];
function tiers(id,n,dfn,c,val,list,hid){list.forEach(([max,cash],i)=>a(id+'_'+(i+1),n+' '+ROMAN[i],dfn(max),c,cash,()=>val()>=max,()=>[Math.min(val(),max),max],hid&&hid[i]));}

// ---------------- MISSIONS (per level) ----------------
const MSHORT={1:'Heritage',2:'Rooftop',3:'Crane Yard',4:'Site Office',5:'Wrecking Yard'};
a('m1_clear','Case Opened','Beat Mission 1: Heritage District Break-in.','mission',15,()=>!!SAVE.done[1]);
a('m2_clear','Special Delivery','Beat Mission 2: Rooftop Delivery.','mission',15,()=>!!SAVE.done[2]);
a('m3_clear','Caught the Courier','Beat Mission 3: Crane Yard Chase.','mission',20,()=>!!SAVE.done[3]);
a('m4_clear','Access Granted','Beat Mission 4: Site Office Hack.','mission',20,()=>!!SAVE.done[4]);
a('m5_clear','Hard Hat, Hard Fall','Beat Papa Johnny in Mission 5: the Wrecking Yard.','mission',40,()=>!!SAVE.done[5]);
GIL.forEach(m=>a('m'+m+'_clues',MSHORT[m]+' Sleuth','Find all '+cluesTot(m)+' clues in Mission '+m+'.','mission',m===5?25:20,()=>cluesIn(m)>=cluesTot(m),()=>[cluesIn(m),cluesTot(m)]));
GIL.forEach(m=>{const r=rareOf(m);a('m'+m+'_rare','Treasure: '+r.n,'Find the rare '+r.n+' ('+r.where+').','mission',25,()=>!!SAVE.rare[r.id]);});
ACTION.forEach(m=>a('m'+m+'_coins',MSHORT[m]+' Coin Vacuum','Grab every single coin in Mission '+m+' in one run.','mission',30,()=>!!lv(m).coinsAll));
ACTION.forEach(m=>a('m'+m+'_nohit','Untouchable: '+MSHORT[m],'Beat Mission '+m+' without either agent getting hit even once.','mission',m===5?100:60,()=>!!lv(m).noHit));
a('m4_silent','Silent Hacker','Beat the Site Office Hack without setting off a single alarm.','mission',50,()=>!!lv(4).silent);
[1,2,5].forEach(m=>a('m'+m+'_speed',{1:'Heritage Hustle',2:'Rooftop Rocket',5:'Wrecking Ball'}[m],'Beat Mission '+m+' in under '+mmss(PAR[m])+' of play time.','mission',m===5?60:40,()=>lv(m).time>0&&lv(m).time<PAR[m],()=>lv(m).time?[0,0,'Best '+mmss(lv(m).time)]:null));
a('m4_speed','Speed Hacker','Crack all three Site Office boards in under 1:30 total.','mission',50,()=>lv(4).time>0&&lv(4).time<90,()=>lv(4).time?[0,0,'Best '+mmss(lv(4).time)]:null);
a('m2_nogap','Sure-Footed','Beat Rooftop Delivery without falling down a single gap.','mission',35,()=>!!lv(2).noOops);
a('m3_nobarrel','Barrel Dancer','Beat Crane Yard Chase without getting knocked by a barrel or a brick.','mission',35,()=>!!lv(3).noHit||!!lv(3).noBarrel);
a('m1_kapow','Foreman Floored','Knock out the Foreman with a KA-POW finisher.','mission',25,()=>!!lv(1).bossFin,null,1);
a('m4_surge','Power Surge','Solve a Site Office board with 60 or more seconds still on the clock.','mission',40,()=>(lv(4).bestLeft||0)>=60,null,1);
a('m5_solo','One-Agent Wrecking Crew','Beat Papa Johnny in 1-player mode.','mission',50,()=>!!lv(5).solo,null,1);
a('m5_dozer','Dozer Downer','Beat every bulldozer in the Wrecking Yard and still win.','mission',40,()=>!!lv(5).allDozers,null,1);

// ---------------- STORY / MILESTONES ----------------
a('gil_all','Gilbert Liberated','Clear all five Gilbert missions.','story',50,()=>GIL.every(m=>SAVE.done[m]),()=>[GIL.filter(m=>SAVE.done[m]).length,5]);
a('gil_clues','Case Closed: Gilbert','Find all 15 Gilbert clues for the Case Board.','story',75,()=>GIL.every(m=>cluesIn(m)>=cluesTot(m)),()=>[GIL.reduce((n,m)=>n+cluesIn(m),0),15]);
a('gil_rare','Rare Collector: Gilbert','Find all five Gilbert rare parts.','story',75,()=>GIL.every(m=>SAVE.rare[rareOf(m).id]),()=>[GIL.filter(m=>SAVE.rare[rareOf(m).id]).length,5]);
a('gil_coins','Gilbert Gold Rush','Get a Coin Vacuum on every Gilbert action mission.','story',100,()=>ACTION.every(m=>lv(m).coinsAll),()=>[ACTION.filter(m=>lv(m).coinsAll).length,4]);
a('gil_flawless','Ghost of Gilbert','Untouchable on all four action missions AND Silent Hacker.','story',200,()=>ACTION.every(m=>lv(m).noHit)&&lv(4).silent,()=>[ACTION.filter(m=>lv(m).noHit).length+(lv(4).silent?1:0),5]);
a('gil_speed','Gilbert Speedrunner','Earn every Gilbert speed achievement.','story',150,()=>[1,2,5].every(m=>lv(m).time>0&&lv(m).time<PAR[m])&&lv(4).time>0&&lv(4).time<90);
a('rank_agent','Promoted: Agent','Reach Agent rank (200 XP). Unlocks a 2nd gadget slot.','story',25,()=>SAVE.xp>=200,()=>[Math.min(SAVE.xp,200),200]);
a('rank_super','Promoted: Super Agent','Reach Super Agent rank (600 XP).','story',75,()=>SAVE.xp>=600,()=>[Math.min(SAVE.xp,600),600]);
a('coop_first','Partner Power','Beat any mission in 2-player co-op.','story',20,()=>!!SAVE.coop||GIL.some(m=>lv(m).coop));
a('coop_all','Dream Team','Beat all five Gilbert missions in co-op.','story',80,()=>GIL.every(m=>lv(m).coop),()=>[GIL.filter(m=>lv(m).coop).length,5]);
a('solo_all','Lone Wolf','Beat all five Gilbert missions in 1-player mode.','story',80,()=>GIL.every(m=>lv(m).solo),()=>[GIL.filter(m=>lv(m).solo).length,5]);
a('comeback','Comeback Kid','Win a mission after an agent got knocked DOWN.','story',30,()=>st('comebacks')>0,null,1);
a('clutch','Hanging by a Heart','Win an action mission with an agent on their last heart.','story',30,()=>st('clutch')>0,null,1);
a('last_standing','Last Agent Standing','Win a co-op mission while your partner is still down.','story',35,()=>st('lastStanding')>0,null,1);
a('switch_win','Sisi Takes the Lead','Win a solo mission as Agent Sisi.','story',25,()=>st('sisiSolo')>0,null,1);

// ---------------- COUNTERS (lifetime totals, tiered) ----------------
tiers('kos','Hench Wrench',n=>'Knock out '+n+' henchmen.','count',()=>st('kos'),[[10,10],[50,25],[150,50],[500,120]]);
tiers('kapow','KA-POW!',n=>'Finish off '+n+' enemies with a combo finisher.','count',()=>st('finKOs'),[[10,10],[50,30],[200,80]]);
tiers('coins','Coin Collector',n=>'Grab '+n+' coins in missions.','count',()=>st('coins'),[[100,10],[500,30],[2000,90]]);
tiers('dj','Frequent Flyer',n=>'Do '+n+' double jumps.','count',()=>st('dj'),[[50,10],[500,30],[2000,75]]);
tiers('wheel','Cartwheel Queen',n=>'Dodge '+n+' attacks with Sisi\'s cartwheel.','count',()=>st('dodges'),[[10,15],[100,50]]);
tiers('revive','Medic!',n=>'Help your partner back up '+n+' time'+(n>1?'s':'')+'.','count',()=>st('revives'),[[1,15],[25,50]]);
tiers('slices','Pizza Power',n=>'Eat '+n+' pizza slices in missions.','count',()=>st('slices'),[[10,10],[50,30]]);
tiers('gadget','Gadgeteer',n=>'Use gadgets '+n+' times in missions.','count',()=>st('gadgets'),[[10,10],[100,40],[300,90]]);
tiers('ham','Hamster Herder',n=>'Turn '+n+' henchmen into hamsters.','count',()=>st('hamsters'),[[1,10],[25,40]],[1,0]);
tiers('bosses','Boss Buster',n=>'Defeat '+n+' bosses (replays count).','count',()=>st('bosses'),[[3,20],[15,60]]);
tiers('wins','Mission Machine',n=>'Win '+n+' missions (replays count).','count',()=>st('wins'),[[10,20],[25,45],[60,100]]);
tiers('xp','XP Hoarder',n=>'Earn '+n+' total XP.','count',()=>SAVE.xp,[[1000,40],[2500,100]]);
tiers('mparts','Scavenger',n=>'Pick up '+n+' crafting parts in missions.','count',()=>st('partsPicked'),[[10,10],[50,35]]);
tiers('deliv','Delivery Pro',n=>'Finish '+n+' pizza delivery shifts.','count',()=>SAVE.deliveries||0,[[10,25],[25,50],[100,150]]);
tiers('tips','Tip Jar',n=>'Earn $'+n+' in delivery tips (lifetime).','count',()=>st('tips'),[[100,15],[500,40],[2000,120]]);
tiers('hot','Fresh From the Oven',n=>'Deliver '+n+' HOT pizzas.','count',()=>st('hot'),[[25,15],[150,50]]);
tiers('spend','Big Spender',n=>'Spend $'+n+' at the shop and Gadget Lab.','count',()=>st('spent'),[[100,10],[500,30],[1500,80]]);
tiers('craft','Lair Engineer',n=>'Craft '+n+' gadget'+(n>1?'s':'')+'.','count',()=>st('crafts'),[[1,15],[10,35],[25,70]]);
tiers('time','Dedicated Agent',n=>'Play for '+(n>=3600?(n/3600)+' hour'+(n>3600?'s':''):(n/60)+' minutes')+' in total.','count',()=>st('playT'),[[1800,15],[7200,40],[36000,120]]);
tiers('troph','Trophy Hunter',n=>'Unlock '+n+' achievements.','count',()=>achCount(),[[10,15],[40,50],[80,120]]);

// ---------------- DELIVERY ----------------
a('d_first','First Shift','Finish your first pizza delivery for Barro\'s.','deliv',10,()=>!!SAVE.firstDelivery);
a('d_3star','Three-Star Shift','Get 3 stars on a delivery shift.','deliv',20,()=>(SAVE.dstars||0)>=3);
a('d_perfect10','Pizza Perfectionist','Finish 10 perfect delivery runs (all HOT, no crashes).','deliv',60,()=>st('perfectRuns')>=10,()=>[Math.min(st('perfectRuns'),10),10]);
a('d_40','Big Tip Energy','Earn $40 or more in a single shift.','deliv',25,()=>(SAVE.bestTips||0)>=40,()=>[Math.min(SAVE.bestTips||0,40),40]);
a('d_evening','Night Rider','Finish an evening delivery run (headlights on!).','deliv',15,()=>st('eveningRuns')>0);
a('d_both','Both Riders','Finish a shift as Coco AND a shift as Sisi.','deliv',15,()=>st('rideCoco')>0&&st('rideSisi')>0);
a('d_scooter','Curb Hopper','Finish a delivery shift on the scooter.','deliv',10,()=>st('rideScooter')>0);
a('d_bday','Party Pizza','Deliver a pizza to a birthday party.','deliv',10,()=>st('bday')>0);
a('d_coop','Navigator','Finish a delivery shift in 2-player (P2 pings houses).','deliv',15,()=>st('coopDeliv')>0);
a('d_allrides','Ride Collector','Own every delivery ride, including the Agent Bike.','deliv',60,()=>['scooter','agent_bike'].every(id=>SAVE.rides[id]||(id==='scooter'&&SAVE.vehicles.Scooter)));
a('d_upg','Fully Loaded','Buy all six ride upgrades at Barro\'s Shop.','deliv',50,()=>UPGRADES.every(u=>SAVE.upg[u.id]),()=>[UPGRADES.filter(u=>SAVE.upg[u.id]).length,UPGRADES.length]);
a('d_cold','Cold Pizza Club','Deliver a COLD pizza. Hey, it still counts.','deliv',5,()=>st('cold')>0,null,1);
a('d_squish','Squish Happens','Squish 3 pizzas in one shift.','deliv',5,()=>st('squish3')>0,null,1);
a('d_bell','Ding Ding!','Ring your bike bell 50 times.','deliv',15,()=>st('bells')>=50,()=>[Math.min(st('bells'),50),50],1);
a('d_friday','Pizza Friday','Finish a delivery shift on a real Friday.','deliv',15,()=>st('friday')>0,null,1);
a('d_jackpot','Jackpot Shift','Earn $80 or more in a single shift.','deliv',20,()=>(SAVE.bestTips||0)>=80,null,1);

// ---------------- LAIR & GEAR ----------------
a('l_buy','Grand Opening','Buy something at Barro\'s Shop.','lair',5,()=>st('buys')>0);
a('l_craft_perfect','Perfect Craft','Craft a gadget at Perfect quality.','lair',25,()=>perfectGadgets()>0||st('perfectCrafts')>0);
a('l_perfect5','Master Engineer','Own 5 different gadgets at Perfect quality.','lair',80,()=>perfectGadgets()>=5,()=>[Math.min(perfectGadgets(),5),5]);
a('l_gadgets5','Gadget Collection','Own 5 different gadgets.','lair',40,()=>ownedGadgets()>=5,()=>[Math.min(ownedGadgets(),5),5]);
a('l_arsenal','Full Arsenal','Own all '+GADGET_DEFS.length+' gadgets. Some need rare parts from later territories.','lair',250,()=>ownedGadgets()>=GADGET_DEFS.length,()=>[ownedGadgets(),GADGET_DEFS.length]);
a('l_bike','Built, Not Bought','Craft the Agent Bike in the Gadget Lab.','lair',60,()=>!!SAVE.rides.agent_bike);
a('l_dual','Double Trouble','Equip two gadgets on one agent.','lair',15,()=>['agent_coco','agent_sisi'].some(c=>(SAVE.equip[c]||[]).filter(Boolean).length>=2&&slotsFor()>=2));
a('l_smoke','Smoke Stack','Carry 15 or more Smoke Pellets at once.','lair',20,()=>(SAVE.smoke||0)>=15,()=>[Math.min(SAVE.smoke||0,15),15]);
a('l_hoard','Parts Pile','Have 30 common crafting parts at once.','lair',20,()=>commonParts()>=30,()=>[Math.min(commonParts(),30),30]);
a('l_rich','Piggy Bank','Have $500 cash at once.','lair',50,()=>SAVE.coins>=500,()=>[Math.min(SAVE.coins,500),500]);
a('l_song','Beat Maker','Save your first song in the Music Room.','lair',15,()=>st('songsMax')>0);
a('l_album','Full Album','Fill all 8 song slots in the Music Room.','lair',40,()=>st('songsMax')>=8,()=>[Math.min(st('songsMax'),8),8]);
a('l_theme','DJ Sandy','Pick your own music for a screen in the Theme Picker.','lair',10,()=>Object.keys(SAVE.musicPick||{}).length>0);
a('l_tape','Duct Tape Genius','Save a Basic craft with Duct Tape.','lair',10,()=>st('taped')>0,null,1);
a('l_lucky','Lucky Sevens','Have exactly $77 cash.','lair',7,()=>SAVE.coins===77,null,1);

// ---------------- FUN / NOVELTY ----------------
a('f_code','Code Cracker','Enter a working code on the title screen.','fun',10,()=>Object.keys(SAVE.codesUsed).length>0);
a('f_codes10','Codebreaker','Enter 10 different working codes.','fun',40,()=>Object.keys(SAVE.codesUsed).length>=10,()=>[Math.min(Object.keys(SAVE.codesUsed).length,10),10]);
a('f_outfit','Dressed for Success','Win a mission wearing a secret outfit.','fun',15,()=>st('outfitWin')>0);
a('f_tabs','Tab Tourist','Visit all 8 tabs of the Gadget Watch.','fun',5,()=>(SAVE.st.tabs||0)===255);
a('f_tips','Sandy Says','Read 25 tips in Sandy Chat.','fun',10,()=>st('sandyTips')>=25,()=>[Math.min(st('sandyTips'),25),25]);
a('f_block','Pizza Pan Defense','Block 25 hits with the Pizza Shield.','fun',20,()=>st('blocks')>=25,()=>[Math.min(st('blocks'),25),25]);
a('f_boink','Return to Sender','Bounce 10 bricks back with the Pizza Shield.','fun',30,()=>st('boinks')>=10,()=>[Math.min(st('boinks'),10),10]);
a('f_badcode','Nice Try, Agent','Enter 5 codes that do nothing.','fun',5,()=>st('badCodes')>=5,null,1);
a('f_sandy','Hi, Sandy!','Say hi to Sandy with a secret code.','fun',10,()=>!!SAVE.codesUsed.SANDY,null,1);
a('f_barros','Extra Cheese','Order the secret menu with a code.','fun',10,()=>!!SAVE.codesUsed.BARROS,null,1);
a('f_nap','Sandy\'s Nap','Leave the world map alone for 2 minutes. Shhh.','fun',10,()=>st('nap')>0,null,1);
a('f_watch50','Clock Watcher','Open the Gadget Watch 50 times.','fun',10,()=>st('watchOpens')>=50,null,1);
a('f_oops','Oops-a-Daisy','Fall down gaps 10 times.','fun',10,()=>st('oops')>=10,null,1);
a('f_toofast','Too Fast to Punch','Swing at the Courier 10 times while he\'s TOO FAST.','fun',10,()=>st('tooFast')>=10,null,1);
a('f_hamdance','Hamster Dance','Have 3 hamsters on screen at once.','fun',25,()=>st('ham3')>0,null,1);
a('f_cheatday','Cheat Day','Win a mission with 3 or more cheats switched on.','fun',15,()=>st('cheatWin')>0,null,1);
a('f_moon','One Small Step','Win a mission with Moon Jump on.','fun',10,()=>st('moonWin')>0,null,1);
a('f_twins','Twinning!','Win a co-op mission with both agents in the same secret outfit.','fun',25,()=>st('twinWin')>0,null,1);
a('f_spam','Button Masher','Throw 30 punches or kicks in 10 seconds.','fun',10,()=>st('mash')>0,null,1);
a('f_pacifist','Sneaky Pete','Beat Rooftop Delivery without knocking out anyone.','fun',45,()=>!!lv(2).pacifist,null,1);
a('f_all','Living Legend','Unlock every other achievement.','fun',500,()=>ACH.every(x=>x.id==='f_all'||SAVE.ach[x.id]),()=>[Math.min(achCount(),ACH.length-1),ACH.length-1],1);

ACH.forEach(x=>{x.tier=x.cash>=100?3:x.cash>=50?2:x.cash>=20?1:0;});
const ACH_BY={};ACH.forEach(x=>ACH_BY[x.id]=x);
function achCount(){let n=0;for(const x of ACH)if(SAVE.ach[x.id])n++;return n;}
function achCash(){let n=0;for(const x of ACH)if(SAVE.ach[x.id])n+=x.cash;return n;}

// ---------------- unlocking + payout ----------------
const ACH_Q=[];let ACH_SILENT=false,achT=0,achBanner=null;
function achUnlock(x){if(SAVE.ach[x.id])return;SAVE.ach[x.id]=Date.now();SAVE.coins+=x.cash;ACH_LASTC=SAVE.coins;
 if(!ACH_SILENT)ACH_Q.push({x,life:3.2});}
let ACH_LASTC=SAVE.coins;
function achCheck(){let any=false;for(let pass=0;pass<2;pass++)for(const x of ACH){if(SAVE.ach[x.id])continue;let ok=false;try{ok=x.ok();}catch(e){}if(ok){achUnlock(x);any=true;}}
 if(any)save();return any;}
// First run with achievements: quietly back-fill what old saves already earned, then show one summary banner.
function achBackfill(){if(SAVE.achV)return;ACH_SILENT=true;const before=achCount(),c0=SAVE.coins;achCheck();ACH_SILENT=false;SAVE.achV=1;save();
 const n=achCount()-before;if(n>0)ACH_Q.push({sum:true,n,cash:SAVE.coins-c0,life:4.2});}

// ---------------- banner (drawn over every scene from engine.js) ----------------
const TIER_COL=['#d98a4a','#c8d4e6','#ffd23a','#7ff0ff'],TIER_N=['BRONZE','SILVER','GOLD','PLATINUM'];
function trophyIcon(cx,cy,s,tier,lit){const c=lit?TIER_COL[tier]:'#3a4256',k=s/32;ctx.save();ctx.translate(cx,cy);ctx.scale(k,k);ctx.lineWidth=2.5;ctx.strokeStyle='#0b0718';ctx.fillStyle=c;
 ctx.beginPath();ctx.moveTo(-11,-13);ctx.lineTo(11,-13);ctx.lineTo(9,0);ctx.quadraticCurveTo(0,8,-9,0);ctx.closePath();ctx.fill();ctx.stroke();   // cup
 ctx.beginPath();ctx.arc(-11,-6,5,Math.PI*.5,Math.PI*1.5);ctx.stroke();ctx.beginPath();ctx.arc(11,-6,5,-Math.PI*.5,Math.PI*.5);ctx.stroke();       // handles
 ctx.fillRect(-2.5,3,5,6);ctx.strokeRect(-2.5,3,5,6);ctx.beginPath();ctx.roundRect(-9,9,18,5,2);ctx.fill();ctx.stroke();                          // stem + base
 if(lit){ctx.fillStyle='rgba(255,255,255,.75)';ctx.fillRect(-7,-11,3,8);if(tier===3){ctx.fillStyle='#fff';const t=TIME*4;ctx.globalAlpha=.6+.4*Math.sin(t);ctx.fillRect(8,-17,2,6);ctx.fillRect(6,-15,6,2);}}
 ctx.restore();}
function drawOverlay(dt){dt=dt||1/60;
 bump('playT',dt);if(SAVE.coins<ACH_LASTC)bump('spent',ACH_LASTC-SAVE.coins);ACH_LASTC=SAVE.coins;
 if(scene===MapScene){if(anyHeld('ok')||anyHeld('left')||anyHeld('right')||anyHeld('up')||anyHeld('down')||anyHeld('start')||anyHeld('back'))ACH_IDLE=0;else{ACH_IDLE+=dt;if(ACH_IDLE>120&&!st('nap'))bump('nap');}}else ACH_IDLE=0;
 stMax('songsMax',(SAVE.songs||[]).length);
 achT-=dt;if(achT<=0){achT=.5;achCheck();}
 if(!achBanner&&ACH_Q.length){achBanner=ACH_Q.shift();achBanner.t=0;playStinger(achBanner.sum||achBanner.x.tier>=2?'unlock':'clue');}
 const b=achBanner;if(!b)return;b.t+=dt;if(b.t>b.life){achBanner=null;return;}
 const slide=Math.min(1,b.t*5,(b.life-b.t)*5),y=-64+slide*(64+52),x=W/2-190;
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,slide*1.2));
 const col=b.sum?'#ffd23a':TIER_COL[b.x.tier];rrect(x,y,380,58,14,'rgba(8,10,30,.96)',col,3);
 trophyIcon(x+32,y+31,36,b.sum?2:b.x.tier,true);
 text(b.sum?'WELCOME BACK, AGENTS!':'ACHIEVEMENT UNLOCKED'+(b.x.h?'  (SECRET!)':''),x+60,y+20,11,col,'left',null);
 text(b.sum?b.n+' trophies from earlier missions':b.x.n,x+60,y+42,b.sum?15:17,'#fff','left',null);
 text('+$'+(b.sum?b.cash:b.x.cash),x+368,y+42,20,'#ffd23a','right',null);
 ctx.restore();}
let ACH_IDLE=0;

// ---------------- mission hooks ----------------
let ACH_RUN=null;
function achRunStart(def,np){return ACH_RUN={id:def.id,np,t:0,hits:0,downs:0,oops:0,barrelHits:0,kos:0,dozers:0,dozersBeat:0,bossFin:false,coinTotal:0,coinsGot:0,mash:[],prev:[],hackLeft:[]};}
const _makeLevel=makeLevel;
makeLevel=function(def,np){const L=_makeLevel(def,np),R=achRunStart(def,np);
 R.coinTotal=L.items.filter(i=>i.k==='coin').length;R.dozers=L.enemies.filter(e=>e instanceof Dozer).length;
 const uf=L.float;L.float=function(x,y,t){if(t==='OOPS!'){R.oops++;bump('oops');}else if(t==='DODGE!')bump('dodges');else if(t==='BLOCKED!')bump('blocks');else if(t==='BOINK!')bump('boinks');else if(t==='TOO FAST!')bump('tooFast');return uf.apply(this,arguments);};
 const dm=L.dmgPlayer;L.dmgPlayer=function(p,d,fromX){const hp=p.hp,dn=p.down;const r=dm.apply(this,arguments);if(p.hp<hp){R.hits++;if(L.shots.some(s=>s.brick&&s.life===0)||L.enemies.some(e=>e instanceof Barrel&&Math.abs(e.x-p.x)<60))R.barrelHits++;}if(!dn&&p.down)R.downs++;return r;};
 const he=L.hurtEnemy;L.hurtEnemy=function(e,d,dir,fin){const was=e.dead;const r=he.apply(this,arguments);
  if(!was&&e.dead){if(e.boss){bump('bosses');if(fin)R.bossFin=true;}else if(!(e instanceof Barrel)){bump('kos');R.kos++;}if(fin)bump('finKOs');if(e instanceof Dozer)R.dozersBeat++;}return r;};
 const co=L.collect;L.collect=function(p,it){const r=co.apply(this,arguments);if(it.k==='coin'){bump('coins');R.coinsGot++;}else if(it.k==='pizza')bump('slices');else if(it.k==='part'&&!RARE.includes(partDef(it.id)))bump('partsPicked');return r;};
 const up=L.update;L.update=function(dt){const r=up.apply(this,arguments);achPollLevel(L,R,dt);return r;};
 return L;};
function achPollLevel(L,R,dt){if(L.state==='play'&&!L.paused)R.t+=dt;
 L.players.forEach((p,i)=>{const q=R.prev[i]||(R.prev[i]={jumps:0,down:false,atk:0,g:0});
  if(p.jumps===2&&q.jumps<2)bump('dj');if(q.down&&!p.down&&L.state==='play')bump('revives');
  const atk=(p.atk||0)>0;if(atk&&!q.atkOn){R.mash.push(L.t);R.mash=R.mash.filter(t=>L.t-t<10);if(R.mash.length>=30&&!st('mash'))bump('mash');}q.atkOn=atk;
  q.jumps=p.jumps;q.down=p.down;});
 if(L.enemies.filter(e=>e.ham>0&&!e.dead).length>=3&&!st('ham3'))bump('ham3');}
const _useGadget=useGadget;useGadget=function(p,L){const before=JSON.stringify(L.gch);const r=_useGadget.apply(this,arguments);if(JSON.stringify(L.gch)!==before)bump('gadgets');return r;};
const _gadgetHit=gadgetHit;gadgetHit=function(L,e,s){const was=e.ham>0;const r=_gadgetHit.apply(this,arguments);if(!was&&e.ham>0&&!e.boss)bump('hamsters');return r;};
const _makeHack=makeHack;
makeHack=function(def,np){const H_=_makeHack(def,np),R=achRunStart(def,np);let ps=H_.state;
 const up=H_.update;H_.update=function(dt){const r=up.apply(this,arguments);if(H_.state==='play'&&!H_.paused)R.t+=dt;if(H_.state==='clear'&&ps!=='clear')R.hackLeft.push(H_.time);ps=H_.state;R.lives=H_.lives;R.maxLives=def.lives||3;return r;};
 return H_;};
const _missionPayout=missionPayout;
missionPayout=function(def,np,d){const R=ACH_RUN&&ACH_RUN.id===def.id?ACH_RUN:null,V=lv(def.id);
 if(R){const L=scene;V.clear=1;if(np>1)V.coop=1;else V.solo=1;
  if(def.type==='hack'){if(R.lives>=R.maxLives)V.silent=1;R.hackLeft.forEach(t=>{if(t>(V.bestLeft||0))V.bestLeft=Math.floor(t);});}
  else{if(R.hits===0)V.noHit=1;if(R.barrelHits===0)V.noBarrel=1;if(R.coinTotal>0&&R.coinsGot>=R.coinTotal)V.coinsAll=1;if(R.oops===0)V.noOops=1;if(R.bossFin)V.bossFin=1;if(R.kos===0)V.pacifist=1;
   if(R.dozers>0&&R.dozersBeat>=R.dozers+(def.id===5?0:0))V.allDozers=1;
   const pl=L&&L.players||[];if(pl.some(p=>!p.down&&p.hp===1))bump('clutch');if(np>1&&pl.some(p=>p.down))bump('lastStanding');}
  if(R.t>0&&(!V.time||R.t<V.time))V.time=Math.round(R.t*10)/10;
  if(R.downs>0)bump('comebacks');}
 bump('wins');
 if(np===1&&p1Char()==='agent_sisi')bump('sisiSolo');
 const oc=SAVE.outfit||{},cc=oc.agent_coco||0,cs=oc.agent_sisi||0,mine=np>1?(cc||cs):(p1Char()==='agent_sisi'?cs:cc);if(mine)bump('outfitWin');if(np>1&&cc&&cc===cs)bump('twinWin');
 const on=Object.keys(SAVE.on||{}).filter(k=>SAVE.on[k]);if(on.length>=3)bump('cheatWin');if(SAVE.on&&SAVE.on.moonjump)bump('moonWin');
 ACH_RUN=null;return _missionPayout.apply(this,arguments);};

// ---------------- delivery hooks ----------------
const _makeDelivery=makeDelivery;
makeDelivery=function(rider,rideId){const D=_makeDelivery(rider,rideId);let rp=0;D.squishTotal=0;const up=D.update;
 D.update=function(dt){const s=D.squish;const r=up.apply(this,arguments);if(D.squish>s)D.squishTotal+=D.squish-s;const g=D.bike&&D.bike.ring||0;if(g>0&&rp<=0)bump('bells');rp=g;return r;};return D;};
const _dShow=DeliveryResults.show;
DeliveryResults.show=function(D,first){try{bump('tips',D.cash);D.orders.forEach(o=>{if(o.temp==='HOT')bump('hot');if(o.temp==='COLD')bump('cold');if(o.mood&&o.mood.k==='bday')bump('bday');});
 if(D.perfect)bump('perfectRuns');if(D.evening)bump('eveningRuns');bump(D.rider==='agent_sisi'?'rideSisi':'rideCoco');if(D.rideId==='scooter')bump('rideScooter');
 if((D.squishTotal||0)>=3)bump('squish3');if(NPLAYERS>1)bump('coopDeliv');if(new Date().getDay()===5)bump('friday');}catch(e){}
 return _dShow.apply(this,arguments);};

// ---------------- lair hooks ----------------
const _shopUpd=Shop.update;Shop.update=function(dt){const c=SAVE.coins;const r=_shopUpd.apply(this,arguments);if(SAVE.coins<c)bump('buys');return r;};
const _craftMake=Craft.make;Craft.make=function(it){this._tape=partCount('tape');return _craftMake.apply(this,arguments);};
const _craftApply=Craft.apply;Craft.apply=function(){const r=_craftApply.apply(this,arguments);bump('crafts');if(this.q===2)bump('perfectCrafts');if(partCount('tape')<this._tape)bump('taped');save();return r;};

// ---------------- codes + watch hooks ----------------
const FUN_CODES={SANDY:{title:'HI, SANDY!',text:'Sandy: "Hi agents! I was just reorganizing your Case Board. Again. You\'re welcome."'},
 BARROS:{title:'EXTRA CHEESE!',text:'Barro\'s secret menu: one extra-cheese slice for the hardest-working delivery crew in Gilbert.'}};
const _enterCode=enterCode;
enterCode=function(raw){const c=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(FUN_CODES[c]){SAVE.codesUsed[c]=1;save();return Object.assign({ok:true},FUN_CODES[c]);}
 const r=_enterCode.apply(this,arguments);if(c&&r.ok&&c!=='NOTESTING')SAVE.codesUsed[c]=1;else if(c&&!r.ok&&r.title==='ACCESS DENIED')bump('badCodes');save();return r;};
const _watchMake=Watch.make;Watch.make=function(mode){bump('watchOpens');return _watchMake.apply(this,arguments);};
const _watchUpd=Watch.update;Watch.update=function(){const t=this.tab;
 if(t===5&&anyPressed('ok')){SFX.ok();push(TrophyCase.make());return;}
 if(t===6&&anyPressed('ok'))bump('sandyTips');
 const r=_watchUpd.apply(this,arguments);SAVE.st.tabs=(SAVE.st.tabs||0)|(1<<this.tab);return r;};

// ---------------- Trophy Case screen ----------------
// Left/Right: category. Up/Down: scroll. Y (gadget): filter all / to do / done. B or Start: back.
const TrophyCase={name:'trophies',cat:0,sel:0,filt:0,
 make(){this.sel=0;this.filt=0;return this;},
 visible(x){return !x.h||SAVE.ach[x.id]||SAVE.testing;},
 rows(){const c=ACH_CATS[this.cat][0];let R=ACH.filter(x=>c==='all'?true:c==='secret'?x.h:x.c===c&&this.visible(x));
  if(this.filt===1)R=R.filter(x=>!SAVE.ach[x.id]);if(this.filt===2)R=R.filter(x=>SAVE.ach[x.id]);return R;},
 update(dt){const n=ACH_CATS.length;
  if(anyPressed('left')){this.cat=(this.cat+n-1)%n;this.sel=0;SFX.move();}if(anyPressed('right')){this.cat=(this.cat+1)%n;this.sel=0;SFX.move();}
  if(anyPressed('gadget')){this.filt=(this.filt+1)%3;this.sel=0;SFX.move();}
  const R=this.rows();if(R.length){if(anyPressed('down')){this.sel=(this.sel+1)%R.length;SFX.move();}if(anyPressed('up')){this.sel=(this.sel+R.length-1)%R.length;SFX.move();}}
  if(this.sel>=R.length)this.sel=Math.max(0,R.length-1);
  if(anyPressed('back')||anyPressed('start')){SFX.move();pop();}},
 draw(){ctx.fillStyle='#0a0820';ctx.fillRect(0,0,W,H);const gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'rgba(60,30,120,.55)');gr.addColorStop(1,'rgba(5,40,60,.55)');ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  trophyIcon(34,30,34,2,true);text('TROPHY CASE',58,40,26,'#ffd23a','left');
  const tot=ACH.length,got=achCount();text(got+' / '+tot+' unlocked   $'+achCash()+' earned',W-20,26,13,'#fff','right',null);
  rrect(W-220,34,200,10,5,'#1a2240',null);rrect(W-220,34,Math.max(10,200*got/tot),10,5,'#ffd23a',null);
  ACH_CATS.forEach((cc,i)=>{const x=20+i*76,s=i===this.cat;rrect(x,54,72,24,7,s?'#ffd23a':'rgba(30,60,90,.85)',s?'#fff':'#2de2f5',1.5);text(cc[1],x+36,70,cc[1].length>8?9:10,s?'#102':'#fff','center',null);});
  const R=this.rows(),VIS=7,top=Math.max(0,Math.min(this.sel-3,R.length-VIS));
  if(!R.length)text(this.filt===2?'Nothing here yet. Go earn some!':'All done here!',W/2,220,16,'#9fb','center',null);
  R.slice(top,top+VIS).forEach((x,j)=>{const i=top+j,y=86+j*42,s=i===this.sel,got=!!SAVE.ach[x.id],show=this.visible(x);
   rrect(20,y,600,38,8,s?'rgba(255,210,58,.92)':got?'rgba(40,70,60,.8)':'rgba(25,35,60,.8)',s?'#fff':got?TIER_COL[x.tier]:'#3a4a6a',s?2.5:1.5);
   if(show)trophyIcon(42,y+19,26,x.tier,got);else{text('?',42,y+27,22,'#789','center',null);}
   text(show?x.n:'??? Secret achievement',62,y+17,14,s?'#102':got?'#fff':'#bcd','left',null);
   const sub=show?x.d:'A secret '+({mission:'mission',story:'story',count:'counter',deliv:'delivery',lair:'Lair',fun:'just-for-fun'}[x.c])+' achievement. Try weird things!';ctx.font='bold 11px "Trebuchet MS",Verdana,sans-serif';let sd=sub;while(ctx.measureText(sd).width>400&&sd.length>4)sd=sd.slice(0,-4)+'...';
   text(sd,62,y+32,11,s?'#334':'#9ab','left',null);
   text(show||got?'$'+x.cash:'$???',608,y+17,15,s?'#102':'#ffd23a','right',null);
   if(got)text('DONE',608,y+32,10,s?'#063':'#7f7','right',null);
   else if(show&&x.p){const p=x.p();if(p&&p[1]){rrect(528,y+25,80,7,3,s?'#fff8':'#0a1020',null);rrect(528,y+25,Math.max(4,80*p[0]/p[1]),7,3,s?'#063':'#2de2f5',null);}else if(p&&p[2])text(p[2],608,y+32,10,s?'#334':'#9cf','right',null);}});
  if(R.length>VIS){const h=294,th=Math.max(20,h*VIS/R.length),ty=86+(h-th)*top/Math.max(1,R.length-VIS);rrect(624,86,6,h,3,'#1a2240',null);rrect(624,ty,6,th,3,'#2de2f5',null);}
  const x=R[this.sel];rrect(20,384,600,68,10,'rgba(6,20,36,.95)','#2de2f5',2);
  if(x){const show=this.visible(x),got=SAVE.ach[x.id];
   text((show?TIER_N[x.tier]:'SECRET')+(x.h?(show?'  (secret)':''):''),34,402,11,show?TIER_COL[x.tier]:'#ff9ae0','left',null);
   wrap(show?x.d:'Secret achievements stay hidden until you find them. Try weird things!',34,420,440,15,13,'#fff',null);
   let right=got?'Unlocked '+new Date(SAVE.ach[x.id]).toLocaleDateString():'';if(!got&&show&&x.p){const p=x.p();if(p&&p[1])right=p[0]+' / '+p[1];else if(p&&p[2])right=p[2];}
   text(show||got?'Reward $'+x.cash:'Reward $???',606,404,14,'#ffd23a','right',null);if(right)text(right,606,424,12,'#9fb','right',null);}
  text('Left/Right: category   Up/Down: scroll   Y: '+['show all','to do only','done only'][this.filt]+'   B: back',W/2,470,10,'#9fb','center',null);}};

achBackfill();
