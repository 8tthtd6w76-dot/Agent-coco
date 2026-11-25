// ===== Level kits: Michael's painted level art (Sequences 44-48) over the code themes =====
// Each Gilbert mission theme gets painted SEGMENTS (2:1 images, ground line at fraction g of the height) laid end to end:
// a start segment, middle segments repeating, and an end segment that reaches the end of the level.
// Segments are drawn with their top at y=0 and scaled so their ground line sits exactly on the level ground (L.gy).
// SEAM props stand on every join to hide where two floors meet. PLAT pieces (left cap, middle, right cap) draw platforms.
// If an image hasn't loaded, the old code-drawn theme is used, so the game never breaks.
const LEVEL_KITS={
 gilbert_night:{start:'seg44_2',mids:['seg44_3','seg44_4'],end:'seg44_5',
  seams:['m1_lamp','m1_planter','m1_cactus','m1_hydrant','m1_barrier'],seamH:[118,62,92,56,48],
  plat:{l:'m1_awn_l',m:'m1_awn_m',r:'m1_awn_r',mode:'ledge'}},
 gilbert_rooftops:{start:'seg45_2',mids:['seg45_2'],end:'seg45_4',
  seams:['m2_cooler','m2_vent','m2_tank','m2_antennas'],seamH:[70,72,104,96]},
 gilbert_craneyard:{start:'seg46_2',mids:['seg46_3','seg46_2'],end:'seg46_4',
  seams:['m3_flood','m3_porta','m3_spool','m3_barrel','m3_sandbags'],seamH:[120,104,74,62,46],
  plat:{l:'m3_cont_l',m:'m3_cont_m',r:'m3_cont_r',mode:'box',rail:.22}},
 gilbert_wreckingyard:{start:'seg47_2',mids:['seg47_3'],end:'seg47_4',
  seams:['m3_barrel','m1_barrier','m3_sandbags'],seamH:[62,48,46],
  plat:{l:'m5_rack_l',m:'m5_rack_m',r:'m5_rack_r',mode:'box',rail:0}}
};
// ground line of each painted segment (fraction of its height) and the floor colour under it
const KIT_SEGS={seg44_2:{g:.834,bot:'#49434f'},seg44_3:{g:.853,bot:'#9d342e'},seg44_4:{g:.752,bot:'#a3302e'},seg44_5:{g:.849,bot:'#da5b25'},
 seg45_2:{g:.826,bot:'#825b55'},seg45_3:{g:.822,bot:'#be361c'},seg45_4:{g:.812,bot:'#3e0d06'},
 seg46_2:{g:.812,bot:'#bc484e'},seg46_3:{g:.811,bot:'#c85430'},seg46_4:{g:.788,bot:'#527876'},
 seg47_2:{g:.83,bot:'#bb504e'},seg47_3:{g:.835,bot:'#b93d3c'},seg47_4:{g:.83,bot:'#e05e18'}};
(function(){const seen=new Set();for(const k in LEVEL_KITS){const K=LEVEL_KITS[k];[K.start,K.end,...K.mids].forEach(n=>seen.add(n+'.jpg'));(K.seams||[]).forEach(n=>seen.add(n+'.png'));
  if(K.plat)['l','m','r'].forEach(s=>seen.add(K.plat[s]+'.png'));}
 for(const f of seen)ASSET_LIST.push(['kit/'+f.replace(/\.(jpg|png)$/,''),'assets/kit/'+f]);
 ASSET_LIST.push(['kit/hack_gilbert','assets/kit/hack_gilbert.jpg'],['kit/hack_frame','assets/kit/hack_frame.jpg']);})();
const kitImg=n=>{const i=IMG['kit/'+n];return i&&i.complete&&i.naturalWidth?i:null;};
// lay out the segments for one level (cached on L). Each segment after the first overlaps the one before by OV of its width
// and fades in over that overlap, so the painted skies blend instead of meeting at a hard line.
const KIT_OV=.07,KIT_FADE={};
function kitFaded(n){if(KIT_FADE[n])return KIT_FADE[n];const im=kitImg(n);const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;
 const g=c.getContext('2d');g.drawImage(im,0,0);const gr=g.createLinearGradient(0,0,c.width*KIT_OV,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,1)');
 g.globalCompositeOperation='destination-in';g.fillStyle=gr;g.fillRect(0,0,c.width,c.height);return KIT_FADE[n]=c;}
function kitLayout(L,K){if(L._kit)return L._kit;const gy=L.gy,out=[];let x=0,i=0;
 const size=n=>{const g=KIT_SEGS[n].g,h=gy/g;return [h*(KIT_SEGS[n].ar||2),h];};
 const push=n=>{const [w,h]=size(n);if(out.length)x-=w*KIT_OV;out.push({n,x,w,h,fade:out.length>0});x+=w;};
 push(K.start);const endW=size(K.end)[0]*(1-KIT_OV);while(x+endW<L.ww){push(K.mids[i%K.mids.length]);i++;}push(K.end);
 return L._kit=out;}
function kitReady(K){return [K.start,K.end,...K.mids].every(kitImg);}
function kitBg(L,K){const segs=kitLayout(L,K),c=L.cam;
 for(const s of segs){const x=s.x-c;if(x>W||x+s.w<0)continue;ctx.drawImage(s.fade?kitFaded(s.n):kitImg(s.n),Math.floor(x),0,Math.ceil(s.w)+1,s.h);
  if(s.h<H){ctx.fillStyle=KIT_SEGS[s.n].bot;ctx.fillRect(Math.floor(x),s.h-1,Math.ceil(s.w)+1,H-s.h+1);}}
 // a prop on every join hides where two floors meet
 if(K.seams)for(let i=1;i<segs.length;i++){const sx=segs[i].x+segs[i].w*KIT_OV/2-c;if(sx<-120||sx>W+120)continue;const j=(i-1)%K.seams.length,im=kitImg(K.seams[j]);if(!im)continue;
  const h=K.seamH[j],w=im.width*h/im.height;ctx.drawImage(im,sx-w/2,L.gy-h+4,w,h);}}
// left cap + repeating middle + right cap, all scaled to height h
function kitStrip(P,x,y,w,h){const l=kitImg(P.l),m=kitImg(P.m),r=kitImg(P.r);if(!l||!m||!r)return false;
 let wl=l.width*h/l.height,wr=r.width*h/r.height;const wm=m.width*h/m.height;
 if(wl+wr>=w){const k=w/(wl+wr);wl*=k;wr*=k;ctx.drawImage(l,x,y,wl,h);ctx.drawImage(r,x+wl,y,wr,h);return true;}
 ctx.save();ctx.beginPath();ctx.rect(x+wl-1,y,w-wl-wr+2,h);ctx.clip();for(let mx=x+wl-2;mx<x+w-wr;mx+=wm-2)ctx.drawImage(m,mx,y,wm,h);ctx.restore();
 ctx.drawImage(l,x,y,wl,h);ctx.drawImage(r,x+w-wr,y,wr,h);return true;}
function kitPlatform(L,K,p,x){const P=K.plat,GY=L.gy,w=p[2];
 if(P.mode==='ledge'){// tiled awning roof as a ledge, teal posts down to the ground
  const l=kitImg(P.l);if(!l)return false;const rh=30;
  ctx.fillStyle='#1f8a8a';ctx.strokeStyle='#12121e';ctx.lineWidth=2;for(const px of [x+10,x+w-16]){ctx.fillRect(px,p[1]+rh-6,6,GY-p[1]-rh+6);ctx.strokeRect(px,p[1]+rh-6,6,GY-p[1]-rh+6);}
  const roof=n=>{const i=kitImg(n);return {i,sh:i.height*.42};};
  const R=[roof(P.l),roof(P.m),roof(P.r)];const ws=R.map(o=>o.i.width*rh/o.sh);
  ctx.save();ctx.beginPath();ctx.rect(x-6,p[1]-4,w+12,rh+4);ctx.clip();
  let wl=Math.min(ws[0],w/2),wr=Math.min(ws[2],w/2);
  for(let mx=x+wl-2;mx<x+w-wr;mx+=ws[1]-2)ctx.drawImage(R[1].i,0,0,R[1].i.width,R[1].sh,mx,p[1]-4,ws[1],rh+4);
  ctx.drawImage(R[0].i,0,0,R[0].i.width,R[0].sh,x-6,p[1]-4,wl+6,rh+4);ctx.drawImage(R[2].i,0,0,R[2].i.width,R[2].sh,x+w-wr,p[1]-4,wr+6,rh+4);
  ctx.restore();return true;}
 // box: the piece fills from the platform top to the ground; `rail` = share of the piece above the walkable top (stair rails)
 const h=GY-p[1],ph=h/(1-(P.rail||0));return kitStrip(P,x,GY-ph,w,ph);}
// wrap the themes: painted art when loaded, code art otherwise
function kitWrapTheme(k){const T=THEMES[k],K=LEVEL_KITS[k];if(!T||T._kit)return;T._kit=1;const bg0=T.bg,pl0=T.platform;
 T.bg=function(L){if(SETTINGS.paintedBg!==false&&kitReady(K))kitBg(L,K);else bg0.call(T,L);};
 T.platform=function(L,p,x){if(SETTINGS.paintedBg!==false&&K.plat&&kitReady(K)&&kitPlatform(L,K,p,x))return;pl0.call(T,L,p,x);};}
for(const k in LEVEL_KITS)kitWrapTheme(k);
