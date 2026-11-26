// ===== Home Studio tools (v0.44): tool rail, undo/redo, copy/paste patterns, typed names, song files, song codes, record to audio =====
// Loaded right after studio.js. Groove (studio.js) calls grooveRail/grooveTrack/grooveFileMenu*/grooveNamingDraw/grooveRecDraw.
const SONG_MAX=24;   // My Songs shelf (was 8)

// ---------- song codes + files (same COCO1: format as the phone Groove Studio, so songs move between them) ----------
function songCode(S){return 'COCO1:'+btoa(unescape(encodeURIComponent(JSON.stringify(S))));}
function songFix(o){if(!o||typeof o!=='object')return null;const S=Object.assign(blankSong(),o);
 for(const k of ['k','s','c','h','O','p','bass','ch'])if(typeof S[k]!=='string'||S[k].length<16)S[k]=(String(S[k]||'')+'.'.repeat(16)).slice(0,16);
 if(typeof S.lead!=='string')S.lead='.'.repeat(64);S.name=String(S.name||randSongName()).slice(0,24);delete S.id;return S;}
function parseSongText(t){t=String(t||'').trim();const m=/COCO1:([A-Za-z0-9+/=]+)/.exec(t);
 try{if(m)return songFix(JSON.parse(decodeURIComponent(escape(atob(m[1])))));}catch(e){}
 try{const j=JSON.parse(t);return songFix(j&&j.song?j.song:j);}catch(e){}return null;}
// inside a claude.ai artifact (the phone game link) files go through the page's downloads capability
let DL_NS=null;try{if(window.claude&&window.claude.use)window.claude.use('downloads').then(d=>{DL_NS=d;}).catch(()=>{});}catch(e){}
function saveBlob(blob,name){if(DL_NS){const n=name.replace(/\.m4a$/,'.mp4');DL_NS.save({filename:n,data:blob}).catch(e=>toast(e&&e.code==='declined'?'Not saved':'Could not save the file here','#ff5a8a'));return;}const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},4000);}
function fileSafe(n){return String(n||'song').replace(/[^A-Za-z0-9 _-]+/g,'').trim().replace(/\s+/g,'_')||'song';}
function copyText(t){try{if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(t).then(()=>true,()=>copyText2(t));}catch(e){}return Promise.resolve(copyText2(t));}
function copyText2(t){try{const ta=document.createElement('textarea');ta.value=t;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok;}catch(e){return false;}}
function pickFile(cb){const i=document.createElement('input');i.type='file';i.accept='.json,.txt,.cocosong,application/json,text/plain';i.style.display='none';
 i.onchange=()=>{const f=i.files&&i.files[0];i.remove();if(!f)return;const r=new FileReader();r.onload=()=>cb(String(r.result||''),f.name);r.readAsText(f);};document.body.appendChild(i);i.click();}
// put a loaded song into the studio (undo can bring the old one back)
function grooveLoad(G,S,from){if(!S){toast('That is not an Agent Coco song','#ff5a8a');SFX.hurt();return;}
 G.hist.push(JSON.stringify(G.S));G.S=S;G.slot=null;G.pi=0;G.lp=0;G.c=0;G.dirty=true;G.lastJ=JSON.stringify(S);G.refresh();SFX.ok();toast('Loaded '+from+': '+S.name,'#2de2f5');}

// ---------- undo / redo: every change to the song is remembered (quick bursts like a drag count as one step) ----------
function grooveTrack(G){
 if(G.rec&&(backPressed()||MUI.esc)){grooveRecStop(G,true);return;}
 const j=JSON.stringify(G.S);if(G.lastJ==null){G.lastJ=j;return;}
 if(j!==G.lastJ){if(!G.hist.length||TIME-(G.histT||0)>.5){G.hist.push(G.lastJ);if(G.hist.length>80)G.hist.shift();}G.histT=TIME;G.lastJ=j;G.redo=[];}}
function grooveUndo(G){if(!G.hist.length){toast('Nothing to undo','#9fb');return;}G.redo.push(JSON.stringify(G.S));G.S=JSON.parse(G.hist.pop());G.lastJ=JSON.stringify(G.S);G.histT=0;G.dirty=true;G.refresh();SFX.move();toast('Undo','#2de2f5');}
function grooveRedo(G){if(!G.redo.length){toast('Nothing to redo','#9fb');return;}G.hist.push(JSON.stringify(G.S));G.S=JSON.parse(G.redo.pop());G.lastJ=JSON.stringify(G.S);G.histT=0;G.dirty=true;G.refresh();SFX.move();toast('Redo','#2de2f5');}

// ---------- copy / paste a whole pattern (A, B or C): drums, bass, chords and the lead ----------
let PAT_CLIP=null;
function grooveCopy(G){const P=G.pat();PAT_CLIP={};PAT_KEYS.forEach(k=>PAT_CLIP[k]=P[k]);PAT_CLIP.from='ABC'[G.pi];SFX.ok();toast('Pattern '+PAT_CLIP.from+' copied','#2de2f5');}
function groovePaste(G){if(!PAT_CLIP){toast('Copy a pattern first','#9fb');return;}const P=G.pat(),n=16*G.nbars();
 PAT_KEYS.forEach(k=>{P[k]=k==='lead'?(PAT_CLIP.lead+'.'.repeat(n)).slice(0,Math.max(n,PAT_CLIP.lead.length)):PAT_CLIP[k];});delete P.bass4;delete P.ch4;delete P.fill;
 G.refresh();SFX.ok();toast('Pasted '+PAT_CLIP.from+' into pattern '+'ABC'[G.pi],'#2de2f5');}

// ---------- the tool rail (left of the laptop, where the guitar used to be) ----------
function grooveTools(G){return [
 {t:'UNDO',k:'Ctrl Z',on:G.hist.length>0,go:()=>grooveUndo(G)},
 {t:'REDO',k:'Ctrl Y',on:G.redo.length>0,go:()=>grooveRedo(G)},
 {t:'COPY',k:'Ctrl C',on:true,go:()=>grooveCopy(G)},
 {t:'PASTE',k:'Ctrl V',on:!!PAT_CLIP,go:()=>groovePaste(G)},
 {t:G.dirty?'SAVE *':'SAVE',k:'Ctrl S',on:true,go:()=>G.save()},
 {t:'NAME',k:'',on:true,go:()=>{G.naming=G.S.name;}},
 {t:'FILE',k:'',on:true,go:()=>{G.fileMenu={sel:0};}},
 {t:'REC',k:'audio',on:!!(window.MediaRecorder),go:()=>grooveRecord(G)}];}
function grooveRail(G){const T=grooveTools(G),open=!G.menu&&!G.fileMenu&&G.naming==null&&!G.rec;
 T.forEach((b,i)=>{const x=6,y=108+i*40,w=92,h=34,hov=open&&MUI.mouseRecent()&&MUI.mx>=x&&MUI.mx<x+w&&MUI.my>=y&&MUI.my<y+h;
  rrect(x,y,w,h,8,hov?'#ffd23a':b.t==='REC'?'#3a1424':'#141a30',b.on?(b.t==='REC'?'#ff5a8a':'#2de2f5'):'#33406a',hov?2.5:1.5);
  if(b.t==='REC'){ctx.fillStyle=hov?'#c02':'#ff5a8a';ctx.beginPath();ctx.arc(x+16,y+h/2,5,0,7);ctx.fill();}
  text(b.t,x+(b.t==='REC'?54:w/2),y+(b.k?16:22),12,hov?'#102':b.on?'#fff':'#67729a','center',null);
  if(b.k)text(b.k,x+(b.t==='REC'?54:w/2),y+29,8,hov?'#334':'#8fa0d0','center',null);
  if(open)MUI.add(x,y,w,h,{hl:false,click:()=>{if(b.on)b.go();else SFX.hurt();}});});
 text(G.hist.length?G.hist.length+' undo steps':'',52,108+T.length*40+8,8,'#8fa0d0','center',null);}

// ---------- typing a song name ----------
function grooveNamingDraw(G){dim(.55);panel(130,150,380,150,'#ffd23a');text('NAME YOUR SONG',320,182,18,'#ffd23a','center');
 rrect(150,196,340,40,8,'#02101c','#2de2f5',2);text(G.naming+(Math.floor(TIME*2)%2?'_':' '),320,223,18,'#fff','center',null);
 text('Type on the keyboard. Enter: done   Esc: cancel',320,256,11,'#9fb','center',null);
 MUI.add(0,0,W,H,{hl:false,click:()=>{}});
 MUI.chips([{t:'Done',fn:()=>grooveNameDone(G,true)},{t:'Random name',fn:()=>{G.naming=randSongName();}},{t:'Cancel',fn:()=>grooveNameDone(G,false)}],266,24);}
function grooveNameDone(G,ok){if(ok){const n=G.naming.trim();if(n){G.S.name=n.slice(0,24);G.dirty=true;toast('Name: '+G.S.name,'#2de2f5');}}G.naming=null;}
addEventListener('keydown',e=>{if(typeof scene==='undefined'||scene!==Groove)return;const G=Groove;
 if(G.naming!=null){e.preventDefault();e.stopImmediatePropagation();KEYS[e.code]=false;
  if(e.key==='Enter')grooveNameDone(G,true);else if(e.key==='Escape')grooveNameDone(G,false);else if(e.key==='Backspace')G.naming=G.naming.slice(0,-1);
  else if(e.key.length===1&&/[A-Za-z0-9 '!&.,?-]/.test(e.key)&&G.naming.length<24)G.naming+=e.key;return;}
 const mod=e.ctrlKey||e.metaKey;if(!mod||G.rec)return;const k=e.key.toLowerCase();
 if(k==='z'&&!e.shiftKey){grooveUndo(G);}else if(k==='y'||(k==='z'&&e.shiftKey)){grooveRedo(G);}
 else if(k==='c'){grooveCopy(G);}else if(k==='s'){G.save();}else if(k==='v'){G._pasteWait=setTimeout(()=>{G._pasteWait=null;groovePaste(G);},40);return;}else return;
 e.preventDefault();KEYS[e.code]=false;},true);
// Ctrl+V with a song code (or song file text) on the clipboard loads that song instead of pasting a pattern
addEventListener('paste',e=>{if(typeof scene==='undefined'||scene!==Groove||Groove.naming!=null)return;const t=e.clipboardData&&e.clipboardData.getData('text');const S=t&&/COCO1:|"bass"/.test(t)?parseSongText(t):null;
 if(S){if(Groove._pasteWait){clearTimeout(Groove._pasteWait);Groove._pasteWait=null;}e.preventDefault();grooveLoad(Groove,S,'song code');}});

// ---------- song file / song code menu ----------
function grooveFileItems(G){return [
 {n:'Save song to a file',d:'Downloads '+fileSafe(G.S.name)+'.cocosong.json. Open it on any computer with Agent Coco.',go:()=>{saveBlob(new Blob([JSON.stringify({format:'agent-coco-song',v:1,song:G.S},null,1)],{type:'application/json'}),fileSafe(G.S.name)+'.cocosong.json');SFX.ok();toast('Saved file: '+fileSafe(G.S.name)+'.cocosong.json','#2de2f5');}},
 {n:'Load a song file',d:'Pick a .cocosong.json file (or a text file with a COCO1: code).',go:()=>pickFile((t,fn)=>grooveLoad(G,parseSongText(t),'file'))},
 {n:'Copy song code',d:'Copies a COCO1: code. Paste it in a message, or into the phone Groove Studio (Load a song code).',go:()=>{copyText(songCode(G.S)).then(ok=>toast(ok?'Song code copied!':'Could not copy. Use Save song to a file.',ok?'#2de2f5':'#ff5a8a'));}},
 {n:'Load a song code',d:'Copy a COCO1: code first (from the phone studio or a message), then pick this, or just press Ctrl+V in the studio.',go:()=>{try{navigator.clipboard.readText().then(t=>grooveLoad(G,parseSongText(t),'song code'),()=>toast('Press Ctrl+V (Cmd+V) to paste the code','#ffd23a'));}catch(e){toast('Press Ctrl+V (Cmd+V) to paste the code','#ffd23a');}}},
 {n:'Back',d:'',go:()=>{G.fileMenu=null;}}];}
function grooveFileMenuUpdate(G){const I=grooveFileItems(G);navList(G.fileMenu,I.length);
 if(anyPressed('ok')){const it=I[G.fileMenu.sel];if(it.n!=='Back')G.fileMenu=null;it.go();SFX.ok();return;}
 if(backPressed()||MUI.esc){G.fileMenu=null;SFX.move();}}
function grooveFileMenuDraw(G){const I=grooveFileItems(G),M=G.fileMenu;dim(.55);panel(140,96,360,300,'#2de2f5');text('SONG FILE / CODE',320,128,20,'#ffd23a','center');
 MUI.add(0,0,W,H,{hl:false,click:()=>{G.fileMenu=null;}});MUI.add(140,96,360,300,{hl:false,click:()=>{}});
 I.forEach((it,i)=>{const y=144+i*38,s=i===M.sel;rrect(158,y,324,32,8,s?'rgba(255,210,58,.95)':'rgba(30,60,90,.85)',s?'#fff':'#2de2f5',2);text(it.n,320,y+21,14,s?'#102':'#fff','center',null);
  MUI.add(158,y,324,32,{hl:false,hover:()=>{if(G.fileMenu)G.fileMenu.sel=i;},click:()=>{if(G.fileMenu){G.fileMenu.sel=i;MUI.btn('ok');}}});});
 const d=I[M.sel].d;if(d)wrap(d,160,344,320,14,11,'#cfe',null);}

// ---------- record the song to an audio file (plays it once from the top, then saves .webm / .m4a) ----------
function grooveRecord(G){if(!window.MediaRecorder||!AC){toast('Recording is not supported here','#ff5a8a');return;}
 if(muted){toast('Sound is muted. Press N first.','#ff5a8a');return;}
 unlockAudio();const M=musBus();if(!M)return;G.stop();registerSong('__studio',G.S);const T=getTrack('__studio'),dur=T.N*T.sd+1.6;
 let dest,mr;try{dest=M.a.createMediaStreamDestination();M.master.connect(dest);
  const type=['audio/webm;codecs=opus','audio/webm','audio/mp4','audio/ogg'].find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
  mr=new MediaRecorder(dest.stream,type?{mimeType:type,audioBitsPerSecond:192000}:undefined);}catch(e){toast('Recording failed to start','#ff5a8a');return;}
 const chunks=[];mr.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
 G.rec={mr,dest,M,t0:performance.now(),dur,cancel:false};
 mr.onstop=()=>{try{M.master.disconnect(dest);}catch(e){}const r=G.rec;G.rec=null;G.stop();if(!r||r.cancel){toast('Recording cancelled','#9fb');return;}
  const mt=mr.mimeType||'audio/webm',ext=/mp4/.test(mt)?'m4a':/ogg/.test(mt)?'ogg':'webm';saveBlob(new Blob(chunks,{type:mt}),fileSafe(G.S.name)+'.'+ext);playStinger('unlock');toast('Saved audio: '+fileSafe(G.S.name)+'.'+ext,'#2de2f5');};
 mr.start(250);G.play();G.rec.timer=setTimeout(()=>grooveRecStop(G,false),dur*1000);}
function grooveRecStop(G,cancel){const r=G.rec;if(!r)return;clearTimeout(r.timer);r.cancel=cancel;try{r.mr.stop();}catch(e){G.rec=null;}}
function grooveRecDraw(G){const r=G.rec,el=(performance.now()-r.t0)/1000,f=Math.min(1,el/r.dur),mm=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
 rrect(160,8,320,56,12,'rgba(40,6,20,.95)','#ff5a8a',3);ctx.fillStyle=Math.floor(TIME*2)%2?'#ff2a5a':'#801';ctx.beginPath();ctx.arc(184,30,8,0,7);ctx.fill();
 text('RECORDING  '+mm(el)+' / '+mm(r.dur),330,35,16,'#fff','center',null);rrect(178,46,284,8,4,'#311',null);rrect(178,46,Math.max(6,284*f),8,4,'#ff5a8a',null);
 MUI.add(0,0,W,H,{hl:false,click:()=>{}});MUI.chips([{t:'B  Cancel recording',fn:()=>grooveRecStop(G,true)}],70,22);}
