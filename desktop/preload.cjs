const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('classJourneyDesktop',{
  info:()=>ipcRenderer.invoke('classjourney:info'),
  loadCollection:()=>ipcRenderer.invoke('classjourney:load'),
  saveCollection:data=>ipcRenderer.invoke('classjourney:save',data),
  checkUpdates:()=>ipcRenderer.invoke('classjourney:check-update'),
  downloadUpdate:()=>ipcRenderer.invoke('classjourney:download-update'),
  openInstaller:()=>ipcRenderer.invoke('classjourney:open-installer'),
  agentInfo:language=>ipcRenderer.invoke('classjourney:agent-info',language),
  showAgentFolder:()=>ipcRenderer.invoke('classjourney:agent-folder'),
  linkAgent:(id,files,language)=>ipcRenderer.invoke('classjourney:link-agent',id,files,language),
  prepareAgentPrompt:(files,language)=>ipcRenderer.invoke('classjourney:prepare-agent-prompt',files,language),
  consumeAgentRequest:()=>ipcRenderer.invoke('classjourney:consume-agent-request'),
  onAgentRequest:callback=>{const listener=()=>callback();ipcRenderer.on('classjourney:agent-request',listener);return()=>ipcRenderer.removeListener('classjourney:agent-request',listener);},
  onUpdateProgress:callback=>{const listener=(_event,percent)=>callback(percent);ipcRenderer.on('classjourney:update-progress',listener);return()=>ipcRenderer.removeListener('classjourney:update-progress',listener);}
});
