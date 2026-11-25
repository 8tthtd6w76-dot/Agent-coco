// ===== Albuquerque (v0.37): a road-trip city with three new play styles =====
// Story: Ava and Michael Henry go to Albuquerque for the Balloon Fiesta, but Baldey's three stooges
// (Lefty, Knuckles and Meatball) track them down, working with the local crook Baron Blowhard.
//  aq1 Sandia Peak Tram   (type:'tram', side-view brawl on the roof of the tram car, js/abq.js)       boss: Knuckles
//  aq2 Sandia Ski Run     (type:'ski', top-down downhill run, js/ski.js)                               chaser: Lefty on a snowmobile
//  aq3 Balloon Fiesta     (type:'balloon', vertical climb in hot air balloons, js/balloon.js)          boss: Baron Blowhard + Meatball
// Opens after Dispatch Garage (dt2, where the kids learn about B.B.B.) or with the city code SANDIA.
// Level codes TRAMWAY, POWDER, FIESTA. Cheats GREENCHILE, BIGAIR, PROPANE.
// Art: Michael's sheets since v0.39 (js/abq_art.js, assets/abq/); the code drawing below is the fallback. Prompts: agent-coco/prompts/albuquerque_art_prompts.md.

// ---------- city ----------
KINDS.tram={label:'Tram rumble',icon:'available'};
KINDS.ski={label:'Downhill ski',icon:'chase_arrow'};
KINDS.balloon={label:'Balloon climb',icon:'boss_construction'};
CITIES.push({id:'abq',name:'Albuquerque',short:'ALBUQUERQUE',boss:'Baron Blowhard',industry:'Balloon tour racket',col:'#ff7ab0',vx:566,vy:122,music:'city_abq',
 bg:'#e6a86e',code:'SANDIA',hint:'Beat Dispatch Garage in Downtown Phoenix to open (road trip!).'});
CITY.abq=CITIES[CITIES.length-1];TERR_CITY['Albuquerque']='abq';CITY_CODES.SANDIA='abq';
ASSET_LIST.push(['city/abq','assets/city/abq.jpg']);
if(typeof CITY_ROADS!=='undefined')CITY_ROADS.abq=ABQ_ROAD;
const _cityOpenAQ=cityOpen;
cityOpen=function(cid){if(cid==='abq')return !!(SAVE.testing||SAVE.cityOpen.abq||SAVE.done.dt2);return _cityOpenAQ(cid);};
// pins sit at the tram base, the ski area on the crest, and the Balloon Fiesta field
const _cityLayoutAQ=cityLayout;
cityLayout=function(cid){const N=_cityLayoutAQ(cid);if(cid!=='abq'||N._aq)return N;const T=[.413,.619,1];
 N.filter(o=>o.l&&!o.bonus).forEach((o,i)=>{if(T[i]==null)return;const p=roadAt(cid,T[i]);o.x=p.x;o.y=p.y;o.t=T[i];});N._aq=1;return N;};
const _winCodesAQ=winCodes;
winCodes=function(id){const o=_winCodesAQ(id);o.forEach(c=>{if(typeof LEVEL_CODES[c.code]==='string'&&String(LEVEL_CODES[c.code]).startsWith('aq'))c.what=levelName(LEVEL_CODES[c.code]).toUpperCase();});if(id==='dt2')o.push({code:'SANDIA',what:'ALBUQUERQUE',city:CITY.abq});return o;};
// a little balloon floats over the Albuquerque banner on the Valley map
const _drawValleyAQ=MapScene.drawValley;
MapScene.drawValley=function(){_drawValleyAQ.call(this);const c=CITY.abq,open=cityOpen('abq');
 rrect(c.vx-66,c.vy-16,132,22,11,'rgba(40,10,40,.82)',c.col,2);text(c.short,c.vx,c.vy,13,'#fff','center',null);
 const x=c.vx-82,y=c.vy-2+Math.sin(TIME*1.6)*4;ctx.save();ctx.translate(x,y);ctx.lineWidth=2;ctx.strokeStyle='#2a1030';
 [['#ff5a8a',-9],['#ffd23a',-3],['#2de2f5',3],['#ff5a8a',9]].forEach(([col,o])=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(o*.9,0,5,15,0,0,7);ctx.fill();});
 ctx.beginPath();ctx.ellipse(0,0,13,15,0,0,7);ctx.stroke();ctx.beginPath();ctx.moveTo(-8,11);ctx.lineTo(-3,21);ctx.moveTo(8,11);ctx.lineTo(3,21);ctx.stroke();
 ctx.fillStyle='#8a5a2a';ctx.fillRect(-4,20,8,6);ctx.strokeRect(-4,20,8,6);ctx.restore();
 if(!open)text('ROAD TRIP',c.vx,c.vy-22,10,'#fff','center','#000');};
// level codes name the mission instead of its id
const _enterCodeAQ=enterCode;
enterCode=function(c){const r=_enterCodeAQ.apply(this,arguments);if(r&&r.title){const m=/^MISSION (\S+) UNLOCKED$/.exec(r.title);if(m&&isNaN(+m[1]))r.title=levelName(LEVEL_CODES[String(c).toUpperCase()]||m[1]).toUpperCase()+' UNLOCKED';}return r;};

// ---------- clues ----------
const AQ_C1=cl('aq1',[['Stooge Ticket Stubs','Three tram tickets bought with a purple credit card: L., K. and M. The stooges are here!'],
 ['Fiesta Map, Circled','A Balloon Fiesta map with one launch spot circled in purple marker: "THE BARON."'],
 ['Gold Pin','A tiny gold B.B.B. pin. Only Baldey\'s personal crew wears these.']]);
const AQ_C2=cl('aq2',[['Snowy Phone','Lefty dropped his phone: "Boss B says no kids leave Albuquerque."'],
 ['Lift Receipt','Paid by "Blowhard Balloon Tours, LLC." The Baron is paying the stooges.'],
 ['Frozen Flyer','"Ride with the BARON! Tours over the city. Look down. Look closer." Looking at what?']]);
const AQ_C3=cl('aq3',[['Camera Basket','The stooge balloons carry long-lens cameras pointed at the city. They are spying from the sky.'],
 ['Purple Sandbag','The sandbags are stuffed with Baldey Tower letterhead. Same purple, same gold.'],
 ['The Baron\'s Logbook','Every tour flight ends with a note: "Report to B.B.B. in Phoenix." Albuquerque is part of the family.']]);

// ---------- levels on the city map ----------
LEVELS.push(
 {id:'aq1',name:'Sandia Peak Tram',terr:'Albuquerque',city:'abq',kind:'tram',req:'dt2',bonus:0,
  blurb:'Fight Baldey\'s stooges on the ROOF of the tram car, all the way up Sandia Peak. Boss: Knuckles.'},
 {id:'aq2',name:'Sandia Ski Run',terr:'Albuquerque',city:'abq',kind:'ski',req:'aq1',bonus:0,
  blurb:'Ski down the mountain! Dodge trees, hit the jumps, snowball the stooges. Lefty chases you on a snowmobile.'},
 {id:'aq3',name:'Balloon Fiesta',terr:'Albuquerque',city:'abq',kind:'balloon',req:'aq2',bonus:0,
  blurb:'Fly a hot air balloon up through the Fiesta. BB gun plus a spike under the basket. Boss: Baron Blowhard.'});
Object.assign(LEVEL_CODES,{TRAMWAY:'aq1',POWDER:'aq2',FIESTA:'aq3'});
CHEATS.push({code:'GREENCHILE',key:'greenchile',kind:'toggle',name:'Green Chile Power',d:'Albuquerque: the BB gun shoots hot chile peppers (double damage) and snowballs fly faster.'},
 {code:'BIGAIR',key:'bigair',kind:'toggle',name:'Big Air',d:'Ski jumps launch twice as high and tricks pay double.'},
 {code:'PROPANE',key:'propane',kind:'toggle',name:'Endless Propane',d:'Your balloon burner never runs out of fuel.'});

// ---------- story ----------
STORY_BEATS.push(
 {key:'abq_trip',when:()=>cityOpen('abq')&&(!!SAVE.done.dt2||!!SAVE.cityOpen.abq),pages:[
  {bg:'scenes/barros',who:'barro',text:"A family road trip to the Albuquerque Balloon Fiesta? Take a box of garlic knots for the drive. And relax, you two!"},
  {bg:'scenes/barros',who:'sisi',face:'happy',text:"No crime family, no taxis, no hard hats. Just balloons, mountains and green chile. Vacation mode: ON."},
  {bg:'scenes/lair_map',who:'sandy',face:'alarmed',dark:true,text:"Vacation mode... paused. Three men in purple tracksuits just checked into your hotel. Gold B.B.B. pins."},
  {bg:'scenes/lair_map',who:'coco',face:'surprised',dark:true,text:"Baldey's own stooges? They followed us four hundred miles?!"},
  {bg:'scenes/lair_map',who:'sandy',face:'thinking',dark:true,text:"Lefty, Knuckles and Meatball. And they are meeting a local balloon tour boss called Baron Blowhard. The family reaches all the way to New Mexico."},
  {bg:'scenes/rooftop',who:'sisi',face:'determined',dark:true,text:"Then we take care of it here. First stop: the Sandia Peak Tram. They're riding it right now."},
  {bg:'scenes/rooftop',who:'coco',face:'determined',dark:true,text:"Watches on. Agents Coco and Sisi, on vacation... sort of."}]},
 {key:'abq_done',when:()=>!!SAVE.done.aq3,pages:[
  {bg:'scenes/lair_map',who:'sandy',face:'proud',text:"The Baron is grounded, the stooges are wrapped up in balloon fabric, and the police have the logbook. Nice flying."},
  {bg:'scenes/lair_map',who:'sisi',face:'smirk',text:"Best. Vacation. Ever. Also I still want a sopaipilla."},
  {bg:'scenes/barros',who:'coco',face:'determined',text:"Every flight said 'Report to B.B.B. in Phoenix.' Baldey is getting nervous. Let's go home and finish this."}]});

// ---------- music: every level, boss and screen gets its own groove ----------
(function(){const R='................';
 track('city_abq','Rio Grande Groove','Albuquerque city map. Sunny high-desert funk: twangy wah, slap bass and a whistled road-trip hook.',
  {bpm:102,swing:.16,prog:[['A','9'],['A','9'],['D','13'],['D','13'],['A','9'],['F#','m9'],['B','m9'],['E','13']],
   drums:{A:dr(DR.pocket,{t:'.x.x.x.x.x.x.x.x'}),F:DR.pocketF},dseq:'AAAF',
   bass:['0-.o..0.7.a.o.7.','0-.o..0.4.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],
   comp:[{i:'wah',h:'..x.g.x...x.g.x.',v:.6},{i:'stab',o:12,h:[R,R,R,'..........x..x-.']}],
   lead:{i:'whistle',at:4,mel:'C#5/2 E5/2 F#5/4 E5/2 C#5/2 B4/4  A4/2 B4/2 C#5/2 E5/2 D5/8  C#5/2 B4/2 A4/2 F#4/2 A4/4 B4/4  G#4/4 B4/2 E5/2 D5/8'},pad:{v:.5}});
 track('cm_aq1','Cable Car Strut','Sandia Peak Tram. A climbing, clanky funk: cowbell on the cable, clav and brass that rise with the car.',
  {bpm:110,swing:.12,prog:[['E','m9'],['E','m9'],['G','13'],['A','9'],['E','m9'],['C','maj7'],['D','9'],['B','7s9']],
   drums:{A:dr(DR.drive,{n:'....x.......x...'}),F:DR.driveF},dseq:'AAAF',
   bass:['0.o.0.7.a.0.o.7.','0.o.0.7.a.0.3.5.','0.o.0.7.a.0.o.7.','0.o.0x7.a.4.5.7.'],
   comp:[{i:'clav',h:'..x.g.x...x.g.x.',v:.65},{i:'stab',o:12,h:['........x..x....','................']}],
   lead:{i:'brass',at:4,mel:'E5/2 G5/2 A5/4 B5/2 A5/2 G5/4  E5/2 D5/2 B4/4 D5/8  E5/2 G5/2 B5/4 D6/2 B5/2 A5/4  F#5/4 A5/4 B5/8'}});
 track('aq1_boss','Knuckle Sandwich','Knuckles on the tram roof. Heavy, stompy funk: big kick, horn hits and a growly bass.',
  {bpm:116,swing:.1,prog:[['C','m9'],['C','m9'],['Ab','maj7'],['G','7s9']],
   drums:{A:dr(DR.heavy,{}),F:DR.heavyF},dseq:'AAAF',bassI:'sub',
   bass:['0-.o..0.7.a.o.7.','0-.o..0.3.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],
   comp:[{i:'stab',h:'x..x..x.....x.x-',v:.7},{i:'organ',h:'..x-......x-....',v:.5}],
   lead:{i:'brass',at:2,mel:'C5/2 Eb5/2 F5/2 G5/2 Bb5/4 G5/4  Ab5/2 G5/2 F5/2 Eb5/2 D5/8'}});
 track('cm_aq2','Powder Pocket','Sandia Ski Run. Fast, bright downhill funk: sleigh-bell hats, synth bass and a whistle that slaloms.',
  {bpm:124,swing:.08,prog:[['D','maj9'],['B','m9'],['G','maj7'],['A','13']],
   drums:{A:dr(DR.disco,{}),F:DR.discoF},dseq:'AAAF',bassI:'synth',
   bass:['0.o.0.7.a.0.o.7.','0.o.0.7.a.0.3.5.','0.o.0.7.a.0.o.7.','0.o.0x7.a.4.5.7.'],
   comp:[{i:'arp',a:'bell',h:'x.x.x.x.x.x.x.x.',v:.45},{i:'ep',h:'..x-......x-....',v:.45}],
   lead:{i:'whistle',at:4,mel:'F#5/2 A5/2 B5/2 D6/2 C#6/4 A5/4  B5/2 A5/2 F#5/4 E5/8  F#5/2 A5/2 D6/4 E6/2 D6/2 B5/4  A5/4 C#6/4 D6/8'},pad:{v:.5}});
 track('aq2_chase','Snowmobile Shuffle','Lefty on the snowmobile. The ski groove kicks into overdrive: engine-buzz bass and alarm horns.',
  {bpm:132,swing:.06,prog:[['B','m9'],['B','m9'],['G','maj7'],['F#','7s9']],
   drums:{A:dr(DR.drive,{n:'x.......x.......'}),F:DR.driveF},dseq:'AAAF',bassI:'synth',
   bass:['0.o.0.o.0.7.a.7.','0.o.0.o.0.3.5.7.','0.o.0.o.0.7.a.7.','0.o.0xo.0.4.5.7.'],
   comp:[{i:'stab',h:'x..x..x...x..x..',v:.6},{i:'wah',h:'..x...x...x...x.',v:.45}],
   lead:{i:'synth',at:2,mel:'F#5/2 A5/2 B5/2 D6/2 C#6/4 B5/4  A5/2 F#5/2 E5/2 C#5/2 D5/8'}});
 track('cm_aq3','Hot Air Hustle','Balloon Fiesta. Floaty, sunny-morning funk: burner-whoosh pads, Rhodes and a soaring theremin.',
  {bpm:98,swing:.18,prog:[['F','maj9'],['D','m9'],['Bb','maj7'],['C','13'],['F','maj9'],['A','m9'],['Bb','maj7'],['C','7s9']],
   drums:{A:dr(DR.lounge,{r:'...x.......x....'}),F:DR.loungeF},dseq:'AAAF',
   bass:['0-....7-..o.7.4.','0-....7-..o.a.7.','0-....7-..o.a.7.','0-..x.7-..o.a.4.'],
   comp:[{i:'ep',h:'..x-.......x--..',v:.75},{i:'stab',o:12,h:[R,R,R,'..........x.x-..']}],
   lead:{i:'theremin',at:4,mel:'A5/4 C6/2 D6/2 C6/4 A5/4  G5/2 A5/2 F5/4 D5/8  F5/2 A5/2 C6/4 E6/4 D6/4  C6/4 Bb5/4 G5/8'},pad:{i:'choir',v:.55}});
 track('aq3_boss','Blowhard Boogie','Baron Blowhard\'s giant balloon. Pompous, puffed-up funk: tuba bass, organ and a marching-band horn line.',
  {bpm:108,swing:.2,prog:[['G','m9'],['G','m9'],['Eb','maj7'],['D','7b9']],
   drums:{A:{k:'X..x..X...X..x..',s:'..g.X.g..g..X.gg',h:'x.x.x.x.x.x.x.x.',l:'......x.....x...'},F:{k:'X..x..X...X.....',s:'..g.X.g..g..XXXX',h:'x.x.x.x.x.x.....',l:'x.....x...x.x...'}},dseq:'AAAF',
   bassI:'tuba',bass:['0-.7-.o-.7-.4.5.','0-.7-.o-.7-.a.9.','0-.7-.o-.7-.4.3.','0-.7-.o.x7..4.2.'],
   comp:[{i:'organ',h:'....x-......x-..',v:.55},{i:'stab',o:12,h:['x.......x.x.....',R]}],
   lead:{i:'brass',at:2,mel:'G5/2 Bb5/2 D6/4 C6/2 Bb5/2 A5/4  Bb5/2 A5/2 G5/2 F#5/2 G5/8'}});
 track('abq_story','Road Trip Funk','Albuquerque story scenes. Windows-down groove for the drive: Rhodes, handclaps and a lazy whistle.',
  {bpm:94,swing:.2,prog:[['E','9'],['A','13'],['E','9'],['B','7s9']],
   drums:{A:dr(DR.pocket,{c:'....x.......x...'}),F:DR.pocketF},dseq:'AAAF',
   bass:['0-.o..0.7.a.o.7.','0-.o..0.4.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],
   comp:[{i:'ep',h:'x-......x-......',v:.6},{i:'wah',h:'..x...x...x.x...',v:.45}],
   lead:{i:'whistle',at:4,mel:'G#5/2 B5/2 C#6/4 B5/2 G#5/2 E5/4  F#5/2 G#5/2 B5/4 A5/8'}});})();
// story beats for this city play over the road-trip groove
const _mkStoryAQ=makeStory;
makeStory=function(beat,done){const S=_mkStoryAQ(beat,done);if(beat.key&&beat.key.startsWith('abq')){S.enter=function(){startMusic('abq_story');};const n=S.next;S.next=function(){const i=S.i;n();if(S.i!==i&&S.name==='story')startMusic('abq_story');};}return S;};

// ---------- Baldey's stooges (code-drawn: purple tracksuits, gold chains, shades) ----------
const STOOGE_LOOK=[{name:'LEFTY',hat:'beanie',col:'#7a3ad8',skin:'#e8b58a',hair:'#2a1408'},
 {name:'KNUCKLES',hat:'bald',col:'#5a2aa8',skin:'#d8a070',hair:'#2a1408'},
 {name:'MEATBALL',hat:'cap',col:'#9a4ae8',skin:'#f0c090',hair:'#5a2a10'}];
function drawStoogeBody(c,e,look,flash,wind,walk){c.lineWidth=2.5;c.strokeStyle='#150a20';
 const suit=flash?'#fff':look.col,fat=look.hat==='cap'?5:0;
 c.fillStyle=flash?'#fff':'#3a1a6a';c.fillRect(-9,-18,8,18+walk*.3);c.fillRect(2,-18,8,18-walk*.3);c.strokeRect(-9,-18,8,18+walk*.3);c.strokeRect(2,-18,8,18-walk*.3);
 c.fillStyle='#fff';c.fillRect(-8,-18,2,16);c.fillRect(7,-18,2,16);                 // tracksuit stripes
 c.fillStyle='#111';c.fillRect(-11,-3,10,4);c.fillRect(1,-3,11,4);                  // shoes
 c.fillStyle=suit;c.beginPath();c.roundRect(-15-fat,-50,30+fat*2,34,8);c.fill();c.stroke();
 c.fillStyle='#fff';c.fillRect(-15-fat,-44,3,26);c.fillRect(12+fat,-44,3,26);
 c.strokeStyle='#ffd23a';c.lineWidth=2.5;c.beginPath();c.arc(0,-48,8,.2,Math.PI-.2);c.stroke();c.fillStyle='#ffd23a';c.fillRect(-3,-42,6,6); // gold chain + B pin
 c.strokeStyle='#150a20';c.lineWidth=2.5;
 c.fillStyle=flash?'#fff':look.skin;c.beginPath();c.arc(0,-62,13+fat*.4,0,7);c.fill();c.stroke();
 c.fillStyle='#111';c.fillRect(-9,-67,18,5);c.fillRect(-1,-66,2,2);                  // shades
 c.fillStyle='#2a1408';c.fillRect(-5,-56,10,2);
 if(look.hat==='beanie'){c.fillStyle=wind?'#ff2a2a':'#2a1a4a';c.beginPath();c.arc(0,-68,13,Math.PI,0);c.fill();c.stroke();c.fillRect(-14,-70,28,5);c.strokeRect(-14,-70,28,5);c.fillStyle='#ffd23a';c.beginPath();c.arc(0,-82,3,0,7);c.fill();}
 else if(look.hat==='cap'){c.fillStyle=wind?'#ff2a2a':'#ffd23a';c.beginPath();c.arc(0,-69,12,Math.PI,0);c.fill();c.stroke();c.fillRect(0,-71,18,4);c.strokeRect(0,-71,18,4);}
 else{c.fillStyle=wind?'#ff8a8a':'rgba(255,255,255,.35)';c.beginPath();c.ellipse(-4,-71,5,2.5,0,0,7);c.fill();}  // bald shine
 let ang=-0.5;if(e.wind>0)ang=-2.1;if(e.swing>0)ang=1.2;c.save();c.translate(12,-40);c.rotate(ang);c.fillStyle=look.skin;c.fillRect(0,-4,16,8);c.strokeRect(0,-4,16,8);
 c.fillStyle='#ffd23a';c.beginPath();c.arc(18,0,5,0,7);c.fill();c.stroke();c.restore();}   // gold-ringed fist
// v0.39: Michael's stooge sheets (walk, punch, ouch, KO, parachute). Falls back to the code-drawn stooge if not loaded.
function drawStoogeArt(e,L,bs,x){const set=ABQ_STOOGE[e.look||0];if(typeof abqImg!=='function'||!abqImg(set))return false;
 const s=bs*(e.look===1?.82:.88),moved=Math.abs(e.x-(e._px!=null?e._px:e.x))>.05;e._px=e.x;let f,al=1,rot=0;
 if(e.ob)f=16+Math.floor(TIME*6+(e.seed||0))%4;
 else if(e.dead){f=e.dead<.12?12:e.dead<.26?13:Math.floor(TIME*4)%2?15:14;al=Math.max(0,1.4-e.dead);}
 else if(e.hurt>0)f=Math.floor(TIME*10)%2?9:8;
 else if(e.stagger>0)f=10;
 else if(e.swing>0)f=6;
 else if(e.wind>0)f=e.windT&&e.wind<e.windT*.5?5:4;
 else if(e.air)f=12;
 else if(moved)f=Math.floor(TIME*8+(e.seed||0))%4;
 else f=11;
 const q=e.sq>0&&!e.dead?e.sq/.15:0;
 if(e.ob)rot=Math.sin(TIME*3+(e.seed||0))*.2;
 abqDraw(set,f,x,e.y+(e.ob?0:2),s*(1+.1*q),e.face<0,al,rot);
 if(e.ob)text('WAAAH!',x,e.y-150*bs,11,'#fff','center');
 if(e.zip&&e.y<L.gy-4){ctx.strokeStyle='#222';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,e.y-90*bs);ctx.stroke();}
 if(e.wind>0&&!e.dead&&Math.floor(TIME*12)%2===0)text('!',x,e.y-108*bs,20,'#ff3a3a','center');
 return true;}
function drawStooge(e,L,sc){const look=STOOGE_LOOK[e.look||0],bs=sc||1,x=e.x-L.cam;if(x<-140||x>W+140)return;
 if(drawStoogeArt(e,L,bs,x))return;
 const q=e.sq>0&&!e.dead?e.sq/.15:0;ctx.save();ctx.translate(x,e.y);
 if(e.ob){// knocked overboard: floats away under a purple parachute
  const sw=Math.sin(TIME*3+e.seed)*.2;ctx.rotate(sw);ctx.strokeStyle='#150a20';ctx.lineWidth=1.5;ctx.fillStyle='#b05aff';
  ctx.beginPath();ctx.arc(0,-120,34,Math.PI,0);ctx.fill();ctx.stroke();ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.arc(0,-120,12,Math.PI,0);ctx.fill();
  ctx.beginPath();ctx.moveTo(-34,-120);ctx.lineTo(-10,-60);ctx.moveTo(34,-120);ctx.lineTo(10,-60);ctx.stroke();
  ctx.scale(e.face*bs*.9,bs*.9);drawStoogeBody(ctx,e,look,false,false,Math.sin(TIME*20)*4);ctx.restore();text('WAAAH!',x,e.y-170,11,'#fff','center');return;}
 ctx.scale(e.face*bs*(1-.15*q),bs*(1+.12*q));
 if(e.dead){ctx.rotate(Math.min(e.dead*3,1.5)*-1);ctx.globalAlpha=Math.max(0,1.2-e.dead);}
 drawStoogeBody(ctx,e,look,e.hurt>0,e.wind>0&&(Math.floor(TIME*14)%2===0),Math.sin(TIME*10+e.seed)*3);ctx.restore();
 if(e.zip&&e.y<L.gy-4){ctx.strokeStyle='#222';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,e.y-80*bs);ctx.stroke();}
 if(e.wind>0&&!e.dead&&Math.floor(TIME*12)%2===0)text('!',x,e.y-100*bs,20,'#ff3a3a','center');}
class Stooge extends Walker{constructor(o){super(o);this.sheet=null;this.look=o.look!=null?o.look:Math.floor(hsh(o.seed*3.1+o.x)*3);this.hp=o.hp||3;this.maxhp=this.hp;}
 draw(L){drawStooge(this,L,1);}}
class StoogeLobber extends Thrower{constructor(o){super(o);this.sheet=null;this.look=o.look!=null?o.look:2;this.hp=o.hp||2;this.maxhp=this.hp;}
 draw(L){drawStooge(this,L,.95);}}
// Knuckles: Baldey's biggest stooge. Punches, belly-bounces (shockwaves: jump them!) and whistles for backup.
class Knuckles extends Boss{
 constructor(o){super(o);this.look=1;this.mode='walk';this.mt=1.4;this.hh=150;this.hw=40;this.shotW=40;this.called=0;this.zip=true;}
 think(dt,L,tgt,dx,al){const r=this.hp/this.maxhp,spd=r<.35?1.3:1;this.mt-=dt*spd;
  if(this.y<L.gy-2&&this.mode!=='bounce')return;   // still sliding down the cable
  this.zip=false;
  if(r<=.5&&!this.called){this.called=1;L.float(this.x,this.y-200,'"LEFTY! MEATBALL! HELP!"','#c77dff');
   for(const s of [-1,1]){const e=makeEnemy({type:'stooge',x:320+s*200,y:-80,seed:90+s});e.act=true;e.zip=true;L.enemies.push(e);}}
  if(this.mode==='walk'){this.face=dx>0?1:-1;if(Math.abs(dx)>70)this.x+=this.face*85*spd*dt;
   if(Math.abs(dx)<80&&this.mt<.6){this.mode='punch';this.wind=this.windT=.5;this.mt=.5;}
   else if(this.mt<=0){this.mode='bounce';this.wind=this.windT=.55;this.mt=.55;}}
  else if(this.mode==='punch'){if(this.mt<=0){this.swing=.25;SFX.hit();for(const p of al)if(Math.abs(p.x-(this.x+this.face*60))<55&&Math.abs(p.y-this.y)<60)L.dmgPlayer(p,1,this.x);this.mode='walk';this.mt=1.3;}}
  else if(this.mode==='bounce'){if(this.mt<=0&&!this.air){this.air=1;this.vy=-640;this.vx=(tgt.x-this.x)*1.1;}
   if(this.air&&this.vy>0&&this.y>=L.gy-1){this.air=0;this.vx=0;this.mode='walk';this.mt=r<.35?1.2:1.8;L.addShake(.6);SFX.smash();L.dust(this.x,L.gy,12);
    L.waves.push({x:this.x,y:L.gy,v:-240,life:1.5},{x:this.x,y:L.gy,v:240,life:1.5});if(r<.35)L.waves.push({x:this.x,y:L.gy,v:-360,life:1},{x:this.x,y:L.gy,v:360,life:1});}}
  this.x=Math.max(70,Math.min(570,this.x));}
 onHit(dir,fin){if(this.air)return;super.onHit(dir,fin);}
 draw(L){drawStooge(this,L,1.75);if(this.x-L.cam>=-120&&this.x-L.cam<=W+120)this.drawBar();}}
Object.assign(ENEMY_TYPES,{stooge:Stooge,stooge_lob:StoogeLobber,knuckles:Knuckles});

// ---------- the tram: theme ----------
function skyGrad(a,b,c){const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,a);g.addColorStop(.6,b);g.addColorStop(1,c);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);}
THEMES.sandia_tram={
 bg(L){const T=L.tram||{p:0},p=T.p,GY=L.gy,sw=T.sway||0;
  skyGrad('#3a5ad8','#8ab8ff','#ffd2a0');
  // far mesa + city lights far below (sink as we climb)
  ctx.fillStyle='#c28aa0';ctx.beginPath();ctx.moveTo(0,300+p*160);for(let x=0;x<=W;x+=40)ctx.lineTo(x,290+p*160-18*Math.sin(x*.02));ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
  ctx.fillStyle='#e8c8a0';ctx.fillRect(0,340+p*160,W,H);
  for(let i=0;i<40;i++){const x=(hsh(i)*W),y=350+p*160+hsh(i+7)*120;ctx.fillStyle=i%3?'#fff8c0':'#9ad0ff';ctx.fillRect(x,y,3,3);}
  // the Sandia face sliding past on the right (watermelon pink cliffs)
  const off=(p*1400)%480;
  ctx.fillStyle='#b8567a';ctx.beginPath();ctx.moveTo(W,0);ctx.lineTo(440,0);
  for(let y=0;y<=H;y+=24){const k=y+off,ridge=430+40*Math.sin(k*.013)+22*Math.sin(k*.051);ctx.lineTo(ridge+p*40,y);}ctx.lineTo(W,H);ctx.fill();
  ctx.strokeStyle='#8a3a5a';ctx.lineWidth=3;for(let y=-480;y<H;y+=60){const yy=y+off;ctx.beginPath();ctx.moveTo(500,yy);ctx.lineTo(560,yy-40);ctx.stroke();}
  for(let i=0;i<14;i++){const yy=((i*71+off*1.2)%560)-40,x=520+hsh(i)*110;ctx.fillStyle='#2e6e50';ctx.beginPath();ctx.moveTo(x,yy-14);ctx.lineTo(x-7,yy+4);ctx.lineTo(x+7,yy+4);ctx.fill();}
  // tower passing (steel lattice) when T.towerY is set
  if(T.towerY!=null){const ty=T.towerY,tx=250;ctx.strokeStyle='#4a4a5a';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(tx-40,ty+400);ctx.lineTo(tx-10,ty);ctx.moveTo(tx+40,ty+400);ctx.lineTo(tx+10,ty);ctx.stroke();
   ctx.lineWidth=3;for(let k=0;k<8;k++){const y1=ty+k*50,y2=y1+50,a=10+k*3.75,b=10+(k+1)*3.75;ctx.beginPath();ctx.moveTo(tx-a,y1);ctx.lineTo(tx+b,y2);ctx.moveTo(tx+a,y1);ctx.lineTo(tx-b,y2);ctx.stroke();}
   rrect(tx-70,ty-12,140,16,4,'#5a5a6a','#222',2);}
  // the haul cable through the grip
  ctx.strokeStyle='#1a1a22';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-20,150+120);ctx.lineTo(W+20,150-120);ctx.stroke();
  ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-20,166+120);ctx.lineTo(W+20,166-120);ctx.stroke();
  ctx.save();ctx.translate(W/2,GY);ctx.rotate(sw*.04);
  // hanger arm + grip
  ctx.fillStyle='#6a6a7a';ctx.strokeStyle='#15151e';ctx.lineWidth=3;ctx.fillRect(-8,-210,16,150);ctx.strokeRect(-8,-210,16,150);rrect(-30,-222,60,20,6,'#8a8a9a','#15151e',3);
  // car body (roof is the arena at GY)
  rrect(-290,0,580,130,18,'#d8203a','#15151e',4);ctx.fillStyle='#f2f2f2';ctx.fillRect(-290,6,580,10);
  for(let k=0;k<6;k++){const x=-262+k*90;rrect(x,28,72,52,8,'#9ad8ff','#15151e',3);ctx.fillStyle='rgba(30,30,60,.5)';ctx.beginPath();ctx.arc(x+24,72,10,Math.PI,0);ctx.arc(x+50,74,9,Math.PI,0);ctx.fill();}
  rrect(-300,-6,600,12,6,'#bfbfcf','#15151e',3);   // roof rim
  ctx.restore();},
 platform(L,p,x){rrect(x,p[1],p[2],L.gy-p[1],6,'#9a9aaa','#15151e',3);ctx.fillStyle='#ffd23a';for(let k=6;k<p[2]-6;k+=16)ctx.fillRect(x+k,p[1]+4,8,4);}};
// v0.39: painted backdrop, cliff, passing cabin, tower and terminals from Michael's tram sheets (code art stays as the fallback)
{const _bg=THEMES.sandia_tram.bg;
 THEMES.sandia_tram.bg=function(L){const bd=abqImg('tram_backdrop');if(!bd)return _bg.call(this,L);
  const T=L.tram||{p:0},p=T.p,GY=L.gy,sw=T.sway||0;
  ctx.drawImage(bd,-40,-60+p*60,720,540);
  // the second cabin passes us going down, mid-climb
  if(p>.4&&p<.6){const k=(p-.4)/.2;abqDraw('tram_props',1,96,-140+k*760,1.5);}
  // terminals and the mountain under the car: they slide down out of view as we climb
  const piece=(n,at)=>{const A=ABQ_ART[n],by=H+(p-at)*3000;if(A&&by>0&&by-A.h<H)ctx.drawImage(abqImg(n),0,by-A.h,A.w,A.h);};
  piece('tram_ground_lower',0);piece('tram_ground_bridge',.5);piece('tram_ground_overlook',.76);piece('tram_ground_upper',1);
  // the Sandia cliff face sliding past on the right
  const cl=abqImg('tram_cliff'),C=ABQ_ART.tram_cliff;if(cl&&C){const off=(p*1400)%C.h;for(let y=off-C.h;y<H;y+=C.h)ctx.drawImage(cl,W-200+p*30,y,C.w,C.h+1);}
  // tower saddle
  if(T.towerY!=null&&!abqDraw('tram_props',2,250,T.towerY+520,5)){}
  // haul cable, hanger, bull wheel on the grip, car body (the roof is the arena at GY)
  ctx.strokeStyle='#1a1a22';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-20,270);ctx.lineTo(W+20,30);ctx.stroke();
  ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-20,286);ctx.lineTo(W+20,46);ctx.stroke();
  ctx.save();ctx.translate(W/2,GY);ctx.rotate(sw*.04);
  ctx.fillStyle='#6a6a7a';ctx.strokeStyle='#15151e';ctx.lineWidth=3;ctx.fillRect(-8,-210,16,150);ctx.strokeRect(-8,-210,16,150);
  abqDraw('tram_props',3,0,-188,.55,false,1,p*40);
  rrect(-290,0,580,130,18,'#d8203a','#15151e',4);ctx.fillStyle='#f2f2f2';ctx.fillRect(-290,6,580,10);
  for(let k=0;k<6;k++){const x=-262+k*90;rrect(x,28,72,52,8,'#9ad8ff','#15151e',3);ctx.fillStyle='rgba(30,30,60,.5)';ctx.beginPath();ctx.arc(x+24,72,10,Math.PI,0);ctx.arc(x+50,74,9,Math.PI,0);ctx.fill();}
  rrect(-300,-6,600,12,6,'#bfbfcf','#15151e',3);
  ctx.restore();};
 const _pf=THEMES.sandia_tram.platform;
 // the box on the roof is two strapped-down crates
 THEMES.sandia_tram.platform=function(L,pl,x){if(!abqImg('tram_props'))return _pf.call(this,L,pl,x);const h=L.gy-pl[1];
  const cw=pl[2]/2;abqDrawRect('tram_props',14,x,pl[1]-4,cw+2,h+4);abqDrawRect('tram_props',14,x+cw-2,pl[1]-4,cw+2,h+4);};}

// ---------- the tram: level runner (makeLevel + waves, towers, overboard knock-offs, altitude) ----------
function tramify(L,def){const D=def.tram,T={p:0,wi:0,active:false,halt:false,coinT:5,tw:0,warn:0,sway:0,towerY:null,ob:0,done:0};L.tram=T;L.cluesTotal=3;L.minCam=0;
 const GY=L.gy,ALT0=6559,ALT1=10378;
 const spawnWave=w=>{T.active=true;w.list.forEach((t,k)=>{const side=k%2?1:-1,x=320+side*(110+hsh(T.wi*7+k)*140);
  const e=makeEnemy(Object.assign({type:t,x,y:-60-k*70,seed:T.wi*10+k},t==='stooge_lob'?{cd:1.4+k*.3}:{}));e.act=true;e.zip=true;L.enemies.push(e);});
  L.float(320,GY-170,w.msg||'STOOGES INCOMING!','#c77dff');SFX.hurt();};
 const _hurt=L.hurtEnemy;
 L.hurtEnemy=function(e,d,dir,fin){const was=e.dead;_hurt(e,d,dir,fin);
  if(!e.boss&&!e.ob&&fin&&(e.x<150||e.x>490)&&(e.x<320?dir<0:dir>0)){if(!was&&!e.dead){e.dead=1;L.kills++;e.onDeath(L);}e.ob={vx:dir*170,vy:-260};T.ob++;
   L.float(e.x,e.y-120,'OVERBOARD!','#7ff');for(let k=0;k<3;k++)L.items.push({k:'coin',x:320+(k-1)*40,y:GY-60,got:false});}};
 const _fin=L.finish;L.finish=function(win){_fin(win);if(win&&typeof lv==='function'&&T.ob>=6)lv('aq1').overboard=1;};
 const _upd=L.update;
 L.update=function(dt){_upd(dt);if(L.state!=='play'||L.paused||L.hitstop>0)return;
  for(const p of L.players)p.x=Math.max(46,Math.min(594,p.x));
  for(const e of L.enemies){if(e.ob){e.x+=e.ob.vx*dt;e.y+=e.ob.vy*dt;e.ob.vy=Math.min(90,e.ob.vy+420*dt);continue;}if(!e.dead)e.x=Math.max(50,Math.min(590,e.x));if(e.zip&&e.y>=GY-1)e.zip=false;}
  const live=L.enemies.filter(e=>!e.dead&&!e.boss).length;
  if(T.active&&live===0){T.active=false;const w=D.waves[T.wi-1];L.float(320,GY-170,'ROOF CLEAR! TRAM MOVING','#7f7');playStinger('unlock');
   if(w.clue!=null)L.items.push({k:'clue',i:AQ_C1+w.clue,x:320,y:GY-70,got:false});if(w.pizza)L.items.push({k:'pizza',x:200,y:GY-40,got:false});}
  T.halt=T.active;
  if(!T.halt&&!L.bossLock)T.p=Math.min(1,T.p+dt/D.dur);
  const nw=D.waves[T.wi];if(nw&&T.p>=nw.at&&!T.active){T.wi++;spawnWave(nw);}
  // towers: warning, then the car bumps over the tower saddle
  const tw=D.towers[T.tw];if(tw!=null){const d=tw-T.p;if(d<.05&&!T.warn){T.warn=1;L.float(320,GY-200,'TOWER AHEAD! JUMP WHEN THE CAR BUMPS!','#ffd23a');}
   if(d<.05)T.towerY=-420+(1-d/.05)*400;
   if(d<=0){T.tw++;T.warn=0;T.sway=1;L.addShake(.7);SFX.smash();
    for(const p of L.players){if(p.down)continue;if(p.on){p.vx=(p.x<320?-1:1)*260;p.stun=.35;L.float(p.x,p.y-100,'WHOA!','#ff9ac0');}else{L.coins+=3;L.float(p.x,p.y-100,'NICE HOP! +$','#ffd23a');}}
    for(const e of L.enemies){if(e.dead||e.boss)continue;if(e.x<170||e.x>470){e.dead=1;L.kills++;e.ob={vx:(e.x<320?-1:1)*200,vy:-200};T.ob++;L.float(e.x,e.y-120,'OVERBOARD!','#7ff');}else{e.stagger=.6;e.vx=(e.x<320?-1:1)*200;}}}}
  if(T.towerY!=null){T.towerY+=dt*(T.halt?0:260);if(T.towerY>H+60)T.towerY=null;}
  T.sway=Math.max(0,T.sway-dt*.8);
  // Sandy's drone drops a coin arc while the car is moving
  if(!T.halt&&!L.bossLock){T.coinT-=dt;if(T.coinT<=0){T.coinT=8;const c0=100+hsh(T.p*99)*300;for(let k=0;k<5;k++)L.items.push({k:'coin',x:c0+k*36,y:GY-70-Math.sin(k/4*Math.PI)*70,got:false});}}
  {const cs=L.items.filter(i=>i.k==='coin'&&!i.got);if(cs.length>40){const drop=new Set(cs.slice(0,cs.length-40));L.items=L.items.filter(i=>!drop.has(i));}L.items=L.items.filter(i=>!(i.got&&i.k==='coin'));}
  // peak station: Knuckles slides down the cable
  if(T.p>=1&&!L.bossLock){L.bossLock=true;L.boss=makeEnemy(Object.assign({},def.boss,{y:-120}));L.boss.zip=true;L.enemies.push(L.boss);startMusic(bossMusic(def));L.float(450,GY-210,L.boss.label,L.boss.labelCol);}};
 const _draw=L.draw;
 L.draw=function(){_draw();
  if(L.state==='play'||L.state==='end'){const alt=Math.round(ALT0+(ALT1-ALT0)*T.p);rrect(W-118,60,108,40,8,'rgba(6,20,36,.85)','#ff7ab0',2);
   text('ALTITUDE',W-64,74,10,'#ff9ac0','center',null);text(alt.toLocaleString()+' ft',W-64,93,14,'#fff','center',null);
   rrect(W-14,110,6,240,3,'#1a2240',null);rrect(W-14,110+240*(1-T.p)-4,6,8,3,'#ffd23a',null);
   if(T.halt&&L.state==='play'&&Math.floor(TIME*3)%2===0)text('A STOOGE PULLED THE BRAKE! CLEAR THE ROOF!',W/2,H-12,12,'#ff9ac0','center');
   if(L.bossLock&&L.state==='play')text('PEAK STATION',W/2,128,16,'#ffd23a','center');
   for(const e of L.enemies)if(e.ob&&e.y<H+200)drawStooge(e,L,1);}};}
const _makeLevelAQ=makeLevel;
makeLevel=function(def,np){const L=_makeLevelAQ(def,np);if(def.type==='tram')tramify(L,def);return L;};

LEVEL_DEFS.aq1={id:'aq1',type:'tram',title:'ALBUQUERQUE: SANDIA PEAK TRAM',sub:'Sandia Mountains, NM  |  Sunset',
 width:640,groundY:360,theme:'sandia_tram',spawn:{x:250,gap:70},music:'cm_aq1',bossMusic:'aq1_boss',
 platforms:[[262,290,116]],
 tram:{dur:80,towers:[.36,.72],waves:[
  {at:.04,list:['stooge','stooge'],msg:'STOOGES ZIP-LINING IN!'},
  {at:.2,list:['stooge','stooge_lob','stooge'],clue:0,pizza:1},
  {at:.46,list:['stooge','stooge','stooge_lob'],msg:'MORE STOOGES!'},
  {at:.62,list:['stooge_lob','stooge','stooge','stooge'],clue:1,pizza:1},
  {at:.86,list:['stooge','stooge_lob','stooge','stooge_lob'],msg:'LAST STOP BEFORE THE PEAK!'}]},
 boss:{type:'knuckles',x:470,trigger:1e9,hp:24,name:'KNUCKLES',nameColor:'#c77dff',drop:AQ_C1+2,lock:false},
 intro:["Welcome to Albuquerque, agents. The Sandia Peak Tram climbs almost four thousand feet up the mountain.",
  "Baldey's stooges are riding it, and they're sliding down the cable onto the ROOF of your car. Don't let them stop the tram!",
  "When the roof is clear, the tram keeps climbing. Knock stooges near the edge with a combo finisher and they go OVERBOARD (with parachutes, don't worry).",
  "Two towers on the way: the car BUMPS when it passes one. Jump right then to keep your footing. Find 3 clues!"],
 introExpr:['happy','alarmed','smug','proud'],
 goal:'Clear the roof so the tram keeps climbing. Jump at the tower bumps!',
 winText:'KNUCKLES KNOCKED OUT!',
 outro:{lines:["Knuckles is snoring on the peak station deck. He had a lift ticket in his pocket.","Lefty just took the ski lift. He's heading DOWN the mountain. Grab some skis!"],expr:['proud','alarmed']},
 reward:{base:170,perClue:50,perKill:5,tips:30}};

// ---------- achievements ----------
if(typeof ACH!=='undefined'){const add=(id,n,d,c,cash,ok,p,h)=>{a(id,n,d,c,cash,ok,p,h);const x=ACH[ACH.length-1];x.tier=x.cash>=100?3:x.cash>=50?2:x.cash>=20?1:0;ACH_BY[id]=x;
  const i=ACH.findIndex(y=>y.id==='f_all');if(i>=0)ACH.push(ACH.splice(i,1)[0]);};
 [['aq1','Sandia Peak Tram','Peak Performer'],['aq2','Sandia Ski Run','Powder Hound'],['aq3','Balloon Fiesta','High Flyer']].forEach(([id,name,nick])=>{
  add('m_'+id+'_clear',nick,'Beat '+name+'.','mission',30,()=>!!SAVE.done[id]);
  add('m_'+id+'_clues',name+' Sleuth','Find every clue in '+name+'.','mission',30,()=>cluesTot(id)>0&&cluesIn(id)>=cluesTot(id),()=>[cluesIn(id),cluesTot(id)]);});
 add('m_aq1_ob','Man Overboard','Knock 6 stooges off the tram in one ride.','mission',40,()=>!!lv('aq1').overboard);
 add('m_aq2_air','Air Time','Land 10 ski tricks in one run.','mission',40,()=>!!lv('aq2').tricks);
 add('m_aq2_gates','Slalom Star','Pass 15 slalom gates in one run.','mission',40,()=>!!lv('aq2').gates);
 add('m_aq2_clean','Clean Run','Ski the whole mountain without crashing once.','mission',80,()=>!!lv('aq2').noHit,null,1);
 add('m_aq3_spike','Pin Cushion','Pop 8 stooge balloons with the basket spike in one flight.','mission',40,()=>!!lv('aq3').spikes);
 add('m_aq3_baron','Deflated','Finish Baron Blowhard with a spike drop.','mission',60,()=>!!lv('aq3').spikeFinish,null,1);
 add('city_aq_done','Land of Enchantment','Beat all three Albuquerque missions.','story',100,()=>['aq1','aq2','aq3'].every(i=>SAVE.done[i]));}

// ---------- Mission aq2: Sandia Ski Run (mode in js/ski.js) ----------
LEVEL_DEFS.aq2={id:'aq2',type:'ski',title:'ALBUQUERQUE: SANDIA SKI RUN',sub:'Sandia Peak Ski Area  |  Fresh powder',music:'cm_aq2',
 length:18000,chaseAt:.45,clue0:AQ_C2,finishName:'BASE LODGE',
 intro:["Lefty grabbed a snowmobile and is heading down the mountain with the lift receipts. Time to ski!",
  "LEFT and RIGHT turn your skis. Pointing straight down is fastest; sideways stops you. DOWN tucks for speed, UP brakes.",
  "JUMP hops over stumps and rocks. Blue RAMPS launch you: press ATTACK in the air for tricks, but finish spinning before you land!",
  "ATTACK on the snow throws a snowball. Pass between the slalom flags for cash. One clue is floating in the air off a ramp!"],
 introExpr:['alarmed','smug','wink','proud'],
 winText:'LEFTY HIT THE SNOWBANK!',
 outro:{lines:["Lefty's snowmobile is stuck nose-first in a snowbank. His phone and the lift receipt are ours.","Blowhard Balloon Tours paid for all of this. Tomorrow at sunrise is the Balloon Fiesta mass ascension. Let's fly."],expr:['laughing','thinking']},
 reward:{base:170,perClue:50,perKill:5,tips:30}};

// ---------- Mission aq3: Balloon Fiesta (mode in js/balloon.js) ----------
LEVEL_DEFS.aq3={id:'aq3',type:'balloon',title:'ALBUQUERQUE: BALLOON FIESTA',sub:'Mass ascension  |  Sunrise',music:'cm_aq3',bossMusic:'aq3_boss',
 length:9000,scroll:32,foeGap:300,bossHp:40,clue0:AQ_C3,
 intro:["Sunrise at the Balloon Fiesta: hundreds of balloons lifting off at once. The Baron's stooges are hiding among them.",
  "Hold JUMP to fire the burner and rise. Let go to sink, or press DOWN to vent and drop fast. The burner uses propane, so grab the tanks!",
  "ATTACK fires your BB gun (hold UP to aim up). Better: drop STRAIGHT DOWN onto a stooge balloon and the spike under your basket pops it.",
  "Keep climbing, the sky moves up with you. Baron Blowhard is waiting at the top in his giant purple balloon. Find 3 clues!"],
 introExpr:['happy','smug','wink','proud'],
 winText:'BARON BLOWHARD DEFLATED!',
 outro:{lines:["The Baron is floating down under a very small parachute, still yelling. Meatball is waving a white sock.","His logbook says every flight reports to B.B.B. in Phoenix. The family is spying on whole cities from the sky.","Albuquerque is safe. Time to go home, agents. Baldey's tower is waiting."],expr:['laughing','thinking','proud']},
 reward:{base:220,perClue:50,perKill:5,tips:40}};
