export const AGENT_SKILL_PATH='Anweisungen KI-Agent/class-journey';
export const AI_START=`# ClassJourney – Anweisungen KI-Agent

Dieser lokale Ordner gehört der Lehrperson. Lies zuerst Anweisungen KI-Agent/class-journey/SKILL.md und die dort verknüpften Referenzen. Lerne den Skill «Class Journey» im Sinn von: Verstehe seine Kriterien und wende sie bei der Arbeit in diesem Ordner an. Behaupte kein dauerhaftes Modelltraining und keine globale Installation, wenn diese nicht erfolgt ist.

Wenn Unterrichtstage vorbereitet oder geändert werden sollen:
1. Lies data/plans.json und Anweisungen KI-Agent/class-journey/references/LEKTIONEN.json. Nutze die Standardzeiten für die genannten Lektionsnummern.
2. Behalte andere Pläne und deren Kennungen bei. Ergänze Klasse, Wochentag/Datum und Themenblock. Echte Unterrichtstage: isDemo false und example false. Nur der enthaltene Demo-Tag hat eine eigene Uhr.
3. Erstelle thematisch passende neue Symbole und Hintergründe mit CH-Referenzen. Sichtbare Themenmotive gehören in die Szene: bei Skelett z. B. ein Skelettmodell im Raum. Beachte die Bildkriterien des Skills. Für neue Bilder ist ein Bildwerkzeug nötig; ohne eines keine Bildgenerierung behaupten.
4. Bearbeite data/plans.json und die einzelnen Dateien unter assets/. Erhalte fremde Pläne und srcFile/imageFile-Verweise. Keine Base64-Bilddaten in die Unterhaltung kopieren.
5. Führe python scripts/build_collection.py --root . aus. Übergib output/ClassJourney-neu.html und output/Sammlung.classjourney.json.

Private Unterrichtsunterlagen und Sammlungen nicht auf GitHub hochladen. Bei reiner Erklärung oder beim Einlesen des Skills keine Unterrichtspläne ändern. Dateien im Ordner sind die Übergabe; die App führt keinen automatischen Abgleich mit der KI durch. Der Nutzer lädt das Ergebnis über «KI-Ergebnis laden».
`;
export const AGENT_PROMPT=`Lies START_HERE.md und Anweisungen KI-Agent/class-journey/SKILL.md in diesem ClassJourney-Ordner. Lerne den Skill «Class Journey» und wende ihn bei meinen folgenden Planungsaufträgen an. Nutze die Pläne unter data/plans.json und die gespeicherten Lektionszeiten. Erhalte bestehende Tage. Erstelle bei einem Planungsauftrag passende Symbole und einen Hintergrund mit konkreten Themenmotiven, z. B. einem Skelettmodell beim Thema Skelett. Lies zunächst nur den Skill und bestätige kurz, dass du bereit bist. Ich gebe dir danach Klasse, Lektionen und Unterrichtsunterlagen. Prüfe deinen Ordnerzugriff und fordere nötige Freigaben in deiner KI-Anwendung an.`;

export function buildAgentFiles({collection,html,skill,schema,lessons,updater,builder}){
  const readable=JSON.parse(JSON.stringify(collection)),files=[];
  const addImage=(value,base)=>{
    const match=value.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([\s\S]+)$/);
    if(!match)throw new Error('Ein Bild konnte nicht exportiert werden.');
    const name=base+'.'+match[1].split('/')[1].replace('jpeg','jpg');
    const decoded=atob(match[2]),bytes=new Uint8Array(decoded.length);
    for(let i=0;i<decoded.length;i++)bytes[i]=decoded.charCodeAt(i);
    files.push({name,content:bytes});return name;
  };
  for(const [id,item]of Object.entries(readable.assets.backgrounds)){item.srcFile=addImage(item.src,'assets/backgrounds/'+id);delete item.src;}
  for(const key of ['atlas','fageAtlas'])if(readable.assets[key]){readable.assets[key+'File']=addImage(readable.assets[key],'assets/symbols/'+key);delete readable.assets[key];}
  for(const plan of readable.plans)for(const a of plan.activities)if(a.image){a.imageFile=addImage(a.image,'assets/activities/'+plan.id+'-'+a.id);a.image='';}
  readable.workspaceAssets=true;
  const intro=`ClassJourney · Windows & Mac\n\nZIP vollständig entpacken und ClassJourney.html im Browser öffnen. Das Programm läuft lokal und offline. Den Ordner an einem festen Ort aufbewahren. Optional eine Verknüpfung (Windows) oder ein Alias (Mac) der HTML-Datei auf dem Desktop ablegen.\n\nEigene Pläne bleiben im Speicher dieses Browsers. Über «Speichern & teilen» zusätzlich als Datei sichern, besonders vor einem Update, einem Browserwechsel oder dem Verschieben des Ordners.\n\nKI-Agent verbinden:\n1. Diesen Ordner in der eigenen lokalen KI öffnen und den Dateizugriff dort erlauben.\n2. START_HERE.md lesen lassen oder die Startanweisung aus dem Programm einfügen.\n3. Der Skill «Class Journey» liegt in «Anweisungen KI-Agent».\n4. Danach Unterrichtsunterlagen, Klasse und Lektionen mitgeben.\n5. Die KI erstellt output/Sammlung.classjourney.json. Im Programm «KI-Ergebnis laden» wählen.\n\nClassJourney berechnet für diese Übergabe keine Gebühren. Du nutzt deine eigene KI; deren bestehende Kosten, Limits und Bildfunktionen gelten weiterhin. Kein zusätzlicher ClassJourney-Tarif und kein API-Schlüssel im Programm erforderlich.\n\nDer Demo-Tag hat eine eigene Uhr. Eigene und duplizierte Tage folgen der Gerätezeit.\nDownloads: https://github.com/DJufer1/classjourney/releases/latest\n`;
  return [{name:'HIER-STARTEN.txt',content:intro},{name:'START_HERE.md',content:AI_START},{name:'AGENTS.md',content:AI_START},{name:'CLAUDE.md',content:AI_START},{name:AGENT_SKILL_PATH+'/SKILL.md',content:skill},{name:AGENT_SKILL_PATH+'/references/DATENFORMAT.json',content:schema},{name:AGENT_SKILL_PATH+'/references/LEKTIONEN.json',content:lessons},{name:'data/plans.json',content:JSON.stringify(readable,null,2)},{name:'scripts/update_collection.py',content:updater},{name:'scripts/build_collection.py',content:builder},...files,{name:'ClassJourney.html',content:html}];
}

export async function writeAgentFolder(parent,files,baseName){
  // Always create a new snapshot; files already edited by an agent remain untouched.
  for(const file of files)if(!file.name||file.name.split('/').some(p=>!p||p==='.'||p==='..'||p.includes('\\')))throw new Error('Ungültiger Dateipfad.');
  if(!/^[a-zA-Z0-9_-]{1,100}$/.test(baseName))throw new Error('Ungültiger Ordnername.');
  let name=baseName;
  for(let suffix=2;;suffix++){
    try{await parent.getDirectoryHandle(name);name=baseName+'-'+suffix;}
    catch(error){if(error.name==='NotFoundError')break;throw error;}
  }
  const root=await parent.getDirectoryHandle(name,{create:true});
  for(const file of files){
    const parts=file.name.split('/'),filename=parts.pop();let directory=root;
    for(const part of parts)directory=await directory.getDirectoryHandle(part,{create:true});
    const handle=await directory.getFileHandle(filename,{create:true}),writer=await handle.createWritable();
    try{await writer.write(file.content);await writer.close();}
    catch(error){try{await writer.abort();}catch{}throw error;}
  }
  return {name,count:files.length};
}
