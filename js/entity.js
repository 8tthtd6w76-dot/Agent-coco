// ===== Entity: shared physics for players, enemies and bosses =====
const GRAV=1250;
// Small deterministic hash used for procedural placement and art (0..1)
function hsh(n){const s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);}

class Entity{
 constructor(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.face=1;this.on=false;}
 // Full platformer physics: gravity, ground, one-way platforms. Returns landing speed (0 if no landing).
 platformPhysics(dt,L){
  this.vy+=GRAV*dt*(this.gmul||1);const py=this.y,vy=this.vy;this.x+=this.vx*dt;this.y+=this.vy*dt;
  const was=this.on;this.on=false;
  if(this.y>=L.gy&&!(L.inPit&&L.inPit(this.x))){if(py>L.gy+4){this.x-=this.vx*dt;this.y=Math.max(this.y,py);}else{this.y=L.gy;this.vy=0;this.on=true;}}
  else if(this.vy>=0){for(const pl of L.plats){if(this.x>pl[0]-6&&this.x<pl[0]+pl[2]+6&&py<=pl[1]+3&&this.y>=pl[1]){this.y=pl[1];this.vy=0;this.on=true;break;}}}
  return (!was&&this.on)?vy:0;
 }
 // Simple ground-only physics with horizontal friction (enemies)
 groundPhysics(dt,L,fric=0.88){
  this.vy+=GRAV*dt;this.y=Math.min(L.gy,this.y+this.vy*dt);if(this.y>=L.gy){this.y=L.gy;this.vy=0;}
  this.x+=this.vx*dt;this.vx*=Math.pow(fric,dt*60);
 }
}
