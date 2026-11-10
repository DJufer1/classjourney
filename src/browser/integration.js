// Website integration: existing lesson UI, local folder storage, agent-first setup.
const instructionFiles = () => [
  {name:'START_HERE.md', content:'# ClassJourney – lokaler Planungsordner\n\nLies Anweisungen KI-Agent/class-journey/SKILL.md vollständig und danach die Referenzen. Vor der Browserverbindung keine Pläne erstellen. Bei bestehender Verbindung BROWSER-Verbindung.json und data/plans.json lesen. Ausschliesslich beauftragte Pläne bearbeiten. Die Website übernimmt output/Sammlung.classjourney.json automatisch.\n'},
  {name:'AGENTS.md', content:'# ClassJourney\n\nLies zuerst START_HERE.md und den vollständigen Skill unter Anweisungen KI-Agent/class-journey/SKILL.md. Folge dessen Datenformat und Ordnerprotokoll.\n'},
  {name:'CLAUDE.md', content:'# ClassJourney\n\nLies zuerst START_HERE.md und den vollständigen Skill unter Anweisungen KI-Agent/class-journey/SKILL.md. Folge dessen Datenformat und Ordnerprotokoll.\n'},
  {name:'Anweisungen KI-Agent/class-journey/SKILL.md', content:aiText()},
  {name:'Anweisungen KI-Agent/class-journey/references/LEKTIONEN.json', content:document.getElementById('default-lessons').textContent.trim()},
  {name:'Anweisungen KI-Agent/class-journey/references/DATENFORMAT.json', content:schemaText()}
];
const browserWorkspace = new ClassJourneyBrowserWorkspace.Workspace({
  getCollection:()=>state,
  validate:validateCollection,
  isEditing:()=>screen==='editor' || !!document.querySelector('[contenteditable]:focus, #browser-root-path:focus') || (!!document.querySelector('dialog[open]') && !byId('browser-folder-status')),
  setImporting:busy=>{app.inert=busy;},
  supportFiles:instructionFiles,
  onApply:async(collection,result)=>{
    state=validateCollection(collection);setUiLanguage(state.settings.language||getUiLanguage());
    if(db) await new Promise((resolve,reject)=>{const tx=db.transaction('library','readwrite');tx.objectStore('library').put(clone(state),state.libraryId);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);}).catch(()=>{});
    saveWarn=false;saveState=tr('Im Speicherordner gesichert');
    if(!result.restored||screen!=='library'){closeDialog();if(screen==='lesson'&&!state.plans.some(p=>p.id===selectedId))screen='library';}
    render();
  },
  onStatus:status=>{
    updateSaveStatus();
    document.querySelectorAll('[data-action=connect-agent] span').forEach(el=>el.textContent=tr(browserWorkspace.connected?'KI-Agent · verbunden':'KI-Agent verbinden'));
    const target=byId('browser-folder-status');if(target)target.textContent=status.text||tr('Noch kein Ordner verbunden.');
  },
  onImported:result=>toast(tr(result.conflicts?'KI-Pläne übernommen. Bei parallelen Änderungen wurden beide Fassungen behalten.':'KI-Pläne automatisch übernommen.')),
  onError:error=>{const target=byId('browser-folder-status');if(target)target.textContent=error.message;}
});
const saveToBrowser=persist;
persist=function(){saveToBrowser();browserWorkspace.scheduleSave();};
const refreshSaveStatus=updateSaveStatus;
updateSaveStatus=function(){refreshSaveStatus();const status=browserWorkspace.status;if(status.kind==='none')return;document.querySelectorAll('.save-status').forEach(el=>{el.textContent=tr(status.text);el.classList.toggle('warn',['permission','error'].includes(status.kind));el.title=tr('Speicherordner: ')+(status.name||'');});};

let setupRequest=null, pendingBrowserFolder=null, enteredBrowserPath='', webRegistration=null, offlineReady=false;
const setupKey='classjourney-web-setup-'+state.libraryId;
try{const cached=JSON.parse(localStorage.getItem(setupKey));if(cached?.request?.libraryId===state.libraryId&&/^[a-zA-Z0-9-]+$/.test(cached.request.workspaceId)&&/^[a-zA-Z0-9-]+$/.test(cached.request.token)){setupRequest=cached.request;enteredBrowserPath=cached.path||'';}}catch{}
function preparationRequest(){
  if(!setupRequest)setupRequest={workspaceId:crypto.randomUUID(),libraryId:state.libraryId,token:crypto.randomUUID()};
  rememberPreparation();return setupRequest;
}
function rememberPreparation(){try{localStorage.setItem(setupKey,JSON.stringify({request:setupRequest,path:enteredBrowserPath}));}catch{}}
function setupPrompt(){
  const request=preparationRequest();
  const marker={format:'classjourney-browser-setup',version:1,...request,root:'__ABSOLUTER_ORDNERPFAD__',preparedAt:'__AKTUELLE_UNIX_MILLISEKUNDEN_ALS_ZAHL__'};
  const files=instructionFiles().concat({name:'BROWSER-Vorbereitung.json',content:JSON.stringify(marker,null,2)});
  return 'Richte für mich ClassJourney als Website mit lokalem Ordner ein. Nutze deine vorhandenen Dateiwerkzeuge. Installiere oder lade kein ClassJourney-Programm herunter, starte keinen lokalen Server und richte keine Cloud-Synchronisierung ein.\n\n'+
    '1. Lies den unten vollständig enthaltenen Skill und die Referenzen. Lege einen neuen Ordner namens ClassJourney in einem lokalen Bereich an, auf den du tatsächlich Lese- und Schreibzugriff hast. Nutze keinen Ordner einer installierten ClassJourney-App, keine vorhandenen fremden Daten und möglichst keinen durch OneDrive, iCloud oder Dropbox synchronisierten Bereich. Falls du keinen geeigneten Ort verwenden darfst, fordere die nötige Ordnerfreigabe in deiner KI-Anwendung an.\n'+
    '2. Ermittle den realen vollständigen absoluten Pfad. Erstelle die unten aufgeführten Textdateien unter genau diesem Ordner; content ist jeweils der vollständige Dateiinhalt. In BROWSER-Vorbereitung.json ersetze nur __ABSOLUTER_ORDNERPFAD__ durch den tatsächlichen Pfad und __AKTUELLE_UNIX_MILLISEKUNDEN_ALS_ZAHL__ durch die aktuelle Unix-Zeit als Zahl. workspaceId, libraryId und token unverändert übernehmen. Erstelle ausserdem die leeren Unterordner data, assets und output.\n'+
    '3. Lies die geschriebenen Dateien zurück und prüfe den Pfad, die Kennungen und den vollständigen Skill. Behaupte keinen Zugriff ohne diese tatsächliche Prüfung. Erstelle noch keine Pläne: Beim Verbinden stellt die Website meine Sammlung und die vorgefertigten Bilder bereit.\n'+
    '4. GIB MIR DEN VOLLSTÄNDIGEN ABSOLUTEN ORDNERPFAD ZUM KOPIEREN ZURÜCK, allein in einem Codeblock, ohne Anführungszeichen. Erkläre kurz: Diesen Pfad in ClassJourney einfügen; «Ordner auswählen und freigeben» anklicken; im Browserdialog genau diesen Ordner auswählen und den Zugriff erlauben. Der Pfad allein erteilt dem Browser keinen Zugriff. Warte danach auf meinen Planungsauftrag.\n\n'+
    'Die folgenden Dateien enthalten den vollständigen Skill; es ist kein zusätzlicher Skill-Download erforderlich. JSON-Zeichenfolgen beim Speichern korrekt dekodieren.\n\nDATEIEN_JSON_START\n'+JSON.stringify({files},null,2)+'\nDATEIEN_JSON_ENDE';
}
async function copyText(text){
  try{await navigator.clipboard.writeText(text);}catch{
    const el=byId('agent-prompt');if(!el)throw new Error('Bitte den Text markieren und kopieren.');
    el.closest('details')?.setAttribute('open','');el.value=text;el.focus();el.select();
    if(!document.execCommand('copy'))throw new Error('Bitte den markierten Text kopieren.');
  }
  toast(tr('Startanweisung mit vollständigem Skill kopiert.'));
}
function browserFolderDialog(){
  const supported=typeof showDirectoryPicker==='function'&&isSecureContext,connected=browserWorkspace.connected;
  const path=connected?browserWorkspace.marker?.agentRoot||'':enteredBrowserPath;
  const reconnect=!!browserWorkspace.remembered&&!connected;
  const body=connected?ui`<section class="browser-folder-card"><div class="eyebrow">Verbunden</div><h3>Deine KI und ClassJourney arbeiten im selben Ordner</h3><p class="browser-status-path">${escape(path)}</p><p>Pläne und Bilder bleiben lokal. Fertige KI-Pläne werden automatisch übernommen, sobald ClassJourney geöffnet und die Planbearbeitung abgeschlossen ist.</p><div class="row"><button data-action="browser-check">Jetzt prüfen</button><button data-action="browser-disconnect">Verbindung trennen</button></div></section>`:
    ui`<p>Deine vorhandene lokale KI bereitet den Ordner vor. Danach verbindest du ihn hier.</p><div class="browser-steps"><span class="browser-step">1 · KI vorbereiten lassen</span><span class="browser-step">2 · Pfad einfügen</span><span class="browser-step">3 · Ordner freigeben</span></div><section class="browser-folder-card"><div class="eyebrow">1 · Einmal in deiner KI</div><h3>Ordner und Skill automatisch einrichten</h3><p>Kopiere die Startanweisung in deine lokale KI. Sie enthält den vollständigen Skill und das Datenformat. Die KI erstellt einen Ordner, prüft ihren Zugriff und gibt dir den Pfad zurück.</p><button class="primary" data-action="browser-copy">${ico('copy')}Startanweisung kopieren</button><details class="browser-prompt-details"><summary>Startanweisung ansehen</summary><textarea id="agent-prompt" class="ai-text" aria-label="Startanweisung mit vollständigem Skill" readonly></textarea></details></section><section class="browser-folder-card"><div class="eyebrow">2 + 3 · Zurück in ClassJourney</div><h3>Den vorbereiteten Ordner verbinden</h3><label for="browser-root-path">Ordnerpfad aus der KI einfügen</label><input id="browser-root-path" class="browser-path-input" type="text" autocomplete="off" spellcheck="false" maxlength="1024" placeholder="C:\\Users\\Name\\ClassJourney" value="${escape(path)}"><p class="section-note">Der Browser benötigt zusätzlich deine Freigabe. Wähle im folgenden Ordnerdialog denselben Ordner. Du kannst den Pfad dort in die Adressleiste einfügen.</p><div class="row">${supported?ui`<button class="primary" data-action="browser-select" ${path?'':'disabled'}>${ico('folder')}Ordner auswählen und freigeben</button>${reconnect?ui`<button data-action="browser-resume">Bisherigen Zugriff bestätigen</button>`:''}`:ui`<p>Die feste Ordnerverbindung benötigt Chrome oder Edge auf einem Computer. Dateiimport bleibt möglich.</p>`}</div><details><summary>Bereits eingerichteten Ordner erneut verwenden</summary><p>Füge dessen bekannten Pfad ein und wähle ihn aus. Eine neue Startanweisung ist nicht nötig. Die vorhandene Sammlung wird geöffnet.</p></details></section>`;
  showDialog(tr('KI-Agent verbinden'),body+ui`<div id="browser-folder-status" class="notice agent-status" role="status">${escape(browserWorkspace.status.text||tr('Noch kein Ordner verbunden.'))}</div><p class="web-offline-note">Kein ClassJourney-Download erforderlich. Deine KI behält ihren eigenen Tarif und ihre eigenen Zugriffsfreigaben.</p>`,ui`<button data-action="agent-help">Hilfe</button><button data-action="close-dialog">Schliessen</button>`,760);
  if(!connected){byId('agent-prompt').value=setupPrompt();byId('browser-root-path').addEventListener('input',event=>{enteredBrowserPath=event.target.value.trim();rememberPreparation();const button=document.querySelector('[data-action=browser-select]');if(button)button.disabled=!enteredBrowserPath;});}
}
connectAgent=async function(){browserFolderDialog();};
agentHelp=function(){showDialog(tr('Lokaler Ordner und eigene KI'),ui`<div class="help-copy"><h3>Der Skill ist schon dabei</h3><p>Die kopierbare Startanweisung enthält die vollständigen Planungsregeln, Unterrichtszeiten und das Datenformat. Deine KI speichert sie im vorbereiteten Ordner und liest sie bei der Planung.</p><h3>Pfad und Freigabe</h3><p>Die KI kennt ihren tatsächlichen Ordnerpfad und gibt ihn zum Kopieren zurück. Füge ihn hier ein und wähle denselben Ordner im Browserdialog. Eine Website kann sich mit einem Textpfad allein keinen Dateizugriff geben.</p><h3>Beim nächsten Besuch</h3><p>ClassJourney merkt sich den Ordner in diesem Browser. Je nach Browserfreigabe genügt das Öffnen der Website oder ein Klick auf «Bisherigen Zugriff bestätigen». Nach gelöschten Browserdaten kannst du deinen bestehenden Ordner erneut auswählen.</p><h3>Automatische Übernahme</h3><p>Die KI schreibt fertige Pläne und Bilder in deinen Ordner. Die geöffnete Website übernimmt sie automatisch. Während einer Planbearbeitung wartet sie. Bei parallelen Änderungen bleiben beide Fassungen erhalten. Sicherungen liegen ebenfalls im lokalen Ordner.</p><h3>Offline</h3><p>Nach erfolgreicher Vorbereitung im Browser kann die Website ohne Internet geöffnet werden. Neue KI-Arbeit kann je nach KI weiterhin Internet benötigen. Gelöschte Browserdaten können einen erneuten Online-Aufruf erforderlich machen.</p></div>`,ui`<button class="primary" data-action="connect-agent">Zur Einrichtung</button><button data-action="close-dialog">Schliessen</button>`,680);};
header=function(){return ui`<header class="topbar"><div class="row"><div class="brand"><img class="brand-icon" src="${APP_ICON}" width="34" height="34" alt="">ClassJourney</div><span class="save-status ${saveWarn?'warn':''}" title="Deine Daten bleiben auf diesem Gerät">${escape(saveState)}</span></div><nav class="top-actions" aria-label="Werkzeuge">${languagePicker()}<span class="agent-tools"><button class="agent-connect" data-action="connect-agent">${ico('spark')}<span>${browserWorkspace.connected?tr('KI-Agent · verbunden'):tr('KI-Agent verbinden')}</span></button><button class="agent-help" data-action="agent-help" aria-label="KI-Verbindung erklären">?</button></span><button class="icon-button" data-action="import" title="Sammlung laden" aria-label="Sammlung laden">${ico('import')}</button><button class="icon-button" data-action="export" title="Sammlung sichern" aria-label="Sammlung sichern">${ico('export')}</button><button class="icon-button" data-action="updates" title="Website und Offline-Nutzung" aria-label="Website und Offline-Nutzung">${ico('route')}</button><button class="icon-button" data-action="help" title="Hilfe" aria-label="Hilfe">${ico('help')}</button></nav></header>`;};
exportDialog=function(){showDialog(tr('Sammlung sichern und weitergeben'),ui`<p>Deine Pläne bleiben im lokalen Ordner und in diesem Browser. Für ein anderes Gerät oder zum Weitergeben kannst du eine Datensicherung erstellen.</p><button class="export-choice" data-action="export-json">${ico('export')}<span><strong>Sammlung als Datei sichern</strong><small>Unterrichtstage und Bilder gemeinsam. Über «Sammlung laden» wieder öffnen.</small></span></button><button class="export-choice" data-action="ai-help">${ico('help')}<span><strong>KI-Anweisungen ansehen</strong><small>Der vollständige Skill mit den Regeln für deine Planung.</small></span></button>`);};
help=function(){showDialog(tr('ClassJourney verwenden'),ui`<div class="help-copy"><h3>Unterricht vorbereiten</h3><p>Erstelle und dupliziere Unterrichtstage. Wähle Lektionen und ergänze Aufträge. Feste Pausen ergeben sich aus den Unterrichtszeiten; Überhänge bleiben erhalten und werden rot angezeigt.</p><h3>Im Unterricht</h3><p>Öffne den passenden Tag. Echte Tage folgen der Gerätezeit, der Demo-Tag hat seine eigene Uhr. Die Vorschau hilft beim Vorbereiten. Alle zwölf vorgefertigten Icons bleiben verfügbar.</p><h3>Lokal speichern</h3><p>Verbinde deinen von der KI vorbereiteten Ordner. Darin liegen deine Pläne, Bilder, Anweisungen und Sicherungen. Ohne verbundenen Ordner sichert ClassJourney in diesem Browser. Zum Weitergeben nutze die Sammlungsdatei.</p><h3>Ohne Installation</h3><p>Öffne einfach die Website in Chrome oder Edge. Unter «Website und Offline-Nutzung» siehst du, ob sie zum Offline-Start bereit ist.</p></div>`,ui`<button data-action="connect-agent">KI-Agent verbinden</button><button data-action="close-dialog">Schliessen</button>`,650);};
updateDialog=function(){showDialog(tr('Website und Offline-Nutzung'),ui`<p>ClassJourney · ${escape(APP_INFO.version)}</p><div id="web-update-status" class="notice" role="status">${webRegistration?.waiting?tr('Eine neue Website-Version ist bereit.'):offlineReady?tr('Die Website ist für den Offline-Start in diesem Browser bereit.'):tr('Die Offline-Vorbereitung ist noch nicht bestätigt. Öffne die Website einmal mit Internet.')}</div><p>Updates werden über die Website bereitgestellt. Deine Sammlung bleibt lokal. Die Unterrichtsansicht wird nicht während des Unterrichts neu geladen.</p><div class="row"><button data-action="web-check-update">Auf Updates prüfen</button><button data-action="web-reload">Website neu laden</button></div>`,ui`<button data-action="close-dialog">Schliessen</button>`);};
const previousAction=handleAction;
handleAction=async function(action,element){
  try{
    switch(action){
      case 'browser-copy':await copyText(setupPrompt());return;
      case 'browser-select':{
        const path=ClassJourneyBrowserWorkspace.normalizeAgentPath(byId('browser-root-path')?.value);
        enteredBrowserPath=path;rememberPreparation();
        // An absolute path cannot be supplied as startIn. The user selects it explicitly.
        const root=await showDirectoryPicker({id:'classjourney-web-folder',mode:'readwrite',startIn:browserWorkspace.remembered||'documents'});
        const target=byId('browser-folder-status');if(target)target.textContent=tr('Vorbereitung wird geprüft und Sammlung verbunden …');
        const result=await browserWorkspace.connect(root,{preparation:preparationRequest(),enteredPath:path});
        if(result.choice){pendingBrowserFolder=root;showDialog(tr('Vorhandene Sammlung öffnen'),ui`<p>In diesem Ordner liegen ${result.plans} Unterrichtstage. Möchtest du diese Sammlung öffnen?</p>`,ui`<button data-action="connect-agent">Abbrechen</button><button class="primary" data-action="browser-adopt">Sammlung öffnen</button>`);}
        else{browserFolderDialog();toast(tr('Ordner geprüft und verbunden. Deine KI kann jetzt planen.'));}return;
      }
      case 'browser-adopt':if(pendingBrowserFolder){await browserWorkspace.connect(pendingBrowserFolder,{existing:true,enteredPath:enteredBrowserPath});pendingBrowserFolder=null;browserFolderDialog();}return;
      case 'browser-resume':await browserWorkspace.resume();browserFolderDialog();return;
      case 'browser-disconnect':await browserWorkspace.disconnect();browserFolderDialog();return;
      case 'browser-check':await browserWorkspace.inspect(true);browserFolderDialog();return;
      case 'web-check-update':{
        if(!webRegistration)throw new Error('Die Offline-Verbindung ist noch nicht bereit. Bitte mit Internet erneut öffnen.');
        await webRegistration.update();const target=byId('web-update-status');if(target)target.textContent=webRegistration.waiting?tr('Eine neue Version ist bereit. Du kannst die Website neu laden.'):tr('Prüfung abgeschlossen. Neue Versionen werden für den nächsten Start vorbereitet.');return;
      }
      case 'web-reload':{
        if(screen==='editor')throw new Error('Speichere zuerst deinen bearbeiteten Unterrichtstag.');
        if(screen==='lesson')throw new Error('Wechsle zuerst zu deinen Plänen, bevor du die Website neu lädst.');
        if(browserWorkspace.connected)await browserWorkspace.save();
        await new Promise(resolve=>setTimeout(resolve,800));
        if(webRegistration?.waiting){navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload(),{once:true});webRegistration.waiting.postMessage('ACTIVATE_UPDATE');}
        else location.reload();return;
      }
      case 'export-html':case 'export-ai':case 'download-program':case 'download-windows':case 'download-mac':case 'download-portable':case 'download-update':case 'install':case 'open-desktop-agent':case 'copy-browser-agent-prompt':case 'publish-update':return;
      default:return await previousAction(action,element);
    }
  }catch(error){
    const message=error.name==='AbortError'?tr('Ordnerauswahl abgebrochen. Deine Daten bleiben erhalten.'):error.message;
    const target=byId('browser-folder-status')||byId('web-update-status');if(target)target.textContent=message;
    if(error.name!=='AbortError')toast(message,true);
  }
};
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&browserWorkspace.connected)browserWorkspace.inspect().catch(error=>browserWorkspace.fail(error));});
if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol)){
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).then(async registration=>{webRegistration=registration;await navigator.serviceWorker.ready;offlineReady=true;}).catch(()=>{});
}
