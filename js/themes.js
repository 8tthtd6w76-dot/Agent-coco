// ===== Themes: procedural backgrounds and platform styles per territory =====
// A theme has bg(L) (sky to ground) and platform(L,p,x) (one platform at screen x).
const THEMES={};

THEMES.gilbert_night={
 bg(L){const c=L.cam,GY=L.gy;
  let g=ctx.createLinearGradient(0,0,0,GY);g.addColorStop(0,'#150a3e');g.addColorStop(.6,'#4a1f80');g.addColorStop(1,'#b0407a');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<70;i++){const x=((hsh(i)*1400-c*.03)%W+W)%W,y=hsh(i+50)*230,tw=.6+.4*Math.sin(TIME*2+i);ctx.fillStyle=`rgba(255,255,255,${.5*tw})`;ctx.fillRect(x,y,2,2);}
  ctx.fillStyle='#ffe9a8';ctx.beginPath();ctx.arc(520-c*.04,70,24,0,7);ctx.fill();ctx.fillStyle='#4a1f80';ctx.beginPath();ctx.arc(530-c*.04,64,22,0,7);ctx.fill();
  // Baldey's tower glowing far away
  const tx=360-c*.06;ctx.fillStyle='rgba(220,60,255,.18)';ctx.beginPath();ctx.moveTo(tx,250);ctx.lineTo(tx-60,0);ctx.lineTo(tx+60,0);ctx.fill();
  ctx.fillStyle='#2a0e55';ctx.fillRect(tx-10,215,20,40);ctx.fillRect(tx-5,195,10,20);ctx.fillStyle='#ff4aff';ctx.fillRect(tx-2,198,4,40);
  // mountains
  ctx.fillStyle='#2b1260';ctx.beginPath();ctx.moveTo(0,H);for(let x=0;x<=W+40;x+=40){const wx=x+c*.15;ctx.lineTo(x,300-hsh(Math.floor(wx/40))*70-30);}ctx.lineTo(W,H);ctx.fill();
  // mid: buildings, cranes, water tower
  const m=c*.4;for(let k=Math.floor(m/170)-1;k<Math.floor((m+W)/170)+2;k++){const x=k*170-m,h=60+hsh(k)*110,w=110+hsh(k+7)*40;
   ctx.fillStyle='#231053';ctx.fillRect(x,GY-h-10,w,h+10);ctx.strokeStyle='#0c0624';ctx.lineWidth=2;ctx.strokeRect(x,GY-h-10,w,h+10);
   for(let wy=GY-h;wy<GY-20;wy+=20)for(let wx=x+10;wx<x+w-14;wx+=22){ctx.fillStyle=hsh(wx*.1+wy+k)>.45?'#ffd966':'#3a2a70';ctx.fillRect(wx,wy,10,12);}
   if(k%4===0){ctx.fillStyle='#e8a000';ctx.fillRect(x+w/2-3,GY-h-170,6,160);ctx.fillRect(x+w/2-70,GY-h-170,150,6);ctx.fillRect(x+w/2+60,GY-h-170,3,40);ctx.fillStyle='#ff3030';ctx.fillRect(x+w/2-70,GY-h-176,5,5);}
   if(k%5===2){ctx.fillStyle='#d9d4e8';ctx.beginPath();ctx.ellipse(x+w/2,GY-h-62,26,22,0,0,7);ctx.fill();ctx.strokeStyle='#0c0624';ctx.stroke();ctx.fillStyle='#8a82a8';ctx.fillRect(x+w/2-3,GY-h-42,6,40);}}
  // near: fence, cones, lights, cacti
  const n=c*.75;for(let k=Math.floor(n/260)-1;k<Math.floor((n+W)/260)+2;k++){const x=k*260-n;
   ctx.strokeStyle='#6a6a8a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+20,GY-52);ctx.lineTo(x+160,GY-52);ctx.moveTo(x+20,GY-12);ctx.lineTo(x+160,GY-12);for(let f=0;f<=140;f+=14){ctx.moveTo(x+20+f,GY-52);ctx.lineTo(x+20+f,GY);}ctx.stroke();
   ctx.fillStyle='#3b2a14';ctx.fillRect(x+200,GY-110,5,110);ctx.fillStyle='#ffe28a';ctx.beginPath();ctx.arc(x+202,GY-114,7,0,7);ctx.fill();ctx.fillStyle='rgba(255,226,138,.15)';ctx.beginPath();ctx.arc(x+202,GY-114,34,0,7);ctx.fill();
   if(k%2){ctx.fillStyle='#2f9a4a';ctx.strokeStyle='#0c2a14';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(x+100,GY-70,16,70,8);ctx.roundRect(x+84,GY-52,12,8,3);ctx.roundRect(x+84,GY-52,8,30,4);ctx.roundRect(x+120,GY-44,8,28,4);ctx.fill();ctx.stroke();}
   ctx.fillStyle='#ff7a1a';ctx.beginPath();ctx.moveTo(x+60,GY);ctx.lineTo(x+66,GY-22);ctx.lineTo(x+72,GY);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(x+63,GY-14,6,3);}
  // ground: sidewalk + street
  ctx.fillStyle='#7a6a7e';ctx.fillRect(0,GY,W,34);ctx.fillStyle='#5a4a62';for(let x=-(c%48);x<W;x+=48)ctx.fillRect(x,GY,3,34);ctx.fillStyle='#2a2438';ctx.fillRect(0,GY+34,W,H);ctx.fillStyle='#e0b020';for(let x=-(c%60);x<W;x+=60)ctx.fillRect(x,GY+56,30,4);ctx.fillStyle='#000';ctx.fillRect(0,GY,W,3);},
 // scaffolding plank on yellow poles
 platform(L,p,x){const GY=L.gy;
  ctx.fillStyle='#e8a000';for(let px=x+6;px<x+p[2];px+=40)ctx.fillRect(px,p[1],5,GY-p[1]);
  ctx.fillStyle='#b97a30';ctx.fillRect(x,p[1],p[2],14);ctx.strokeStyle='#2a1408';ctx.lineWidth=3;ctx.strokeRect(x,p[1],p[2],14);ctx.fillStyle='#d99a50';ctx.fillRect(x+2,p[1]+2,p[2]-4,3);
  ctx.fillStyle='#fff';ctx.fillRect(x+p[2]/2-1,p[1]+16,2,2);}
};

// ---- shared pieces for the other Gilbert themes ----
function skyNight(L,top,mid,bot,moonX=520){const c=L.cam;let g=ctx.createLinearGradient(0,0,0,L.gy);g.addColorStop(0,top);g.addColorStop(.6,mid);g.addColorStop(1,bot);ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 for(let i=0;i<60;i++){const x=((hsh(i)*1400-c*.03)%W+W)%W,y=hsh(i+50)*220,tw=.6+.4*Math.sin(TIME*2+i);ctx.fillStyle=`rgba(255,255,255,${.5*tw})`;ctx.fillRect(x,y,2,2);}
 ctx.fillStyle='#ffe9a8';ctx.beginPath();ctx.arc(moonX-c*.04,70,24,0,7);ctx.fill();ctx.fillStyle=mid;ctx.beginPath();ctx.arc(moonX+10-c*.04,64,22,0,7);ctx.fill();}
function farCity(L,col,lit,base,par=.25,step=120){const c=L.cam*par;for(let k=Math.floor(c/step)-1;k<Math.floor((c+W)/step)+2;k++){const x=k*step-c,h=40+hsh(k*3.1)*90,w=step-14;
 ctx.fillStyle=col;ctx.fillRect(x,base-h,w,h);for(let wy=base-h+8;wy<base-8;wy+=14)for(let wx=x+6;wx<x+w-8;wx+=14){if(hsh(wx*.3+wy*.7+k)>.62){ctx.fillStyle=lit;ctx.fillRect(wx,wy,6,7);}}}}
function crane(x,base,h,arm,col='#e8a000'){ctx.fillStyle=col;ctx.fillRect(x-4,base-h,8,h);for(let y=base-h+10;y<base;y+=18){ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-4,y,8,3);ctx.fillStyle=col;}
 ctx.fillRect(x-arm*.3,base-h,arm,7);ctx.fillRect(x+arm*.62,base-h,3,50+Math.sin(TIME+x)*6);ctx.fillStyle='#555';ctx.fillRect(x+arm*.62-6,base-h+50+Math.sin(TIME+x)*6,15,10);ctx.fillStyle='#ff3030';if(Math.floor(TIME*1.5+x)%2)ctx.fillRect(x-3,base-h-6,6,6);}

// Mission 2: rooftops above Gilbert's Heritage District. The ground is roof deck; pits are gaps between buildings.
THEMES.gilbert_rooftops={
 bg(L){const c=L.cam,GY=L.gy;skyNight(L,'#0f0a3a','#3a1f7a','#d0507a',470);
  farCity(L,'#26145a','#ffd966',GY+40,.15,110);farCity(L,'#1c0f45','#ffc84a',GY+70,.35,150);
  // near: rooftop clutter (AC units, vents, antennas, a neon pizza sign)
  const n=c*.9;for(let k=Math.floor(n/300)-1;k<Math.floor((n+W)/300)+2;k++){const x=k*300-n;
   if(L.inPit&&L.inPit(k*300/.9+60))continue;
   ctx.fillStyle='#8a8aa8';ctx.strokeStyle='#1a1030';ctx.lineWidth=2;ctx.fillRect(x+30,GY-34,52,34);ctx.strokeRect(x+30,GY-34,52,34);ctx.fillStyle='#5a5a78';for(let i=0;i<4;i++)ctx.fillRect(x+36+i*12,GY-28,6,22);
   ctx.fillStyle='#6a6a88';ctx.fillRect(x+150,GY-58,6,58);ctx.beginPath();ctx.arc(x+153,GY-62,8,0,7);ctx.fill();
   if(k%3===1){ctx.fillStyle='#2a1a40';ctx.fillRect(x+200,GY-110,70,40);ctx.fillStyle=Math.floor(TIME*2+k)%5?'#ff5a3a':'#7a2a2a';text('PIZZA',x+235,GY-82,15,ctx.fillStyle,'center','#200');ctx.fillStyle='#444';ctx.fillRect(x+210,GY-70,4,70);ctx.fillRect(x+256,GY-70,4,70);}}
  // roof deck
  ctx.fillStyle='#6a5a62';ctx.fillRect(0,GY,W,H-GY);ctx.fillStyle='#584a52';for(let x=-(c%36);x<W;x+=36)ctx.fillRect(x,GY+6,18,3);ctx.fillStyle='#000';ctx.fillRect(0,GY,W,3);
  ctx.fillStyle='#b9a8a0';ctx.fillRect(0,GY-6,W,6);ctx.strokeStyle='#1a1030';ctx.beginPath();ctx.moveTo(0,GY-6);ctx.lineTo(W,GY-6);ctx.stroke();},
 platform(L,p,x){ctx.fillStyle='#4a3a60';ctx.fillRect(x,p[1],p[2],L.gy-p[1]);ctx.strokeStyle='#150a20';ctx.lineWidth=3;ctx.strokeRect(x,p[1],p[2],L.gy-p[1]);
  for(let wy=p[1]+14;wy<L.gy-10;wy+=22)for(let wx=x+10;wx<x+p[2]-14;wx+=24){ctx.fillStyle=hsh(wx*.2+wy)>.5?'#ffd966':'#2a2050';ctx.fillRect(wx,wy,12,12);}
  ctx.fillStyle='#b9a8a0';ctx.fillRect(x-4,p[1],p[2]+8,8);ctx.strokeRect(x-4,p[1],p[2]+8,8);},
 pit(L,x0,x1){// gap between buildings: alley far below
  ctx.fillStyle='#0a0618';ctx.fillRect(x0,L.gy-6,x1-x0,H);ctx.fillStyle='#1a1030';ctx.fillRect(x0,L.gy+40,x1-x0,H);ctx.fillStyle='rgba(255,200,90,.25)';ctx.fillRect(x0+(x1-x0)/2-3,L.gy+44,6,H);
  ctx.fillStyle='#3a2a4a';ctx.fillRect(x0-6,L.gy-6,6,H);ctx.fillRect(x1,L.gy-6,6,H);}
};

// Mission 3: crane yard at night. Sand ground, shipping containers, lots of cranes.
THEMES.gilbert_craneyard={
 bg(L){const c=L.cam,GY=L.gy;skyNight(L,'#140a36','#46207a','#e06a5a',560);
  farCity(L,'#25124f','#ffd966',GY-30,.12,130);
  const m=c*.35;for(let k=Math.floor(m/230)-1;k<Math.floor((m+W)/230)+2;k++){const x=k*230-m;crane(x+60,GY-10,190+hsh(k)*60,170+hsh(k+3)*60,k%2?'#e8a000':'#ffb81a');}
  const n=c*.7;const cols=['#c0392b','#2e86c1','#27ae60','#d68910','#7d3c98'];
  for(let k=Math.floor(n/210)-1;k<Math.floor((n+W)/210)+2;k++){const x=k*210-n,st=1+Math.floor(hsh(k*1.7)*3);
   for(let s=0;s<st;s++){ctx.fillStyle=cols[Math.floor(hsh(k*5+s)*5)];const y=GY-34*(s+1);ctx.fillRect(x+10+s*8,y,150,34);ctx.strokeStyle='#150a20';ctx.lineWidth=2;ctx.strokeRect(x+10+s*8,y,150,34);ctx.fillStyle='rgba(0,0,0,.2)';for(let r=x+20+s*8;r<x+150+s*8;r+=12)ctx.fillRect(r,y+4,4,26);}}
  ctx.fillStyle='#c8a46a';ctx.fillRect(0,GY,W,H-GY);ctx.fillStyle='#a8844a';for(let x=-(c%40);x<W;x+=40){ctx.fillRect(x,GY+12,14,3);ctx.fillRect(x+20,GY+30,10,3);}ctx.fillStyle='#000';ctx.fillRect(0,GY,W,3);},
 platform(L,p,x){// stacked containers you can stand on
  ctx.fillStyle=['#c0392b','#2e86c1','#27ae60','#d68910'][Math.floor(hsh(p[0])*4)];ctx.fillRect(x,p[1],p[2],L.gy-p[1]);ctx.strokeStyle='#150a20';ctx.lineWidth=3;ctx.strokeRect(x,p[1],p[2],L.gy-p[1]);
  ctx.fillStyle='rgba(0,0,0,.22)';for(let r=x+8;r<x+p[2]-6;r+=12)ctx.fillRect(r,p[1]+6,4,L.gy-p[1]-12);}
};

// Mission 5: Papa Johnny's wrecking yard. Junk car piles, a crusher, a wrecking-ball crane.
THEMES.gilbert_wreckingyard={
 bg(L){const c=L.cam,GY=L.gy;skyNight(L,'#1a0a22','#5a1f3a','#e0703a',300);
  farCity(L,'#2a1030','#ffb04a',GY-40,.12,140);
  const m=c*.4;for(let k=Math.floor(m/320)-1;k<Math.floor((m+W)/320)+2;k++){const x=k*320-m;
   crane(x+40,GY-20,220,200,'#d07a10');const sw=Math.sin(TIME*1.2+k)*.5,bx=x+40+124+Math.sin(sw)*90,by=GY-200+Math.cos(sw)*90;ctx.strokeStyle='#333';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+164,GY-240);ctx.lineTo(bx,by);ctx.stroke();ctx.fillStyle='#2a2a30';ctx.beginPath();ctx.arc(bx,by,18,0,7);ctx.fill();
   ctx.fillStyle='#3a2a3a';ctx.beginPath();ctx.moveTo(x+180,GY);for(let i=0;i<=6;i++)ctx.lineTo(x+180+i*22,GY-50-hsh(k*9+i)*40);ctx.lineTo(x+320,GY);ctx.fill();}
  const n=c*.75;const carCols=['#b03a2e','#2874a6','#1e8449','#b7950b','#6c3483'];
  for(let k=Math.floor(n/180)-1;k<Math.floor((n+W)/180)+2;k++){const x=k*180-n;for(let s=0;s<2;s++){ctx.fillStyle=carCols[Math.floor(hsh(k*3+s)*5)];const y=GY-26*(s+1);ctx.beginPath();ctx.roundRect(x+20+s*14,y,90-s*10,24,6);ctx.fill();ctx.strokeStyle='#150a20';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#9ee8ff';ctx.fillRect(x+40+s*14,y+4,20,8);}}
  ctx.fillStyle='#6a4a3a';ctx.fillRect(0,GY,W,H-GY);ctx.fillStyle='#5a3a2a';for(let x=-(c%44);x<W;x+=44){ctx.fillRect(x,GY+10,20,4);ctx.fillRect(x+24,GY+34,12,4);}ctx.fillStyle='#000';ctx.fillRect(0,GY,W,3);},
 platform(L,p,x){// crushed car stacks
  for(let y=p[1];y<L.gy;y+=22){ctx.fillStyle=['#b03a2e','#2874a6','#1e8449','#b7950b'][Math.floor(hsh(p[0]+y)*4)];ctx.fillRect(x,y,p[2],22);ctx.strokeStyle='#150a20';ctx.lineWidth=2;ctx.strokeRect(x,y,p[2],22);}}
};
