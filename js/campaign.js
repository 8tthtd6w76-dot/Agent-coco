// ===== Campaign: Valley Map -> City Maps -> levels, plus the List view (v0.19) =====
// The old single world map (MapScene) is now the whole campaign screen. It has three modes:
//   'valley'  the painted world map: pick a CITY (Gilbert, Downtown Phoenix, Tempe, Chandler, Baldey's Tower) or the Lair
//   'city'    one city's own map (tile-built art in assets/city/<id>.jpg, road in js/city_roads.js), levels are pins on the road
//   'list'    an organized list of every level, grouped by city tabs, with stars, clues and parts still to find
// SAVE.mapView = 'map' | 'list' picks what you see after the title (Extras > Level select style, or press Y on the map).
// go(MapScene) from anywhere (results, delivery, Watch "Quit to map") comes back to the city you were in.
//
// ADDING A LEVEL (any type): push a LEVELS entry with  city:'downtown'  and  kind:'stealth'  (see KINDS), plus its LEVEL_DEFS.
//   Main-path levels are spaced along the city's road in id order; the city's boss (kind:'boss') is always the last pin.
//   Bonus levels set  req:<id of a level in the same city>  (or bonus:true + after:<id>) and hang off the road on a little spur.
//   The first level of a new city should set req:<previous city's boss id> so it opens with the city.
//   Planned levels with no LEVEL_DEFS entry show as "Coming soon" pins.

const KINDS={
 action:{label:'Side-scroller',icon:'available'},
 rooftops:{label:'Rooftop run',icon:'chase_arrow'},
 chase:{label:'Chase',icon:'chase_arrow'},
 hack:{label:'Hack puzzle',icon:'hacking_chip'},
 stealth:{label:'Stealth',icon:'stealth_eye'},
 overhead:{label:'Overhead stealth',icon:'stealth_eye'},
 pursuit:{label:'Scooter pursuit',icon:'vehicle_scooter'},
 puzzle:{label:'Puzzle',icon:'puzzle'},
 wirecut:{label:'Wire Cut',icon:'puzzle'},
 boss:{label:'Boss fight',icon:'boss_construction'}};

const CITIES=[
 {id:'gilbert',name:'Gilbert',short:'GILBERT',boss:'Papa Johnny',industry:'Construction crew',col:'#ffb13a',vx:515,vy:238,music:'city_gilbert',home:true,
  bg:'#e8a368',code:null,hint:'Open from the start.'},
 {id:'downtown',name:'Downtown Phoenix',short:'DOWNTOWN PHX',boss:'Honky Tony',industry:'Taxi ring',col:'#ffd23a',vx:100,vy:88,music:'city_downtown',
  bg:'#d6a8aa',code:'HONKHONK',hint:'Beat Papa Johnny in Gilbert to open.'},
 {id:'tempe',name:'Tempe',short:'TEMPE',boss:'Stinky Pete',industry:'Garbage trucks',col:'#5ad1ff',vx:338,vy:95,music:'city_tempe',
  bg:'#ec9646',code:'TRASHDAY',avoid:[[140,112,510,200]],hint:'Beat Honky Tony in Downtown to open.'},
 {id:'chandler',name:'Chandler',short:'CHANDLER',boss:'Dr. Glitch',industry:'Chip factory',col:'#7ff0c0',vx:245,vy:235,music:'city_chandler',
  bg:'#ee964a',code:'CHIPCHIP',hint:'Beat Honky Tony in Downtown to open.'},
 {id:'tower',name:"Baldey's Tower",short:"BALDEY'S TOWER",boss:'Bigg Buff Baldey',industry:'The whole crime family',col:'#ff5ae0',vx:326,vy:34,music:'city_tower',
  bg:'#3c2656',code:'BIGGBUFF',hint:'Beat all four lieutenants to open.'}];
const CITY=Object.fromEntries(CITIES.map(c=>[c.id,c]));
const TERR_CITY={'Gilbert':'gilbert','Downtown Phoenix':'downtown','Tempe':'tempe','Chandler':'chandler',"Baldey's Tower":'tower','Tower':'tower'};
const CITY_CODES={};CITIES.forEach(c=>{if(c.code)CITY_CODES[c.code]=c.id;});
ASSET_LIST.push(...CITIES.map(c=>['city/'+c.id,'assets/city/'+c.id+'.jpg']));
SAVE.cityOpen=SAVE.cityOpen||{};if(!SAVE.mapView)SAVE.mapView='map';

// ---------- the campaign's levels ----------
// Gilbert (built): give the existing missions their city and type
const _K={1:'action',2:'rooftops',3:'chase',4:'hack',5:'boss',9:'stealth',10:'pursuit'};
LEVELS.forEach(l=>{if(_K[l.id])l.kind=_K[l.id];if(!l.city)l.city=TERR_CITY[l.terr]||'gilbert';});
// The old far-away placeholders (6, 7, 8) become the first mission of their cities
const _L6=LEVELS.find(l=>l.id===6),_L7=LEVELS.find(l=>l.id===7),_L8=LEVELS.find(l=>l.id===8);
if(_L6){_L6.kind='overhead';_L6.blurb='Downtown Phoenix, overhead stealth. Coming in a later build.';}
if(_L7){_L7.kind='action';_L7.blurb='Tempe Town Lake. Coming in a later build.';}
if(_L8){_L8.kind='action';_L8.blurb='Chandler chip factory. Coming in a later build.';}
// Planned slots ("Coming soon") so every city map has its full road of pins. Swap each for a real level when it is built.
function planned(id,city,kind,name,extra){LEVELS.push(Object.assign({id,city,kind,name:name||'Coming soon',terr:CITY[city].name,planned:1,
 blurb:name&&kind==='boss'?'Boss fight! Coming in a later build.':'A '+KINDS[kind].label.toLowerCase()+' mission. Coming in a later build.'},extra||{}));}
planned('dt2','downtown','overhead');planned('dt3','downtown','chase');planned('dt4','downtown','hack');
planned('dtb','downtown','wirecut',null,{bonus:1,after:'dt3'});planned('dt5','downtown','boss','Boss: Honky Tony');
planned('tp2','tempe','stealth');planned('tp3','tempe','pursuit');planned('tp4','tempe','puzzle');
planned('tpb','tempe','hack',null,{bonus:1,after:'tp3'});planned('tp5','tempe','boss','Boss: Stinky Pete');
planned('ch2','chandler','hack');planned('ch3','chandler','stealth');planned('ch4','chandler','chase');
planned('chb','chandler','puzzle',null,{bonus:1,after:'ch2'});planned('ch5','chandler','boss','Boss: Dr. Glitch');
planned('tw1','tower','stealth');planned('tw2','tower','action');planned('tw3','tower','hack');planned('tw4','tower','boss','Final Boss: Bigg Buff Baldey');

// ---------- helpers ----------
const cityOf=l=>l.city||TERR_CITY[l.terr]||'gilbert';
const isReal=l=>!!LEVEL_DEFS[l.id];
const kindOf=l=>KINDS[l.kind]||KINDS.action;
const pinIcon=l=>l.pin||(l.planned?kindOf(l).icon:(l.icon&&l.icon!=='locked'?l.icon:kindOf(l).icon));
function isBonus(l){if(l.bonus!=null)return !!l.bonus;if(l.req==null)return false;const r=LEVELS.find(x=>x.id===l.req);return !!r&&cityOf(r)===cityOf(l);}
function cityLevels(cid){const all=LEVELS.filter(l=>cityOf(l)===cid);
 const num=v=>typeof v==='number'?v:1e6;
 const main=all.filter(l=>!isBonus(l)).map((l,i)=>[l,i]).sort((a,b)=>(a[0].kind==='boss')-(b[0].kind==='boss')||num(a[0].id)-num(b[0].id)||a[1]-b[1]).map(a=>a[0]);
 const bonus=all.filter(isBonus);return {main,bonus,all:main.concat(bonus)};}
function cityBoss(cid){const m=cityLevels(cid).main;return m.find(l=>l.kind==='boss')||m[m.length-1];}
const bossBeaten=cid=>{const b=cityBoss(cid);return !!(b&&SAVE.done[b.id]);};
function cityOpen(cid){if(SAVE.testing||SAVE.cityOpen[cid])return true;
 if(cid==='gilbert')return true;if(cid==='downtown')return bossBeaten('gilbert');
 if(cid==='tempe'||cid==='chandler')return bossBeaten('downtown');
 if(cid==='tower')return ['gilbert','downtown','tempe','chandler'].every(bossBeaten);return false;}
function levelClues(id){let t=0,f=0;CLUES.forEach((c,i)=>{if(c.lvl===id){t++;if(SAVE.clues.includes(i))f++;}});return [f,t];}
function levelPartIds(id){const S=new Set(RARE.filter(r=>r.lvl===id).map(r=>r.id)),d=LEVEL_DEFS[id];
 if(d){(d.parts||[]).forEach(p=>S.add(p.id));if(d.boss&&d.boss.part)S.add(d.boss.part);if(d.dozerPart)S.add(d.dozerPart);if(d.part&&d.part.id)S.add(d.part.id);}
 return [...S].filter(p=>RARE.some(r=>r.id===p));}
function levelParts(id){const P=levelPartIds(id);return [P.filter(p=>SAVE.rare&&SAVE.rare[p]).length,P.length];}
function levelStars(l){const id=l.id,done=!!SAVE.done[id];if(!done)return 0;const [cf,ct]=levelClues(id),[pf,pt]=levelParts(id);
 const v=(SAVE.lv&&SAVE.lv[id])||{},flaw=!!(v.noHit||v.noOops||v.silent||v.perfect||v.unspotted);
 return 1+(ct===0||cf>=ct?1:0)+(pt>0?(pf>=pt?1:0):(flaw?1:0));}
function levelStatus(l){if(l.planned||!isReal(l))return 'soon';if(!cityOpen(cityOf(l)))return 'locked';if(SAVE.done[l.id])return 'done';return levelAvail(l)?'ready':'locked';}
function cityStats(cid){const L=cityLevels(cid).all,R=L.filter(isReal);let st=0,cf=0,ct=0,pf=0,pt=0;
 R.forEach(l=>{st+=levelStars(l);const c=levelClues(l.id),p=levelParts(l.id);cf+=c[0];ct+=c[1];pf+=p[0];pt+=p[1];});
 return {total:L.length,built:R.length,done:R.filter(l=>SAVE.done[l.id]).length,stars:st,maxStars:R.length*3,cf,ct,pf,pt};}
function drawStars(n,x,y,s,max=3){for(let i=0;i<max;i++)starShape(x+i*(s+3),y,s/2,i<n?'#ffd23a':'rgba(20,20,40,.75)',i<n?'#7a4a00':'#89a');}
function starShape(cx,cy,r,fill,stroke){ctx.beginPath();for(let k=0;k<10;k++){const a=-Math.PI/2+k*Math.PI/5,rr=k%2?r*.45:r;ctx.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=stroke;ctx.stroke();}

// ---------- city layout: pins along the baked road ----------
const _LAYOUT={};
function roadPts(cid){return (typeof CITY_ROADS!=='undefined'&&CITY_ROADS[cid])||[[40,390],[600,390]];}
function roadAt(cid,t){const P=roadPts(cid);if(!P._len){let L=0;P._cum=[0];for(let i=1;i<P.length;i++){L+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);P._cum.push(L);}P._len=L;}
 const d=Math.max(0,Math.min(1,t))*P._len;let i=1;while(i<P.length-1&&P._cum[i]<d)i++;const a=P[i-1],b=P[i],seg=(P._cum[i]-P._cum[i-1])||1,u=(d-P._cum[i-1])/seg;
 return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,nx:-(b[1]-a[1])/seg,ny:(b[0]-a[0])/seg,i};}
function cityLayout(cid){const key=cid+':'+LEVELS.length;if(_LAYOUT[key])return _LAYOUT[key];
 const C=CITY[cid],{main,bonus}=cityLevels(cid),nodes=[];const P=roadPts(cid);
 const t0=C.home?0.1:0.03,n=main.length;
 if(C.home)nodes.push(Object.assign({},LAIR,{x:P[0][0]+4,y:P[0][1]-2,home:1,t:0}));
 main.forEach((l,i)=>{const t=n<=1?1:t0+(1-t0)*i/(n-1),p=roadAt(cid,t);nodes.push({l,x:p.x,y:p.y,t});});
 const near=(x,y)=>{let m=1e9;for(let k=0;k<P.length;k+=3)m=Math.min(m,Math.hypot(P[k][0]-x,P[k][1]-y));return m;};
 bonus.forEach((l,j)=>{const anc=nodes.find(o=>o.l&&(o.l.id===(l.after!=null?l.after:l.req)))||nodes[Math.min(nodes.length-1,1+j)];
  const p=roadAt(cid,anc.t);let best=null;
  for(const dist of [74,64,90,56])for(const sg of [1,-1])for(const rot of [0,.5,-.5,1,-1]){const c=Math.cos(rot),s=Math.sin(rot),nx=(p.nx*c-p.ny*s)*sg,ny=(p.nx*s+p.ny*c)*sg;
   const x=anc.x+nx*dist,y=anc.y+ny*dist;if(x<28||x>W-28||y<70||y>H-120)continue;if((C.avoid||[]).some(a=>x>a[0]&&x<a[2]&&y>a[1]&&y<a[3]))continue;const cl=near(x,y);if(nodes.some(o=>Math.hypot(o.x-x,o.y-y)<46))continue;
   const sc=cl-Math.abs(rot)*8;if(!best||sc>best.sc)best={x,y,sc};}
  if(!best)best={x:anc.x+30,y:anc.y-60};
  nodes.push({l,x:best.x,y:best.y,bonus:1,ax:anc.x,ay:anc.y,t:anc.t});});
 return _LAYOUT[key]=nodes;}
// how far along the road the agents have cleared (for the glowing trail)
function cityTrailT(cid){let t=0;for(const o of cityLayout(cid))if(o.l&&!o.bonus&&SAVE.done[o.l.id])t=Math.max(t,o.t);return t;}

// ---------- music: every new screen gets its own groove ----------
(function(){if(typeof TR==='undefined')return;const R='................';
 TR.city_gilbert={title:'Cul-de-Sac Cruise',desc:'Gilbert city map. Sunny suburban strut: clav, slap bass and a whistled hook over sprinklers.',
  bpm:100,swing:.16,prog:[['D','9'],['D','9'],['G','13'],['G','13'],['D','9'],['B','m9'],['E','m9'],['A','13']],
  drums:{A:dr(DR.pocket,{t:'.x.x.x.x.x.x.x.x'}),F:DR.pocketF},dseq:'AAAF',
  bass:['0-.o..0.7.a.o.7.','0-.o..0.4.5.7.a.','0-.o..0.7.a.o.7.','0-.o.x0.4.7.a.o.'],
  comp:[{i:'clav',h:'..x.g.x...x.g.x.',v:.7},{i:'stab',o:12,h:[R,R,R,'..........x..x-.']}],
  lead:{i:'whistle',at:4,mel:'F#5/2 A5/2 B5/4 A5/2 F#5/2 E5/4  D5/2 E5/2 F#5/2 A5/2 G5/8  F#5/2 E5/2 D5/2 B4/2 D5/4 E5/4  C#5/4 E5/2 A5/2 G5/8'},pad:{v:.5}};
 TR.city_downtown={title:'Midnight Meter',desc:'Downtown Phoenix city map. Nighttime cop-show funk: wah guitar, taxi honks and a sly horn line.',
  bpm:98,swing:.2,prog:[['G','m9'],['G','m9'],['C','9'],['C','9'],['G','m9'],['Eb','maj7'],['D','7s9'],['D','7s9']],
  drums:{A:dr(DR.pocket,{n:'..............x.'}),F:dr(DR.pocketF,{n:'x.......x.......'})},dseq:'AAAF',
  bass:['0-.o.a.07.0-o.a.','0-.o.a.07.0.3.5.','0-.o.a.07.0-o.a.','0-.o.a.0x7.0.4.L'],
  comp:[{i:'wah',h:'..x-x...x-x.x...',v:.6},{i:'ep',h:'x-......x-......',v:.5}],
  lead:{i:'brass',at:4,mel:'D5/2 F5/2 G5/4 Bb5/2 A5/2 G5/4  F5/2 D5/2 C5/4 D5/8  Eb5/2 G5/2 Bb5/4 A5/2 G5/2 F5/4  F#5/4 A5/2 C6/2 Bb5/4 A5/4'}};
 TR.city_tempe={title:'Lakeside Lids',desc:'Tempe city map. Breezy lakeside second-line: tuba bass, trash-can lid backbeat, bright brass.',
  bpm:94,swing:.22,prog:[['F','7'],['Bb','9'],['F','7'],['C','9'],['F','7'],['Bb','9'],['C','9'],['F','7']],
  drums:{A:{k:'X..x..X...X..x..',s:'..g.X.g..g..X.gg',h:'x.x.x.x.x.x.x.x.',l:'......x.....x...'},F:{k:'X..x..X...X.....',s:'..g.X.g..g..XXXX',h:'x.x.x.x.x.x.....',l:'x.....x...x.x...'}},dseq:'AAAF',
  bassI:'tuba',bass:['0-.7-.o-.7-.4.5.','0-.7-.o-.7-.a.9.','0-.7-.o-.7-.4.3.','0-.7-.o.x7..4.2.'],
  comp:[{i:'organ',h:'....x-......x-..',v:.5},{i:'wah',h:'..x...x...x...x.',v:.45}],
  lead:{i:'brass',at:4,mel:'C5/2 F5/2 A5/3 G5/1 F5/2 D5/2 C5/4  D5/2 F5/2 Bb5/4 A5/2 F5/2 D5/4  E5/2 G5/2 Bb5/4 A5/2 G5/2 E5/4  F5/4 r/2 C5/2 F5/8'}};
 TR.city_chandler={title:'Circuit Cruise',desc:'Chandler city map. Smooth robot funk: rubber synth bass, bell arpeggios, glitchy hats.',
  bpm:104,swing:.08,prog:[['A','m9'],['A','m9'],['F','maj7'],['G','9'],['A','m9'],['A','m9'],['D','m9'],['E','7s9']],
  drums:{A:dr(DR.pocket,{z:R,g:'..x.......x...x.'}),F:dr(DR.pocketF,{z:R,g:'..x.x.x.x.x.x...'})},dseq:'AAAF',
  bassI:'synth',bass:['0..o.0o.7.0.a.o.','0..o.0o.7.0.3.5.','0..o.0o.7.0.b.o.','0..o.xo.4.7.a.o.'],
  comp:[{i:'arp',a:'bell',h:'x.x.x.x.x.x.x.x.',v:.5},{i:'ep',h:'..x-......x-....',v:.45}],
  lead:{i:'synth',at:4,mel:'E5/2 G5/2 A5/2 C6/2 B5/4 G5/4  A5/2 G5/2 E5/4 D5/2 E5/2 G5/4  F5/2 A5/2 C6/4 E6/4 D6/4  G#5/2 B5/2 E5/4 D5/4 B4/4'},pad:{v:.55}};
 TR.city_tower={title:'Top Floor Funk',desc:"Baldey's Tower map. Dark and slow but still groovy: sub bass, organ, choir and a theremin creeping up the stairs.",
  bpm:90,swing:.14,prog:[['D','m9'],['D','m9'],['Bb','maj7'],['A','7b9'],['D','m9'],['G','m9'],['Eb','maj7'],['A','7s9']],
  drums:{A:dr(DR.sneak,{m:'..........x.....'}),F:dr(DR.sneakF,{m:'..........x.x.x.'})},dseq:'AAAF',
  bassI:'sub',bass:['0-.o..0.36.7.oa7','0-.o..0.3.5.7.a.','0-.o..0.4.7.b.o.','0-.o.x0.4.7.a.o.'],
  comp:[{i:'organ',h:'..x-......x-....',v:.65},{i:'stab',o:12,h:[R,R,R,'x..x..x.....x.x-']}],
  lead:{i:'theremin',at:4,mel:'D5/4 F5/2 A5/2 G#5/4 G5/4  F5/2 G5/2 F5/2 D5/2 A4/8  Bb5/4 G5/4 Eb5/4 D5/4  C#5/4 E5/4 G5/2 Bb5/2 A5/4'},pad:{i:'choir',v:.65}};
 TR.campaign_list={title:'Case File Shuffle',desc:'Level list view. Light, tidy funk for flipping through case files: rim clicks, Rhodes, a little horn.',
  bpm:96,swing:.18,prog:[['C','maj9'],['A','m9'],['D','m9'],['G','13']],
  drums:{A:dr(DR.lounge,{r:'...x.......x....'}),F:DR.loungeF},dseq:'AAAF',
  bass:['0-....7-..o.7.4.','0-....7-..o.a.7.','0-....7-..o.a.7.','0-..x.7-..o.a.4.'],
  comp:[{i:'ep',h:'..x-.......x--..',v:.8},{i:'stab',o:12,h:[R,R,R,'..........x.x-..']}],
  lead:{i:'bell',at:2,v:.7,mel:'E5/2 G5/2 B5/4 A5/2 G5/2 E5/4  F5/2 A5/2 C6/4 B5/2 G5/2 D5/4'},pad:{v:.6}};
 if(typeof MUSIC_LIST!=='undefined')['city_gilbert','city_downtown','city_tempe','city_chandler','city_tower','campaign_list'].forEach(k=>MUSIC_LIST.push({name:k,title:TR[k].title,desc:TR[k].desc}));})();

// ---------- the campaign screen (MapScene) ----------
const VALLEY_NODES=()=>[Object.assign({},LAIR,{kind:'lair'}),...CITIES.map(c=>({kind:'city',c,x:c.vx,y:c.vy+22}))];
Object.assign(MapScene,{mode:'valley',city:'gilbert',sel:1,vsel:1,lsel:0,ltab:0,msg:'',msgT:0,t:0,
 // called from the title screen: start where the player likes it
 fromTitle(){this.mode=SAVE.mapView==='list'?'list':'valley';this.sel=1;this.vsel=Math.max(1,1+CITIES.findIndex(c=>c.id===this.city));return this;},
 enter(){this.t=0;if(!SAVE.firstDelivery&&!SAVE.testing){if(this.mode==='valley')this.vsel=0;else if(this.mode==='city'&&this.city==='gilbert')this.sel=0;}this.music();},
 resume(){this.music();},
 music(){startMusic(this.mode==='city'?CITY[this.city].music:this.mode==='list'?'campaign_list':'map');},
 setMode(m){this.mode=m;this.t=0;this.music();},
 nodes(){return this.mode==='city'?cityLayout(this.city):VALLEY_NODES();},
 dirNav(N,sel){const c=N[sel],dirs={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]};
  for(const d in dirs)if(anyPressed(d)){let best=-1,bs=1e9;N.forEach((n,i)=>{if(i===sel)return;const dx=n.x-c.x,dy=n.y-c.y,dot=dx*dirs[d][0]+dy*dirs[d][1];if(dot<=4)return;
   const sc=Math.hypot(dx,dy)+Math.abs(dx*dirs[d][1]-dy*dirs[d][0])*1.6;if(sc<bs){bs=sc;best=i;}});if(best>=0){sel=best;SFX.move();}}
  return sel;},
 say(m,t=2.6){this.msg=m;this.msgT=t;},
 tryStart(l){if(!l)return;const st=levelStatus(l);
  if(st==='soon'){SFX.hurt();this.say(l.name==='Coming soon'?KINDS[l.kind]?KINDS[l.kind].label+' mission: coming in a later build!':'Coming in a later build!':l.name+': coming in a later build!');return;}
  if(st==='locked'){SFX.hurt();this.say(l.id===1&&!SAVE.firstDelivery?"First, do your pizza delivery for Barro's (at the Lair)!":l.req!=null&&!SAVE.done[l.req]?'Beat '+levelName(l.req)+' first.':'Beat the mission before it first (or enter its code).');return;}
  SFX.ok();this.city=cityOf(l);sceneStack.length=0;startLevel(l);},
 update(dt){this.msgT-=dt;this.t+=dt;
  if(anyPressed('start')){SFX.ok();push(Watch.make('map'));return;}
  if(anyPressed('gadget')){SFX.ok();if(this.mode==='list'){const c=CITIES[this.ltab];if(cityOpen(c.id)){this.city=c.id;this.sel=c.home?1:0;}this.setMode(cityOpen(this.city)?'city':'valley');}
   else{this.ltab=Math.max(0,CITIES.findIndex(c=>c.id===(this.mode==='city'?this.city:(this.nodes()[this.vsel].c||CITY.gilbert).id)));this.lsel=0;this.setMode('list');}SAVE.mapView=this.mode==='list'?'list':'map';save();return;}
  if(this.mode==='valley')return this.updValley();if(this.mode==='city')return this.updCity();return this.updList();},
 updValley(){const N=this.nodes();this.vsel=this.dirNav(N,Math.min(this.vsel,N.length-1));
  if(anyPressed('back')){go(Title);return;}
  if(anyPressed('ok')){const n=N[this.vsel];if(n.kind==='lair'){SFX.ok();push(LairMenu);return;}
   if(!cityOpen(n.c.id)){SFX.hurt();this.say(n.c.name+' is locked. '+n.c.hint);return;}
   SFX.ok();if(this.city!==n.c.id){this.city=n.c.id;this.sel=n.c.home?1:0;
    // jump to the first unfinished level
    const L=cityLayout(this.city);const k=L.findIndex(o=>o.l&&levelStatus(o.l)==='ready');if(k>=0)this.sel=k;}
   this.setMode('city');}},
 updCity(){const N=this.nodes();this.sel=this.dirNav(N,Math.min(this.sel||0,N.length-1));
  if(anyPressed('back')){SFX.move();this.vsel=1+CITIES.findIndex(c=>c.id===this.city);this.setMode('valley');return;}
  if(anyPressed('ok')){const n=N[this.sel];if(n.home){SFX.ok();push(LairMenu);return;}this.tryStart(n.l);}},
 listRows(){const c=CITIES[this.ltab],{main,bonus}=cityLevels(c.id),R=[{lair:1}];
  main.forEach(l=>{R.push({l});bonus.filter(b=>(b.after!=null?b.after:b.req)===l.id).forEach(b=>R.push({l:b,bonus:1}));});
  bonus.filter(b=>!R.some(r=>r.l===b)).forEach(b=>R.push({l:b,bonus:1}));return R;},
 updList(){const n=CITIES.length;
  if(anyPressed('left')){this.ltab=(this.ltab+n-1)%n;this.lsel=0;SFX.move();}if(anyPressed('right')){this.ltab=(this.ltab+1)%n;this.lsel=0;SFX.move();}
  const R=this.listRows();if(anyPressed('down')){this.lsel=(this.lsel+1)%R.length;SFX.move();}if(anyPressed('up')){this.lsel=(this.lsel+R.length-1)%R.length;SFX.move();}
  if(anyPressed('back')){go(Title);return;}
  if(anyPressed('ok')){const r=R[this.lsel];if(r.lair){SFX.ok();push(LairMenu);return;}
   if(!cityOpen(CITIES[this.ltab].id)){SFX.hurt();this.say(CITIES[this.ltab].name+' is locked. '+CITIES[this.ltab].hint);return;}this.tryStart(r.l);}},
 // ---------- drawing ----------
 draw(){if(this.mode==='valley')this.drawValley();else if(this.mode==='city')this.drawCity();else this.drawList();
  if(this.msgT>0){rrect(110,196,420,58,10,'rgba(6,20,36,.94)','#ff5a8a',2);wrap(this.msg,126,220,388,18,14,'#fff',null);}},
 topBar(title,col){ctx.fillStyle='rgba(6,12,28,.72)';ctx.fillRect(0,0,W,30);text(title,12,21,16,col,'left','#000');
  const r=rank();text(r[0]+'  XP '+SAVE.xp+'   $'+SAVE.coins,W-12,20,13,'#fff','right');if(SAVE.testing)text('TESTING MODE',W-12,44,10,'#ff5ae0','right','#000');},
 footer(t){text(t,W/2,H-4,10,'#9fb','center','#000');},
 drawValley(){img('world_map',0,0,W,H);const N=this.nodes();
  N.forEach((n,i)=>{const s=i===this.vsel;
   if(n.kind==='lair'){imgC('markers/lair_pizza',n.x,n.y,46);if(s)this.ring(n.x,n.y,26);return;}
   const c=n.c,open=cityOpen(c.id),S=cityStats(c.id);
   if(c.id!=='tower')text(c.short,c.vx,c.vy,14,'#3a2410','center',null);
   else text(c.short,c.vx,c.vy+8,13,'#ffd23a','center','#2a0a3a');
   const bx=n.x,by=n.y+(c.id==='tower'?10:6);
   rrect(bx-44,by-10,88,22,11,open?'rgba(6,20,36,.85)':'rgba(30,20,40,.8)',s?'#2de2f5':open?c.col:'#667',s?3:2);
   if(open){drawStars(1,bx-34,by+1,11,1);text(S.stars+'',bx-24,by+6,12,'#ffd23a','left',null);text(S.done+'/'+S.total,bx+38,by+6,12,'#fff','right',null);}
   else{this.lock(bx-30,by+1);text('LOCKED',bx+38,by+6,11,'#99a','right',null);}
   if(s)this.ring(bx,by-10,c.id==='tower'?40:52,.5);});
  const n=N[this.vsel];rrect(10,H-84,W-20,68,10,'rgba(6,20,36,.92)','#2de2f5',2);
  if(n.kind==='lair'){text(LAIR.name,22,H-60,16,'#ffd23a','left',null);text(SAVE.firstDelivery?'Deliveries, shop, Gadget Lab, equip. A: go in':'START HERE: your first pizza delivery (A)',22,H-40,13,'#cfe','left',null);}
  else{const c=n.c,open=cityOpen(c.id),S=cityStats(c.id);text(c.name,22,H-60,17,c.col,'left','#000');
   text('Lieutenant: '+c.boss+'  ('+c.industry+')',22,H-41,12,'#cfe','left',null);
   if(open){text(S.done+'/'+S.total+' cleared',W-24,H-60,13,'#fff','right',null);drawStars(1,W-118,H-45,12,1);text(S.stars+' / '+S.maxStars,W-104,H-40,12,'#ffd23a','left',null);
    text(S.built?('Clues '+S.cf+'/'+S.ct+'   Parts '+S.pf+'/'+S.pt):'Missions coming in a later build',22,H-24,12,'#9fb','left',null);text('A: enter city',W-24,H-24,12,'#2de2f5','right',null);}
   else{text('LOCKED: '+c.hint,22,H-24,12,'#ff9ac0','left',null);}}
  this.topBar('THE VALLEY','#ffd23a');this.footer('D-pad: choose   A: enter   Y: list view   Start: Gadget Watch   B: title');},
 drawCity(){const C=CITY[this.city],cid=this.city,N=this.nodes();
  if(IMG['city/'+cid]&&IMG['city/'+cid].width)img('city/'+cid,0,0,W,H);else{ctx.fillStyle=C.bg;ctx.fillRect(0,0,W,H);}
  // cleared trail along the road
  const P=roadPts(cid),tt=cityTrailT(cid);if(tt>0){const end=Math.floor(tt*(P.length-1));ctx.save();ctx.lineCap='round';
   for(let i=0;i<=end;i+=5){const a=.45+.45*Math.sin(TIME*4-i*.12);ctx.fillStyle=`rgba(127,255,170,${a})`;ctx.beginPath();ctx.arc(P[i][0],P[i][1],3,0,7);ctx.fill();}ctx.restore();}
  // bonus spurs
  ctx.save();ctx.setLineDash([6,6]);ctx.lineDashOffset=-TIME*12;N.forEach(o=>{if(!o.bonus)return;ctx.strokeStyle='rgba(20,10,30,.8)';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(o.ax,o.ay);ctx.lineTo(o.x,o.y);ctx.stroke();
   ctx.strokeStyle=SAVE.done[o.l.id]?'#7fffaa':'#ffd23a';ctx.lineWidth=3;ctx.stroke();});ctx.restore();
  N.forEach((o,i)=>this.pin(o,i===this.sel));
  this.topBar(C.name.toUpperCase(),C.col);const S=cityStats(cid);text(S.done+'/'+S.total+' cleared',W/2-60,20,12,'#fff','center',null);drawStars(1,W/2+10,15,12,1);text(S.stars+'/'+S.maxStars,W/2+20,20,12,'#ffd23a','left',null);
  const o=N[Math.min(this.sel||0,N.length-1)];rrect(10,H-84,W-20,68,10,'rgba(6,20,36,.92)',C.col,2);
  if(o.home){text(LAIR.name,22,H-60,16,'#ffd23a','left',null);text(SAVE.firstDelivery?'Home base: deliveries, shop, Gadget Lab, equip. A: go in':'START HERE: your first pizza delivery (A)',22,H-40,13,'#cfe','left',null);}
  else this.infoPanel(o.l,22,H-60);
  this.footer('D-pad: choose   A: start   B: valley map   Y: list view   Start: Gadget Watch');},
 infoPanel(l,x,y){const st=levelStatus(l),k=kindOf(l);text(l.name,x,y,16,'#ffd23a','left',null);
  const sub=k.label+(isBonus(l)?'  (bonus)':'')+'   '+({done:'CLEARED',ready:'READY',locked:'LOCKED',soon:'COMING SOON'})[st];text(sub,x,y+19,12,st==='done'?'#7fffaa':st==='ready'?'#2de2f5':'#99a','left',null);
  if(isReal(l)){const c=levelClues(l.id),p=levelParts(l.id);drawStars(levelStars(l),W-104,y-5,13);
   text('Clues '+c[0]+'/'+c[1]+(c[1]-c[0]>0?' ('+(c[1]-c[0])+' left)':''),W-24,y+19,12,c[0]>=c[1]?'#7fffaa':'#fff','right',null);
   text(p[1]?'Parts '+p[0]+'/'+p[1]+(p[1]-p[0]>0?' ('+(p[1]-p[0])+' left)':''):'No rare part here',W-24,y+36,12,p[1]&&p[0]>=p[1]?'#7fffaa':'#fff','right',null);
   wrap(l.blurb||'',x,y+36,400,14,11,'#cfe',null);}
  else wrap(l.blurb||'Coming in a later build.',x,y+36,560,14,11,'#cfe',null);},
 pin(o,s){if(o.home){imgC('markers/lair_pizza',o.x,o.y-6,40);if(s)this.ring(o.x,o.y-6,24);return;}
  const l=o.l,st=levelStatus(l),boss=l.kind==='boss',sz=boss?44:34,y=o.y-4;
  ctx.fillStyle='rgba(10,6,20,.55)';ctx.beginPath();ctx.ellipse(o.x,o.y+10,sz*.42,6,0,0,7);ctx.fill();
  if(boss&&st!=='soon'&&st!=='done'){ctx.strokeStyle=`rgba(255,70,90,${.5+.4*Math.sin(TIME*5)})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(o.x,y,sz*.62,0,7);ctx.stroke();}
  ctx.globalAlpha=st==='soon'?.55:st==='locked'?.8:1;imgC('markers/'+pinIcon(l),o.x,y,sz);ctx.globalAlpha=1;
  if(st==='locked'||st==='soon'){ctx.fillStyle='rgba(20,10,40,.45)';ctx.beginPath();ctx.arc(o.x,y,sz*.42,0,7);ctx.fill();}
  if(st==='locked')this.lock(o.x+sz*.32,y+sz*.3);
  if(st==='soon'){rrect(o.x-17,y+sz*.32,34,12,5,'rgba(40,20,60,.9)','#a8f',1);text('SOON',o.x,y+sz*.32+10,9,'#dcf','center',null);}
  if(st==='done'){ctx.fillStyle='#2ecc71';ctx.beginPath();ctx.arc(o.x+sz*.36,y-sz*.32,7,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(o.x+sz*.36-3.5,y-sz*.32);ctx.lineTo(o.x+sz*.36-1,y-sz*.32+3);ctx.lineTo(o.x+sz*.36+4,y-sz*.32-3);ctx.stroke();
   drawStars(levelStars(l),o.x-14,y+sz*.5+2,8);}
  if(s){this.ring(o.x,y,sz*.62+2);const nm=l.name.length>26?l.name.slice(0,25)+'…':l.name;ctx.font='bold 12px "Trebuchet MS",Verdana,sans-serif';const w=ctx.measureText(nm).width+16,tx=Math.max(w/2+4,Math.min(W-w/2-4,o.x)),ty=y-sz*.62-12;
   rrect(tx-w/2,ty-12,w,18,7,'rgba(6,20,36,.92)','#2de2f5',1.5);text(nm,tx,ty+2,12,'#fff','center',null);}},
 ring(x,y,r,a=1){ctx.strokeStyle='#2de2f5';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r+Math.sin(TIME*6)*2,0,7);ctx.stroke();},
 lock(x,y){ctx.fillStyle='#ccd';ctx.strokeStyle='#223';ctx.lineWidth=1.5;rrect(x-6,y-3,12,9,2,'#ccd','#223',1.5);ctx.beginPath();ctx.arc(x,y-3,4,Math.PI,0);ctx.lineWidth=2;ctx.strokeStyle='#ccd';ctx.stroke();},
 drawList(){const c=CITIES[this.ltab],open=cityOpen(c.id);
  if(IMG['city/'+c.id]&&IMG['city/'+c.id].width)img('city/'+c.id,0,0,W,H);else{ctx.fillStyle=c.bg;ctx.fillRect(0,0,W,H);}dim(.78);
  this.topBar('CAMPAIGN  (list view)','#ffd23a');
  // city tabs
  const tw=(W-20)/CITIES.length;CITIES.forEach((k,i)=>{const s=i===this.ltab,o=cityOpen(k.id),x=10+i*tw;rrect(x+2,36,tw-4,26,8,s?'rgba(255,210,58,.92)':'rgba(30,60,90,.75)',s?'#fff':o?k.col:'#556',2);
   text(k.id==='downtown'?'DOWNTOWN':k.id==='tower'?'TOWER':k.short,x+tw/2,54,12,s?'#102':o?'#fff':'#889','center',null);if(!o)this.lock(x+14,49);});
  const S=cityStats(c.id);text(c.name+'  ·  Lieutenant: '+c.boss,14,80,13,c.col,'left','#000');
  text(open?S.done+'/'+S.total+' cleared   ★ '+S.stars+'/'+S.maxStars+'   Clues '+S.cf+'/'+S.ct+'   Parts '+S.pf+'/'+S.pt:'LOCKED: '+c.hint,W-14,80,12,open?'#cfe':'#ff9ac0','right',null);
  text('MISSION',58,100,10,'#9fb','left',null);text('TYPE',318,100,10,'#9fb','left',null);text('STARS',424,100,10,'#9fb','left',null);text('CLUES',492,100,10,'#9fb','left',null);text('PARTS',556,100,10,'#9fb','left',null);
  const R=this.listRows(),vis=9,top=Math.max(0,Math.min(this.lsel-4,R.length-vis));
  R.slice(top,top+vis).forEach((r,j)=>{const i=top+j,s=i===this.lsel,y=106+j*31;rrect(10,y,W-20,28,7,s?'rgba(255,210,58,.92)':'rgba(20,40,66,.82)',s?'#fff':'#2a5a7a',1.5);
   const fg=s?'#102':'#fff';
   if(r.lair){imgC('markers/lair_pizza',32,y+14,24);text(LAIR.name,58,y+19,13,fg,'left',null);text('Home base',318,y+19,12,s?'#102':'#9fb','left',null);return;}
   const l=r.l,st=levelStatus(l),k=kindOf(l),dimmed=st==='soon'||st==='locked';
   ctx.globalAlpha=dimmed?.5:1;imgC('markers/'+pinIcon(l),r.bonus?40:32,y+14,24);ctx.globalAlpha=1;
   const nm=(r.bonus?'↳ ':'')+(typeof l.id==='number'?l.id+'. ':'')+l.name;text(nm.length>34?nm.slice(0,33)+'…':nm,r.bonus?62:58,y+19,13,dimmed&&!s?'#89a':fg,'left',null);
   text(k.label,318,y+19,11,s?'#102':'#cde','left',null);
   if(st==='soon'){text('COMING SOON',W-24,y+19,11,s?'#102':'#a8f','right',null);return;}
   if(st==='locked'&&!SAVE.done[l.id]){text('LOCKED',W-24,y+19,11,s?'#102':'#99a','right',null);this.lock(W-82,y+14);}
   drawStars(levelStars(l),428,y+14,10);
   const c2=levelClues(l.id),p=levelParts(l.id);
   if(st!=='locked'){text(c2[0]+'/'+c2[1],512,y+19,12,s?'#102':c2[0]>=c2[1]?'#7fffaa':'#ffd23a','center',null);
    text(p[1]?p[0]+'/'+p[1]:'—',576,y+19,12,s?'#102':p[1]&&p[0]>=p[1]?'#7fffaa':p[1]?'#ffd23a':'#789','center',null);}});
  if(R.length>vis){text(top>0?'▲ more':'',W-16,100,10,'#9fb','right',null);text(top+vis<R.length?'▼ more':'',W-16,106+vis*31+8,10,'#9fb','right',null);}
  const r=R[this.lsel];rrect(10,H-62,W-20,44,10,'rgba(6,20,36,.92)','#2de2f5',2);
  if(r.lair)wrap(SAVE.firstDelivery?'Home base: deliveries, shop, Gadget Lab, equip. A: go in.':'START HERE: your first pizza delivery for Barro\'s (A).',22,H-44,W-44,15,12,'#cfe',null);
  else{const p=levelParts(r.l.id),c2=levelClues(r.l.id),left=[];if(isReal(r.l)){if(c2[1]-c2[0]>0)left.push((c2[1]-c2[0])+' clue'+(c2[1]-c2[0]>1?'s':'')+' left');if(p[1]-p[0]>0)left.push((p[1]-p[0])+' rare part left');}
   wrap((left.length?'Still to find: '+left.join(', ')+'.  ':isReal(r.l)&&SAVE.done[r.l.id]?'Everything found here!  ':'')+(r.l.blurb||''),22,H-44,W-44,15,12,'#cfe',null);}
  this.footer('Left/Right: city   Up/Down: mission   A: start   Y: map view   Start: Watch   B: title');}});

// ---------- title -> campaign ----------
const _goCamp=go;go=function(s){if(s===MapScene&&scene===Title)MapScene.fromTitle();return _goCamp(s);};

// ---------- codes: city codes + testing opens every city ----------
{const _ec=enterCode;enterCode=function(raw){const c=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(CITY_CODES[c]){const id=CITY_CODES[c];SAVE.cityOpen[id]=1;save();return {ok:true,title:CITY[id].name.toUpperCase()+' OPEN',text:CITY[id].name+' is open on the Valley Map. Lieutenant: '+CITY[id].boss+'.'};}
 const r=_ec(raw);if(c==='TESTING'){CITIES.forEach(k=>SAVE.cityOpen[k.id]=1);save();r.text=r.text.replace('all levels','all cities and levels');}return r;};}

// ---------- results: show the codes for whatever this win opened ----------
function winCodes(id){const out=[];const l=LEVELS.find(x=>x.id===id);if(!l)return out;
 for(const k in LEVEL_CODES){const t=LEVEL_CODES[k],tl=LEVELS.find(x=>x.id===t);if(!tl||!LEVEL_DEFS[t])continue;
  if(tl.req===id||(tl.req==null&&t===id+1&&cityOf(tl)===cityOf(l)))out.push({code:k,what:'MISSION '+t});}
 if(l.kind==='boss'){const cid=cityOf(l);CITIES.forEach(c=>{if(!c.code||c.id===cid)return;
  const opens=(cid==='gilbert'&&c.id==='downtown')||(cid==='downtown'&&(c.id==='tempe'||c.id==='chandler'))||(c.id==='tower'&&['gilbert','downtown','tempe','chandler'].every(bossBeaten));
  if(opens)out.push({code:c.code,what:c.name.toUpperCase(),city:c});});}
 return out;}
