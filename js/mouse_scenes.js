// ===== Mouse clicks for the rest of the game (v0.43). Music Room boxes live in studio.js, the engine in mouse_ui.js =====
// Each MUI.hooks[sceneName](scene) runs right after that scene has drawn, so the boxes use the same numbers as its draw().
// A click usually picks the thing and presses the same pad button a player would (MUI.btn), so the game logic is shared.
// Rule of thumb: menus = one click does it; lists where a click spends money or starts something = click to pick, click again to do it.
const MH=MUI.hooks;
const mPick=(o,k,i,again)=>{if(o[k]===i&&again!==false){MUI.btn('ok');return;}o[k]=i;SFX.move();};  // click once = pick, again = A
const mWheel=(o,k,n)=>d=>{if(!n)return;const v=Math.max(0,Math.min(n-1,o[k]-d));if(v!==o[k]){o[k]=v;SFX.move();}};
function mBack(x=8,y=8,label='Back'){if(!MUI.mouseRecent())return;MUI.add(x,y,74,24,{hl:false,click:()=>{SFX.move();MUI.btn('back');}});
 const hov=MUI.mx>=x&&MUI.mx<x+74&&MUI.my>=y&&MUI.my<y+24;rrect(x,y,74,24,8,hov?'#ffd23a':'rgba(8,16,34,.88)',hov?'#fff':'#2de2f5',1.5);text('< '+label,x+37,y+17,12,hov?'#102':'#fff','center',null);}
const mAnyOk=()=>MUI.add(0,0,W,H,{hl:false,click:()=>MUI.btn('ok')});
const mChipsIfMouse=(items,y,h,back)=>{if(!MUI.mouseRecent())return;if(back){ctx.fillStyle=back;ctx.fillRect(0,y-1,W,(h||22)+2);}MUI.chips(items,y,h);};

// ---------- sound on/off button (the music comes first!) ----------
// Bottom-right speaker while the mouse is in use, on every screen. The MUTED pill bottom-left is clickable too.
function mToggleMute(){muted=!muted;MUTE_T=2.5;}  // same as the N key; music.js follows `muted` every tick
MH['*']=function(s){
 if(muted||MUTE_T>0){ctx.font='bold 11px "Trebuchet MS",Verdana,sans-serif';const t=muted?(MUTE_T>0?'SOUND OFF  (press N to turn it back on)':'MUTED (N)'):'SOUND ON';MUI.add(8,H-26,ctx.measureText(t).width+16,18,{click:mToggleMute});}
 if(!MUI.mouseRecent())return;const x=W-34,y=s&&s.name==='map'?H-120:H-34,hov=MUI.mx>=x&&MUI.mx<x+28&&MUI.my>=y&&MUI.my<y+28;
 ctx.save();ctx.globalAlpha=hov?1:.8;rrect(x,y,28,28,8,hov?'#ffd23a':'rgba(8,16,34,.9)',muted?'#ff5a8a':'#2de2f5',2);
 const c=hov?'#102':'#fff';ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(x+6,y+11);ctx.lineTo(x+10,y+11);ctx.lineTo(x+15,y+6);ctx.lineTo(x+15,y+22);ctx.lineTo(x+10,y+17);ctx.lineTo(x+6,y+17);ctx.closePath();ctx.fill();
 ctx.strokeStyle=muted?'#ff5a8a':c;ctx.lineWidth=2;ctx.beginPath();
 if(muted){ctx.moveTo(x+18,y+10);ctx.lineTo(x+24,y+18);ctx.moveTo(x+24,y+10);ctx.lineTo(x+18,y+18);}else{ctx.arc(x+15,y+14,5,-.9,.9);ctx.moveTo(x+21.5,y+8);ctx.arc(x+15,y+14,9,-.75,.75);}
 ctx.stroke();ctx.restore();MUI.add(x,y,28,28,{hl:false,click:mToggleMute});
 // pause button during missions and deliveries
 if(s&&MISSION_SCENES.includes(s.name)&&s.state==='play'&&!s.paused){const px=W-34,py=H-68,ph=MUI.mx>=px&&MUI.mx<px+28&&MUI.my>=py&&MUI.my<py+28;
  rrect(px,py,28,28,8,ph?'#ffd23a':'rgba(8,16,34,.9)','#2de2f5',2);ctx.fillStyle=ph?'#102':'#fff';ctx.fillRect(px+9,py+8,4,12);ctx.fillRect(px+16,py+8,4,12);
  MUI.add(px,py,28,28,{hl:false,click:()=>MUI.btn('start')});}};

// ---------- missions: story pages and end screens advance with a click ----------
const MISSION_SCENES=['level','hack','stealth','pursuit','wirecut','lockpick','codedrop','ski','balloon','delivery'];
MISSION_SCENES.forEach(n=>{MH[n]=function(s){
 if(s.state==='intro'||s.state==='outro'||s.state==='end'||s.state==='clear')mAnyOk();
 if(n==='delivery'&&s.state==='pause')['RESUME','RESTART RUN','QUIT TO MAP'].forEach((_,i)=>MUI.add(216,170+i*48,208,38,{hover:()=>{s.sel=i;},click:()=>{s.sel=i;MUI.btn('ok');}}));};});
MH.story=null;  // story.js already handles taps on story pages

// ---------- title ----------
MH.title=function(s){if(s.controls){mAnyOk();return;}
 s.items.forEach((_,i)=>MUI.add(405,212+i*46,210,38,{hover:()=>{if(s.sel!==i){s.sel=i;SFX.move();}},click:()=>{s.sel=i;MUI.btn('ok');}}));};

// ---------- character select (charselect.js handles the click; these boxes give the hover + pointer) ----------
MH.charselect=function(s){if(s.go)return;for(let i=0;i<3;i++)MUI.add(CS_X[i],CS_Y-16,CS_W,CS_H+16,{});MUI.add(W/2-80,370,160,42,{});
 mChipsIfMouse([{t:'<  Previous',b:'left'},{t:'Next  >',b:'right'},{t:'B  Back',b:'back'}],442,22);};

// ---------- Enter Code + Extras ----------
MH.code=function(s){if(s.msgT>0&&s.msg){MUI.add(0,0,W,H,{hl:false,click:()=>{s.msgT=0;}});return;}
 for(let r=0;r<4;r++)for(let c=0;c<7;c++)MUI.add(124+c*56,172+r*56,48,46,{click:()=>{s.cx=c;s.cy=r;s.press();}});
 if(MUI.mouseRecent()){rrect(70,402,500,34,0,'rgba(6,20,36,1)',null);MUI.chips([{t:'Try code',fn:()=>s.submit()},{t:'Delete',fn:()=>{s.str=s.str.slice(0,-1);}},{t:'Leave',fn:()=>go(Title)}],406,24);}};
MH.extras=function(s){const R=s.rows(),RH=R.length>10?26:28;
 R.forEach((r,i)=>MUI.add(70,104+i*RH,500,24,{click:()=>{s.sel=i;MUI.btn('ok');},right:()=>{s.sel=i;MUI.btn('left');},wheel:d=>{s.sel=i;MUI.btn(d>0?'right':'left');}}));mBack(56,36);};

// ---------- world map: Valley, city maps and list view ----------
MH.map=function(s){
 if(s.mode==='valley'){const N=s.nodes();N.forEach((n,i)=>{const sel=()=>mPick(s,'vsel',i);
   if(n.kind==='lair')MUI.add(n.x-26,n.y-26,52,52,{click:sel});
   else{const by=n.y+(n.c.id==='tower'?10:6);MUI.add(n.x-46,by-12,92,26,{click:sel});MUI.add(n.c.vx-48,n.c.vy-14,96,18+(n.c.id==='tower'?8:0),{hl:false,click:sel});}});
  MUI.add(10,H-84,W-20,68,{hl:false,click:()=>MUI.btn('ok')});
  mChipsIfMouse([{t:'A  Enter',b:'ok'},{t:'Y  List view',b:'gadget'},{t:'Start  Gadget Watch',b:'start'},{t:'B  Title',b:'back'}],H-20,18,'rgba(6,12,28,.85)');}
 else if(s.mode==='city'){const N=s.nodes();N.forEach((o,i)=>{const sz=o.home?40:o.l&&o.l.kind==='boss'?44:34,cy=o.home?o.y-6:o.y-4;MUI.add(o.x-sz/2-4,cy-sz/2-4,sz+8,sz+8,{click:()=>mPick(s,'sel',i)});});
  MUI.add(10,H-84,W-20,68,{hl:false,click:()=>MUI.btn('ok')});
  mChipsIfMouse([{t:'A  Start',b:'ok'},{t:'B  Valley map',b:'back'},{t:'Y  List view',b:'gadget'},{t:'Start  Gadget Watch',b:'start'}],H-20,18,'rgba(6,12,28,.85)');}
 else{const n=CITIES.length,tw=(W-20)/n;CITIES.forEach((_,i)=>MUI.add(10+i*tw+2,36,tw-4,26,{click:()=>{if(s.ltab!==i){s.ltab=i;s.lsel=0;SFX.move();}}}));
  const R=s.listRows(),vis=9,top=Math.max(0,Math.min(s.lsel-4,R.length-vis));MUI.add(10,106,W-20,vis*31,{hl:false,wheel:mWheel(s,'lsel',R.length)});
  R.slice(top,top+vis).forEach((_,j)=>{const i=top+j;MUI.add(10,106+j*31,W-20,28,{click:()=>mPick(s,'lsel',i)});});
  mChipsIfMouse([{t:'A  Start',b:'ok'},{t:'Y  Map view',b:'gadget'},{t:'Start  Gadget Watch',b:'start'},{t:'B  Title',b:'back'}],H-20,18,'rgba(6,12,28,.85)');}};

// ---------- Gadget Watch (map hub and mission pause) ----------
MH.watch=function(s){for(let i=0;i<8;i++)MUI.add(80+i*60-4,34,58,50,{click:()=>{if(s.tab!==i){s.tab=i;s.sel=0;SFX.move();}}});
 const X=60,Y=130,t=s.tab;
 if(t===0){const n=(s.ctxMode==='level'?2:0)+watchLevels().length,top=Math.max(0,Math.min(s.sel-4,n-9));MUI.add(X,Y,520,270,{hl:false,wheel:mWheel(s,'sel',n)});
  for(let j=0;j<9&&top+j<n;j++){const i=top+j;MUI.add(X,Y+j*30,520,26,{click:()=>{if(s.ctxMode==='level'&&i===0){s.sel=0;MUI.btn('ok');}else mPick(s,'sel',i);}});/* Resume = one click; anything that leaves the mission = click twice */}}
 else if(t===7){RIDES.forEach((_,i)=>MUI.add(X,Y-4+i*40,520,36,{click:()=>{s.sel=i;MUI.btn('ok');}}));MUI.add(150,376,340,22,{click:()=>MUI.btn('attack')});}
 else if(t===4){MUI.add(X,Y,520,250,{hl:false,click:()=>{s.page=(s.page+1)%casePages().length;SFX.move();},wheel:d=>{const n=casePages().length;s.page=(s.page-d+n)%n;SFX.move();}});}
 else if(t===2||t===3||t===5||t===6)MUI.add(X,Y-10,520,300,{hl:false,click:()=>MUI.btn('ok')});
 const C=[{t:'<  Tab',b:'left'},{t:'Tab  >',b:'right'}];if(t===4)C.push({t:'Next page',b:'down'});C.push({t:s.ctxMode==='level'?'B  Back to mission':'B  Close',b:'back'});
 if(MUI.mouseRecent()){ctx.fillStyle='rgba(6,12,28,.9)';ctx.fillRect(100,438,440,22);MUI.chips(C,438,20);}};

// ---------- results screens: click anywhere to continue ----------
MH.results=function(s){if(s.t>1)mAnyOk();};
MH.dresults=function(s){if(s.t>1)mAnyOk();};

// ---------- the Lair and its rooms ----------
MH.lairmenu=function(s){const I=s.items();I.forEach((_,i)=>MUI.add(40,96+i*35,248,30,{hover:()=>{if(s.sel!==i){s.sel=i;SFX.move();}},click:()=>{s.sel=i;MUI.btn('ok');}}));};
MH.dpick=function(s){for(let i=0;i<3;i++)MUI.add(56,80+i*58,528,48,{click:()=>{s.sel=i;MUI.btn('ok');},right:i<2?()=>{s.sel=i;MUI.btn('left');}:null,wheel:i<2?d=>{s.sel=i;MUI.btn(d>0?'right':'left');}:null});mBack();};
MH.shop=function(s){['PARTS','GADGETS','RIDE UPGRADES'].forEach((_,i)=>MUI.add(110+i*150-65,54,130,28,{click:()=>{if(s.tab!==i){s.tab=i;s.sel=0;SFX.move();}}}));
 const R=s.rows(),top=Math.max(0,Math.min(s.sel-4,R.length-9));MUI.add(32,100,576,306,{hl:false,wheel:mWheel(s,'sel',R.length)});
 R.slice(top,top+9).forEach((_,j)=>{const i=top+j;MUI.add(32,100+j*34,576,30,{click:()=>mPick(s,'sel',i)});});
 if(MUI.mouseRecent()&&R[s.sel]&&!R[s.sel].sold){const y=100+(s.sel-top)*34;text('click again to buy',490,y+21,10,'#102','right',null);}
 mBack();};
MH.lab=function(s){const L=labList(),top=Math.max(0,Math.min(s.sel-5,L.length-11));MUI.add(24,70,230,396,{hl:false,wheel:mWheel(s,'sel',L.length)});
 L.slice(top,top+11).forEach((_,j)=>{const i=top+j;MUI.add(24,70+j*36,230,32,{click:()=>{if(s.sel!==i){s.sel=i;SFX.move();}}});});
 MUI.add(351,434,200,28,{click:()=>MUI.btn('ok')});mBack();};
MH.equip=function(s){s.rows().forEach((r,i)=>{const y=74+i*72+(r.ch==='agent_sisi'?14:0);MUI.add(130,y,450,58,{click:()=>{s.sel=i;MUI.btn('ok');},right:()=>{s.sel=i;MUI.btn('left');},wheel:d=>{s.sel=i;MUI.btn(d>0?'right':'left');}});});mBack();};
MH.craft=function(s){
 if(s.state==='how'){mAnyOk();mChipsIfMouse([{t:'A  Start',b:'ok'},{t:'B  Cancel (parts back)',b:'back'}],372,22);return;}
 if(s.state==='done'){if(s.tapeAsk)mChipsIfMouse([{t:'A  Yes, use Duct Tape',b:'ok'},{t:'B  No',b:'back'}],330,24);else mAnyOk();return;}
 if(s.kind==='print')mAnyOk();
 if(s.kind==='snap')s.tray.forEach((_,i)=>MUI.add(130+i*126-46,336-46,92,92,{click:()=>{s.cur=i;MUI.btn('ok');}}));};
// soldering: the hot tip follows the mouse up and down
{const _cu=Craft.update;Craft.update=function(dt){if(this.state==='play'&&this.kind==='solder'&&MUI.mouseRecent()&&MUI.my>=80&&MUI.my<=420){const d=MUI.my-this.tipY,m=230*(dt||1/60);this.tipY=Math.max(90,Math.min(400,this.tipY+Math.max(-m,Math.min(m,d))));}return _cu.apply(this,arguments);};}
MH.trophies=function(s){const n=ACH_CATS.length;ACH_CATS.forEach((_,i)=>MUI.add(20+i*76,54,72,24,{click:()=>{if(s.cat!==i){s.cat=i;s.sel=0;SFX.move();}}}));
 const R=s.rows(),VIS=7,top=Math.max(0,Math.min(s.sel-3,R.length-VIS));MUI.add(20,86,600,VIS*42,{hl:false,wheel:mWheel(s,'sel',R.length)});
 R.slice(top,top+VIS).forEach((_,j)=>{const i=top+j;MUI.add(20,86+j*42,600,38,{click:()=>{s.sel=i;SFX.move();}});});
 if(MUI.mouseRecent()){ctx.fillStyle='#0a0820';ctx.fillRect(0,456,W,24);MUI.chips([{t:'Y  '+['Show all','To do only','Done only'][s.filt],b:'gadget'},{t:'B  Back',b:'back'}],457,20);}};
MH.eggshelf=function(s){EGGS.forEach((_,i)=>{const x=110+(i%4)*140,y=92+Math.floor(i/4)*72;MUI.add(x-58,y-32,116,64,{click:()=>{if(s.sel!==i){s.sel=i;SFX.move();}}});});mBack();};
