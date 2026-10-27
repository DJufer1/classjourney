const {contextBridge,ipcRenderer}=require('electron');
contextBridge.exposeInMainWorld('classJourneyDesktop',{
  info:()=>ipcRenderer.invoke('classjourney:info'),
  loadCollection:()=>ipcRenderer.invoke('classjourney:load'),
  saveCollection:data=>ipcRenderer.invoke('classjourney:save',data),
  setEditorActive:active=>ipcRenderer.invoke('classjourney:editor-active',active),
  acknowledgeCollection:(revision,ids)=>ipcRenderer.invoke('classjourney:ack-collection',revision,ids),
  onCollectionChanged:callback=>{const listener=(_event,payload)=>callback(payload);ipcRenderer.on('classjourney:collection-changed',listener);return()=>ipcRenderer.removeListener('classjourney:collection-changed',listener);},
  onAgentSyncError:callback=>{const listener=(_event,message)=>callback(message);ipcRenderer.on('classjourney:agent-sync-error',listener);return()=>ipcRenderer.removeListener('classjourney:agent-sync-error',listener);},
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
