// ===== Downtown Phoenix, Mission 6: Taxi Blockade (v0.20) =====
// Side-scroll action on Michael's Sequence 49 street art: pizza patio + taxi stand (seg49_2), light rail stop (seg49_3),
// Downtown props (assets/kit/d49_*) on the seams, red stair-and-deck walkways as platforms.
// Far skylines for every city (assets/kit/far_<city>.jpg) and Tempe / Chandler / Tower street segments (seg50_*) are cut and listed
// in KIT_SEGS so those cities' first missions can use them the same way.
THEMES.downtown_night={
 bg(L){const c=L.cam,GY=L.gy,f=IMG['kit/far_downtown'];
  const g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#2a0f5a');g.addColorStop(.7,'#c2407a');g.addColorStop(1,'#ff9a40');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  if(f&&f.width){const w=GY*3,x=-((c*.15)%w);for(let k=0;k<3;k++)ctx.drawImage(f,x+k*w,0,w,GY);}
  ctx.fillStyle='#d9a582';ctx.fillRect(0,GY,W,H-GY);ctx.fillStyle='#8a3a5a';ctx.fillRect(0,GY,W,4);},
 platform(L,p,x){rrect(x,p[1],p[2],14,4,'#b03060','#12121e',2);}};
Object.assign(KIT_SEGS,{seg49_2:{g:.815,bot:'#e85a2a',ar:1.782},seg49_3:{g:.79,bot:'#b86a4c',ar:1.782},
 seg50_2:{g:.80,bot:'#d8582a',ar:1.82},seg50_4:{g:.80,bot:'#d6763c',ar:1.796},seg50_6:{g:.80,bot:'#e07030',ar:1.754}});
LEVEL_KITS.downtown_night={start:'seg49_2',mids:['seg49_3','seg49_2'],end:'seg49_3',
 seams:['d49_busstop','d49_palm','d49_newsbox','d49_cart','d49_meter','d49_dumpster'],seamH:[120,130,84,104,78,86],
 plat:{l:'d49_stair_l',m:'d49_deck',r:'d49_stair_r',mode:'box',rail:.3}};
['seg49_2','seg49_3','seg50_2','seg50_4','seg50_6','far_downtown','far_tempe','far_chandler','far_tower'].forEach(n=>ASSET_LIST.push(['kit/'+n,'assets/kit/'+n+'.jpg']));
['busstop','palm','newsbox','cart','meter','dumpster','stair_l','deck','stair_r','arrow','taxisign','scaffold'].forEach(n=>ASSET_LIST.push(['kit/d49_'+n,'assets/kit/d49_'+n+'.png']));
kitWrapTheme('downtown_night');

// ---------- music ----------
(function(){if(typeof registerSong!=='function')return;
 registerSong('downtown_1',{name:'Gridlock Groove',bpm:112,sw:2,key:5,sc:1,pr:0,kit:1,bi:1,ci:2,li:3,pad:1,skin:3,
  k:'x.....x...x.....',s:'....x.......x..x',c:'..........x.....',h:'x.x.x.xxx.x.x.xx',O:'......x.......x.',p:'..x...x...x...x.',
  bass:'1.1.5.1.4.4..5.6',ch:'..x...x...x.x...',lead:'e.g.h...g.e.d...'+'e.g.h.j.h...g...'+'e.g.h...g.e.d.c.'+'d...e...g...e...'});
 TR.downtown_1.title='Gridlock Groove';TR.downtown_1.desc='Downtown at night: honking taxis, a funky bassline and a light rail ding.';
 if(typeof MUSIC_LIST!=='undefined')MUSIC_LIST.push({name:'downtown_1',title:TR.downtown_1.title,desc:TR.downtown_1.desc});})();

// ---------- clues + level ----------
const DT_CLUE0=CLUES.length;
CLUES.push({lvl:6,name:'Taxi Dispatch Log',text:'Every night at 11: "pickup at the old bank, Gilbert." The taxis drove the gold away!'},
 {lvl:6,name:'Horn Repair Bill',text:'47 car horns repaired this month. Signed: H. Tony. Somebody honks A LOT.'},
 {lvl:6,name:'Purple Business Card',text:'A heavy purple card with gold letters: just "B.B.B." and a drawing of a tower.'});
const _L6dt=LEVELS.find(l=>l.id===6);
if(_L6dt)Object.assign(_L6dt,{name:'Taxi Blockade',kind:'action',icon:'available',blurb:"Honky Tony's taxis have blocked off Downtown. Get through the barricades to his taxi depot."});
LEVEL_CODES.TAXICAB=6;
LEVEL_DEFS[6]={
 id:6,title:'MISSION 6: TAXI BLOCKADE',sub:'Downtown Phoenix  |  Night',
 width:5000,groundY:410,theme:'downtown_night',spawn:{x:120,gap:50},music:'downtown_1',
 platforms:[[520,320,150],[900,290,130],[1300,330,150],[1700,280,160],[2100,320,140],[2500,290,170],[2950,330,140],[3350,280,160],[3800,320,150],[4200,290,140]],
 clues:[{x:975,y:246,clue:DT_CLUE0},{x:2585,y:246,clue:DT_CLUE0+1},{x:4270,y:246,clue:DT_CLUE0+2}],
 pizzas:[[1780,236],[3420,236]],
 coins:{n:36,x0:300,dx:128,jitter:40},
 enemies:[{type:'walker',x:750},{type:'walker',x:1150},{type:'thrower',x:1450,cd:1.2,seed:61},{type:'walker',x:1650},{type:'walker',x:2000},
  {type:'thrower',x:2300,cd:1.4,seed:62},{type:'walker',x:2700},{type:'walker',x:2850},{type:'thrower',x:3200,cd:1.1,seed:63},
  {type:'walker',x:3600},{type:'walker',x:3700},{type:'thrower',x:4000,cd:1.3,seed:64},{type:'walker',x:4400},{type:'walker',x:4550}],
 goalX:4860,goalLabel:'TAXI DEPOT',
 intro:["Welcome to Downtown Phoenix, agents. That phone from Papa Johnny called a number down here.",
  "Sandy here. The number belongs to a taxi company run by Honky Tony. His taxis have blocked off the whole street.",
  "Some of Papa Johnny's old crew work for him now. Get past them and reach the taxi depot at the end of the street. Find 3 clues!"],
 introExpr:['happy','thinking','proud'],
 goal:'Get through the blockade to the taxi depot. Find 3 clues!',
 winText:'BLOCKADE BUSTED!',
 outro:{lines:["The depot is empty. Just a horn on the desk, still warm.","That purple card... B.B.B. Papa Johnny and Honky Tony both work for the same person.","Whoever B.B.B. is, they live in a tower. Let's keep digging, agents."],expr:['thinking','alarmed','proud']},
 reward:{base:150,perClue:50,perKill:5,tips:35}
};
