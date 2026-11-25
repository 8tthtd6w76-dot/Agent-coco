// ===== Gadgets in missions: Down + Gadget uses the equipped gadget, Up + Gadget (or Select/Back) swaps slots =====
// Tap Gadget alone still fires the watch beam (player.js). Charges refill every mission (Smoke Pellets are used up).
// Enemy status timers set here: frz (stunned/confused, no attacks), ham (hamster), bub (bubble), spaced (sent to space).
function gadgetInit(L){L.gch=[{},{}];L.smokes=[];L.lure=null;L.drone=null;L.gfx=[];
 for(const p of L.players){p.slot=0;p.shield=0;p.grap=null;for(const id of equipped(p.ch)){const g=gadgetDef(id);
  L.gch[p.i][id]=g.consumable?(SAVE.testing?99:SAVE.smoke):g.ch?g.ch[gadgetQ(id)]:0;}}}
const curGadget=p=>{const e=equipped(p.ch);return e.length?e[Math.min(p.slot||0,e.length-1)]:null;};
const hasPassive=(p,id)=>equipped(p.ch).includes(id);
function skatesOn(p){return cheatOn('skates')||hasPassive(p,'skates');}
function swapGadget(p,L){const e=equipped(p.ch);if(e.length<2){L.float(p.x,p.y-100,e.length?'ONLY 1 SLOT':'NO GADGET','#9fb');return;}
 p.slot=(p.slot+1)%e.length;SFX.move();L.float(p.x,p.y-100,gadgetDef(curGadget(p)).n.toUpperCase(),'#2de2f5');}
function useGadget(p,L){const id=curGadget(p);
 if(!id){L.float(p.x,p.y-100,'EQUIP A GADGET IN THE WATCH','#9fb');SFX.hurt();return;}
 const g=gadgetDef(id),q=gadgetQ(id);
 if(!g.ch){L.float(p.x,p.y-100,g.n.toUpperCase()+': ALWAYS ON','#9fb');return;}
 const left=L.gch[p.i][id]||0;if(left<=0){L.float(p.x,p.y-100,'OUT OF '+g.n.toUpperCase(),'#ff9ac0');SFX.hurt();return;}
 if((p.gcd||0)>0)return;
 const ok=GADGET_USE[id](p,L,q);if(ok===false)return;
 if(id!=='grapple')L.gch[p.i][id]=left-1;
 if(g.consumable&&!SAVE.testing){SAVE.smoke=Math.max(0,SAVE.smoke-1);save();}
 p.gcd=id==='grapple'?g.cd[q]:.35;SFX.gadget();}
const onScreen=(L,x)=>x>L.cam-40&&x<L.cam+W+40;
const GADGET_USE={
 smoke(p,L,q){L.smokes.push({x:p.x,y:p.y-30,t:4,r:110});L.float(p.x,p.y-110,'POOF!','#cde');L.dust(p.x,p.y,10);},
 shield(p,L){p.shield=3;L.float(p.x,p.y-110,'PIZZA SHIELD!','#ffb347');},
 magnet_glove(p,L){let n=0;for(const it of L.items)if(!it.got&&Math.abs(it.x-p.x)<620){it.mag=p;n++;}
  for(const e of L.enemies)if(e instanceof Thrower&&!e.dead&&Math.abs(e.x-p.x)<420){e.cd=4;e.wind=0;L.float(e.x,e.y-90,'NO BRICKS!','#ff9a3a');}
  L.float(p.x,p.y-110,'MAGNET!','#e83a3a');},
 grapple(p,L){let best=null,bd=1e9;
  for(const pl of L.plats){if(pl[1]>p.y-24||pl[1]<p.y-300)continue;const cx=Math.max(pl[0]+10,Math.min(pl[0]+pl[2]-10,p.x+p.face*60));
   const dx=(cx-p.x)*p.face;if(dx<-60||dx>300)continue;const d=Math.hypot(cx-p.x,pl[1]-p.y)+(dx<0?80:0);if(d<bd){bd=d;best=[cx,pl[1]];}}
  if(!best){L.float(p.x,p.y-100,'NO LEDGE TO HOOK','#9fb');return false;}
  p.grap={x0:p.x,y0:p.y,x1:best[0],y1:best[1],t:0};p.vy=0;p.vx=0;L.float(p.x,p.y-110,'ZIP!','#c99a3a');},
 holo(p,L){L.lure={x:p.x+p.face*70,y:p.y,t:5};L.float(p.x,p.y-110,'HOLO-SANDY!','#2de2f5');},
 hamster(p,L){shootFx(p,L,'hamster','#ff9ac0');},
 drone(p,L){L.drone={x:p.x,y:p.y-150,t:6,p};L.float(p.x,p.y-110,'DRONE UP!','#4a6aff');},
 honk(p,L,q){for(const e of L.enemies)if(!e.dead&&onScreen(L,e.x)){e.frz=Math.max(e.frz||0,e.boss?1.2:(q>=2?2:1.5));e.wind=0;}
  L.gfx.push({k:'ring',x:p.x,y:p.y-40,t:0,c:'#ffd23a'});L.addShake(.5);beep(220,.35,'sawtooth',.09,-40);L.float(p.x,p.y-110,'HOOONK!','#ffd23a');},
 bubble(p,L){shootFx(p,L,'bubble','#c8f');},
 wind(p,L){for(const e of L.enemies){if(e.dead)continue;const dx=(e.x-p.x)*p.face;if(dx<-10||dx>340)continue;
   if(e instanceof Barrel){e.vx=p.face*Math.abs(e.vx||200);continue;}e.vx=p.face*(e.boss?120:460);e.vy=-160;e.frz=Math.max(e.frz||0,e.boss?.3:.7);e.wind=0;}
  for(const s of L.shots)if(s.brick&&(s.x-p.x)*p.face>-10&&(s.x-p.x)*p.face<360){s.vx=p.face*300;s.vy=-200;s.refl=1;}
  L.gfx.push({k:'gust',x:p.x,y:p.y-40,t:0,f:p.face});L.float(p.x,p.y-110,'WHOOSH!','#9fe');},
 space(p,L){shootFx(p,L,'space','#ccd');}};
function shootFx(p,L,fx,col){L.shots.push({x:p.x+p.face*p.C.muzzle[0],y:p.y-p.C.muzzle[1],vx:p.face*380,life:1.2,own:1,col,gfx:fx});}
// a gadget shot hit an enemy
function gadgetHit(L,e,s){const dir=s.vx>0?1:-1;
 if(s.gfx==='hamster'){if(e.boss){e.frz=Math.max(e.frz||0,1.5);L.float(e.x,e.y-e.popY,'DIZZY!','#ff9ac0');}else{e.ham=6;e.frz=6;e.wind=0;L.float(e.x,e.y-e.popY,'SQUEAK!','#ff9ac0');}}
 else if(s.gfx==='bubble'){if(e instanceof Barrel){e.dead=1;L.burst(e.x,e.y-14,'#c8f',10);}else if(e.boss){e.frz=Math.max(e.frz||0,1);}else{e.bub=3;e.frz=3;e.wind=0;}L.float(e.x,e.y-e.popY,'BLUB!','#c8f');}
 else if(s.gfx==='space'){if(e.boss){L.hurtEnemy(e,3,dir,true);e.frz=3;L.float(e.x,e.y-e.popY-20,'HAT TO SPACE!','#ccd');}
  else{e.dead=1;e.spaced=1;L.kills++;L.float(e.x,e.y-e.popY,'TO SPACE!','#ccd');beep(300,.6,'sine',.06,900);}}
 L.burst(e.x,e.y-40,s.col,10);}
// per-frame gadget upkeep (called from the level update)
function gadgetTick(L,dt){
 for(const p of L.players){p.gcd=(p.gcd||0)-dt;if(p.shield>0)p.shield-=dt;}
 for(const s of L.smokes)s.t-=dt;L.smokes=L.smokes.filter(s=>s.t>0);
 for(const e of L.enemies){if(e.dead)continue;
  for(const s of L.smokes)if(Math.abs(e.x-s.x)<s.r&&!e.boss){e.frz=Math.max(e.frz||0,.25);e.conf=1;e.wind=0;}
  if(e.ham>0)e.ham-=dt;if(e.bub>0)e.bub-=dt;}
 if(L.lure){L.lure.t-=dt;if(L.lure.t<=0)L.lure=null;}
 if(L.drone){const D=L.drone;D.t-=dt;D.x=Math.min(L.ww-W/2,D.x+260*dt*(D.t>3?1:0));if(D.t<=0)L.drone=null;}
 for(const it of L.items)if(it.mag&&!it.got){const p=it.mag,dx=p.x-it.x,dy=p.y-40-it.y,d=Math.hypot(dx,dy)||1;it.x+=dx/d*Math.min(d,520*dt);it.y+=dy/d*Math.min(d,520*dt);}
 for(const f of L.gfx)f.t+=dt;L.gfx=L.gfx.filter(f=>f.t<.6);
 // reflected bricks (Pizza Shield / Wind Fan) hit enemies
 for(const s of L.shots)if(s.refl&&s.life>0)for(const e of L.enemies)if(!e.dead&&!e.boss&&Math.abs(e.x-s.x)<e.hw+8&&s.y>e.y-e.hh&&s.y<e.y){s.life=0;L.hurtEnemy(e,1,s.vx>0?1:-1);break;}}
// enemy status: frozen/confused/hamster/bubble enemies don't attack; Holo-Sandy pulls henchmen over to stare
const _enemyUpdate=Enemy.prototype.update;
Enemy.prototype.update=function(dt,L,al){
 if(this.dead||!L.gch)return _enemyUpdate.call(this,dt,L,al);
 if(this.frz>0){this.frz-=dt;this.act=true;this.hurt-=dt;this.sq-=dt;
  if(this.bub>0){this.vy=0;this.y=Math.max(L.gy-70,this.y-50*dt);this.x+=this.vx*dt;this.vx*=.95;if(this.bub<=dt){this.y=L.gy-70;}return;}
  if(this.ham>0){this.groundPhysics(dt,L);this.x+=Math.sin(TIME*3+this.seed)*40*dt;return;}
  this.groundPhysics(dt,L);if(this.conf)this.x+=Math.sin(TIME*2+this.seed*3)*30*dt;if(this.frz<=0)this.conf=0;return;}
 if(this.y<L.gy&&!this.bub)this.vy+=0;  // falls back down via groundPhysics after a bubble
 if(L.lure&&!this.boss&&Math.abs(L.lure.x-this.x)<450){this.act=true;this.groundPhysics(dt,L);const d=L.lure.x-this.x;this.face=d>0?1:-1;if(Math.abs(d)>40)this.x+=this.face*60*dt;this.wind=0;return;}
 return _enemyUpdate.call(this,dt,L,al);};
// ---- drawing ----
function drawEnemyG(e,L){
 if(e.spaced){const x=e.x-L.cam,y=e.y-60-e.dead*520;if(y>-40){ctx.save();ctx.translate(x,y);ctx.fillStyle='#ccd';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(9,6);ctx.lineTo(-9,6);ctx.closePath();ctx.fill();ctx.stroke();
   ctx.fillStyle='#ff7a1a';ctx.beginPath();ctx.moveTo(-6,8);ctx.lineTo(0,22+Math.random()*8);ctx.lineTo(6,8);ctx.fill();ctx.restore();}
  else if(e.dead<2){ctx.fillStyle='#fff';const x2=e.x-L.cam;ctx.globalAlpha=Math.abs(Math.sin(TIME*20));ctx.fillRect(x2-2,20,4,4);ctx.globalAlpha=1;}return;}
 if(e.ham>0&&!e.dead){drawHamster(e.x-L.cam,e.y);return;}
 if(e.bub>0&&!e.dead){e.draw(L);const x=e.x-L.cam;ctx.save();ctx.globalAlpha=.45;ctx.fillStyle='#e9c8ff';ctx.beginPath();ctx.arc(x,e.y-40,52,0,7);ctx.fill();ctx.globalAlpha=.9;ctx.strokeStyle='#c8f';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x-18,e.y-62,7,0,7);ctx.fill();ctx.restore();return;}
 e.draw(L);
 if(e.frz>0&&!e.dead){const x=e.x-L.cam,y=e.y-(e.popY||80)+6;for(let i=0;i<3;i++){const a=TIME*5+i*2.1;text(e.conf?'?':'*',x+Math.cos(a)*18,y+Math.sin(a)*5,13,e.conf?'#cde':'#ffd23a','center');}}}
function drawHamster(x,y){ctx.save();ctx.translate(x,y);const b=Math.abs(Math.sin(TIME*8))*4;ctx.translate(0,-b);ctx.lineWidth=2.5;ctx.strokeStyle='#150a20';
 ctx.fillStyle='#f0a050';ctx.beginPath();ctx.ellipse(0,-14,18,14,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#fde4c0';ctx.beginPath();ctx.ellipse(4,-10,9,8,0,0,7);ctx.fill();
 ctx.fillStyle='#f0a050';ctx.beginPath();ctx.arc(-8,-27,5,0,7);ctx.arc(8,-27,5,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(-5,-17,2.2,0,7);ctx.arc(7,-17,2.2,0,7);ctx.fill();
 ctx.fillStyle='#ff7a9a';ctx.beginPath();ctx.arc(1,-12,2,0,7);ctx.fill();ctx.restore();}
function drawGadgetWorld(L){
 for(const s of L.smokes){const x=s.x-L.cam,a=Math.min(1,s.t)*.75;ctx.save();ctx.globalAlpha=a;for(let i=0;i<7;i++){const ang=i*.9+TIME*.6;ctx.fillStyle=i%2?'#aab6cc':'#c8d0e0';ctx.beginPath();ctx.arc(x+Math.cos(ang)*s.r*.55,s.y+Math.sin(ang)*28,44,0,7);ctx.fill();}ctx.restore();}
 if(L.lure){const x=L.lure.x-L.cam,y=L.lure.y-40+Math.sin(TIME*4)*5,im=IMG['sandy/happy'];ctx.save();ctx.globalAlpha=.55+.25*Math.sin(TIME*20);ctx.filter='hue-rotate(10deg) saturate(1.5)';
  if(im&&im.width)ctx.drawImage(im,x-30+Math.sin(TIME*6)*6,y-34,60,im.height*60/im.width);else{ctx.fillStyle='#2de2f5';ctx.beginPath();ctx.arc(x,y,24,0,7);ctx.fill();}ctx.filter='none';
  ctx.fillStyle='#2de2f5';ctx.globalAlpha=.3;ctx.beginPath();ctx.ellipse(x,L.lure.y,28,6,0,0,7);ctx.fill();ctx.restore();}
 if(L.drone){const D=L.drone,x=D.x-L.cam,y=D.y+Math.sin(TIME*5)*4;ctx.save();ctx.fillStyle='#1a2a6a';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x-14,y-6,28,12,5);ctx.fill();ctx.stroke();
  ctx.fillStyle='#7ff';ctx.beginPath();ctx.arc(x,y+4,5,0,7);ctx.fill();ctx.strokeStyle='#ffd23a';for(const s of [-1,1]){ctx.beginPath();ctx.moveTo(x+s*20-8*Math.cos(TIME*40),y-9);ctx.lineTo(x+s*20+8*Math.cos(TIME*40),y-9);ctx.stroke();}ctx.restore();}
 for(const p of L.players){if(p.shield>0&&!p.down){const x=p.x-L.cam+p.face*24,y=p.y-42;ctx.save();ctx.translate(x,y);ctx.scale(Math.cos(TIME*12)*.35+.65,1);ctx.globalAlpha=p.shield<.6?.5:1;
   ctx.fillStyle='#d8d8e0';ctx.strokeStyle='#000';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(0,0,22,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#ffc84a';ctx.beginPath();ctx.arc(0,0,16,0,7);ctx.fill();
   ctx.fillStyle='#e03030';for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(Math.cos(i*1.6)*9,Math.sin(i*1.6)*9,3,0,7);ctx.fill();}ctx.restore();}
  if(p.grap){const g=p.grap;ctx.strokeStyle='#c99a3a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-L.cam,p.y-50);ctx.lineTo(g.x1-L.cam,g.y1);ctx.stroke();}}
 for(const f of L.gfx){const x=f.x-L.cam,k=f.t/.6;ctx.save();ctx.globalAlpha=1-k;
  if(f.k==='ring'){ctx.strokeStyle=f.c;ctx.lineWidth=6;for(let i=0;i<3;i++){const rr=40+k*300-i*40;if(rr>0){ctx.beginPath();ctx.arc(x,f.y,rr,0,7);ctx.stroke();}}}
  else if(f.k==='gust'){ctx.strokeStyle='#dff';ctx.lineWidth=4;for(let i=0;i<5;i++){const yy=f.y-40+i*20,x0=x+f.f*(20+k*260);ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x0+f.f*60,yy+Math.sin(i)*6);ctx.stroke();}}
  ctx.restore();}
 // Glitch Goggles: arrows to hidden clues and parts that are off screen; Perfect also rings enemies winding up
 const gog=L.players.find(p=>hasPassive(p,'goggles'));
 if(gog){for(const it of L.items){if(it.got||(it.k!=='clue'&&it.k!=='part'))continue;const x=it.x-L.cam;if(x>10&&x<W-10)continue;const ax=x<0?18:W-18,y=Math.max(70,Math.min(H-40,it.y));
   ctx.fillStyle='#f6c';ctx.beginPath();ctx.moveTo(ax+(x<0?-10:10),y);ctx.lineTo(ax+(x<0?6:-6),y-9);ctx.lineTo(ax+(x<0?6:-6),y+9);ctx.fill();}
  if(gadgetQ('goggles')>=2)for(const e of L.enemies)if(e.wind>0&&!e.dead){ctx.strokeStyle='rgba(255,60,60,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(e.x-L.cam,L.gy,e.shadowW+12,8,0,0,7);ctx.stroke();}}}
// small HUD under each player's hearts: current gadget + charges
function drawGadgetHud(L){for(const p of L.players){const id=curGadget(p);if(!id)continue;const x=p.i?W-180:10,g=gadgetDef(id);
 rrect(x-4,54,174,24,8,'rgba(6,20,36,.75)','#456',2);itemIcon(id,x+10,66,18);
 const n=g.ch?(g.consumable?L.gch[p.i][id]:(id==='grapple'?'':L.gch[p.i][id])):'ON';
 text(g.n,x+24,71,11,'#cfe','left',null);text(String(n),x+164,71,12,'#ffd23a','right',null);}}
