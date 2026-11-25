// ===== Balloon Fiesta (v0.37): vertical hot air balloon climb =====
// LEVEL_DEFS entry with type:'balloon' (aq3 is defined in abq.js). Side view; the world scrolls UP as you climb (y goes negative).
// Controls: LEFT/RIGHT drift, hold JUMP = burner (rise; uses propane), DOWN = vent (drop fast), ATTACK = BB gun (hold UP to aim up),
// GADGET = turbo burner (3 per flight). The SPIKE under the basket pops any balloon you drop straight onto (DOWN to dive).
// The screen keeps climbing on its own: sink below the bottom and you lose a heart. Propane tanks refill the burner.
// At the top: Baron Blowhard's giant balloon. BB hits sting, spike drops on top of his balloon hit hard.
function makeBalloon(def,np){
 const chile=cheatOn('greenchile'),endless=cheatOn('propane');
 const B={name:'balloon',def,np,state:'intro',introIdx:0,outroIdx:0,t:0,paused:false,hearts:5,clues:[],coins:0,kills:0,floats:[],
  foes:[],shots:[],eshots:[],items:[],geese:[],winds:[],fx:[],camY:-H,endT:0,spikes:0,hits:0,boss:null,bossLock:false,len:def.length,nextFoe:-500};
 const R=(typeof achRunStart==='function')?achRunStart(def,np):{};B.R=R;
 let seed=777;const rng=()=>((seed=(seed*16807)%2147483647)/2147483647);
 const COL={agent_coco:['#2de2f5','#1a2a6a','#ffd23a'],agent_sisi:['#ff5ae0','#7a2aa8','#fff'],agent_sandy:['#e9eef5','#2aa8a8','#9fe8ff']};
 B.players=[];for(let i=0;i<np;i++){const ch=i?p2Char():p1Char();B.players.push({i,ch,x:np>1?250+i*140:320,y:-120,vx:0,vy:0,face:i?-1:1,fuel:1,inv:0,cd:0,boost:0,boosts:3,burn:0,stun:0,col:COL[ch]||COL.agent_coco});}
 // ---------- the sky (seeded) ----------
 let coinTotal=0;
 for(let y=-500;y>-B.len+600;y-=230){const r=rng(),x=90+rng()*460;
  if(r<.42){const ring=rng()<.5;for(let k=0;k<6;k++){B.items.push(ring?{k:'coin',x:x+Math.cos(k/6*Math.PI*2)*38,y:y+Math.sin(k/6*Math.PI*2)*38}:{k:'coin',x:x+(k-2.5)*28,y:y-Math.sin(k/5*Math.PI)*30});coinTotal++;}}
  else if(r<.58)B.items.push({k:'fuel',x,y});
  else if(r<.66)B.items.push({k:'cash',x,y});}
 [.3,.62,.85].forEach(f=>B.items.push({k:'pizza',x:150+rng()*340,y:-f*B.len}));
 const C0=def.clue0||0;[.24,.5,.76].forEach((f,i)=>B.items.push({k:'clue',x:i===1?320:i?520:120,y:-f*B.len-60,ci:C0+i}));
 for(let y=-1400;y>-B.len+800;y-=1700)B.winds.push({y,h:140,dir:rng()<.5?-1:1});
 R.coinTotal=coinTotal;
 // ---------- helpers ----------
 const float=(x,y,t,c='#fff')=>B.floats.push({x,y,t,c,life:1.3});
 const top=()=>B.players.reduce((a,p)=>p.y<a.y?p:a,B.players[0]);
 const prog=()=>Math.min(1,-top().y/B.len);
 const ENV=34,ENVY=62;   // envelope radius and how far above the basket its centre is
 function hurt(p,why){if(p.inv>0||B.state!=='play')return;p.inv=1.5;p.stun=.3;SFX.hurt();float(p.x,p.y-90,why,'#ff5a8a');B.hits++;R.hits=(R.hits||0)+1;B.hearts--;
  if(B.hearts<=0){B.hearts=0;finish(false,'Your balloons came down!');}}
 function finish(win,why){B.state='end';B.win=win;B.why=why;B.endT=0;stopMusic();playStinger(win?'win':'lose');}
 function payout(){R.coinsGot=B.coins;R.kos=B.kills;if(typeof lv==='function'){const V=lv(def.id);if(B.hits===0)V.noHit=1;if(B.spikes>=8)V.spikes=1;if(B.spikeFinish)V.spikeFinish=1;}
  missionPayout(def,np,{clues:B.clues,coins:B.coins,kills:B.kills,total:3});}
 function spawnFoe(y){const r=rng(),fromL=rng()<.5,x=fromL?-40:W+40,pr=-y/B.len;
  if(r<.55)B.foes.push({k:'stooge',x,y,vx:(fromL?1:-1)*(30+rng()*30),vy:0,hp:3,cd:1.5+rng()*2,look:Math.floor(rng()*3),bob:rng()*6,col:['#7a3ad8','#9a4ae8','#5a2aa8'][Math.floor(rng()*3)]});
  else if(r<.82||pr<.2)B.foes.push({k:'drone',x,y,vx:(fromL?1:-1)*(80+rng()*40),vy:0,hp:1,bob:rng()*6,cd:2});
  else{const d=fromL?1:-1;for(let k=0;k<5;k++)B.geese.push({x:x-d*Math.abs(k-2)*26-d*20,y:y+Math.abs(k-2)*14,vx:d*110,fl:rng()*6});}}
 function pop(f,how,p){f.dead=1;B.kills++;const n=f.k==='drone'?2:4;B.coins+=n;R.kos=(R.kos||0)+1;
  if(how==='spike'){B.spikes++;float(f.x,f.y-70,'SPIKED! +$'+n*2,'#ffd23a');p.vy=-160;}else float(f.x,f.y-70,(f.k==='drone'?'ZAPPED!':'POP!')+' +$'+n*2,'#ffd23a');
  SFX.smash();for(let k=0;k<12;k++)B.fx.push({x:f.x,y:f.y-50,vx:rand(-160,160),vy:rand(-160,80),t:.5,c:f.col||'#ccc'});
  if(f.k==='stooge')B.fx.push({chute:1,x:f.x,y:f.y,look:f.look,t:4});
  if(rng()<.3)B.items.push({k:rng()<.5?'fuel':'coin',x:f.x,y:f.y-40});}
 B.enter=function(){startMusic(B.bossLock?def.bossMusic:def.music);};B.resume=function(){};
 // ---------- update ----------
 B.update=function(dt){B.t+=dt;for(const f of B.floats){f.life-=dt;f.y-=26*dt;}B.floats=B.floats.filter(f=>f.life>0);
  for(const f of B.fx){f.t-=dt;if(f.chute){f.y+=60*dt;f.x+=Math.sin(B.t*2+f.look)*20*dt;}else{f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=300*dt;}}B.fx=B.fx.filter(f=>f.t>0);
  if(B.state==='intro'){B.camY=-H+80;if(anyPressed('ok')||anyPressed('attack')){SFX.move();B.introIdx++;if(B.introIdx>=def.intro.length)B.state='play';}return;}
  if(B.state==='outro'){B.endT+=dt;if(B.endT>.4&&(anyPressed('ok')||anyPressed('attack'))){SFX.move();B.outroIdx++;B.endT=0;if(B.outroIdx>=def.outro.lines.length)payout();}return;}
  if(B.paused)return;
  if(B.state==='end'){B.endT+=dt;const bo=B.boss;if(bo&&bo.dead){bo.x+=bo.spinV*dt;bo.y+=40*dt;bo.rot+=dt*6;}
   if(B.endT>2.4){if(B.win){B.state='outro';B.outroIdx=0;B.endT=0;startMusic('cutscene');}else Results.show({win:0,name:levelName(def.id),id:def.id});}return;}
  if(anyPressed('start')){B.paused=true;push(Watch.make('level'));return;}
  R.t=(R.t||0)+dt;
  // camera: always creeping up, faster if the top balloon is high; locks at the boss
  if(!B.bossLock){let c=B.camY-def.scroll*dt;const want=top().y-200;if(want<c)c+=(want-c)*Math.min(1,dt*2.5);B.camY=c;}
  // players
  for(const p of B.players){const I=INPUT[p.i],J=np===1?INPUT[1]:{};const hold=b=>I[b]||J[b],tap=b=>pressed(p.i,b)||(np===1&&pressed(1,b));
   p.inv=Math.max(0,p.inv-dt);p.cd-=dt;if(p.boost>0)p.boost-=dt;if(p.stun>0)p.stun-=dt;
   const mx=(hold('right')?1:0)-(hold('left')?1:0);if(mx)p.face=mx;
   p.vx+=mx*260*dt;p.vx*=Math.pow(.35,dt);
   p.burn=0;if(p.boost>0){p.vy-=520*dt;p.burn=2;}
   else if(hold('jump')&&(p.fuel>0||endless)){p.vy-=330*dt;p.burn=1;if(!endless)p.fuel=Math.max(0,p.fuel-dt*.085);}
   else{p.vy+=95*dt;if(!endless&&p.fuel<.35)p.fuel=Math.min(.35,p.fuel+dt*.02);}   // a little pilot light refill so you're never stuck
   p.dive=hold('down');if(p.dive)p.vy+=300*dt;
   p.vy=Math.max(p.boost>0?-260:-175,Math.min(p.dive?280:150,p.vy));
   if(tap('jump')&&p.fuel<=0&&!endless)float(p.x,p.y-100,'OUT OF PROPANE!','#ff9ac0');
   // wind bands
   for(const w of B.winds)if(Math.abs(p.y-w.y)<w.h/2)p.vx+=w.dir*120*dt;
   p.x+=p.vx*dt;p.y+=p.vy*dt;
   if(p.x<40){p.x=40;p.vx=Math.abs(p.vx)*.4;}if(p.x>W-40){p.x=W-40;p.vx=-Math.abs(p.vx)*.4;}
   const ceil=B.camY+ENVY+ENV+70;if(p.y<ceil){p.y=ceil;p.vy=Math.max(0,p.vy);}
   if(p.y>B.camY+H+30){hurt(p,'TOO LOW!');p.y=B.camY+H*.55;p.vy=-120;p.inv=2;p.fuel=Math.max(p.fuel,.5);}
   // BB gun
   if(tap('attack')&&p.cd<=0){p.cd=chile?.22:.28;const up=hold('up'),sp=560;B.shots.push({x:p.x+p.face*16,y:p.y-24,vx:up?p.face*sp*.25:p.face*sp,vy:up?-sp:-40,life:.8});beep(chile?520:880,.04,'square',.03);}
   if(tap('gadget')){if(p.boosts>0&&p.boost<=0){p.boosts--;p.boost=1.2;SFX.gadget();float(p.x,p.y-110,'TURBO BURNER!','#ffb347');bump&&bump('gadgets');}else if(p.boosts<=0)float(p.x,p.y-110,'NO TURBOS LEFT','#9fb');}}
  // co-op balloons bump each other
  if(np>1){const a=B.players[0],b=B.players[1],dx=b.x-a.x,dy=(b.y-a.y),d=Math.hypot(dx,dy);if(d<ENV*2&&d>0){const k=(ENV*2-d)/2/d;a.x-=dx*k;b.x+=dx*k;a.y-=dy*k;b.y+=dy*k;a.vx-=dx*.02;b.vx+=dx*.02;}}
  // enemies
  if(!B.bossLock&&B.camY<B.nextFoe+H){spawnFoe(B.camY+40+rng()*120);B.nextFoe-=def.foeGap*(1-prog()*.35);}
  for(const f of B.foes){if(f.dead)continue;f.bob+=dt;
   const tgt=B.players.reduce((a,p)=>Math.hypot(p.x-f.x,p.y-f.y)<Math.hypot(a.x-f.x,a.y-f.y)?p:a,B.players[0]);
   if(f.k==='drone'){f.x+=f.vx*dt;f.y+=Math.sin(f.bob*3)*40*dt+(tgt.y-60-f.y)*.25*dt;if(f.x<20||f.x>W-20)f.vx*=-1;
    for(const p of B.players)if(Math.hypot(p.x-f.x,p.y-ENVY-f.y)<ENV+12||Math.hypot(p.x-f.x,p.y-f.y)<26){hurt(p,'DRONE BONK!');f.vx*=-1;}}
   else{f.x+=f.vx*dt;f.y+=Math.sin(f.bob*1.3)*14*dt;if(f.x<60&&f.vx<0||f.x>W-60&&f.vx>0)f.vx*=-1;
    f.cd-=dt;if(f.cd<=0&&Math.abs(tgt.y-f.y)<320){f.cd=2.4+rng()*1.6;f.wind=.5;}
    if(f.wind>0){f.wind-=dt;if(f.wind<=0){const dx=tgt.x-f.x,dy=(tgt.y-ENVY)-(f.y-10),T=.9;B.eshots.push({x:f.x,y:f.y-10,vx:dx/T,vy:dy/T-.5*260*T,life:2.5});SFX.whoosh();}}
    // spike: drop straight onto the top of a stooge balloon
    for(const p of B.players){const tipX=p.x,tipY=p.y+16,cx=f.x,cy=f.y-ENVY,d=Math.hypot(tipX-cx,tipY-cy);
     if(d<ENV+4&&tipY<cy&&p.vy>30&&Math.abs(tipX-cx)<ENV*.8){pop(f,'spike',p);break;}
     const d2=Math.hypot(p.x-f.x,(p.y-ENVY)-(f.y-ENVY));if(d2<ENV*2-4){const k=(ENV*2-4-d2)/d2;p.vx+=(p.x-f.x)*k*4;p.vy+=((p.y-f.y))*k*2;f.vx=-f.vx;}}}}
  B.foes=B.foes.filter(f=>!f.dead&&f.y<B.camY+H+200);
  // geese: harmless bonk, knocks you sideways
  for(const g of B.geese){g.x+=g.vx*dt;g.fl+=dt*10;for(const p of B.players)if(p.inv<=0&&Math.hypot(p.x-g.x,p.y-ENVY-g.y)<ENV+8){p.vx+=Math.sign(g.vx)*160;p.inv=.6;float(p.x,p.y-100,'HONK! GEESE!','#fff');}}
  B.geese=B.geese.filter(g=>g.x>-80&&g.x<W+80&&g.y<B.camY+H+100);
  // BBs
  for(const s of B.shots){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
   for(const f of B.foes)if(!f.dead&&Math.hypot(s.x-f.x,s.y-(f.y-(f.k==='drone'?0:ENVY)))<(f.k==='drone'?18:ENV)){s.life=0;f.hp-=chile?2:1;f.hit=.15;beep(1200,.03,'square',.03);if(f.hp<=0)pop(f,'bb');else float(f.x,f.y-100,'PING!','#fff');break;}
   const bo=B.boss;if(s.life>0&&bo&&!bo.dead&&Math.hypot(s.x-bo.x,s.y-(bo.y-90))<88){s.life=0;bossHit(chile?2:1,'bb');}}
  B.shots=B.shots.filter(s=>s.life>0&&s.y>B.camY-40&&s.y<B.camY+H+40);
  for(const s of B.eshots){s.life-=dt;s.vy+=(s.sand?520:260)*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;
   for(const p of B.players)if(Math.hypot(s.x-p.x,s.y-(p.y-ENVY))<ENV+6||Math.hypot(s.x-p.x,s.y-p.y)<20){s.life=0;hurt(p,s.sand?'SANDBAG!':'SPLASH!');}}
  B.eshots=B.eshots.filter(s=>s.life>0&&s.y<B.camY+H+60);
  // pickups
  for(const it of B.items){if(it.got)continue;for(const p of B.players){if(Math.hypot(p.x-it.x,(p.y-30)-it.y)>40&&Math.hypot(p.x-it.x,(p.y-ENVY)-it.y)>ENV+8)continue;it.got=1;
    if(it.k==='coin'){B.coins++;SFX.pick();bump&&bump('coins');}
    else if(it.k==='cash'){B.coins+=5;SFX.pick();float(it.x,it.y-20,'CASH BAG! +$10','#ffd23a');}
    else if(it.k==='fuel'){for(const q of B.players)q.fuel=Math.min(1,q.fuel+.45);SFX.pick();float(it.x,it.y-20,'PROPANE!','#ffb347');}
    else if(it.k==='pizza'){B.hearts=Math.min(6,B.hearts+1);SFX.pick();float(it.x,it.y-20,'+HEART','#9fb');}
    else{B.clues.push(it.ci);playStinger('clue');float(it.x,it.y-30,'CLUE: '+CLUES[it.ci].name,'#ffd23a');}break;}}
  // the boss at the top
  if(!B.bossLock&&prog()>=1){B.bossLock=true;B.camY=Math.min(B.camY,top().y-300);B.boss={x:320,y:B.camY+260,hp:def.bossHp,max:def.bossHp,vx:70,ph:1,cd:2,inv:0,rot:0,called:0,gust:0};
   B.foes.forEach(f=>f.dead=1);startMusic(def.bossMusic);playStinger('unlock');float(320,B.camY+120,'BARON BLOWHARD!','#ffd23a');}
  const bo=B.boss;if(bo&&!bo.dead){bo.t=(bo.t||0)+dt;bo.inv=Math.max(0,bo.inv-dt);const r=bo.hp/bo.max;bo.ph=r>.6?1:r>.3?2:3;
   bo.x+=bo.vx*dt*(bo.ph===3?1.5:1);if(bo.x<130||bo.x>W-130)bo.vx*=-1;bo.y=B.camY+250+Math.sin(bo.t*.9)*60;
   bo.cd-=dt;if(bo.cd<=0){const tgt=B.players[Math.floor(rng()*B.players.length)];const m=rng();
    if(m<.4){bo.cd=bo.ph===3?1.2:1.8;for(let k=-1;k<=1;k++)B.eshots.push({x:bo.x+k*30,y:bo.y-10,vx:(tgt.x-bo.x)/1.2+k*60,vy:-120,life:3});bo.say='"TAKE THAT!"';}
    else if(m<.75){bo.cd=bo.ph===3?1.3:2;for(let k=0;k<(bo.ph>1?3:2);k++)B.eshots.push({x:bo.x+(k-1)*40,y:bo.y+10,vx:(k-1)*20,vy:20,life:3,sand:1});bo.say='"BOMBS AWAY!"';}
    else if(bo.ph>=2&&B.foes.filter(f=>!f.dead).length<2){bo.cd=2.4;for(const s of [-1,1])B.foes.push({k:'drone',x:bo.x+s*90,y:bo.y-40,vx:s*100,vy:0,hp:1,bob:rng()*6,cd:2});bo.say='"GO, DRONES!"';}
    else if(bo.ph===3){bo.cd=2.2;bo.gust=1.2;bo.gdir=rng()<.5?-1:1;bo.say='"HOT AIR BLAST!"';}
    else bo.cd=1;bo.sayT=1.2;}
   if(bo.sayT>0)bo.sayT-=dt;
   if(bo.gust>0){bo.gust-=dt;for(const p of B.players)p.vx+=bo.gdir*300*dt;}
   for(const p of B.players){const tipX=p.x,tipY=p.y+16,cx=bo.x,cy=bo.y-90,d=Math.hypot((tipX-cx)/1.05,tipY-cy);
    if(d<92&&tipY<cy-30&&p.vy>20&&bo.inv<=0){bossHit(5,'spike',p);p.vy=-260;}
    else if(Math.hypot(p.x-cx,(p.y-ENVY)-cy)<92+ENV-10){const dx=p.x-cx,dy=(p.y-ENVY)-cy,dd=Math.hypot(dx,dy)||1;p.vx+=dx/dd*220;p.vy+=dy/dd*120;}
    if(Math.abs(p.x-bo.x)<40&&Math.abs(p.y-(bo.y+20))<34)hurt(p,'BASKET BUMP!');}}
  B.items=B.items.filter(it=>!it.got&&it.y<B.camY+H+200);};
 function bossHit(n,how,p){const bo=B.boss;if(!bo||bo.dead)return;if(how==='spike'){bo.inv=.8;B.spikes++;float(bo.x,bo.y-200,'SPIKE DROP! -'+n,'#ffd23a');SFX.smash();}else{float(bo.x+rand(-40,40),bo.y-150,'PING!','#fff');}
  bo.hp-=n;bo.hit=.15;if(bo.hp<=0){bo.hp=0;bo.dead=1;bo.spinV=bo.x<320?-160:160;B.kills++;if(how==='spike')B.spikeFinish=1;float(bo.x,bo.y-200,'PFFFFFFFT!','#ffd23a');finish(true);}}
 // ---------- drawing ----------
 const sy=y=>y-B.camY;
 function sky(){const k=Math.min(1,Math.max(0,-B.camY/B.len));const g=ctx.createLinearGradient(0,0,0,H);
  const mix=(a,b)=>'rgb('+a.map((v,i)=>Math.round(v+(b[i]-v)*k)).join(',')+')';
  g.addColorStop(0,mix([120,170,255],[30,50,150]));g.addColorStop(1,mix([255,196,140],[120,170,255]));ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // far balloons (decor) and clouds, parallax
  for(let i=0;i<14;i++){const y=((i*137+(-B.camY)*.25)%600)-60,x=(hsh(i)*W);const c=['#ff5a5a','#ffd23a','#5ad1ff','#ff7ae0','#7ff0a0','#ff9a3a'][i%6];
   ctx.globalAlpha=.45;ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,7,9,0,0,7);ctx.fill();ctx.fillStyle='#6a4a2a';ctx.fillRect(x-2,y+10,4,3);ctx.globalAlpha=1;}
  for(let i=0;i<8;i++){const y=((i*211+(-B.camY)*.5)%720)-120,x=((hsh(i+5)*W+B.t*8*(i%2?1:-1))%(W+200))-100;ctx.fillStyle='rgba(255,255,255,.75)';
   for(let k=0;k<4;k++){ctx.beginPath();ctx.ellipse(x+k*26,y+(k%2)*6,30,16,0,0,7);ctx.fill();}}
  // Sandia mountains + fiesta field at the start, sinking away
  const gy=sy(0);if(gy<H+260){ctx.fillStyle='#b8567a';ctx.beginPath();ctx.moveTo(0,gy-20);for(let x=0;x<=W;x+=40)ctx.lineTo(x,gy-120-60*Math.sin(x*.006+1)-(x>380?(x-380)*.4:0));ctx.lineTo(W,gy+40);ctx.lineTo(0,gy+40);ctx.fill();
   ctx.fillStyle='#7fbf5a';ctx.fillRect(0,gy-10,W,300);ctx.fillStyle='#5a9a3a';for(let x=0;x<W;x+=60)ctx.fillRect(x,gy-10,30,300);}
  for(const w of B.winds){const y=sy(w.y);if(y<-80||y>H+80)continue;ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(0,y-w.h/2,W,w.h);
   ctx.strokeStyle='rgba(255,255,255,.55)';ctx.lineWidth=2;for(let k=0;k<6;k++){const x=((k*120+B.t*90*w.dir)%(W+120)+W+120)%(W+120)-60,yy=y-30+(k%3)*30;ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+w.dir*30,yy);ctx.lineTo(x+w.dir*22,yy-6);ctx.stroke();}}}
 function envelope(x,y,r,cols,hit,sq){ctx.save();ctx.translate(x,y);ctx.scale(1,sq||1);ctx.lineWidth=2.5;ctx.strokeStyle='#1a0a28';
  const n=cols.length*2;for(let k=0;k<n;k++){ctx.fillStyle=hit?'#fff':cols[k%cols.length];ctx.beginPath();ctx.moveTo(0,r*1.15);
   const a0=-r+k*(2*r/n),a1=a0+2*r/n;ctx.bezierCurveTo(a0*1.35,r*.2,a0*1.25,-r*1.05,0,-r*1.08);ctx.bezierCurveTo(a1*1.25,-r*1.05,a1*1.35,r*.2,0,r*1.15);ctx.fill();}
  ctx.beginPath();ctx.moveTo(0,r*1.15);ctx.bezierCurveTo(-r*1.35,r*.2,-r*1.25,-r*1.05,0,-r*1.08);ctx.bezierCurveTo(r*1.25,-r*1.05,r*1.35,r*.2,0,r*1.15);ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-r*.4,-r*.45,r*.15,r*.35,-.3,0,7);ctx.fill();ctx.restore();}
 function basket(x,y,w,spike){ctx.strokeStyle='#1a0a28';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-w*.4,y-22);ctx.lineTo(x-w*.75,y-46);ctx.moveTo(x+w*.4,y-22);ctx.lineTo(x+w*.75,y-46);ctx.stroke();
  rrect(x-w/2,y-22,w,22,4,'#a8743a','#3a1a08',2.5);ctx.strokeStyle='#7a4a1a';ctx.lineWidth=1.5;for(let k=1;k<4;k++){ctx.beginPath();ctx.moveTo(x-w/2+k*w/4,y-20);ctx.lineTo(x-w/2+k*w/4,y-2);ctx.stroke();}
  if(spike){ctx.fillStyle='#dfe6f0';ctx.strokeStyle='#3a4050';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x,y+18);ctx.lineTo(x+8,y);ctx.closePath();ctx.fill();ctx.stroke();}}
 function drawPlayer(p){const x=p.x,y=sy(p.y);if(p.inv>0&&Math.floor(B.t*14)%2)ctx.globalAlpha=.55;
  if(p.burn){ctx.fillStyle=p.burn>1?'#ff5a1a':'#ffb347';ctx.beginPath();ctx.moveTo(x-6,y-46);ctx.lineTo(x,y-64-Math.random()*14-(p.burn>1?14:0));ctx.lineTo(x+6,y-46);ctx.fill();ctx.fillStyle='#fff6a0';ctx.beginPath();ctx.moveTo(x-3,y-46);ctx.lineTo(x,y-56-Math.random()*6);ctx.lineTo(x+3,y-46);ctx.fill();}
  envelope(x,y-ENVY-6,ENV,p.col,false,1+(p.burn?.03*Math.sin(B.t*30):0));
  const fr=animFrames(p.ch,'idle')[0]||'idle_1';drawSprite(p.ch,fr,x,y-14,p.face<0,ctx.globalAlpha,.36);
  basket(x,y,34,true);if(p.dive){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=2;for(const o of [-12,0,12]){ctx.beginPath();ctx.moveTo(x+o,y-110);ctx.lineTo(x+o,y-130);ctx.stroke();}}
  ctx.globalAlpha=1;text(p.i?'P2':'P1',x,y-ENVY-ENV-18,10,CHARS[p.ch].tag,'center');
  // fuel gauge on the basket
  rrect(x-18,y+22,36,6,3,'#1a2240',null);rrect(x-18,y+22,Math.max(3,36*(endless?1:p.fuel)),6,3,p.fuel<.2&&!endless?'#ff5a5a':'#ffb347',null);}
 function drawFoe(f){const x=f.x,y=sy(f.y);if(y<-140||y>H+80)return;
  if(f.k==='drone'){ctx.save();ctx.translate(x,y);rrect(-14,-6,28,12,5,f.hit>0?'#fff':'#3a2a5a','#111',2);ctx.fillStyle='#c77dff';ctx.fillRect(-3,-3,6,6);
   ctx.strokeStyle='#111';ctx.lineWidth=2;for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(s*14,-4);ctx.lineTo(s*20,-10);ctx.stroke();ctx.fillStyle='rgba(200,200,220,.7)';ctx.beginPath();ctx.ellipse(s*20,-11,10*Math.abs(Math.sin(B.t*40)),2,0,0,7);ctx.fill();}ctx.restore();if(f.hit>0)f.hit-=1/60;return;}
  envelope(x,y-ENVY,ENV,[f.col,'#ffd23a'],f.hit>0,1);if(f.hit>0)f.hit-=1/60;
  ctx.save();ctx.translate(x,y-6);ctx.scale(.45*(f.vx<0?-1:1),.45);drawStoogeBody(ctx,{wind:f.wind>0?1:0,swing:0},STOOGE_LOOK[f.look],false,f.wind>0,0);ctx.restore();
  basket(x,y,34,false);for(let k=0;k<f.hp;k++){ctx.fillStyle='#ff5a8a';ctx.fillRect(x-10+k*8,y+6,6,4);}
  if(f.wind>0&&Math.floor(B.t*12)%2===0)text('!',x,y-ENVY-ENV-10,18,'#ff3a3a','center');}
 function drawBoss(bo){const x=bo.x,y=sy(bo.y);ctx.save();if(bo.dead){ctx.translate(x,y-90);ctx.rotate(bo.rot);ctx.translate(-x,-(y-90));}
  envelope(x,y-90,82,['#7a2ad8','#5a1aa8','#ffd23a'],bo.hit>0,bo.dead?Math.max(.3,1-B.endT*.3):1);if(bo.hit>0)bo.hit-=1/60;
  text('B',x,y-80,48,'#ffd23a','center','#3a0a5a');
  // the Baron: mustache, aviator cap, purple coat; Meatball beside him
  ctx.save();ctx.translate(x-14,y+4);ctx.scale(.7,.7);ctx.lineWidth=2.5;ctx.strokeStyle='#150a20';
  rrect(-16,-52,32,36,8,'#5a1a8a','#150a20',2.5);ctx.fillStyle='#ffd23a';for(let k=0;k<3;k++){ctx.beginPath();ctx.arc(0,-46+k*10,2.5,0,7);ctx.fill();}
  ctx.fillStyle='#f0c090';ctx.beginPath();ctx.arc(0,-66,14,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='#6a3a1a';ctx.beginPath();ctx.arc(0,-72,15,Math.PI,0);ctx.fill();ctx.stroke();ctx.fillStyle='#9ad8ff';ctx.fillRect(-11,-74,9,6);ctx.fillRect(2,-74,9,6);ctx.strokeRect(-11,-74,9,6);ctx.strokeRect(2,-74,9,6);
  ctx.fillStyle='#3a1a08';ctx.beginPath();ctx.ellipse(-8,-60,9,3,.3,0,7);ctx.ellipse(8,-60,9,3,-.3,0,7);ctx.fill();ctx.beginPath();ctx.arc(-17,-62,3,0,7);ctx.arc(17,-62,3,0,7);ctx.fill();
  ctx.restore();ctx.save();ctx.translate(x+22,y+2);ctx.scale(.5,.5);drawStoogeBody(ctx,{wind:0,swing:0},STOOGE_LOOK[2],false,false,0);ctx.restore();
  basket(x,y+4,74,false);ctx.restore();
  if(!bo.dead&&bo.sayT>0)text(bo.say,x,y-190,13,'#ffd23a','center');}
 B.draw=function(){sky();
  for(const it of B.items){const x=it.x,y=sy(it.y)+Math.sin(TIME*3+it.x)*3;if(y<-30||y>H+30)continue;
   if(it.k==='coin'){if(!(typeof drawItemArt==='function'&&drawItemArt({k:'coin',x:it.x,y:it.y},x,y))){ctx.fillStyle='#ffd23a';ctx.strokeStyle='#6a4a00';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,y,7*Math.abs(Math.cos(TIME*3+it.y)+.2),8,0,0,7);ctx.fill();ctx.stroke();}}
   else if(it.k==='cash'){rrect(x-12,y-10,24,20,6,'#4ac46a','#0a3a1a',2);text('$',x,y+5,13,'#fff','center',null);ctx.strokeStyle='#333';ctx.beginPath();ctx.moveTo(x,y-10);ctx.lineTo(x,y-24);ctx.stroke();ctx.fillStyle='#ff5a8a';ctx.beginPath();ctx.ellipse(x,y-30,7,8,0,0,7);ctx.fill();}
   else if(it.k==='fuel'){rrect(x-9,y-14,18,26,6,'#e8e8f0','#334',2);ctx.fillStyle='#ffb347';ctx.fillRect(x-9,y-4,18,6);ctx.fillStyle='#334';ctx.fillRect(x-3,y-19,6,5);}
   else if(it.k==='pizza'){if(!(typeof drawItemArt==='function'&&drawItemArt({k:'pizza',x:it.x,y:it.y},x,y))){ctx.fillStyle='#ffc84a';ctx.beginPath();ctx.moveTo(x-12,y-8);ctx.lineTo(x+12,y-8);ctx.lineTo(x,y+12);ctx.fill();}}
   else{ctx.globalAlpha=.5+.3*Math.sin(TIME*5);ctx.fillStyle='#2de2f5';ctx.beginPath();ctx.arc(x,y,22,0,7);ctx.fill();ctx.globalAlpha=1;imgC('markers/clue',x,y,34);}}
  for(const g of B.geese){const x=g.x,y=sy(g.y);ctx.save();ctx.translate(x,y);ctx.scale(g.vx<0?-1:1,1);ctx.fillStyle='#eee';ctx.strokeStyle='#333';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,0,12,6,0,0,7);ctx.fill();ctx.stroke();
   ctx.fillStyle='#222';ctx.fillRect(10,-6,8,3);ctx.fillStyle='#ffb347';ctx.fillRect(18,-6,5,3);const w=Math.sin(g.fl)*8;ctx.fillStyle='#ccc';ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(2,-4-w);ctx.lineTo(6,0);ctx.fill();ctx.restore();}
  for(const f of B.fx){if(f.chute){const x=f.x,y=sy(f.y);ctx.save();ctx.translate(x,y);ctx.fillStyle='#b05aff';ctx.strokeStyle='#150a20';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-70,26,Math.PI,0);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(-26,-70);ctx.lineTo(-6,-30);ctx.moveTo(26,-70);ctx.lineTo(6,-30);ctx.stroke();ctx.scale(.5,.5);drawStoogeBody(ctx,{wind:0,swing:0},STOOGE_LOOK[f.look],false,false,Math.sin(TIME*20)*4);ctx.restore();}
   else{ctx.fillStyle=f.c;ctx.fillRect(f.x-3,sy(f.y)-3,6,6);}}
  for(const f of B.foes)drawFoe(f);if(B.boss)drawBoss(B.boss);
  for(const p of B.players)drawPlayer(p);
  for(const s of B.shots){ctx.fillStyle=chile?'#3ac43a':'#ffe9a0';ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.beginPath();ctx.arc(s.x,sy(s.y),chile?4:3,0,7);ctx.fill();ctx.stroke();}
  for(const s of B.eshots){const x=s.x,y=sy(s.y);if(s.sand){rrect(x-8,y-8,16,16,5,'#c8a060','#3a1a08',2);ctx.fillStyle='#7a2ad8';ctx.fillRect(x-3,y-3,6,6);}
   else{ctx.fillStyle='#4ab0ff';ctx.strokeStyle='#14244a';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(x,y,7,8,0,0,7);ctx.fill();ctx.stroke();}}
  for(const f of B.floats)text(f.t,Math.max(100,Math.min(W-100,f.x)),sy(f.y),f.t.length>10?12:15,f.c,'center');
  // HUD
  rrect(4,2,W-8,30,8,'rgba(6,20,36,.92)','#ff7ab0',2);for(let i=0;i<Math.max(5,B.hearts);i++)heart(16+i*20,13,i<B.hearts);
  imgC('markers/clue',150,17,18);text(B.clues.length+'/3',162,22,12,'#ffd23a','left',null);text('$'+B.coins*2,204,22,12,'#fff','left',null);
  text('SPIKED '+B.spikes,262,22,11,'#dfe6f0','left',null);text('TURBO x'+B.players[0].boosts,340,22,11,'#ffb347','left',null);
  const ft=Math.round(5000+6000*prog());text(ft.toLocaleString()+' ft',W-14,22,12,'#fff','right',null);
  rrect(W-14,44,6,H-64,3,'#1a2240',null);rrect(W-14,44+(H-64)*(1-prog())-4,6,8,3,'#ffd23a',null);
  const bo=B.boss;if(bo&&!bo.dead){const bw=240;rrect(W/2-bw/2,H-30,bw,14,6,'#200','#fff',2);ctx.fillStyle='#c77dff';ctx.fillRect(W/2-bw/2+3,H-27,(bw-6)*bo.hp/bo.max,8);text('BARON BLOWHARD',W/2,H-36,13,'#ffd23a','center');}
  if(B.state==='intro'){dim(.4);text(def.title,W/2,80,22,'#ffd23a','center');text(def.sub,W/2,104,13,'#cfe','center');sandyBox(def.intro,def.introExpr[B.introIdx%def.introExpr.length],Math.min(B.introIdx,def.intro.length-1));}
  if(B.state==='play'&&R.t<9){rrect(60,H-58,520,46,10,'rgba(6,20,36,.85)','#2de2f5',2);text('Hold JUMP = burner (rise)    DOWN = vent / spike dive    LEFT/RIGHT drift',W/2,H-39,12,'#fff','center',null);text('ATTACK = BB gun (hold UP to aim up)    GADGET = turbo burner',W/2,H-21,12,'#cfe','center',null);}
  if(B.state==='end'){dim(Math.min(.6,B.endT*.4));text(B.win?def.winText:'MISSION FAILED',W/2,H/2,32,B.win?'#ffd23a':'#ff5a8a','center');if(!B.win)text(B.why||'',W/2,H/2+30,16,'#fff','center');}
  if(B.state==='outro'){dim(.55);sandyBox(def.outro.lines,def.outro.expr[B.outroIdx%def.outro.expr.length],Math.min(B.outroIdx,def.outro.lines.length-1));}
  if(SAVE.testing)text('TESTING MODE',W/2,44,9,'#ff5ae0','center');};
 return B;}

const _startLevelBal=startLevel;
startLevel=function(l){const def=LEVEL_DEFS[l.id];if(def&&def.type==='balloon'){go(makeBalloon(def,NPLAYERS));return;}return _startLevelBal.apply(this,arguments);};
