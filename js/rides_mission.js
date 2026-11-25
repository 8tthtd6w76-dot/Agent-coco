// ===== Drivable rides in side-scroll missions (v0.23) =====
// Pick a ride in the Watch > Garage tab (Enter) and press ATTACK there to turn "Ride in missions" on.
// Riding: faster, and running into a crew member rams them. You hop off for boss fights. Ride art is code-drawn
// until side-view ride strips exist.
const RIDE_MISSION={bike:{mul:1.32,ram:1},scooter:{mul:1.42,ram:1},agent_bike:{mul:1.62,ram:2}};
function mountOf(p,L){if(!SAVE.rideMissions||!L||L.bossLock||p.down)return null;const id=SAVE.ride;return RIDE_MISSION[id]&&rideOwned(id)?id:null;}
function rideMul(p,L){const m=mountOf(p,L);return m?RIDE_MISSION[m].mul:1;}
(function(){
 const up=Player.prototype.update,dr=Player.prototype.draw;
 Player.prototype.update=function(dt,L){
  const was=this._mount||null,m=mountOf(this,L);
  if(m&&was!==m&&L.state==='play'){L.float(this.x,this.y-90,'ON THE '+(RIDES.find(r=>r.id===m)||{n:m}).n.toUpperCase()+'!','#ffd23a');}
  if(!m&&was&&L.bossLock&&!this._offMsg){this._offMsg=1;L.float(this.x,this.y-90,'HOP OFF!','#9fb');}
  this._mount=m;
  up.call(this,dt,L);
  if(!m)return;
  this._wheel=(this._wheel||0)+this.vx*dt/7;
  const r=RIDE_MISSION[m];this._ramCd=Math.max(0,(this._ramCd||0)-dt);
  if(Math.abs(this.vx)>this.C.speed*1.15&&this._ramCd<=0&&this.atk<=0){
   for(const e of L.enemies){if(e.dead||e.boss)continue;const dx=e.x-this.x;
    if(Math.abs(dx)<30&&e.y-e.hh<this.y-10&&e.y>this.y-80&&Math.sign(dx||1)===Math.sign(this.vx)){L.hurtEnemy(e,r.ram,Math.sign(this.vx),false);this._ramCd=.6;L.addShake&&L.addShake(.25);SFX.hit();L.burst(e.x,e.y-30,'#fff',6);break;}}}};
 Player.prototype.draw=function(L){
  const m=this._mount;
  if(m&&!this.down){const x=this.x-L.cam,y=this.y,col=(RIDES.find(r=>r.id===m)||{col:'#2a3a8a'}).col,f=this.face,w=this._wheel||0;
   ctx.save();
   for(const dx of[-17,17]){ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+dx,y-9,9,0,7);ctx.fill();ctx.strokeStyle='#bbb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+dx+Math.cos(w)*7,y-9+Math.sin(w)*7);ctx.lineTo(x+dx-Math.cos(w)*7,y-9-Math.sin(w)*7);ctx.stroke();}
   ctx.fillStyle=col;ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.rect(x-22,y-19,44,7);ctx.fill();ctx.stroke();
   ctx.strokeStyle='#000';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(x+f*17,y-14);ctx.lineTo(x+f*14,y-38);ctx.lineTo(x+f*23,y-40);ctx.stroke();
   ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();ctx.restore();}
  if(m&&!this.down){const oy=this.y;this.y-=17;dr.call(this,L);this.y=oy;}else dr.call(this,L);};
 // Garage: ATTACK toggles "Ride in missions"
 const wu=Watch.update,wd=Watch.draw;
 Watch.update=function(){if(this.tab===7&&anyPressed('attack')){SAVE.rideMissions=!SAVE.rideMissions;save();SFX.ok();}return wu.apply(this,arguments);};
 Watch.draw=function(){wd.apply(this,arguments);if(this.tab===7){const on=!!SAVE.rideMissions;rrect(150,376,340,22,10,'rgba(6,20,36,.92)',on?'#59d96b':'#ffd23a',2);text('Attack: ride in missions is '+(on?'ON':'OFF'),W/2,392,13,on?'#9fe8ac':'#ffe9a0','center',null);}};
})();
