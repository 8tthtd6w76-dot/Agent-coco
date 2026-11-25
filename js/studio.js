// ===== Music Room UI (core data + songDef live in studio_core.js, the randomizer in groove_random.js) =====
// ---------- the Music Room's own groove ----------
TR.studio={title:'Studio Session',desc:'The Music Room. Synth-funk pocket with a head-nod clav.',
 bpm:100,swing:.14,prog:[['A','m9'],['D','9'],['A','m9'],['D','9'],['F','maj7'],['E','7s9'],['A','m9'],['E','7s9']],
 drums:{A:DR.pocket,F:DR.pocketF},dseq:'AAAF',bassI:'synth',
 bass:['0-.o..0.7.a.o.7.','0-.o..0.4.7.a.o.'],
 comp:[{i:'clav',h:'..x.x..g..x.x..g',v:.6},{i:'ep',h:'x-......x-......',v:.5}],
 lead:{i:'synth',at:4,mel:'E5/2 G5/2 A5/4 G5/2 E5/2 D5/4  C5/2 E5/2 F5/4 E5/4 r/4  A4/2 C5/2 E5/4 D5/2 C5/2 B4/4  G#4/4 B4/4 E5/8'},pad:{v:.5}};
MUSIC_LIST.push({name:'studio',title:TR.studio.title,desc:TR.studio.desc});

SAVE.songs=SAVE.songs||[];SAVE.musicPick=SAVE.musicPick||{};
const PICK_SCREENS=[['title','Title screen'],['map','World map'],['lair','The Lair'],['shop',"Barro's Shop"],['delivery','Pizza delivery'],['results','Mission results']];
function pickSong(pk){if(!pk)return null;const [t,id]=pk.split(':');
 if(t==='p'){const p=PRESET_SONGS.find(x=>x.id===id);return p?p.song:null;}
 return SAVE.songs.find(s=>s.id===id)||null;}
function pickName(pk){const s=pickSong(pk);return s?s.name:'Game default';}
function registerSong(key,S){TR[key]=songDef(S);delete COMPILED[key];return key;}
const _startMusicBase=startMusic;
startMusic=function(name='level',from=0){const pk=SAVE.musicPick&&SAVE.musicPick[name];
 if(pk){const S=pickSong(pk);if(S){const key='pick_'+name;if(MT.name!==key||!MT.timer)registerSong(key,S);return _startMusicBase(key,from);}}
 return _startMusicBase(name,from);};
function playSongNow(S){registerSong('__song',S);if(MT.name==='__song')stopMusic();_startMusicBase('__song');}
function unlockAudio(){const a=audio();if(a&&a.state==='suspended')a.resume();}

// ---------- shared list helpers ----------
function roomBg(){bgPic('scenes/lair_lab',.62);}
function listRows(o,R,x,y,w,rowH,vis,draw){const top=Math.max(0,Math.min(o.sel-Math.floor(vis/2),R.length-vis));
 R.slice(top,top+vis).forEach((r,j)=>{const i=top+j,s=i===o.sel,yy=y+j*rowH;rrect(x,yy,w,rowH-4,8,s?'rgba(255,210,58,.92)':'rgba(30,60,90,.65)',s?'#fff':'#2de2f5',1.5);draw(r,i,s,yy);});}
function eqBars(x,y,n=5,col='#ffd23a'){const on=MT.timer&&!muted;for(let i=0;i<n;i++){const h=on?6+Math.abs(Math.sin(TIME*(5+i*1.7)+i))*16:4;ctx.fillStyle=col;ctx.fillRect(x+i*6,y-h,4,h);}}

// ---------- Music Room menu: a home studio you look at (v0.22). Each object on the desk is a button ----------
const MR_IMG={};
function mrImg(n){if(!MR_IMG[n]){const i=new Image();i.src='assets/music_room/'+n+'.png';MR_IMG[n]=i;}return MR_IMG[n];}
const MR_CELL={sisi_guitar_loop:[4,170],guitar_states:[3,77],coco_laptop_loop:[4,187],speakers_states:[3,153],guitar_loop:[4,76],speakers_loop:[4,156],fm1_loop:[4,369],duet_loop:[4,235],sandy_dj_loop:[4,211],beatpad_states:[3,316],fm1_states:[3,348],beatpad_loop:[4,292],laptop_loop:[4,266],door_states:[3,149]};
// draw frame f of strip n, bottom-centered at (cx,by), displayed h px tall
function mrDraw(n,f,cx,by,h){const i=mrImg(n),c=MR_CELL[n];if(!i.width)return;const cw=i.width/c[0],s=h/i.height;ctx.drawImage(i,f*cw,0,cw,i.height,cx-cw*s/2,by-h,cw*s,h);}
const MR_OBJ=[ // cx,by,h = sprite spot; hit = tap area
 {k:'laptop',cx:320,by:312,h:112,hit:[250,196,140,122]},
 {k:'fm1',cx:150,by:318,h:62,hit:[62,262,176,60]},
 {k:'pad',cx:480,by:318,h:66,hit:[404,258,152,64]},
 {k:'guitar',cx:590,by:300,h:190,hit:[548,112,86,190]},
 {k:'speakers',cx:320,by:150,h:78,hit:[190,70,260,84]},
 {k:'door',cx:50,by:330,h:176,hit:[8,152,84,180]}];
function mrSprite(o,sel,playing){const t=Math.floor(TIME*6)%4;
 switch(o.k){
  case 'laptop':if(playing&&!sel)mrDraw('coco_laptop_loop',t,o.cx,o.by+4,o.h*1.08);else mrDraw('laptop_loop',sel?2:0,o.cx,o.by,o.h);break;
  case 'fm1':mrDraw(playing&&!sel?'fm1_loop':'fm1_states',playing&&!sel?t:(sel?1:0),o.cx,o.by,o.h);break;
  case 'pad':mrDraw(playing&&!sel?'beatpad_loop':'beatpad_states',playing&&!sel?t:(sel?1:0),o.cx,o.by,o.h);break;
  case 'guitar':if(playing&&!sel)mrDraw('sisi_guitar_loop',t,o.cx-24,o.by+22,o.h*.78);else mrDraw('guitar_states',sel?1:0,o.cx,o.by,o.h);break;
  case 'speakers':for(const dx of[-110,110])mrDraw(playing&&!sel?'speakers_loop':'speakers_states',playing&&!sel?t:(sel?1:0),o.cx+dx,o.by,o.h);break;
  case 'door':mrDraw('door_states',sel?2:0,o.cx,o.by,o.h);break;}}
const MusicRoom={name:'musicroom',sel:0,
 make(){this.sel=0;return this;},
 items(){return [
  {n:'Home Studio',d:'Make a brand-new song on the laptop, FM-1, beat pad and guitar. Save up to 8 songs.',o:'laptop',go:()=>push(Groove.make(blankSong(),null))},
  {n:'Preset Songs',d:'Four ready-made jams. Play them, or remix one in the Home Studio.',o:'fm1',go:()=>push(SongList.make('preset'))},
  {n:'Jukebox',d:'Every track in the game: missions, bosses, screens and cutscenes.',o:'pad',go:()=>push(Jukebox.make())},
  {n:'My Songs ('+SAVE.songs.length+'/8)',d:'Play, remix or delete the songs you saved.',o:'guitar',go:()=>push(SongList.make('mine'))},
  {n:'Theme Picker',d:'Choose which song plays on the title screen, map, Lair, shop, deliveries and results.',o:'speakers',go:()=>push(ThemePicker.make())},
  {n:'Back to the Lair',d:'Head back out the door.',o:'door',go:()=>pop()}];},
 enter(){unlockAudio();startMusic('studio');Object.keys(MR_CELL).forEach(mrImg);},resume(){startMusic('studio');},
 // arrows / WASD jump to the nearest object in that direction
 nav(dx,dy){const c=i=>[MR_OBJ[i].hit[0]+MR_OBJ[i].hit[2]/2,MR_OBJ[i].hit[1]+MR_OBJ[i].hit[3]/2],[x,y]=c(this.sel);let best=-1,bs=1e9;
  for(let i=0;i<MR_OBJ.length;i++){if(i===this.sel)continue;const [ox,oy]=c(i),vx=ox-x,vy=oy-y,along=vx*dx+vy*dy;if(along<=8)continue;const cross=Math.abs(vx*dy-vy*dx),sc=along+cross*1.4;if(sc<bs){bs=sc;best=i;}}
  if(best>=0){this.sel=best;SFX.move();}},
 pick(mx,my){for(let i=0;i<MR_OBJ.length;i++){const h=MR_OBJ[i].hit;if(mx>=h[0]&&mx<=h[0]+h[2]&&my>=h[1]&&my<=h[1]+h[3])return i;}return -1;},
 update(){const I=this.items();
  if(anyPressed('left'))this.nav(-1,0);else if(anyPressed('right'))this.nav(1,0);else if(anyPressed('up'))this.nav(0,-1);else if(anyPressed('down'))this.nav(0,1);
  if(anyPressed('ok')){SFX.ok();I[this.sel].go();return;}if(backPressed()||anyPressed('start')){SFX.move();pop();}},
 draw(){bgPic('scenes/lair_lab',.9);
  // desk and shelf drawn in code, the props sit on top
  ctx.fillStyle='rgba(8,6,24,.45)';ctx.fillRect(0,330,W,150);
  rrect(110,312,420,18,6,'#a8723a','#000',3);ctx.fillStyle='#7a4e24';ctx.fillRect(126,330,10,64);ctx.fillRect(504,330,10,64);ctx.fillStyle='#000';ctx.fillRect(126,394,10,3);ctx.fillRect(504,394,10,3);
  rrect(60,150,520,8,3,'#5a3a1a','#000',2);ctx.save();ctx.globalAlpha=0;ctx.restore();
  const playing=!!(MT.timer&&!muted),I=this.items();
  if(playing){const t=Math.floor(TIME*6)%4;mrDraw('sandy_dj_loop',t,118,408,78);}
  MR_OBJ.forEach((o,i)=>{const sel=i===this.sel;if(sel){ctx.save();ctx.shadowColor='#ffd23a';ctx.shadowBlur=18;mrSprite(o,true,playing);ctx.restore();}mrSprite(o,sel,playing);});
  text('MUSIC ROOM',W/2,34,26,'#ffd23a','center');eqBars(W/2+112,34);eqBars(W/2-142,34,5,'#2de2f5');
  // name tag above the highlighted object
  const o=MR_OBJ[this.sel],it=I[this.sel],tw=ctx.measureText(it.n).width;const lx=Math.max(104,Math.min(W-104,o.hit[0]+o.hit[2]/2)),ly=Math.max(54,o.hit[1]-6);
  rrect(lx-100,ly-24,200,26,10,'rgba(6,20,36,.92)','#ffd23a',2);text(it.n,lx,ly-5,15,'#fff','center',null);
  panel(24,412,592,52,'#456');wrap(it.d,40,436,560,16,14,'#cfe',null);text('Arrows or tap: pick   Enter / A: open   Esc / B: back',W/2,476,10,'#9fb','center',null);
  drawToast();}};
// mouse / touch: tap an object to open it (hover or first tap selects on mouse)
canvas.addEventListener('pointerdown',e=>{if(scene!==MusicRoom)return;const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)*W/r.width,my=(e.clientY-r.top)*H/r.height,i=MusicRoom.pick(mx,my);
 if(i>=0){MusicRoom.sel=i;SFX.ok();MusicRoom.items()[i].go();}});
canvas.addEventListener('pointermove',e=>{if(scene!==MusicRoom||e.pointerType==='touch')return;const r=canvas.getBoundingClientRect(),i=MusicRoom.pick((e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height);if(i>=0&&i!==MusicRoom.sel){MusicRoom.sel=i;SFX.move();}});

// ---------- My Songs / Preset Songs ----------
const SongList={name:'songlist',mode:'mine',sel:0,del:-1,playing:-1,
 make(mode){this.mode=mode;this.sel=0;this.del=-1;this.playing=-1;return this;},
 rows(){return this.mode==='preset'?PRESET_SONGS.map(p=>({S:p.song,d:p.desc,style:p.style})):SAVE.songs.map(S=>({S,d:SCALES[S.sc].n+' in '+NOTE_N[S.key]+', '+S.bpm+' BPM, '+KITS[S.kit].n+' kit.',style:'Your song'}));},
 enter(){},resume(){if(this.playing<0)startMusic('studio');},
 update(){const R=this.rows();navList(this,R.length);
  if(backPressed()){SFX.move();this.playing=-1;pop();return;}
  if(!R.length)return;const r=R[this.sel];
  if(anyPressed('ok')){unlockAudio();if(this.playing===this.sel){this.playing=-1;startMusic('studio');}else{this.playing=this.sel;playSongNow(r.S);}SFX.ok();return;}
  if(anyPressed('gadget')){SFX.ok();this.playing=-1;const S=cloneSong(r.S);if(this.mode==='preset'){S.name=S.name+' Remix';push(Groove.make(S,null));}else push(Groove.make(S,r.S.id));return;}
  if(this.mode==='mine'&&anyPressed('attack')){if(this.del===this.sel){const id=r.S.id;SAVE.songs.splice(this.sel,1);for(const k in SAVE.musicPick)if(SAVE.musicPick[k]==='u:'+id)delete SAVE.musicPick[k];save();toast('Deleted: '+r.S.name,'#ff5a8a');this.del=-1;this.playing=-1;startMusic('studio');}else{this.del=this.sel;toast('Press X again to delete','#ff5a8a');}SFX.move();}},
 draw(){roomBg();text(this.mode==='preset'?'PRESET SONGS':'MY SONGS',W/2,44,28,'#ffd23a','center');
  const R=this.rows();panel(20,62,600,300);
  if(!R.length){text('No songs yet!',W/2,190,22,'#fff','center');text('Make one in the Home Studio, then pick Save.',W/2,220,14,'#9fb','center',null);}
  listRows(this,R,34,76,572,46,6,(r,i,s,y)=>{text(r.S.name,52,y+20,16,s?'#102':'#fff','left',null);text(r.style,52,y+37,11,s?'#334':'#9fb','left',null);
   if(this.playing===i)eqBars(560,y+36,5,s?'#102':'#ffd23a');else text(r.S.bpm+' BPM',590,y+27,12,s?'#102':'#cfe','right',null);});
  if(R.length){const r=R[this.sel];panel(20,370,600,72,'#456');wrap(r.d,36,398,570,16,14,'#cfe',null);}
  text(this.mode==='preset'?'A: play/stop   Y: remix in the studio   B: back':'A: play/stop   Y: edit   X: delete   B: back',W/2,H-14,12,'#9fb','center');drawToast();}};

// ---------- Jukebox ----------
const Jukebox={name:'jukebox',sel:0,playing:-1,
 make(){this.sel=0;this.playing=-1;return this;},
 rows(){return MUSIC_LIST.filter(m=>TR[m.name]);},
 enter(){},resume(){},
 update(){const R=this.rows();navList(this,R.length);
  if(anyPressed('ok')){unlockAudio();SFX.ok();if(this.playing===this.sel){this.playing=-1;startMusic('studio');}else{this.playing=this.sel;_startMusicBase(R[this.sel].name);}}
  if(backPressed()){SFX.move();if(this.playing>=0)startMusic('studio');pop();}},
 draw(){roomBg();text('JUKEBOX',W/2,44,28,'#ffd23a','center');text(this.rows().length+' tracks',W-30,44,13,'#9fb','right');
  const R=this.rows();panel(20,62,600,320);
  listRows(this,R,34,74,572,34,9,(r,i,s,y)=>{text(r.title,52,y+20,15,s?'#102':'#fff','left',null);text(TR[r.name].bpm+' BPM',590,y+20,12,s?'#102':'#cfe','right',null);if(this.playing===i)eqBars(500,y+26,5,s?'#102':'#ffd23a');});
  const r=R[this.sel];if(r){panel(20,390,600,56,'#456');wrap(r.desc||'',36,414,570,16,13,'#cfe',null);}
  text('A: play/stop   B: back',W/2,H-14,12,'#9fb','center');}};

// ---------- Theme Picker ----------
const ThemePicker={name:'themepicker',sel:0,
 make(){this.sel=0;return this;},
 opts(){return [null].concat(PRESET_SONGS.map(p=>'p:'+p.id),SAVE.songs.map(s=>'u:'+s.id));},
 enter(){},resume(){},
 update(){navList(this,PICK_SCREENS.length);const scr=PICK_SCREENS[this.sel][0];
  const d=anyPressed('right')?1:anyPressed('left')?-1:0;
  if(d){const O=this.opts();let i=O.indexOf(SAVE.musicPick[scr]||null);if(i<0)i=0;i=(i+d+O.length)%O.length;if(O[i])SAVE.musicPick[scr]=O[i];else delete SAVE.musicPick[scr];save();SFX.move();}
  if(anyPressed('ok')){unlockAudio();SFX.ok();const S=pickSong(SAVE.musicPick[scr]);if(S)playSongNow(S);else _startMusicBase(scr);}
  if(backPressed()){SFX.move();startMusic('studio');pop();}},
 draw(){roomBg();text('THEME PICKER',W/2,44,28,'#ffd23a','center');panel(20,62,600,330);
  PICK_SCREENS.forEach(([k,n],i)=>{const y=78+i*50,s=i===this.sel;rrect(34,y,572,42,9,s?'rgba(255,210,58,.92)':'rgba(30,60,90,.65)',s?'#fff':'#2de2f5',1.5);
   text(n,52,y+27,16,s?'#102':'#fff','left',null);const pk=SAVE.musicPick[k];text((s?'< ':'')+pickName(pk)+(s?' >':''),590,y+27,15,s?'#102':pk?'#ffd23a':'#9fb','right',null);});
  panel(20,400,600,44,'#456');text('Pick any preset or your own song for each screen. Game default keeps the original track.',W/2,427,12,'#cfe','center',null);
  text('Left/Right: change song   A: preview   B: back',W/2,H-14,12,'#9fb','center');}};

// ---------- Home Studio (Groove Machine): laptop sequencer + FM-1 + beat pad + guitar ----------
const GROWS=[{n:'KICK',k:'k',col:'#ff5a5a'},{n:'SNARE',k:'s',col:'#ffb03a'},{n:'CLAP',k:'c',col:'#ffd23a'},{n:'HI-HAT',k:'h',col:'#7cf07c'},{n:'OPEN HAT',k:'O',col:'#3ee0b0'},
 {n:'PERC',k:'p',col:'#b98cff'},{n:'BASS',k:'bass',col:'#ff6fb5',notes:8},{n:'CHORDS',k:'ch',col:'#2de2f5'},{n:'LEAD',k:'lead',col:'#ffd23a',notes:15}];
const GKNOBS=[
 {n:'TEMPO',txt:S=>S.bpm,fr:S=>(S.bpm-70)/70,ch:(S,d)=>S.bpm=Math.max(70,Math.min(140,S.bpm+d*2))},
 {n:'SWING',k:'sw',max:4,txt:S=>SWING_T[S.sw]},{n:'KEY',k:'key',max:12,txt:S=>NOTE_N[S.key]},{n:'SCALE',k:'sc',max:3,txt:S=>SCALES[S.sc].n},
 {n:'CHORDS',k:'pr',max:8,txt:S=>S.bars?'CUSTOM':PROGS[S.pr].n},{n:'PATTERN',k:'patt',txt:S=>'ABC'[Groove.pi],fr:S=>Groove.pi/2,ch:(S,d)=>{Groove.pi=(Groove.pi+d+3)%3;}},{n:'KIT',k:'kit',max:5,txt:S=>KITS[S.kit].n},{n:'BASS',k:'bi',max:5,txt:S=>BASS_T[S.bi]},
 {n:'KEYS',k:'ci',max:8,txt:S=>KEYS_T[S.ci]},{n:'LEAD',k:'li',max:9,txt:S=>LEAD_T[S.li]},{n:'PAD',k:'pad',max:2,txt:S=>S.pad?'ON':'OFF'},{n:'COLOR',k:'skin',max:5,txt:S=>SKINS[S.skin].n},
 {n:'GROOVE',k:'groove',txt:S=>'DICE',fr:S=>0,ch:(S,d)=>{if(d>0)Groove.randomize();else Groove.undoGroove();}}];
const GROOVE_BTN=[158,14,60,48];
function setCh(s,i,c){return s.slice(0,i)+c+s.slice(i+1);}
const Groove={name:'groove',
 make(S,slotId){this.undo=null;this.S=S;this.slot=slotId;this.r=1;this.c=0;this.kn=0;this.lp=0;this.pi=0;this.dirty=false;this.menu=null;this.playing=false;this.lastBass=2;this.lastLead=7;return this;},
 enter(){unlockAudio();stopMusic();},resume(){},
 nbars(){return patBars(this.S,'ABC'[this.pi]).length;},
 pat(){const S=this.S;let P=S;if(this.pi>0){S.pats=S.pats||[null,null];if(!S.pats[this.pi-1])S.pats[this.pi-1]=makePat(S);P=S.pats[this.pi-1];}const n=16*this.nbars();if(P.lead.length<n)P.lead=P.lead+'.'.repeat(n-P.lead.length);return P;},
 cellKey(){const R=GROWS[this.r-1];return R.k==='lead'?{s:'lead',i:this.lp*16+this.c}:{s:R.k,i:this.c};},
 play(){unlockAudio();registerSong('__studio',this.S);if(MT.name==='__studio')stopMusic();_startMusicBase('__studio');this.playing=true;},
 stop(){stopMusic();this.playing=false;},
 // GROOVE button (v0.32): brand-new random song, keeps playing if it was playing; X / Undo brings the last one back
 randomize(){this.undo=cloneSong(this.S);this.S=grooveRandom(this.S);this.pi=0;this.lp=0;this.c=0;this.menu=null;this.dirty=true;
  if(this.playing)this.refresh();else this.play();SFX.ok();toast('GROOVE! '+grooveSummary(this.S),'#ffd23a');},
 undoGroove(){if(!this.undo){toast('Nothing to undo','#ff5a8a');return;}const u=this.undo;this.undo=null;this.S=u;this.pi=0;this.lp=0;this.c=0;this.menu=null;this.refresh();toast('Back to: '+u.name,'#2de2f5');},
 refresh(){this.dirty=true;if(this.playing&&MT.name==='__studio'){registerSong('__studio',this.S);const T=getTrack('__studio');MT.track=T;MT.pos%=T.N;}},
 step(){if(!this.playing||!MT.track||!AC)return -1;const ahead=Math.max(0,Math.round((MT.next-AC.currentTime)/MT.track.sd));return (MT.pos-ahead-1+MT.track.N*4)%MT.track.N;},
 previewGain(){const M=musBus();if(!M)return null;if(!this.pg||this.pg.context!==M.a){this.pg=M.a.createGain();this.pg.gain.value=.9;this.pg.connect(M.bus);}return this.pg;},
 preview(){if(this.playing||muted)return;unlockAudio();const g=this.previewGain();if(!g||AC.state!=='running')return;const S=this.S,t=AC.currentTime+.01,R=GROWS[this.r-1];
  const prog=patBars(S,'ABC'[this.pi])[this.r===10?this.c:0],rootPc=(S.key+prog[0])%12;
  try{if(this.r===10)COMPI[KEYSI[S.ci]](t,voice(rootPc,prog[1]),.55,.8,g);else if(R.k==='k')kick(t,1,g);else if(R.k==='s')snare(t,1,g);else if(R.k==='c')clap(t,1,g);else if(R.k==='h')hat(t,.8,false,g);else if(R.k==='O')hat(t,.8,true,g);
   else if(R.k==='p')DRUM[KITS[S.kit].p](t,1,g);
   else if(R.k==='bass'){const c=this.pat().bass[this.c];if(c==='.')return;const iv=BI[BASS_IV[+c]]!==undefined?BI[BASS_IV[+c]]:+BASS_IV[+c];BASSI[BASSES[S.bi]](t,28+((rootPc-4+12)%12)+iv,.3,1,g);}
   else if(R.k==='ch')COMPI[KEYSI[S.ci]](t,voice(rootPc,prog[1]),.45,.8,g);
   else if(R.k==='lead'){const ch=this.pat().lead[this.lp*16+this.c];if(ch==='.')return;LEADI[LEADS[S.li]](t,leadMidi(S,ch.charCodeAt(0)-97),.3,1,g);}}catch(e){}},
 knob(d){const K=GKNOBS[this.kn],S=this.S;if(K.ch)K.ch(S,d);else{S[K.k]=(S[K.k]+d+K.max)%K.max;if(K.k==='pr')delete S.bars;}SFX.move();this.refresh();},
 pitch(d){const R=GROWS[this.r-1];if(!R.notes){if(d>0)this.toggle();return;}const {s,i}=this.cellKey(),S=this.pat(),cur=S[s][i];
  let v;if(R.k==='bass'){v=cur==='.'?this.lastBass:Math.max(0,Math.min(7,+cur+d));this.lastBass=v;S[s]=setCh(S[s],i,String(v));}
  else{v=cur==='.'?this.lastLead:Math.max(0,Math.min(14,cur.charCodeAt(0)-97+d));this.lastLead=v;S[s]=setCh(S[s],i,String.fromCharCode(97+v));}
  if(R.k==='bass')delete S.bass4;this.refresh();this.preview();},
 toggle(){const R=GROWS[this.r-1],{s,i}=this.cellKey(),S=this.pat(),cur=S[s][i];
  if(R.k==='bass')S[s]=setCh(S[s],i,cur==='.'?String(this.lastBass):'.');
  else if(R.k==='lead')S[s]=setCh(S[s],i,cur==='.'?String.fromCharCode(97+this.lastLead):'.');
  else S[s]=setCh(S[s],i,cur==='.'?'x':'.');
  if(R.k==='bass')delete S.bass4;if(R.k==='ch')delete S.ch4;
  this.refresh();if(S[s][i]!=='.')this.preview();else SFX.move();},
 menuItems(){return [{n:'Keep jamming',go:()=>{this.menu=null;}},{n:'GROOVE! Random song',go:()=>this.randomize()}].concat(this.undo?[{n:'Undo groove',go:()=>this.undoGroove()}]:[],[{n:this.slot?'Save song':'Save as new song',go:()=>this.save()},
  {n:'New random name',go:()=>{this.S.name=randSongName();this.dirty=true;toast('Name: '+this.S.name,'#2de2f5');}},
  {n:'Clear this pattern',go:()=>{const P=this.pat();PAT_KEYS.forEach(k=>P[k]=k==='lead'?'.'.repeat(64):blank16);delete P.bass4;delete P.ch4;delete P.fill;if(this.pi>0)delete P.bars;this.refresh();this.menu=null;toast('Pattern '+'ABC'[this.pi]+' cleared','#2de2f5');}},
  {n:'Clear everything',go:()=>{this.pi=0;const n=this.S.name,sk=this.S.skin;this.S=blankSong();this.S.name=n;this.S.skin=sk;['k','s','h','bass'].forEach(k=>this.S[k]=k==='bass'?blank16:blank16);this.refresh();this.menu=null;toast('Clean slate!','#2de2f5');}},
  {n:this.dirty?'Exit (unsaved changes lost)':'Exit',go:()=>{this.stop();pop();}}]);},
 save(){const S=this.S;if(this.slot){const i=SAVE.songs.findIndex(x=>x.id===this.slot);if(i>=0){S.id=this.slot;SAVE.songs[i]=cloneSong(S);}}
  else{if(SAVE.songs.length>=8){toast('Song shelf full (8). Delete one in My Songs.','#ff5a8a');SFX.hurt();return;}S.id=Date.now().toString(36)+(Math.random()*1e4|0).toString(36);this.slot=S.id;SAVE.songs.push(cloneSong(S));}
  save();this.dirty=false;this.menu=null;SFX.ok();playStinger('unlock');toast('Saved: '+S.name);},
 update(){if(this.menu){const I=this.menuItems();navList(this.menu,I.length);if(anyPressed('ok')){SFX.ok();I[this.menu.sel].go();return;}if(backPressed()){this.menu=null;SFX.move();}return;}
  if(backPressed()){this.menu={sel:0};SFX.move();return;}
  if(anyPressed('start')){if(this.playing)this.stop();else this.play();SFX.move();return;}
  if(anyPressed('up')){this.r=(this.r+11)%12;SFX.move();}if(anyPressed('down')){this.r=(this.r+1)%12;SFX.move();}
  if(this.r===11){const S=this.S,arr=songArr(S);if(this.c>arr.length)this.c=arr.length;if(this.c>7)this.c=7;
   if(anyPressed('left')){this.c=(this.c+arr.length)%(arr.length+(arr.length<8?1:0));SFX.move();}if(anyPressed('right')){this.c=(this.c+1)%(arr.length+(arr.length<8?1:0));SFX.move();}
   const od=anyPressed('gadget')?1:anyPressed('attack')?-1:0;
   if(this.c>=arr.length){if(anyPressed('ok')||od>0){S.arr=arr+'A';this.pi=0;this.refresh();SFX.ok();}}
   else if(od){const L='ABC'[('ABC'.indexOf(arr[this.c])+od+3)%3];S.arr=arr.slice(0,this.c)+L+arr.slice(this.c+1);this.pi='ABC'.indexOf(L);this.refresh();SFX.move();}
   else if(anyPressed('ok')){if(arr.length>1){S.arr=arr.slice(0,this.c)+arr.slice(this.c+1);if(S.arr==='A')delete S.arr;this.refresh();SFX.hurt();}else SFX.move();}
   return;}
  if(this.r===10){const nb=this.nbars();if(this.c>nb-1)this.c=nb-1;if(anyPressed('left')){this.c=(this.c+nb-1)%nb;SFX.move();this.preview();}if(anyPressed('right')){this.c=(this.c+1)%nb;SFX.move();this.preview();}
   const bd=anyPressed('gadget')?1:anyPressed('attack')?-1:0,qd=anyPressed('ok')?1:0;
   if(bd||qd){const T=this.pi===0?this.S:this.pat();if(!T.bars||T.bars.length<4)T.bars=patBars(this.S,'ABC'[this.pi]).map(a=>a.slice());const b=T.bars[this.c];
    if(qd)b[1]=QLIST[(QLIST.indexOf(b[1])+1)%QLIST.length];else b[0]=(b[0]+bd+12)%12;this.refresh();this.preview();}return;}
  const isLead=this.r===9;
  if(anyPressed('left')){if(this.r===0)this.kn=(this.kn+GKNOBS.length-1)%GKNOBS.length;else if(this.c>0)this.c--;else{this.c=15;if(isLead)this.lp=(this.lp+this.nbars()-1)%this.nbars();}SFX.move();}
  if(anyPressed('right')){if(this.r===0)this.kn=(this.kn+1)%GKNOBS.length;else if(this.c<15)this.c++;else{this.c=0;if(isLead)this.lp=(this.lp+1)%this.nbars();}SFX.move();}
  const ok=anyPressed('ok');
  if(ok){if(this.r===0)this.knob(1);else this.toggle();}
  else if(anyPressed('gadget')){if(this.r===0)this.knob(1);else this.pitch(1);}
  else if(anyPressed('attack')){if(this.r===0)this.knob(-1);else this.pitch(-1);}},
 curLead(st){if(st<0)return -1;const sl=slotAt(this.S,Math.floor(st/16)),Pt=patOf(this.S,songArr(this.S)[sl.entry]),L16=16*sl.nb,sp=sl.barIn*16+st%16;for(let b=0;b<4;b++){const k=(sp-b+L16)%L16,c=Pt.lead[k]||'.';if(c!=='.')return leadMidi(this.S,c.charCodeAt(0)-97);}return -1;},
 draw(){const S=this.S,SK=SKINS[S.skin],st=this.step(),bar=st>=0?Math.floor(st/16):-1,col16=st>=0?st%16:-1;
  const arr=songArr(S),sl=bar>=0?slotAt(S,bar):null,entry=sl?sl.entry:-1,barIn=sl?sl.barIn:-1,PL=entry>=0?patOf(S,arr[entry]):S,V=this.pat(),same=PL===V,NB=this.nbars();
  const thump=st>=0&&PL.k[col16]==='x'?1:0,now=AC?AC.currentTime:0,shake=now-GTR.hit>=0&&now-GTR.hit<.35?(1-(now-GTR.hit)/.35):0;
  roomBg();
  // desk
  ctx.fillStyle='#4a2a14';ctx.fillRect(0,438,W,42);ctx.fillStyle='#7a4a22';ctx.fillRect(0,434,W,8);
  // ---- electric guitar on a stand ----
  ctx.strokeStyle='#222';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(30,436);ctx.lineTo(54,380);ctx.lineTo(78,436);ctx.moveTo(54,380);ctx.lineTo(54,300);ctx.stroke();
  rrect(45,120,18,190,4,'#8a5a2a','#000',2);for(let f=0;f<9;f++){ctx.fillStyle='#d8c08a';ctx.fillRect(45,140+f*19,18,2);}
  rrect(42,100,24,26,6,'#e2343a','#000',2);for(const py of [106,114,122]){ctx.fillStyle='#ddd';ctx.fillRect(36,py-2,6,4);ctx.fillRect(66,py-2,6,4);}
  ctx.fillStyle='#e2343a';ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(54,338,30,30,0,0,7);ctx.ellipse(54,388,40,36,0,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='#e2343a';ctx.beginPath();ctx.ellipse(54,338,28,28,0,0,7);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(40,378,16,22,.3,0,7);ctx.fill();
  for(const py of [340,372]){rrect(42,py,24,9,2,'#222','#000',1);}rrect(44,398,20,6,2,'#bbb','#000',1);
  ctx.strokeStyle='#eee';ctx.lineWidth=1;for(let k=0;k<4;k++){const x=48+k*4,w=shake*Math.sin(TIME*90+k)*2.2;ctx.beginPath();ctx.moveTo(x,112);ctx.quadraticCurveTo(x+w,260,x,401);ctx.stroke();}
  if(shake>0){ctx.strokeStyle='rgba(255,210,58,'+shake+')';ctx.lineWidth=2;for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(54,388,48+k*8,-1.2,-.4);ctx.stroke();}}
  // ---- beat pad (pads flash with the drums) ----
  rrect(6,8,140,92,10,'#26262e','#000',3);
  const PADS=[['k','#ff5a5a'],['s','#ffb03a'],['c','#ffd23a'],['h','#7cf07c'],['O','#3ee0b0'],['p','#b98cff'],['bass','#ff6fb5'],['ch','#2de2f5']];
  PADS.forEach(([k,c],i)=>{const x=14+(i%4)*32,y=16+Math.floor(i/4)*40,hit=col16>=0&&PL[k][col16]!=='.';rrect(x,y,28,34,6,hit?c:'#3a3a46','#000',1.5);if(hit){ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x+4,y+4,20,6);}});
  // ---- FM-1 pocket synth: sound knobs, keys light up with the lead ----
  const FC=FMC[SK.fm];
  rrect(152,8,482,92,12,FC.body,'#000',3);rrect(156,12,474,84,9,null,FC.edge,1.5);
  {const [gx,gy,gw,gh]=GROOVE_BTN,gs=this.r===0&&this.kn===12,pulse=this.playing?.5+.5*Math.sin(TIME*8):0;
   rrect(gx,gy,gw,gh,9,gs?'#ffd23a':'#ff5a8a','#000',gs?3:2);ctx.fillStyle='rgba(255,255,255,'+(.15+pulse*.2)+')';ctx.fillRect(gx+5,gy+4,gw-10,6);
   rrect(gx+gw/2-11,gy+9,22,22,5,'#fff','#000',1.5);ctx.fillStyle='#102';for(const [ox,oy] of [[-6,-6],[6,-6],[0,0],[-6,6],[6,6]]){ctx.beginPath();ctx.arc(gx+gw/2+ox,gy+20+oy,2.2,0,7);ctx.fill();}
   text('GROOVE',gx+gw/2,gy+gh-5,9,'#102','center',null);}
  rrect(222,12,84,52,6,'#222','#000',2);rrect(226,16,76,44,3,'#a9b6b0',null);
  text(S.name.length>12?S.name.slice(0,11)+'.':S.name,264,32,9,'#123','center',null);text((this.playing?'PLAY ':'STOP ')+S.bpm,264,50,9,this.playing?'#063':'#622','center',null);
  for(let k=6;k<12;k++){const K=GKNOBS[k],cx=336+(k-6)*54,cy=36,s=this.r===0&&this.kn===k,fr=K.fr?K.fr(S):S[K.k]/Math.max(1,K.max-1);
   text(K.n,cx,20,8,s?'#c80':FC.txt,'center',null);ctx.fillStyle='#151515';ctx.beginPath();ctx.arc(cx,cy,11,0,7);ctx.fill();if(s){ctx.lineWidth=3;ctx.strokeStyle='#ffd23a';ctx.stroke();}
   const an=Math.PI*.75+fr*Math.PI*1.5;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(an)*9,cy+Math.sin(an)*9);ctx.stroke();
   text(String(K.txt(S)),cx,60,8,s?'#c80':FC.txt,'center',null);}
  const lm=this.playing?this.curLead(st):-1,base=leadMidi(S,0)-((leadMidi(S,0)%12+12)%12);
  rrect(160,66,466,28,8,FC.strip,'#000',1.5);
  for(let k=0;k<25;k++){const x=164+k*18.4,on=lm>=0&&lm-base===k;rrect(x,69,15,22,7,on?FC.lit:FC.key,'rgba(0,0,0,.4)',1);}
  // ---- the laptop ----
  ctx.fillStyle=SK.a;ctx.beginPath();ctx.moveTo(98,428);ctx.lineTo(634,428);ctx.lineTo(640,442);ctx.lineTo(92,442);ctx.closePath();ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();
  rrect(330,430,70,5,2,SK.b,null);
  rrect(104,104,530,326,14,SK.b,'#000',3);rrect(112,112,514,310,6,'#0d1020',null);
  rrect(112,112,514,16,6,'#1c2240',null);for(let k=0;k<3;k++){ctx.fillStyle=['#ff5f57','#febc2e','#28c840'][k];ctx.beginPath();ctx.arc(122+k*11,120,3.5,0,7);ctx.fill();}
  text('Groove Studio',370,124,10,'#aab','center',null);
  // transport fields (knobs 0-4)
  for(let k=0;k<6;k++){const K=GKNOBS[k],x=118+k*85,s=this.r===0&&this.kn===k;rrect(x,132,81,28,5,'#141a30',s?'#ffd23a':'#33406a',s?3:1.5);
   text(K.n,x+6,143,8,s?'#ffd23a':'#8fa0d0','left',null);text(String(K.txt(S)),x+75,155,12,s?'#ffd23a':'#fff','right',null);}
  // pads
  const x0=182,cw=26,y0=166,rh=22;
  GROWS.forEach((R,ri)=>{const y=y0+ri*rh,sel=this.r===ri+1,isL=R.k==='lead',str=isL?V.lead.slice(this.lp*16,this.lp*16+16):V[R.k];
   text(R.k==='p'?KITS[S.kit].pn:isL?'LEAD '+(this.lp+1)+'/'+NB:R.n,177,y+16,10,sel?'#ffd23a':'#dde','right',null);
   for(let c=0;c<16;c++){const x=x0+c*cw,v=str[c],on=v!=='.';
    rrect(x+2,y+2,cw-4,rh-4,4,on?R.col:(Math.floor(c/4)%2?'#161a2c':'#232842'),'#000',1);
    if(on&&R.notes){const lv=R.k==='bass'?+v:v.charCodeAt(0)-97,h=(rh-8)*(lv+1)/R.notes;ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x+5,y+4,cw-10,rh-8-h);}
    if(on&&col16===c&&same&&(!isL||barIn===this.lp)){ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(x+3,y+3,cw-6,rh-6);}}});
  if(col16>=0&&same){ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(x0+col16*cw,y0,cw,rh*9);}
  if(this.r>0&&this.r<10){const x=x0+this.c*cw,y=y0+(this.r-1)*rh;rrect(x,y,cw,rh,5,null,'#ffd23a',3);}
  const P=patBars(S,'ABC'[this.pi]);const bw=NB>4?52:104;text(this.r===10?'BARS':S.bars?'BARS*':'BARS',177,y0+9*rh+16,10,this.r===10?'#ffd23a':'#dde','right',null);
  P.forEach(([o,q],i)=>{const x=x0+i*bw,y=y0+9*rh+2,on=barIn===i&&same,pg=this.r===10?this.c===i:this.r===9&&this.lp===i;rrect(x+2,y,bw-4,18,5,on?SK.a:'#232842',pg?'#ffd23a':'#000',pg?2.5:1);
   text(NOTE_N[(S.key+o)%12]+QN[q],x+bw/2,y+14,NB>4?9:12,on?'#102':'#fff','center',null);});
  {const oy=y0+9*rh+22;text('ORDER',177,oy+14,10,this.r===11?'#ffd23a':'#dde','right',null);
   for(let i=0;i<=arr.length&&i<8;i++){const x=x0+i*52,add=i===arr.length,pg=this.r===11&&this.c===i,on=!add&&entry===i,Lc=add?'+':arr[i],col=add?'#232842':on?SK.a:'#232842';
    rrect(x+2,oy,48,18,5,col,pg?'#ffd23a':'#000',pg?2.5:1);text(Lc,x+26,oy+14,12,on?'#102':add?'#7a86a8':['#ff9a5a','#7cf07c','#b98cff'][Math.max(0,'ABC'.indexOf(Lc))],'center',null);}}
  let info='';if(this.r===11){info=this.c>=arr.length?'ORDER: A adds a section':'ORDER slot '+(this.c+1)+': pattern '+arr[this.c]+'   Y/X: change   A: remove';}else if(this.r===10){const [bo,bq]=P[this.c];info='BAR '+(this.c+1)+': '+NOTE_N[(S.key+bo)%12]+QN[bq]+'   Y/X: root   A: chord type';}else if(this.r===0)info=this.kn===12?'GROOVE: A or Y = brand-new random song   X = undo':GKNOBS[this.kn].n+': '+GKNOBS[this.kn].txt(S)+(this.kn>=6?'   (FM-1)':'');
  else{const R=GROWS[this.r-1],{s,i}=this.cellKey(),v=V[s][i];
   info=R.k==='bass'?(v==='.'?'BASS: empty step':'BASS: '+BASS_L[+v]+' of the chord'):R.k==='lead'?(v==='.'?'LEAD: empty step':'LEAD: '+songNoteName(leadMidi(S,v.charCodeAt(0)-97))):R.n+(v==='.'?': off':': on')+'   step '+(this.c+1);}
  text((this.pi?'[PATTERN '+'ABC'[this.pi]+'] ':'')+info,120,418,11,'#ffd23a','left',null);
  // speakers thump on the desk edge
  if(thump){ctx.fillStyle=SK.a;ctx.beginPath();ctx.arc(612,412,4,0,7);ctx.fill();}
  text('A: place/remove  Y/X: higher/lower  Start: play/stop  B: menu   Tap the dice: GROOVE',W/2,462,12,'#fff','center');
  text('Keyboard: Space place, G or / higher, F or . lower, Tab or Enter play, Q or R-Shift menu',W/2,476,10,'#cfe','center',null);
  if(this.menu){dim(.55);panel(190,110,260,296,SK.a);text('SONG MENU',320,140,20,'#ffd23a','center');
   this.menuItems().forEach((it,i)=>{const y=156+i*40,s=i===this.menu.sel;rrect(206,y,228,34,9,s?'rgba(255,210,58,.95)':'rgba(30,60,90,.85)',s?'#fff':'#2de2f5',2);text(it.n,320,y+22,13,s?'#102':'#fff','center',null);});}
  drawToast();}};

// tap the GROOVE dice on the FM-1 (mouse or touch)
canvas.addEventListener('pointerdown',e=>{if(scene!==Groove||Groove.menu)return;const r=canvas.getBoundingClientRect(),mx=(e.clientX-r.left)*W/r.width,my=(e.clientY-r.top)*H/r.height,[gx,gy,gw,gh]=GROOVE_BTN;
 if(mx>=gx&&mx<=gx+gw&&my>=gy&&my<=gy+gh){unlockAudio();Groove.randomize();}});
