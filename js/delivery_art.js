// ===== Pizza delivery art (v0.36): Michael's Seq 61-66 sheets, sliced by tools/slice_delivery.py into assets/delivery/ =====
// bike_<kid>_ride / _toss: 4-frame strips (104px square frames, bike faces UP, toss throws to the RIGHT, mirrored for left).
// fx_*: coco/sisi dizzy + tipped, boost1-4, skid1-2, dust, splash, bell, hop, impact, sparkle.
// car_*: 8 vehicles facing UP. house0-7 + barros: roofs seen from above, porch/door at the BOTTOM. prop_*: yard + street props.
// tex_*: seamless ground textures (lawn, gravel, sand, pavers, terracotta).
// Every function returns false (or does nothing) when its art is missing, so delivery.js falls back to the code drawing.
// Still code-drawn until the art comes: dogs, scooter kids, customers, HUD icons (Seq 67-68).
const DLV_CARS=['ev','suv','pickup','robotaxi','van','mail','icecream','garbage'],DLV_BIG={van:1,mail:1,garbage:1};
const DLV_TREES=['paloverde','palm','bougainvillea','paloverde','saguaro','barrel'];
const DLV_FILES=['bike_coco_ride','bike_coco_toss','bike_sisi_ride','bike_sisi_toss',
 'fx_coco_dizzy','fx_coco_tipped','fx_sisi_dizzy','fx_sisi_tipped','fx_boost1','fx_boost2','fx_boost3','fx_boost4','fx_skid1','fx_skid2','fx_dust','fx_splash','fx_bell','fx_hop','fx_impact','fx_sparkle',
 ...DLV_CARS.map(c=>'car_'+c),'house0','house1','house2','house3','house4','house5','house6','house7','barros',
 ...['paloverde','palm','saguaro','barrel','bougainvillea','pool','trampoline','mailbox','bins','sprinkler','fence','fencecorner','kidbike','gnome','lizardrock','lamp'].map(p=>'prop_'+p),
 'tex_lawn','tex_gravel','tex_sand','tex_pavers','tex_terracotta'];
DLV_FILES.forEach(n=>ASSET_LIST.push(['delivery/'+n,'assets/delivery/'+n+'.png']));
const dImg=n=>{const i=IMG['delivery/'+n];return i&&i.width?i:null;};
function dlvReady(){return !!(dImg('house0')&&dImg('barros')&&dImg('tex_gravel')&&dImg('tex_lawn'));}
function dlvKid(ch){return ch==='agent_coco'?'coco':ch==='agent_sisi'?'sisi':null;}
// car size in game pixels [width, length] (facing up)
function dlvCarSize(name){const i=dImg('car_'+name),w=DLV_BIG[name]?29:25;if(!i)return [26,48];return [w,Math.round(w*i.height/i.width)];}
function dImgAt(g,name,cx,cy,w,h,rot,alpha){const i=dImg(name);if(!i)return false;g.save();g.translate(cx,cy);if(rot)g.rotate(rot);if(alpha!=null)g.globalAlpha=alpha;
 if(h==null)h=w*i.height/i.width;g.drawImage(i,-w/2,-h/2,w,h);g.restore();return true;}

// ---------- the whole neighborhood painted once into one big picture (fast to scroll on handhelds) ----------
function dlvPaintBG(D,rng){if(!dlvReady())return null;
 const c=document.createElement('canvas');c.width=DMW;c.height=DMH;const g=c.getContext('2d');const T=D.tileType;
 const pat=n=>g.createPattern(dImg(n),'repeat');
 // lots: gravel everywhere, lawns in front of some houses
 g.fillStyle=pat('tex_gravel');g.fillRect(0,0,DMW,DMH);
 for(const h of D.houses)if(h.lawn){g.fillStyle=pat('tex_lawn');const y0=h.top?h.y-1.1*DT_:h.y,y1=h.top?h.y+h.h:h.y+h.h+1.1*DT_;g.fillRect(h.x-14,y0,h.w+28,y1-y0);}
 // roads and sidewalks
 for(let ty=0;ty<DNY;ty++)for(let tx=0;tx<DNX;tx++){const k=T(tx,ty),x=tx*DT_,y=ty*DT_;
  if(k==='road'){g.fillStyle='#44454e';g.fillRect(x,y,DT_,DT_);for(let i=0;i<10;i++){g.fillStyle=rng()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.12)';g.fillRect(x+rng()*DT_,y+rng()*DT_,2,2);}}
  else if(k==='walk'){g.fillStyle='#e6dfd0';g.fillRect(x,y,DT_,DT_);g.strokeStyle='#bfb5a2';g.lineWidth=1;g.strokeRect(x+.5,y+.5,DT_-1,DT_-1);}}
 // curbs where road meets sidewalk
 g.fillStyle='#8f8676';for(let ty=0;ty<DNY;ty++)for(let tx=0;tx<DNX;tx++){if(T(tx,ty)!=='road')continue;const x=tx*DT_,y=ty*DT_;
  if(T(tx,ty-1)==='walk')g.fillRect(x,y,DT_,3);if(T(tx,ty+1)==='walk')g.fillRect(x,y+DT_-3,DT_,3);if(T(tx-1,ty)==='walk')g.fillRect(x,y,3,DT_);if(T(tx+1,ty)==='walk')g.fillRect(x+DT_-3,y,3,DT_);}
 // lane dashes (skip intersections) and crosswalks at every intersection
 const dash=(x,y,w,h)=>{g.fillStyle='#1a1a1a';g.fillRect(x-1,y-1,w+2,h+2);g.fillStyle='#ffd23a';g.fillRect(x,y,w,h);};
 for(let ty=0;ty<DNY;ty++)for(let tx=0;tx<DNX;tx++){if(T(tx,ty)!=='road')continue;const mx=tx%DP,my=ty%DP,x=tx*DT_,y=ty*DT_;
  if(my===1&&mx>=3)dash(x+5,y+DT_/2-2,16,4);if(mx===1&&my>=3)dash(x+DT_/2-2,y+5,4,16);}
 g.fillStyle='rgba(255,255,255,.9)';
 for(let iy=0;iy<=DBY;iy++)for(let ix=0;ix<=DBX;ix++){const x0=ix*DP*DT_,y0=iy*DP*DT_,S=3*DT_;
  for(let i=0;i<6;i++){const o=6+i*15;
   if(y0>0)g.fillRect(x0+o,y0-11,8,9);if(y0+S<DMH)g.fillRect(x0+o,y0+S+2,8,9);
   if(x0>0)g.fillRect(x0-11,y0+o,9,8);if(x0+S<DMW)g.fillRect(x0+S+2,y0+o,9,8);}}
 // front paths, yard props, mailboxes
 const props=['gnome','lizardrock','kidbike','bins','barrel','bougainvillea'];
 for(const h of D.houses){const px=h.door.x-7,py0=h.top?h.y-1.1*DT_:h.y+h.h,py1=py0+1.1*DT_;g.fillStyle=pat(h.lawn?'tex_pavers':'tex_terracotta');g.fillRect(px,py0,14,py1-py0);
  g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1;g.strokeRect(px+.5,py0,13,py1-py0);
  const sy=h.top?py0+6:py1-6;dImgAt(g,'prop_mailbox',h.door.x+20,sy,18);
  if(rng()<.55){const p=props[Math.floor(rng()*props.length)],side=rng()<.5?-1:1,sz=p==='gnome'?12:p==='bins'?24:p==='kidbike'?24:p==='lizardrock'?18:20;
   dImgAt(g,'prop_'+p,h.door.x+side*(h.w/2-6),h.top?h.y-16:h.y+h.h+16,sz,null,p==='kidbike'?rng()*6:0);}}
 // street lamps on sidewalk corners
 for(let iy=0;iy<=DBY;iy++)for(let ix=0;ix<DBX;ix++){const x=(ix*DP+3.5)*DT_,y=(iy*DP-.5)*DT_;if(y>0&&y<DMH)dImgAt(g,'prop_lamp',x,y,26,null,-Math.PI/2);}
 // houses (doors face the street: top-row houses are turned around), Barro's, trees
 for(const h of D.houses){g.fillStyle='rgba(0,0,0,.22)';g.fillRect(h.x+5,h.y+5,h.w,h.h);dImgAt(g,'house'+h.spr,h.x+h.w/2,h.y+h.h/2,h.w+6,h.h+6,h.top?Math.PI:0);}
 const B=D.barros;g.fillStyle='rgba(0,0,0,.22)';g.fillRect(B.x+6,B.y+6,B.w,B.h);dImgAt(g,'barros',B.x+B.w/2,B.y+B.h/2,B.w+8,B.h+8);
 for(const t of D.trees){g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(t.x+5,t.y+6,t.r*1.2,t.r,0,0,7);g.fill();dImgAt(g,'prop_'+(t.kind||'paloverde'),t.x,t.y,t.r*2.9,null,t.rot||0);}
 return c;}

// ---------- riders ----------
function dlvDrawRider(D,R,x,y,hopS){const kid=dlvKid(R.ch);if(!kid||!dImg('bike_'+kid+'_ride'))return false;
 const SZ=72;ctx.save();ctx.translate(x,y);
 ctx.fillStyle='rgba(0,0,0,.22)';ctx.beginPath();ctx.ellipse(4,5,11+(hopS-1)*10,11+(hopS-1)*10,0,0,7);ctx.fill();
 ctx.rotate(R.a+Math.PI/2);
 if(R.crash>0){const i=dImg('fx_'+kid+'_tipped');if(i){const h=SZ*1.05,w=h*i.width/i.height;ctx.drawImage(i,-w/2,-h/2,w,h);ctx.restore();return true;}}
 if(R.dizzy>0&&R.crash<=0){const i=dImg('fx_'+kid+'_dizzy');if(i){ctx.rotate(Math.sin(D.t*18)*.12);const h=SZ*.86,w=h*i.width/i.height;ctx.drawImage(i,-w/2,-h/2,w,h);ctx.restore();return true;}}
 let strip=dImg('bike_'+kid+'_ride'),fr=R.v>4?Math.floor((R.pd||0)/16)%4:0;
 if(R.toss>0&&dImg('bike_'+kid+'_toss')){strip=dImg('bike_'+kid+'_toss');fr=Math.min(3,Math.floor((1-R.toss/.4)*4));if(R.tossL)ctx.scale(-1,1);}
 ctx.scale(hopS,hopS);const fw=strip.height;ctx.drawImage(strip,fr*fw,0,fw,fw,-SZ/2,-SZ/2,SZ,SZ);ctx.restore();return true;}
// effects under/behind a rider (boost flame, hop shadow, splash, bell wave)
function dlvRiderFx(D,R,x,y){if(!dImg('fx_boost1'))return false;
 if(R.slip>0)dImgAt(ctx,'fx_splash',x,y,46,null,0,Math.min(1,R.slip*2)*.8);
 if(R.hop>0)dImgAt(ctx,'fx_hop',x+6,y+8,30,null,0,.8);
 if(R.boost>0){const f=1+Math.floor(D.t*14)%4,back=R.a+Math.PI;ctx.save();ctx.translate(x+Math.cos(back)*30,y+Math.sin(back)*30);ctx.rotate(back+Math.PI/2);
  if(R.ch==='agent_sisi')ctx.filter='hue-rotate(110deg) saturate(1.3)';else if(R.ch==='agent_sandy')ctx.filter='hue-rotate(-150deg) saturate(1.5)';
  const i=dImg('fx_boost'+f);const h=20+f*7,w=h*i.width/i.height;ctx.drawImage(i,-w/2,-h,w,h);ctx.restore();}
 if(R.ring>0){const k=1-R.ring/.5;dImgAt(ctx,'fx_bell',x+Math.cos(R.a)*(26+k*30),y+Math.sin(R.a)*(26+k*30),30+k*40,null,R.a+Math.PI/2,1-k);}
 return true;}
// ---------- one-shot effects: impact star, dust, sparkles ----------
function dlvFx(D,name,x,y,life,s0,s1,rot){if(!dImg('fx_'+name))return false;(D.fxs=D.fxs||[]).push({name,x,y,t:0,life,s0,s1,rot:rot||0});return true;}
function dlvFxStep(D,dt){if(D.fxs){for(const f of D.fxs)f.t+=dt;D.fxs=D.fxs.filter(f=>f.t<f.life);}}
function dlvFxDraw(D,cx,cy){if(!D.fxs)return;for(const f of D.fxs){const k=f.t/f.life;dImgAt(ctx,'fx_'+f.name,f.x-cx,f.y-cy,f.s0+(f.s1-f.s0)*k,null,f.rot,1-k*k);}}
// ---------- cars and sprinklers ----------
function dlvDrawCar(c,x,y){const i=c.spr&&dImg('car_'+c.spr);if(!i)return false;const rot=c.horiz?(c.dir>0?Math.PI/2:-Math.PI/2):(c.dir>0?Math.PI:0);
 ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.roundRect(-c.w/2+4,-c.l/2+5,c.w,c.l,6);ctx.fill();
 ctx.drawImage(i,-c.w/2,-c.l/2,c.w,c.l);
 if(c.v<c.sp*.5){ctx.fillStyle='rgba(255,40,40,.9)';ctx.beginPath();ctx.arc(-c.w/2+5,c.l/2-2,3.5,0,7);ctx.arc(c.w/2-5,c.l/2-2,3.5,0,7);ctx.fill();}
 ctx.restore();return true;}
function dlvDrawSprinkler(D,s,x,y,on){if(!dImg('prop_sprinkler'))return false;
 if(on)dImgAt(ctx,'prop_sprinkler',x,y,s.r*2.2,null,D.t*3,.9);else{ctx.fillStyle='#2a8a9a';ctx.strokeStyle='#111';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();ctx.stroke();}
 return true;}

// ---------- Seq 67-68 (second batch): dogs, scooter kid, porch customers, HUD icons ----------
const DLV_ICONS=['box','box_open','box_stack','box_squished','temp_hot','temp_warm','temp_cold','steam','coin','tipjar','cash','stopwatch','arrow','ring','home','pin','bolt','bell','star','mood_happy','mood_party','mood_grumpy','mood_sleepy','heart'];
DLV_ICONS.forEach(n=>ASSET_LIST.push(['delivery/ic_'+n,'assets/delivery/ic_'+n+'.png']));
['dog_golden','dog_fluffy','scootkid','cust_dad','cust_grandpa','cust_bday'].forEach(n=>ASSET_LIST.push(['delivery/'+n,'assets/delivery/'+n+'.png']));
const dIc=n=>dImg('ic_'+n);
function dIcon(n,cx,cy,h,alpha,rot){const i=dIc(n);if(!i)return false;ctx.save();ctx.translate(cx,cy);if(rot)ctx.rotate(rot);if(alpha!=null)ctx.globalAlpha=alpha;const w=h*i.width/i.height;ctx.drawImage(i,-w/2,-h/2,w,h);ctx.restore();return true;}
// 4-frame strip, feet at (x,y)
function dStrip(n,fr,x,y,h,flip){const i=dImg(n);if(!i)return false;const fw=i.height;ctx.save();ctx.translate(x,y);if(flip)ctx.scale(-1,1);ctx.drawImage(i,fr*fw,0,fw,fw,-h/2,-h,h,h);ctx.restore();return true;}
function dlvDrawDog(D,d,x,y){const n=d.breed==='fluffy'?'dog_fluffy':'dog_golden';if(!dImg(n))return false;
 const dx=d.x-(d.px==null?d.x:d.px),dy=d.y-(d.py==null?d.y:d.py);d.px=d.x;d.py=d.y;if(Math.abs(dx)+Math.abs(dy)>.3){d.fx=dx;d.fy=dy;}
 const moving=(d.state==='chase'||d.state==='home'||(d.state==='calm'&&Math.abs(dx)+Math.abs(dy)>.3)),run=Math.floor(D.t*10)%2;let fr=0,flip=false;
 ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(x,y+9,11,4,0,0,7);ctx.fill();
 if(d.state==='alert')fr=1;
 else if(moving){const sx=d.fx||0,sy=d.fy||0;
  if(Math.abs(sx)>Math.abs(sy)){flip=sx<0;fr=n==='dog_golden'?3:(d.state==='chase'&&run?3:2);}
  else if(sy<0)fr=n==='dog_golden'?2:2;else fr=n==='dog_golden'?run:(d.state==='chase'&&run?1:0);}
 return dStrip(n,fr,x,y+12,36,flip);}
function dlvDrawKid(D,k,x,y){if(!dImg('scootkid'))return false;ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(x,y+10,12,4,0,0,7);ctx.fill();
 return dStrip('scootkid',k.calm>0?3:2,x,y+14,40,k.dir<0);}
// customer on the porch: waiting, waving when a rider is near, catching then cheering after the delivery
function dlvDrawCustomer(D,o,x,y){const n='cust_'+(o.cust||'dad');if(!dImg(n))return false;let fr=0;
 if(o.done){const t=D.t-(o.doneT||0);if(t>1.8)return true;fr=t<.5?2:3;}
 else if(D.riders.some(R=>Math.hypot(R.x-o.h.door.x,R.y-o.h.door.y)<220))fr=1;
 return dStrip(n,fr,x,y,o.cust==='bday'?32:36,false);}
function dlvMood(o){return o.rush?'stopwatch':o.mood.k==='bday'?'mood_party':o.mood.k==='grumpy'||o.mood.k==='dog'?'mood_grumpy':o.mood.k==='neighbor'?'mood_sleepy':'mood_happy';}
