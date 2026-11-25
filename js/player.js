// ===== Players: Agent Coco and Agent Sisi =====
// Per-character stats live here so new agents (or upgrades) are data, not code.
//
// ANIMATIONS: each animation is a list of frame names from the sprite sheet (assets/<char>/sheet.json).
// Frames that don't exist yet are skipped, so new art drops straight in: add e.g. 'punch_2', 'idle_3'
// or 'jump_2' to the sheet, list it here, and it plays. Missing everything falls back to idle_1.
//  fps: frames per second for looping anims; attacks and flips play once across their duration.
// combo: animation names for hits 1, 2, 3 of the chain (hit 3 is the finisher).
const CHARS={
 agent_coco:{label:'COCO',speed:155,jump:-545,doubleJump:-430,hang:.5,fallMul:1.2,tag:'#7ff',ring:'#2de2f5',beam:'#2de2f5',flipFx:'#7ff',
  atk:.18,atkFinisher:.26,atkWarmup:.03,lunge:95,lungeFinisher:175,
  anims:{idle:{f:['idle_1','idle_2'],fps:2.5},run:{f:['run_1','run_2','run_3','run_4'],fps:12},
   jump:{f:['jump','jump_1','jump_2']},fall:{f:['fall']},crouch:{f:['crouch']},
   // watch beam: aim, charge, FIRE (held), wink. Shot leaves at gadget.fireAt seconds.
   beam:{f:['beam_1','beam_2','beam_3','beam_3','beam_3','beam_4','beam_4']},
   // shadowboxing set: guard -> jab, jab, chamber -> big kick
   punch:{f:['box_1','box_2','box_2','box_2']},punch2:{f:['box_2']},kick:{f:['box_3','box_4','box_4','box_4']},
   // double jump somersault: launch crouch, tuck, upside-down, tuck; then the landing pose (with dust puffs) on touchdown
   flip:{f:['somer_1','somer_2','somer_2','somer_3','somer_3','somer_3','somer_2']},land2:{f:['somer_4']},
   // victory dance: cheer, point, arms crossed, hands-behind-head grin
   dance:{f:['dance_1','dance_2','dance_3','dance_4'],fps:2.2}},
  combo:['punch','punch2','kick'],gadget:{dur:.38,fireAt:.1,slow:.35},muzzle:[22,49]},
 agent_sisi:{label:'SISI',speed:175,jump:-470,doubleJump:-420,hang:.65,fallMul:1.1,tag:'#ff9ae0',ring:'#ff5ae0',beam:'#ff5ae0',flipFx:'#ff9ae0',
  atk:.24,atkFinisher:.34,atkWarmup:.05,lunge:70,lungeFinisher:140,
  anims:{idle:{f:['idle_1','idle_2'],fps:2.5},run:{f:['run_1','run_2','run_3','run_4'],fps:11},
   jump:{f:['jump']},fall:{f:['fall']},crouch:{f:['crouch']},
   // watch beam: aim, charge, FIRE, wink
   beam:{f:['sbeam_1','sbeam_2','sbeam_3','sbeam_3','sbeam_3','sbeam_4','sbeam_4']},
   // karate set: guard -> jab, knee, big kick
   jab:{f:['skarate_1','skarate_2','skarate_2','skarate_2']},knee:{f:['skarate_3']},skick:{f:['skarate_3','skarate_4','skarate_4','skarate_4']},
   // forward flip double jump (crouch, tuck, upside-down) and its landing pose with dust puffs
   flip:{f:['sflip_1','sflip_2','sflip_2','sflip_3','sflip_3','sflip_3','sflip_2']},land2:{f:['sflip_4']},
   // cartwheel dodge: lean, hand down, handstand, land
   dash:{f:['scartwheel_1','scartwheel_2','scartwheel_3','scartwheel_3','scartwheel_2','scartwheel_4']},
   dance:{f:['sdance_1','sdance_2','sdance_3','sdance_4'],fps:2.4}},
  combo:['jab','knee','skick'],gadget:{dur:.36,fireAt:.1,slow:.4},muzzle:[14,43],
  dashDur:.42,dashSpeed:330}  // cartwheel dodge (Down): fast, can't be hit
};
// Shared feel tuning (seconds unless noted). Per-character values above override atk/lunge timing.
const FEEL={coyote:.1,jumpBuffer:.12,attackBuffer:.16,comboWindow:.35,stun:.24,hitstop:.05,hitstopFinisher:.09,hitstopHurt:.07};
// Resolve an animation to the frames that actually exist on this character's sheet (cached)
const _animCache={};
function animFrames(ch,name){const k=ch+'/'+name;if(_animCache[k])return _animCache[k];
 const A=CHARS[ch].anims[name],have=SHEETS[ch].frames;let f=A?A.f.filter(n=>have[n]):[];
 if(!f.length&&have[name])f=[name];if(!f.length)f=['idle_1'];return _animCache[k]=f;}
const loopFrame=(ch,name,t)=>{const f=animFrames(ch,name),A=CHARS[ch].anims[name];return f[Math.floor(t*((A&&A.fps)||8))%f.length];};
const onceFrame=(ch,name,p)=>{const f=animFrames(ch,name);return f[Math.min(f.length-1,Math.floor(p*f.length))];};

class Player extends Entity{
 constructor(i,L){
  const sp=L.def.spawn||{x:120,gap:50};
  super(sp.x+i*sp.gap,L.gy);
  // P1 / P2 agents come from the character select screen (charselect.js)
  this.i=i;this.ch=i?p2Char():p1Char();this.C=CHARS[this.ch];
  this.maxhp=cheatOn('pizzaparty')?8:5;this.hp=this.maxhp;this.on=true;this.atk=0;this.atkDur=this.C.atk;this.atkHit=null;this.atkN=0;this.gadCd=0;this.inv=0;
  this.down=false;this.resp=0;this.jumps=0;this.anim=0;this.jumpHeld=false;this.air2=0;
  this.gad=0;this.gadFired=true;this.landT=0;this.didFlip=false;this.dash=0;this.dashCd=0;this.coyote=0;this.jbuf=0;this.abuf=0;this.combo=0;this.comboT=9;this.stun=0;this.sqT=0;this.sqA=0;this.stT=0;this.gmul=1;
 }
 update(dt,L){
  const I=INPUT[this.i],C=this.C;
  if(this.down){this.resp-=dt;const al=L.alive();
   if(this.resp<=0&&al.length){const o=al[0];this.down=false;this.hp=3;this.x=o.x;this.y=o.y-60;this.vy=0;this.inv=2;L.float(this.x,this.y-90,'BACK IN!','#9fb');}
   return;}
  // grapple zip in progress: fly to the ledge, then land on it
  if(this.grap){const g=this.grap;g.t+=dt/.35;const k=Math.min(1,g.t);this.x=g.x0+(g.x1-g.x0)*k;this.y=g.y0+(g.y1-g.y0)*k-Math.sin(k*Math.PI)*30;
   if(k>=1){this.grap=null;this.y=g.y1;this.vy=0;this.on=true;this.jumps=0;}this.anim+=dt;return;}
  const wasAtk=this.atk>0;
  this.inv-=dt;this.gadCd-=dt;this.atk-=dt;this.stun-=dt;this.coyote-=dt;this.jbuf-=dt;this.abuf-=dt;this.comboT+=dt;this.sqT-=dt;this.stT-=dt;this.gad-=dt;this.landT-=dt;this.dash-=dt;this.dashCd-=dt;
  if(wasAtk&&this.atk<=0)this.comboT=0;
  const dir=(I.right?1:0)-(I.left?1:0);
  if(this.dash>0)this.vx=this.face*C.dashSpeed;           // cartwheeling
  else if(this.stun>0)this.vx*=Math.pow(.08,dt);          // knocked back: glide, no steering
  else if(this.atk<=0){const sp=C.speed*(this.gad>0?C.gadget.slow:1)*(cheatOn('turbo')?1.3:1)*(skatesOn(this)?(gadgetQ('skates')>=2?1.2:1.15):1)*(typeof rideMul==='function'?rideMul(this,L):1);this.vx+=((dir*sp)-this.vx)*Math.min(1,dt*14);if(dir&&this.gad<=0)this.face=dir;}
  else this.vx*=Math.pow(.88,dt*60);
  // jump: buffered press + coyote time; Sisi gets a double jump in the air
  const jp=I.jump&&!this.jumpHeld;if(jp)this.jbuf=FEEL.jumpBuffer;
  if(this.jbuf>0&&this.stun<=0){
   if(this.on||this.coyote>0){this.dash=0;this.vy=C.jump;this.on=false;this.jumps=1;this.jbuf=0;this.coyote=0;this.stT=.18;SFX.jump();L.dust(this.x,this.y,4);}
   else if(jp&&C.doubleJump&&this.jumps<2){this.vy=C.doubleJump;this.jumps=2;this.air2=.45;this.didFlip=true;this.jbuf=0;SFX.jump2();L.burst(this.x,this.y,C.flipFx,5);}}
  this.jumpHeld=I.jump;
  if(I.jump===false&&this.vy<-200)this.vy=-200;
  // floaty apex while jump is held, snappier fall: makes jumps "pop"
  this.gmul=(!this.on&&I.jump&&Math.abs(this.vy)<140)?C.hang:(this.vy>0?C.fallMul:1);
  if(cheatOn('moonjump'))this.gmul*=.5;if(skatesOn(this)){this.gmul*=.85;
   // Hover Skates glide: hold jump while falling
   if(I.jump&&this.vy>0&&!this.on){const cap=[150,110,80][hasPassive(this,'skates')?gadgetQ('skates'):0];if(this.vy>cap)this.vy=cap;}}
  // attack: buffered, 3-hit combo chain (hit 3 = finisher)
  // cartwheel dodge: tap Down on the ground (Sisi). Passes through hits and bricks.
  if(C.anims.dash&&pressed(this.i,'down')&&this.on&&this.dash<=0&&this.dashCd<=0&&this.stun<=0&&this.atk<=0&&this.gad<=0){
   if(dir)this.face=dir;this.dash=C.dashDur;this.dashCd=C.dashDur+.3;this.dodged=0;SFX.whoosh();L.dust(this.x,this.y,4);}
  if(pressed(this.i,'attack'))this.abuf=FEEL.attackBuffer;
  if(this.abuf>0&&this.atk<=0&&this.stun<=0&&this.dash<=0){this.abuf=0;
   if(this.comboT>FEEL.comboWindow)this.combo=0;this.combo=this.combo%3+1;
   const fin=this.combo===3;this.atkDur=fin?C.atkFinisher:C.atk;this.atk=this.atkDur;this.atkHit=new Set();this.atkN++;
   if(dir)this.face=dir;this.vx=this.face*(fin?C.lungeFinisher:C.lunge);fin?SFX.whoosh():SFX.swipe();}
  // Down + Gadget: use the equipped gadget. Up + Gadget or Select/Back: swap gadget slots. (cancels a cartwheel that just started)
  if(pressed(this.i,'gadget')&&I.down&&this.stun<=0&&this.atk<=0&&L.gch){if(this.dash>this.C.dashDur-.2)this.dash=0;if(this.dash<=0)useGadget(this,L);}
  else if(L.gch&&((pressed(this.i,'gadget')&&I.up)||pressed(this.i,'back')))swapGadget(this,L);
  else if(pressed(this.i,'gadget')&&this.gadCd<=0&&this.stun<=0&&this.atk<=0&&this.dash<=0){this.gadCd=.7;this.gad=C.gadget.dur;this.gadFired=false;}
  if(!this.gadFired&&(this.stun>0||this.atk>0))this.gadFired=true;  // interrupted
  if(!this.gadFired&&C.gadget.dur-this.gad>=C.gadget.fireAt){this.gadFired=true;
   const mega=cheatOn('megabeam');L.shots.push({x:this.x+this.face*C.muzzle[0],y:this.y-C.muzzle[1],vx:this.face*(mega?520:420),life:mega?1.3:1.1,own:1,col:C.beam,big:mega,hit:mega?new Set():null});if(mega)L.addShake(.15);SFX.gadget();L.spark(this.x+this.face*(C.muzzle[0]+4),this.y-C.muzzle[1],false);}
  // melee hitbox in front of the player (active after a short wind-up)
  if(this.atk>0&&this.atk<this.atkDur-C.atkWarmup){const fin=this.combo===3,w=fin?46:36,sides=fin&&cheatOn('tornado')?[1,-1]:[1];
   for(const e of L.enemies){if(e.dead||this.atkHit.has(e))continue;
    const sd=sides.find(sg=>Math.abs(e.x-(this.x+sg*this.face*(fin?38:34)))<w/2+e.hw);
    if(sd&&e.y-e.hh<this.y-10&&e.y>this.y-80){this.atkHit.add(e);L.hurtEnemy(e,fin?2:1,sd*this.face,fin);
     L.spark(e.x-this.face*Math.min(e.hw,22),this.y-(fin?42:52),fin);
     L.hitstop=Math.max(L.hitstop,fin?FEEL.hitstopFinisher:FEEL.hitstop);}}}
  const land=this.platformPhysics(dt,L);this.air2-=dt;
  if(this.on){this.jumps=0;this.coyote=FEEL.coyote;}
  if(land&&this.didFlip){this.didFlip=false;if(this.C.anims.land2){this.landT=.2;SFX.land();}}
  if(this.on)this.didFlip=false;
  if(land>220){this.sqA=Math.min(1,land/650);this.sqT=.16;L.dust(this.x,this.y,3+Math.round(this.sqA*5));if(this.sqA>.6)SFX.land();}
  this.x=Math.max(L.minCam+20,Math.min(L.ww-20,this.x));this.anim+=dt;
  for(const it of L.items){if(it.got)continue;if(Math.abs(it.x-this.x)<26&&Math.abs(it.y-(this.y-40))<46){it.got=true;L.collect(this,it);}}
 }
 // which frame to show right now
 frameName(){const ch=this.ch;
  if(this.down)return loopFrame(ch,'crouch',this.anim);
  if(this.celebrate&&this.on)return loopFrame(ch,'dance',TIME);
  if(this.atk>0){const a=this.C.combo[this.combo-1]||this.C.combo[0];return onceFrame(ch,a,1-this.atk/this.atkDur);}
  if(this.dash>0)return onceFrame(ch,'dash',1-this.dash/this.C.dashDur);
  if(this.landT>0&&this.on&&this.C.anims.land2)return onceFrame(ch,'land2',0);
  if(this.gad>0)return onceFrame(ch,'beam',1-this.gad/this.C.gadget.dur);
  if(!this.on){if(this.C.doubleJump&&this.air2>0)return onceFrame(ch,'flip',(.45-this.air2)/.45);
   return this.vy<0?onceFrame(ch,'jump',Math.min(.99,(this.vy-this.C.jump)/-this.C.jump)):loopFrame(ch,'fall',this.anim);}
  if(Math.abs(this.vx)>25)return loopFrame(ch,'run',this.anim);
  return loopFrame(ch,'idle',TIME+this.i*.3);
 }
 // pose: [scaleX, scaleY, rotation, yOffset]. Squash on land, stretch on takeoff, bouncy run, idle bob, attack pop.
 pose(){
  if(this.down||this.dash>0)return [1,1,0,0];
  if(this.celebrate&&this.on)return danceHop(this.ch,TIME);
  if(this.sqT>0){const k=this.sqT/.16*this.sqA;return [1+.28*k,1-.3*k,0,0];}
  if(this.atk>0){const p=1-this.atk/this.atkDur,k=Math.sin(Math.PI*Math.min(1,p*1.6));
   if(this.combo===3&&cheatOn('tornado'))return [Math.cos(p*Math.PI*6),1,0,-k*12];
   return this.combo===3?[1+.14*k,1-.08*k,this.face*.12*k,0]:[1+.1*k,1-.05*k,this.face*.07*k,0];}
  if(!this.on){if(this.stT>0){const k=this.stT/.18;return [1-.16*k,1+.2*k,0,0];}
   if(this.vy<-120)return [.94,1.08,this.face*.04,0];if(this.vy>200)return [.96,1.05,this.face*.03,0];return [1.03,.98,0,0];}
  if(Math.abs(this.vx)>25){const ph=this.anim*this.C.anims.run.fps*Math.PI/2,b=Math.abs(Math.sin(ph));
   return [1+.03*(1-b),1-.03*(1-b)+.03*b,this.vx/this.C.speed*.07,-b*4];}
  const b=Math.sin(TIME*3.2+this.i*1.7);return [1-.02*b,1+.04*b,0,-Math.max(0,b)*1.5];
 }
 drawShadow(L){const air=Math.max(0,Math.min(1,(L.gy-this.y)/220));ctx.fillStyle='rgba(0,0,0,'+(.3-.15*air)+')';ctx.beginPath();ctx.ellipse(this.x-L.cam,L.gy+2,18*(1-.4*air),5,0,0,7);ctx.fill();}
 // swoosh trails so attacks read clearly even with placeholder frames
 drawSwoosh(L){if(this.atk<=0)return;const p=1-this.atk/this.atkDur;if(p<.1||p>.85)return;
  const x=this.x-L.cam,f=this.face,a=1-Math.abs(p-.45)*2,fin=this.combo===3;
  ctx.save();ctx.globalAlpha=Math.max(0,a)*.85;ctx.lineCap='round';
  if(fin||/kick|knee/.test(this.C.combo[this.combo-1])){ctx.strokeStyle=fin?'#ffd23a':'#fff';ctx.lineWidth=fin?7:5;ctx.beginPath();
   const cy=this.y-(fin?44:40),r=fin?40:32;if(f>0)ctx.arc(x+10,cy,r,-1.1,.9*p+.2);else ctx.arc(x-10,cy,r,Math.PI-(.9*p+.2),Math.PI+1.1);ctx.stroke();}
  else{ctx.strokeStyle='#fff';ctx.lineWidth=3;for(let k=0;k<3;k++){const yy=this.y-58+k*7,x0=x+f*(14+k*3),len=18+p*14-k*4;ctx.beginPath();ctx.moveTo(x0,yy);ctx.lineTo(x0+f*len,yy);ctx.stroke();}}
  ctx.restore();}
 draw(L){const x=this.x-L.cam;
  this.drawShadow(L);
  const fr=this.frameName();
  const blink=this.inv>0&&Math.floor(TIME*20)%2===0;if(blink&&!this.down)return;
  const [sx,sy,rot,oy]=this.pose();
  const of=outfitFilter(this.ch);if(of)ctx.filter=of;
  if(skatesOn(this)&&!this.down){ctx.fillStyle='#2de2f5';ctx.globalAlpha=.6+.3*Math.sin(TIME*20);ctx.fillRect(x-14,this.y-3+oy,28,4);ctx.globalAlpha=1;}
  drawSprite(this.ch,fr,x,this.y+oy,this.face<0,this.down?.45:1,1,sx,sy,rot);if(of)ctx.filter='none';
  this.drawSwoosh(L);
  if(this.down){text('P'+(this.i+1)+' DOWN',x,this.y-70,12,'#ff5a8a','center');text(Math.ceil(this.resp)+'',x,this.y-54,14,'#fff','center');}
  else text('P'+(this.i+1),x,this.y-112,11,this.C.tag,'center');
 }
 drawHud(){const x=this.i?W-180:10;
  rrect(x-4,6,174,46,10,'rgba(6,20,36,.75)',this.C.ring,2);
  const f=IMG['faces/'+this.ch+'_'+(this.hp<=2?'surprised':'determined')];if(f)ctx.drawImage(f,x,10,38,38);
  const hs=this.maxhp>5?14:22;for(let h=0;h<this.maxhp;h++)heart(x+56+h*hs,30,h<this.hp);
  text(this.C.label,x+46,22,11,'#fff','left',null);
 }
}
function heart(x,y,full){ctx.fillStyle=full?'#ff3a5c':'#3a1a40';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y+4);ctx.bezierCurveTo(x-9,y-4,x-3,y-10,x,y-4);ctx.bezierCurveTo(x+3,y-10,x+9,y-4,x,y+4);ctx.fill();ctx.stroke();}
// little hop on the beat for the victory dance (shared by the level end and the results screen)
function danceHop(ch,t){const fps=CHARS[ch].anims.dance.fps||3,ph=(t*fps)%1,b=Math.sin(Math.PI*ph);
 return [1+.05*(1-b),1-.05*(1-b)+.04*b,0,-b*7];}
