// ===== Music hook (fallbacks) =====
// The game names tracks; music.js plays them. Contract with the music file:
//   startMusic(name)  screens: 'title','map','watch','enter_code','results','lair','cutscene','villain','gameover'
//   startMusic(levelMusic(def)) / startMusic(bossMusic(def))   levels may set def.music / def.bossMusic
//   pushMusic('watch') ... popMusic()   for the Gadget Watch over a level
//   playStinger('win'|'lose'|'clue'|'unlock'|'code_ok'|'code_bad')
// Anything music.js already defines wins; these are only used when it doesn't.
if(typeof levelMusic!=='function')window.levelMusic=def=>def.music||'level';
if(typeof bossMusic!=='function')window.bossMusic=def=>def.bossMusic||'boss';
if(typeof pushMusic!=='function'){window._musStack=[];window.pushMusic=n=>{_musStack.push(MT.name);startMusic(n);};window.popMusic=()=>{const n=_musStack.pop();if(n)startMusic(n);};}
if(typeof playStinger!=='function')window.playStinger=k=>{const S={win:'win',clue:'win',unlock:'win',code_ok:'ok',code_bad:'hurt',lose:'hurt'}[k];if(S&&SFX[S])SFX[S]();};
// Old music.js only knows menu/level/boss: map the new names onto those until the new soundtrack lands
if(typeof TRACKS!=='undefined'&&!TRACKS.title){const _sm=startMusic;
 window.startMusic=n=>_sm(TRACKS[n]?n:(['title','map','watch','enter_code','results','lair','cutscene'].includes(n)?'menu':['villain','gameover'].includes(n)||/boss|papa|foreman|runner/.test(n)?'boss':'level'));}
