// ===== Lockpick Groove: rhythm lockpicking mode (v0.24) =====
// LEVEL_DEFS entry with type:'lockpick' and locks:[{name, bpm, bars, density 0..1, sixteenths(bool), clue, seed}].
// Notes slide along two lanes into the pick line on the beat of the lock's own groove.
//  TOP lane = JUMP (A), BOTTOM lane = ATTACK (X/B). In co-op, P1 plays the top lane and P2 the bottom lane.
// Each lock has 4 pins; a pin is one bar of notes and SETS when you hit at least 70% of that bar. Missed pins come back.
// Misses raise TENSION; a full tension bar snaps a pick (3 picks). Out of picks = mission failed.
// CALL AND RESPONSE (Michael's pick): the LAST lock of each mission is a finale (or set call:true/false on any lock).
//  Each pin is 2 bars: the lock PLAYS a pattern (LISTEN), then you tap it back (YOUR TURN). Patterns get longer each pin.
// Timing comes from the music sequencer when audio runs (MT.pos/MT.next), else from its own clock (tests, muted tabs).
function lpRng(seed){let s=seed*16807+11;return ()=>((s=(s*16807)%2147483647)/2147483647);}
const LP_SONGS={};
function lpSong(L,idx){const key='lock_'+idx+'_'+L.bpm;if(LP_SONGS[key]||typeof registerSong!=='function')return key;
 registerSong(key,{name:'Lock Groove',bpm:L.bpm,sw:0,key:[4,7,2,9][idx%4],sc:1,pr:[0,3,1,2][idx%4],kit:[0,2,1,3][idx%4],bi:[0,4,1,2][idx%4],ci:[1,6,4,0][idx%4],li:[5,7,1,6][idx%4],pad:0,skin:idx%5,
  k:'x.....x...x.....',s:'....x.......x...',c:'............x...',h:'x.x.x.x.x.x.x.x.',O:'.'.repeat(16),p:'..x...x...x...x.',
  bass:'2.....2.5...7...',ch:'..x...x...x...x.',lead:'.'.repeat(64)});TR[key].title='Lock Groove';LP_SONGS[key]=1;return key;}
function makeLockpick(def,np){
 const K={name:'lockpick',def,np,state:'intro',introIdx:0,outroIdx:0,t:0,paused:false,li:0,picks:3,tension:0,clues:[],floats:[],endT:0,clearT:0,
  perfects:0,goods:0,misses:0,flash:[0,0]};
 const R=(typeof achRunStart==='function')?achRunStart(def,np):{};K.R=R;
 const HITX=150,SPEED=120;   // px per beat
 let own=0;
 function songPos(){const L=def.locks[K.li],sd=60/L.bpm/4;const a=typeof AC!=='undefined'&&AC;
  if(a&&a.state==='running'&&MT.timer&&MT.name===K.song&&MT.track){K.src='mt';const N=MT.track.N,raw=MT.pos-(MT.next-a.currentTime)/MT.track.sd;
   if(K.lastRaw!=null&&raw<K.lastRaw-N/2)K.wrap+=N;K.lastRaw=raw;return {pos:raw+K.wrap,sd:MT.track.sd};}
  K.src='own';return {pos:own/sd,sd};}
 function load(){const L=def.locks[K.li];K.song=lpSong(L,K.li);startMusic(K.song);own=0;K.wrap=0;K.lastRaw=null;K.pin=0;K.notes=[];K.pinsSet=0;K.tension=0;K.startAt=null;}
 const isCall=L=>L.call!=null?!!L.call:(def.locks.length>1&&def.locks.indexOf(L)===def.locks.length-1);
 K.isCall=()=>isCall(def.locks[K.li]);
 function makeBar(barStart){const L=def.locks[K.li],r=lpRng((L.seed||3)*31+K.pin*7+K.retry*13),N=[];K.listen=null;
  if(isCall(L)){const want=Math.min(7,3+K.pin),S=new Set([0]);let g=0;while(S.size<want&&g++<200){const st=Math.floor(r()*8)*2;if(![...S].some(x=>Math.abs(x-st)<2))S.add(st);}
   const P=[...S].sort((a,b)=>a-b).map(st=>({s:st,lane:r()<.5?0:1}));K.listen=P.map(n=>({at:barStart+n.s,lane:n.lane,played:0}));
   return P.map(n=>({at:barStart+16+n.s,lane:n.lane,hit:0,bar:barStart,ghost:1}));}
  for(let s=0;s<16;s++){const on8=s%2===0,beat=s%4===0;if(!L.sixteenths&&!on8)continue;const p=beat?.85:on8?L.density:L.density*.5;if(r()<p&&N.filter(n=>n.s>=s-1).length===0){N.push({s,lane:r()<.5?0:1});}}
  if(N.length<3)N.push({s:0,lane:0},{s:8,lane:1});
  return N.map(n=>({at:barStart+n.s,lane:n.lane,hit:0,bar:barStart}));}
 K.retry=0;load();K.songPos=()=>songPos();
 const float=(x,y,t,c='#fff')=>K.floats.push({x,y,t,c,life:1});
 function finish(win){K.state='end';K.win=win;K.endT=0;stopMusic();playStinger(win?'win':'lose');}
 function payout(){R.coinTotal=0;R.coinsGot=0;R.kos=0;R.oops=0;if(typeof lv==='function'){const V=lv(def.id);if(K.picksLost===0||K.picks===3)V.noSnap=1;if(K.misses===0)V.fullCombo=1;}
  K.players=[{hp:K.picks,down:false}];missionPayout(def,np,{clues:K.clues,coins:0,kills:0,total:def.locks.filter(l=>l.clue!=null).length});}
 K.enter=function(){startMusic(K.song);};K.resume=function(){};
 K.update=function(dt){K.t+=dt;for(const f of K.floats){f.life-=dt;f.y-=24*dt;}K.floats=K.floats.filter(f=>f.life>0);K.flash=K.flash.map(v=>Math.max(0,v-dt));
  if(K.state==='intro'){if(anyPressed('ok')||anyPressed('attack')){SFX.move();K.introIdx++;if(K.introIdx>=def.intro.length){K.state='play';load();}}return;}
  if(K.state==='outro'){K.endT+=dt;if(K.endT>.4&&(anyPressed('ok')||anyPressed('attack'))){SFX.move();K.outroIdx++;K.endT=0;if(K.outroIdx>=def.outro.lines.length)payout();}return;}
  if(K.paused)return;
  if(K.state==='end'){K.endT+=dt;if(K.endT>2.2){if(K.win){K.state='outro';K.outroIdx=0;K.endT=0;startMusic('cutscene');}else Results.show({win:0,name:levelName(def.id),id:def.id});}return;}
  if(K.state==='clear'){K.clearT+=dt;if(K.clearT>1.8){if(K.li+1>=def.locks.length)finish(true);else{K.li++;K.retry=0;load();K.state='play';}}return;}
  if(anyPressed('start')){K.paused=true;push(Watch.make('level'));return;}
  own+=dt;R.t=(R.t||0)+dt;
  const {pos,sd}=songPos();
  if(K.srcPrev!==K.src){if(K.srcPrev!=null){K.startAt=null;K.notes=[];K.listen=null;}K.srcPrev=K.src;return;}  // audio clock switched on: restart this bar in sync
  if(K.startAt==null){K.startAt=Math.ceil((pos+8)/16)*16;K.notes=makeBar(K.startAt);K.barAt=K.startAt;}
  // judge presses
  const lanePress=[pressed(0,'jump')||(np===1&&pressed(1,'jump')),np>1?pressed(1,'attack'):(pressed(0,'attack')||pressed(1,'attack'))];
  if(np>1){lanePress[0]=pressed(0,'jump')||pressed(0,'attack');lanePress[1]=pressed(1,'jump')||pressed(1,'attack');}
  if(K.listen){for(const n of K.listen)if(!n.played&&pos>=n.at){n.played=1;beep(n.lane?520:780,.1,'triangle',.06);K.flash[n.lane]=.15;}}
  const listening=K.listen&&pos<K.barAt+15.5;
  for(let l=0;l<2;l++){if(!lanePress[l])continue;K.flash[l]=.12;if(listening)continue;
   let best=null,bd=1e9;for(const n of K.notes)if(!n.hit&&n.lane===l){const d=Math.abs(n.at-pos)*sd;if(d<bd){bd=d;best=n;}}
   if(best&&bd<.09){best.hit=bd<.045?2:1;if(best.hit===2){K.perfects++;bump&&bump('lockPerfect');float(HITX,laneY(l)-26,'PERFECT','#7ff');}else{K.goods++;float(HITX,laneY(l)-26,'GOOD','#9f9');}
    beep(best.lane?520:780,.06,'triangle',.05);K.tension=Math.max(0,K.tension-.04);}
   else{K.tension=Math.min(1,K.tension+.08);float(HITX,laneY(l)-26,'CLINK','#f99');beep(160,.08,'square',.04);}}
  // passed notes = misses
  for(const n of K.notes)if(!n.hit&&(pos-n.at)*sd>.12){n.hit=-1;K.misses++;K.tension=Math.min(1,K.tension+.12);}
  if(K.tension>=1){K.picks--;K.picksLost=(K.picksLost||0)+1;R.hits=(R.hits||0)+1;K.tension=.3;SFX.hurt();float(W/2,200,'SNAP! The pick broke!','#ff5a5a');if(K.picks<=0){finish(false);return;}}
  // end of the bar: score the pin
  const barEnd=K.barAt+(K.listen?32:16);if(pos>=barEnd+1){const tot=K.notes.length,ok=K.notes.filter(n=>n.hit>0).length;
   if(ok/tot>=.7){K.pinsSet++;playStinger('clue');float(W/2,150,'PIN '+K.pinsSet+' SET!','#ffd23a');K.pin++;}else{K.retry++;float(W/2,150,'Pin slipped. Again!','#ff9ac0');}
   if(K.pinsSet>=4){K.state='clear';K.clearT=0;playStinger('unlock');const L=def.locks[K.li];if(L.clue!=null){K.clues.push(L.clue);float(W/2,120,'CLUE: '+CLUES[L.clue].name,'#ffd23a');}stopMusic();return;}
   K.barAt=Math.ceil((pos+4)/16)*16;K.notes=makeBar(K.barAt);}};
 const laneY=l=>l?318:238;
 K.draw=function(){const L=def.locks[K.li];ctx.fillStyle='#1a1030';ctx.fillRect(0,0,W,H);
  // the lock face
  rrect(40,70,560,96,16,'#6a5a3a','#1a1208',4);rrect(52,82,536,72,10,'#8a7a52',null);
  for(let i=0;i<4;i++){const x=150+i*110,set=i<K.pinsSet,act=i===K.pinsSet&&K.state==='play';rrect(x-18,92,36,52,6,'#3a3020','#000',2);
   const up=set?0:(act?Math.abs(Math.sin(K.t*8))*8:16);rrect(x-12,98+up,24,26,4,set?'#ffd23a':'#c8b890','#000',2);if(act){ctx.strokeStyle='#7ff';ctx.lineWidth=2;ctx.strokeRect(x-20,90,40,56);}}
  text(L.name+(K.isCall()?'  -  FINALE: CALL AND RESPONSE':''),W/2,62,16,'#ffd23a','center');
  // lanes
  const {pos,sd}=K.startAt!=null?songPos():{pos:0,sd:.15};
  for(let l=0;l<2;l++){const y=laneY(l);rrect(30,y-26,580,52,12,l?'rgba(255,90,224,.12)':'rgba(45,226,245,.12)',l?'#ff5ae0':'#2de2f5',2);
   text(l?(np>1?'P2':'ATTACK'):(np>1?'P1':'JUMP'),40,y+5,12,l?'#ff9ae0':'#7ff','left',null);}
  // beat lines
  if(K.startAt!=null){for(let b=Math.floor(pos/4)-1;b<pos/4+8;b++){const x=HITX+(b*4-pos)*SPEED/4;if(x<HITX-20||x>W)continue;ctx.fillStyle=b%4===0?'rgba(255,255,255,.25)':'rgba(255,255,255,.08)';ctx.fillRect(x,212,2,132);}
   for(const n of K.notes){const x=HITX+(n.at-pos)*SPEED/4,y=laneY(n.lane);if(x<HITX-40||x>W+20)continue;if(n.hit>0)continue;
    if(n.ghost&&n.hit===0){ctx.strokeStyle=n.lane?'rgba(255,90,224,.45)':'rgba(45,226,245,.45)';ctx.lineWidth=3;ctx.setLineDash([4,4]);ctx.beginPath();ctx.arc(x,y,12,0,7);ctx.stroke();ctx.setLineDash([]);continue;}
    ctx.fillStyle=n.hit<0?'#555':n.lane?'#ff5ae0':'#2de2f5';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,13,0,7);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-4,y-4,4,0,7);ctx.fill();}
   if(K.listen){for(const n of K.listen){const x=HITX+(n.at-pos)*SPEED/4,y=laneY(n.lane);if(x<HITX-40||x>W+20)continue;
     ctx.fillStyle=n.played?'rgba(255,210,58,.35)':'#ffd23a';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-14);ctx.lineTo(x+13,y);ctx.lineTo(x,y+14);ctx.lineTo(x-13,y);ctx.closePath();ctx.fill();ctx.stroke();}
    const lis=pos<K.barAt+16;rrect(W/2-110,180,220,28,10,lis?'rgba(60,40,0,.9)':'rgba(0,50,30,.9)',lis?'#ffd23a':'#7f7',2);
    text(lis?'LISTEN... (gold = the lock plays)':'YOUR TURN! Tap it back',W/2,199,12,lis?'#ffd23a':'#7f7','center',null);}}
  for(let l=0;l<2;l++){const y=laneY(l);ctx.strokeStyle=K.flash[l]>0?'#fff':'#ffd23a';ctx.lineWidth=K.flash[l]>0?5:3;ctx.beginPath();ctx.arc(HITX,y,18,0,7);ctx.stroke();}
  // pick + tension
  ctx.save();ctx.translate(HITX-60,280);ctx.rotate(-.2+Math.sin(K.t*20)*K.tension*.1);rrect(-50,-4,90,8,3,'#ccd','#000',2);ctx.restore();
  text('TENSION',360,384,12,'#cfe','left',null);rrect(430,374,170,12,6,'#1a2240',null);rrect(430,374,Math.max(6,170*K.tension),12,6,K.tension>.7?'#ff4a4a':'#ffb347',null);
  for(let i=0;i<3;i++){ctx.save();ctx.translate(40+i*26,380);ctx.rotate(-.6);rrect(-3,-14,6,28,2,i<K.picks?'#ccd':'#333','#000',1.5);ctx.restore();}text('PICKS',120,385,12,'#cfe','left',null);
  rrect(4,2,W-8,30,8,'rgba(6,20,36,.92)','#2de2f5',2);text('LOCK '+(K.li+1)+' / '+def.locks.length,14,22,13,'#ffd23a','left',null);
  imgC('markers/clue',160,16,18);text(K.clues.length+'/'+def.locks.filter(l=>l.clue!=null).length,172,21,12,'#ffd23a','left',null);
  text('Hit the notes on the beat at the gold ring. 70% of a bar sets a pin.',W-12,21,10,'#9fb','right',null);
  for(const f of K.floats)text(f.t,f.x,f.y,13,f.c,'center');
  if(K.state==='clear'){rrect(W/2-120,180,240,52,12,'rgba(6,30,16,.95)','#7f7',3);text('CLICK! UNLOCKED',W/2,214,22,'#7f7','center',null);}
  if(K.state==='intro'){dim(.45);text(def.title,W/2,110,20,'#ffd23a','center');text(def.sub,W/2,134,13,'#cfe','center');const ex=def.introExpr||['happy'];sandyBox(def.intro,ex[K.introIdx%ex.length],Math.min(K.introIdx,def.intro.length-1));}
  if(K.state==='end'){dim(Math.min(.6,K.endT*.4));text(K.win?def.winText||'ALL UNLOCKED!':'MISSION FAILED',W/2,H/2,32,K.win?'#ffd23a':'#ff5a8a','center');}
  if(K.state==='outro'){dim(.55);const ex=def.outro.expr||['happy'];sandyBox(def.outro.lines,ex[K.outroIdx%ex.length],Math.min(K.outroIdx,def.outro.lines.length-1));}
  if(SAVE.testing)text('TESTING MODE',W/2,H-6,10,'#ff5ae0','center');};
 return K;}
