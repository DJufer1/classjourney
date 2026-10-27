const {app,BrowserWindow,ipcMain,shell,dialog,Menu,clipboard}=require('electron');
const path=require('node:path');
const fs=require('node:fs/promises');
const {pathToFileURL}=require('node:url');
const {createHash}=require('node:crypto');
const {isAgentLink}=require('./protocol.cjs');

const htmlPath=path.join(__dirname,'../docs/ClassJourney.html'),appURL=pathToFileURL(htmlPath).href;
const testMode=process.argv.find(arg=>arg.startsWith('--self-test='))?.split('=')[1];
const testDirectory=process.argv.find(arg=>arg.startsWith('--test-data-dir='))?.slice('--test-data-dir='.length);
if(testMode&&(!['write','read'].includes(testMode)||!testDirectory||!path.isAbsolute(testDirectory)))throw new Error('Self-tests require an explicit absolute test-data-dir.');
const dataDirectory=testMode?testDirectory:path.join(app.getPath('appData'),app.isPackaged?'ClassJourney':'ClassJourney-Development');
require('node:fs').mkdirSync(dataDirectory,{recursive:true});
app.setPath('userData',dataDirectory);
let window=null,store,updates,quitFlushed=false,nativeLanguage='de',nativeTranslate=message=>message;
let requestedAgent=process.argv.some(isAgentLink),rendererReady=false,appInitialized=false;
function requestAgentPanel(){requestedAgent=true;if(window&&rendererReady){requestedAgent=false;if(window.isMinimized())window.restore();window.show();window.focus();window.webContents.send('classjourney:agent-request');}else if(!window&&appInitialized)createWindow();}
if(!testMode)app.on('open-url',(event,url)=>{if(isAgentLink(url)){event.preventDefault();requestAgentPanel();}});

function allowedExternal(value){try{const url=new URL(value);return url.protocol==='https:'&&((url.hostname==='github.com'&&url.pathname.startsWith('/DJufer1/classjourney'))||url.hostname==='djufer1.github.io');}catch{return false;}}
function external(value){if(allowedExternal(value))shell.openExternal(value);}
function trusted(event){if(!window||event.sender!==window.webContents||event.senderFrame?.url!==appURL)throw new Error('Diese Aktion ist nur im ClassJourney-Fenster erlaubt.');}
function handle(channel,callback){ipcMain.handle('classjourney:'+channel,async(event,...args)=>{trusted(event);try{return await callback(...args);}catch(error){throw new Error(nativeTranslate(error.message));}});}

async function selfTest(){
  const report={version:app.getVersion(),platform:process.platform,mode:testMode};
  if(testMode==='write'){
    const html=await fs.readFile(htmlPath,'utf8'),match=html.match(/<script type="application\/json" id="embedded-data">([\s\S]*?)<\/script>/);
    if(!match)throw new Error('Embedded collection missing.');
    const data=JSON.parse(match[1]),own=structuredClone(data.plans[0]);
    own.id='native-update-fixture';own.title='Eigener Unterricht – Updateprüfung';own.className='TEST';own.isDemo=false;own.example=false;own.updatedAt=Date.now();
    data.plans.push(own);data.libraryId='native-update-test';data.modifiedAt=Date.now();data.settings.backgroundOpacity=0.67;
    await store.save(data);
    const saved=await store.load();await fs.writeFile(path.join(dataDirectory,'fixture-hash.txt'),createHash('sha256').update(JSON.stringify(saved)).digest('hex'));
    report.backupCreated=!!await store.backup('1.2.0');report.fixtureWritten=true;
  }else{
    const data=await store.load(),expected=await fs.readFile(path.join(dataDirectory,'fixture-hash.txt'),'utf8');
    if(createHash('sha256').update(JSON.stringify(data)).digest('hex')!==expected)throw new Error('Collection changed during installation/update.');
    const own=data.plans.find(plan=>plan.id==='native-update-fixture');
    if(own?.title!=='Eigener Unterricht – Updateprüfung'||own.isDemo||data.settings.backgroundOpacity!==0.67)throw new Error('Own plan or view settings were lost.');
    report.fixtureRetained=true;report.plans=data.plans.length;
    const {permissionPrompt}=await import('./agent-link.mjs');
    for(const language of ['de','en','fr','es','it']){
      const prompt=permissionPrompt(dataDirectory,path.dirname(process.execPath),language);
      if(!prompt.includes(dataDirectory)||!prompt.includes('Anweisungen KI-Agent/class-journey/SKILL.md')||/\{\d+\}/.test(prompt))throw new Error('Packaged agent instructions are incomplete.');
    }
    report.agentPromptLanguages=['de','en','fr','es','it'];
  }
  await fs.writeFile(path.join(dataDirectory,'self-test-'+testMode+'.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}

async function createWindow(){
  rendererReady=false;
  window=new BrowserWindow({width:1360,height:900,minWidth:820,minHeight:620,title:'ClassJourney',backgroundColor:'#f6f8f8',icon:path.join(__dirname,'../assets/icon-512.png'),autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.cjs'),contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
  window.webContents.setWindowOpenHandler(({url})=>{external(url);return {action:'deny'};});
  window.webContents.on('will-navigate',(event,url)=>{if(url!==appURL){event.preventDefault();external(url);}});
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  window.on('closed',()=>{window=null;rendererReady=false;});
  const menu=[...(process.platform==='darwin'?[{role:'appMenu'}]:[]),{role:'editMenu'},{role:'viewMenu'},{role:'windowMenu'}];
  Menu.setApplicationMenu(Menu.buildFromTemplate(menu));
  await window.loadFile(htmlPath);
}

if(!testMode&&!app.requestSingleInstanceLock())app.quit();
else app.whenReady().then(async()=>{
  const {CollectionStore}=await import('./store.mjs'),{InstallerUpdates}=await import('./update-service.mjs');
  store=new CollectionStore(dataDirectory);
  if(testMode){await selfTest();app.exit(0);return;}
  if(app.isPackaged)app.setAsDefaultProtocolClient('classjourney');
  const {translateText,normalizedLanguage,formatMessage}=await import('../src/i18n.mjs');
  nativeLanguage=normalizedLanguage((await store.load())?.settings?.language);
  nativeTranslate=message=>translateText(message,nativeLanguage);
  const t=message=>nativeTranslate(message);
  updates=new InstallerUpdates({version:app.getVersion(),platform:process.platform,directory:path.join(dataDirectory,'updates'),onProgress:percent=>{if(window&&!window.isDestroyed())window.webContents.send('classjourney:update-progress',percent);}});
  handle('info',()=>({version:app.getVersion(),platform:process.platform,packaged:app.isPackaged}));
  handle('consume-agent-request',()=>{rendererReady=true;const requested=requestedAgent;requestedAgent=false;return requested;});
  handle('load',()=>store.load());
  handle('save',async data=>{const saved=await store.save(data);nativeLanguage=normalizedLanguage(data?.settings?.language);return saved;});
  handle('check-update',()=>updates.check());
  handle('download-update',()=>updates.download());
  const {AgentWorkspace,discoverAgents,agentLaunchPlan,openAgent,copyAgentStart}=await import('./agent-link.mjs');
  const installationDirectory=app.isPackaged?(process.platform==='darwin'?path.resolve(path.dirname(process.execPath),'../..'):path.dirname(process.execPath)):path.resolve(__dirname,'..');
  const agentWorkspace=new AgentWorkspace(dataDirectory,installationDirectory);
  handle('agent-info',async language=>{nativeLanguage=normalizedLanguage(language);return {...agentWorkspace.info(nativeLanguage),apps:(await discoverAgents()).map(({id,label,promptMode})=>({id,label:t(label),promptMode}))};});
  handle('agent-folder',async()=>{await fs.mkdir(agentWorkspace.root,{recursive:true});const error=await shell.openPath(agentWorkspace.root);if(error)throw new Error(error);});
  const chooseAgentFiles=async()=>{
      const choice=await dialog.showMessageBox(window,{type:'question',title:t('ClassJourney-Ordner aktualisieren'),message:t('Im KI-Ordner liegen bereits andere Dateien.'),detail:t('Du kannst den aktuellen Stand der App übertragen. Vorher wird der vorhandene KI-Ordner vollständig unter «KI-Sicherungen» gesichert. Oder öffne den vorhandenen Stand, um dort weiterzuarbeiten.'),buttons:[t('App-Stand übertragen & verknüpfen'),t('Vorhandenen Ordner öffnen'),t('Abbrechen')],defaultId:1,cancelId:2});
      return ['replace','existing','cancel'][choice.response];
  };
  handle('prepare-agent-prompt',(files,language)=>{nativeLanguage=normalizedLanguage(language);return copyAgentStart(agentWorkspace,files,chooseAgentFiles,text=>clipboard.writeText(text),nativeLanguage);});
  handle('link-agent',async(id,files,language)=>{
    nativeLanguage=normalizedLanguage(language);
    const agent=(await discoverAgents()).find(agent=>agent.id===id);if(!agent)throw new Error('Das gewählte KI-Programm wurde nicht gefunden.');
    const prepared=await agentWorkspace.prepare(files,chooseAgentFiles,nativeLanguage);
    if(prepared.cancelled)return prepared;
    const plan=agentLaunchPlan(agent,prepared.root,prepared.prompt);
    await openAgent(plan,{openExternal:url=>shell.openExternal(url),copyPrompt:text=>clipboard.writeText(text)},prepared.prompt);
    return {root:prepared.root,agent:t(agent.label),promptInLink:plan.promptInLink,permissionConfirmationRequired:true};
  });
  handle('open-installer',async()=>{
    const pending=await updates.verifiedInstaller();
    const details=process.platform==='darwin'?t('ClassJourney wird beendet. Ziehe die neue ClassJourney-App im geöffneten Fenster in «Programme» und bestätige das Ersetzen. Deine Pläne bleiben im separaten Datenordner erhalten.'):t('ClassJourney wird beendet. Führe den geöffneten Installationsassistenten aus. Deine Pläne bleiben im separaten Datenordner erhalten.');
    const choice=await dialog.showMessageBox(window,{type:'info',title:t('ClassJourney aktualisieren'),message:formatMessage('Version {0} installieren?',[pending.version],nativeLanguage),detail:details,buttons:[t('Installer öffnen'),t('Abbrechen')],defaultId:0,cancelId:1});
    if(choice.response!==0)return {cancelled:true};
    await store.backup(pending.version);
    const error=await shell.openPath(pending.path);if(error)throw new Error('Der Installer konnte nicht geöffnet werden: '+error);
    setTimeout(()=>app.quit(),400);return {opened:true};
  });
  appInitialized=true;await createWindow();
  app.on('activate',()=>{if(!window)createWindow();});
}).catch(error=>{console.error(error.message);if(testMode)app.exit(1);else{dialog.showErrorBox('ClassJourney konnte nicht starten',error.message);app.exit(1);}});
app.on('second-instance',(_event,args)=>{if(args.some(isAgentLink))requestAgentPanel();if(window){if(window.isMinimized())window.restore();window.focus();}});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});
app.on('before-quit',event=>{if(!quitFlushed&&store){event.preventDefault();store.flush().finally(()=>{quitFlushed=true;app.quit();});}});
