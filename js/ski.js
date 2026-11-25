// ===== Sandia Ski Run (v0.37): top-down downhill ski mode =====
// LEVEL_DEFS entry with type:'ski' (aq2 is defined in abq.js). The camera rides down the mountain with the skiers.
// Steering has 7 headings like a compass: LEFT/RIGHT turn one step (hold to keep turning). Straight down is fastest,
// sideways stops you (press again to shuffle sideways). DOWN = tuck (point downhill, go faster), UP = snowplow brake.
// JUMP = little hop (clears stumps, rocks and moguls). Ramps launch you: press ATTACK in the air for tricks (cash on landing,
// but land while still spinning and you WIPE OUT). ATTACK on the snow = throw a snowball (stooges tumble, the snowmobile stalls).
// GADGET = turbo tuck (3 per run). Slalom gates: pass between the flags for coins. Lefty chases on a snowmobile from halfway down.
const SK_L=34,SK_R=606;
function makeSki(def,np){
 const big=cheatOn('bigair'),chile=cheatOn('greenchile');
 const S={name:'ski',def,np,state:'intro',introIdx:0,outroIdx:0,t:0,paused:false,hearts:4,clues:[],coins:0,kills:0,floats:[],obs:[],skiers:[],balls:[],
  camY:0,endT:0,crashes:0,tricks:0,gates:0,streak:0,chaser:null,len:def.length};
 const R=(typeof achRunStart==='function')?achRunStart(def,np):{};S.R=R;
 let seed=4242;const rng=()=>((seed=(seed*16807)%2147483647)/2147483647);
 S.players=[];for(let i=0;i<np;i++){const ch=i?p2Char():p1Char();S.players.push({i,ch,x:np>1?280+i*80:320,y:60,dir:0,v:80,air:0,airT:0,airH:0,trickT:0,trickPend:0,spin:0,stun:0,inv:0,
  boost:0,boosts:3,snowCd:0,turnT:0,shuffle:0,trail:[],down:0});}
 // ---------- build the mountain (seeded, same every run) ----------
 const O=S.obs,add=o=>O.push(o);
 const free=(x,y,r)=>!O.some(o=>Math.abs(o.y-y)<r+34&&Math.abs(o.x-x)<r+40);
 let coinTotal=0;
 for(let y=420;y<S.len-500;y+=64){const pr=y/S.len,dens=.3+pr*.45;
  for(let k=0;k<5;k++){if(rng()>dens)continue;const x=SK_L+30+rng()*(SK_R-SK_L-60),r=rng();
   if(!free(x,y,22))continue;
   if(r<.5){const b=rng()<.3;add({k:b?'bigtree':'tree',x,y,r:b?16:12});}else if(r<.66)add({k:'rock',x,y,r:12});else if(r<.8)add({k:'stump',x,y,r:9});else add({k:'mogul',x,y,r:22});}}
 const clearArea=(y0,y1,x0,x1)=>{for(let i=O.length-1;i>=0;i--){const o=O[i];if(o.y>y0&&o.y<y1&&o.x>x0&&o.x<x1)O.splice(i,1);}};
 const C0=def.clue0||0,clueAt=[.22,.52,.82];
 for(let y=900;y<S.len-800;y+=1050){const run=Math.floor(y/1050)%3;
  if(run===0){for(let g=0;g<4;g++){const gy=y+g*150,cx=g%2?400:240;clearArea(gy-70,gy+70,cx-90,cx+90);add({k:'gate',x:cx,y:gy,w:90,col:g%2?'#2a6aff':'#ff3a3a'});}}
  else if(run===1){const cx=200+rng()*240;clearArea(y-80,y+420,cx-90,cx+90);add({k:'ramp',x:cx,y,r:30});for(let c=0;c<6;c++){add({k:'coin',x:cx,y:y+60+c*42,air:1});coinTotal++;}}
  else{const cx=150+rng()*340;clearArea(y-30,y+300,cx-40,cx+40);for(let c=0;c<7;c++){add({k:'coin',x:cx+Math.sin(c*.8)*24,y:y+c*42});coinTotal++;}}}
 clueAt.forEach((f,i)=>{const y=Math.round(f*S.len),cx=i===1?320:i===0?220:420;clearArea(y-90,y+460,cx-90,cx+90);
  if(i===0){add({k:'ramp',x:cx,y,r:30});add({k:'clue',x:cx,y:y+140,air:1,ci:C0+i});}   // only reachable in the air
  else if(i===1){add({k:'gate',x:cx,y:y+80,w:80,col:'#ffd23a'});add({k:'clue',x:cx,y:y+80,ci:C0+i});}
  else{add({k:'clue',x:cx,y:y+130,ci:C0+i});add({k:'tree',x:cx-44,y:y+90,r:12});add({k:'tree',x:cx+44,y:y+90,r:12});add({k:'rock',x:cx,y:y+30,r:12});}});
 [.3,.6,.78].forEach(f=>{const y=Math.round(f*S.len)+300,x=200+rng()*240;clearArea(y-40,y+40,x-40,x+40);add({k:'pizza',x,y});});
 [.15,.4,.68,.9].forEach(f=>{const y=Math.round(f*S.len)+200,x=120+rng()*400;clearArea(y-40,y+40,x-40,x+40);add({k:'cash',x,y});});
 clearArea(-100,380,0,W);O.sort((a,b)=>a.y-b.y);R.coinTotal=coinTotal;
 // ---------- helpers ----------
 const float=(x,y,t,c='#fff')=>S.floats.push({x,y,t,c,life:1.3});
 const lead=()=>S.players.reduce((a,p)=>p.y>a.y?p:a,S.players[0]);
 const prog=()=>Math.min(1,lead().y/S.len);
 const ang=p=>p.dir*Math.PI/6;
 function crash(p,why,heart){if(p.inv>0||S.state!=='play')return;p.stun=heart?1:.55;p.v=0;p.inv=heart?1.7:.8;p.down=1;SFX.hurt();float(p.x,p.y-40,why,'#ff5a8a');S.streak=0;
  if(heart){S.crashes++;R.hits=(R.hits||0)+1;S.hearts--;if(S.hearts<=0){S.hearts=0;finish(false,'Too many wipeouts!');}}}
 function finish(win,why){S.state='end';S.win=win;S.why=why;S.endT=0;stopMusic();playStinger(win?'win':'lose');}
 function payout(){R.coinsGot=S.coins;R.kos=S.kills;
  if(typeof lv==='function'){const V=lv(def.id);if(S.crashes===0)V.noHit=1;if(S.tricks>=10)V.tricks=1;if(S.gates>=15)V.gates=1;}
  missionPayout(def,np,{clues:S.clues,coins:S.coins,kills:S.kills,total:3});}
 S.enter=function(){startMusic(S.chaser?'aq2_chase':def.music);};S.resume=function(){};
 // ---------- update ----------
 S.update=function(dt){S.t+=dt;for(const f of S.floats){f.life-=dt;f.y-=24*dt;}S.floats=S.floats.filter(f=>f.life>0);
  if(S.state==='intro'){S.camY=lead().y-150;if(anyPressed('ok')||anyPressed('attack')){SFX.move();S.introIdx++;if(S.introIdx>=def.intro.length)S.state='play';}return;}
  if(S.state==='outro'){S.endT+=dt;if(S.endT>.4&&(anyPressed('ok')||anyPressed('attack'))){SFX.move();S.outroIdx++;S.endT=0;if(S.outroIdx>=def.outro.lines.length)payout();}return;}
  if(S.paused)return;
  if(S.state==='end'){S.endT+=dt;for(const p of S.players){p.v*=Math.pow(.3,dt);p.y+=p.v*dt;}if(S.chaser)S.chaser.y+=S.chaser.v*dt*.5;
   if(S.endT>2.2){if(S.win){S.state='outro';S.outroIdx=0;S.endT=0;startMusic('cutscene');}else Results.show({win:0,name:levelName(def.id),id:def.id});}return;}
  if(anyPressed('start')){S.paused=true;push(Watch.make('level'));return;}
  R.t=(R.t||0)+dt;
  for(const p of S.players){const I=INPUT[p.i],J=np===1?INPUT[1]:{};const hold=b=>I[b]||J[b],tap=b=>pressed(p.i,b)||(np===1&&pressed(1,b));
   p.inv=Math.max(0,p.inv-dt);p.snowCd-=dt;if(p.boost>0)p.boost-=dt;
   if(p.stun>0){p.stun-=dt;if(p.stun<=0)p.down=0;p.v*=Math.pow(.1,dt);}
   else{
    // turning: tap = one step, hold = keep turning; already sideways + same way = shuffle sideways
    const st=(hold('right')?1:0)-(hold('left')?1:0);
    if(st&&p.air<=0){const side=Math.abs(p.dir)===3&&Math.sign(p.dir)===st;
     if(tap('left')||tap('right')){p.turnT=.17;if(side)p.shuffle=.25;else p.dir=Math.max(-3,Math.min(3,p.dir+st));}
     else{p.turnT-=dt;if(p.turnT<=0){p.turnT=.14;if(side)p.shuffle=.2;else p.dir=Math.max(-3,Math.min(3,p.dir+st));}}}
    if(p.shuffle>0){p.shuffle-=dt;p.x+=Math.sign(p.dir)*80*dt;}
    const tuck=hold('down')&&p.air<=0;if(tuck&&p.dir!==0){p.tuckT=(p.tuckT||0)-dt;if(p.tuckT<=0){p.dir-=Math.sign(p.dir);p.tuckT=.08;}}
    let want=[330,290,185,0][Math.abs(p.dir)];if(tuck&&p.dir===0)want=430;if(hold('up')&&p.air<=0)want=Math.min(want,60);if(p.boost>0)want=540;
    if(p.air>0)want=p.v;p.v+=(want-p.v)*Math.min(1,dt*(want<p.v?2.6:1.25));
    if(tap('jump')&&p.air<=0){p.air=p.airT=.42;p.airH=18;SFX.jump();}
    if(tap('attack')){if(p.air>0){if(p.trickT<=0&&p.airT>.5){p.trickT=.36;p.trickPend++;p.spin=0;SFX.whoosh();}}
     else if(p.snowCd<=0){p.snowCd=.4;const a=Math.abs(p.dir)===3?0:ang(p),sp=chile?620:430;S.balls.push({x:p.x,y:p.y+10,vx:Math.sin(a)*sp,vy:Math.cos(a)*sp+p.v*.5,life:.8});SFX.whoosh();}}
    if(tap('gadget')){if(p.boosts>0&&p.boost<=0){p.boosts--;p.boost=1.3;p.dir=0;SFX.gadget();float(p.x,p.y-40,'TURBO TUCK!','#7ff');bump&&bump('gadgets');}else if(p.boosts<=0)float(p.x,p.y-40,'NO TURBOS LEFT','#9fb');}}
   const a=ang(p);p.x+=Math.sin(a)*p.v*dt;p.y+=Math.cos(a)*p.v*dt;
   if(p.air>0){p.air-=dt;if(p.trickT>0){p.trickT-=dt;p.spin+=dt*18;}
    if(p.air<=0){p.air=0;if(p.trickT>0){p.trickT=0;p.trickPend=0;crash(p,'WIPEOUT!',false);}
     else if(p.trickPend>0){const n=p.trickPend*(big?2:1)*2;S.coins+=n;S.tricks+=p.trickPend;float(p.x,p.y-50,(p.trickPend>1?'TRICK x'+p.trickPend:'TRICK!')+' +$'+n*2,'#ffd23a');playStinger('clue');p.trickPend=0;bump&&bump('coins',n);}}}
   if(p.x<SK_L||p.x>SK_R){crash(p,'TIMBER!',true);p.x=p.x<SK_L?SK_L+16:SK_R-16;p.dir=p.x<320?1:-1;}
   const lt=p.trail[p.trail.length-1];if(!lt||Math.hypot(p.x-lt[0],p.y-lt[1])>8){p.trail.push([p.x,p.y,p.air>0]);if(p.trail.length>90)p.trail.shift();}}
  // co-op: keep the slower skier near the leader
  const L=lead();if(np>1)for(const p of S.players)if(p.y<S.camY-30){p.y=L.y-50;p.x=Math.max(SK_L+30,Math.min(SK_R-30,L.x+(p.i?40:-40)));p.inv=1.2;p.trail=[];float(p.x,p.y-40,'CATCH UP!','#9ff');}
  S.camY+=((L.y-150)-S.camY)*Math.min(1,dt*7);
  // obstacles and pickups
  for(const p of S.players){const z=p.air>0;
   for(const o of S.obs){if(o.y<p.y-80)continue;if(o.y>p.y+80)break;if(o.got)continue;const dx=p.x-o.x,dy=p.y-o.y;
    if(o.k==='gate'){if(!o.passed&&p.y>=o.y&&p.y-Math.cos(ang(p))*p.v*dt<o.y+1){if(Math.abs(dx)<o.w/2){o.passed=1;S.gates++;S.streak++;const n=Math.min(5,S.streak);S.coins+=n;float(o.x,o.y-30,'GATE! +$'+n*2,'#7ff');SFX.pick();}
       else if(Math.abs(dx)<o.w/2+70){o.passed=1;S.streak=0;float(o.x,o.y-30,'MISSED GATE','#9ab');}}continue;}
    if(o.k==='coin'||o.k==='cash'||o.k==='pizza'||o.k==='clue'){if(o.air&&!z)continue;if(Math.abs(dx)<22&&Math.abs(dy)<22){o.got=1;
      if(o.k==='coin'){S.coins++;SFX.pick();bump&&bump('coins');}
      else if(o.k==='cash'){S.coins+=5;SFX.pick();float(o.x,o.y-30,'CASH BAG! +$10','#ffd23a');}
      else if(o.k==='pizza'){S.hearts=Math.min(5,S.hearts+1);SFX.pick();float(o.x,o.y-30,'+HEART','#9fb');}
      else{S.clues.push(o.ci);playStinger('clue');float(o.x,o.y-40,'CLUE: '+CLUES[o.ci].name,'#ffd23a');}}continue;}
    if(z)continue;const d=Math.hypot(dx,dy);
    if(o.k==='ramp'){if(Math.abs(dx)<o.r+6&&Math.abs(dy)<14&&p.v>80){p.air=p.airT=big?1.8:1.05;p.airH=big?110:60;p.trickPend=0;SFX.jump();float(p.x,p.y-40,'BIG AIR! (ATTACK = trick)','#7ff');}continue;}
    if(o.k==='mogul'){if(d<o.r){if(o.hitBy!==p.i){o.hitBy=p.i;p.v*=.62;p.air=p.airT=.25;p.airH=10;}}continue;}
    if(d<o.r+7){if(o.k==='stump')crash(p,'TRIPPED!',false);else crash(p,o.k==='rock'?'ROCK!':'TREE!',true);p.x+=dx>=0?14:-14;}}}
  // stooges skiing badly across the slope
  if(S.state==='play'&&S.skiers.filter(s=>!s.out).length<(prog()>.5?3:2)&&Math.random()<dt*.5){const fromL=Math.random()<.5;
   S.skiers.push({x:fromL?SK_L+20:SK_R-20,y:S.camY+H+40+Math.random()*160,vx:(fromL?1:-1)*(50+Math.random()*50),vy:150+Math.random()*60,look:Math.floor(Math.random()*3),w:Math.random()*6});}
  for(const s of S.skiers){if(s.out){s.t=(s.t||0)+dt;continue;}s.w+=dt;s.x+=(s.vx+Math.sin(s.w*3)*50)*dt;s.y+=s.vy*dt;if(s.x<SK_L+10||s.x>SK_R-10)s.vx*=-1;
   for(const p of S.players)if(p.air<=0&&p.inv<=0&&Math.hypot(p.x-s.x,p.y-s.y)<24){crash(p,'STOOGE CRASH!',true);s.out=1;float(s.x,s.y-30,'OOF!','#c77dff');}}
  S.skiers=S.skiers.filter(s=>s.y>S.camY-120&&(!s.out||s.t<2));
  // snowballs
  for(const b of S.balls){b.life-=dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
   for(const s of S.skiers)if(!s.out&&Math.hypot(b.x-s.x,b.y-s.y)<22){b.life=0;s.out=1;S.kills++;S.coins+=2;float(s.x,s.y-30,'SPLAT! +$4','#ffd23a');SFX.hit();}
   const c=S.chaser;if(c&&b.life>0&&Math.hypot(b.x-c.x,b.y-c.y)<34){b.life=0;c.stall=chile?2.4:1.7;float(c.x,c.y-40,'BRRR! STALLED!','#9ff');SFX.hit();}}
  S.balls=S.balls.filter(b=>b.life>0);
  // Lefty on the snowmobile
  if(!S.chaser&&prog()>=def.chaseAt){S.chaser={x:L.x,y:S.camY-90,v:L.v,stall:0};float(L.x,L.y-60,'LEFTY\'S ON A SNOWMOBILE! SNOWBALL HIM!','#c77dff');startMusic('aq2_chase');playStinger('unlock');}
  const c=S.chaser;if(c){const tgt=S.players.reduce((a,p)=>Math.abs(p.y-c.y)<Math.abs(a.y-c.y)?p:a,S.players[0]);
   if(c.stall>0){c.stall-=dt;c.v=Math.max(0,c.v-500*dt);}else{const gap=tgt.y-c.y,want=gap>420?470:Math.max(210,Math.min(372,tgt.v+45));c.v+=(want-c.v)*Math.min(1,dt*2);
    c.x+=Math.max(-150,Math.min(150,(tgt.x-c.x)*2))*dt;}
   c.y+=c.v*dt;if(c.y<S.camY-200)c.y=S.camY-200;
   for(const p of S.players)if(p.inv<=0&&p.air<=0&&Math.hypot(p.x-c.x,p.y-c.y)<30){crash(p,'GOTCHA! (LEFTY)',true);c.y-=160;c.stall=.8;}}
  if(S.state==='play'&&L.y>=S.len)finish(true);};
 // ---------- drawing ----------
 const sy=y=>y-S.camY;
 function pine(x,y,s,snow){ctx.fillStyle='#5a3a1a';ctx.fillRect(x-3*s,y-4*s,6*s,8*s);
  for(let k=0;k<3;k++){const w=(16-k*4)*s,yy=y-6*s-k*10*s;ctx.fillStyle=k%2?'#2e7a52':'#246a46';ctx.beginPath();ctx.moveTo(x,yy-14*s);ctx.lineTo(x-w,yy+2*s);ctx.lineTo(x+w,yy+2*s);ctx.closePath();ctx.fill();ctx.strokeStyle='#0e3a24';ctx.lineWidth=1.5;ctx.stroke();
   if(snow){ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(x,yy-14*s);ctx.lineTo(x-w*.4,yy-7*s);ctx.lineTo(x+w*.4,yy-7*s);ctx.fill();}}}
 function drawSlope(){ctx.fillStyle='#f3f7ff';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(150,180,230,.18)';for(let k=0;k<26;k++){const y=((k*97-S.camY)%560+560)%560-40,x=SK_L+(hsh(k)*560);ctx.beginPath();ctx.ellipse(x,y,40+hsh(k+3)*50,6,0,0,7);ctx.fill();}
  const step=46,off=((-S.camY)%step+step)%step;for(let y=-step+off;y<H+step;y+=step){const row=Math.floor((S.camY+y)/step);
   for(const [x0,x1] of [[0,SK_L],[SK_R,W]])for(let x=x0+8;x<x1+10;x+=26)pine(x+(((row*7+x)%9)+9)%9-4,y+20,.9,((row+x)%3+3)%3===0);}}
 function drawObs(o){const x=o.x,y=sy(o.y);if(y<-60||y>H+60||o.got)return;
  if(o.k==='tree'||o.k==='bigtree')pine(x,y+4,o.k==='bigtree'?1.3:1,hsh(o.x)>.4);
  else if(o.k==='rock'){ctx.fillStyle='#8a8a9a';ctx.strokeStyle='#33334a';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,15,10,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x-2,y-6,8,3,0,0,7);ctx.fill();}
  else if(o.k==='stump'){ctx.fillStyle='#7a4a22';ctx.strokeStyle='#3a1a08';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,9,6,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#c8945a';ctx.beginPath();ctx.ellipse(x,y-2,6,3,0,0,7);ctx.fill();}
  else if(o.k==='mogul'){ctx.fillStyle='rgba(120,150,210,.35)';ctx.beginPath();ctx.ellipse(x+4,y+5,24,10,0,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x,y,22,10,0,0,7);ctx.fill();}
  else if(o.k==='ramp'){ctx.fillStyle='#4a7ad8';ctx.strokeStyle='#14244a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x-30,y+12);ctx.lineTo(x+30,y+12);ctx.lineTo(x+24,y-12);ctx.lineTo(x-24,y-12);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#ffd23a';for(let k=-2;k<=2;k++)ctx.fillRect(x+k*10-2,y-8,4,16);}
  else if(o.k==='gate'){for(const s of [-1,1]){const fx=x+s*o.w/2;ctx.strokeStyle='#333';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(fx,y);ctx.lineTo(fx,y-34);ctx.stroke();ctx.fillStyle=o.passed?'#9c9':o.col;ctx.beginPath();ctx.moveTo(fx,y-34);ctx.lineTo(fx-s*16,y-27);ctx.lineTo(fx,y-20);ctx.fill();}
   if(!o.passed){ctx.strokeStyle='rgba(255,180,0,.4)';ctx.lineWidth=2;ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(x-o.w/2,y);ctx.lineTo(x+o.w/2,y);ctx.stroke();ctx.setLineDash([]);}}
  else{const b=Math.sin(TIME*4+o.y)*3,yy=y+b-(o.air?30:0);if(o.air){ctx.fillStyle='rgba(0,0,0,.12)';ctx.beginPath();ctx.ellipse(x,y+6,8,3,0,0,7);ctx.fill();}
   if(o.k==='coin'){if(!(typeof drawItemArt==='function'&&drawItemArt({k:'coin',x:o.x,y:o.y},x,yy))){ctx.fillStyle='#ffd23a';ctx.strokeStyle='#6a4a00';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,yy,7*Math.abs(Math.cos(TIME*3+o.y)+.2),8,0,0,7);ctx.fill();ctx.stroke();}}
   else if(o.k==='cash'){rrect(x-12,yy-10,24,20,6,'#4ac46a','#0a3a1a',2);text('$',x,yy+5,13,'#fff','center',null);}
   else if(o.k==='pizza'){if(!(typeof drawItemArt==='function'&&drawItemArt({k:'pizza',x:o.x,y:o.y},x,yy))){ctx.fillStyle='#ffc84a';ctx.beginPath();ctx.moveTo(x-12,yy-8);ctx.lineTo(x+12,yy-8);ctx.lineTo(x,yy+12);ctx.fill();}}
   else{ctx.globalAlpha=.5+.3*Math.sin(TIME*5);ctx.fillStyle='#2de2f5';ctx.beginPath();ctx.arc(x,yy,20,0,7);ctx.fill();ctx.globalAlpha=1;imgC('markers/clue',x,yy,32);}}}
 function drawSkier(p){const z=p.air>0?Math.sin((1-p.air/p.airT)*Math.PI)*p.airH:0,x=p.x,y=sy(p.y),a=ang(p);
  ctx.fillStyle='rgba(40,60,120,.25)';ctx.beginPath();ctx.ellipse(x,y+2,14,5,0,0,7);ctx.fill();
  const al=p.inv>0&&Math.floor(S.t*14)%2?.5:1;ctx.globalAlpha=al;
  const yy=y-z,sx=Math.sin(a),cy=Math.cos(a);
  if(!p.down){ctx.strokeStyle=p.ch==='agent_sisi'?'#ff5ae0':p.ch==='agent_sandy'?'#9fe8ff':'#2de2f5';ctx.lineWidth=4;ctx.lineCap='round';
   for(const o of [-5,5]){const ox=cy*o,oy=-sx*o*.4;ctx.beginPath();ctx.moveTo(x+ox-sx*16,yy+oy-cy*8);ctx.lineTo(x+ox+sx*20,yy+oy+cy*10);ctx.stroke();}ctx.lineCap='butt';}
  const fr=p.down?(animFrames(p.ch,'crouch')[0]||'idle_1'):p.air>0?(animFrames(p.ch,p.trickT>0?'flip':'jump')[0]||'idle_1'):(animFrames(p.ch,p.v>300?'crouch':'idle')[0]||'idle_1');
  const rot=p.down?1.4*(p.dir<0?-1:1):p.trickT>0?p.spin:-a*.25;
  drawSprite(p.ch,fr,x,yy+2,p.dir<0,al,.46,1,1,rot);ctx.globalAlpha=1;
  if(p.boost>0){ctx.fillStyle='rgba(127,255,255,.6)';for(let k=0;k<4;k++)ctx.fillRect(x-14+k*9,yy-50-k*6-((S.t*300+k*40)%30),3,14);}
  if(p.trickPend>0&&p.air>0)text('x'+p.trickPend,x+22,yy-60,12,'#ffd23a','left');
  text(p.i?'P2':'P1',x,yy-72,10,CHARS[p.ch].tag,'center');}
 function drawStoogeSki(s){const x=s.x,y=sy(s.y);if(y<-60||y>H+60)return;ctx.save();ctx.translate(x,y);
  if(s.out){ctx.rotate(1.3);ctx.globalAlpha=Math.max(0,1-(s.t||0)/2);}
  ctx.strokeStyle='#c77dff';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-14,4);ctx.lineTo(16,8);ctx.moveTo(-14,-4);ctx.lineTo(16,0);ctx.stroke();
  ctx.scale((s.vx<0?-1:1)*.55,.55);drawStoogeBody(ctx,{wind:0,swing:0},STOOGE_LOOK[s.look],false,false,Math.sin(s.w*6)*3);ctx.restore();ctx.globalAlpha=1;
  if(s.out&&(s.t||0)<1)text('WHOOPS!',x,y-50,11,'#c77dff','center');}
 function drawChaser(c){const x=c.x,y=sy(c.y);if(y<-80||y>H+80)return;ctx.save();ctx.translate(x,y);
  ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(0,26,24,8,0,0,7);ctx.fill();
  ctx.fillStyle='#222';ctx.fillRect(-20,14,40,8);ctx.fillRect(-16,22,6,16);ctx.fillRect(10,22,6,16);
  rrect(-18,-22,36,42,12,c.stall>0?'#9ab':'#7a3ad8','#150a20',2.5);rrect(-12,10,24,12,5,'#9ad8ff','#150a20',2);ctx.fillStyle='#ffd23a';ctx.fillRect(-4,-4,8,8);
  ctx.save();ctx.translate(0,-2);ctx.scale(.55,.55);drawStoogeBody(ctx,{wind:0,swing:0},STOOGE_LOOK[0],false,false,0);ctx.restore();
  if(c.stall>0){ctx.fillStyle='#bfe8ff';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(-14+k*14,-50+Math.sin(TIME*8+k)*3,6,0,7);ctx.fill();}}
  else{ctx.fillStyle='rgba(255,255,255,.8)';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(-12+k*12,-30-((S.t*120+k*20)%26),5,0,7);ctx.fill();}}
  ctx.restore();text('LEFTY',x,y+50,11,'#c77dff','center');}
 S.draw=function(){drawSlope();
  for(const p of S.players){ctx.strokeStyle='rgba(120,140,190,.45)';ctx.lineWidth=2;for(const o of [-5,5]){ctx.beginPath();let pen=false;for(const t of p.trail){if(t[2]){pen=false;continue;}if(!pen){ctx.moveTo(t[0]+o,sy(t[1]));pen=true;}else ctx.lineTo(t[0]+o,sy(t[1]));}ctx.stroke();}}
  const fy=sy(S.len);if(fy<H+140){for(let x=SK_L;x<SK_R;x+=40){ctx.fillStyle=(x/40)%2?'#fff':'#222';ctx.fillRect(x,fy,40,10);}
   ctx.fillStyle='#c04040';ctx.strokeStyle='#3a1a08';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(206,fy+84);ctx.lineTo(320,fy+34);ctx.lineTo(434,fy+84);ctx.closePath();ctx.fill();ctx.stroke();
   rrect(220,fy+80,200,80,8,'#8a5a2a','#3a1a08',3);for(let k=0;k<3;k++)rrect(240+k*56,fy+100,36,28,4,'#ffe08a','#3a1a08',2);text(def.finishName,W/2,fy-10,16,'#ff3a3a','center');}
  const vis=S.obs.filter(o=>{const y=sy(o.y);return y>-60&&y<H+60;});
  const people=[...S.players.map(p=>({y:p.y,f:()=>drawSkier(p)})),...S.skiers.map(s=>({y:s.y,f:()=>drawStoogeSki(s)}))];if(S.chaser)people.push({y:S.chaser.y,f:()=>drawChaser(S.chaser)});
  people.sort((a,b)=>a.y-b.y);let k=0;for(const o of vis){while(k<people.length&&people[k].y<o.y-6){people[k].f();k++;}drawObs(o);}while(k<people.length){people[k].f();k++;}
  for(const b of S.balls){ctx.fillStyle=chile?'#7adf3a':'#fff';ctx.strokeStyle='#557';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(b.x,sy(b.y),5,0,7);ctx.fill();ctx.stroke();}
  for(const f of S.floats)text(f.t,Math.max(110,Math.min(W-110,f.x)),sy(f.y),f.t.length>10?12:15,f.c,'center');
  // HUD
  rrect(4,2,W-8,30,8,'rgba(6,20,36,.92)','#ff7ab0',2);for(let i=0;i<Math.max(4,S.hearts);i++)heart(16+i*22,13,i<S.hearts);
  imgC('markers/clue',136,17,18);text(S.clues.length+'/3',148,22,12,'#ffd23a','left',null);text('$'+S.coins*2,188,22,12,'#fff','left',null);
  text('GATES '+S.gates,246,22,11,'#7ff','left',null);text('TRICKS '+S.tricks,318,22,11,'#ffd23a','left',null);text('TURBO x'+S.players[0].boosts,400,22,11,'#7ff','left',null);
  const ft=Math.round(10378-(10378-8678)*prog());text(ft.toLocaleString()+' ft',W-14,22,12,'#fff','right',null);
  rrect(W-14,44,6,H-64,3,'#1a2240',null);rrect(W-14,44+(H-64)*prog()-4,6,8,3,'#ffd23a',null);
  if(S.chaser&&S.state==='play'){const gap=lead().y-S.chaser.y;if(gap<260&&Math.floor(TIME*4)%2===0)text('LEFTY IS RIGHT BEHIND YOU!',W/2,52,13,'#ff9ac0','center');}
  if(S.state==='intro'){dim(.4);text(def.title,W/2,80,22,'#ffd23a','center');text(def.sub,W/2,104,13,'#cfe','center');sandyBox(def.intro,def.introExpr[S.introIdx%def.introExpr.length],Math.min(S.introIdx,def.intro.length-1));}
  if(S.state==='play'&&R.t<9){rrect(70,H-58,500,46,10,'rgba(6,20,36,.85)','#2de2f5',2);text('LEFT/RIGHT turn    DOWN tuck    UP brake    JUMP hop',W/2,H-39,12,'#fff','center',null);text('ATTACK snowball (in the air: trick!)    GADGET turbo',W/2,H-21,12,'#cfe','center',null);}
  if(S.state==='end'){dim(Math.min(.6,S.endT*.4));text(S.win?def.winText:'MISSION FAILED',W/2,H/2,32,S.win?'#ffd23a':'#ff5a8a','center');if(!S.win)text(S.why||'',W/2,H/2+30,16,'#fff','center');}
  if(S.state==='outro'){dim(.55);sandyBox(def.outro.lines,def.outro.expr[S.outroIdx%def.outro.expr.length],Math.min(S.outroIdx,def.outro.lines.length-1));}
  if(SAVE.testing)text('TESTING MODE',W/2,H-4,9,'#ff5ae0','center');};
 return S;}

const _startLevelSki=startLevel;
startLevel=function(l){const def=LEVEL_DEFS[l.id];if(def&&def.type==='ski'){go(makeSki(def,NPLAYERS));return;}return _startLevelSki.apply(this,arguments);};
function abqAutoPause(){if(scene&&(scene.name==='ski'||scene.name==='balloon')&&scene.state==='play'&&!scene.paused){scene.paused=true;push(Watch.make('level'));}}
addEventListener('blur',abqAutoPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)abqAutoPause();});addEventListener('gamepaddisconnected',abqAutoPause);
