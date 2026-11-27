// ===== Lair Defense drawing (v0.47): map (painted once into a canvas), goons, units, shots, HUD, build menus =====
const LD_BG={};
function ldBgCanvas(G){const M=G.map;if(LD_BG[M.id])return LD_BG[M.id];const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d'),r=ldRng(77+M.id);
 const pic=M.img&&IMG[M.img];if(pic&&pic.width){x.drawImage(pic,0,0,W,H);LD_BG[M.id]=c;return c;}  // Michael's painted map
 const T={alley:['#2b2638','#3a3348','#57483e','#6e5a4a'],roof:['#4a4f5c','#5a6070','#8a7a62','#a89474'],lair:['#5a3c22','#6e4a2a','#a8794a','#c79a62']}[M.theme];
 x.fillStyle=T[0];x.fillRect(0,0,W,H);
 if(M.theme==='alley'){for(let yy=0;yy<H;yy+=14)for(let xx=(yy/14%2)*14;xx<W;xx+=28){x.fillStyle=r()<.5?T[0]:T[1];x.fillRect(xx,yy,27,13);}}
 else if(M.theme==='roof'){for(let i=0;i<2600;i++){x.fillStyle=r()<.5?T[1]:'#40444f';x.fillRect(r()*W,r()*H,2,2);}}
 else{for(let yy=0;yy<H;yy+=24){x.fillStyle=(yy/24)%2?T[0]:T[1];x.fillRect(0,yy,W,23);for(let k=0;k<4;k++){x.fillStyle='rgba(0,0,0,.25)';x.fillRect(r()*W,yy,2,23);}}
  x.fillStyle='#8a2a3a';x.globalAlpha=.6;x.beginPath();x.ellipse(200,330,90,50,0,0,7);x.fill();x.globalAlpha=1;}
 // props (3/4 boxes) off the path
 const near=(px,py)=>Math.min(...G.paths.map(P=>ldNearS(P,px,py)[1]));
 const props={alley:[['#2e6a3a','#1e4a2a'],['#6a6a72','#4a4a52'],['#c8a46a','#9a7a4a']],roof:[['#b8bcc4','#8a8e96'],['#d8d8d8','#a0a0a0'],['#3a6a3a','#2a4a2a']],lair:[['#8a5a32','#5a3a1a'],['#2a3a5a','#1a2238'],['#c0c8d0','#8a9098']]}[M.theme];
 for(let i=0;i<46;i++){const px=20+r()*(W-40),py=LD_HUD+20+r()*(LD_BAR-LD_HUD-30),w=18+r()*26,h=12+r()*14;if(near(px,py)<44||G.pads.some(p=>Math.hypot(p.x-px,p.y-py)<36))continue;
  const [a,b]=props[Math.floor(r()*props.length)];x.fillStyle='rgba(0,0,0,.3)';x.fillRect(px-w/2+3,py-h/2+4,w,h+6);x.fillStyle=b;x.fillRect(px-w/2,py-h/2+6,w,h);x.fillStyle=a;x.fillRect(px-w/2,py-h/2,w,h*.7);x.strokeStyle='#000';x.lineWidth=1.5;x.strokeRect(px-w/2,py-h/2,w,h+6);}
 // path
 for(const P of G.paths){x.lineJoin='round';x.lineCap='round';x.strokeStyle='rgba(0,0,0,.55)';x.lineWidth=42;x.beginPath();P.pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]+3):x.moveTo(p[0],p[1]+3));x.stroke();
  x.strokeStyle=T[2];x.lineWidth=36;x.beginPath();P.pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();
  x.strokeStyle=T[3];x.lineWidth=26;x.setLineDash([10,8]);x.beginPath();P.pts.forEach((p,i)=>i?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke();x.setLineDash([]);}
 // pads
 for(const p of G.pads){x.fillStyle='rgba(0,0,0,.4)';x.beginPath();x.ellipse(p.x,p.y+4,19,11,0,0,7);x.fill();x.fillStyle='#55606e';x.beginPath();x.ellipse(p.x,p.y,19,11,0,0,7);x.fill();
  x.strokeStyle='#2de2f5';x.lineWidth=2;x.beginPath();x.ellipse(p.x,p.y,15,8,0,0,7);x.stroke();x.strokeStyle='#000';x.lineWidth=1.5;x.beginPath();x.ellipse(p.x,p.y,19,11,0,0,7);x.stroke();}
 // entrance markers
 for(const P of G.paths){const [sx,sy]=P.pts[0];x.fillStyle='#6a2a8a';x.beginPath();x.arc(Math.max(14,Math.min(W-14,sx)),Math.max(LD_HUD+12,Math.min(H-40,sy)),12,0,7);x.fill();x.strokeStyle='#ffd23a';x.lineWidth=2;x.stroke();}
 LD_BG[M.id]=c;return c;}
function ldDrawEnd(G){const e=G.end,t=G.map.end;const painted=G.map.img&&IMG[G.map.img]&&IMG[G.map.img].width;
 if(ldDrawFortArt(G))return;
 if(painted){if(t==='core'){const g=.6+.4*Math.sin(G.t*3);ctx.fillStyle=`rgba(45,226,245,${.3*g})`;ctx.beginPath();ctx.arc(e.x+5,e.y-10,22,0,7);ctx.fill();ctx.fillStyle='#bff';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x+5,e.y-12,10,0,7);ctx.fill();ctx.stroke();
   if(G.shield>0){ctx.strokeStyle='rgba(127,255,255,.8)';ctx.beginPath();ctx.arc(e.x+5,e.y-10,26,0,7);ctx.stroke();}}
  else if(G.shield>0){ctx.strokeStyle='rgba(127,255,255,.7)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y-10,20,0,7);ctx.stroke();}
  if(ldUnlocked(LD_SPECIALS[4])&&!G.butt){const p=G.perch;if(SHEETS.agent_coco)drawSprite('agent_coco','idle_1',p.x,p.y,p.x>W/2,1,.32);}return;}
 if(t==='ladder'){ctx.fillStyle='#8a8e96';ctx.fillRect(e.x-14,e.y-34,4,40);ctx.fillRect(e.x+10,e.y-34,4,40);for(let i=0;i<5;i++)ctx.fillRect(e.x-12,e.y-30+i*8,24,3);}
 if(t==='door'){rrect(e.x-16,e.y-36,32,40,4,'#7a4a22','#000',2);ctx.fillStyle='#ffd23a';ctx.fillRect(e.x+8,e.y-18,4,4);}
 // Sandy's core (always at the end: the Lair's health)
 const cx=t==='core'?e.x:e.x+(e.x>W/2?-34:34),cy=t==='core'?e.y:e.y-6;rrect(cx-14,cy-6,28,14,5,'#2a3a4a','#000',2);
 const g=.6+.4*Math.sin(G.t*3);ctx.fillStyle=`rgba(45,226,245,${.25*g})`;ctx.beginPath();ctx.arc(cx,cy-14,18,0,7);ctx.fill();ctx.fillStyle='#bff';ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy-14,9,0,7);ctx.fill();ctx.stroke();
 if(G.shield>0){ctx.strokeStyle='rgba(127,255,255,.8)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy-12,22,0,7);ctx.stroke();}
 // Coco's perch (Butt Bomb launch spot)
 if(ldUnlocked(LD_SPECIALS[4])&&!G.butt){const p=G.perch;rrect(p.x-12,p.y-4,24,10,3,'#7a5a3a','#000',1.5);if(SHEETS.agent_coco)drawSprite('agent_coco','idle_1',p.x,p.y-2,p.x>W/2,1,.32);}}
// Michael's fortress + core sheets: core (damage states by Lair health, shield bubble by Core Shield level), door, walls, skylight, lookout tower.
function ldCoreFrame(G){const f=G.hp/G.hpMax;if(G.shield>0)return 8+Math.max(1,Math.min(3,G.fort.shield||1));
 if(G.hit>0&&Math.sin(G.t*40)>0)return 5;return f>.75?Math.floor(G.t*3)%4:f>.5?5:f>.25?6:7;}
function ldDrawFortArt(G){if(!(G.map.img&&IMG[G.map.img]&&IMG[G.map.img].width&&IMG['ld/core']&&IMG['ld/core'].width&&IMG['ld/fortress']&&IMG['ld/fortress'].width))return false;
 const e=G.end,t=G.map.end,F=G.fort,P=G.paths[0],side=e.x>W/2?-1:1;
 if(G.map.skylight){const sp=G.paths[1].pts[0],lv=F.shutter||0;ldStrip('fortress',lv>=3?8:lv>=1?7:6,sp[0],sp[1]+10,.34);}
 if(F.lookout){const p=G.perch;ldStrip('fortress',8+F.lookout,p.x+(p.x>W/2?-34:34),p.y+18,.42);}
 if(F.walls){const [wx,wy]=ldAt(P,P.len-58);ldStrip('fortress',2+F.walls,wx,wy+16,.3);}
 const cx=t==='core'?e.x+5:e.x+side*34,cy=t==='core'?e.y+14:e.y+10;
 if(F.door&&t!=='core')ldStrip('fortress',F.door-1,e.x,e.y+12,.34);
 ldStrip('core',ldCoreFrame(G),cx,cy,t==='core'?.42:.32);
 if(ldUnlocked(LD_SPECIALS[4])&&!G.butt){const p=G.perch;if(SHEETS.agent_coco)drawSprite('agent_coco','idle_1',p.x,p.y,p.x>W/2,1,.32);}
 return true;}
// Workshop row pictures (false = keep the coloured dot)
function ldRowArt(r,x,y){const L=r.lvl||0;
 if(r.F){const id=r.F.id,m={door:0,walls:3,shutter:6,lookout:9}[id];if(m!=null)return ldStrip('fortress',m+Math.max(0,L-1),x,y+15,.25);
  if(id==='shield')return ldStrip('core',L?8+L:0,x,y+15,.25);if(id==='repair'||id==='plating')return ldStrip('core',0,x,y+15,.25);return false;}
 if(r.U){const TA=LD_TOWER_ART[r.U.id];if(TA)return ldStrip(TA[0],TA[1],x,y+16,.26);
  const AG={coco:0,sisi:4,sandy:8,barro:12}[r.U.id];if(AG!=null)return ldStrip('agents',AG,x,y+16,.26);
  if(r.U.id==='hover'||r.U.id==='swarm')return ldStripC('heads',12,x,y,.3);}
 return false;}
// 4-direction sheets: foe art -> [strip, scale, only first 2 columns]
const LD_DIR4={brute:['brute',.32],meatball:['runner',.27],chute:['runner',.27],cart:['cart',.34],lefty:['lefty',.27],flyer:['hoverboard',.3],sneak:['hoodie',.28,1],techie:['dronepack',.29],baldey:['baldey',.36]};
function ldDrawFoe(G,e){const F=e.F,x=e.x,y=e.y-(e.air?22:0),fl=Math.cos(e.a)<0,wk=Math.floor(e.t*8)%4,s=F.boss?1.8:F.big?1.25:1;
 if(e.fall>0){const k=e.fall;const yy=y-k*90;ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-12,yy-22);ctx.lineTo(x,yy);ctx.lineTo(x+12,yy-22);ctx.stroke();ctx.fillStyle='#ff5ae0';ctx.beginPath();ctx.arc(x,yy-26,15,Math.PI,0);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();
  if(!(typeof abqDraw==='function'&&abqDraw('stooge_meatball',16,x,yy+12,.18)))ldThug(x,yy,'#6a3a9a',fl,0,1);return;}
 ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(e.x,e.y+2,10*s,4*s,0,0,7);ctx.fill();
 const sneakA=F.sneak&&e.reveal<=0?.35:1,a=e.hit>0?.6:sneakA;ctx.save();ctx.globalAlpha=a;
 if(e.frz>0){ctx.filter='hue-rotate(160deg) brightness(1.3)';}
 const A=F.art;let done=false;
 if(e.dead&&!e.reached){const k=Math.min(3,Math.floor(e.deadT*6));
  if(LD_DIR4[A]&&A!=='chute'){const D=LD_DIR4[A];done=ldStrip(D[0],12+k,x,y+2,D[1]*s,fl);}
  else if(A==='snake'||A==='scorpion'||A==='spider')done=ldStrip(A,8+k,x,y+2,.3,A==='spider'?false:!fl);
  else if(A==='crab')done=ldStrip('crab',9+Math.min(2,k),x,y+2,.34,fl);
  if(done){ctx.filter='none';ctx.restore();return;}ctx.globalAlpha*=Math.max(0,1-e.deadT*1.8);}
 if(LD_DIR4[A]){const D=LD_DIR4[A],[r0,fp]=ldDir(e.a);done=ldStrip(D[0],r0+(D[2]?wk%2:wk)+(e.hit>0&&F.boss?0:0),x,y+2,D[1]*s,fp);}
 if(!done&&(A==='snake'||A==='scorpion'||A==='spider'))done=ldStrip(A,(e.stun>0||e.fz?4:0)+wk,x,y+2,.3,A==='spider'?false:!fl);
 if(done){}
 else if(A==='crab')done=ldStrip('crab',e.stun>0||e.fz?8:(e.hit>0?4+wk:wk),x,y+2,.34*s,fl);
 else if(A==='karate_red'||A==='karate_pink')done=ldStrip(A,wk,x,y+2,.3*s,fl);
 else if(A==='walker'||A==='techie'||A==='sneak'||A==='flyer')done=SHEETS.hench_walker&&(drawSprite('hench_walker',e.hit>0?'hurt_2':'walk_'+(1+wk),x,y+2,fl,a,.34*s),true);
 else if(A==='thrower')done=SHEETS.hench_thrower&&(drawSprite('hench_thrower','walk_'+(1+wk),x,y+2,fl,a,.34*s),true);
 else if(A==='brute')done=SHEETS.foreman&&(drawSprite('foreman','walk_'+(1+wk),x,y+2,fl,a,.3*s),true);
 else if(A==='meatball')done=typeof abqDraw==='function'&&abqDraw('stooge_meatball',wk,x,y+2,.15,fl);
 else if(A==='chute')done=typeof abqDraw==='function'&&abqDraw('stooge_meatball',wk,x,y+2,.15,fl);
 else if(A==='lefty')done=typeof abqDraw==='function'&&abqDraw('stooge_lefty',e.cd>6?6:wk,x,y+2,.2,fl);
 else if(A==='knuckles')done=typeof abqDraw==='function'&&abqDraw('stooge_knuckles',e.stun>0?6:wk,x,y+2,.24,fl);
 else if(A==='balloon')done=typeof abqDrawC==='function'&&abqDrawC('bal_foes',e.hit>0?8:(e.id==='balloon'?Math.floor(e.t)%3:0),x,y-16,.14,fl);
 else if(A==='baron')done=typeof abqDrawC==='function'&&abqDrawC('bal_boss',Math.floor(e.t*4)%4,x,y-30,.18,fl);
 else if(A==='gdrone')done=typeof abqDrawC==='function'&&abqDrawC('abq_pickups',17,x,y-6,.12,fl);
 if(!done)ldFoeCode(G,e,x,y,s,fl,wk);
 ctx.filter='none';ctx.restore();
 if(A==='techie'){rrect(x-6,y-12,12,8,2,'#3a3a4a','#000',1);ctx.fillStyle='#ff5ae0';ctx.fillRect(x+6,y-30+Math.sin(e.t*6)*2,5,4);}
 if(A==='flyer'){rrect(x-14,y+2,28,5,3,'#8a3ac8','#000',1.5);ctx.fillStyle='#2de2f5';ctx.fillRect(x-12,y+7,6,2);ctx.fillRect(x+6,y+7,6,2);}
 if(e.F.guard&&e.guardN===2){ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y-14,13,-.8,.8);ctx.stroke();}
 if(e.fz){ctx.fillStyle=Math.floor(G.t*10)%2?'#7ef05a':'#fff';ctx.beginPath();ctx.arc(x,y-12,14,0,7);ctx.globalAlpha=.3;ctx.fill();ctx.globalAlpha=1;}
 if(e.bub>0){ctx.strokeStyle='rgba(180,240,255,.9)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y-12,16*s,0,7);ctx.stroke();}
 if(e.conf>0)text('?',x,y-30*s,13,'#c9a0ff','center');
 if(e.stun>0&&!e.frz)for(let i=0;i<3;i++){const an=G.t*5+i*2.1;text('*',x+Math.cos(an)*10,y-30*s+Math.sin(an)*3,11,'#ffd23a','center');}
 if(e.shieldT>0){ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.arc(x+16,y-50,14,Math.PI,0);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();}
 if(e.hp<e.max){const w=F.boss?60:22;ctx.fillStyle='#000';ctx.fillRect(x-w/2-1,y-(F.boss?66:36)*s/(F.boss?1.8:1)-1,w+2,5);ctx.fillStyle=F.boss?'#ff5a8a':'#7f7';ctx.fillRect(x-w/2,y-(F.boss?66:36)*s/(F.boss?1.8:1),w*Math.max(0,e.hp/e.max),3);}}
function ldThug(x,y,col,fl,wk,s){s=s||1;ctx.save();ctx.translate(x,y);ctx.scale((fl?-1:1)*s,s);const b=wk%2?1:0;
 ctx.fillStyle='#222';ctx.fillRect(-6,-8,4,8+b);ctx.fillRect(2,-8,4,8-b);rrect(-8,-24,16,17,4,col,'#000',1.5);ctx.fillStyle='#fff';ctx.fillRect(-8,-20,2,12);
 ctx.fillStyle='#f0c8a0';ctx.beginPath();ctx.arc(0,-29,7,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#111';ctx.fillRect(-1,-31,8,3);ctx.fillStyle='#ffd23a';ctx.fillRect(-3,-22,6,2);ctx.restore();}
function ldFoeCode(G,e,x,y,s,fl,wk){const A=e.F.art,t=e.t;ctx.lineWidth=1.5;ctx.strokeStyle='#000';
 if(A==='scorpion'){ctx.save();ctx.translate(x,y-4);ctx.scale(fl?-1:1,1);ctx.fillStyle='#c8862a';for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(-4+i*5,0,5,3.5,0,0,7);ctx.fill();ctx.stroke();}
  ctx.beginPath();ctx.moveTo(-8,0);ctx.quadraticCurveTo(-16,-12,-6,-16+Math.sin(t*8)*2);ctx.strokeStyle='#c8862a';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#ff5a3a';ctx.beginPath();ctx.arc(-6,-16+Math.sin(t*8)*2,2.5,0,7);ctx.fill();
  ctx.strokeStyle='#7a4a1a';ctx.lineWidth=1.5;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-3+i*4,2);ctx.lineTo(-5+i*4+(wk%2)*2,6);ctx.stroke();}ctx.fillStyle='#c8862a';ctx.beginPath();ctx.arc(9,-2,3,0,7);ctx.arc(9,3,3,0,7);ctx.fill();ctx.restore();return;}
 if(A==='snake'){ctx.strokeStyle='#5a8a2a';ctx.lineWidth=6;ctx.lineCap='round';ctx.beginPath();for(let i=0;i<8;i++){const px=x+(fl?1:-1)*(i*3-10),py=y-3+Math.sin(t*10-i*.9)*3;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.stroke();
  ctx.fillStyle='#7aaa3a';ctx.beginPath();ctx.ellipse(x+(fl?-12:12),y-3+Math.sin(t*10)*3,5,4,0,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#f2d24a';ctx.fillRect(x+(fl?13:-15),y-4,3,3);return;}
 if(A==='blockhead'){const b=wk%2?2:0;ctx.fillStyle='#3a3a4a';ctx.fillRect(x-5,y-9,4,9+b/2);ctx.fillRect(x+1,y-9,4,9-b/2);rrect(x-8,y-22,16,14,4,'#e8a02a','#000',1.5);
  ctx.fillStyle='#f2c46a';ctx.fillRect(x+(fl?-12:8),y-19+b,5,4); // arm
  rrect(x-10,y-40,20,19,2,'#c8965a','#000',1.5);ctx.strokeStyle='#8a5a2a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x-10,y-35);ctx.lineTo(x+10,y-35);ctx.stroke();ctx.fillStyle='#8a5a2a';ctx.fillRect(x-1,y-40,2,5); // tape
  ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x-4,y-29,2.2,0,7);ctx.arc(x+4,y-29,2.2,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x-4,y-30,1,1);ctx.fillRect(x+4,y-30,1,1);text('FRAGILE',x,y-23,5,'#a0281a','center');return;}
 if(A==='fizzer'){const p=e.fz?1+Math.sin(G.t*30)*.1:1,hop=Math.abs(Math.sin(t*9))*3;ctx.save();ctx.translate(x,y-hop);ctx.scale(p,p);
  ctx.fillStyle='#222';ctx.fillRect(-5,-3,3,3+hop);ctx.fillRect(2,-3,3,3+hop);rrect(-8,-28,16,26,4,'#e8483a','#000',1.5);ctx.fillStyle='#fff';ctx.fillRect(-8,-18,16,5);ctx.fillStyle='#e8483a';text('FIZZ',0,-14,5,'#e8483a','center');
  rrect(-8,-31,16,4,2,'#c8ccd4','#000',1);ctx.strokeStyle='#888';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(3,-33,2,0,7);ctx.stroke();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-3,-23,2.5,0,7);ctx.arc(3,-23,2.5,0,7);ctx.fill();ctx.fillStyle='#111';ctx.fillRect(-3,-23,1.5,1.5);ctx.fillRect(3,-23,1.5,1.5);
  ctx.fillStyle='rgba(220,240,255,.8)';for(let k=0;k<3;k++){const bt=(t*1.5+k/3)%1;ctx.beginPath();ctx.arc(Math.sin(k*2+t*4)*4,-34-bt*14,1.5,0,7);ctx.fill();}
  ctx.restore();if(e.fz)text('ssss',x+10,y-30,9,'#ffd23a','left');return;}
 if(A==='gloom'){const sw=Math.sin(t*5)*2;ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(x,y,10,3,0,0,7);ctx.fill();
  ctx.fillStyle='#3a2a5a';ctx.strokeStyle='#000';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x-12-sw,y-2);ctx.lineTo(x-8,y-34);ctx.quadraticCurveTo(x,y-50,x+8,y-34);ctx.lineTo(x+12+sw,y-2);ctx.closePath();ctx.fill();ctx.stroke(); // long trench cape
  ctx.fillStyle='#2a1a40';ctx.beginPath();ctx.arc(x,y-38,9,Math.PI,0);ctx.lineTo(x+9,y-30);ctx.lineTo(x-9,y-30);ctx.closePath();ctx.fill();ctx.stroke(); // hood
  ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.arc(x-3.5,y-35,2.4,0,7);ctx.arc(x+3.5,y-35,2.4,0,7);ctx.fill();ctx.fillStyle='#ff5ae0';ctx.fillRect(x-6,y-24,12,2); // goggle eyes + scarf
  if(Math.random()<.3){ctx.fillStyle='rgba(255,90,224,.5)';ctx.fillRect(x-10+Math.random()*20,y-44+Math.random()*40,2,2);}return;}
 if(A==='sneak'){ldThug(x,y,'#3a2a5a',fl,wk,1);return;}
 if(A==='jet'){ctx.save();ctx.translate(x,y);ctx.scale(fl?-1:1,1);rrect(-14,-6,28,8,4,'#8a3ac8','#000',1.5);ctx.fillStyle='#ff8a1a';ctx.beginPath();ctx.moveTo(-14,-4);ctx.lineTo(-22-Math.random()*6,-2);ctx.lineTo(-14,0);ctx.fill();ctx.restore();ldThug(x,y-4,'#6a3a9a',fl,0,.8);return;}
 if(A==='gdrone'){ctx.fillStyle='#6a3a9a';ctx.fillRect(x-7,y-6,14,6);ctx.strokeRect(x-7,y-6,14,6);ctx.strokeStyle='#ddd';for(const k of [-1,1]){ctx.beginPath();ctx.moveTo(x+k*12-5,y-8);ctx.lineTo(x+k*12+5,y-8);ctx.stroke();}return;}
 if(A==='robo'||A==='minibot'){const k=A==='minibot'?.6:1;ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.fillStyle='#5a3a8a';ctx.fillRect(-6,-10,4,10);ctx.fillRect(2,-10,4,10);rrect(-11,-30,22,20,3,'#7a4ab0','#000',1.5);rrect(-8,-42,16,12,3,'#9a6ad0','#000',1.5);
  ctx.fillStyle='#111';ctx.fillRect(-6,-39,12,4);ctx.fillStyle='#ffd23a';ctx.fillRect(-5,-24,10,2);ctx.restore();return;}
 if(A==='gtank'){ctx.save();ctx.translate(x,y);ctx.scale(fl?-1:1,1);rrect(-20,-14,40,14,4,'#5a3a7a','#000',2);rrect(-12,-24,22,12,4,'#7a4ab0','#000',2);ctx.fillStyle='#333';ctx.fillRect(8,-20,16,4);ctx.fillStyle='#ffd23a';ctx.fillRect(-18,-8,36,2);
  ctx.fillStyle='#222';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(-16+i*8,0,3,0,7);ctx.fill();}ctx.restore();return;}
 if(A==='baldey'){ctx.save();ctx.translate(x,y);ctx.scale(fl?-1:1,1);ctx.fillStyle='#3a1a5a';ctx.fillRect(-10,-14,8,14);ctx.fillRect(2,-14,8,14);rrect(-18,-48,36,36,8,'#6a2a9a','#000',2);ctx.fillStyle='#ffd23a';ctx.fillRect(-18,-30,36,3);ctx.fillRect(-2,-48,4,36);
  ctx.fillStyle='#f0c8a0';ctx.beginPath();ctx.arc(0,-60,13,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#111';ctx.fillRect(-2,-64,12,4);ctx.beginPath();ctx.moveTo(-4,-54);ctx.lineTo(8,-54);ctx.stroke();
  ctx.fillStyle='#f0c8a0';ctx.beginPath();ctx.arc(-22,-34,7,0,7);ctx.arc(22,-34,7,0,7);ctx.fill();ctx.restore();ldThug(x+(fl?20:-20),y,'#6a3a9a',fl,Math.floor(e.t*8),.8);ctx.fillStyle='#ffd23a';return;}
 ldThug(x,y,A==='runner'||A==='meatball'?'#6a3a9a':A==='chute'?'#6a3a9a':'#7a4ab0',fl,wk,A==='brute'?1.4:A==='lefty'?1.5:A==='knuckles'?1.8:1);}
// ---------- units
function ldDrawUnit(G,u){const U=u.U,x=u.x,y=u.y,K=U.kind,lv=u.lvl,off=u.off>0;
 if(u.built>0){ctx.strokeStyle='#ffd23a';ctx.lineWidth=2;ctx.strokeRect(x-12,y-24,24,22);return;}
 ctx.save();if(off)ctx.globalAlpha=.55;
 if(u.agent){ldDrawAgent(G,u);}
 else{ // tower: painted tower when there is art for it, else painted pad + code head
  const row=lv>=5?2:lv>=3?1:0,kick=G.t-(u.fireT==null?-9:u.fireT)<.12?2:0,TA=LD_TOWER_ART[U.id];
  if(TA&&ldStrip(TA[0],row*4+TA[1],x,y+8+kick,.4)){ctx.restore();ldUnitPips(G,u);return;}
  let h=10+lv*2;
  if(ldStrip('bases_a',row*4+1,x,y+8,.34))h=14;
  else{rrect(x-13,y-h,26,h+4,5,U.col,'#000',2);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-13,y-4,26,6);}
  ctx.save();ctx.translate(x,y-h-2);ctx.rotate(u.ang);ctx.fillStyle=lv>=5?'#ffd23a':'#333';ctx.strokeStyle='#000';ctx.lineWidth=1.5;
  if(K==='pulse'){ctx.fillStyle='#222';ctx.beginPath();ctx.arc(0,0,9,0,7);ctx.fill();ctx.fillStyle='#7a4af0';ctx.beginPath();ctx.arc(0,0,5+(Math.sin(G.t*12)>0?1:0),0,7);ctx.fill();}
  else if(K==='slow'){ctx.fillStyle='#ddd';ctx.fillRect(-3,-3,14,6);ctx.strokeRect(-3,-3,14,6);}
  else if(K==='pull'){ctx.strokeStyle='#e83a3a';ctx.lineWidth=4;ctx.beginPath();ctx.arc(4,0,7,-1.3,1.3,true);ctx.stroke();}
  else if(K==='chain'){ctx.fillStyle='#d9822b';ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#bff';ctx.beginPath();ctx.arc(0,0,3+Math.random()*2,0,7);ctx.fill();}
  else if(K==='arrow'){ctx.strokeStyle='#7a4a1a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(2,-10);ctx.lineTo(8,0);ctx.lineTo(2,10);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(2,-10);ctx.lineTo(2,10);ctx.stroke();ctx.fillStyle='#8a8a8a';ctx.fillRect(0,-1,12,2);}
  else if(K==='shot'&&U.id==='minigun'){for(let i=-1;i<=1;i++){ctx.fillStyle='#555';ctx.fillRect(0,i*3-1,15,2.5);}ctx.fillStyle='#ff6ad5';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();ctx.stroke();}
  else{const len=K==='splash'?12:K==='beam'?16:13,wd=K==='splash'?10:K==='hamster'?9:6;ctx.fillRect(-2,-wd/2,len,wd);ctx.strokeRect(-2,-wd/2,len,wd);ctx.fillStyle=U.col;ctx.beginPath();ctx.arc(0,0,6,0,7);ctx.fill();ctx.stroke();}
  ctx.restore();}
 ctx.restore();ldUnitPips(G,u);}
// tower art: gun id -> [strip, column]; strip frame = level row*4 + column
const LD_TOWER_ART={pizza:['bases_b',0],foam:['bases_b',1],bass:['bases_b',2],magnet:['bases_b',3],laser:['bases_a',0],bubble:['bases_a',2],smoke:['bases_a',3]};
function ldUnitPips(G,u){const x=u.x,y=u.y,lv=u.lvl,off=u.off>0;
 for(let i=0;i<lv;i++){ctx.fillStyle=lv>=5?'#ffd23a':'#7ff';ctx.fillRect(x-11+i*5,y+9,4,3);}
 if(off){text('zz',x+8,y-28,10,'#ff5ae0','left');}
 if(u.beam&&!u.beam.dead){ctx.strokeStyle='rgba(58,255,216,.85)';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(x,y-20);ctx.lineTo(u.beam.x,u.beam.y-10);ctx.stroke();ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();}}
function ldDrawAgent(G,u){const K=u.U.kind,x=u.x,y=u.y,t=G.t,fired=G.t-(u.fireT==null?-9:u.fireT)<.3,fl=Math.cos(u.ang||0)<0;
 const AG={yoyo:[0,2],kick:[4,6],scan:[8,10],net:[12,14]}[K];
 if(AG){const f=fired||(K==='kick'&&u.cd>.9)?AG[1]:AG[0]+(Math.floor(t*2)%2?(K==='scan'?3:1):0);
  if(ldStrip('agents',f,x,y+8+(K==='scan'?Math.sin(t*3)*2:0),.36,K==='scan'?false:fl)){
   if(K==='scan'){ctx.strokeStyle='rgba(45,226,245,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,ldStats(u.U,u.lvl,G).range,0,7);ctx.stroke();}return;}}
 if((K==='hover'||K==='swarm')&&ldStrip('bases_a',(u.lvl>=5?2:u.lvl>=3?1:0)*4+1,x,y+8,.34)){const wk=12+Math.floor(t*12)%4;
  if(K==='hover'){const p=u.unit;ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(p.x,p.y+14,9,3,0,0,7);ctx.fill();ldStripC('heads',wk,p.x,p.y,.34);return;}
  for(const d of u.drones)ldStripC('heads',wk,d.x,d.y,.22);return;}
 if(K==='yoyo'&&SHEETS.agent_coco){drawSprite('agent_coco',u.cd>.8/ldStats(u.U,u.lvl,G).rate?'beam_3':'idle_1',x,y,Math.cos(u.ang)<0,1,.36);return;}
 if(K==='kick'&&SHEETS.agent_sisi){drawSprite('agent_sisi',u.cd>.9?'scartwheel_'+(1+Math.floor(t*10)%4):'idle_1',x,y,Math.cos(u.ang)<0,1,.34);return;}
 if(K==='scan'){if(SHEETS.agent_sandy)drawSprite('agent_sandy','idle',x,y-4+Math.sin(t*3)*2,false,1,.34);else{ctx.save();ctx.translate(x,y-16);sandyTop(ctx);ctx.restore();}
  ctx.strokeStyle='rgba(45,226,245,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,ldStats(u.U,u.lvl,G).range,0,7);ctx.stroke();return;}
 if(K==='net'){ldThug(x,y,'#fff2dc',false,0,1.1);ctx.fillStyle='#fff';ctx.fillRect(x-7,y-44,14,6);ctx.fillRect(x-5,y-50,10,7);ctx.strokeStyle='#000';ctx.strokeRect(x-5,y-50,10,13);ctx.fillStyle='#5a3a1a';ctx.fillRect(x-12,y-30,14,3);return;}
 rrect(x-12,y-5,24,8,3,'#3a4a5a','#000',1.5);
 if(K==='hover'){const p=u.unit;ctx.fillStyle='#bfe9ff';rrect(p.x-9,p.y-5,18,8,3,'#bfe9ff','#000',1.5);ctx.strokeStyle='#666';for(const k of [-1,1]){ctx.beginPath();ctx.moveTo(p.x+k*11-5,p.y-7);ctx.lineTo(p.x+k*11+5,p.y-7);ctx.stroke();}ctx.fillStyle='#2de2f5';ctx.fillRect(p.x-2,p.y-3,4,3);return;}
 if(K==='swarm'){for(const d of u.drones){rrect(d.x-5,d.y-3,10,5,2,'#8fd3ff','#000',1);ctx.strokeStyle='#888';ctx.beginPath();ctx.moveTo(d.x-8,d.y-5);ctx.lineTo(d.x+8,d.y-5);ctx.stroke();}return;}
 if(K==='robo'){const p=u.unit,b=u.punch>0?4:0;if(u.punch>0)u.punch-=1/60;rrect(p.x-9,p.y-26,18,18,4,'#c7d0dc','#000',1.5);rrect(p.x-7,p.y-36,14,10,3,'#e0e6ee','#000',1.5);ctx.fillStyle='#2de2f5';ctx.fillRect(p.x-5,p.y-33,10,3);
  ctx.fillStyle='#555';ctx.fillRect(p.x-7,p.y-8,5,8);ctx.fillRect(p.x+2,p.y-8,5,8);rrect(p.x-15-b,p.y-22,7,8,3,'#e83a3a','#000',1);rrect(p.x+8+b,p.y-22,7,8,3,'#e83a3a','#000',1);return;}
 if(K==='tank'){const p=u.unit;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a||0);rrect(-14,-8,28,14,4,'#4a8a4a','#000',1.5);ctx.restore();ctx.save();ctx.translate(p.x,p.y-6);ctx.rotate(u.ang);rrect(-6,-5,12,10,3,'#5aa05a','#000',1.5);ctx.fillStyle='#333';ctx.fillRect(4,-2,12,4);ctx.restore();return;}
 if(K==='jet'){const a=t*1.2;const jx=x+Math.cos(a)*16,jy=y-22+Math.sin(a)*5;ctx.save();ctx.translate(jx,jy);ctx.rotate(-Math.PI/2+Math.sin(a)*.3);ctx.fillStyle='#e9f4ff';ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(-8,-7);ctx.lineTo(-5,0);ctx.lineTo(-8,7);ctx.closePath();ctx.fill();ctx.strokeStyle='#000';ctx.stroke();ctx.fillStyle='#2de2f5';ctx.fillRect(-2,-1,6,2);ctx.restore();return;}
 if(K==='mech'){const st=u.cd>1.8?3:0;rrect(x-12,y-40+st,24,26,5,'#2de2f5','#000',2);ctx.fillStyle='#e9eef5';ctx.beginPath();ctx.arc(x,y-30+st,7,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#2de2f5';ctx.fillRect(x-4,y-31+st,8,2);
  ctx.fillStyle='#8aa';ctx.fillRect(x-10,y-14,7,14);ctx.fillRect(x+3,y-14,7,14);rrect(x-20,y-36+st,8,16,3,'#e0e6ee','#000',1.5);rrect(x+12,y-36+st,8,16,3,'#e0e6ee','#000',1.5);return;}}
// ---------- shots and effects
function ldDrawShot(G,s){const k=s.k;ctx.save();ctx.translate(s.x,s.y);
 if(k==='shot'&&s.u&&s.u.U.id==='minigun'){ctx.fillStyle=['#ff6ad5','#7ff','#ffd23a','#7f7'][Math.floor(s.x)%4];ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fill();}
 else if(k==='shot'&&ldStripC('fx',Math.floor(G.t*14)%4,0,0,.26)){}
 else if(k==='water'&&ldStripC('fx',5,0,0,.3,Math.atan2((s.e?s.e.y:s.ty)-s.y,(s.e?s.e.x:s.tx)-s.x)+Math.PI)){}
 else if(k==='bubble'&&ldStripC('fx',13,0,0,.24)){}
 else if(k==='shot'){ctx.rotate(G.t*12);ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.moveTo(0,-6);ctx.lineTo(5,5);ctx.lineTo(-5,5);ctx.closePath();ctx.fill();ctx.strokeStyle='#a05a1a';ctx.lineWidth=1.5;ctx.stroke();ctx.fillStyle='#e8483a';ctx.fillRect(-1,0,3,3);}
 else if(k==='arrow'){ctx.rotate(s.ang||0);ctx.fillStyle='#7a4a1a';ctx.fillRect(-9,-1,14,2);ctx.fillStyle='#ccc';ctx.fillRect(5,-2,4,4);ctx.fillStyle='#fff';ctx.fillRect(-11,-3,3,6);}
 else if(k==='water'){ctx.fillStyle='#6ab0ff';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();}
 else if(k==='bubble'){ctx.strokeStyle='#bff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,7,0,7);ctx.stroke();}
 else if(k==='freeze'){ctx.fillStyle='#bff';ctx.rotate(G.t*8);ctx.fillRect(-5,-1,10,2);ctx.fillRect(-1,-5,2,10);}
 else if(k==='hamster'){ctx.fillStyle='#ffb36a';ctx.beginPath();ctx.arc(0,0,5,0,7);ctx.fill();ctx.strokeStyle='#fff';ctx.stroke();}
 else if(k==='splash'||k==='tank'){ctx.rotate(s.ang||0);ctx.fillStyle=k==='tank'?'#333':'#ff5ae0';ctx.fillRect(-6,-2.5,12,5);ctx.fillStyle='#ffd23a';ctx.fillRect(-8,-1.5,3,3);}
 else if(k==='yoyo'){ctx.fillStyle='#2de2f5';ctx.beginPath();ctx.arc(0,0,4,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();}
 else if(k==='net'){ctx.strokeStyle='#f2e0b0';ctx.lineWidth=1;for(let i=-6;i<=6;i+=4){ctx.beginPath();ctx.moveTo(i,-6);ctx.lineTo(i,6);ctx.moveTo(-6,i);ctx.lineTo(6,i);ctx.stroke();}}
 else{ctx.fillStyle=s.col||'#fff';ctx.beginPath();ctx.arc(0,0,3,0,7);ctx.fill();}
 ctx.restore();}
function ldDrawFx(G,f){const t=f.t;
 if(f.k==='ring'){const r=Math.max(0,f.big?f.r*Math.min(1,t*2):f.r*Math.min(1,t*4));ctx.strokeStyle=f.col;ctx.globalAlpha=Math.max(0,1-t*1.8);ctx.lineWidth=f.big?6:3;ctx.beginPath();ctx.ellipse(f.x,f.y,r,r*.62,0,0,7);ctx.stroke();ctx.globalAlpha=1;}
 else if(f.k==='zap'){ctx.strokeStyle=f.col;ctx.lineWidth=2;ctx.globalAlpha=Math.max(0,1-t*4);ctx.beginPath();ctx.moveTo(f.x,f.y);for(let i=1;i<5;i++)ctx.lineTo(f.x+(f.x2-f.x)*i/5+(Math.random()-.5)*10,f.y+(f.y2-f.y)*i/5+(Math.random()-.5)*10);ctx.lineTo(f.x2,f.y2-10);ctx.stroke();ctx.globalAlpha=1;}
 else if(f.k==='foam'){if(t<.6)ldStripC('fx',6+(f.v||0),f.x,f.y-8,.3+t*.3,0,Math.max(0,1-t*1.7));}
 else if(f.k==='pop'&&t<.35&&ldStripC('fx',14,f.x,f.y-10,.3+t*.8,0,Math.max(0,1-t*2.8))){}
 else if(f.k==='spark'&&t<.4&&ldStripC('fx',15,f.x,f.y-10,.3+t*.5,0,Math.max(0,1-t*2.5))){}
 else if(f.k==='pop'&&t>=.35){}
 else if(f.k==='boom'||f.k==='pop'){ctx.fillStyle=f.k==='boom'?'#ffd23a':'#fff';ctx.globalAlpha=Math.max(0,1-t*2);for(let i=0;i<8;i++){const a=i*.785,d=(f.r||18)*Math.min(1,t*4);ctx.fillStyle=['#ff5ae0','#ffd23a','#7ff','#7f7'][i%4];ctx.fillRect(f.x+Math.cos(a)*d,f.y+Math.sin(a)*d*.6-8,4,4);}ctx.globalAlpha=1;}
 else if(f.k==='butt'){const r=Math.min(1,t*3)*60;ctx.globalAlpha=Math.max(0,1-t*1.7);ctx.fillStyle='#ffd23a';ctx.beginPath();for(let i=0;i<16;i++){const a=i*Math.PI/8,d=i%2?r*.5:r;ctx.lineTo(f.x+Math.cos(a)*d,f.y-10+Math.sin(a)*d*.6);}ctx.closePath();ctx.fill();ctx.strokeStyle='#ff5a1a';ctx.lineWidth=3;ctx.stroke();
  ctx.fillStyle='rgba(200,170,120,.7)';ctx.beginPath();ctx.arc(f.x,f.y-24-t*40,10+t*30,0,7);ctx.fill();ctx.globalAlpha=1;}
 else if(f.k==='pizza'){if(t<0)return;const y=f.y-Math.max(0,.4-t)*400;if(ldStripC('fx',Math.floor(t*14)%4,f.x,y,.32))return;ctx.save();ctx.translate(f.x,y);ctx.rotate(t*8);ctx.fillStyle='#ffd23a';ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(7,7);ctx.lineTo(-7,7);ctx.closePath();ctx.fill();ctx.strokeStyle='#a05a1a';ctx.stroke();ctx.restore();}
 else if(f.k==='jet'){const d=t*900,x=f.x+f.dx*d,y=f.y+f.dy*d;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(f.dy,f.dx));ctx.fillStyle='#e9f4ff';ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-12,-11);ctx.lineTo(-7,0);ctx.lineTo(-12,11);ctx.closePath();ctx.fill();ctx.strokeStyle='#000';ctx.stroke();ctx.fillStyle='#ff8a1a';ctx.fillRect(-18,-2,6,4);ctx.restore();}
 else if(f.k==='ham'){ctx.fillStyle='#ffb36a';ctx.beginPath();ctx.ellipse(f.x+t*30,f.y-4,7,5,0,0,7);ctx.fill();ctx.strokeStyle='#000';ctx.stroke();ctx.fillStyle='#000';ctx.fillRect(f.x+t*30+3,f.y-6,1.5,1.5);}
 else if(f.k==='brick'){const k=Math.min(1,t*3);ctx.fillStyle='#b04a2a';ctx.fillRect(f.x+(f.x2-f.x)*k-4,f.y+(f.y2-f.y)*k-Math.sin(k*Math.PI)*30-3,8,5);}
 else if(f.k==='net'){ctx.strokeStyle='#ddd';ctx.globalAlpha=Math.max(0,1-t);ctx.lineWidth=1;for(let i=-14;i<=14;i+=5){ctx.beginPath();ctx.moveTo(f.x+i,f.y-30);ctx.lineTo(f.x+i,f.y);ctx.moveTo(f.x-14,f.y-30+i+14);ctx.lineTo(f.x+14,f.y-30+i+14);ctx.stroke();}ctx.globalAlpha=1;}
 else if(f.k==='build'){ctx.strokeStyle='#ffd23a';ctx.globalAlpha=Math.max(0,1-t*2);ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x,f.y-8,10+t*40,0,7);ctx.stroke();ctx.globalAlpha=1;}
 else if(f.k==='puff'||f.k==='spark'){ctx.fillStyle=f.col;ctx.globalAlpha=Math.max(0,1-t*2);ctx.beginPath();ctx.arc(f.x,f.y-12,6+t*20,0,7);ctx.fill();ctx.globalAlpha=1;}}
// ---------- main draw
function ldDraw(G){ctx.save();if(G.shake>0)ctx.translate((Math.random()-.5)*G.shake*16,(Math.random()-.5)*G.shake*16);
 ctx.drawImage(ldBgCanvas(G),0,0);
 if(G.night&&G.night.twist==='dark'){ctx.fillStyle='rgba(5,0,25,.35)';ctx.fillRect(0,0,W,H);}
 ldDrawEnd(G);
 const list=[...G.units.map(u=>({y:u.y,d:()=>ldDrawUnit(G,u)})),...G.foes.filter(e=>!e.air).map(e=>({y:e.y,d:()=>ldDrawFoe(G,e)}))].sort((a,b)=>a.y-b.y);
 for(const o of list)o.d();
 for(const e of G.foes)if(e.air)ldDrawFoe(G,e);
 for(const s of G.shots)ldDrawShot(G,s);
 for(const f of G.fx)ldDrawFx(G,f);
 ldDrawButt(G);
 for(const f of G.floats){ctx.globalAlpha=Math.min(1,f.life*2);text(f.t,f.x,f.y,f.sz,f.c,'center');ctx.globalAlpha=1;}
 ctx.restore();
 ldDrawCursors(G);ldDrawHud(G);
 if(G.state==='intro')ldDrawIntro(G);if(G.paused)ldDrawPause(G);if(G.state==='end')ldDrawEnd2(G);}
function ldDrawCursors(G){for(let p=0;p<G.np;p++){const C=G.cursor[p],col=p?'#ff5ae0':'#2de2f5';
 if(C.pad&&!C.menu){const pd=C.pad;ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(pd.x,pd.y,22+Math.sin(G.t*6)*2,13,0,0,7);ctx.stroke();
  if(pd.u){const S=ldStats(pd.u.U,pd.u.lvl,G);ctx.strokeStyle='rgba(255,255,255,.35)';ctx.setLineDash([5,5]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(pd.x,pd.y,Math.min(400,S.range),0,7);ctx.stroke();ctx.setLineDash([]);}}
 if(!C.menu){const S=G.specials[G.sp[p]];if(S&&S.aim&&!(G.cd[S.id]>0)){ctx.strokeStyle='rgba(255,138,26,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(C.x,C.y,S.id==='ice'?140:95,0,7);ctx.stroke();}
  ctx.save();ctx.translate(C.x,C.y);ctx.fillStyle=col;ctx.strokeStyle='#000';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(4,16);ctx.lineTo(8,11);ctx.lineTo(14,13);ctx.closePath();ctx.fill();ctx.stroke();
  text('P'+(p+1),12,-2,10,col,'left');ctx.restore();}
 if(C.menu)ldDrawMenu(G,p);}}
function ldMenuBox(G,p){const M=G.cursor[p].menu,pd=M.pad,w=M.kind==='unit'?176:208,h=M.kind==='unit'?132:236;let x=pd.x+26,y=pd.y-h/2;if(x+w>W-6)x=pd.x-26-w;y=Math.max(LD_HUD+2,Math.min(LD_BAR-h-2,y));return {x,y,w,h};}
function ldDrawMenu(G,p){const C=G.cursor[p],M=C.menu,B=ldMenuBox(G,p),col=p?'#ff5ae0':'#2de2f5',I=ldMenuItems(G,M);
 rrect(B.x,B.y,B.w,B.h,10,'rgba(6,14,30,.95)',col,2.5);
 if(M.kind==='unit'){const u=M.pad.u,S=ldStats(u.U,u.lvl,G);text(u.U.n+'  Lv '+u.lvl,B.x+10,B.y+18,12,'#ffd23a','left',null);
  text('DMG '+S.dmg.toFixed(1)+'  RNG '+Math.round(S.range)+'  '+(S.air?'AIR ':'')+(u.sees||S.sees?'SEES':''),B.x+10,B.y+33,9,'#9cf','left',null);
  I.forEach((it,i)=>{const y=B.y+42+i*21,s=i===M.sel;rrect(B.x+6,y,B.w-12,19,6,s?col:'rgba(255,255,255,.06)',null);text(it.t,B.x+14,y+14,11,s?'#102':'#fff','left',null);});}
 else{['GUNS','AGENTS'].forEach((t,i)=>{const x=B.x+6+i*((B.w-12)/2),s=M.tab===i;rrect(x,B.y+5,(B.w-12)/2-2,18,6,s?col:'rgba(255,255,255,.08)',null);text(t,x+(B.w-12)/4,B.y+18,11,s?'#102':'#cde','center',null);
});
  const vis=I.slice(M.scroll,M.scroll+7);vis.forEach((it,k)=>{const i=k+M.scroll,y=B.y+28+k*22,s=i===M.sel,can=!it.lock&&!it.have&&G.cash[p]>=it.c;
   rrect(B.x+6,y,B.w-12,20,6,s?(it.lock?'#555':col):'rgba(255,255,255,.05)',null);ctx.fillStyle=it.U.col;ctx.fillRect(B.x+10,y+5,10,10);
   text(it.t,B.x+24,y+14,11,s?'#102':(it.lock?'#889':'#fff'),'left',null);text(it.lock?it.U.star+'★':it.have?'ON MAP':'$'+it.c,B.x+B.w-10,y+14,11,s?'#102':(can?'#ffd23a':'#a77'),'right',null);
});
  const it=I[M.sel];if(it)wrap(it.U.d,B.x+8,B.y+B.h-44,B.w-16,12,9,'#bcd',null);
  text('◀▶ tab  A buy  B close',B.x+B.w/2,B.y+B.h-6,9,'#789','center',null);}}
function ldDrawHud(G){rrect(0,0,W,LD_HUD,0,'rgba(6,12,26,.92)',null);ctx.fillStyle='#2de2f5';ctx.fillRect(0,LD_HUD-2,W,2);
 const title=G.night?'NIGHT '+G.night.n+': '+G.night.name:'ENDLESS: '+G.map.n;text(title,8,16,12,'#ffd23a','left',null);
 text(G.night?'Wave '+Math.min(G.wave,G.maxWaves)+' / '+G.maxWaves:'Wave '+G.wave,8,33,11,'#cde','left',null);
 // lair health
 const hx=200;text('LAIR',hx,16,10,'#7ff','left',null);rrect(hx,21,120,10,4,'#222','#000',1);ctx.fillStyle=G.hp/G.hpMax>.5?'#3aff8a':G.hp/G.hpMax>.25?'#ffd23a':'#ff5a5a';ctx.fillRect(hx+1,22,118*G.hp/G.hpMax,8);
 text(G.hp+'/'+G.hpMax+(G.shield?'  shield '+G.shield:''),hx+124,30,10,'#fff','left',null);
 // wallets + score
 for(let p=0;p<G.np;p++){const x=W-8-(G.np-1-p)*118,col=p?'#ff5ae0':'#2de2f5';text((G.np>1?ldName(p)+' ':'')+'$'+G.cash[p],x,16,13,col,'right',null);text('score '+G.score[p],x,32,9,'#bcd','right',null);}
 // bottom bar: specials + wave button
 rrect(0,LD_BAR,W,H-LD_BAR,0,'rgba(6,12,26,.9)',null);
 G.specials.forEach((S,i)=>{const x=6+i*100,y=LD_BAR+5,cd=G.cd[S.id]||0,sel0=G.sp[0]===i,sel1=G.np>1&&G.sp[1]===i;
  rrect(x,y,96,26,7,cd>0?'#1a2230':S.col,sel0?'#2de2f5':sel1?'#ff5ae0':'#000',sel0||sel1?3:1.5);if(cd>0){ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(x+2,y+2,92*(1-cd/(S.cd*(1-.15*G.fort.fridge))),22);}
  text(S.n,x+48,y+12,S.n.length>13?8:9,cd>0?'#9ab':'#102','center',null);text(cd>0?Math.ceil(cd)+'s':'READY',x+48,y+23,8,cd>0?'#9ab':'#102','center',null);
  MUI.add(x,y,96,26,{click:()=>{G.sp[0]=i;SFX.move();if(!S.aim)G.fire(0,S.id,G.cursor[0].x,G.cursor[0].y);else G.armed=S.id;}});});
 const bx=W-118,by=LD_BAR+5;
 if(G.state==='break'){rrect(bx,by,112,26,7,'#3aff8a','#000',2);text('NEXT WAVE '+Math.ceil(G.breakT)+'s',bx+56,by+12,10,'#102','center',null);text('X = now (+$)',bx+56,by+23,8,'#102','center',null);MUI.add(bx,by,112,26,{click:()=>G.callWave()});}
 else{text(G.bossName&&G.bossOn?'BOSS: '+G.bossName:'Goons left: '+(G.spawnQ.length+G.foes.filter(e=>!e.dead).length),bx+56,by+18,10,'#ffb','center',null);}
 // help line (first two nights)
 if(G.state!=='end'&&G.night&&G.night.n<=2&&G.wave<=2){text('Move cursor  A: build/upgrade  X: special'+(G.state==='break'?' / call wave':'')+'  Y: fire special'+(G.np>1?'  B: gift $25':''),W/2,LD_BAR-6,10,'#fff','center');}
 // whole map click (P1 / mouse / touch)
 MUI.add(0,LD_HUD,W,LD_BAR-LD_HUD,{hl:false,click:(mx,my)=>ldMapClick(G,mx,my)});
 // re-add menu boxes on top so they win the click
 if(G.cursor[0]&&G.cursor[0].menu)ldDrawMenuHits(G);}
function ldDrawMenuHits(G){const M=G.cursor[0].menu,B=ldMenuBox(G,0),I=ldMenuItems(G,M);MUI.add(B.x,B.y,B.w,B.h,{hl:false,click:()=>{}});
 if(M.kind==='unit')I.forEach((it,i)=>MUI.add(B.x+6,B.y+42+i*21,B.w-12,19,{hover:()=>{M.sel=i;},click:()=>ldMenuDo(G,0,i)}));
 else{['GUNS','AGENTS'].forEach((t,i)=>MUI.add(B.x+6+i*((B.w-12)/2),B.y+5,(B.w-12)/2-2,18,{click:()=>{M.tab=i;M.sel=0;M.scroll=0;SFX.move();}}));
  I.slice(M.scroll,M.scroll+7).forEach((it,k)=>MUI.add(B.x+6,B.y+28+k*22,B.w-12,20,{hover:()=>{M.sel=k+M.scroll;},click:()=>ldMenuDo(G,0,k+M.scroll),wheel:d=>{M.scroll=Math.max(0,Math.min(I.length-7,M.scroll-d));}}));}}
function ldMapClick(G,mx,my){if(G.state!=='break'&&G.state!=='wave')return;const C=G.cursor[0];C.x=mx;C.y=my;
 if(C.menu){C.menu=null;}
 if(G.armed){const id=G.armed;G.armed=null;G.fire(0,id,mx,my);return;}
 let best=null,bd=26;for(const pd of G.pads){const d=Math.hypot(pd.x-mx,pd.y-my);if(d<bd){bd=d;best=pd;}}if(best)ldOpenMenu(G,0,best);}
function ldDrawIntro(G){dim(.55);rrect(60,90,520,290,16,'rgba(6,20,36,.95)','#ffd23a',3);const N=G.night;
 text(N?'NIGHT '+N.n:'ENDLESS',W/2,130,16,'#2de2f5','center',null);text(N?N.name:G.map.n,W/2,164,30,'#ffd23a','center');
 wrap(N?N.intro:'Waves never stop. Every 10 waves a boss shows up and you earn a star (up to 5 per map). How far can you get?',90,200,460,20,15,'#fff',null);
 if(N)text(N.waves+' waves'+(N.boss?'  •  Boss: '+LD_FOES[N.boss].n:'')+(N.twist==='dark'?'  •  Lights out':N.twist==='horde'?'  •  Horde':N.twist==='sky'?'  •  Sky night':N.twist==='swarm'?'  •  Swarms':''),W/2,300,13,'#ffb','center',null);
 text(G.np>1?'Each player has a cursor and a wallet. B gifts $25 to your partner.':'Tip: towers on corners hit goons for longer.',W/2,328,12,'#9cf','center',null);
 text('Press A to start',W/2,360,16,'#7f7','center');mAnyOkLD();}
function mAnyOkLD(){MUI.add(0,0,W,H,{hl:false,click:()=>MUI.btn('ok')});}
function ldDrawPause(G){dim(.6);const items=ldPauseItems(G);rrect(200,130,240,60+items.length*40,14,'rgba(6,20,36,.95)','#2de2f5',3);text('PAUSED',W/2,166,22,'#ffd23a','center');
 items.forEach((it,i)=>{const y=180+i*40,s=i===G.psel;rrect(216,y,208,32,10,s?'#ffd23a':'rgba(255,255,255,.07)',null);text(it.t,W/2,y+21,13,s?'#102':'#fff','center',null);MUI.add(216,y,208,32,{hover:()=>{G.psel=i;},click:()=>{G.psel=i;items[i].fn();}});});}
function ldDrawEnd2(G){dim(.6);const R=G.result||{};rrect(90,70,460,340,16,'rgba(6,20,36,.96)',R.win?'#3aff8a':'#ff5a8a',3);
 text(R.win?'NIGHT SURVIVED!':G.night?'THE LAIR FELL...':'GAME OVER',W/2,112,28,R.win?'#3aff8a':'#ff5a8a','center');
 if(R.win){for(let i=0;i<3;i++)text('★',W/2-50+i*50,160,40,i<R.stars?'#ffd23a':'#334','center');if(R.newStars)text('+'+R.newStars+' new star'+(R.newStars>1?'s':'')+' for the Workshop!',W/2,186,13,'#ffd23a','center',null);}
 else if(!G.night)text('You reached wave '+G.wave+(R.rank&&R.rank<=10?'  •  #'+R.rank+' on the scoreboard!':''),W/2,160,15,'#ffd23a','center',null);
 text('SCOREBOARD',W/2,214,14,'#2de2f5','center',null);
 for(let p=0;p<G.np;p++){const x=G.np>1?W/2-110+p*220:W/2,col=p?'#ff5ae0':'#2de2f5';text(ldName(p),x,238,16,col,'center',null);text(G.score[p]+' pts',x,260,14,'#fff','center',null);text(G.kos[p]+' goons KO\'d',x,280,12,'#bcd','center',null);}
 text('Team total: '+(G.total||0),W/2,310,14,'#ffd23a','center',null);if(G.gifted)text('Cash gifted between agents: $'+G.gifted,W/2,330,11,'#bcd','center',null);
 if(R.win&&R.code)text('Code for Night '+(G.night.n+1)+': '+R.code,W/2,356,13,'#7ff','center',null);
 if(G.endT>1.2)text('Press A',W/2,392,14,'#7f7','center');mAnyOkLD();}
