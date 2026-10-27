const AI_START = `# ClassJourney – KI-Arbeitsordner

Dieser Ordner gehört der Lehrperson. Bearbeite ihn im Rahmen ihres Auftrags.
Wenn Unterrichtstage vorbereitet oder geändert werden sollen:
1. Lies skills/tagesablauf/SKILL.md, skills/tagesablauf/references/LEKTIONEN.json und data/plans.json. Nutze die Standardzeiten für die von der Lehrperson genannten Lektionsnummern.
2. Behalte andere Pläne und deren Kennungen bei. Ergänze Klasse, Wochentag/Datum und Themenblock.
3. Die Bilddateien liegen unter assets/. Erstelle thematisch passende neue Symbole und Reisehintergründe mit CH-Referenzen, wenn ein Bildwerkzeug verfügbar ist.
4. Passe die lesbare Plandatei an. Erhalte srcFile/imageFile-Verweise. Keine Base64-Bilddaten in die Unterhaltung kopieren.
5. Führe python scripts/build_collection.py --root . aus.
6. Übergib output/ClassJourney-neu.html und output/Sammlung.classjourney.json.
Die Bildgenerierung ist eine Fähigkeit der verwendeten KI, nicht dieses Ordners. Ohne Bildwerkzeug keine neu erzeugten Bilder behaupten.
Keine privaten Unterrichtsunterlagen oder Sammlungen auf GitHub hochladen. Bei reiner Prüfung oder Erklärung keine Pläne ändern.
`;
async function exportWorkspace(){
  const readable=clone(state),files=[],encoder=new TextEncoder();
  const addImage=(value,base)=>{const match=value.match(/^data:(image\/(?:png|jpeg|webp|gif));base64,([\s\S]+)$/);if(!match)throw new Error('Ein Bild konnte nicht exportiert werden.');const ext=match[1].split('/')[1].replace('jpeg','jpg');const name=base+'.'+ext;const text=atob(match[2]);const bytes=new Uint8Array(text.length);for(let i=0;i<text.length;i++)bytes[i]=text.charCodeAt(i);files.push({name,content:bytes});return name;};
  for(const [id,item] of Object.entries(readable.assets.backgrounds)){item.srcFile=addImage(item.src,'assets/backgrounds/'+id);delete item.src;}
  for(const key of ['atlas','fageAtlas']){if(readable.assets[key]){readable.assets[key+'File']=addImage(readable.assets[key],'assets/symbols/'+key);delete readable.assets[key];}}
  for(const p of readable.plans)for(const a of p.activities)if(a.image){a.imageFile=addImage(a.image,'assets/activities/'+p.id+'-'+a.id);a.image='';}
  readable.workspaceAssets=true;
  const instructions=aiText();
  const intro=`ClassJourney – für Kollegium und lokale KI\n\n1. ZIP vollständig in einen eigenen Ordner entpacken.\n2. ClassJourney.html startet die Anwendung offline.\n3. Für die KI: Diesen Ordner in Codex, Claude Code oder einem anderen lokalen KI-Werkzeug öffnen. Auftrag: Lies START_HERE.md und bereite meine Unterrichtstage vor.\n4. Die Unterlagen und Lektionszeiten hinzufügen. Die KI bearbeitet data/plans.json und die Bilddateien.\n5. Das Hilfsskript erstellt output/ClassJourney-neu.html und eine Sammlung zum Laden im Programm.\n\nWenn deine KI keinen Ordnerzugriff hat, gib ihr START_HERE.md, den Tagesablauf-Skill und data/plans.json ausdrücklich mit. Ein eigenes Bildwerkzeug ist für neue Bilder nötig.\n\nDeine Daten bleiben lokal. Der Ordner ist kein Cloud-Workspace und verlangt keinen neuen Tarif.\n`;
  const packageFiles=[{name:'HIER-STARTEN.txt',content:intro},{name:'START_HERE.md',content:AI_START},{name:'AGENTS.md',content:AI_START},{name:'CLAUDE.md',content:AI_START},{name:'skills/tagesablauf/SKILL.md',content:instructions},{name:'skills/tagesablauf/references/DATENFORMAT.json',content:schemaText()},{name:'skills/tagesablauf/references/LEKTIONEN.json',content:document.getElementById('default-lessons').textContent},{name:'data/plans.json',content:JSON.stringify(readable,null,2)},{name:'scripts/update_collection.py',content:document.getElementById('collection-updater').textContent},{name:'scripts/build_collection.py',content:document.getElementById('workspace-builder').textContent},...files,{name:'ClassJourney.html',content:portableHTML()}];
  toast('Der KI-Arbeitsordner wird vorbereitet …');await new Promise(resolve=>setTimeout(resolve,30));download('ClassJourney-Dokumente-lokaler-KI-Agent.zip',makeZip(packageFiles),'application/zip');toast('Der KI-Ordner wird heruntergeladen. Bitte vor der Verwendung entpacken.');
}
