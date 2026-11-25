// ===== Enemies and bosses =====
// A level lists enemies as data ({type:'walker', x:700}). ENEMY_TYPES maps type -> class.
class Enemy extends Entity{
 constructor(o){super(o.x,o.y);this.t=o.type;this.hp=o.hp||2;this.maxhp=this.hp;this.face=-1;this.home=o.x;
  this.wind=0;this.swing=0;this.hurt=0;this.dead=0;this.stagger=0;this.sq=0;this.seed=o.seed||0;this.act=false;
  // hit boxes and feedback offsets (bosses override)
  this.hw=18;this.shotW=20;this.hh=70;this.knock=200;this.fxY=40;this.popY=80;this.shadowW=20;
  this.style={shirt:'#ff7a1a',hat:'#ffd23a',scale:1,tool:'hammer'};}
 update(dt,L,al){
  if(this.dead){this.dead+=dt;return;}
  if(Math.abs(this.x-(L.cam+W/2))<520)this.act=true;if(!this.act)return;
  this.hurt-=dt;this.swing-=dt;this.sq-=dt;
  const tgt=al.slice().sort((a,b)=>Math.abs(a.x-this.x)-Math.abs(b.x-this.x))[0];if(!tgt)return;
  const dx=tgt.x-this.x;this.groundPhysics(dt,L);
  if(this.stagger>0){this.stagger-=dt;return;}  // reeling from a hit
  this.think(dt,L,tgt,dx,al);
 }
 think(){}
 // called by L.hurtEnemy: knockback with a little hop, cancels a wind-up
 onHit(dir,fin){this.vx=dir*this.knock*(fin?1.7:1);this.vy=fin?-280:-130;this.wind=0;this.stagger=fin?.5:.28;this.stag0=this.stagger;this.sq=.15;}
 onDeath(L){if(Math.random()<.5)L.items.push({k:'coin',x:this.x,y:this.y-30,got:false});}
 drawShadow(L){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(this.x-L.cam,L.gy+2,this.shadowW,5,0,0,7);ctx.fill();}
 draw(L){if(this.sheet&&IMG['sheet_'+this.sheet])drawHench(this,L);else drawThug(this,L);}
}

// Hardhat thug: patrols home, closes in, flashes red, swings a hammer
class Walker extends Enemy{
 constructor(o){super(o);this.sheet='hench_walker';this.windFr=['attack_1'];this.hitFr=['attack_2','attack_3'];this.swing=-1;}
 think(dt,L,tgt,dx,al){
  if(this.wind>0){this.wind-=dt;if(this.wind<=0){this.swing=.2;SFX.hit();
    if(Math.abs(dx)<62)for(const p of al)if(Math.abs(p.x-(this.x+this.face*40))<40&&Math.abs(p.y-this.y)<40)L.dmgPlayer(p,1,this.x);}}
  else if(this.swing<=0){
   if(Math.abs(dx)<46&&Math.abs(tgt.y-this.y)<50){this.face=dx>0?1:-1;this.wind=this.windT=.55;}
   else if(Math.abs(dx)<260){this.face=dx>0?1:-1;this.x+=this.face*55*dt;}
   else{const d=this.home-this.x;if(Math.abs(d)>8){this.face=d>0?1:-1;this.x+=this.face*30*dt;}}}
 }
}

// Brick thrower: stands back and lobs arcing bricks
class Thrower extends Enemy{
 constructor(o){super(o);this.cd=o.cd!=null?o.cd:1;this.style={shirt:'#3a7ad8',hat:'#ffd23a',scale:1,tool:'brick'};
  this.sheet='hench_thrower';this.windFr=['attack_1','attack_2'];this.hitFr=['attack_3'];this.swing=-1;}
 think(dt,L,tgt,dx){
  this.face=dx>0?1:-1;this.cd-=dt;
  // reach into the sack, raise a brick, then the brick leaves his hand on the release frame
  if(this.cd<=0&&Math.abs(dx)<340){this.cd=2.2;this.wind=this.windT=.42;this.pend=true;}
  if(this.wind>0){this.wind-=dt;if(this.wind<=0&&this.pend){this.pend=false;this.swing=.18;
   L.shots.push({x:this.x+this.face*30,y:this.y-66,vx:this.face*(150+Math.min(Math.abs(dx),300)*.45),vy:-300,life:3,own:0,brick:1});}}
  else this.pend=false;  // a hit cancelled the throw
 }
}

// Base boss: big hit box, health bar, ends the mission when beaten
class Boss extends Enemy{
 constructor(o){super(o);this.boss=1;this.act=true;this.label=o.name||'BOSS';this.labelCol=o.nameColor||'#ffb060';
  this.hw=44;this.shotW=44;this.hh=130;this.knock=60;this.fxY=100;this.popY=150;this.shadowW=44;}
 onHit(dir,fin){this.vx=dir*this.knock*(fin?1.6:1);this.sq=.12;}  // bosses don't flinch
 onDeath(){}
 drawBar(){if(this.dead)return;const bw=240;rrect(W/2-bw/2,H-34,bw,16,6,'#200','#fff',2);ctx.fillStyle='#ff3a3a';ctx.fillRect(W/2-bw/2+3,H-31,(bw-6)*Math.max(0,this.hp/this.maxhp),10);text(this.label,W/2,H-40,13,this.labelCol,'center');}
 draw(L){drawThug(this,L);if(this.x-L.cam>=-120&&this.x-L.cam<=W+120)this.drawBar();}
}

// Papa Johnny: walks in, hammer-slams shockwaves both ways, or charge-dashes
class PapaJohnny extends Boss{
 constructor(o){super(o);this.mode='walk';this.mt=1.5;this.windT=1;this.seed=99;this.style={shirt:'#c8641e',hat:'#f5f5f5',scale:1.9,tool:'hammer',goldTooth:true,mustache:true};
  // sprite art (assets/papa_johnny): walk, slam (raise, swing, IMPACT, recover), tumble (hit, fall, sit dizzy)
  this.sheet='papa_johnny';this.hurtAnim=['tumble_1'];this.defeatAnim=['tumble_2','tumble_3','tumble_4'];this.impactX=85;this.hh=140;this.walkPh=0;this.lastX=this.x;}
 think(dt,L,tgt,dx,al){
  this.mt-=dt;this.face=dx>0?1:-1;
  if(this.mode==='walk'){if(Math.abs(dx)>90)this.x+=this.face*70*dt;if(this.mt<=0){this.mode=Math.random()<.5?'slam':'charge';this.mt=this.mode==='slam'?.9:.8;this.wind=this.mt;this.windT=this.mt;}}
  else if(this.mode==='slam'){if(this.mt<=0){this.mode='walk';this.mt=1.6;this.swing=.3;L.addShake(.6);SFX.smash();const ix=this.hitX();L.dust(ix,L.gy,10);L.spark(ix,L.gy-10,true);L.waves.push({x:ix,y:L.gy,v:-230,life:1.6},{x:ix,y:L.gy,v:230,life:1.6});}}
  else if(this.mode==='charge'){if(this.mt<=0){this.mode='dash';this.mt=.9;this.cdir=this.face;}}
  else if(this.mode==='dash'){this.x+=this.cdir*340*dt;for(const p of al)if(Math.abs(p.x-this.x)<50&&p.y>this.y-90)L.dmgPlayer(p,1,this.x);
   if(this.x<L.minCam+80||this.x>L.ww-60||this.mt<=0){this.mode='walk';this.mt=1.4;}}
  this.x=Math.max(L.minCam+60,Math.min(L.ww-60,this.x));
 }
 // where the hammer hits the ground on the IMPACT frame (shockwaves start here)
 hitX(){return this.x+this.face*(IMG['sheet_'+this.sheet]?this.impactX:0);}
 // pick the sprite frame from the fight state. The slam's IMPACT frame shows on the exact frame the shockwaves spawn.
 frame(){
  if(this.dead){const D=this.defeatAnim;return D[Math.min(D.length-1,Math.floor((this.dead-1)/.9*D.length))];}
  if(this.mode==='slam'||this.mode==='rain')return (1-this.mt/this.windT)<.72?'slam_1':'slam_2';
  if(this.swing>0)return this.swing>.15?'slam_3':'slam_4';
  if(this.hurt>0&&this.mode==='walk')return this.hurtAnim[this.hurt>.1?0:this.hurtAnim.length-1];
  return 'walk_'+(1+Math.floor(this.walkPh)%4);}
 draw(L){if(!IMG['sheet_'+this.sheet]){super.draw(L);return;}
  const x=this.x-L.cam;this.walkPh+=Math.abs(this.x-this.lastX)/22;this.lastX=this.x;
  if(x>-160&&x<W+160){const q=this.sq>0&&!this.dead?this.sq/.12:0,fl=this.hurt>0&&!this.dead&&Math.floor(TIME*30)%2===0;
   if(fl)ctx.filter='brightness(1.9)';
   drawSprite(this.sheet,this.frame(),x,this.y,this.face<0,1,1,1+.06*q,1-.06*q,0);if(fl)ctx.filter='none';
   // telegraph: a red "!" while winding up a slam, rain or charge
   if(this.wind>0&&!this.dead&&Math.floor(TIME*10)%2===0)text('!',x,this.y-this.hh-28,30,'#ff3a3a','center');}
  if(x>=-120&&x<=W+120)this.drawBar();}
}

// Mission 1 mini-boss: Papa Johnny's foreman. Same hammer moves, a bit slower and smaller.
class Foreman extends PapaJohnny{
 constructor(o){super(o);this.style={shirt:'#ff7a1a',hat:'#ffd23a',scale:1.7,tool:'hammer',vest:true};this.hh=125;this.hw=40;this.shotW=40;
  this.sheet='foreman';this.hurtAnim=['recoil_2','recoil_3'];this.defeatAnim=['defeat_1','defeat_2','defeat_3','defeat_4'];this.impactX=62;}
}
// Mini bulldozer: rumbles back and forth, hurts on contact. Takes 4 hits, doesn't flinch much.
class Dozer extends Enemy{
 constructor(o){super(o);this.hp=o.hp||4;this.maxhp=this.hp;this.hw=30;this.shotW=32;this.hh=50;this.knock=40;this.shadowW=34;this.dir=-1;this.range=o.range||140;}
 onHit(dir){this.vx=dir*this.knock;this.sq=.12;}
 think(dt,L,tgt,dx,al){const sp=70;this.x+=this.dir*sp*dt;if(this.x<this.home-this.range)this.dir=1;if(this.x>this.home+this.range)this.dir=-1;this.face=this.dir;
  for(const p of al)if(Math.abs(p.x-this.x)<36&&p.y>this.y-46)L.dmgPlayer(p,1,this.x);}
 draw(L){const x=this.x-L.cam;if(x<-80||x>W+80)return;const q=this.sq>0&&!this.dead?this.sq/.12:0;ctx.save();ctx.translate(x,this.y);ctx.scale(this.face*(1+.1*q),1-.08*q);
  if(this.dead){ctx.globalAlpha=Math.max(0,1.2-this.dead);ctx.rotate(-this.dead*.6);}
  const fl=this.hurt>0;ctx.lineWidth=2.5;ctx.strokeStyle='#150a20';
  ctx.fillStyle='#333';ctx.beginPath();ctx.roundRect(-30,-16,52,16,8);ctx.fill();ctx.stroke();  // tracks
  ctx.fillStyle='#777';for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(-22+i*14,-8,4,0,7);ctx.fill();}
  ctx.fillStyle=fl?'#fff':'#ffc21a';ctx.fillRect(-26,-40,40,24);ctx.strokeRect(-26,-40,40,24);ctx.fillRect(-20,-58,22,18);ctx.strokeRect(-20,-58,22,18);
  ctx.fillStyle='#9ee8ff';ctx.fillRect(-16,-54,14,10);
  ctx.fillStyle=fl?'#fff':'#c9a000';ctx.beginPath();ctx.moveTo(18,-36);ctx.lineTo(34,-40);ctx.lineTo(34,-2);ctx.lineTo(18,-6);ctx.closePath();ctx.fill();ctx.stroke();  // blade
  ctx.fillStyle='#e8b58a';ctx.beginPath();ctx.arc(-9,-64,6,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.arc(-9,-67,7,Math.PI,0);ctx.fill();ctx.stroke();
  ctx.restore();}
}
// Rolling barrel (Crane Yard): rolls toward the agents, hurts on contact; punch it or jump it
class Barrel extends Enemy{
 constructor(o){super(o);this.hp=1;this.hw=14;this.shotW=16;this.hh=28;this.knock=0;this.shadowW=14;this.vx=o.vx||-170;this.act=true;this.rot=0;}
 update(dt,L,al){if(this.dead){this.dead+=dt;return;}this.hurt-=dt;this.x+=this.vx*dt;this.rot+=this.vx*dt/14;
  for(const p of al)if(Math.abs(p.x-this.x)<20&&p.y>this.y-26){L.dmgPlayer(p,1,this.x);}
  if(this.x<L.cam-80||this.x>L.cam+W+300)this.dead=2.3;}
 onHit(){}onDeath(){}
 draw(L){const x=this.x-L.cam;ctx.save();ctx.translate(x,this.y-14);ctx.globalAlpha=this.dead?Math.max(0,1-this.dead*2):1;ctx.rotate(this.rot);ctx.fillStyle='#8a4a1a';ctx.strokeStyle='#150a20';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.arc(0,0,14,0,7);ctx.fill();ctx.stroke();ctx.strokeStyle='#d99a50';ctx.beginPath();ctx.moveTo(-14,0);ctx.lineTo(14,0);ctx.moveTo(0,-14);ctx.lineTo(0,14);ctx.stroke();ctx.restore();}
}
// Crane Yard courier: runs ahead with the stolen blueprints, rolls barrels back. Can't be hurt until cornered at the fence.
class Runner extends Boss{
 constructor(o){super(o);this.style={shirt:'#3a7ad8',hat:'#ffd23a',scale:1.25,tool:'brick',vest:true};this.hp=o.hp||6;this.maxhp=this.hp;this.hh=88;this.hw=24;this.shotW=24;
  this.knock=120;this.invuln=true;this.bcd=2;this.mode='run';this.wallX=o.wallX;
  this.sheet='hench_thrower';this.windFr=['attack_1','attack_2'];this.hitFr=['attack_3'];this.swing=-1;this.big=1.2;this.hurtAnim=null;}
 draw(L){if(IMG['sheet_hench_thrower']){drawHench(this,L);const x=this.x-L.cam;if(x>=-120&&x<=W+120)this.drawBar();}else super.draw(L);}
 think(dt,L,tgt,dx,al){const lead=Math.max(...al.map(p=>p.x));
  if(this.mode==='run'){this.face=1;const want=lead+300,sp=Math.max(40,Math.min(230,(want-this.x)*1.6));this.x=Math.min(this.wallX,this.x+sp*dt);
   this.bcd-=dt;if(this.bcd<=0&&this.x-lead<520){this.bcd=1.8+Math.random()*1.2;this.wind=this.windT=.3;L.enemies.push(makeEnemy({type:'barrel',x:this.x-20,y:L.gy,vx:-170-Math.random()*60}));}
   if(this.x>=this.wallX){this.mode='cornered';this.invuln=false;this.mt=1;L.float(this.x,this.y-140,'CORNERED!','#ffd23a');playStinger('clue');}}
  else{// fights back like a hardhat
   this.face=dx>0?1:-1;if(this.wind>0){this.wind-=dt;if(this.wind<=0){this.swing=.2;SFX.hit();for(const p of al)if(Math.abs(p.x-(this.x+this.face*40))<44&&Math.abs(p.y-this.y)<50)L.dmgPlayer(p,1,this.x);}}
   else if(this.swing<=0){if(Math.abs(dx)<56)this.wind=this.windT=.5;else this.x+=this.face*80*dt;}}
  this.x=Math.min(L.ww-40,this.x);}
 drawBar(){if(this.mode==='run'){text('CATCH THE COURIER!',W/2,H-40,13,'#ffd23a','center');return;}super.drawBar();}
}
// Mission 5: Papa Johnny, full fight in three phases
//  1 (100-60%): hammer slam shockwaves + charge dash
//  2 (60-30%):  adds a brick rain (warning shadows first) and calls two hardhats once
//  3 (<30%):    angry: faster, double shockwaves, sends a mini dozer once
class PapaJohnnyFinal extends PapaJohnny{
 constructor(o){super(o);this.phase=1;this.called2=false;this.called3=false;}
 think(dt,L,tgt,dx,al){const r=this.hp/this.maxhp;
  if(r<=.6&&this.phase<2){this.phase=2;L.float(this.x,this.y-200,'"GET HIM, BOYS!"','#ffb060');}
  if(r<=.3&&this.phase<3){this.phase=3;L.float(this.x,this.y-200,'"NOW I\'M MAD!"','#ff5a5a');L.addShake(.5);}
  if(this.phase>=2&&!this.called2){this.called2=true;for(const s of [-1,1])L.enemies.push(Object.assign(makeEnemy({type:'walker',x:L.cam+W/2+s*300,y:L.gy}),{act:true}));}
  if(this.phase>=3&&!this.called3){this.called3=true;L.enemies.push(Object.assign(makeEnemy({type:'dozer',x:L.cam+W-60,y:L.gy,range:220}),{act:true}));}
  if(this.mode==='walk'&&this.mt<=dt&&this.phase>=2&&Math.random()<.4){this.mode='rain';this.mt=.6;this.wind=.6;this.windT=.6;return;}
  if(this.mode==='rain'){this.mt-=dt;this.face=dx>0?1:-1;if(this.mt<=0){this.mode='walk';this.mt=1.5;
    for(let i=0;i<(this.phase>=3?6:4);i++){const x=Math.max(L.minCam+40,Math.min(L.ww-40,tgt.x+(i-1.5)*90+rand(-30,30)));L.shots.push({x,y:-40-i*60,vx:0,vy:60,life:4,own:0,brick:1,warn:1});}}
   return;}
  const spd=this.phase>=3?1.35:1;super.think(dt*spd,L,tgt,dx,al);
  if(this.phase>=3&&this.swing>.28&&!this.dbl){this.dbl=true;L.waves.push({x:this.x,y:L.gy,v:-330,life:1.3},{x:this.x,y:L.gy,v:330,life:1.3});}
  if(this.swing<=0)this.dbl=false;}
}
const ENEMY_TYPES={walker:Walker,thrower:Thrower,papa_johnny:PapaJohnny,foreman:Foreman,dozer:Dozer,barrel:Barrel,runner:Runner,papa_johnny_final:PapaJohnnyFinal};
function makeEnemy(o){const C=ENEMY_TYPES[o.type];if(!C)throw new Error('Unknown enemy type '+o.type);return new C(o);}

// Henchman sprites (assets/hench_walker, assets/hench_thrower): walk, attack (wind-up frames, then hit frames, then recover),
// hurt (while staggered), ko (knockout, then fade). Idle = hurt_4 (a neutral stand).
function henchFrame(e){
 if(e.dead)return 'ko_'+Math.min(4,1+Math.floor((e.dead-1)/.55*4));
 if(e.wind>0){const p=1-e.wind/(e.windT||.5);return e.windFr[Math.min(e.windFr.length-1,Math.floor(p*e.windFr.length))];}
 if(e.swing>0){const p=1-e.swing/.2;return e.hitFr[Math.min(e.hitFr.length-1,Math.floor(p*e.hitFr.length))];}
 if(e.swing>-.16)return 'attack_4';
 if(e.stagger>0&&!e.boss){const p=1-e.stagger/(e.stag0||.3);return 'hurt_'+Math.min(3,1+Math.floor(p*3));}
 if(e.moving)return 'walk_'+(1+Math.floor(e.walkPh)%4);
 return 'hurt_4';}
function drawHench(e,L){const x=e.x-L.cam;e.walkPh=(e.walkPh||0)+Math.abs(e.x-(e.lastX==null?e.x:e.lastX))/14;e.moving=Math.abs(e.x-(e.lastX==null?e.x:e.lastX))>.3;e.lastX=e.x;
 if(x<-120||x>W+120)return;const q=e.sq>0&&!e.dead?e.sq/.15:0,fl=e.hurt>0&&!e.dead&&Math.floor(TIME*30)%2===0;
 const a=e.dead?Math.max(0,Math.min(1,(2.2-e.dead)/.4)):1;if(a<=0)return;
 if(fl)ctx.filter='brightness(1.9)';drawSprite(e.sheet,henchFrame(e),x,e.y,e.face<0,a,e.big||1,1+.1*q,1-.08*q,0);if(fl)ctx.filter='none';
 if(e.wind>0&&!e.dead&&Math.floor(TIME*12)%2===0)text('!',x,e.y-(e.big?118:100),20,'#ff3a3a','center');}
// Placeholder code-art for hardhat crew (and Papa Johnny scaled up) until real sprites arrive
function drawThug(e,L){const S=e.style,bs=S.scale,x=e.x-L.cam;if(x<-120||x>W+120)return;
 const q=e.sq>0&&!e.dead?e.sq/.15:0;ctx.save();ctx.translate(x,e.y);ctx.scale(e.face*bs*(1-.15*q),bs*(1+.12*q));
 if(e.dead){ctx.rotate(Math.min(e.dead*3,1.5)*-1);ctx.globalAlpha=Math.max(0,1.2-e.dead);}
 const flash=e.hurt>0,wind=e.wind>0&&(Math.floor(TIME*14)%2===0);const walk=Math.sin(TIME*10+e.seed)*3;ctx.lineWidth=2.5;ctx.strokeStyle='#150a20';
 ctx.fillStyle=flash?'#fff':'#35306a';ctx.fillRect(-9,-18,8,18+walk*.3);ctx.fillRect(2,-18,8,18-walk*.3);ctx.strokeRect(-9,-18,8,18+walk*.3);ctx.strokeRect(2,-18,8,18-walk*.3);
 ctx.fillStyle=flash?'#fff':S.shirt;ctx.beginPath();ctx.roundRect(-15,-50,30,34,6);ctx.fill();ctx.stroke();
 ctx.fillStyle='#ffe05a';ctx.fillRect(-15,-38,30,5);
 ctx.fillStyle=flash?'#fff':'#e8b58a';ctx.beginPath();ctx.arc(0,-62,13,0,7);ctx.fill();ctx.stroke();
 ctx.fillStyle='#000';ctx.fillRect(3,-65,3,4);ctx.fillRect(-6,-65,3,4);
 ctx.fillStyle='#2a1408';ctx.fillRect(-7,-57,14,3);if(S.goldTooth){ctx.fillStyle='#ffd23a';ctx.fillRect(1,-54,3,3);}
 ctx.fillStyle=wind?'#ff2a2a':S.hat;ctx.beginPath();ctx.arc(0,-68,14,Math.PI,0);ctx.fill();ctx.stroke();ctx.fillRect(-16,-69,32,4);ctx.strokeRect(-16,-69,32,4);
 ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(-2,-81,4,12);  // hard hat ridge
 if(S.mustache){ctx.fillStyle='#3a2210';ctx.beginPath();ctx.ellipse(0,-55,9,3.5,0,0,7);ctx.fill();}
 if(S.vest){ctx.fillStyle='#d8ff3a';ctx.fillRect(-15,-46,6,26);ctx.fillRect(9,-46,6,26);}
 let ang=-0.5;if(e.wind>0)ang=-2.1;if(e.swing>0)ang=1.2;ctx.save();ctx.translate(12,-40);ctx.rotate(ang);ctx.fillStyle='#e8b58a';ctx.fillRect(0,-4,18,8);ctx.strokeRect(0,-4,18,8);
 if(S.tool==='brick'){ctx.fillStyle='#b23a2a';ctx.fillRect(14,-12,14,10);ctx.strokeRect(14,-12,14,10);}else{ctx.fillStyle='#7a4a1a';ctx.fillRect(14,-3,30,5);ctx.fillStyle='#888';ctx.fillRect(38,-12,16,22);ctx.strokeRect(38,-12,16,22);}
 ctx.restore();ctx.restore();}
