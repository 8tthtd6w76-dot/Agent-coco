// ===== City missions (v0.24): fills the "Coming soon" pins in Downtown, Tempe, Chandler and Baldey's Tower =====
// Uses every play style: Overhead stealth (stealth.js), Scooter pursuit (pursuit.js), Hack puzzle (hack.js),
// and the three new v0.24 modes: Wire Cut (wirecut.js), Lockpick Groove (lockpick.js), Code Drop (codedrop.js).
// Still "Coming soon" on purpose: the 4 bosses (dt5, tp5, ch5, tw4), Tempe 7 and Chandler 8 (side-scrollers, need street art), tw2.
// ADDING ANOTHER: fill('<pin id>',{name,kind,req,bonus,blurb,code},{...LEVEL_DEFS fields}). Clues: cl(id,[[name,text],...]) returns clue0.
// Every mission has its own groove (TR key 'cm_<id>'), listed in the Music Room.

// ---------- route the new modes ----------
const _startLevelCM=startLevel;
startLevel=function(l){const def=LEVEL_DEFS[l.id];
 if(def&&def.type==='wirecut'){go(makeWireCut(def,NPLAYERS));return;}
 if(def&&def.type==='lockpick'){go(makeLockpick(def,NPLAYERS));return;}
 if(def&&def.type==='codedrop'){go(makeCodeDrop(def,NPLAYERS));return;}
 if(def&&def.type==='gauntlet'){go(makeGauntlet(def,NPLAYERS,0,[]));return;}
 return _startLevelCM.apply(this,arguments);};
KINDS.lockpick={label:'Lockpick Groove',icon:'puzzle'};
KINDS.codedrop={label:'Code Drop',icon:'hacking_chip'};

// ---------- helpers ----------
function cl(id,list){const c0=CLUES.length;list.forEach(([name,text])=>CLUES.push({lvl:id,name,text}));return c0;}
function fill(id,pin,def){const l=LEVELS.find(x=>x.id===id);if(!l)return;delete l.planned;
 Object.assign(l,{name:pin.name,kind:pin.kind,req:pin.req,blurb:pin.blurb,bonus:pin.bonus?1:0});if(pin.bonus)l.after=pin.req;
 if(pin.code)LEVEL_CODES[pin.code]=id;LEVEL_DEFS[id]=Object.assign({id},def);}
// Stealth floor transforms, so the vault's tested floor plans become new buildings (all tiles stay reachable)
const ST_VAULT=LEVEL_DEFS[9].floors;
function stX(F,mode,name,spd){const fh=mode==='rot'||mode==='h',fv=mode==='rot'||mode==='v';
 const map=(fv?[...F.map].reverse():[...F.map]).map(r=>fh?[...r].reverse().join(''):r);
 const P=([c,r])=>[fh?19-c:c,fv?13-r:r],Q=([x,y])=>[fh?20-x:x,fv?14-y:y];
 const ang=a=>fh&&fv?a+Math.PI:fh?Math.PI-a:fv?-a:a;
 return {name,map,guards:F.guards.map(g=>({path:g.path.map(P),sp:Math.round(g.sp*(spd||1))})),
  cams:F.cams.map(c=>{const [x,y]=Q([c.x,c.y]);return Object.assign({},c,{x,y,a:ang(c.a)});}),
  lasers:F.lasers.map(z=>Object.assign({},z,{a:Q(z.a),b:Q(z.b)}))};}
function track(key,title,desc,T){TR[key]=Object.assign({title,desc},T);if(typeof MUSIC_LIST!=='undefined')MUSIC_LIST.push({name:key,title,desc});}

// ---------- music: one groove per mission ----------
track('cm_dt2','Dispatch Creep','Dispatch Garage. Late-night tiptoe funk: rimshots, a muted wah and a radio-static honk.',
 {bpm:96,swing:.18,prog:[['C','m9'],['C','m9'],['Ab','maj7'],['G','7s9'],['C','m9'],['F','9'],['Ab','maj7'],['G','7s9']],
  drums:{A:dr(DR.sneak,{n:'..............x.'}),F:DR.sneakF},dseq:'AAAF',bassI:'sub',
  bass:['0-..o..0..7.a.o.','0-..o..0..7.3.5.','0-..o..0..7.a.o.','0-..o.x0..4.7.a.'],
  comp:[{i:'wah',h:'..x...x...x.x...',v:.5},{i:'ep',h:'x-......x-......',v:.4}],
  lead:{i:'theremin',at:4,mel:'G4/2 C5/2 Eb5/4 D5/2 C5/2 G4/4  Ab4/2 C5/2 F5/4 Eb5/8  G4/2 C5/2 Eb5/4 G5/2 F5/2 Eb5/4  D5/4 B4/4 G4/8'}});
track('cm_dt3','Night Fare','Taxi tail through Downtown. Fast cop-show strut: clav, brass stabs and honks on the off-beat.',
 {bpm:118,swing:.12,prog:[['E','m9'],['E','m9'],['A','9'],['A','9'],['E','m9'],['C','maj7'],['B','7s9'],['B','7s9']],
  drums:{A:dr(DR.drive,{n:'......x.......x.'}),F:DR.driveF},dseq:'AAAF',
  bass:['0.o.0.7.a.0.o.7.','0.o.0.7.a.0.3.5.','0.o.0.7.a.0.o.7.','0.o.0x7.a.4.5.7.'],
  comp:[{i:'clav',h:'..x.g.x...x.g.x.',v:.65},{i:'stab',o:12,h:['........x..x....','................']}],
  lead:{i:'brass',at:4,mel:'B4/2 D5/2 E5/4 G5/2 F#5/2 E5/4  D5/2 B4/2 A4/4 B4/8  E5/2 G5/2 B5/4 A5/2 G5/2 E5/4  D#5/4 F#5/4 B5/8'}});
track('cm_dt4','Meter Maid Mainframe','Taxi meter server hack. Bleepy dispatch-radio funk with a bell arpeggio.',
 {bpm:102,swing:.1,prog:[['D','m9'],['D','m9'],['Bb','maj7'],['C','9'],['D','m9'],['G','9'],['Bb','maj7'],['A','7s9']],
  drums:{A:dr(DR.pocket,{g:'..x.......x.....'}),F:DR.pocketF},dseq:'AAAF',bassI:'synth',
  bass:['0..o.0..7.0.a.o.','0..o.0..7.0.3.5.','0..o.0..7.0.a.o.','0..o.x..4.0.7.o.'],
  comp:[{i:'arp',a:'bell',h:'x.x.x.x.x.x.x.x.',v:.45},{i:'ep',h:'..x-......x-....',v:.4}],
  lead:{i:'synth',at:4,mel:'A4/2 D5/2 F5/2 A5/2 G5/4 F5/4  E5/2 D5/2 C5/4 D5/8  F5/2 A5/2 C6/4 Bb5/2 A5/2 G5/4  E5/4 C#5/4 A4/8'}});
track('cm_dtb','Honk Bomb Hustle','Wire Cut bonus. Ticking-clock funk: a shaker tick, slap bass and horn hits that get louder.',
 {bpm:110,swing:.14,prog:[['F','m9'],['F','m9'],['Db','maj7'],['C','7s9'],['F','m9'],['Bb','9'],['Db','maj7'],['C','7b9']],
  drums:{A:dr(DR.pocket,{t:'x.x.x.x.x.x.x.x.',n:'x...............'}),F:dr(DR.pocketF,{t:'x.x.x.x.x.x.x.x.'})},dseq:'AAAF',
  bass:['0-.o..0.7.a.o.7.','0-.o..0.3.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],
  comp:[{i:'stab',o:12,h:'....x.......x...',v:.55},{i:'wah',h:'..x-x...x-x.x...',v:.5}],
  lead:{i:'brass',at:4,mel:'C5/2 Eb5/2 F5/4 Ab5/2 G5/2 F5/4  Eb5/2 C5/2 Bb4/4 C5/8  F5/2 Ab5/2 C6/4 Bb5/2 Ab5/2 G5/4  E5/4 G5/4 C6/8'}});
track('cm_tp2','Sort It Out','Recycling plant stealth. Conveyor-belt groove: can-lid backbeat, tuba bass, sneaky organ.',
 {bpm:92,swing:.2,prog:[['A','m7'],['A','m7'],['D','9'],['D','9'],['A','m7'],['F','maj7'],['E','7s9'],['E','7s9']],
  drums:{A:{k:'X.......x.x.....',s:'........X......g',h:'x.o.x.o.x.ooxo.o',l:'...x.......x....'},F:dr(DR.sneakF,{l:'x.....x.........'})},dseq:'AAAF',bassI:'tuba',
  bass:['0-.7-.o-.7-.4.5.','0-.7-.o-.7-.a.9.','0-.7-.o-.7-.4.3.','0-.7-.o.x7..4.2.'],
  comp:[{i:'organ',h:'....x-......x-..',v:.45}],
  lead:{i:'whistle',at:4,mel:'E5/2 A5/2 C6/4 B5/2 A5/2 E5/4  F#5/2 A5/2 D6/4 C6/8  E5/2 A5/2 C6/4 E6/2 D6/2 C6/4  B5/4 G#5/4 E5/8'}});
track('cm_tp3','Trash Dash','Garbage truck pursuit. Speedy second-line: tuba runs, trash-can drums, a brass hook.',
 {bpm:124,swing:.1,prog:[['G','7'],['C','9'],['G','7'],['D','9'],['G','7'],['C','9'],['D','9'],['G','7']],
  drums:{A:dr(DR.drive,{l:'..x...x...x...x.'}),F:dr(DR.driveF,{l:'x.x.x.x.........'})},dseq:'AAAF',bassI:'tuba',
  bass:['0.4.7.o.7.4.0.4.','0.4.7.o.a.9.7.5.','0.4.7.o.7.4.0.4.','0.4.7xo.7.5.4.2.'],
  comp:[{i:'stab',o:12,h:'..x...x...x...x.',v:.5},{i:'organ',h:'x-......x-......',v:.35}],
  lead:{i:'brass',at:4,mel:'D5/2 G5/2 B5/4 A5/2 G5/2 D5/4  E5/2 G5/2 C6/4 B5/8  D5/2 G5/2 B5/4 D6/2 C6/2 A5/4  F#5/4 A5/4 G5/8'}});
track('cm_tpb','Route Planner Rumble','Tempe route hack. Chunky robot second-line with a whistled melody.',
 {bpm:100,swing:.16,prog:[['Bb','9'],['Bb','9'],['Eb','9'],['Eb','9'],['Bb','9'],['G','m9'],['C','m9'],['F','13']],
  drums:{A:dr(DR.lounge,{l:'......x.......x.'}),F:DR.loungeF},dseq:'AAAF',bassI:'synth',
  bass:['0..o.0o.7.0.a.o.','0..o.0o.7.0.3.5.','0..o.0o.7.0.b.o.','0..o.xo.4.7.a.o.'],
  comp:[{i:'clav',h:'..x...x...x.x...',v:.5},{i:'arp',a:'bell',h:'x...x...x...x...',v:.35}],
  lead:{i:'whistle',at:4,mel:'D5/2 F5/2 Bb5/4 A5/2 F5/2 D5/4  Eb5/2 G5/2 Bb5/4 G5/8  D5/2 F5/2 Bb5/4 D6/2 C6/2 Bb5/4  A5/4 C6/4 Bb5/8'}});
track('cm_ch2','Firewall Funk','Chandler firewall hack. Glitchy robot funk with rubber synth bass.',
 {bpm:106,swing:.06,prog:[['F#','m9'],['F#','m9'],['D','maj7'],['E','9'],['F#','m9'],['B','m9'],['D','maj7'],['C#','7s9']],
  drums:{A:dr(DR.pocket,{g:'..x.......x...x.'}),F:dr(DR.pocketF,{g:'..x.x.x.x.x.x...'})},dseq:'AAAF',bassI:'synth',
  bass:['0..o.0o.7.0.a.o.','0..o.0o.7.0.3.5.','0..o.0o.7.0.b.o.','0..o.xo.4.7.a.o.'],
  comp:[{i:'arp',a:'bell',h:'x.x.x.x.x.x.x.x.',v:.45},{i:'ep',h:'..x-......x-....',v:.4}],
  lead:{i:'synth',at:4,mel:'C#5/2 E5/2 F#5/2 A5/2 G#5/4 E5/4  F#5/2 E5/2 C#5/4 B4/2 C#5/2 E5/4  D5/2 F#5/2 A5/4 C#6/4 B5/4  E#5/2 G#5/2 C#5/4 B4/4 G#4/4'},pad:{v:.5}});
track('cm_chb','Corrupted Bounce','Code Drop bonus. Bouncy chip-tune funk: square-wave bells over a disco hat.',
 {bpm:120,swing:.04,prog:[['C','maj7'],['A','m9'],['D','m9'],['G','13'],['C','maj7'],['A','m9'],['F','maj7'],['G','13']],
  drums:{A:dr(DR.disco,{g:'......x.......x.'}),F:DR.discoF},dseq:'AAAF',bassI:'synth',
  bass:['0.o.0.o.0.o.0.o.','0.o.0.o.7.o.5.o.','0.o.0.o.0.o.0.o.','0.o.0.o.4.5.7.o.'],
  comp:[{i:'arp',a:'bell',h:'x.x.x.x.x.x.x.x.',v:.5},{i:'stab',o:12,h:'....x.......x...',v:.4}],
  lead:{i:'bell',at:4,mel:'E5/2 G5/2 C6/2 B5/2 G5/4 E5/4  A5/2 G5/2 E5/2 D5/2 C5/8  D5/2 F5/2 A5/2 C6/2 B5/4 A5/4  G5/2 B5/2 D6/4 C6/8'}});
track('cm_ch3','Bunny Suit Boogie','Clean room stealth. Hushed lab groove: soft kick, airy pad, a slinky theremin.',
 {bpm:90,swing:.16,prog:[['B','m9'],['B','m9'],['G','maj7'],['F#','7s9'],['B','m9'],['E','9'],['G','maj7'],['F#','7b9']],
  drums:{A:dr(DR.sneak,{g:'..........x.....'}),F:DR.sneakF},dseq:'AAAF',bassI:'sub',
  bass:['0-...0..7-.3..o.','0-...0..7-.3.5.6','0-...0..7-.4..o.','0-...0.x4-.7.5.4'],
  comp:[{i:'ep',h:'x-......x-......',v:.35}],
  lead:{i:'theremin',at:4,mel:'F#4/2 B4/2 D5/4 C#5/2 B4/2 F#4/4  G4/2 B4/2 E5/4 D5/8  F#4/2 B4/2 D5/4 F#5/2 E5/2 D5/4  C#5/4 A#4/4 F#4/8'},pad:{i:'choir',v:.35}});
track('cm_ch4','Chip Van Chase','White van pursuit. Synth-pop chase funk with a wah ride.',
 {bpm:122,swing:.08,prog:[['G','m9'],['G','m9'],['Eb','maj7'],['F','9'],['G','m9'],['C','9'],['Eb','maj7'],['D','7s9']],
  drums:{A:dr(DR.drive,{g:'..x.......x.....'}),F:DR.driveF},dseq:'AAAF',bassI:'synth',
  bass:['0.o.0.7.a.0.o.7.','0.o.0.7.a.0.3.5.','0.o.0.7.a.0.o.7.','0.o.0x7.a.4.5.7.'],
  comp:[{i:'wah',h:'..x-x...x-x.x...',v:.5},{i:'arp',a:'bell',h:'x...x...x...x...',v:.35}],
  lead:{i:'synth',at:4,mel:'D5/2 G5/2 Bb5/4 A5/2 G5/2 D5/4  Eb5/2 G5/2 C6/4 Bb5/8  D5/2 G5/2 Bb5/4 D6/2 C6/2 Bb5/4  A5/4 F#5/4 D5/8'}});
track('cm_tw1','Lobby of Doom (Funky)','Baldey\'s Tower lobby stealth. Dark marble-hall funk: sub bass, choir and creeping rimshots.',
 {bpm:88,swing:.16,prog:[['E','m9'],['E','m9'],['C','maj7'],['B','7b9'],['E','m9'],['A','m9'],['C','maj7'],['B','7s9']],
  drums:{A:dr(DR.sneak,{d:'X...............'}),F:DR.sneakF},dseq:'AAAF',bassI:'sub',
  bass:['0--.o..0-..3.5.6','0--.o..0-..3.5.7','0--.o..0-..4.7.o','0--.o..0-..4.5.6'],
  comp:[{i:'organ',h:'x-......x-......',v:.4}],
  lead:{i:'theremin',at:4,mel:'B4/2 E5/2 G5/4 F#5/2 E5/2 B4/4  C5/2 E5/2 A5/4 G5/8  B4/2 E5/2 G5/4 B5/2 A5/2 G5/4  F#5/4 D#5/4 B4/8'},pad:{i:'choir',v:.4}});
track('cm_tw3','Penthouse Firewall','Baldey\'s Tower hack. Heavy, slow and still groovy: organ stabs and a brass line that climbs.',
 {bpm:94,swing:.12,prog:[['C','m9'],['C','m9'],['Ab','maj7'],['G','7b9'],['C','m9'],['F','m9'],['Ab','maj7'],['G','7s9']],
  drums:{A:dr(DR.heavy,{d:'X.......X.......'}),F:DR.heavyF},dseq:'AAAF',bassI:'sub',
  bass:['0-...0..7-.3..o.','0-...0..7-.3.5.6','0-...0..7-.4..o.','0-...0.x4-.7.5.4'],
  comp:[{i:'organ',h:'..x-......x-....',v:.45},{i:'stab',o:12,h:'x...............',v:.45}],
  lead:{i:'brass',at:4,mel:'G4/2 C5/2 Eb5/4 D5/2 C5/2 G4/4  Ab4/2 C5/2 F5/4 Eb5/8  G4/2 C5/2 Eb5/4 G5/2 F5/2 Eb5/4  D5/4 B4/4 G5/8'},pad:{i:'choir',v:.35}});
// Lockpick Groove plays one groove per lock (lpSong in lockpick.js, each lock its own tempo); this one plays on the outro.
track('cm_tp4','Dumpster Safe Shuffle','Lockpick Groove in Tempe. Shuffle funk for picking Stinky Pete\'s locks.',
 {bpm:100,swing:.24,prog:[['D','9'],['D','9'],['G','13'],['G','13'],['D','9'],['B','m9'],['E','m9'],['A','13']],
  drums:{A:dr(DR.pocket,{l:'....x.......x...'}),F:DR.pocketF},dseq:'AAAF',bassI:'tuba',
  bass:['0-.o..0.7.a.o.7.','0-.o..0.4.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],
  comp:[{i:'clav',h:'..x.g.x...x.g.x.',v:.6}],
  lead:{i:'whistle',at:4,mel:'F#5/2 A5/2 B5/4 A5/2 F#5/2 E5/4  D5/2 E5/2 F#5/2 A5/2 G5/8  F#5/2 E5/2 D5/2 B4/2 D5/4 E5/4  C#5/4 E5/2 A5/2 G5/8'}});
// defaults for the new mode files if a def has no music of its own
TR.wirecut=TR.wirecut||TR.cm_dtb;TR.codedrop=TR.codedrop||TR.cm_chb;

// ================= DOWNTOWN PHOENIX: Honky Tony's taxi ring =================
const PAL_GARAGE={wall:'#3a2a12',wallTop:'#6a4a1a',a:'#4a4a52',b:'#52525a'};
fill('dt2',{name:'Dispatch Garage',kind:'overhead',req:6,code:'DISPATCH',
 blurb:"Sneak into Honky Tony's taxi dispatch garage at night. Somewhere in there is a hidden compartment."},
 {type:'stealth',music:'cm_dt2',palette:PAL_GARAGE,guardArt:'taxi',title:'DISPATCH GARAGE',sub:'Overhead stealth: Downtown Phoenix',
  clue0:cl('dt2',[['Crime Family Chart','Taped inside the hidden dispatch compartment: a chart with BIGG BUFF BALDEY at the top. Under him: Papa Johnny, Honky Tony, Stinky Pete and Dr. Glitch.'],
   ['Night Route Sheet','Taxi 12, 11 PM: "Gold run. Gilbert to the Mill Avenue bridge. Hand off to the trash truck."']]),
  goal:'Grab the keycard on each floor, then reach the exit. Find the hidden compartment!',
  intro:['The taxi depot was empty, but every taxi gets its orders from the dispatch garage next door.',
   'Honky Tony keeps his secrets in a hidden dispatch compartment. Mechanics patrol the garage all night.',
   'Same as the vault: stay out of the light cones, use shadows, sneak behind for a takedown. Two floors this time.'],
  introExpr:['thinking','smug','proud'],
  outro:{lines:['Agents... look at this chart. B.B.B. stands for BIGG BUFF BALDEY.','He runs all of them: Papa Johnny, Honky Tony, Stinky Pete in Tempe and Dr. Glitch in Chandler.','And the route sheet says taxi 12 makes a gold run tonight. Get on your scooters!'],expr:['alarmed','thinking','proud']},
  winText:'CHART FOUND!',reward:{base:170,perClue:60,perKill:5,tips:25},
  floors:[stX(ST_VAULT[0],'h','FLOOR 1: TAXI BAYS',1.08),stX(ST_VAULT[1],'v','FLOOR 2: DISPATCH ROOM',1.08)]});

fill('dt3',{name:'Night Fare',kind:'pursuit',req:'dt2',code:'NIGHTFARE',
 blurb:'Tail taxi 12 through Downtown traffic on your scooter and see where the gold goes.'},
 {type:'pursuit',music:'cm_dt3',title:'NIGHT FARE',sub:'Scooter pursuit: Downtown Phoenix',length:16000,target:'car_yellow',targetW:38,targetH:62,targetCol:'#ffd23a',
  finishName:'MILL AVE BRIDGE',
  clue0:cl('dt3',[['Meter Stuck at $0','Taxi 12\'s meter never runs. It doesn\'t carry passengers, only cargo.'],
   ['Heavy Trunk','The trunk rides so low it sparks on the speed bumps. That\'s a LOT of gold.'],
   ['Driver\'s Map','A map on the dashboard with a circle on Tempe Town Lake and a note: "Pete takes it from here."']]),
  goal:'Stay in the GREEN zone behind the taxi. Snap 3 photos!',
  intro:['There it is: taxi 12. Yellow, dented, and riding very low.','Same as the Gilbert chase: stay in the green zone, UP to speed up, DOWN to brake, JUMP to hop, GADGET for turbo.','Downtown traffic is busier. Watch the oncoming lane!'],
  introExpr:['smug','thinking','alarmed'],
  photos:[{at:.2,what:'the meter'},{at:.5,what:'the trunk'},{at:.8,what:'the driver\'s map'}],
  outro:{lines:['The taxi stopped on the Mill Avenue bridge and a garbage truck took the gold. Stinky Pete\'s truck!','Before we chase it to Tempe, we need Honky Tony\'s records. Next stop: his taxi meter server.'],expr:['alarmed','proud']},
  winText:'TAXI TRACKED!',reward:{base:170,perClue:60,perKill:0,tips:25}});

fill('dt4',{name:'Meter Server Hack',kind:'hack',req:'dt3',code:'METERMAID',
 blurb:"Hack Honky Tony's taxi meter server for his records. Three files, harder circuits."},
 {type:'hack',music:'cm_dt4',title:'MISSION: METER SERVER HACK',sub:'Downtown Phoenix  |  1 AM',
  boards:[{cols:7,rows:5,time:80,seed:104},{cols:8,rows:5,time:85,seed:131},{cols:8,rows:6,time:95,seed:177}],lives:3,
  intro:["Honky Tony's meter server tracks every taxi. If we crack it, we see every gold run.","Same circuit puzzle as Gilbert, but bigger boards. Turn tiles to connect the plug to the lock before the timer runs out."],
  introExpr:['smug','thinking'],goal:'Connect the power to the lock. 3 files to crack!',winText:'METERS HACKED!',
  outro:{lines:['Every gold run goes two ways: half to Stinky Pete\'s recycling plant in Tempe, half to Dr. Glitch\'s chip factory in Chandler.','Honky Tony was just the delivery guy. Tempe and Chandler are open, agents. Pick one!'],expr:['alarmed','proud']},
  reward:{base:180,perClue:60,perKill:0,tips:0}});
(function(){const d=LEVEL_DEFS.dt4,c0=cl('dt4',[['Gold Run Ledger','Every gold run since spring. Half the loads go to "PETE (TEMPE)", half to "GLITCH (CHANDLER)".'],
 ['Honk Code Book','Honky Tony\'s secret honk code: 2 short honks = "coast is clear". 3 long = "agents spotted!"'],
 ['Tower Invoice','An invoice to "B. Baldey, Top Floor". For: 300 taxi rides. Paid in gold.']]);d.boards.forEach((b,i)=>b.clue=c0+i);})();

fill('dtb',{name:'Honk Bomb',kind:'wirecut',req:'dt3',bonus:1,code:'HONKBOMB',
 blurb:'Bonus! Honky Tony rigged a giant HONK BOMB to blast all Downtown awake at midnight. Cut the right wires.'},
 {type:'wirecut',music:'cm_dtb',title:'HONK BOMB',sub:'Wire Cut bonus: Downtown Phoenix',
  modules:[{wires:4,time:45,rule:'shape',seed:11,gadget:'pie'},{wires:5,time:45,rule:'light',seed:23,gadget:'glitter'},{wires:6,time:50,rule:'shape',seed:37,gadget:'bubble'},{wires:6,time:55,rule:'all',seed:41,gadget:'honk'}],
  intro:['Uh oh. Honky Tony hid a HONK BOMB under the light rail stop. At midnight it blasts every car horn in Downtown at once!','And he booby-trapped the way there with his prank gadgets: a pie launcher, a glitter cannon and a bubble blaster.','Each box has wires from numbered plugs on the left to symbols on the right. I\'ll tell you which wire to cut.',
   'Follow the wire with your eyes, pick its plug with UP and DOWN, and press A to cut. Wrong cut = 8 seconds gone!','Stuck? Hold GADGET and press UP or DOWN to shine the TRACE light on a symbol. In co-op, Player 2 drives the trace light for free!'],
  introExpr:['alarmed','laughing','thinking','smug','wink'],goal:'Cut the right wire on every box before time runs out!',winText:'HONK BOMB DEFUSED!',
  outro:{lines:['Phew. Downtown gets a good night\'s sleep. Honky Tony is going to be SO grumpy.'],expr:['laughing']},
  reward:{base:150,perClue:60,perKill:0,tips:30}});
(function(){const d=LEVEL_DEFS.dtb,c0=cl('dtb',[['Horn Supplier','The honk bomb was built from 47 taxi horns. So THAT\'s what the repair bill was for.'],
 ['Midnight Timer','The timer was set by remote, from a phone with a Chandler area code.'],['Tower Sticker','A purple sticker on the bomb box: "Property of B.B.B. Tower Maintenance."']]);
 [1,2,3].forEach((m,i)=>d.modules[m].clue=c0+i);})();

// ================= TEMPE: Stinky Pete's garbage trucks =================
const PAL_RECYC={wall:'#1f4a2a',wallTop:'#2f7a3a',a:'#5a5a48',b:'#626250'};
fill('tp2',{name:'Recycling Plant',kind:'stealth',req:'dt4',code:'RECYCLE',
 blurb:"Sneak through Stinky Pete's recycling plant past sorters, cameras and laser belts."},
 {type:'stealth',music:'cm_tp2',palette:PAL_RECYC,title:'RECYCLING PLANT',sub:'Stealth mission: Tempe',
  clue0:cl('tp2',[['Gold Bale','A bale of crushed cans... with a gold bar in the middle. Clever, Pete. Gross, but clever.'],
   ['Shift Board','Night shift: "Load truck 9 with the shiny bales. Do NOT open the blue dumpster."'],
   ['Lake Permit','A fake permit to "clean" Tempe Town Lake. Pete is dumping stuff in the lake at night!']]),
  goal:'Grab the keycard on each floor, then reach the exit. Stay out of the light!',
  intro:['Welcome to Tempe! Stinky Pete runs the garbage trucks, and his recycling plant never sleeps.','Three floors of sorters and cameras. The lasers here blink faster, so time them well.'],
  introExpr:['happy','thinking'],
  outro:{lines:['Truck 9 is leaving with the shiny bales right now. And there\'s a blue dumpster Pete doesn\'t want opened.','Scooters, agents. Let\'s tail truck 9!'],expr:['alarmed','proud']},
  winText:'PLANT SORTED!',reward:{base:190,perClue:60,perKill:5,tips:25},
  floors:[stX(ST_VAULT[0],'rot','FLOOR 1: SORTING LINE',1.12),stX(ST_VAULT[2],'h','FLOOR 2: BALING ROOM',1.12),stX(ST_VAULT[1],'rot','FLOOR 3: PETE\'S OFFICE',1.15)]});

fill('tp3',{name:'Trash Dash',kind:'pursuit',req:'tp2',code:'TRASHDASH',
 blurb:'Tail garbage truck 9 along the lake on your scooter. It\'s big, slow and VERY smelly.'},
 {type:'pursuit',music:'cm_tp3',title:'TRASH DASH',sub:'Scooter pursuit: Tempe Town Lake',length:17000,target:'garbage_truck',targetW:52,targetH:96,targetCol:'#3a9a4a',
  finishName:'PETE\'S DUMP',
  clue0:cl('tp3',[['Truck 9 Plate','Plate STNKY-9. Registered to "Pete\'s Totally Normal Trash Co."'],
   ['Shiny Drip','Something shiny drips out of the back at every bump. Gold dust, all over Tempe!'],
   ['Dump Map','Taped to the back door: a map of Pete\'s dump with a big X on a blue dumpster.']]),
  goal:'Stay in the GREEN zone behind the garbage truck. Snap 3 photos!',
  intro:['Truck 9 is rolling. Follow it, but not too close. The driver checks his mirrors a lot.','Same moves as before. Hold your nose!'],
  introExpr:['smug','laughing'],
  photos:[{at:.22,what:'the plate'},{at:.5,what:'the drip'},{at:.8,what:'the back door'}],
  outro:{lines:['It went into Pete\'s dump. The gold is locked in that blue dumpster, and it has THREE locks.','Time for some lockpicking, agents. I hope you have rhythm.'],expr:['alarmed','wink']},
  winText:'TRUCK TRACKED!',reward:{base:190,perClue:60,perKill:0,tips:30}});

fill('tp4',{name:'Dumpster Safe',kind:'lockpick',req:'tp3',code:'PICKPETE',
 blurb:"Lockpick Groove! Pick the 3 locks on Stinky Pete's armored blue dumpster to the beat."},
 {type:'lockpick',music:'cm_tp4',title:'DUMPSTER SAFE',sub:'Lockpick Groove: Pete\'s Dump, Tempe',
  locks:[{name:'PADLOCK',bpm:96,density:.35,sixteenths:false,seed:3},{name:'COMBO DIAL',bpm:104,density:.45,sixteenths:false,seed:8},{name:'STINK-PROOF VAULT LOCK',bpm:112,density:.5,sixteenths:true,seed:15}],
  intro:['The blue dumpster has three locks. Each one has 4 pins, and each pin clicks to its own beat.','Notes slide to the pick line. TOP lane: press JUMP. BOTTOM lane: press ATTACK. Hit them on the beat!',
   'Hit most of a bar\'s notes and the pin sets. Misses add tension, and too much tension snaps a pick. You have 3 picks. In co-op, Player 1 plays the top lane and Player 2 the bottom!',
   'The last lock is the FINALE: it plays a little beat first (LISTEN), then you tap the same beat back (YOUR TURN). Each pin\'s beat gets longer!'],
  introExpr:['thinking','smug','wink','laughing'],goal:'Set all 4 pins on each lock. Don\'t snap all 3 picks!',winText:'DUMPSTER OPEN!',
  outro:{lines:['GOLD! Stacks of it, and only a little bit stinky.','Stinky Pete is going to be furious. He\'s waiting for us at the dump. Get ready.'],expr:['laughing','alarmed']},
  reward:{base:200,perClue:60,perKill:0,tips:30}});
(function(){const d=LEVEL_DEFS.tp4,c0=cl('tp4',[['Padlock Tag','The padlock is stamped "Gilbert Bank, 1912". They stole the old bank\'s own lock!'],
 ['Combo Note','The combo is written on a sticky note inside the lid: 1-2-3-4. Classic Pete.'],['Gold Count','Inside: 20 of the 40 missing gold bars. The other 20 must be in Chandler.']]);d.locks.forEach((L,i)=>L.clue=c0+i);})();

fill('tpb',{name:'Route Hack',kind:'hack',req:'tp3',bonus:1,code:'ROUTEHACK',
 blurb:"Bonus! Hack Pete's garbage route computer so his trucks drive in circles all night."},
 {type:'hack',music:'cm_tpb',title:'BONUS: ROUTE HACK',sub:'Tempe  |  Pete\'s route office',
  boards:[{cols:7,rows:5,time:75,seed:211},{cols:8,rows:5,time:80,seed:233},{cols:8,rows:6,time:90,seed:257}],lives:3,
  intro:['Pete\'s route computer tells every garbage truck where to go. Let\'s send them on a scenic tour... in circles.','Connect the plug to the lock on each board.'],
  introExpr:['wink','thinking'],goal:'Crack 3 route files!',winText:'ROUTES SCRAMBLED!',
  outro:{lines:['Every truck in Tempe is now driving around the lake in circles. Pete\'s crew will be dizzy for days!'],expr:['laughing']},
  reward:{base:160,perClue:60,perKill:0,tips:20}});
(function(){const d=LEVEL_DEFS.tpb,c0=cl('tpb',[['Dizzy Route','Route 7 now: left, left, left, left. Forever.'],['Pete\'s Password','Pete\'s password is "stinky123". Of course it is.'],['Chip Delivery','One route goes to Chandler every Friday: "Chips for the Doctor."']]);d.boards.forEach((b,i)=>b.clue=c0+i);})();

// ================= CHANDLER: Dr. Glitch's chip factory =================
fill('ch2',{name:'Firewall Breach',kind:'hack',req:'dt4',code:'FIREWALL',
 blurb:"Break through the chip factory's firewall from the parking lot. Big circuit boards, short timers."},
 {type:'hack',music:'cm_ch2',title:'FIREWALL BREACH',sub:'Chandler  |  Chip factory parking lot',
  boards:[{cols:8,rows:5,time:80,seed:301},{cols:8,rows:6,time:90,seed:322},{cols:9,rows:6,time:100,seed:349}],lives:3,
  intro:['Chandler! Dr. Glitch\'s chip factory has the toughest firewall in the valley.','Three big boards. Turn tiles to connect the power. You know the drill!'],
  introExpr:['happy','smug'],goal:'Break 3 firewall layers!',winText:'FIREWALL DOWN!',
  outro:{lines:['We\'re in the network. Dr. Glitch is melting the gold into computer chips... and some of his files got scrambled when we broke in.','The way in is the clean room. Bunny suits on, agents!'],expr:['alarmed','proud']},
  reward:{base:190,perClue:60,perKill:0,tips:0}});
(function(){const d=LEVEL_DEFS.ch2,c0=cl('ch2',[['Gold Chip Order','"Gold-plated chips, 20,000 units. Customer: B.B.B. Tower."'],['Glitch\'s Diary','"Dear diary. Baldey wants a robot army of vacuum cleaners. I said yes. I regret nothing."'],['Clean Room Badge','A visitor badge for the clean room. Expired, but the scanner won\'t know.']]);d.boards.forEach((b,i)=>b.clue=c0+i);})();

fill('chb',{name:'Corrupted Files',kind:'codedrop',req:'ch2',bonus:1,code:'CODEDROP',
 blurb:'Bonus! Code Drop: stack falling data blocks to decrypt Dr. Glitch\'s scrambled files.'},
 {type:'codedrop',music:'cm_chb',title:'CORRUPTED FILES',sub:'Code Drop bonus: Chandler',
  files:[{name:'GLITCH_NOTES.DOC',lines:6,speed:.8},{name:'ROBOT_PLANS.PDF',lines:8,speed:.65,virus:2},{name:'TOWER_MAP.IMG',lines:10,speed:.52,virus:3}],
  intro:['Breaking the firewall scrambled three of Dr. Glitch\'s files into falling data blocks!','Fill a whole row to clear it. Each row cleared decrypts part of the file.',
   'LEFT and RIGHT move, DOWN drops faster, JUMP or UP rotates, ATTACK rotates the other way, GADGET slams it down. Don\'t let the blocks reach the top!',
   'Watch for glowing blocks! A PIZZA BOMB blasts a hole around where it lands, and a SANDY BEAM clears its whole column. Each one decrypts a line too!'],
  introExpr:['alarmed','thinking','smug','happy'],goal:'Clear lines to decrypt 3 files!',winText:'FILES DECRYPTED!',
  outro:{lines:['Files decrypted. Robot vacuum plans and a map of Baldey\'s Tower. Very useful later!'],expr:['proud']},
  reward:{base:170,perClue:60,perKill:0,tips:30}});
(function(){const d=LEVEL_DEFS.chb,c0=cl('chb',[['Glitch\'s Notes','"Note to self: the clean room guards hate the smell of pizza." Interesting...'],['Robot Plans','Blueprints for a giant robot vacuum called the SUCK-O-TRON 3000.'],['Tower Map','A map of Baldey\'s Tower: lobby, security floor, penthouse. The vault is on the top floor.']]);d.files.forEach((f,i)=>f.clue=c0+i);})();

const PAL_CLEAN={wall:'#c8d0e0',wallTop:'#f0f4ff',a:'#8fa0b8',b:'#98a8c0'};
fill('ch3',{name:'Clean Room',kind:'stealth',req:'ch2',code:'BUNNYSUIT',
 blurb:'Sneak through the spotless clean room in bunny suits. Bright light everywhere, so use every shadow.'},
 {type:'stealth',music:'cm_ch3',palette:PAL_CLEAN,title:'CLEAN ROOM',sub:'Stealth mission: Chandler chip factory',
  clue0:cl('ch3',[['Gold Furnace','A tiny furnace melting gold bars into thin gold wire for chips.'],['Robot Prototype','A robot vacuum with a sign: "PROTOTYPE 1. Do not let it near the cat."'],['Shipping Label','Crates of gold chips, labeled for a white van: "To the Tower. Tonight. Do not be late."']]),
  goal:'Grab the keycard on each floor, then reach the exit. Stay out of the light!',
  intro:['Bunny suits on! The clean room is super bright, so the guards can see farther. Shadows are your best friend.','Three floors. The guards here walk faster too. Good luck, agents.'],
  introExpr:['laughing','thinking'],
  outro:{lines:['The last of the gold is leaving in a white van, right now, headed for Baldey\'s Tower.','Scooters! We have to see that van\'s route!'],expr:['alarmed','proud']},
  winText:'SPOTLESS!',reward:{base:200,perClue:60,perKill:5,tips:25},
  floors:[stX(ST_VAULT[1],'h','FLOOR 1: GOWNING ROOM',1.15),stX(ST_VAULT[2],'v','FLOOR 2: CHIP LINE',1.15),stX(ST_VAULT[0],'v','FLOOR 3: GOLD FURNACE',1.18)]});

fill('ch4',{name:'Chip Van Chase',kind:'pursuit',req:'ch3',code:'CHIPVAN',
 blurb:'Tail the white van full of gold chips out of Chandler toward the Tower.'},
 {type:'pursuit',music:'cm_ch4',title:'CHIP VAN CHASE',sub:'Scooter pursuit: Chandler Boulevard',length:18000,target:'car_white',targetW:40,targetH:66,targetCol:'#f0f0f0',
  finishName:'TOWER GARAGE',
  clue0:cl('ch4',[['Van Plate','Plate GL1TCH. Subtle, Doctor. Very subtle.'],['Rattling Crates','The back of the van rattles: hundreds of gold chips in boxes.'],['Garage Code','Taped to the dashboard: the code for the Tower\'s garage door. BB-BB-BB.']]),
  goal:'Stay in the GREEN zone behind the van. Snap 3 photos!',
  intro:['That white van has the last of the gold. It\'s faster than the trucks, so use your turbo wisely.','Snap 3 photos and see where it goes.'],
  introExpr:['alarmed','smug'],
  photos:[{at:.22,what:'the plate'},{at:.5,what:'the crates'},{at:.8,what:'the dashboard'}],
  outro:{lines:['The van drove right into Baldey\'s Tower. All four lieutenants lead to him.','We have the garage code and the tower map. It\'s time, agents. Baldey\'s Tower.'],expr:['thinking','proud']},
  winText:'VAN TRACKED!',reward:{base:210,perClue:60,perKill:0,tips:30}});

// ================= BALDEY'S TOWER =================
const PAL_TOWER={wall:'#3a1a4a',wallTop:'#7a2a8a',a:'#2a2238',b:'#322a42'};
fill('tw1',{name:'Tower Lobby',kind:'stealth',req:'ch4',code:'TOWERSNEAK',
 blurb:"Sneak up three floors of Baldey's Tower. His best guards, his best cameras, his fastest lasers."},
 {type:'stealth',music:'cm_tw1',palette:PAL_TOWER,title:"BALDEY'S TOWER",sub:'Stealth mission: the Tower',
  clue0:cl('tw1',[['Baldey\'s Portrait','A giant painting of Baldey flexing. It\'s 20 feet tall. He signed it himself.'],['Gold Elevator','The elevator buttons are solid gold. That\'s where some of the Gilbert gold went!'],['Penthouse Memo','"The SUCK-O-TRON is ready. At sunrise it vacuums up every coin in the valley." We have to stop this!']]),
  goal:'Grab the keycard on each floor, then reach the exit. This is the big one!',
  intro:['This is it. Baldey\'s Tower. Everything we found leads here.','Three floors, his best guards and the fastest lasers yet. Stay sharp, stay quiet.'],
  introExpr:['thinking','proud'],
  outro:{lines:['We\'re outside the penthouse. Its door is locked by the Tower\'s main computer.','One more hack and we\'re face to face with Bigg Buff Baldey.'],expr:['alarmed','proud']},
  winText:'TOP FLOOR REACHED!',reward:{base:230,perClue:70,perKill:5,tips:30},
  floors:[stX(ST_VAULT[0],'v','FLOOR 1: MARBLE LOBBY',1.2),stX(ST_VAULT[1],'h','FLOOR 2: SECURITY',1.2),stX(ST_VAULT[2],'rot','FLOOR 3: GOLD HALL',1.22)]});

fill('tw3',{name:'Penthouse Firewall',kind:'hack',req:'tw2',code:'PENTHOUSE',
 blurb:"Hack the Tower's main computer to open the penthouse door. The hardest circuits in the game."},
 {type:'hack',music:'cm_tw3',title:'PENTHOUSE FIREWALL',sub:"Baldey's Tower  |  Top floor",
  boards:[{cols:8,rows:6,time:90,seed:401},{cols:9,rows:6,time:95,seed:433},{cols:9,rows:7,time:110,seed:467}],lives:3,
  intro:['The Tower\'s main computer. Three layers, the biggest boards yet.','Connect the power, open the door. Baldey is right behind it.'],
  introExpr:['thinking','proud'],goal:'Crack 3 layers to open the penthouse!',winText:'PENTHOUSE OPEN!',
  outro:{lines:['The door is open. We can hear the SUCK-O-TRON warming up...','The final showdown with Bigg Buff Baldey is coming in a later build. Amazing work, agents!'],expr:['alarmed','proud']},
  reward:{base:240,perClue:70,perKill:0,tips:0}});
(function(){const d=LEVEL_DEFS.tw3,c0=cl('tw3',[['Baldey\'s Real Name','His real name is Bartholomew Buff Baldey. He hates it.'],['Sunrise Plan','At sunrise the SUCK-O-TRON flies out of the roof. Unless someone stops it first.'],['Thank-You Note','A note from Barro\'s Pizza from years ago: "No free slices for you, Baldey." So THAT\'s why he\'s mad at Gilbert!']]);d.boards.forEach((b,i)=>b.clue=c0+i);})();

// ---------- the Tower Gauntlet (Michael's pick): Wire Cut, then Lockpick, then Code Drop, back to back ----------
// type:'gauntlet' with stages:[sub-defs]. Each stage runs its own mode; its win hands over to the next stage instead of Results.
// Losing any stage fails the whole gauntlet (Retry starts from stage 1). Clues from every stage are paid out at the end.
function makeGauntlet(def,np,stage,clues){const S=Object.assign({},def.stages[stage],{id:def.id,_g:{def,stage,clues,np}});
 S.title=def.title+'  ('+(stage+1)+'/'+def.stages.length+')';
 const mk={wirecut:makeWireCut,lockpick:makeLockpick,codedrop:makeCodeDrop,hack:makeHack}[S.type];return mk(S,np);}
const _missionPayoutCM=missionPayout;
missionPayout=function(def,np,d){const g=def&&def._g;if(!g)return _missionPayoutCM.apply(this,arguments);
 const all=g.clues.concat(d.clues||[]);
 if(g.stage+1<g.def.stages.length){go(makeGauntlet(g.def,g.np,g.stage+1,all));return;}
 bump('gauntlets');return _missionPayoutCM.call(this,g.def,np,Object.assign({},d,{clues:all,total:g.def.stages.length}));};
track('cm_tw2','Gauntlet Groove','The Tower Gauntlet. Every trick you learned, back to back: driving brass funk in a dark key.',
 {bpm:112,swing:.12,prog:[['A','m9'],['A','m9'],['F','maj7'],['E','7s9'],['A','m9'],['D','m9'],['F','maj7'],['E','7b9']],
  drums:{A:dr(DR.brk,{d:'X...............'}),F:DR.brkF},dseq:'AAAF',
  bass:['0-.o..0.7.a.o.7.','0-.o..0.3.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],
  comp:[{i:'stab',o:12,h:'....x.......x...',v:.5},{i:'organ',h:'x-......x-......',v:.35}],
  lead:{i:'brass',at:4,mel:'E5/2 A5/2 C6/4 B5/2 A5/2 E5/4  F5/2 A5/2 D6/4 C6/8  E5/2 A5/2 C6/4 E6/2 D6/2 C6/4  B5/4 G#5/4 E5/8'},pad:{i:'choir',v:.3}});
fill('tw2',{name:'Tower Gauntlet',kind:'gauntlet',req:'tw1',code:'GAUNTLET',
 blurb:'Everything you learned, back to back: a Wire Cut gadget box, a Lockpick Groove lock and a Code Drop file.'},
 {type:'gauntlet',music:'cm_tw2',title:'TOWER GAUNTLET',sub:"Baldey's Tower  |  Security floor",reward:{base:260,perClue:70,perKill:0,tips:40},
  stages:[
   {type:'wirecut',music:'cm_tw2',sub:'Stage 1: Wire Cut',modules:[{wires:6,time:50,rule:'light',seed:71,gadget:'slime'},{wires:7,time:55,rule:'all',seed:83,gadget:'confetti'}],
    intro:['The security floor has three locks between us and the penthouse. First: Baldey\'s booby-trapped gadget boxes!'],introExpr:['alarmed'],
    goal:'Defuse both boxes!',winText:'BOXES DEFUSED!',outro:{lines:['Two down... next, the big door lock. Get your groove on!'],expr:['proud']}},
   {type:'lockpick',sub:'Stage 2: Lockpick Groove',locks:[{name:'GOLD DOOR LOCK',bpm:108,density:.5,sixteenths:true,seed:21},{name:'BALDEY\'S BIG LOCK',bpm:116,density:.5,sixteenths:false,seed:34}],
    intro:['A gold door with two locks. The second one is a call-and-response finale. Listen, then tap it back!'],introExpr:['smug'],
    goal:'Pick both locks!',winText:'DOOR OPEN!',outro:{lines:['Last one: the security computer is scrambling the elevator code. Stack those blocks!'],expr:['alarmed']}},
   {type:'codedrop',music:'cm_tw2',sub:'Stage 3: Code Drop',files:[{name:'ELEVATOR_CODE.KEY',lines:10,speed:.5,virus:3,power:.2}],
    intro:['Decrypt the elevator code before the firewall crashes. Pizza Bombs and Sandy Beams are your friends!'],introExpr:['thinking'],
    goal:'Decrypt the elevator code!',winText:'GAUNTLET CLEARED!',outro:{lines:['GAUNTLET CLEARED! The elevator to the penthouse is open. You two are amazing.'],expr:['laughing']}}]});
(function(){const d=LEVEL_DEFS.tw2,c0=cl('tw2',[['Slime Recipe','Baldey\'s slime recipe: lime jello, glue and "a pinch of evil." Yuck.'],
 ['Gold Door Plaque','"This door was paid for with Gilbert gold." He put up a plaque about it!'],['Elevator Code','The elevator code is 0-0-0-0. Baldey really trusted his firewall.']]);
 d.stages[0].modules[1].clue=c0;d.stages[1].locks[1].clue=c0+1;d.stages[2].files[0].clue=c0+2;})();
LEVELS.find(l=>l.id==='tw3').req='tw2';KINDS.gauntlet={label:'Gauntlet',icon:'puzzle'};

// ---------- city unlocks ----------
// A city whose boss is still "Coming soon" counts as beaten once all of its BUILT main-path missions are done,
// so the campaign keeps flowing (Downtown -> Tempe + Chandler -> Tower) until the bosses are built.
const _cityOpenCM=cityOpen;
function cityCleared(cid){if(bossBeaten(cid))return true;const b=cityBoss(cid);if(b&&isReal(b))return false;
 const M=cityLevels(cid).main.filter(isReal);return M.length>0&&M.every(l=>!!SAVE.done[l.id]);}
cityOpen=function(cid){if(_cityOpenCM(cid))return true;
 if(cid==='tempe'||cid==='chandler')return cityCleared('downtown');
 if(cid==='tower')return ['gilbert','downtown','tempe','chandler'].every(cityCleared);return false;};

// ---------- achievements ----------
if(typeof ACH!=='undefined'){const add=(id,n,d,c,cash,ok,p,h)=>{a(id,n,d,c,cash,ok,p,h);const x=ACH[ACH.length-1];x.tier=x.cash>=100?3:x.cash>=50?2:x.cash>=20?1:0;ACH_BY[id]=x;
  const last=ACH.findIndex(y=>y.id==='f_all');if(last>=0){const L=ACH.splice(last,1)[0];ACH.push(L);}};
 const M=[['dt2','Dispatch Garage','Garage Ghost'],['dt3','Night Fare','Fare Tracker'],['dt4','Meter Server Hack','Meter Reader'],['dtb','Honk Bomb','Quiet Night'],
  ['tp2','Recycling Plant','Sorted!'],['tp3','Trash Dash','Nose Plugged'],['tp4','Dumpster Safe','Lock Groover'],['tpb','Route Hack','Dizzy Trucks'],
  ['ch2','Firewall Breach','Firewall Breaker'],['chb','Corrupted Files','Decrypted'],['ch3','Clean Room','Bunny Suit Spy'],['ch4','Chip Van Chase','Van Tracker'],
  ['tw1','Tower Lobby','Tower Climber'],['tw2','Tower Gauntlet','Gauntlet Runner'],['tw3','Penthouse Firewall','Penthouse Key']];
 M.forEach(([id,name,nick])=>{const big=id[0]==='t'&&id[1]==='w';
  add('m_'+id+'_clear',nick,'Beat '+name+'.','mission',big?40:25,()=>!!SAVE.done[id]);
  add('m_'+id+'_clues',name+' Sleuth','Find every clue in '+name+'.','mission',big?40:25,()=>cluesTot(id)>0&&cluesIn(id)>=cluesTot(id),()=>[cluesIn(id),cluesTot(id)]);});
 add('m_dt2_chart','Who Is B.B.B.?','Find the crime family chart in the hidden dispatch compartment.','story',40,()=>CLUES.some((c,i)=>c.lvl==='dt2'&&c.name==='Crime Family Chart'&&SAVE.clues.includes(i)));
 add('m_dtb_clean','Steady Hands','Defuse the Honk Bomb without a single wrong cut.','mission',80,()=>!!lv('dtb').cleanCut);
 add('m_dtb_notrace','Eagle Eyes','Defuse the Honk Bomb without using the trace light.','mission',100,()=>!!lv('dtb').noTrace,null,1);
 add('m_tp4_combo','Full Combo','Pick every lock on the Dumpster Safe without missing a note.','mission',120,()=>!!lv('tp4').fullCombo,null,1);
 add('m_tp4_nosnap','Gentle Touch','Open the Dumpster Safe without snapping a pick.','mission',60,()=>!!lv('tp4').noSnap);
 add('m_chb_quad','MEGA DECRYPT','Clear 4 rows at once in Code Drop.','mission',60,()=>!!lv('chb').quad);
 add('city_dt_built','Downtown Done (So Far)','Beat every built Downtown mission.','story',75,()=>cityLevels('downtown').all.filter(isReal).every(l=>SAVE.done[l.id]));
 add('city_tp_built','Tempe Tidied','Beat every built Tempe mission.','story',75,()=>cityLevels('tempe').all.filter(isReal).every(l=>SAVE.done[l.id]));
 add('city_ch_built','Chandler Cleared','Beat every built Chandler mission.','story',75,()=>cityLevels('chandler').all.filter(isReal).every(l=>SAVE.done[l.id]));
 add('city_tw_door','At Baldey\'s Door','Open the penthouse door in Baldey\'s Tower.','story',150,()=>!!SAVE.done.tw3);
 add('modes_all','Jack of All Trades','Beat a mission of every play style: side-scroller, stealth, pursuit, hack, Wire Cut, Lockpick Groove and Code Drop.','story',150,
  ()=>['action','stealth','pursuit','hack','wirecut','lockpick','codedrop'].every(t=>LEVELS.some(l=>SAVE.done[l.id]&&LEVEL_DEFS[l.id]&&((LEVEL_DEFS[l.id].type||'action')===t))),null,1);
 tiers('ct_wires','Wire Cutter',m=>'Cut '+m+' correct wires.','count',()=>st('wiresCut'),[[10,15],[50,40],[150,100]]);
 tiers('ct_lock','Groove Picker',m=>'Hit '+m+' PERFECT lockpick notes.','count',()=>st('lockPerfect'),[[25,15],[150,40],[500,100]]);
 tiers('ct_pow','Power Player',m=>'Fire '+m+' Pizza Bombs or Sandy Beams in Code Drop.','count',()=>st('cdPowers'),[[5,15],[25,40]]);
 tiers('ct_lines','Line Clearer',m=>'Clear '+m+' rows in Code Drop.','count',()=>st('linesCleared'),[[20,15],[100,40],[300,100]]);}
