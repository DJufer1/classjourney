const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('classJourneyDesktop',{
  info:()=>ipcRenderer.invoke('classjourney:info'),
  loadCollection:()=>ipcRenderer.invoke('classjourney:load'),
  saveCollection:data=>ipcRenderer.invoke('classjourney:save',data),
  checkUpdates:()=>ipcRenderer.invoke('classjourney:check-update'),
  downloadUpdate:()=>ipcRenderer.invoke('classjourney:download-update'),
  openInstaller:()=>ipcRenderer.invoke('classjourney:open-installer'),
  onUpdateProgress:callback=>{const listener=(_event,percent)=>callback(percent);ipcRenderer.on('classjourney:update-progress',listener);return()=>ipcRenderer.removeListener('classjourney:update-progress',listener);}
});
