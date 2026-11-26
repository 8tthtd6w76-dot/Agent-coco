// Bridge between the studio page and macOS: file dialogs, menu commands, quitting safely.
const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('native',{
  openFile:()=>ipcRenderer.invoke('open-file'),
  saveFile:o=>ipcRenderer.invoke('save-file',o),
  confirm:msg=>ipcRenderer.invoke('confirm',msg),
  onMenu:cb=>ipcRenderer.on('menu',(e,cmd)=>cb(cmd)),
  onQuit:cb=>ipcRenderer.on('app-quit',async()=>{let dirty=false;try{dirty=await cb();}catch(e){}ipcRenderer.send('quit-reply',!!dirty);}),
  quitNow:()=>ipcRenderer.send('quit-now'),
  openWith:cb=>ipcRenderer.on('open-path',(e,o)=>cb(o))
});
