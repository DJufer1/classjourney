import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {InstallerUpdates} from '../desktop/update-service.mjs';
import {installerName,INSTALLER_CHECKSUMS} from '../src/updates.mjs';
const repository=process.env.GITHUB_REPOSITORY;
if(repository?.toLowerCase()!=='djufer1/classjourney'||!process.env.GITHUB_TOKEN)throw new Error('Only DJufer1/classjourney may publish these installers.');
const version=JSON.parse(await fs.readFile('package.json','utf8')).version,tag='v'+version;
const {previousVersion}=JSON.parse(await fs.readFile('desktop/test-baseline.json','utf8'));
const headers={Authorization:'Bearer '+process.env.GITHUB_TOKEN,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
const api=async(route,method='GET',body)=>{const response=await fetch('https://api.github.com/repos/DJufer1/classjourney'+route,{method,headers:{...headers,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});if(!response.ok)throw Object.assign(new Error('GitHub API: '+response.status+' '+route),{status:response.status});return response.status===204?null:response.json();};
let release;
try{release=await api('/releases/tags/'+tag);}catch(error){if(error.status!==404)throw error;release=await api('/releases','POST',{tag_name:tag,target_commitish:process.env.GITHUB_SHA||'main',name:'ClassJourney '+version,draft:true,prerelease:false,body:'ClassJourney '+version+' · lokale KI-Verknüpfung und DE / EN / FR / ES / IT.\n\nKlassen und Themen werden über kombinierbare Dropdowns gefiltert. Import zeigt nach unten in die Ablage, Export nach oben aus der Ablage.\n\nZwei Wege zur eigenen KI: erkanntes Programm öffnen oder Startprompt kopieren. Beide stellen zuerst den vollständigen Skill «Class Journey» samt Referenzen, Plänen und Bildern im festen lokalen KI-Ordner bereit. Freigaben werden in der eigenen KI bestätigt; Nachrichten werden nicht automatisch gesendet.\n\nDie fünf Oberflächensprachen lassen sich oben umschalten. Eigene Unterrichtstexte bleiben erhalten. Die übergebenen Skill-Dateien enthalten die ausführlichen deutschen Originalanweisungen; der Startprompt fordert Antworten in der gewählten Sprache an.\n\nZusätzlich zu den Installern gibt es weiterhin die einzelne Browserdatei, den portablen Ordner und «Dokumente für lokalen KI Agenten».'});}
const files=[{name:installerName('win32'),file:path.join('artifacts/windows',version,installerName('win32'))},{name:installerName('darwin'),file:path.join('artifacts/mac',version,installerName('darwin'))}];
for(const file of files){const bytes=await fs.readFile(file.file);file.hash=createHash('sha256').update(bytes).digest('hex');file.bytes=bytes;}
const sums=files.map(file=>file.hash+'  '+file.name+'\n').join('');
files.push({name:INSTALLER_CHECKSUMS,bytes:Buffer.from(sums)});
for(const name of ['ClassJourney.html','ClassJourney-Windows-Mac.zip','ClassJourney-Dokumente-lokaler-KI-Agent.zip','SHA256SUMS.txt'])files.push({name,bytes:await fs.readFile(path.join('dist-release',name))});
async function upload(file){
  const old=release.assets.find(asset=>asset.name===file.name);
  if(old)await api('/releases/assets/'+old.id,'DELETE');
  const url=new URL('https://uploads.github.com/repos/DJufer1/classjourney/releases/'+release.id+'/assets');url.searchParams.set('name',file.name);
  const response=await fetch(url,{method:'POST',headers:{...headers,'Content-Type':file.name.endsWith('.exe')?'application/vnd.microsoft.portable-executable':file.name.endsWith('.dmg')?'application/x-apple-diskimage':file.name.endsWith('.zip')?'application/zip':file.name.endsWith('.html')?'text/html':'text/plain'},body:file.bytes});
  if(response.status!==201)throw new Error('Upload failed: '+file.name+' '+response.status);
  const saved=await response.json();if(saved.size!==file.bytes.length)throw new Error('Incomplete release upload.');
  console.log('Uploaded '+file.name+' ('+saved.size+' bytes)');
}
for(const file of files)await upload(file);
if(release.draft)await api('/releases/'+release.id,'PATCH',{draft:false,make_latest:'true'});
const checks=[];
for(const platform of ['win32','darwin']){
  const service=new InstallerUpdates({version:previousVersion,platform,directory:path.join(process.env.RUNNER_TEMP,'classjourney-public-downloads')});
  const result=await service.download();if(!result.downloaded||result.version!==version)throw new Error('Published update not found.');
  const verified=await service.verifiedInstaller();const original=files.find(file=>file.name===verified.installer.name);if(verified.sha256!==original.hash)throw new Error('Published installer differs from tested build.');
  checks.push({platform,previousVersion,updateVersion:result.version,publicGitHubDownloadVerified:true,sha256:verified.sha256});
}
const readReport=async file=>JSON.parse((await fs.readFile(file,'utf8')).replace(/^\uFEFF/,''));
const report={release:tag,checkedAt:new Date().toISOString(),installTests:[await readReport('artifacts/windows/update-test-windows.json'),await readReport('artifacts/mac/update-test-mac-arm64.json'),await readReport('artifacts/mac-intel/update-test-mac-x64.json')],publicUpdateDownloads:checks,macAutomaticSilentUpdate:false,macUpdateMethod:'Download and verify DMG, open it, replace ClassJourney.app in Applications; collection remains in separate userData folder.'};
await upload({name:'ClassJourney-Updatepruefung.json',bytes:Buffer.from(JSON.stringify(report,null,2))});
const marker='<!-- classjourney-native-installers -->',prefix=(release.body||'').split(marker)[0].trim();
const base='https://github.com/DJufer1/classjourney/releases/download/'+tag+'/';
const notes=`${marker}\n## Installer für Windows und Mac\n\n- **[Windows-Setup herunterladen](${base+installerName('win32')})** – Windows x64, Installation im eigenen Benutzerkonto.\n- **[Mac-Installer herunterladen](${base+installerName('darwin')})** – Universal-App für Intel und Apple Silicon; die App nach «Programme» ziehen.\n\nDie Installer laufen als eigene App und benötigen während des Unterrichts kein Internet. Beim ersten Wechsel von der Browserdatei zur installierten App die eigene Sammlung exportieren und in der App laden. Danach liegen die Daten getrennt von den Programmdateien.\n\n**Updates:** Im Programm «Updates → Auf Updates prüfen → Update herunterladen → Installer öffnen». Der Download wird anhand der SHA-256-Prüfsumme geprüft und die Sammlung vor dem Öffnen des Installers gesichert. Windows: Setup ausführen. Mac: Die App in «Programme» ersetzen. Es wird kein stilles automatisches Mac-Update behauptet.\n\n**Geprüft:** Echter Windows-Installerwechsel ${previousVersion} → ${version}; DMG-Installation und App-Ersetzung auf Mac mit Intel sowie Apple Silicon. Eigene Pläne, Bilder und Einstellungen sind dabei erhalten geblieben. Beide öffentlichen GitHub-Downloads wurden durch den Update-Code erneut geladen und geprüft. [Prüfbericht](${base}ClassJourney-Updatepruefung.json).\n\n**Signierung:** Die Installer haben derzeit kein Herstellerzertifikat; der Mac-Build ist nur ad hoc signiert und nicht von Apple notarisiert. Windows bzw. macOS können beim Öffnen eine zusätzliche Freigabe verlangen. Für eine signierte, notarisiert verteilte Mac-App und automatische Mac-Updates ist ein Apple-Entwicklerzertifikat erforderlich.\n`;
await api('/releases/'+release.id,'PATCH',{body:prefix+'\n\n'+notes});
console.log('Published and verified installers: https://github.com/DJufer1/classjourney/releases/tag/'+tag);
