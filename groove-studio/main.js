// Groove Studio: Electron shell. The studio itself is the web app in ./app, served from app:// so audio worklets load.
const {app,BrowserWindow,Menu,dialog,ipcMain,protocol,net,session,shell}=require('electron');
const path=require('path'),fs=require('fs'),{pathToFileURL}=require('url');
protocol.registerSchemesAsPrivileged([{scheme:'app',privileges:{standard:true,secure:true,supportFetchAPI:true,stream:true}}]);
let win=null,quitting=false,pendingOpen=null;
const songsDir=()=>{const d=path.join(app.getPath('music'),'Groove Studio');try{fs.mkdirSync(d,{recursive:true});}catch(e){}return d;};
const send=cmd=>win&&win.webContents.send('menu',cmd);

function createWindow(){
  win=new BrowserWindow({width:1440,height:900,minWidth:1100,minHeight:700,backgroundColor:'#121419',title:'Groove Studio',show:false,
    webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false,backgroundThrottling:false}});
  win.once('ready-to-show',()=>{win.maximize();win.show();});
  win.loadURL('app://studio/index.html');
  win.webContents.setWindowOpenHandler(({url})=>{shell.openExternal(url);return {action:'deny'};});
  win.webContents.on('did-finish-load',()=>{if(pendingOpen){openPath(pendingOpen);pendingOpen=null;}});
  // closing: the page autosaves, then we ask about unsaved changes
  win.on('close',e=>{if(quitting)return;e.preventDefault();win.webContents.send('app-quit');});
}
ipcMain.on('quit-reply',async(e,dirty)=>{
  if(dirty){const r=await dialog.showMessageBox(win,{type:'question',buttons:['Save','Don\'t Save','Cancel'],defaultId:0,cancelId:2,
      message:'Save changes to your song before closing?',detail:'If you don\'t save, Groove Studio still brings this song back next time you open it.'});
    if(r.response===2)return;if(r.response===0){send('saveThenQuit');return;}}
  quitting=true;app.quit();});
ipcMain.on('quit-now',()=>{quitting=true;app.quit();});
ipcMain.handle('open-file',async()=>{const r=await dialog.showOpenDialog(win,{defaultPath:songsDir(),properties:['openFile'],
    filters:[{name:'Songs',extensions:['groovestudio','json','cocosong','txt']}]});
  if(r.canceled||!r.filePaths[0])return null;return {path:r.filePaths[0],text:fs.readFileSync(r.filePaths[0],'utf8')};});
ipcMain.handle('save-file',async(e,o)=>{let p=o.path;
  if(!p){const wav=o.kind==='wav';const r=await dialog.showSaveDialog(win,{defaultPath:path.join(songsDir(),o.name),
      filters:[wav?{name:'WAV audio',extensions:['wav']}:o.kind==='coco'?{name:'Agent Coco song',extensions:['json']}:{name:'Groove Studio song',extensions:['groovestudio']}]});if(r.canceled||!r.filePath)return null;p=r.filePath;}
  fs.writeFileSync(p,typeof o.data==='string'?o.data:Buffer.from(o.data));if(o.kind==='wav')shell.showItemInFolder(p);return p;});
ipcMain.handle('confirm',async(e,msg)=>{const r=await dialog.showMessageBox(win,{type:'question',buttons:['Continue','Cancel'],defaultId:1,cancelId:1,message:msg});return r.response===0;});
function openPath(p){try{win.webContents.send('open-path',{path:p,text:fs.readFileSync(p,'utf8')});}catch(e){}}
app.on('open-file',(e,p)=>{e.preventDefault();if(win&&!win.webContents.isLoading())openPath(p);else pendingOpen=p;});

function buildMenu(){const mac=process.platform==='darwin';
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    ...(mac?[{role:'appMenu'}]:[]),
    {label:'File',submenu:[
      {label:'New Song',accelerator:'CmdOrCtrl+N',click:()=>send('new')},
      {label:'Open…',accelerator:'CmdOrCtrl+O',click:()=>send('open')},
      {type:'separator'},
      {label:'Save',accelerator:'CmdOrCtrl+S',click:()=>send('save')},
      {label:'Save As…',accelerator:'Shift+CmdOrCtrl+S',click:()=>send('saveAs')},
      {type:'separator'},
      {label:'Import Agent Coco Song…',click:()=>send('importCoco')},
      {label:'Export Song as WAV…',accelerator:'CmdOrCtrl+E',click:()=>send('export')},
      {label:'Export Loop as WAV…',click:()=>send('exportLoop')},
      {type:'separator'},{label:'Show Songs Folder',click:()=>shell.openPath(songsDir())},
      ...(mac?[]:[{role:'quit'}])]},
    {label:'Edit',submenu:[{role:'undo'},{role:'redo'},{type:'separator'},{role:'cut'},{role:'copy'},{role:'paste'},{role:'selectAll'}]},
    {label:'Transport',submenu:[{label:'Record',accelerator:'CmdOrCtrl+R',click:()=>send('record')}]},
    {label:'View',submenu:[{role:'togglefullscreen'},{type:'separator'},{role:'resetZoom'},{role:'zoomIn'},{role:'zoomOut'},{type:'separator'},{role:'toggleDevTools'}]},
    {role:'windowMenu'}]));}

app.whenReady().then(()=>{
  protocol.handle('app',req=>{const u=new URL(req.url);let p=decodeURIComponent(u.pathname);if(p==='/'||!p)p='/index.html';
    const f=path.normalize(path.join(__dirname,'app',p));if(!f.startsWith(path.join(__dirname,'app')))return new Response('no',{status:403});
    return net.fetch(pathToFileURL(f).toString());});
  session.defaultSession.setPermissionRequestHandler((wc,perm,cb)=>cb(['media','midi','clipboard-read','clipboard-sanitized-write'].includes(perm)));
  session.defaultSession.setPermissionCheckHandler((wc,perm)=>['media','midi','clipboard-read','clipboard-sanitized-write'].includes(perm));
  buildMenu();createWindow();});
app.on('window-all-closed',()=>app.quit());
app.on('before-quit',e=>{if(!quitting&&win){e.preventDefault();win.webContents.send('app-quit');}});
