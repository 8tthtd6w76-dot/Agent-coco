// ===== Lair Defense data (v0.47): towers, agents, fortress upgrades, specials, enemies, nights, maps =====
// Design: design/new_modes_lair_defense_heist_spec.md. Art prompts: prompts/lair_defense_art_prompts.md (Seq 84-108).
// Everything is code-drawn until Michael's sheets arrive (hooks: ldArt(kind,id,...) in lair_defense.js returns false when missing).
// SAVE.ld = {stars:{night:0-3}, best:{night:score}, endless:{map:[{s,w,who}]}, estars:{map:n}, unlock:{id:1}, res:{id:0-3},
//            fort:{id:0-3}, spent:n}
// Stars unlock things for good (Michael: "both"); main-game cash ($ SAVE.coins) + crafting parts buy research and fortress levels too.

// ---------- GUNS (towers). kind: shot | splash | pulse | slow | pull | bubble | smoke | chain | beam | hamster | arrow | freeze | water
// dmg per hit, rate = shots per second, range px, air = can hit flyers, star = stars to unlock (0 = starts unlocked)
const LD_GUNS=[
 {id:'pizza',  n:'Pizza Launcher',  kind:'shot',   cost:60, dmg:5,  rate:1.1, range:92, air:0,col:'#e8483a',star:0,d:'Lobs hot slices at the goon in front. Good all-rounder.'},
 {id:'minigun',n:'Gumball Minigun', kind:'shot',   cost:95, dmg:1.6,rate:6,   range:84, air:1,col:'#ff6ad5',star:1,d:'Spins up and sprays gumballs. Hits flyers too.'},
 {id:'bow',    n:'Block Bow',       kind:'arrow',  cost:80, dmg:7,  rate:.8,  range:130,air:1,col:'#c58a3a',star:1,d:'A chunky blocky bow. Long range, arrows pierce 2 goons.'},
 {id:'water',  n:'Water Cannon',    kind:'water',  cost:80, dmg:3,  rate:.9,  range:88, air:0,col:'#3a8ef0',star:1,d:'Blasts goons back down the path.'},
 {id:'foam',   n:'Foam Sprinkler',  kind:'slow',   cost:70, dmg:.6, rate:1.4, range:70, air:0,col:'#f2f2ff',star:0,d:'Sticky foam slows every goon nearby. Flyers fly over it.'},
 {id:'bubble', n:'Bubble Blaster',  kind:'bubble', cost:110,dmg:2,  rate:.45, range:96, air:1,col:'#9fe8ff',star:1,d:'Traps one goon in a bubble for a few seconds.'},
 {id:'bass',   n:'Bass Speaker',    kind:'pulse',  cost:120,dmg:4,  rate:.75, range:72, air:0,col:'#7a4af0',star:0,d:'Thump! Hits everyone nearby on the beat.'},
 {id:'magnet', n:'Magnet Coil',     kind:'pull',   cost:130,dmg:2,  rate:.5,  range:80, air:1,col:'#d9822b',star:2,d:'Yanks gold chains and pulls goons backwards. +1 cash per KO nearby.'},
 {id:'smoke',  n:'Smoke Popper',    kind:'smoke',  cost:140,dmg:1,  rate:.33, range:78, air:0,col:'#a06ad8',star:2,d:'Purple confusion cloud. Goons walk the wrong way.'},
 {id:'freeze', n:'Freeze Ray',      kind:'freeze', cost:150,dmg:3,  rate:.6,  range:96, air:1,col:'#7fdfff',star:2,d:'Freezes one goon solid. Frozen goons take extra damage.'},
 {id:'tesla',  n:'Tesla Coil',      kind:'chain',  cost:170,dmg:5,  rate:.8,  range:90, air:1,col:'#2de2f5',star:2,d:'Zap jumps between 3 goons (4 at level 3, 5 at max).'},
 {id:'laser',  n:'Laser Turret',    kind:'beam',   cost:200,dmg:9,  rate:1,   range:110,air:1,col:'#3affd8',star:3,d:'Locks on with a steady cyan beam. Melts tanks and robots.'},
 {id:'rocket', n:'Confetti Rockets',kind:'splash', cost:220,dmg:9,  rate:.55, range:120,air:1,col:'#ffd23a',star:3,d:'Party rockets that burst on a whole group.'},
 {id:'hamster',n:'Hamster Ray',     kind:'hamster',cost:300,dmg:3,  rate:.35, range:100,air:1,col:'#ffb36a',star:4,d:'Rare one-shot: a hit can turn a goon into a hamster (not bosses).'}];

// ---------- DEFENSE AGENTS. Placed on a pad like a tower, one of each at a time. move: how the unit gets around.
const LD_AGENTS=[
 {id:'coco', n:'Agent Coco',  kind:'yoyo',  cost:150,dmg:6, rate:.9, range:96, air:1,col:'#2d6ae0',star:0,d:'Gadget yo-yo: stuns the goon it hits and bounces to one more.'},
 {id:'sisi', n:'Agent Sisi',  kind:'kick',  cost:150,dmg:10,rate:.7, range:62, air:0,col:'#e04ac8',star:1,d:'Cartwheel kick: big hit and knockback all around her.'},
 {id:'sandy',n:'Sandy',       kind:'scan',  cost:180,dmg:3, rate:1,  range:110,air:1,col:'#e9eef5',star:2,d:'Reveals sneaky goons and makes towers near her shoot 25% faster.'},
 {id:'barro',n:'Barro',       kind:'net',   cost:120,dmg:3, rate:.5, range:100,air:0,col:'#fff2dc',star:1,d:'Dough net: slows a goon a lot. Even slows bosses.'},
 {id:'hover',n:'Hover Drone', kind:'hover', cost:200,dmg:4, rate:1.6,range:80, air:1,col:'#bfe9ff',star:2,d:'Flies circles around its pad, shoots anything and sees sneaks.'},
 {id:'swarm',n:'Drone Swarm', kind:'swarm', cost:240,dmg:4, rate:1,  range:130,air:1,col:'#8fd3ff',star:2,d:'Three tiny drones that dive at goons all over their zone.'},
 {id:'robo', n:'Robo Guard',  kind:'robo',  cost:220,dmg:7, rate:1,  range:90, air:0,col:'#c7d0dc',star:2,d:'Walks onto the path and holds goons back with big mitts.'},
 {id:'tank', n:'RC Tank',     kind:'tank',  cost:280,dmg:11,rate:.6, range:110,air:0,col:'#4a8a4a',star:3,d:'Rolls up and down the path firing splash shells.'},
 {id:'jet',  n:'Sky Jet',     kind:'jet',   cost:320,dmg:14,rate:.22,range:999,air:1,col:'#e9f4ff',star:3,d:'Strafing runs across the whole map. Hits every goon on its line.'},
 {id:'mech', n:'Mega Mech',   kind:'mech',  cost:420,dmg:26,rate:.4, range:84, air:0,col:'#2de2f5',star:4,d:'Sandy in a giant robot suit. Stomp! Huge hit and stun.'}];

// ---------- FORTRESS / ARMOR / REINFORCEMENT (bought in the Workshop between nights, levels 1-3)
const LD_FORT=[
 {id:'door',   n:'Reinforced Door', d:'+5 Lair health per level.'},
 {id:'shield', n:'Core Shield',     d:'Blocks the first 3 / 6 / 10 hits every night.'},
 {id:'repair', n:'Auto-Repair Bots',d:'Heal 1 / 2 / 3 Lair health after every wave.'},
 {id:'walls',  n:'Wall Armor',      d:'Big goons (brutes, tanks, bosses) do 1 less damage per level.'},
 {id:'lookout',n:'Lookout Tower',   d:'+6% range for every tower and agent per level.'},
 {id:'power',  n:'Power Generator', d:'+8% fire rate for every tower and agent per level.'},
 {id:'ammo',   n:'Ammo Crates',     d:'+8% damage for every tower and agent per level.'},
 {id:'plating',n:'Tower Plating',   d:'33% / 66% / 100% chance to shrug off hacks, bricks, nets and pops.'},
 {id:'radar',  n:'Radar Dish',      d:'Towers near the Lair see sneaks. Level 3: every tower sees them.'},
 {id:'traps',  n:'Tripwire Traps',  d:'The first stretch of path hurts and slows goons that cross it.'},
 {id:'shutter',n:'Skylight Shutters',d:'On the Lair map, goons from the skylight are 20% / 35% / 50% slower.'},
 {id:'tipjar', n:'Tip Jar',         d:'+10% cash for every KO per level.'},
 {id:'bank',   n:'Starter Cash',    d:'+50 starting cash per level, for each player.'},
 {id:'fridge', n:'Pizza Fridge',    d:'Special attacks recharge 15% faster per level.'}];

// ---------- SPECIAL ATTACKS (shared cooldowns; X picks one, Y fires it at your cursor)
const LD_SPECIALS=[
 {id:'rain',  n:'Pizza Rain',       cd:24, star:0,col:'#e8483a',aim:1,d:'Pizzas rain down on a circle around your cursor.'},
 {id:'emp',   n:'Sandy EMP',        cd:40, star:2,col:'#2de2f5',aim:0,d:'Stuns every goon on the map. Fries drones, robots and jets.'},
 {id:'ice',   n:'Freeze Blast',     cd:34, star:2,col:'#9fe8ff',aim:1,d:'Freezes everything in a big circle for 4 seconds.'},
 {id:'drop',  n:'Big Bass Drop',    cd:48, star:2,col:'#7a4af0',aim:0,d:'One giant thump that hits every goon on the map.'},
 {id:'butt',  n:'Atomic Butt Bomb', cd:80, star:4,col:'#ff8a1a',aim:0,d:'Michael Henry (Agent Coco) jetpacks off his perch, pulls his knees up and butt-slams up to 12 goons. One hit KOs everything, bosses too!'}];

// ---------- ENEMIES. hp, spd px/s, cash bounty, dmg to the Lair, threat = wave budget cost.
// art: which placeholder draws it. air: flies a straight line (only towers with air hit it).
const LD_FOES={
 walker:  {n:'Walker',       hp:9,  spd:38, cash:5, dmg:1,threat:1,  art:'walker'},
 runner:  {n:'Runner',       hp:6,  spd:78, cash:5, dmg:1,threat:1.1,art:'meatball'},
 thrower: {n:'Brick Tosser', hp:10, spd:34, cash:7, dmg:1,threat:1.6,art:'thrower',brick:1},
 scorpion:{n:'Scorpion',     hp:5,  spd:66, cash:3, dmg:1,threat:.6, art:'scorpion',pack:3,armor:1},
 snake:   {n:'Rattler',      hp:8,  spd:50, cash:4, dmg:1,threat:.9, art:'snake',burst:1},
 blockhead:{n:'Box Head',   hp:14, spd:24, cash:5, dmg:1,threat:1.2,art:'blockhead',pack:4,regen:.02},
 fizzer:  {n:'Soda Fizzer',       hp:9,  spd:46, cash:8, dmg:1,threat:2,  art:'fizzer',fizz:1},
 gloom:   {n:'Shadow Coat', hp:22, spd:36, cash:12,dmg:2,threat:3,  art:'gloom',blink:1},
 sneak:   {n:'Sneak',        hp:10, spd:48, cash:9, dmg:1,threat:2,  art:'sneak',sneak:1},
 techie:  {n:'Techie',       hp:13, spd:36, cash:10,dmg:1,threat:2.5,art:'techie',hack:1},
 brute:   {n:'Brute',        hp:42, spd:22, cash:14,dmg:2,threat:4,  art:'brute',armor:3,big:1},
 chute:   {n:'Parachuter',   hp:10, spd:40, cash:6, dmg:1,threat:1.5,art:'chute',chute:1},
 balloon: {n:'Balloon Goon', hp:30, spd:20, cash:14,dmg:1,threat:4,  art:'balloon',air:1,drops:'chute'},
 flyer:   {n:'Hoverboarder', hp:12, spd:56, cash:9, dmg:1,threat:2,  art:'flyer',air:1},
 gdrone:  {n:'Goon Drone',   hp:6,  spd:70, cash:4, dmg:1,threat:1.4,art:'gdrone',air:1,pack:3,machine:1},
 jet:     {n:'Jet Goon',     hp:16, spd:96, cash:12,dmg:1,threat:3,  art:'jet',air:1,machine:1},
 robo:    {n:'Robo Goon',    hp:40, spd:30, cash:14,dmg:2,threat:4,  art:'robo',armor:2,machine:1,split:'minibot',big:1},
 minibot: {n:'Mini Bot',     hp:10, spd:44, cash:3, dmg:1,threat:1,  art:'minibot',machine:1},
 gtank:   {n:'Goon Tank',    hp:110,spd:16, cash:30,dmg:3,threat:7,  art:'gtank',armor:5,machine:1,split:'walker',big:1},
 crab:    {n:'Pinchy Crab',  hp:8,  spd:44, cash:4, dmg:1,threat:.8, art:'crab',pack:2,armor:1},
 redbelt: {n:'Red Belt',     hp:18, spd:42, cash:9, dmg:1,threat:2,  art:'karate_red',guard:1},
 pinkbelt:{n:'Pink Belt',    hp:14, spd:58, cash:9, dmg:1,threat:2,  art:'karate_pink',guard:1},
 cart:    {n:'Cart Bruiser', hp:34, spd:28, cash:12,dmg:2,threat:3.2,art:'cart',armor:2,big:1},
 spider:  {n:'Desert Spider',hp:7,  spd:60, cash:4, dmg:1,threat:.8, art:'spider',pack:3},
 // bosses
 lefty:   {n:'Lefty',        hp:320,spd:20, cash:80, dmg:10,threat:0,art:'lefty',boss:1,net:1,big:1},
 baron:   {n:'Baron Blowhard',hp:420,spd:14,cash:100,dmg:10,threat:0,art:'baron',boss:1,air:1,dropper:1,big:1},
 knuckles:{n:'Knuckles',     hp:600,spd:16, cash:120,dmg:12,threat:0,art:'knuckles',boss:1,slam:1,armor:4,big:1},
 baldey:  {n:'Bigg Buff Baldey',hp:1500,spd:11,cash:300,dmg:99,threat:0,art:'baldey',boss:1,armor:3,summon:1,big:1}};

// ---------- MAPS (640x480, play area y 40..444). paths: lists of points; a later path can join an earlier one ("join":[path,index]).
const LD_MAPS=[
 {id:0,n:'The Alley',theme:'alley',end:'ladder',img:'ld/map_alley',perch:[575,92],pads:[[295, 175], [397, 165], [493, 168], [353, 237], [458, 237], [262, 272], [355, 280], [447, 280], [138, 282], [553, 315], [170, 422], [319, 425], [474, 423]],
  paths:[[[60, 388], [470, 388], [505, 378], [520, 352], [505, 325], [470, 316], [230, 316], [195, 300], [178, 270], [190, 238], [225, 218], [300, 210], [540, 205], [570, 192], [585, 172]]]},
 {id:1,n:'Barro\'s Rooftop',theme:'roof',end:'door',img:'ld/map_roof',perch:[420,74],pads:[[253, 142], [370, 145], [97, 185], [200, 197], [490, 204], [408, 241], [178, 256], [504, 284], [88, 311], [205, 316], [393, 331], [217, 390], [442, 393]],
  paths:[[[368, 486], [368, 400], [355, 368], [320, 348], [230, 335], [160, 320], [130, 300], [140, 282], [180, 280], [400, 280], [465, 270], [482, 252], [465, 228], [400, 218], [200, 216], [140, 205], [128, 182], [150, 165], [230, 160], [290, 152], [310, 138], [312, 118]]]},
 {id:2,n:'Inside the Lair',theme:'lair',end:'core',img:'ld/map_lair',perch:[560,150],skylight:1,pads:[[112, 190], [225, 180], [352, 180], [474, 172], [192, 246], [348, 242], [140, 300], [242, 294], [474, 298], [376, 330], [437, 388], [126, 412], [241, 412], [350, 407]],
  paths:[[[10, 316], [60, 318], [85, 330], [105, 355], [130, 366], [240, 366], [280, 356], [295, 330], [300, 300], [320, 280], [360, 272], [395, 255], [420, 232], [450, 220], [505, 224]], [[288, 120], [288, 150], [288, 240], [300, 278], [320, 280], [360, 272], [395, 255], [420, 232], [450, 220], [505, 224]]]}];
// Michael's painted maps (assets/ld/map_*.jpg) carry their own path and pads; the numbers above were traced from them.
// Without the image the game paints a code map over the same path (ld_draw.js ldBgCanvas).

// ---------- NIGHTS: map, pool of goons (with weights), waves, boss, twist. Varied on purpose (Michael: "diverse and exciting").
const LD_NIGHTS=[
 {n:1, map:0,name:'First Knock',     waves:8, pool:{walker:5,runner:2},                       twist:'',intro:'Baldey\'s crew found the alley behind Barro\'s. Build towers on the round pads!'},
 {n:2, map:0,name:'Desert Critters', waves:9, pool:{scorpion:4,snake:3,crab:3,spider:3,walker:1,runner:1},      twist:'swarm',intro:'Somebody dumped a crate of scorpions, rattlers, spiders and pinchy crabs in the alley. They come in packs!'},
 {n:3, map:0,name:'Sky Drop',        waves:10,pool:{chute:4,thrower:2,walker:2,balloon:1,cart:1},      twist:'',intro:'Parachuters drop in anywhere on the path, and balloon goons float over the roofs.'},
 {n:4, map:1,name:'Lefty\'s Net',    waves:10,pool:{techie:2,sneak:2,walker:2,redbelt:2,pinkbelt:2,thrower:1},boss:'lefty',twist:'',intro:'On the roof now. Techies hack towers, Sneaks go see-through and the Belts block every third hit. Lefty brings his big net.'},
 {n:5, map:1,name:'Block Party',     waves:10,pool:{blockhead:5,fizzer:2,runner:1},             twist:'horde',intro:'A box-headed horde shuffles up the fire escape. Watch out for Fizzers: they pop and jam towers!'},
 {n:6, map:1,name:'Balloon Fiesta',  waves:11,pool:{balloon:2,flyer:3,chute:3,gdrone:2,jet:1},  boss:'baron',twist:'sky',intro:'Baron Blowhard followed you home from Albuquerque. Almost everything flies tonight!'},
 {n:7, map:1,name:'Knuckle Up',      waves:11,pool:{brute:3,cart:2,robo:2,gtank:1,redbelt:2,pinkbelt:1,thrower:2}, boss:'knuckles',twist:'',intro:'Heavy armor night: brutes, robots and a goon tank. Knuckles slams the roof and stuns towers.'},
 {n:8, map:2,name:'Lights Out',      waves:11,pool:{gloom:3,sneak:3,fizzer:2,blockhead:2,spider:2},      twist:'dark',intro:'They cut the power in the Lair! Towers see less in the dark. Shadow Coats blink forward when hit, and spiders skitter in the dark.'},
 {n:9, map:2,name:'Machine Mayhem',  waves:12,pool:{gdrone:3,jet:2,robo:2,gtank:1,techie:2,minibot:2},twist:'',intro:'Baldey sends the machines: drones, jets, robots and tanks, through the door AND the skylight.'},
 {n:10,map:2,name:'Bigg Buff Baldey',waves:12,pool:{walker:2,runner:2,brute:2,cart:1,robo:1,gloom:1,fizzer:1,balloon:1,jet:1,scorpion:2,snake:1,chute:2,crab:2,redbelt:1,pinkbelt:1},boss:'baldey',twist:'',intro:'This is it. Bigg Buff Baldey himself, with every goon he has. Protect Sandy\'s core!'}];
const LD_NIGHT_CODES={2:'ALLEYCAT',3:'SKYDROP',4:'ROOFRAID',5:'BLOCKPARTY',6:'HOTAIRBALL',7:'KNUCKLEUP',8:'LIGHTSOUT',9:'MACHINES',10:'BALDEYBASH'};
// endless: every 10 waves a boss in this order
const LD_ENDLESS_BOSSES=['lefty','baron','knuckles','baldey'];
const LD_ENDLESS_POOL=[{walker:4,runner:2,scorpion:2,snake:2,crab:2,spider:2},{chute:2,thrower:2,blockhead:2,fizzer:1,redbelt:1,pinkbelt:1},{techie:2,sneak:2,flyer:2,balloon:1},
 {brute:2,cart:1,robo:1,gdrone:2,gloom:1},{jet:1,gtank:1,robo:1,gloom:2,fizzer:2}];

// ---------- save helpers
function ldSave(){SAVE.ld=SAVE.ld||{};const L=SAVE.ld;for(const k of ['stars','best','endless','estars','unlock','res','fort'])L[k]=L[k]||{};L.spent=L.spent||0;return L;}
function ldStarsTotal(){const L=ldSave();let n=0;for(const k in L.stars)n+=L.stars[k]||0;for(const k in L.estars)n+=L.estars[k]||0;return n;}
function ldStarsFree(){return ldStarsTotal()-ldSave().spent;}
function ldUnlocked(it){return !it.star||SAVE.testing||!!ldSave().unlock[it.id]||(it.id==='butt'&&typeof ownsCheat==='function'&&ownsCheat('buttbomb'));}
function ldFort(id){return SAVE.testing&&!ldSave().fort[id]?0:(ldSave().fort[id]||0);}
function ldRes(id){return ldSave().res[id]||0;}
function ldNightOpen(n){const L=ldSave();return n===1||SAVE.testing||!!L.stars[n-1]||!!L.unlock['night'+n];}
function ldMapOpen(m){const first=LD_NIGHTS.find(x=>x.map===m).n;return SAVE.testing||!!ldSave().stars[first];}
function ldUnit(id){return LD_GUNS.find(x=>x.id===id)||LD_AGENTS.find(x=>x.id===id);}
