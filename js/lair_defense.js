// ===== LAIR DEFENSE (v0.47): tower defense mode. Data in ld_data.js, menus + Workshop in ld_menu.js =====
// Classic tower placing: each player has a cursor and a wallet. A on a round pad = build ring (Left/Right tab GUNS/AGENTS,
// Up/Down pick, A buy). A on a built pad = upgrade / sell / target. X = pick a special attack, Y = fire it at the cursor.
// Between waves X = call the next wave early (+cash). B (no menu open) = gift $25 to the other player (co-op).
// Mouse/touch: click a pad = build menu for P1, click menu rows, click the special buttons along the bottom, click "Next wave".
// Art: every unit/goon has a code drawing; ldArt hooks use assets/ld/*.png strips (LD_ART) when they exist.
const LD_HUD=40,LD_BAR=444;
Object.keys(typeof LD_ART!=='undefined'?LD_ART:{}).forEach(n=>ASSET_LIST.push(['ld/'+n,'assets/ld/'+n+'.png']));
['alley','roof','lair'].forEach(n=>ASSET_LIST.push(['ld/map_'+n,'assets/ld/map_'+n+'.jpg']));
// centred frame (turret heads, shots, FX); rot turns it around its middle
function ldStripC(n,f,x,y,s,rot,alpha){const im=IMG['ld/'+n],A=typeof LD_ART!=='undefined'&&LD_ART[n];if(!im||!im.width||!A)return false;
 const [fw,fh,nf]=A;f=((f%nf)+nf)%nf;ctx.save();if(alpha!=null)ctx.globalAlpha*=alpha;ctx.translate(x,y);if(rot)ctx.rotate(rot);
 ctx.drawImage(im,f*fw,0,fw,fh,-fw*s/2,-fh*s/2,fw*s,fh*s);ctx.restore();return true;}
// 4-direction sheets (rows down, up, right, KO): first frame of the row for heading a, and whether to mirror
function ldDir(a){const c=Math.cos(a),s=Math.sin(a);if(Math.abs(c)>=Math.abs(s)*.9)return [8,c<0];return [s>0?0:4,false];}
function ldStrip(n,f,x,by,s,flip,alpha){const im=IMG['ld/'+n],A=typeof LD_ART!=='undefined'&&LD_ART[n];if(!im||!im.width||!A)return false;
 const [fw,fh,nf]=A;f=((f%nf)+nf)%nf;ctx.save();if(alpha!=null)ctx.globalAlpha*=alpha;ctx.translate(x,by);if(flip)ctx.scale(-1,1);
 ctx.drawImage(im,f*fw,0,fw,fh,-fw*s/2,-fh*s,fw*s,fh*s);ctx.restore();return true;}
function ldRng(seed){let s=(seed*9301+49297)%233280||7;return ()=>(s=(s*16807)%2147483647)/2147483647;}

// ---------- path geometry
function ldPath(pts){const seg=[];let L=0;for(let i=0;i<pts.length-1;i++){const [ax,ay]=pts[i],[bx,by]=pts[i+1],l=Math.hypot(bx-ax,by-ay);seg.push({ax,ay,bx,by,l,s0:L});L+=l;}return {pts,seg,len:L};}
function ldAt(P,s){s=Math.max(0,Math.min(P.len,s));for(const g of P.seg){if(s<=g.s0+g.l){const t=g.l?(s-g.s0)/g.l:0;return [g.ax+(g.bx-g.ax)*t,g.ay+(g.by-g.ay)*t,Math.atan2(g.by-g.ay,g.bx-g.ax)];}}const g=P.seg[P.seg.length-1];return [g.bx,g.by,0];}
function ldNearS(P,x,y){let best=1e9,bs=0;for(const g of P.seg){const dx=g.bx-g.ax,dy=g.by-g.ay,t=Math.max(0,Math.min(1,((x-g.ax)*dx+(y-g.ay)*dy)/(g.l*g.l||1)));const px=g.ax+dx*t,py=g.ay+dy*t,d=Math.hypot(x-px,y-py);if(d<best){best=d;bs=g.s0+g.l*t;}}return [bs,best];}
function ldPads(paths){const pads=[],near=(x,y)=>Math.min(...paths.map(P=>ldNearS(P,x,y)[1]));
 for(const P of paths){let side=1;for(let s=40;s<P.len-30;s+=62){const [x,y,a]=ldAt(P,s);for(const k of [1,-1]){const o=side*k*50,px=x-Math.sin(a)*o,py=y+Math.cos(a)*o;
   if(px<22||px>W-22||py<LD_HUD+22||py>LD_BAR-20)continue;if(near(px,py)<40)continue;if(pads.some(p=>Math.hypot(p.x-px,p.y-py)<50))continue;pads.push({x:px,y:py});break;}side=-side;}}
 return pads;}

// ---------- unit stats with level, research and fortress bonuses
function ldStats(U,lvl,G){const r=ldRes(U.id),f=G?G.fort:{};const k=lvl-1;
 return {dmg:U.dmg*(1+.42*k)*(1+.1*r)*(1+.08*(f.ammo||0))*(G&&G.bonus?G.bonus.dmg:1),rate:U.rate*(1+.1*k)*(1+.08*(f.power||0)),
  range:U.range*(1+.07*k)*(1+.06*(f.lookout||0))*(G&&G.night&&G.night.twist==='dark'?.82:1),air:U.air||lvl>=5,sees:lvl>=5};}
const ldUpCost=(U,l)=>Math.round(U.cost*[0,.7,.95,1.2,1.5][l]*(1-.05*ldRes(U.id)));
const ldBuyCost=U=>Math.round(U.cost*(1-.05*ldRes(U.id)));

// ---------- the game
function makeLairDefense(opt){
 // opt: {night:n} or {endless:mapId}, np
 const np=opt.np||NPLAYERS,night=opt.night?LD_NIGHTS[opt.night-1]:null,mapId=night?night.map:opt.endless,MAP=LD_MAPS[mapId];
 const fort={};LD_FORT.forEach(f=>fort[f.id]=ldFort(f.id));
 const G={name:'ld',np,night,endless:!night,map:MAP,fort,state:'intro',t:0,paused:false,speed:1,psel:0,
  paths:MAP.paths.map(ldPath),foes:[],units:[],shots:[],fx:[],floats:[],wave:0,waveT:0,spawnQ:[],breakT:night?18:14,
  hpMax:20+5*fort.door,hp:0,shield:[0,3,6,10][fort.shield],hitsTaken:0,score:[0,0],kos:[0,0],cash:[0,0],gifted:0,
  cd:{},butt:null,bossName:'',endT:0,result:null,cursor:[],shake:0,bonus:{dmg:cheatOn('fortknox')?1.25:1}};
 G.hp=G.hpMax;G.pads=MAP.pads?MAP.pads.map(([x,y])=>({x,y})):ldPads(G.paths);G.air=G.paths.map(P=>ldPath([P.pts[0],[(P.pts[0][0]+P.pts[P.pts.length-1][0])/2+(P.pts[0][1]>240?-60:60),(P.pts[0][1]+P.pts[P.pts.length-1][1])/2],P.pts[P.pts.length-1]]));
 const endP=G.paths[0].pts[G.paths[0].pts.length-1];G.end={x:endP[0],y:endP[1]};
 G.perch=MAP.perch?{x:MAP.perch[0],y:MAP.perch[1]}:{x:Math.min(W-30,G.end.x+(G.end.x<W/2?40:-40)),y:Math.max(LD_HUD+30,G.end.y-10)};
 const start=150+50*fort.bank+(cheatOn('fortknox')?500:0);G.cash=np>1?[start,start]:[Math.round(start*1.4),0];
 G.maxWaves=night?night.waves:Infinity;
 G.specials=LD_SPECIALS.filter(ldUnlocked);G.sp=[0,0];
 for(let p=0;p<np;p++)G.cursor[p]={x:p?W/2+60:W/2-60,y:H/2,menu:null,hov:-1,blink:0};
 const fl=(x,y,t,c='#fff',sz=13)=>{const hw=Math.min(W/2-4,String(t).length*sz*.33+6);G.floats.push({x:Math.max(hw,Math.min(W-hw,x)),y:Math.max(LD_HUD+16,Math.min(LD_BAR-8,y)),t,c,sz,life:1.1});};
 G.float=fl;
 const trackFor=()=>night&&night.boss&&G.bossOn?(night.boss==='baldey'?'ld_baldey':'ld_boss'):['ld_alley','ld_roof','ld_lair'][mapId];
 // ---------- waves
 function wavePlan(w){const pool=night?night.pool:LD_ENDLESS_POOL[Math.min(LD_ENDLESS_POOL.length-1,Math.floor((w-1)/6))],r=ldRng((night?night.n*100:500+mapId*1000)+w*7);
  const list=[];const ids=Object.keys(pool);const tw=night?night.twist:'';let budget=(6+w*2.6)*(night?1+(night.n-1)*.12:1+w*.03)*(tw==='horde'?1.6:1);
  if(!night){const extra=Object.assign({},pool);LD_ENDLESS_POOL.slice(0,Math.min(5,Math.floor(w/6))).forEach(p=>Object.assign(extra,p));ids.splice(0,ids.length,...Object.keys(extra));}
  const wt=id=>(night?pool[id]:1)||1,tot=ids.reduce((a,id)=>a+wt(id),0);
  let guard=0;while(budget>0&&guard++<300){let x=r()*tot,id=ids[0];for(const k of ids){x-=wt(k);if(x<=0){id=k;break;}}const F=LD_FOES[id];if(F.threat>budget+1&&budget<2)break;
   const n=Math.min(6,F.pack||1)*(tw==='swarm'&&F.pack?2:1);for(let i=0;i<n;i++)list.push({id,gap:F.pack?.32:(.55+r()*.5)});budget-=F.threat*(F.pack?n*.6:1);}
  const boss=night&&night.boss&&w===night.waves?night.boss:(!night&&w%10===0?LD_ENDLESS_BOSSES[(w/10-1)%4]:null);
  if(boss){list.splice(Math.floor(list.length/2),0,{id:boss,gap:2});}
  if(tw==='sky')list.forEach(o=>{if(!LD_FOES[o.id].air&&!LD_FOES[o.id].boss&&r()<.35)o.id='chute';});
  return list;}
 function startWave(early){G.wave++;G.spawnQ=wavePlan(G.wave);G.waveT=0;G.nextSpawn=.4;G.state='wave';
  if(early){const b=Math.round(G.breakT*2);for(let p=0;p<np;p++)G.cash[p]+=b;if(b>0)fl(W/2,LD_HUD+30,'EARLY! +$'+b+(np>1?' each':''),'#ffd23a',16);}
  if(G.spawnQ.some(o=>LD_FOES[o.id].boss)){G.bossName=LD_FOES[G.spawnQ.find(o=>LD_FOES[o.id].boss).id].n;}
  SFX.whoosh();}
 G.callWave=()=>{if(G.state==='break')startWave(true);};
 function spawn(id,s,pi,extra){const F=LD_FOES[id],k=night?1+.2*(night.n-1):1+.1*(G.wave-1)+.004*G.wave*G.wave,isBoss=!!F.boss;
  const hp=F.hp*k*(isBoss?(np>1?1.35:1)*(night?1:1+.08*G.wave):1)*(night&&night.twist==='horde'?.65:1);
  const air=!!F.air,P=air?G.air[pi]:G.paths[pi];
  const e={id,F,hp,max:hp,s:s||0,pi,air,P,spd:F.spd*(1+(G.wave>15?.01*(G.wave-15):0)),slow:0,slowT:0,stun:0,frz:0,bub:0,conf:0,hit:0,x:0,y:0,a:0,t:Math.random()*9,
   last:0,dead:0,cd:2+Math.random()*3,guardN:0,fall:F.chute?1.5:0,shieldT:0,phase:0,reveal:0};
  Object.assign(e,extra||{});if(e.fall&&!s){e.s=P.len*(.18+Math.random()*.45);}
  const p=ldAt(P,e.s);e.x=p[0];e.y=p[1];G.foes.push(e);return e;}
 G.spawn=spawn;
 // ---------- damage / KO
 function payKO(e,who){const tip=1+.1*fort.tipjar,c=Math.round(e.F.cash*tip*(e.mag?1.25:1));const p=np>1?(who>=0?who:(e.last||0)):0;G.cash[p]+=c;G.kos[p]++;G.score[p]+=c*10+(e.F.boss?2000:0);
  fl(e.x,e.y-18,'+$'+c,'#ffd23a',12);}
 function kill(e,who,quiet){if(e.dead)return;e.dead=1;e.deadT=0;payKO(e,who);SFX.hit();
  if(e.F.split){const n=e.id==='gtank'?2:2;for(let i=0;i<n;i++)spawn(e.F.split,Math.max(0,e.s-8-i*12),e.pi,{});}
  if(e.F.drops){const [s]=ldNearS(G.paths[e.pi],e.x,e.y);spawn(e.F.drops,s,e.pi,{fall:1.2});}
  if(e.F.boss){G.shake=.6;fl(e.x,e.y-40,e.F.n.toUpperCase()+' IS DOWN!','#ff8a1a',18);if(typeof playStinger==='function')playStinger('clue');}
  G.fx.push({k:'pop',x:e.x,y:e.y,t:0,col:'#fff'});}
 G.kill=kill;
 function hurt(e,d,who,o){if(e.dead)return 0;o=o||{};
  if(e.shieldT>0){fl(e.x,e.y-26,'BLOCKED','#cde',10);return 0;}
  if(e.F.guard&&!o.special){e.guardN=(e.guardN+1)%3;if(e.guardN===0){fl(e.x,e.y-26,'GUARD!','#fff',10);e.hit=.15;return 0;}}
  let dmg=Math.max(d*.25,d-(e.F.armor||0)*(o.pierceArmor?0:1));if(e.frz>0)dmg*=1.25;
  e.hp-=dmg;e.hit=.12;if(who!=null&&who>=0)e.last=who;
  if(e.F.blink&&e.cd<=0&&!e.dead&&e.hp>0){e.s=Math.min(e.P.len-30,e.s+70);e.cd=3.5;G.fx.push({k:'puff',x:e.x,y:e.y,t:0,col:'#6a3aa0'});fl(e.x,e.y-24,'BLINK!','#c9a0ff',11);}
  if(e.hp<=0)kill(e,who);return dmg;}
 G.hurt=hurt;
 const visible=(e,u)=>!e.F.sneak||e.reveal>0||(u&&u.sees)||fort.radar>=3;
 const targetable=(e,u,air)=>!e.dead&&e.fall<=0&&(air||!e.air)&&visible(e,u);
 function prog(e){return e.s/e.P.len;}
 function inRange(u,R,air){const out=[];for(const e of G.foes)if(targetable(e,u,air)&&Math.hypot(e.x-u.x,e.y-u.y)<=R)out.push(e);return out;}
 function pick(list,mode){if(!list.length)return null;if(mode==='strong')return list.reduce((a,b)=>b.hp>a.hp?b:a);if(mode==='close')return list.reduce((a,b)=>b.s>a.s?b:a);return list.reduce((a,b)=>prog(b)>prog(a)?b:a);}
 // ---------- units
 G.build=function(p,pad,U){const c=ldBuyCost(U);if(G.cash[p]<c){fl(pad.x,pad.y-20,'Need $'+c,'#ff7a7a');SFX.hurt();return false;}
  if(LD_AGENTS.includes(U)&&G.units.some(u=>u.U.id===U.id)){fl(pad.x,pad.y-20,'Only one '+U.n,'#ff7a7a');SFX.hurt();return false;}
  G.cash[p]-=c;const u={U,pad,x:pad.x,y:pad.y,lvl:1,owner:p,cd:.3,ang:-Math.PI/2,spent:c,mode:'first',off:0,t:0,built:.5,
   agent:LD_AGENTS.includes(U),unit:{x:pad.x,y:pad.y,a:0,tx:pad.x,ty:pad.y}};pad.u=u;G.units.push(u);
  if(U.kind==='robo'||U.kind==='tank'){const [s]=ldNearS(G.paths[0],pad.x,pad.y);u.home=s;u.ps=s;u.dir=1;}
  if(U.kind==='swarm')u.drones=[0,1,2].map(i=>({x:pad.x,y:pad.y,a:i*2.1,cd:i*.3,tx:null}));
  SFX.ok();G.fx.push({k:'build',x:pad.x,y:pad.y,t:0});return true;};
 G.upgrade=function(p,u){if(u.lvl>=5)return false;const c=ldUpCost(u.U,u.lvl);if(G.cash[p]<c){fl(u.x,u.y-20,'Need $'+c,'#ff7a7a');SFX.hurt();return false;}
  G.cash[p]-=c;u.spent+=c;u.lvl++;SFX.pick();fl(u.x,u.y-24,u.lvl>=5?'MAX!':'LEVEL '+u.lvl,u.lvl>=5?'#ffd23a':'#7ff',13);G.fx.push({k:'build',x:u.x,y:u.y,t:0});return true;};
 G.sell=function(p,u){const v=Math.round(u.spent*.7);G.cash[p]+=v;G.units=G.units.filter(x=>x!==u);u.pad.u=null;fl(u.x,u.y-20,'+$'+v,'#ffd23a');SFX.move();};
 function zapLine(a,b,col){G.fx.push({k:'zap',x:a.x,y:a.y,x2:b.x,y2:b.y,t:0,col});}
 function shoot(u,e,S,o){G.shots.push(Object.assign({x:u.x,y:u.y-10,e,tx:e.x,ty:e.y,spd:330,dmg:S.dmg,who:u.owner,k:u.U.kind,col:u.U.col,u,pierce:0,hitL:[]},o||{}));}
 function sandyBuff(u){return G.units.some(v=>v.U.kind==='scan'&&v!==u&&Math.hypot(v.x-u.x,v.y-u.y)<ldStats(v.U,v.lvl,G).range)?1.25:1;}
 function unitDisabled(u){return u.off>0;}
 function updUnit(u,dt){u.t+=dt;if(u.built>0){u.built-=dt;return;}if(u.off>0){u.off-=dt;return;}
  const S=ldStats(u.U,u.lvl,G);S.sees=S.sees||u.U.kind==='scan'||u.U.kind==='hover'||u.U.kind==='swarm'||(fort.radar&&Math.hypot(u.x-G.end.x,u.y-G.end.y)<90*fort.radar);u.sees=S.sees;
  u.cd-=dt*sandyBuff(u);const K=u.U.kind;
  if(K==='scan'){for(const e of G.foes)if(Math.hypot(e.x-u.x,e.y-u.y)<S.range)e.reveal=.3;}
  if(K==='hover'){u.unit.a+=dt*1.6;u.unit.x=u.pad.x+Math.cos(u.unit.a)*46;u.unit.y=u.pad.y+Math.sin(u.unit.a)*30-16;}
  if(K==='swarm'){for(const d of u.drones){d.cd-=dt;const t=d.tx&&!d.tx.dead?d.tx:null;
    if(t){const dx=t.x-d.x,dy=t.y-14-d.y,l=Math.hypot(dx,dy);if(l<10){if(d.cd<=0){hurt(t,S.dmg,u.owner);d.cd=1/S.rate;G.fx.push({k:'spark',x:t.x,y:t.y-10,t:0,col:'#8fd3ff'});d.tx=null;}}else{d.x+=dx/l*220*dt;d.y+=dy/l*220*dt;}}
    else{d.a+=dt*2;const hx=u.pad.x+Math.cos(d.a)*26,hy=u.pad.y-18+Math.sin(d.a)*14;d.x+=(hx-d.x)*Math.min(1,dt*4);d.y+=(hy-d.y)*Math.min(1,dt*4);
     if(d.cd<=0){const c=pick(inRange(u,S.range,true),'first');if(c)d.tx=c;}}}
   return;}
  if(K==='robo'||K==='tank'){const P=G.paths[0];const lim=K==='robo'?20:80;
   if(K==='tank'){u.ps+=u.dir*28*dt;if(u.ps>u.home+lim||u.ps<u.home-lim)u.dir*=-1;}else{u.ps+=(u.home-u.ps)*Math.min(1,dt*2);}
   const p=ldAt(P,u.ps);u.unit.x=p[0];u.unit.y=p[1];u.unit.a=p[2]+(u.dir<0?Math.PI:0);}
  if(u.cd>0)return;
  const ox=(K==='hover'||K==='robo'||K==='tank')?u.unit.x:u.x,oy=(K==='hover'||K==='robo'||K==='tank')?u.unit.y:u.y;
  const src={x:ox,y:oy,sees:S.sees};
  const pool=G.foes.filter(e=>targetable(e,src,S.air)&&Math.hypot(e.x-ox,e.y-oy)<=S.range);
  if(K==='jet'){const any=G.foes.filter(e=>targetable(e,src,true));if(!any.length)return;const t=pick(any,'first');u.cd=1/S.rate;
   const a=Math.random()*Math.PI,dx=Math.cos(a),dy=Math.sin(a);G.fx.push({k:'jet',x:t.x-dx*700,y:t.y-dy*700,dx,dy,t:0,u});
   for(const e of any){const d=Math.abs((e.x-t.x)*dy-(e.y-t.y)*dx);if(d<26)hurt(e,S.dmg,u.owner);}SFX.whoosh();return;}
  if(!pool.length){if(K==='beam')u.beam=null;return;}
  const t=pick(pool,u.mode);u.ang=Math.atan2(t.y-oy,t.x-ox);u.cd=1/S.rate;u.fireT=G.t;
  switch(K){
   case 'shot':shoot(u,t,S,{x:ox,y:oy-10});break;
   case 'arrow':shoot(u,t,S,{x:ox,y:oy-10,spd:460,pierce:2,ang:u.ang});break;
   case 'orb':shoot(u,t,S,{x:ox,y:oy-12,spd:210,pierce:3+u.lvl});break;
   case 'water':shoot(u,t,S,{x:ox,y:oy-10,spd:380,push:34});break;
   case 'bubble':shoot(u,t,S,{x:ox,y:oy-10,spd:220,bub:2.2+u.lvl*.4});break;
   case 'freeze':shoot(u,t,S,{x:ox,y:oy-10,spd:360,frz:1.4+u.lvl*.3});break;
   case 'hamster':shoot(u,t,S,{x:ox,y:oy-10,spd:300,ham:.12+u.lvl*.05});break;
   case 'splash':shoot(u,t,S,{x:ox,y:oy-10,spd:260,splash:44+u.lvl*4});break;
   case 'yoyo':shoot(u,t,S,{x:ox,y:oy-14,spd:420,stun:.7,bounce:1+(u.lvl>=3?1:0)});break;
   case 'net':shoot(u,t,S,{x:ox,y:oy-14,spd:300,slowM:.35,slowT:2.5+u.lvl*.4,boss:1});break;
   case 'scan':shoot(u,t,S,{x:ox,y:oy-20,spd:500});break;
   case 'hover':shoot(u,t,S,{x:ox,y:oy,spd:420});break;
   case 'tank':shoot(u,t,S,{x:ox,y:oy-8,spd:280,splash:40});break;
   case 'beam':u.beam=t;u.cd=.1;hurt(t,S.dmg*.1,u.owner,{pierceArmor:1});break;
   case 'chain':{let cur=t,hit=[t],n=3+(u.lvl>=3?1:0)+(u.lvl>=5?1:0);hurt(t,S.dmg,u.owner);zapLine({x:ox,y:oy-16},t,'#2de2f5');
    for(let i=1;i<n;i++){const nx=G.foes.filter(e=>!hit.includes(e)&&targetable(e,src,S.air)&&Math.hypot(e.x-cur.x,e.y-cur.y)<70);if(!nx.length)break;const c=nx.reduce((a,b)=>Math.hypot(b.x-cur.x,b.y-cur.y)<Math.hypot(a.x-cur.x,a.y-cur.y)?b:a);hurt(c,S.dmg*.8,u.owner);zapLine(cur,c,'#7ff');hit.push(c);cur=c;}
    SFX.gadget();break;}
   case 'pulse':case 'slow':case 'pull':case 'smoke':case 'kick':case 'mech':{
    G.fx.push({k:'ring',x:ox,y:oy,t:0,r:S.range,col:u.U.col});
    for(const e of pool){hurt(e,S.dmg,u.owner);if(e.dead)continue;
     if(K==='slow'&&!e.air){e.slow=.45;e.slowT=1.2;if(G.fx.length<120)G.fx.push({k:'foam',x:e.x,y:e.y,t:0,v:Math.random()<.5?0:1});}
     if(K==='pull'&&!e.F.boss){e.s=Math.max(0,e.s-22-u.lvl*4);e.mag=1;}
     if(K==='smoke'&&!e.F.boss){e.conf=1.4+u.lvl*.3;}
     if(K==='kick'&&!e.F.boss){e.s=Math.max(0,e.s-26);e.stun=.4;}
     if(K==='mech'){e.stun=Math.max(e.stun,e.F.boss?.4:1.2);}}
    if(K==='pulse'||K==='mech')G.shake=Math.max(G.shake,K==='mech'?.25:.06);if(K==='pulse')beep(70,.12,'sine',.06,-30);break;}
  }}
 // ---------- specials
 G.fire=function(p,sp,x,y){const S=LD_SPECIALS.find(s=>s.id===sp);if(!S)return;if((G.cd[sp]||0)>0){fl(x,y,'Recharging','#9ab');SFX.hurt();return;}
  if(sp==='butt'){if(G.butt){fl(x,y,'Already flying!','#ff8a1a');return;}if(!G.foes.some(e=>!e.dead&&e.fall<=0)){fl(G.perch.x,G.perch.y-30,'No goons to smash!','#ffb');return;}}
  G.cd[sp]=S.cd*(1-.15*fort.fridge);const N=night?night.n:Math.min(10,1+G.wave/4);
  if(sp==='rain'){G.fx.push({k:'sfx',row:0,x,y,t:-.2,sc:.9});for(let i=0;i<14;i++)G.fx.push({k:'pizza',x:x+(Math.random()-.5)*150,y:y+(Math.random()-.5)*110,t:-i*.06});
   setTimeout(()=>{for(const e of G.foes)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<95)hurt(e,22+7*N,p,{special:1});G.shake=.25;},380);}
  if(sp==='emp'){G.fx.push({k:'sfx',row:1,x:G.end.x,y:G.end.y,t:0,sc:1.8});G.fx.push({k:'ring',x:G.end.x,y:G.end.y,t:0,r:700,col:'#2de2f5',big:1});for(const e of G.foes){if(e.dead)continue;e.stun=Math.max(e.stun,e.F.boss?.8:2.6);if(e.F.machine)hurt(e,30+8*N,p,{special:1});}SFX.gadget();}
  if(sp==='ice'){G.fx.push({k:'sfx',row:2,x,y,t:0,sc:1.4});G.fx.push({k:'ring',x,y,t:0,r:140,col:'#bff',big:1});for(const e of G.foes)if(!e.dead&&Math.hypot(e.x-x,e.y-y)<140)e.frz=Math.max(e.frz,e.F.boss?1.5:4);}
  if(sp==='drop'){G.fx.push({k:'sfx',row:3,x:W/2,y:H/2,t:0,sc:1.5});G.shake=.5;G.fx.push({k:'ring',x:W/2,y:H/2,t:0,r:700,col:'#b07aff',big:1});for(const e of G.foes)if(!e.dead)hurt(e,18+6*N,p,{special:1});beep(50,.5,'sine',.12,-20);}
  if(sp==='butt')G.butt=ldButtStart(G,p);
  G.used=(G.used||0)+1;};
 // ---------- update
 G.enter=()=>{startMusic(trackFor());};G.resume=()=>{startMusic(trackFor());};
 G.update=function(dt){G.t+=dt;if(G.state==='intro'){G.introT=(G.introT||0)+dt;if(G.introT>.4&&(anyPressed('ok')||anyPressed('attack')||anyPressed('jump'))){G.state='break';SFX.ok();}return;}
  if(G.state==='end'){G.endT+=dt;if(G.endT>1.2&&(anyPressed('ok')||anyPressed('back')||anyPressed('start'))){SFX.ok();ldFinish(G);}return;}
  if(G.paused){ldPauseUpdate(G);return;}
  if(anyPressed('start')){G.paused=true;G.psel=0;SFX.move();return;}
  for(let p=0;p<np;p++)ldCursorUpdate(G,p,dt);
  const steps=G.speed;for(let i=0;i<steps;i++)tick(dt);};
 function tick(dt){
  for(const k in G.cd)G.cd[k]=Math.max(0,G.cd[k]-dt);G.shake=Math.max(0,G.shake-dt*1.5);
  if(G.state==='break'){G.breakT-=dt;if(G.breakT<=0)startWave(false);}
  if(G.state==='wave'){G.waveT+=dt;G.nextSpawn-=dt;if(G.spawnQ.length&&G.nextSpawn<=0){const o=G.spawnQ.shift();const pi=G.paths.length>1?(Math.random()<.45?1:0):0;spawn(o.id,0,pi);G.nextSpawn=o.gap*(G.paths.length>1?.85:1);if(LD_FOES[o.id].boss){G.bossOn=1;startMusic(trackFor());fl(W/2,LD_HUD+50,LD_FOES[o.id].n.toUpperCase()+'!','#ff5a8a',24);}}
   if(!G.spawnQ.length&&!G.foes.some(e=>!e.dead)){ // wave cleared
    const b=20+2*G.wave;for(let p=0;p<np;p++)G.cash[p]+=b;fl(W/2,LD_HUD+40,'WAVE '+G.wave+' CLEAR! +$'+b+(np>1?' each':''),'#7f7',18);
    if(fort.repair){G.hp=Math.min(G.hpMax,G.hp+fort.repair);}
    if(G.bossOn){G.bossOn=0;startMusic(trackFor());}
    if(G.wave>=G.maxWaves){ldWin(G);return;}
    if(!night&&G.wave%10===0){const L=ldSave(),k=G.map.id;const got=Math.min(5,G.wave/10);if((L.estars[k]||0)<got){L.estars[k]=got;save();fl(W/2,LD_HUD+70,'ENDLESS STAR! ('+got+'/5 on this map)','#ffd23a',16);}}
    G.state='break';G.breakT=night?10:8;SFX.win();}}
  // foes
  for(const e of G.foes){if(e.dead){e.deadT+=dt;continue;}e.t+=dt;e.hit=Math.max(0,e.hit-dt);e.reveal=Math.max(0,e.reveal-dt);e.cd-=dt;e.shieldT=Math.max(0,e.shieldT-dt);
   if(e.fall>0){e.fall-=dt;continue;}
   if(e.F.regen)e.hp=Math.min(e.max,e.hp+e.max*e.F.regen*dt);
   let v=e.spd;if(e.slowT>0){e.slowT-=dt;v*=e.F.boss?Math.max(.6,e.slow):e.slow;}
   if(e.F.burst)v*=1+.8*Math.max(0,Math.sin(e.t*3));
   if(G.map.skylight&&e.pi===1&&!e.air)v*=1-[0,.2,.35,.5][fort.shutter];
   if(fort.traps&&!e.air&&e.s<120){v*=1-.1*fort.traps;if(Math.random()<dt*2)hurt(e,fort.traps,-1);}
   if(e.stun>0){e.stun-=dt;v=0;}if(e.frz>0){e.frz-=dt;v=0;}if(e.bub>0){e.bub-=dt;v=0;}
   if(e.conf>0){e.conf-=dt;v=-v*.6;}
   // robo guard holds goons
   for(const u of G.units)if(u.U.kind==='robo'&&!unitDisabled(u)&&!e.air&&!e.F.boss&&Math.hypot(u.unit.x-e.x,u.unit.y-e.y)<20&&v>0){v=0;if(u.cd<=0){hurt(e,ldStats(u.U,u.lvl,G).dmg,u.owner);u.cd=1/ldStats(u.U,u.lvl,G).rate;u.punch=.2;}}
   // fizzer: pops next to a tower and jams it
   if(e.F.fizz&&!e.fz){const near=G.units.find(u=>Math.hypot(u.x-e.x,u.y-e.y)<52);if(near){e.fz=1.1;}}
   if(e.fz){v=0;e.fz-=dt;if(e.fz<=0){for(const u of G.units)if(Math.hypot(u.x-e.x,u.y-e.y)<64&&!ldResist(G))u.off=Math.max(u.off,4);G.fx.push({k:'ring',x:e.x,y:e.y,t:0,r:64,col:'#7ef05a'});fl(e.x,e.y-20,'FIZZ POP!','#7ef05a',13);e.dead=1;e.deadT=0;continue;}}
   e.s+=v*dt;if(e.s<0)e.s=0;
   const p=ldAt(e.P,e.s);e.x=p[0];e.y=p[1];e.a=p[2];
   // goon tricks
   if(e.cd<=0){
    if(e.F.hack){const u=nearestUnit(e,95);if(u){if(ldResist(G))fl(u.x,u.y-20,'HACK BLOCKED','#7ff',10);else{u.off=3;fl(u.x,u.y-20,'HACKED!','#ff5ae0',11);zapLine(e,u,'#ff5ae0');}}e.cd=6;}
    else if(e.F.brick){const u=nearestUnit(e,105);if(u){G.fx.push({k:'brick',x:e.x,y:e.y-10,x2:u.x,y2:u.y,t:0});if(!ldResist(G))u.off=Math.max(u.off,1.5);}e.cd=5;}
    else if(e.F.net){const u=nearestUnit(e,150);if(u){G.fx.push({k:'net',x:u.x,y:u.y,t:0});if(!ldResist(G))u.off=5;fl(u.x,u.y-22,'NETTED!','#ffd23a',12);}e.cd=7;}
    else if(e.F.slam){e.stun=.5;G.shake=.4;G.fx.push({k:'ring',x:e.x,y:e.y,t:0,r:95,col:'#ff8a1a'});for(const u of G.units)if(Math.hypot(u.x-e.x,u.y-e.y)<95&&!ldResist(G))u.off=Math.max(u.off,2);fl(e.x,e.y-40,'SLAM!','#ff8a1a',16);e.cd=9;}
    else if(e.F.dropper){for(let i=0;i<2;i++){const [s]=ldNearS(G.paths[0],e.x,e.y);spawn('chute',Math.max(10,s+(i?30:-30)),0,{fall:1.2});}fl(e.x,e.y-50,'SANDBAGS AWAY!','#ffb',12);e.cd=8;}
    else e.cd=5;}
   if(e.F.summon){const ph=e.hp<e.max*.33?2:e.hp<e.max*.66?1:0;if(ph>e.phase){e.phase=ph;e.shieldT=3;fl(e.x,e.y-60,ph===1?'GET THEM, BOYS!':'EVERYBODY! NOW!','#ff5a8a',16);
     const L=['walker','runner','brute','redbelt','pinkbelt','crab','fizzer','gloom'];for(let i=0;i<6+ph*3;i++)G.spawnQ.unshift({id:L[i%L.length],gap:.35});}}
   if(e.s>=e.P.len-1){e.dead=1;e.deadT=9;e.reached=1;
    let d=e.F.dmg;if(e.F.big||e.F.boss)d=Math.max(1,d-fort.walls);
    if(G.shield>0&&!(e.id==='baldey')){G.shield--;fl(G.end.x,G.end.y-30,'SHIELD!','#7ff',14);}else{G.hp-=d;G.hitsTaken+=d;G.shake=.3;SFX.hurt();fl(G.end.x,G.end.y-30,'-'+d,'#ff5a5a',16);}
    if(G.hp<=0){G.hp=0;ldLose(G);return;}}}
  G.foes=G.foes.filter(e=>!(e.dead&&e.deadT>.6));
  for(const u of G.units)updUnit(u,dt);
  // shots
  for(const s of G.shots){const tg=s.e&&!s.e.dead?s.e:null;if(tg){s.tx=tg.x;s.ty=tg.y-(tg.air?20:8);}
   const dx=s.tx-s.x,dy=s.ty-s.y,l=Math.hypot(dx,dy);s.ang=Math.atan2(dy,dx);
   if(l<10){s.done=1;
    if(s.splash){G.fx.push({k:'boom',x:s.tx,y:s.ty,t:0,r:s.splash});for(const e of G.foes)if(!e.dead&&Math.hypot(e.x-s.tx,e.y-s.ty)<s.splash&&(e.air?s.u&&ldStats(s.u.U,s.u.lvl,G).air:1))hurt(e,s.dmg,s.who);}
    else if(tg){hurt(tg,s.dmg,s.who);if(!tg.dead){if(s.push&&!tg.F.boss)tg.s=Math.max(0,tg.s-s.push);if(s.bub&&!tg.F.boss)tg.bub=s.bub;if(s.frz)tg.frz=tg.F.boss?s.frz*.4:s.frz;if(s.stun)tg.stun=Math.max(tg.stun,tg.F.boss?.15:s.stun);
      if(s.slowM){tg.slow=s.slowM;tg.slowT=s.slowT;}if(s.ham&&!tg.F.boss&&Math.random()<s.ham){fl(tg.x,tg.y-22,'HAMSTER!','#ffb36a',13);G.fx.push({k:'ham',x:tg.x,y:tg.y,t:0});kill(tg,s.who);}}
     if(s.bounce>0){const nx=G.foes.filter(e=>e!==tg&&!e.dead&&e.fall<=0&&Math.hypot(e.x-tg.x,e.y-tg.y)<80);if(nx.length){s.done=0;s.e=nx[0];s.bounce--;s.x=tg.x;s.y=tg.y-10;}}
     if(s.pierce>0){s.hitL.push(tg);const nx=G.foes.filter(e=>!s.hitL.includes(e)&&!e.dead&&e.fall<=0&&Math.hypot(e.x-tg.x,e.y-tg.y)<60);if(nx.length){s.done=0;s.e=nx[0];s.pierce--;}}}}
   else{s.x+=dx/l*s.spd*dt;s.y+=dy/l*s.spd*dt;}}
  G.shots=G.shots.filter(s=>!s.done);
  for(const f of G.fx)f.t+=dt;G.fx=G.fx.filter(f=>f.t<(f.k==='jet'?1.6:f.k==='ham'?1.2:f.k==='sfx'?.8:.6));
  for(const f of G.floats){f.life-=dt;f.y-=22*dt;}G.floats=G.floats.filter(f=>f.life>0);
  if(G.butt)ldButtUpdate(G,dt);}
 function nearestUnit(e,R){let b=null,bd=R;for(const u of G.units){const d=Math.hypot(u.x-e.x,u.y-e.y);if(d<bd&&u.off<=0){bd=d;b=u;}}return b;}
 G.draw=()=>ldDraw(G);
 return G;}
function ldResist(G){return Math.random()<[0,.33,.66,1][G.fort.plating];}

// ---------- ATOMIC BUTT BOMB: Agent Coco jetpacks off his perch and butt-slams up to 12 goons (one hit each, bosses too)
function ldButtStart(G,p){const B={p,ph:'launch',t:0,x:G.perch.x,y:G.perch.y,z:0,hits:0,max:12,from:null,to:null,hop:0};
 G.float(G.perch.x,G.perch.y-40,'ATOMIC BUTT BOMB!!','#ff8a1a',20);if(typeof beep==='function'){beep(200,.5,'sawtooth',.06,600);}return B;}
function ldButtNext(G,B){const live=G.foes.filter(e=>!e.dead&&e.fall<=0&&!e.buttMark);if(!live.length||B.hits>=B.max)return null;
 return live.reduce((a,b)=>Math.hypot(b.x-B.x,b.y-B.y)<Math.hypot(a.x-B.x,a.y-B.y)?b:a);}
function ldButtUpdate(G,dt){const B=G.butt;B.t+=dt;
 if(B.ph==='launch'){B.z=Math.max(0,B.t-.3)*300;if(B.t>.8){B.ph='aim';B.t=0;}return;}
 if(B.ph==='aim'||B.ph==='hop'){if(B.ph==='aim'||!B.to||B.to.dead){const n=ldButtNext(G,B);if(!n){B.ph='home';B.t=0;B.from={x:B.x,y:B.y,z:B.z};return;}n.buttMark=1;B.to=n;B.from={x:B.x,y:B.y,z:B.z};B.ph='hop';B.t=0;}
  const dur=B.hits?.42:.6,k=Math.min(1,B.t/dur);B.x=B.from.x+(B.to.x-B.from.x)*k;B.y=B.from.y+(B.to.y-B.from.y)*k;B.z=(1-k)*B.from.z+Math.sin(k*Math.PI)*90*(B.hits?1:.3);B.drop=k>.6;
  if(k>=1){const e=B.to;B.hits++;e.buttMark=0;if(!e.dead){e.hp=0;e.flat=LD_FLAT_ART.includes(e.F.art)&&!e.F.boss;G.kill(e,B.p);}G.shake=.35;B.hitT=G.t;G.fx.push({k:'butt',x:e.x,y:e.y,t:0,last:B.hits>=B.max});G.float(e.x,e.y-30,['SMASH!','BOOM!','SQUISH!','BONK!','POW!'][B.hits%5],'#ff8a1a',16);
   beep(90,.18,'sawtooth',.1,-60);B.x=e.x;B.y=e.y;B.z=0;B.t=0;B.to=null;B.ph=B.hits>=B.max?'home':'aim';if(B.ph==='aim'){B.ph='hop';B.to=ldButtNext(G,B);if(B.to){B.to.buttMark=1;B.from={x:B.x,y:B.y,z:0};}else{B.ph='home';}}
   if(B.ph==='home')B.from={x:B.x,y:B.y,z:B.z};}
  return;}
 if(B.ph==='home'){const k=Math.min(1,B.t/.8);B.x=B.from.x+(G.perch.x-B.from.x)*k;B.y=B.from.y+(G.perch.y-B.from.y)*k;B.z=Math.sin(k*Math.PI)*110;
  if(k>=1){G.float(G.perch.x,G.perch.y-30,B.hits+' GOONS SMASHED!','#ffd23a',16);G.butt=null;G.perchLand=G.t;if(B.hits)G.fx.push({k:'butt',x:B.from.x,y:B.from.y,t:0,mush:1});}}}
// goons that get the flattened-goon frames (bb_c 4-7) when the Butt Bomb lands on them
const LD_FLAT_ART=['walker','meatball','chute','thrower','techie','sneak','flyer','cart','karate_red','karate_pink','brute','blockhead'];
function ldDrawButt(G){const B=G.butt;if(!B)return;if(ldDrawButtArt(G,B))return;const x=B.x,y=Math.max(LD_HUD+34,B.y-B.z);
 ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(B.x,B.y+2,14,5,0,0,7);ctx.fill();
 if(B.ph==='hop'&&B.to){ctx.save();ctx.translate(B.to.x,B.to.y);ctx.rotate(G.t*4);ctx.strokeStyle='#ff3a3a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,14,0,7);ctx.moveTo(-18,0);ctx.lineTo(18,0);ctx.moveTo(0,-18);ctx.lineTo(0,18);ctx.stroke();ctx.restore();}
 // jetpack flames
 const fl=6+Math.random()*6;ctx.fillStyle='#2de2f5';ctx.beginPath();ctx.moveTo(x-9,y-14);ctx.lineTo(x-6,y-14+fl+6);ctx.lineTo(x-3,y-14);ctx.fill();ctx.beginPath();ctx.moveTo(x+3,y-14);ctx.lineTo(x+6,y-14+fl+6);ctx.lineTo(x+9,y-14);ctx.fill();
 const frame=B.drop?'crouch':(B.ph==='launch'?'jump':'somer_2');
 if(SHEETS.agent_coco)drawSprite('agent_coco',SHEETS.agent_coco.frames[frame]?frame:'jump',x,y,B.to&&B.to.x<x,1,.5);else{ctx.fillStyle='#2d3a8a';ctx.fillRect(x-8,y-26,16,24);}
 rrect(x-11,y-26,8,14,3,'#d83a3a','#000',1.5);}

// Michael's Butt Bomb sheets: bb_a (launch crouch/flip/upside-down/fly-up 0-3, hover thumbs-up 4-7, perch landing 8-11, FX 12 starburst 13 shock ring 14 dust 15 pizza mushroom),
// bb_b (perch idle/watch/ready/lift-off 0-3, hover + point down 4-7, knees-up drop 8-11, butt-slam sit 12, impact 13, dust 14, bounce up 15), bb_c (reticle 0-3, flattened goon 4-7)
function ldDrawButtArt(G,B){if(!(IMG['ld/bb_a']&&IMG['ld/bb_a'].width&&IMG['ld/bb_b']&&IMG['ld/bb_b'].width))return false;
 const x=B.x,y=Math.max(LD_HUD+46,B.y-B.z),fl=B.to?B.to.x<x:G.perch.x>W/2,S=.42,wk=Math.floor(G.t*10)%4;
 if(B.z>2){ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(B.x,B.y+2,14,5,0,0,7);ctx.fill();}
 if(B.ph==='hop'&&B.to&&!B.to.dead&&!ldStripC('bb_c',Math.floor(G.t*8)%4,B.to.x,B.to.y-12,.3)){}
 let st='bb_b',f=4+wk;const since=B.hitT!=null?G.t-B.hitT:9;
 if(B.ph==='launch'){const t=B.t;if(t<.12){f=1;}else if(t<.3){f=2;}else if(t<.42){st='bb_a';f=0;}else if(t<.56){st='bb_a';f=1;}else if(t<.68){st='bb_a';f=2;}else{st='bb_a';f=3;}}
 else if(since<.12)f=12;else if(since<.24)f=15;
 else if(B.ph==='hop'){const dur=B.hits?.42:.6,k=Math.min(1,B.t/dur);if(k>.6)f=8+Math.min(3,Math.floor((k-.6)/.4*4));else if(!B.hits){st='bb_a';f=4+wk;}else f=4+wk%4;}
 else if(B.ph==='home'){const k=Math.min(1,B.t/.8);if(k>.75){st='bb_a';f=8+Math.min(1,Math.floor((k-.75)/.25*2));}else{st='bb_a';f=4+wk;}}
 const by=(st==='bb_a'&&(f===8||f===9))||(st==='bb_b'&&f<3)?y+8:y+4;
 ldStrip(st,f,x,by,S,fl);return true;}
// Coco waiting on his perch (watch check now and then, landing pose after a run)
function ldDrawPerchCoco(G){if(!(IMG['ld/bb_b']&&IMG['ld/bb_b'].width))return false;const p=G.perch,fl=p.x>W/2,since=G.perchLand!=null?G.t-G.perchLand:9;
 if(since<.5)return ldStrip('bb_a',since<.25?10:11,p.x,p.y+8,.36,fl);const c=G.t%6;return ldStrip('bb_b',c>4.6&&c<5.6?1:0,p.x,p.y+8,.36,fl);}

// ---------- cursors and menus
function ldCursorUpdate(G,p,dt){const C=G.cursor[p];if(MUI.mouseRecent()&&p===0&&MUI.mx>=0&&!C.menu){C.x=MUI.mx;C.y=MUI.my;}
 const I=INPUT[p];
 if(C.menu){ldMenuUpdate(G,p);return;}
 const ax=AXES[p].x||((I.right?1:0)-(I.left?1:0)),ay=AXES[p].y||((I.down?1:0)-(I.up?1:0));
 C.x=Math.max(8,Math.min(W-8,C.x+ax*300*dt));C.y=Math.max(LD_HUD+6,Math.min(LD_BAR-6,C.y+ay*300*dt));
 // snap to nearest pad
 let best=null,bd=28;for(const pd of G.pads){const d=Math.hypot(pd.x-C.x,pd.y-C.y);if(d<bd){bd=d;best=pd;}}C.pad=best;
 if(pressed(p,'ok')||pressed(p,'jump')&&!(np1Space(p))){if(best)ldOpenMenu(G,p,best);else SFX.move();}
 if(pressed(p,'attack')){if(G.state==='break')G.callWave();else{G.sp[p]=(G.sp[p]+1)%G.specials.length;SFX.move();}}
 if(pressed(p,'gadget')){const S=G.specials[G.sp[p]];if(S)G.fire(p,S.id,C.x,C.y);}
 if(pressed(p,'back')&&G.np>1){const o=1-p;if(G.cash[p]>=25){G.cash[p]-=25;G.cash[o]+=25;G.gifted+=25;G.float(C.x,C.y-16,'GIFT $25 -> P'+(o+1),'#ffd23a',12);SFX.pick();}}}
function np1Space(p){return false;}
function ldOpenMenu(G,p,pad){const C=G.cursor[p];if(G.cursor.some((c,i)=>i!==p&&c.menu&&c.menu.pad===pad)){G.float(pad.x,pad.y-20,'Busy!','#ffb');return;}
 C.menu=pad.u?{pad,kind:'unit',sel:0}:{pad,kind:'build',tab:0,sel:0,scroll:0};SFX.ok();}
function ldMenuItems(G,M){if(M.kind==='unit'){const u=M.pad.u;return [{t:u.lvl>=5?'MAX LEVEL':'Upgrade  $'+ldUpCost(u.U,u.lvl),a:'up'},{t:'Target: '+u.mode.toUpperCase(),a:'mode'},{t:'Sell  +$'+Math.round(u.spent*.7),a:'sell'},{t:'Close',a:'close'}];}
 const list=(M.tab?LD_AGENTS:LD_GUNS);return list.map(U=>({U,t:U.n,c:ldBuyCost(U),lock:!ldUnlocked(U),have:M.tab&&G.units.some(u=>u.U.id===U.id)}));}
function ldMenuUpdate(G,p){const C=G.cursor[p],M=C.menu,I=ldMenuItems(G,M);
 if(pressed(p,'back')){C.menu=null;SFX.move();return;}
 if(pressed(p,'down')){M.sel=(M.sel+1)%I.length;SFX.move();}if(pressed(p,'up')){M.sel=(M.sel+I.length-1)%I.length;SFX.move();}
 if(M.kind==='build'&&(pressed(p,'left')||pressed(p,'right'))){M.tab=1-M.tab;M.sel=0;M.scroll=0;SFX.move();}
 if(M.kind==='build'){if(M.sel<M.scroll)M.scroll=M.sel;if(M.sel>=M.scroll+7)M.scroll=M.sel-6;}
 if(pressed(p,'ok')||pressed(p,'jump'))ldMenuDo(G,p,M.sel);}
function ldMenuDo(G,p,i){const C=G.cursor[p],M=C.menu,I=ldMenuItems(G,M),it=I[i];if(!it)return;M.sel=i;
 if(M.kind==='unit'){const u=M.pad.u;if(it.a==='up')G.upgrade(p,u);if(it.a==='mode'){u.mode={first:'strong',strong:'close',close:'first'}[u.mode];SFX.move();}if(it.a==='sell'){G.sell(p,u);C.menu=null;}if(it.a==='close'){C.menu=null;SFX.move();}return;}
 if(it.lock){G.float(M.pad.x,M.pad.y-20,'Unlock it in the Workshop ('+it.U.star+' stars)','#ffb',11);SFX.hurt();return;}
 if(it.have){G.float(M.pad.x,M.pad.y-20,'Already on the map','#ffb',11);SFX.hurt();return;}
 if(G.build(p,M.pad,it.U))C.menu=null;}
function ldPauseUpdate(G){const items=ldPauseItems(G);if(anyPressed('down')){G.psel=(G.psel+1)%items.length;SFX.move();}if(anyPressed('up')){G.psel=(G.psel+items.length-1)%items.length;SFX.move();}
 if(anyPressed('start')||anyPressed('back')){G.paused=false;SFX.move();return;}if(anyPressed('ok')||anyPressed('jump'))items[G.psel].fn();}
function ldPauseItems(G){return [{t:'Resume',fn:()=>{G.paused=false;}},{t:'Speed: '+(G.speed===1?'Normal':'Fast x2'),fn:()=>{G.speed=G.speed===1?2:1;SFX.move();}},
 {t:'Restart',fn:()=>{go(makeLairDefense(G.night?{night:G.night.n,np:G.np}:{endless:G.map.id,np:G.np}));}},{t:'Quit to Lair Defense menu',fn:()=>{G.result={quit:1};go(LDMenu);}}];}

// ---------- win / lose / results
function ldStarsFor(G){if(G.hp<=0)return 0;const f=G.hp/G.hpMax;return f>=.9?3:f>=.5?2:1;}
function ldWin(G){G.state='end';G.endT=0;stopMusic();playStinger&&playStinger('win');const L=ldSave(),n=G.night.n,st=ldStarsFor(G);
 const before=L.stars[n]||0;if(st>before)L.stars[n]=st;const tot=G.score[0]+G.score[1]+G.hp*100+st*500;G.total=tot;if(tot>(L.best[n]||0))L.best[n]=tot;
 G.result={win:1,stars:st,newStars:Math.max(0,st-before),code:LD_NIGHT_CODES[n+1]};SAVE.coins+=10*st;save();}
function ldLose(G){G.state='end';G.endT=0;stopMusic();playStinger&&playStinger('lose');const tot=G.score[0]+G.score[1];G.total=tot;G.result={win:0};
 if(!G.night){const L=ldSave(),k=G.map.id;L.endless[k]=L.endless[k]||[];const who=G.np>1?ldName(0)+' & '+ldName(1):ldName(0);
  L.endless[k].push({s:tot,w:G.wave,who});L.endless[k].sort((a,b)=>b.s-a.s);L.endless[k]=L.endless[k].slice(0,10);G.result.rank=L.endless[k].findIndex(r=>r.s===tot&&r.w===G.wave)+1;save();}}
function ldName(p){const c=p?p2Char():p1Char();return c==='agent_sisi'?'Sisi':c==='agent_sandy'?'Sandy':'Coco';}
function ldFinish(G){go(LDMenu);}
