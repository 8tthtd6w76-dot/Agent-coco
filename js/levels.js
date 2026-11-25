// ===== Level definitions (pure data) =====
// To add a mission: add an entry keyed by its LEVELS id (scenes.js). makeLevel() in level.js runs it.
// Fields:
//  width, groundY, theme (key in THEMES), spawn {x,gap}
//  platforms [[x,y,width],...] one-way, clues [{x,y,clue}] (clue = index into CLUES)
//  pizzas [[x,y],...] heal +2, coins {n,x0,dx,jitter} auto row and/or coinList [[x,y],...]
//  enemies [{type,x,...}] (type in ENEMY_TYPES), boss {type,x,trigger,hp,name,nameColor}
//  intro [lines], introExpr [sandy faces], title, sub, goal, winText, reward {base,perClue,perKill,tips}
//  music / bossMusic: track names for music.js (via levelMusic/bossMusic in musichook.js)
//  pits [[x0,x1],...] gaps with no ground (fall = lose a heart, respawn)   goalX: reach it to win (no boss)
//  autoscroll {speed}: camera keeps moving right   boss.lock:false keeps the camera free when the boss appears
//  outro {lines, expr, glimpse}: Sandy talk after a win (glimpse:true shows Papa Johnny in the shadows)
//  parts [{id,x,y}]: rare crafting part pickups (items.js RARE)   boss.part: rare part the boss drops   dozerPart: rare part a beaten dozer drops
//  unlockVehicle: garage ride earned on a win   type:'hack' runs the puzzle scene in hack.js instead
const LEVEL_DEFS={};

LEVEL_DEFS[1]={
 id:1,title:'MISSION 1: HERITAGE DISTRICT BREAK-IN',sub:'Gilbert, AZ  |  Night',
 width:4600,groundY:410,theme:'gilbert_night',spawn:{x:120,gap:50},
 platforms:[[520,330,120],[760,290,140],[1020,340,100],[1300,300,160],[1620,340,120],[1860,280,140],[2200,320,140],[2480,270,160],[2800,330,120],[3050,290,160],[3350,340,120]],
 parts:[{id:'bank_gear',x:3130,y:246}],
 clues:[{x:830,y:246,clue:0},{x:1930,y:236,clue:1},{x:2560,y:226,clue:2}],
 pizzas:[[1340,256],[2260,276],[3410,296]],
 coins:{n:34,x0:300,dx:125,jitter:40},
 enemies:[
  {type:'walker',x:700},{type:'walker',x:1100},{type:'walker',x:1500},{type:'walker',x:1900},
  {type:'walker',x:2350},{type:'walker',x:2700},{type:'walker',x:3100},{type:'walker',x:3500},
  {type:'thrower',x:1250,cd:1,seed:20},{type:'thrower',x:2050,cd:1.3,seed:21},{type:'thrower',x:2900,cd:1.6,seed:22},{type:'thrower',x:3300,cd:1.9,seed:23}],
 boss:{type:'foreman',x:4400,trigger:3950,hp:16,name:'THE FOREMAN',nameColor:'#ffb060'},
 music:'gilbert_1',bossMusic:'foreman',
 intro:["Nice pizza run, Michael Henry and Ava! Tips tonight: $23 in cash. Not bad for an after-school job at the shop.",
  "Homework: done. Deliveries: done. Now the fun part. Someone keeps breaking into old buildings in Gilbert's Heritage District after dark.",
  "Find the 3 hidden clues, beat the hardhat crew, and see who is giving the orders. Coco has the punch and beam. Both agents can double jump. Sisi jumps lighter and faster!"],
 introExpr:['happy','smug','proud'],
 goal:'Reach the end of the district. Beat the crew. Find 3 clues!',
 winText:'THE FOREMAN IS DOWN!',
 outro:{lines:["The foreman dropped his radio. Listen...","RADIO: 'You lost to two KIDS? Papa Johnny is not happy. Clear out before the agents come back.'","Papa Johnny. He runs every crew in Gilbert. And he wears a gold tooth. We'll get him, agents."],expr:['thinking','alarmed','proud'],glimpse:true,music:'cutscene_dark'},
 reward:{base:100,perClue:50,perKill:5,tips:23}
};

// ---------- Mission 2: rooftops. Jump the gaps between buildings, deliver the pizza at the end. ----------
LEVEL_DEFS[2]={
 id:2,title:'MISSION 2: ROOFTOP DELIVERY',sub:'Gilbert, AZ  |  Late night',
 width:5200,groundY:410,theme:'gilbert_rooftops',spawn:{x:120,gap:50},music:'gilbert_2',
 pits:[[640,740],[1240,1350],[1900,2000],[2560,2700],[3300,3420],[3980,4090],[4500,4620]],
 platforms:[[440,330,120],[1130,320,90],[1280,280,40],[1700,320,140],[2600,300,60],[2850,320,140],[3360,290,50],[3600,330,140],[4300,300,120],[4540,290,60]],
 parts:[{id:'sun_chip',x:2640,y:215}],
 clues:[{x:1310,y:236,clue:3},{x:2910,y:276,clue:4},{x:4360,y:256,clue:5}],
 pizzas:[[1760,276],[3660,286]],
 coins:{n:30,x0:300,dx:160,jitter:30},
 coinList:[[690,320],[1295,250],[1950,330],[2630,250],[2670,330],[3360,250],[4035,330],[4560,250]],
 enemies:[{type:'walker',x:900},{type:'walker',x:1500},{type:'thrower',x:1600,cd:1.2,seed:31},{type:'walker',x:2200},{type:'dozer',x:2400,range:110},
  {type:'thrower',x:2950,cd:1.5,seed:32},{type:'walker',x:3100},{type:'walker',x:3700},{type:'thrower',x:3850,cd:1.1,seed:33},{type:'dozer',x:4250,range:90},{type:'walker',x:4800},{type:'walker',x:4900}],
 goalX:5060,goalLabel:'PIZZA DROP',
 intro:["Big order tonight: 6 pizzas for a rooftop party at the old bank. Weird place for a party.",
  "Sandy here. That 'party' is a hardhat lookout post. They are watching the Heritage District from up high.",
  "Run the rooftops, jump the gaps, and deliver that pizza. Fall between buildings and you lose a heart. Double jump the big gaps!"],
 introExpr:['happy','thinking','proud'],
 goal:'Cross the rooftops. Mind the gaps! Deliver the pizza at the far end.',
 winText:'PIZZA DELIVERED!',
 outro:{lines:["Nice tip. And look what fell out of the lookout's pocket: a radio.","RADIO: 'Courier, take the blueprints to the crane yard. Run if you see those agents.'","Then we'd better be faster than him. Next stop: the crane yard!"],expr:['smug','alarmed','proud']},
 reward:{base:130,perClue:50,perKill:5,tips:31}
};

// ---------- Mission 3: chase the courier through the crane yard. The camera keeps moving! ----------
LEVEL_DEFS[3]={
 id:3,title:'MISSION 3: CRANE YARD CHASE',sub:'Gilbert, AZ  |  Midnight',
 width:5600,groundY:410,theme:'gilbert_craneyard',spawn:{x:140,gap:50},music:'gilbert_3',bossMusic:'runner',
 autoscroll:{speed:62},
 platforms:[[600,340,140],[980,300,120],[1400,340,160],[1800,290,140],[2250,330,120],[2650,300,160],[3100,340,140],[3500,290,120],[3900,330,160],[4400,300,140],[4800,340,120]],
 clues:[{x:1060,y:256,clue:6},{x:2730,y:256,clue:7},{x:3560,y:246,clue:8}],
 pizzas:[[1460,296],[3150,296],[4460,256]],
 coins:{n:36,x0:300,dx:140,jitter:40},
 enemies:[{type:'walker',x:1300},{type:'walker',x:2000},{type:'thrower',x:2400,cd:1.3,seed:41},{type:'walker',x:2900},{type:'dozer',x:3300,range:120},{type:'walker',x:3800},{type:'thrower',x:4200,cd:1.2,seed:42},{type:'walker',x:4700}],
 boss:{type:'runner',x:900,trigger:420,hp:8,wallX:5420,lock:false,name:'THE COURIER',nameColor:'#7fd0ff',part:'turbo_coil'},
 intro:["There he is: the courier, with the stolen blueprints! He's heading through the crane yard.",
  "He's fast, and the crane yard keeps moving. Stay with the screen! He'll roll barrels at you, so punch them or jump them.",
  "You can't stop him while he runs. Chase him to the back fence, then he has nowhere to go."],
 introExpr:['alarmed','thinking','proud'],
 goal:'Chase the courier! Keep up with the screen.',
 winText:'COURIER CAUGHT!',
 unlockVehicle:'Scooter',
 outro:{lines:["Got the blueprints! And the courier's scooter. Finders keepers, agents. It's in your garage now.","These blueprints show tunnels under the old bank. And the courier had a key to the site office.","The answers are on Papa Johnny's computer. Time for some hacking."],expr:['happy','thinking','smug']},
 reward:{base:160,perClue:50,perKill:5,tips:18}
};

// ---------- Mission 4: hack the site office computer (puzzle mission, see hack.js) ----------
LEVEL_DEFS[4]={
 id:4,type:'hack',title:'MISSION 4: SITE OFFICE HACK',sub:'Gilbert, AZ  |  2 AM',theme:'gilbert_office',music:'gilbert_4',
 boards:[{cols:6,rows:4,time:75,seed:7,clue:9},{cols:7,rows:5,time:85,seed:21,clue:10},{cols:7,rows:5,time:90,seed:58,clue:11}],
 lives:3,part:{board:2,minTime:20,id:'camera_lens'},
 intro:["We're in the site office. Papa Johnny's computer has three locked files.",
  "Turn the circuit tiles so the power flows from the plug to the lock. Press attack or jump to turn a tile. Gadget turns it back.",
  "Beat the timer! If it runs out the alarm goes off. Three alarms and we have to run. In co-op you each get a cursor."],
 introExpr:['smug','thinking','proud'],
 goal:'Connect the power to the lock. 3 files to crack!',
 winText:'FILES HACKED!',
 outro:{lines:["Whoa. Fake permits, piles of cash, and a meeting tonight at the wrecking yard.","Papa Johnny is digging up old bank gold under Gilbert. That's what the night digging is about.","Gear up, agents. Next: the Wrecking Yard. Papa Johnny himself."],expr:['alarmed','thinking','proud']},
 reward:{base:150,perClue:60,perKill:0,tips:0}
};

// ---------- Mission 5: Papa Johnny's wrecking yard, the Gilbert boss ----------
LEVEL_DEFS[5]={
 id:5,title:"MISSION 5: PAPA JOHNNY'S WRECKING YARD",sub:'Gilbert, AZ  |  Midnight',
 width:3800,groundY:410,theme:'gilbert_wreckingyard',spawn:{x:120,gap:50},music:'gilbert_5',bossMusic:'papa_johnny_final',
 platforms:[[480,330,120],[820,290,140],[1200,330,120],[1550,290,140],[1900,330,140],[2250,300,120]],
 clues:[{x:890,y:246,clue:12},{x:1620,y:246,clue:13}],
 pizzas:[[1250,286],[2290,256],[2700,366]],
 coins:{n:22,x0:300,dx:120,jitter:30},
 enemies:[{type:'walker',x:700},{type:'thrower',x:1000,cd:1,seed:51},{type:'walker',x:1300},{type:'dozer',x:1700,range:130},{type:'walker',x:2000},{type:'thrower',x:2200,cd:1.4,seed:52},{type:'walker',x:2400}],
 boss:{type:'papa_johnny_final',x:3500,trigger:3000,hp:30,name:'PAPA JOHNNY',nameColor:'#ff9a3a',drop:14},dozerPart:'dozer_piston',
 intro:["The wrecking yard. Cranes, junk cars, and one very big guy with a gold tooth.",
  "Papa Johnny fights in three rounds. Jump his shockwaves. When bricks fall, watch for the shadows on the ground.",
  "When he gets mad he calls his crew and a bulldozer. Stay together, agents. This is it for Gilbert!"],
 introExpr:['thinking','proud','proud'],
 goal:'Get to Papa Johnny. Find the clues on the way!',
 winText:'PAPA JOHNNY IS DOWN!',
 outro:{lines:["Papa Johnny is caught, and the old bank gold goes back to Gilbert. Great work, agents!","He dropped a taxi card. 'Tony's Taxi, Downtown Phoenix.' Papa Johnny takes orders from someone in Downtown.","Gilbert is safe. Downtown Phoenix is next... and something tells me it's a lot bigger."],expr:['proud','thinking','smug']},
 reward:{base:250,perClue:50,perKill:5,tips:40}
};
