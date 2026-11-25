// ===== Codes: level unlock codes, cheat codes, testing mode, Enter Code + Extras screens =====
// SAVE fields used here: unlocked{levelId}, cheats{key:true} (owned), on{key:true} (switched on),
// testing (bool), vehicles{name}, outfit{char:index}, p1char.
// Level codes are shown on the results screen when you beat the level before it.
const LEVEL_CODES={PIZZA:2,CRANE:3,HACKER:4,WRECK:5};
// Cheats. kind: toggle (switch on/off in Extras), outfit, unlock. Each code unlocks its cheat and switches it on.
const CHEATS=[
 {code:'MOONJUMP',key:'moonjump',kind:'toggle',name:'Moon Jump',d:'Low gravity. Float like an astronaut.'},
 {code:'TURBO',key:'turbo',kind:'toggle',name:'Turbo Agents',d:'Both agents run 30% faster.'},
 {code:'MEGABEAM',key:'megabeam',kind:'toggle',name:'Mega Beam',d:'Secret move: a giant watch beam that zaps through every enemy in a line.'},
 {code:'TORNADO',key:'tornado',kind:'toggle',name:'Tornado Kick',d:'Secret move: the combo finisher spins and hits both sides.'},
 {code:'PIZZAPARTY',key:'pizzaparty',kind:'toggle',name:'Pizza Party',d:'8 hearts each, and every coin heals a little.'},
 {code:'SKATES',key:'skates',kind:'toggle',name:'Hover Skates',d:'Gadget: floatier jumps and a speed boost.'},
 {code:'BIGTIPS',key:'bigtips',kind:'toggle',name:'Big Tippers',d:'Every pizza delivery tip is doubled.'},
 {code:'JUNKYARD',key:'junkyard',kind:'gift',name:'Junkyard Haul',d:'5 of every common crafting part, free. Works once.'},
 {code:'SWITCHEROO',key:'switcheroo',kind:'unlock',name:'Agent Switch',d:'Agent swap: Player 1 and Player 2 trade agents.'},
 {code:'GOLDSUIT',key:'gold',kind:'outfit',name:'Gold Suit',d:'Outfit: shiny gold spy suits.',filter:'sepia(1) saturate(3.2) hue-rotate(-12deg) brightness(1.12)'},
 {code:'SHADOW',key:'shadow',kind:'outfit',name:'Shadow Suit',d:'Outfit: midnight ninja colors.',filter:'grayscale(.7) brightness(.62) contrast(1.35)'},
 {code:'NEON',key:'neon',kind:'outfit',name:'Neon Suit',d:'Outfit: glowing arcade colors.',filter:'hue-rotate(115deg) saturate(1.7) brightness(1.08)'}];
const OUTFITS=[{key:'classic',name:'Classic',filter:''}].concat(CHEATS.filter(c=>c.kind==='outfit').map(c=>({key:c.key,name:c.name,filter:c.filter})));
SAVE.unlocked=SAVE.unlocked||{1:true};SAVE.cheats=SAVE.cheats||{};SAVE.on=SAVE.on||{};SAVE.vehicles=SAVE.vehicles||{};SAVE.outfit=SAVE.outfit||{};
const cheatOn=k=>!!SAVE.on[k];
const ownsCheat=k=>!!(SAVE.cheats[k]||SAVE.testing);
function outfitFilter(ch){const o=OUTFITS[SAVE.outfit[ch]||0];return o&&ownsOutfit(o)?o.filter:'';}
const ownsOutfit=o=>o.key==='classic'||ownsCheat(o.key);
function vehicleOwned(n){return n==='On Foot'||!!SAVE.vehicles[n]||SAVE.testing;}
function gadgetOwned(g){return g.own||SAVE.testing||(g.cheat&&ownsCheat(g.cheat));}
// v0.35: picked on the character select screen (charselect.js). P2 gets SAVE.p2char unless it clashes with P1.
const AGENT_LIST=['agent_coco','agent_sisi','agent_sandy'];
function p1Char(){return AGENT_LIST.includes(SAVE.p1char)?SAVE.p1char:'agent_coco';}
function p2Char(){const a=p1Char();if(AGENT_LIST.includes(SAVE.p2char)&&SAVE.p2char!==a)return SAVE.p2char;return a==='agent_sisi'?'agent_coco':'agent_sisi';}
// Try a code. Returns {ok, title, text}.
function enterCode(raw){const c=String(raw||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
 if(!c)return {ok:false,title:'TYPE A CODE',text:'Use the letters, then press OK.'};
 if(c==='TESTING'){SAVE.testing=true;for(const l of LEVELS)if(LEVEL_DEFS[l.id])SAVE.unlocked[l.id]=true;for(const ch of CHEATS)SAVE.cheats[ch.key]=true;save();
  return {ok:true,title:'TESTING MODE ON',text:'Everything is unlocked: all levels, every gadget at Perfect, all parts, rides and upgrades, outfits, secret moves and Agent Switch. Turn cheats on in EXTRAS.'};}
 if(c==='NOTESTING'){SAVE.testing=false;save();return {ok:true,title:'TESTING MODE OFF',text:'Back to normal. Things you earned stay unlocked.'};}
 if(LEVEL_CODES[c]){const id=LEVEL_CODES[c];SAVE.unlocked[id]=true;save();return {ok:true,title:'MISSION '+id+' UNLOCKED',text:levelName(id)+' is open on the map.'};}
 const ch=CHEATS.find(x=>x.code===c);
 if(ch){SAVE.cheats[ch.key]=true;if(ch.kind==='toggle')SAVE.on[ch.key]=true;
  if(ch.key==='switcheroo'){const a=p1Char(),b=p2Char();SAVE.p1char=b;SAVE.p2char=a;}
  if(ch.kind==='outfit'){const i=OUTFITS.findIndex(o=>o.key===ch.key);SAVE.outfit.agent_coco=i;SAVE.outfit.agent_sisi=i;SAVE.outfit.agent_sandy=i;}
  if(ch.kind==='gift'){if(SAVE.gift&&SAVE.gift[ch.key]){save();return {ok:false,title:'ALREADY USED',text:'Sandy says: "You already cleaned out that junkyard."'};}SAVE.gift=SAVE.gift||{};SAVE.gift[ch.key]=1;for(const p of PARTS)SAVE.parts[p.id]=(SAVE.parts[p.id]||0)+5;}
  save();return {ok:true,title:ch.name.toUpperCase()+'!',text:ch.d+(ch.kind==='toggle'?' (On. Switch it off in EXTRAS.)':'')};}
 return {ok:false,title:'ACCESS DENIED',text:'Sandy says: "Nice try, agent." That code does nothing.'};}

// Small pad reader for screens that also take typed letters (so WASD/J/K typing doesn't move the cursor)
const PADPREV={};
function padEdges(){const out={};const pads=(navigator.getGamepads?navigator.getGamepads():[])||[];
 for(const g of pads){if(!g||!g.connected)continue;const b=i=>!!(g.buttons[i]&&g.buttons[i].pressed),ax=g.axes;
  const st={ok:b(0),back:b(1),start:b(9),up:b(12)||ax[1]<-.6,down:b(13)||ax[1]>.6,left:b(14)||ax[0]<-.6,right:b(15)||ax[0]>.6};
  for(const k in st){const id=g.index+k;if(st[k]&&!PADPREV[id])out[k]=true;PADPREV[id]=st[k];}}
 return out;}

// ---------- Enter Code screen: on-screen keyboard (pad/arrows) + physical typing ----------
const KEYGRID=['ABCDEFG','HIJKLMN','OPQRSTU','VWXYZ<!'];
const CodeEntry={name:'code',str:'',cx:0,cy:0,msg:null,msgT:0,ev:[],
 enter(){this.str='';this.cx=0;this.cy=0;this.msg=null;this.ev=[];startMusic('enter_code');},
 key(e){if(scene!==CodeEntry)return;const k=e.key;
  if(/^[a-zA-Z0-9]$/.test(k)){this.ev.push(['type',k.toUpperCase()]);e.preventDefault();}
  else if(k==='Backspace'||k==='Delete'){this.ev.push(['del']);e.preventDefault();}
  else if(k==='Enter'){this.ev.push(['ok']);e.preventDefault();}
  else if(k==='Escape'||k==='Tab'){this.ev.push(['exit']);e.preventDefault();}
  else if(k.startsWith('Arrow')){this.ev.push(['nav',k.slice(5).toLowerCase()]);e.preventDefault();}},
 submit(){const r=enterCode(this.str);this.msg=r;this.msgT=r.ok?3.2:2.2;playStinger(r.ok?'code_ok':'code_bad');this.str='';},
 press(){const ch=KEYGRID[this.cy][this.cx];if(ch==='<')this.str=this.str.slice(0,-1);else if(ch==='!')this.submit();else if(this.str.length<12)this.str+=ch;SFX.move();},
 update(dt){this.msgT-=dt;
  const P=padEdges();if(this.msgT>0&&(P.ok||P.back)){this.msgT=0;}
  const evs=this.ev;this.ev=[];
  for(const [t,v] of evs){if(t==='type'&&this.str.length<12){this.msgT=0;this.str+=v;SFX.move();}else if(t==='del'){this.msgT=0;this.str=this.str.slice(0,-1);SFX.move();}
   else if(t==='ok'){if(this.msgT>0&&!this.str)this.msgT=0;else this.submit();}else if(t==='exit'){go(Title);return;}else if(t==='nav')P[v]=true;}
  if(P.left)this.cx=(this.cx+6)%7;if(P.right)this.cx=(this.cx+1)%7;if(P.up)this.cy=(this.cy+3)%4;if(P.down)this.cy=(this.cy+1)%4;
  if(P.left||P.right||P.up||P.down)SFX.move();
  if(P.ok&&this.msgT<=0)this.press();if(P.back){if(this.str)this.str=this.str.slice(0,-1);else{go(Title);return;}}if(P.start)this.submit();},
 draw(){img('main_menu',0,0,W,H);dim(.72);rrect(70,40,500,400,16,'rgba(6,20,36,.95)','#2de2f5',3);
  text('ENTER CODE',W/2,82,28,'#ffd23a','center');
  rrect(140,100,360,50,10,'#02101c','#2de2f5',2);text(this.str+(Math.floor(TIME*2)%2?'_':' '),W/2,135,26,'#fff','center',null);
  for(let r=0;r<4;r++)for(let c=0;c<7;c++){const ch=KEYGRID[r][c],x=124+c*56,y=172+r*56,s=r===this.cy&&c===this.cx;
   rrect(x,y,48,46,8,s?'#ffd23a':'rgba(30,60,90,.8)',s?'#fff':'#2de2f5',2);
   text(ch==='<'?'DEL':ch==='!'?'OK':ch,x+24,y+31,ch==='<'||ch==='!'?13:20,s?'#102':'#fff','center',null);}
  text('Type on the keyboard, or use the D-pad + A.  B: delete / back.  Enter or Start: try code.  Esc: leave',W/2,412,11,'#9fb','center',null);
  if(this.msgT>0&&this.msg){const m=this.msg;rrect(90,150,460,150,14,'rgba(6,20,36,.97)',m.ok?'#ffd23a':'#ff5a8a',4);
   text(m.title,W/2,192,24,m.ok?'#ffd23a':'#ff5a8a','center');wrap(m.text,115,226,410,20,14,'#fff',null);}}};
addEventListener('keydown',e=>CodeEntry.key(e));

// ---------- Extras: switch unlocked cheats, outfits and the agent switch ----------
const Extras={name:'extras',sel:0,
 enter(){this.sel=0;startMusic('enter_code');},
 rows(){const R=[];
  R.push({k:'mapview',label:'Level select style',d:'MAP: the Valley Map and a map for each city. LIST: every mission in order by city, with stars, clues and rare parts still to find. (Press Y on the map to switch any time.)',val:()=>SAVE.mapView==='list'?'LIST':'MAP',act:()=>{SAVE.mapView=SAVE.mapView==='list'?'map':'list';}});
  R.push({k:'outfit_coco',label:'Coco outfit',val:()=>OUTFITS[SAVE.outfit.agent_coco||0].name,act:d=>this.cycleOutfit('agent_coco',d)});
  R.push({k:'outfit_sisi',label:'Sisi outfit',val:()=>OUTFITS[SAVE.outfit.agent_sisi||0].name,act:d=>this.cycleOutfit('agent_sisi',d)});
  R.push({k:'p1',label:'Player 1 agent',val:()=>CHARS[p1Char()].label,act:d=>{const L=AGENT_LIST,i=L.indexOf(p1Char());SAVE.p1char=L[(i+(d<0?2:1))%3];}});
  for(const c of CHEATS.filter(c=>c.kind==='toggle'))R.push(ownsCheat(c.key)?{k:c.key,label:c.name,d:c.d,val:()=>cheatOn(c.key)?'ON':'OFF',act:()=>{SAVE.on[c.key]=!SAVE.on[c.key];}}:{label:'??? (find the code)',locked:1});
  return R;},
 cycleOutfit(ch,d){const n=OUTFITS.length;let i=SAVE.outfit[ch]||0;for(let k=0;k<n;k++){i=(i+(d||1)+n)%n;if(ownsOutfit(OUTFITS[i]))break;}SAVE.outfit[ch]=i;},
 update(){const R=this.rows();
  if(anyPressed('down')){this.sel=(this.sel+1)%R.length;SFX.move();}if(anyPressed('up')){this.sel=(this.sel+R.length-1)%R.length;SFX.move();}
  const r=R[this.sel];if(r&&!r.locked&&(anyPressed('ok')||anyPressed('right')||anyPressed('left'))){r.act(anyPressed('left')?-1:1);save();SFX.ok();}
  if(anyPressed('back')||anyPressed('start')){go(Title);}},
 draw(){img('main_menu',0,0,W,H);dim(.72);rrect(50,30,540,420,16,'rgba(6,20,36,.95)','#2de2f5',3);
  text('EXTRAS',W/2,70,28,'#ffd23a','center');if(SAVE.testing)text('TESTING MODE',W/2,92,12,'#ff5ae0','center',null);
  const R=this.rows(),RH=R.length>10?26:28;R.forEach((r,i)=>{const y=104+i*RH,s=i===this.sel;rrect(70,y,500,24,6,s?'rgba(255,210,58,.9)':'rgba(30,60,90,.7)',s?'#fff':'#2de2f5',2);
   text(r.label,82,y+17,13,s?'#102':(r.locked?'#789':'#fff'),'left',null);if(r.val)text(r.val(),558,y+17,13,s?'#102':'#9fb','right',null);});
  const r=R[this.sel];if(r&&r.d)wrap(r.d,72,Math.min(104+R.length*RH+18,400),500,16,12,'#cfe',null);
  text('Up/Down choose.  A or Left/Right: change.  B: back.  Get more codes by beating missions!',W/2,436,11,'#9fb','center',null);}};
