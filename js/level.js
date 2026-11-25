// ===== Generic side-scroll level runner: makeLevel(def, numPlayers) =====
function startLevel(l){const def=LEVEL_DEFS[l.id];if(!def)return;go(def.type==='hack'?makeHack(def,NPLAYERS):makeLevel(def,NPLAYERS));}
// shared reward + save for every mission type. data: {clues:[ids], coins, kills, total}
function missionPayout(def,np,d){const R=def.reward||{base:100,perClue:50,perKill:5,tips:0};
 const xp=R.base+d.clues.length*R.perClue+d.kills*R.perKill,cash=d.coins*2+R.tips;
 SAVE.done[def.id]=true;SAVE.unlocked[def.id+1]=true;SAVE.xp+=xp;SAVE.coins+=cash;d.clues.forEach(c=>{if(!SAVE.clues.includes(c))SAVE.clues.push(c);});if(np>1)SAVE.coop=true;
 let ride=null;if(def.unlockVehicle&&!SAVE.vehicles[def.unlockVehicle]){SAVE.vehicles[def.unlockVehicle]=true;ride=def.unlockVehicle;}save();
 Results.show({win:1,xp,coins:cash,clues:d.clues.length,total:d.total,kills:d.kills,name:levelName(def.id),id:def.id,ride,rare:d.rare,parts:d.parts});}

function makeLevel(def,np){
 const L={name:'level',def,paused:false,state:'intro',introIdx:0,t:0,cam:0,trauma:0,hitstop:0,kills:0,coins:0,clues:[],
  parts:[],fx:[],outroIdx:0,pits:def.pits||[],items:[],enemies:[],shots:[],waves:[],floats:[],bossLock:false,boss:null,endT:0,minCam:0,
  ww:def.width,gy:def.groundY,plats:def.platforms||[],theme:THEMES[def.theme]};
 const GY=L.gy;
 L.players=[new Player(0,L)];if(np>1)L.players.push(new Player(1,L));gadgetInit(L);
 (def.clues||[]).forEach(c=>L.items.push({k:'clue',i:c.clue,x:c.x,y:c.y,got:false}));
 (def.parts||[]).forEach(c=>{if(!SAVE.rare[c.id]||!RARE.find(r=>r.id===c.id))L.items.push({k:'part',id:c.id,x:c.x,y:c.y,got:false});});
 (def.pizzas||[]).forEach(c=>L.items.push({k:'pizza',x:c[0],y:c[1],got:false}));
 if(def.coins){const C=def.coins;for(let i=0;i<C.n;i++){const x=C.x0+i*C.dx+hsh(i)*C.jitter;const on=L.plats.find(p=>x>p[0]&&x<p[0]+p[2]);L.items.push({k:'coin',x,y:(on?on[1]:GY)-30-(on?0:hsh(i+9)*40),got:false});}}
 (def.coinList||[]).forEach(c=>L.items.push({k:'coin',x:c[0],y:c[1],got:false}));
 (def.enemies||[]).forEach((o,i)=>L.enemies.push(makeEnemy(Object.assign({seed:i},o,{y:GY}))));
 L.cluesTotal=(def.clues||[]).length+(def.boss&&def.boss.drop!=null?1:0);
 L.inPit=x=>{for(const q of L.pits)if(x>q[0]+8&&x<q[1]-8)return true;return false;};

 L.alive=()=>L.players.filter(p=>!p.down);
 L.enter=function(){startMusic(levelMusic(def));};
 L.burst=function(x,y,col,n=8){for(let i=0;i<n;i++)L.parts.push({x,y,vx:rand(-140,140),vy:rand(-220,-40),t:rand(.3,.6),c:col});};
 L.float=function(x,y,t,col='#fff'){const hw=Math.min(W/2-10,t.length*4.5+10);x=Math.max(L.cam+hw,Math.min(L.cam+W-hw,x));for(const f of L.floats)if(Math.abs(f.x-x)<60&&Math.abs(f.y-y)<16&&f.life>.6)y=f.y-17;L.floats.push({x,y,t,c:col,life:1});};  // stack instead of overlap
 // screen shake uses 'trauma' (0..1); the offset grows with trauma squared so small hits stay subtle
 L.addShake=function(a){L.trauma=Math.min(1,L.trauma+a*(SETTINGS.shake));};
 // impact star at the contact point
 L.spark=function(x,y,big){L.fx.push({x,y,t:0,big});};
 L.dust=function(x,y,n){for(let i=0;i<n;i++)L.parts.push({x:x+rand(-10,10),y:y-2,vx:rand(-90,90),vy:rand(-90,-20),t:rand(.2,.35),c:'#d8c8e8'});};
 L.dmgPlayer=function(p,d,fromX){if(p.down||p.inv>0)return;if(p.shield>0){if(!(p.blockT>0)){L.float(p.x,p.y-100,'BLOCKED!','#ffb347');SFX.hit();}p.blockT=.3;return;}if(p.dash>0){if(!p.dodged){p.dodged=1;L.float(p.x,p.y-100,'DODGE!','#9ff');}return;}p.dodged=0;p.hp-=d;p.inv=1.2;p.stun=FEEL.stun;p.atk=0;p.vx=(p.x<fromX?-1:1)*230;p.vy=-240;p.on=false;SFX.hurt();L.burst(p.x,p.y-40,'#ff5a8a');L.addShake(.35);L.hitstop=Math.max(L.hitstop,FEEL.hitstopHurt);
  if(p.hp<=0){p.hp=0;p.down=true;p.resp=4.5;L.float(p.x,p.y-90,'DOWN!','#ff5a8a');}};
 L.hurtEnemy=function(e,d,dir,fin=false){if(e.dead)return;if(e.invuln){if(!(e.tooFast>0)){e.tooFast=.6;L.float(e.x,e.y-e.popY,'TOO FAST!','#9ff');SFX.hit();}return;}e.hp-=d;e.hurt=.2;e.onHit(dir,fin);fin?SFX.smash():SFX.hit();L.burst(e.x,e.y-e.fxY,'#ffd23a',fin?14:8);L.float(e.x,e.y-e.popY,fin?'KA-POW!':'POW',fin?'#ff9a3a':'#ffd23a');L.addShake(fin?.32:.12);
  if(e.hp<=0){e.dead=1;L.kills++;if(e.boss&&def.boss.drop!=null&&!L.clues.includes(def.boss.drop)){L.clues.push(def.boss.drop);L.float(e.x,e.y-e.popY-30,'CLUE: '+CLUES[def.boss.drop].name,'#ffd23a');}if(e.boss&&def.boss.part&&giveRare(def.boss.part)){L.rareNew=def.boss.part;L.float(e.x,e.y-e.popY-50,'RARE PART: '+partDef(def.boss.part).n.toUpperCase()+'!','#ffd23a');}
   if(def.dozerPart&&e instanceof Dozer&&!SAVE.rare[def.dozerPart]&&!L.items.some(i=>i.id===def.dozerPart))L.items.push({k:'part',id:def.dozerPart,x:e.x,y:L.gy-40,got:false});
   if(e.boss&&L.state!=='end'){L.finish(true);L.hitstop=.3;L.addShake(.9);}L.burst(e.x,e.y-40,'#fff',14);e.onDeath(L);if(!e.boss&&!(e instanceof Barrel)&&hsh(e.x*.37+L.kills)<.16)L.items.push({k:'part',id:PARTS[Math.floor(hsh(e.x+L.kills*7)*11)].id,x:e.x,y:L.gy-30,got:false});}};
 L.collect=function(p,it){
  if(it.k==='coin'){L.coins++;SFX.pick();L.float(it.x,it.y-10,'+$','#ffd23a');
   if(cheatOn('pizzaparty')){p.coinHeal=(p.coinHeal||0)+1;if(p.coinHeal>=4){p.coinHeal=0;if(p.hp<p.maxhp){p.hp++;L.float(p.x,p.y-100,'+HP','#9fb');}}}}
  else if(it.k==='pizza'){p.hp=Math.min(p.maxhp,p.hp+2);SFX.pick();L.float(it.x,it.y-10,'+HP','#9fb');}
  else if(it.k==='part'){const d=partDef(it.id);if(RARE.includes(d)){if(giveRare(it.id))L.rareNew=it.id;playStinger('unlock');L.float(it.x,it.y-20,'RARE PART: '+d.n.toUpperCase()+'!','#ffd23a');}
   else{givePart(it.id);SFX.pick();L.float(it.x,it.y-20,'+ '+d.n,'#cfe');}L.partsGot=(L.partsGot||0)+1;}
  else if(it.k==='clue'){L.clues.push(it.i);playStinger('clue');L.float(it.x,it.y-20,'CLUE: '+CLUES[it.i].name,'#ffd23a');}};
 L.finish=function(win){L.state='end';L.win=win;L.endT=0;stopMusic();playStinger(win?'win':'lose');if(win){for(const p of L.players)if(!p.down){p.celebrate=true;p.face=1;}}};
 function payout(){missionPayout(def,np,{clues:L.clues,coins:L.coins,kills:L.kills,total:L.cluesTotal,rare:L.rareNew,parts:L.partsGot});}

 // ---------- update ----------
 L.update=function(dt){
  L.t+=dt;
  if(L.state==='intro'){if(anyPressed('ok')||anyPressed('attack')){SFX.move();L.introIdx++;if(L.introIdx>=def.intro.length)L.state='play';}return;}
  if(L.state==='outro'){L.endT+=dt;if(L.endT>.4&&(anyPressed('ok')||anyPressed('attack'))){SFX.move();L.outroIdx++;L.endT=0;if(L.outroIdx>=def.outro.lines.length)payout();}return;}
  if(L.paused)return;
  if(anyPressed('start')){L.paused=true;push(Watch.make('level'));return;}
  if(L.hitstop>0){L.hitstop-=dt;return;}  // freeze-frame on impact
  if(L.state==='end'){L.endT+=dt;for(const e of L.enemies)if(e.boss&&e.dead)e.dead+=dt;if(L.endT>2.2){if(L.win&&def.outro){L.state='outro';L.outroIdx=0;L.endT=0;startMusic(def.outro.music||'cutscene');}else if(L.win)payout();else Results.show({win:0,name:levelName(def.id),id:def.id});}return;}
  for(const p of L.players)p.update(dt,L);gadgetTick(L,dt);
  // camera follows the average of living players
  const al=L.alive();const ax=al.length?al.reduce((s,p)=>s+p.x,0)/al.length:L.cam+W/2;
  const maxCam=L.ww-W;
  if(def.autoscroll&&L.state==='play'&&!(L.boss&&L.boss.mode==='cornered'))L.minCam=Math.min(maxCam,L.minCam+def.autoscroll.speed*dt);
  L.cam+=(Math.max(L.minCam,Math.min(maxCam,(L.drone?L.drone.x:ax)-W/2))-L.cam)*Math.min(1,dt*6);
  if(def.boss&&!L.bossLock&&ax>def.boss.trigger){L.bossLock=true;if(def.boss.lock!==false)L.minCam=maxCam;
   L.boss=makeEnemy(Object.assign({},def.boss,{y:GY}));L.enemies.push(L.boss);startMusic(bossMusic(def));L.float(def.boss.x-100,GY-170,L.boss.label,L.boss.labelCol);}
  if(def.goalX&&L.state==='play'&&al.some(p=>p.x>=def.goalX))L.finish(true);
  for(const e of L.enemies){const ox=e.x;e.update(dt,L,al);if(e.tooFast>0)e.tooFast-=dt;if(L.pits.length&&!e.boss&&L.inPit(e.x)){e.x=ox;if(e.dir)e.dir*=-1;}if(e.boss&&e.hp<=0&&L.state!=='end')L.finish(true);}
  // projectiles
  for(const s of L.shots){s.life-=dt;s.x+=s.vx*dt;
   if(s.brick){s.vy+=900*dt;s.y+=s.vy*dt;if(s.warn&&s.y<0)s.life=Math.max(s.life,1);if(s.y>GY){s.life=0;L.burst(s.x,GY,'#c66');}if(!s.refl)for(const p of al)if(Math.abs(p.x-s.x)<(p.shield>0?34:18)&&Math.abs(p.y-40-s.y)<38){if(p.shield>0){s.refl=1;s.vx=(s.x<p.x?-1:1)*320;s.vy=-260;s.warn=0;L.float(p.x,p.y-100,'BOINK!','#ffb347');SFX.hit();break;}s.life=0;L.dmgPlayer(p,1,s.x);}}
   else if(s.own){for(const e of L.enemies){if(e.dead||(s.hit&&s.hit.has(e)))continue;if(Math.abs(e.x-s.x)<e.shotW+(s.big?14:0)&&s.y+(s.big?16:0)>e.y-e.hh&&s.y-(s.big?16:0)<e.y){
     if(s.gfx){s.life=0;gadgetHit(L,e,s);break;}
     if(s.big){s.hit.add(e);L.hurtEnemy(e,2,s.vx>0?1:-1,true);}else{s.life=0;L.hurtEnemy(e,1,s.vx>0?1:-1);break;}}}}}
  L.shots=L.shots.filter(s=>s.life>0);
  for(const w of L.waves){w.life-=dt;w.x+=w.v*dt;for(const p of al)if(Math.abs(p.x-w.x)<20&&p.y>GY-20)L.dmgPlayer(p,1,w.x);}
  L.waves=L.waves.filter(w=>w.life>0);
  for(const q of L.parts){q.t-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=700*dt;}L.parts=L.parts.filter(q=>q.t>0);
  for(const f of L.fx)f.t+=dt;L.fx=L.fx.filter(f=>f.t<(f.big?.2:.13));
  for(const f of L.floats){f.life-=dt;f.y-=30*dt;}L.floats=L.floats.filter(f=>f.life>0);
  L.trauma=Math.max(0,L.trauma-dt*1.5);
  // fell down a gap between buildings: lose a heart, come back on the last safe roof
  for(const p of L.players){if(p.down)continue;if(p.on&&p.y>=L.gy&&!L.inPit(p.x-60)&&!L.inPit(p.x)&&!L.inPit(p.x+60))p.safeX=p.x;
   if(p.y>L.gy+140){const o=L.alive().find(q=>q!==p&&q.on&&!L.inPit(q.x));p.x=o?o.x:Math.max(L.minCam+60,p.safeX||L.minCam+80);p.y=(o?o.y:L.gy)-80;p.vy=0;p.vx=0;p.inv=0;p.dash=0;
    L.dmgPlayer(p,1,p.x);p.vx=0;p.vy=-100;if(!p.down){L.float(p.x,p.y-60,'OOPS!','#ff9ac0');}else{p.y=L.gy;}}}
  L.enemies=L.enemies.filter(e=>!(e.dead>2.2&&!e.boss));  // beaten bosses stay down (dizzy) on screen
  if(L.state==='play'&&!L.alive().length&&L.players.every(p=>p.down))L.finish(false);
 };

 // ---------- drawing ----------
 function drawItems(){for(const it of L.items){if(it.got)continue;const x=it.x-L.cam;if(x<-30||x>W+30)continue;const b=Math.sin(TIME*4+it.x)*3;
  if(typeof drawItemArt==='function'&&drawItemArt(it,x,it.y+b));
  else if(it.k==='coin'){ctx.fillStyle='#ffd23a';ctx.strokeStyle='#6a4a00';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,it.y+b,7*Math.abs(Math.cos(TIME*3+it.x)+.2),8,0,0,7);ctx.fill();ctx.stroke();}
  else if(it.k==='pizza'){ctx.fillStyle='#ffc84a';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x-12,it.y+b-8);ctx.lineTo(x+12,it.y+b-8);ctx.lineTo(x,it.y+b+12);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#e03030';ctx.beginPath();ctx.arc(x-3,it.y+b-2,2.5,0,7);ctx.arc(x+4,it.y+b-4,2.5,0,7);ctx.fill();}
  else if(it.k==='egg'&&typeof drawEggItem==='function')drawEggItem(it,x,it.y+b);
  else{ctx.globalAlpha=.5+.3*Math.sin(TIME*5);ctx.fillStyle='#2de2f5';ctx.beginPath();ctx.arc(x,it.y+b,22,0,7);ctx.fill();ctx.globalAlpha=1;imgC('markers/clue',x,it.y+b,36);}}}
 L.draw=function(){
  ctx.save();if(L.trauma>0){const s=L.trauma*L.trauma*10;ctx.translate(s*(Math.sin(TIME*67)*.6+Math.sin(TIME*41+1.3)*.4),s*(Math.sin(TIME*59+2.1)*.6+Math.sin(TIME*37)*.4));}
  L.theme.bg(L);
  if(L.theme.pit)for(const q of L.pits){const a=q[0]-L.cam,b=q[1]-L.cam;if(b>-20&&a<W+20)L.theme.pit(L,a,b);}
  if(def.goalX){const x=def.goalX-L.cam;if(x>-60&&x<W+60){ctx.fillStyle='#444';ctx.fillRect(x-3,GY-120,6,120);ctx.fillStyle='#ffd23a';const wv=Math.sin(TIME*6)*4;ctx.beginPath();ctx.moveTo(x+3,GY-120);ctx.lineTo(x+60,GY-108+wv);ctx.lineTo(x+3,GY-92);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();text(def.goalLabel||'GOAL',x,GY-128,12,'#ffd23a','center');}}
  for(const p of L.plats){const x=p[0]-L.cam;if(x>W+20||x+p[2]<-20)continue;L.theme.platform(L,p,x);}
  for(const w of L.waves){const x=w.x-L.cam;ctx.fillStyle='#ffb060';ctx.beginPath();ctx.moveTo(x-12,GY);ctx.lineTo(x,GY-34);ctx.lineTo(x+12,GY);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.stroke();}
  drawItems();
  for(const s of L.shots)if(s.warn&&s.y<GY-20){const x=s.x-L.cam,k=Math.max(.2,Math.min(1,1-(GY-s.y)/500));ctx.fillStyle='rgba(255,40,40,'+(.25+.35*k)+')';ctx.beginPath();ctx.ellipse(x,GY+2,8+14*k,4+2*k,0,0,7);ctx.fill();}
  for(const e of L.enemies)e.drawShadow(L);
  drawGadgetWorld(L);
  for(const e of L.enemies)drawEnemyG(e,L);
  for(const p of L.players)p.draw(L);
  for(const s of L.shots){const x=s.x-L.cam;if(s.brick){ctx.fillStyle='#b23a2a';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.fillRect(x-7,s.y-5,14,10);ctx.strokeRect(x-7,s.y-5,14,10);}
   else if(s.big){ctx.globalAlpha=.85;ctx.fillStyle=s.col;ctx.beginPath();ctx.ellipse(x,s.y,40,16,0,0,7);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x,s.y,26,7,0,0,7);ctx.fill();}
   else{ctx.fillStyle=s.col;ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(x,s.y,12,5,0,0,7);ctx.fill();ctx.stroke();}}
  for(const q of L.parts){ctx.fillStyle=q.c;ctx.fillRect(q.x-L.cam,q.y,4,4);}
  for(const f of L.fx){const life=f.big?.2:.13,k=f.t/life,R=(f.big?30:20)*(.6+.6*k),x=f.x-L.cam;
   ctx.save();ctx.translate(x,f.y);ctx.rotate(f.x*.1);ctx.globalAlpha=1-k*k;ctx.beginPath();for(let i=0;i<16;i++){const r=i%2?R*.38:R,a=i*Math.PI/8;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();
   ctx.fillStyle=f.big?'#ffd23a':'#fff';ctx.fill();ctx.lineWidth=2.5;ctx.strokeStyle=f.big?'#ff6a1a':'#2de2f5';ctx.stroke();ctx.restore();}
  for(const f of L.floats)text(f.t,f.x-L.cam,f.y,f.t.length>6?13:15,f.c,'center');
  ctx.restore();
  // HUD
  for(const p of L.players)p.drawHud();drawGadgetHud(L);
  rrect(W/2-70,6,140,34,10,'rgba(6,20,36,.75)','#ffd23a',2);imgC('markers/clue',W/2-48,23,24);text(L.clues.length+'/'+L.cluesTotal,W/2-30,29,15,'#ffd23a','left',null);text('$'+L.coins,W/2+22,29,15,'#fff','left',null);
  const rp=RARE.find(r=>r.lvl===def.id);if(rp){const got=rareFound(rp.id)||L.items.some(i=>i.id===rp.id&&i.got);itemIcon(rp.id,W/2+88,23,22,!got);}
  if(L.state==='intro'){ctx.fillStyle='rgba(5,3,20,.35)';ctx.fillRect(0,0,W,H);text(def.title,W/2,70,20,'#ffd23a','center');text(def.sub||'',W/2,96,13,'#cfe','center');
   const ex=def.introExpr||['happy'];sandyBox(def.intro,ex[L.introIdx%ex.length],Math.min(L.introIdx,def.intro.length-1));}
  if(L.state==='play'&&L.t<7&&def.goal){const a=Math.min(1,(7-L.t)/1);ctx.globalAlpha=a;text(def.goal,W/2,150,14,'#fff','center');ctx.globalAlpha=1;}
  if(SAVE.testing)text('TESTING MODE',W/2,54,10,'#ff5ae0','center');
  if(L.state==='outro'){dim(.55);if(def.outro.glimpse)drawGlimpse(L.outroIdx);const ex=def.outro.expr||['happy'];sandyBox(def.outro.lines,ex[L.outroIdx%ex.length],Math.min(L.outroIdx,def.outro.lines.length-1));}
  if(L.state==='end'){ctx.fillStyle='rgba(5,3,20,'+Math.min(.6,L.endT*.4)+')';ctx.fillRect(0,0,W,H);if(L.win)text(def.winText||'MISSION COMPLETE!',W/2,H/2,32,'#ffd23a','center');else text('AGENTS DOWN',W/2,H/2,32,'#ff5a8a','center');}
 };
 return L;
}
// Mission 1 outro: Papa Johnny watching from the shadows. Only his shape and a gold tooth glint.
function drawGlimpse(idx){const a=Math.min(1,idx*.5+.3),im=IMG['papa_johnny/front'];if(!im||!im.width)return;
 const h=250,k=h/im.height,w=im.width*k,x=W-40-w,y=330-h;ctx.save();ctx.globalAlpha=a;ctx.filter='brightness(.13)';ctx.drawImage(im,x,y,w,h);ctx.filter='none';
 const tw=.5+.5*Math.sin(TIME*5),gx=x+98*k,gy=y+57*k;ctx.globalAlpha=a*(.55+.45*tw);ctx.fillStyle='#ffd23a';ctx.fillRect(gx-3,gy-3,6,6);   // the gold tooth
 ctx.strokeStyle='#fff6a0';ctx.lineWidth=2;ctx.beginPath();const r=6+tw*7;ctx.moveTo(gx-r,gy);ctx.lineTo(gx+r,gy);ctx.moveTo(gx,gy-r);ctx.lineTo(gx,gy+r);ctx.stroke();
 if(idx>=1)text('???',x+w/2,y-12,16,'#ff9a3a','center');ctx.restore();}
function levelName(id){const l=LEVELS.find(l=>l.id===id);return l?l.name:'Mission '+id;}

// Pause properly when the window/tab loses focus or a controller drops (handheld sleep, BT disconnect)
const SETTINGS={shake:1};
function autoPause(){for(const k in KEYS)KEYS[k]=false;
 if(scene&&scene.name==='delivery'&&scene.state==='play'){scene.state='pause';scene.sel=0;return;}
 if(scene&&(scene.name==='level'||scene.name==='hack')&&scene.state==='play'&&!scene.paused){scene.paused=true;push(Watch.make('level'));}}
addEventListener('blur',autoPause);
document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});
addEventListener('gamepaddisconnected',autoPause);
