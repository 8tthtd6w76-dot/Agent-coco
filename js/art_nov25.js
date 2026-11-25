// ===== Michael's Nov 25 art sheets (v0.33): icons, button prompts, results card, top-down taxi crew + neighbors =====
// Cut by tools/slice_nov25.py from art_source/seq_nov25/. Every hook falls back to the old code drawing if an image is missing.
//  assets/icons/st_*  stealth icons (eye, question, alert, ear, steps, sneak, hidden, ring, cone_y, cone_r, laser, alarm, camera, keycard, lock)
//  assets/icons/it_*  pickups + HUD (coin, coin_spin, coins, slice, pizza, clue, chip, wrench, smoke, key, chip_purple, star, heart, heart_half, heart_empty, gift, cash, battery, board, spring, sparkle)
//  assets/icons/btn_* controller + keyboard prompts (pad_a/b/x/y, dpad*, stick_l/r, lb, rb, lt, rt, start, select, key_up/down/left/right/space/enter, key_blank..5, tap, swipe, pinch, hold)
//  assets/topdown/npc.png  4x6 grid of 96px cells: rows 0-2 taxi guy walk down/up/right, row 3 taxi guy specials (flashlight front/back/side, knocked out),
//                          row 4 jogger (down, down, up, right), row 5 grandma (down, down, up, right)
//  assets/ui/results_card.jpg  mission-complete card
const ICONS_N25={st:['eye','question','alert','ear','steps','sneak','hidden','ring','cone_y','cone_r','laser','alarm','camera','keycard','lock'],
 it:['coin','coin_spin','coins','slice','pizza','clue','chip','wrench','smoke','key','chip_purple','star','heart','heart_half','heart_empty','gift','cash','battery','board','spring','sparkle'],
 btn:['pad_a','pad_b','pad_x','pad_y','dpad','dpad_up','dpad_down','dpad_left','dpad_right','stick_l','stick_r','lb','rb','lt','rt','start','select','key_up','key_down','key_left','key_right','key_space','key_enter','key_blank']};
for(const p in ICONS_N25)ICONS_N25[p].forEach(n=>ASSET_LIST.push(['icons/'+p+'_'+n,'assets/icons/'+p+'_'+n+'.png']));
ASSET_LIST.push(['topdown/npc','assets/topdown/npc.png'],['ui/results_card','assets/ui/results_card.jpg']);
const icoImg=k=>{const i=IMG['icons/'+k];return i&&i.width?i:null;};
// draw icon k centred at (cx,cy), h tall (w from its shape unless given). Returns false when the art is missing.
function ico(k,cx,cy,h,w,alpha){const i=icoImg(k);if(!i)return false;w=w||i.width*h/i.height;if(alpha!=null)ctx.globalAlpha=alpha;ctx.drawImage(i,cx-w/2,cy-h/2,w,h);if(alpha!=null)ctx.globalAlpha=1;return true;}

// ---------- hearts, stars ----------
const _heart0=heart;
heart=function(x,y,full){if(!ico(full===.5?'it_heart_half':full?'it_heart':'it_heart_empty',x,y-3,17))_heart0(x,y,full);};
const _stars0=drawStars;
drawStars=function(n,x,y,s,max=3){if(!icoImg('it_star'))return _stars0(n,x,y,s,max);
 for(let i=0;i<max;i++){const cx=x+i*(s+3);if(i<n)ico('it_star',cx,y,s*1.15);else{ctx.save();ctx.filter='grayscale(1) brightness(.45)';ico('it_star',cx,y,s*1.05,null,.8);ctx.restore();}}};

// ---------- pickups in side-scroll missions (level.js drawItems calls this first) ----------
function drawItemArt(it,x,y){
 if(it.k==='coin'){const i=icoImg('it_coin');if(!i)return false;const sq=Math.abs(Math.cos(TIME*3+it.x))*.85+.15,h=18;ctx.drawImage(sq<.35&&icoImg('it_coin_spin')?icoImg('it_coin_spin'):i,x-h*sq/2,y-h/2,h*sq,h);return true;}
 if(it.k==='pizza')return ico('it_slice',x,y,28);
 return false;}

// ---------- stealth (stealth.js calls these; false = old drawing) ----------
let _npcImg=null;const npcImg=()=>{const i=IMG['topdown/npc'];return i&&i.width?i:null;};
function npcCell(row,col,x,feetY,size,flip,alpha){const i=npcImg();if(!i)return false;ctx.save();if(alpha!=null)ctx.globalAlpha=alpha;ctx.translate(x,feetY);if(flip)ctx.scale(-1,1);
 ctx.drawImage(i,col*96,row*96,96,96,-size/2,-size+size*2/96,size,size);ctx.restore();return true;}
// taxi crew guard for Downtown stealth (def.guardArt==='taxi'); direction from g.dir, knocked out when dizzy
function stGuardArt(g,def,t){if(def.guardArt!=='taxi')return false;const dz=g.dizzy>0,s=Math.sin(g.dir),c=Math.cos(g.dir);
 let row,col,flip=false;if(dz){row=3;col=3;}else if(g.state==='chase'){row=3;col=Math.abs(s)>.7?(s>0?0:1):2;flip=c<0;}
 else{row=Math.abs(s)>.7?(s>0?0:1):2;flip=row===2&&c<0;col=Math.floor((g.walk||0)/10)%4;}
 return npcCell(row,col,g.x,g.y+14,50,flip);}
function stMark(g,y){// ! ? and the eye over a guard
 if(g.state==='chase')return ico('st_alert',g.x,y,24);
 if(g.state==='investigate')return ico('st_question',g.x,y,22);
 if(g.sees)return ico('st_eye',g.x,y,14,null,.9);return true;}
function stCamera(c){const i=icoImg('st_camera');if(!i)return false;const left=Math.cos(c.a)<0;ctx.save();ctx.translate(c.x,c.y);ctx.rotate(left?c.a+Math.PI:c.a);if(left)ctx.scale(-1,1);
 const h=20,w=i.width*h/i.height;ctx.drawImage(i,-w*.35,-h/2,w,h);ctx.restore();ctx.fillStyle=c.sees?'#f44':'#4f4';ctx.beginPath();ctx.arc(c.x,c.y,2.5,0,7);ctx.fill();return true;}
function stItem(it,b){if(it.k==='coin'){const i=icoImg('it_coin');if(!i)return false;const sq=Math.abs(Math.cos(TIME*3+it.x))*.85+.15;ctx.drawImage(i,it.x-8*sq,it.y+b-8,16*sq,16);return true;}
 if(it.k==='key'){if(!icoImg('st_keycard'))return false;ctx.globalAlpha=.4+.3*Math.sin(TIME*6);ctx.strokeStyle='#7ff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(it.x,it.y+b,16,0,7);ctx.stroke();ctx.globalAlpha=1;return ico('st_keycard',it.x,it.y+b,16);}
 return false;}
function stExitLock(x,y,hasKey){if(!hasKey)ico('st_lock',x,y-2,16,null,.95);}
function stHudIcons(S,def){// keycard + eye icons on the stealth HUD bar
 if(!icoImg('st_keycard'))return false;
 ico('st_keycard',104,16,14,null,S.hasKey?1:.3);ico('st_eye',236,16,13,null,S.alarm>0?1:.85);return true;}

// ---------- button prompts: keycaps on the Controls screen and hint pills ----------
const _keycap0=keycap,ARROW_KEYS={'↑':'key_up','↓':'key_down','←':'key_left','→':'key_right'};
keycap=function(x,y,label,col,h){h=h||24;const blank=icoImg('btn_key_blank');if(!blank)return _keycap0(x,y,label,col,h);
 const ak=ARROW_KEYS[label];if(ak&&icoImg('btn_'+ak)){ico('btn_'+ak,x+h/2,y+h/2,h+2,h+2);return h;}
 ctx.font='bold '+(label.length>1?11:13)+'px "Trebuchet MS",Verdana,sans-serif';const w=Math.max(h,Math.ceil(ctx.measureText(label).width)+14);
 const art=label==='Space'&&icoImg('btn_key_space')?icoImg('btn_key_space'):label==='Enter'&&icoImg('btn_key_enter')?icoImg('btn_key_enter'):blank;
 ctx.drawImage(art,x-1,y-1,w+2,h+2);if(art===blank||label!=='Enter')text(label,x+w/2,y+h*0.62,label.length>1?11:13,'#fff','center','#1a1f4a');
 if(col){ctx.strokeStyle=col;ctx.globalAlpha=.55;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(x,y,w,h,6);ctx.stroke();ctx.globalAlpha=1;}return w;};
const _ctlPanel0=drawControlsPanel;
drawControlsPanel=function(){_ctlPanel0.apply(this,arguments);if(!icoImg('btn_pad_a'))return;
 // gamepad row as real button pictures
 ctx.fillStyle='rgb(6,20,36)';ctx.fillRect(34,402,572,24);
 let x=64;const item=(k,t,s)=>{ico('btn_'+k,x,413,s||22);x+=(s||22)*.6+6;text(t,x,418,12,'#fff','left',null);ctx.font='bold 12px "Trebuchet MS",Verdana,sans-serif';x+=ctx.measureText(t).width+16;};
 text('GAMEPAD',x-24,418,11,'#ffd23a','left',null);x+=50;
 item('pad_a','jump');item('pad_x','attack');item('pad_y','gadget');item('select','swap',18);item('start','pause',18);};

// ---------- results card behind MISSION COMPLETE ----------
const _resDraw0=Results.draw;
Results.draw=function(){const d=this.data,card=IMG['ui/results_card'];if(!d||!d.win||!card||!card.width)return _resDraw0.apply(this,arguments);
 ctx.drawImage(card,0,0,W,H);const t=this.t;
 // the painted stars: grey out the ones this mission hasn't earned yet
 const lv=LEVELS.find(l=>l.id===(d.id||1)),n=lv&&typeof levelStars==='function'?levelStars(lv):3;
 [[188,96,44],[320,76,56],[452,96,44]].forEach(([x,y,r],i)=>{if(i>=n)starShape(x,y,r,'rgba(10,14,40,.72)','rgba(0,0,0,0)');
  else if(t<1.5){ctx.globalAlpha=Math.max(0,1-t)*.8;starShape(x,y,r*(1+t*.3),'#fff','rgba(0,0,0,0)');ctx.globalAlpha=1;}});
 text('MISSION COMPLETE',W/2,192,26,'#ffd23a','center','#000');text(d.name||'',W/2,212,13,'#cfe','center',null);
 const r=[['XP','+'+d.xp,'it_star'],['Tips','$'+d.coins,'it_coins'],['Clues',d.clues+' / '+(d.total||3),'it_clue'],['Beaten',d.kills,'st_alert']];
 r.forEach((x,i)=>{if(t<=.25*i)return;const cx=i%2?330:98,y=244+Math.floor(i/2)*34;ico(x[2],cx+10,y-6,22);text(x[0],cx+26,y,15,'#fff','left',null);text(x[1],cx+212,y,17,'#ffd23a','right',null);});
 const wc=typeof winCodes==='function'?winCodes(d.id||1):[];
 if(t>1.4){const ct=wc.length?(wc.length===1?(wc[0].city?'CITY CODE: '+wc[0].code+' ('+wc[0].city.name+')':'CODE FOR '+wc[0].what+': '+wc[0].code):'CODES: '+wc.slice(0,3).map(w=>w.code).join('  ')):'';
  if(ct)text(ct,W/2,312,13,'#ff9ae0','center',null);}
 let y=352;if(t>1.2&&d.rare){text('RARE PART: '+partDef(d.rare).n.toUpperCase()+'! (Gadget Lab)',W/2,y,15,'#fff','center','#000');y+=22;}
 if(t>1.6&&d.ride)text('NEW RIDE IN THE GARAGE: '+d.ride.toUpperCase()+'!',W/2,y,14,'#fff','center','#000');
 if(t>1)text('A: continue',W/2,H-12,12,'#fff','center','#000');};

// ---------- pizza delivery: a jogger and a grandma walk the sidewalks (delivery.js draws kids with k.npc through this) ----------
const _mkDel25=makeDelivery;
makeDelivery=function(){const D=_mkDel25.apply(this,arguments);try{if(D.kids&&D.kids.length>1&&npcImg()){
  const tpl=D.kids;[['jogger',58],['grandma',24]].forEach(([who,sp],i)=>{const k=tpl[(i*2+1)%tpl.length];tpl.push({x0:k.x0,x:k.x0+k.len*(.3+i*.4),y:k.y+(i?-10:10),len:k.len,dir:i?-1:1,sp,t:0,col:'#fff',calm:0,npc:who});});}}catch(e){}
 return D;};
function drawDeliveryNpc(k,x,y){const row=k.npc==='grandma'?5:4;const bob=Math.abs(Math.sin(TIME*(k.npc==='grandma'?5:9)))*2;
 if(!npcCell(row,3,x,y+12-bob,k.npc==='grandma'?34:36,k.dir<0))return false;
 if(k.calm>0)ico('st_question',x,y-28,14);return true;}
