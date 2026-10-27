import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {randomUUID} from 'node:crypto';
import {formatMessage,normalizedLanguage} from '../src/i18n.mjs';
const execute=promisify(execFile);
const exists=async file=>{try{await fs.access(file);return true;}catch{return false;}};

export const PERMISSION_PROMPT='Ich erteile dir für meine ClassJourney-Planung Lese- und Schreibzugriff auf «{0}» samt Unterordnern. Prüfe deinen Zugriff und fordere nötige Ordnerfreigaben jetzt in deiner KI-Anwendung an. Lies vollständig START_HERE.md und Anweisungen KI-Agent/class-journey/SKILL.md samt Referenzen. Lerne den Skill «Class Journey» / «Classroom Journey» und führe seine Schritte bei meinen Planungsaufträgen aus. Falls Unterlagen, Klasse oder Lektionen fehlen, frage danach. Programmdateien liegen unter «{1}»; dort ist bei Bedarf nur Lesezugriff vorgesehen. Erstelle neue Pläne und Bilder im Planungsordner sowie output/Sammlung.classjourney.json. Antworte auf Deutsch.';
export function permissionPrompt(root,installationDirectory,language='de'){
  return formatMessage(PERMISSION_PROMPT,[root,installationDirectory],normalizedLanguage(language));
}
export function codexLink(root,prompt){
  const link=new URL('codex://threads/new');link.searchParams.set('path',root);link.searchParams.set('prompt',prompt);
  if(link.href.length<=2000)return {url:link.href,promptInLink:true};
  link.searchParams.delete('prompt');if(link.href.length>2000)throw new Error('Der Ordnerpfad ist für den Codex-Link zu lang. Bitte den Ordner in Codex manuell öffnen.');
  return {url:link.href,promptInLink:false};
}
async function windowsCodex(){
  try{const result=await execute('reg.exe',['query','HKCR\\codex\\shell\\open\\command'],{windowsHide:true,timeout:4000});if(result.stdout.trim())return true;}catch{}
  try{const result=await execute('powershell.exe',['-NoProfile','-NonInteractive','-Command','Get-AppxPackage -Name OpenAI.Codex | Select-Object -First 1 -ExpandProperty PackageFamilyName'],{windowsHide:true,timeout:8000});return !!result.stdout.trim();}catch{return false;}
}
export async function discoverAgents({platform=process.platform,home=os.homedir(),environment=process.env,pathExists=exists,codexInstalled=windowsCodex}={}){
  const p=platform==='win32'?path.win32:path.posix,apps=[];
  const appRoots=platform==='darwin'?['/Applications',p.join(home,'Applications')]:[];
  let codex=false;
  if(platform==='win32')codex=await codexInstalled();
  else if(platform==='darwin'){const candidates=appRoots.flatMap(root=>['Codex.app','ChatGPT.app'].map(name=>p.join(root,name)));codex=(await Promise.all(candidates.map(candidate=>pathExists(candidate)))).some(Boolean);}
  if(codex)apps.push({id:'codex',label:'Codex / ChatGPT',kind:'codex',promptMode:'prefill'});
  for(const definition of [{id:'cursor',label:'Cursor',windows:'Cursor.exe',folder:'cursor',mac:'Cursor.app',cli:['cursor','code']},{id:'vscode',label:'VS Code mit KI-Erweiterung',windows:'Code.exe',folder:'Microsoft VS Code',mac:'Visual Studio Code.app',cli:['code']}]){
    if(platform==='win32'){
      const candidates=[environment.LOCALAPPDATA&&p.join(environment.LOCALAPPDATA,'Programs',definition.folder,definition.windows),environment.ProgramFiles&&p.join(environment.ProgramFiles,definition.folder,definition.windows)].filter(Boolean);
      for(const candidate of candidates)if(await pathExists(candidate)){apps.push({id:definition.id,label:definition.label,kind:'editor',executable:candidate,promptMode:'clipboard'});break;}
    }else if(platform==='darwin'){
      for(const root of appRoots){const bundle=p.join(root,definition.mac);if(!await pathExists(bundle))continue;let cli=null;for(const name of definition.cli){const candidate=p.join(bundle,'Contents/Resources/app/bin',name);if(await pathExists(candidate)){cli=candidate;break;}}apps.push({id:definition.id,label:definition.label,kind:'editor',executable:cli,bundle,promptMode:'clipboard'});break;}
    }
  }
  return apps;
}
export function agentLaunchPlan(agent,root,prompt,platform=process.platform){
  if(agent.id==='codex'&&agent.kind==='codex')return {kind:'url',...codexLink(root,prompt)};
  if(!['cursor','vscode'].includes(agent.id)||agent.kind!=='editor')throw new Error('Dieses KI-Programm wird nicht unterstützt.');
  if(agent.executable)return {kind:'process',executable:agent.executable,args:['--new-window',root],promptInLink:false};
  if(platform==='darwin'&&agent.bundle)return {kind:'process',executable:'/usr/bin/open',args:['-a',agent.bundle,root],promptInLink:false};
  throw new Error('Das Programm wurde nicht gefunden.');
}
export async function openAgent(plan,{openExternal,copyPrompt},prompt){
  copyPrompt(prompt);
  if(plan.kind==='url'){await openExternal(plan.url);return;}
  await new Promise((resolve,reject)=>{const child=spawn(plan.executable,plan.args,{detached:true,stdio:'ignore',shell:false,windowsHide:false});child.once('error',reject);child.once('spawn',()=>{child.unref();resolve();});});
}
export async function copyAgentStart(workspace,files,choose,copy,language='de'){const prepared=await workspace.prepare(files,choose,language);if(prepared.cancelled)return prepared;await copy(prepared.prompt);return {root:prepared.root,prompt:prepared.prompt,copied:true,permissionConfirmationRequired:true};}

export class AgentWorkspace{
  constructor(dataDirectory,installationDirectory){this.dataDirectory=path.resolve(dataDirectory);this.root=path.join(this.dataDirectory,'KI-Agent');this.installationDirectory=installationDirectory;}
  info(language='de'){return {root:this.root,installationDirectory:this.installationDirectory,prompt:permissionPrompt(this.root,this.installationDirectory,language)};}
  async files(raw,language='de'){
    if(!Array.isArray(raw)||raw.length>4000)throw new Error('Ungültige KI-Dokumente.');
    let bytes=0;const seen=new Set(),files=[];
    for(const entry of raw){
      const parts=String(entry.name||'').split('/');
      if(parts.some(part=>!part||part==='.'||part==='..'||/[\\:\x00-\x1f]/.test(part))||!/[.](?:md|json|html|py|txt|png|jpg|jpeg|webp|gif)$/i.test(entry.name)||seen.has(entry.name))throw new Error('Ungültiger Dateipfad in den KI-Dokumenten.');
      if(!['assets','data','scripts','Anweisungen KI-Agent'].includes(parts[0])&&parts.length!==1)throw new Error('Ungültiger Unterordner.');
      seen.add(entry.name);let content=typeof entry.content==='string'?Buffer.from(entry.content):entry.content instanceof Uint8Array?Buffer.from(entry.content):null;
      if(!content)throw new Error('Ungültiger Dateiinhalt.');
      if(['START_HERE.md','AGENTS.md','CLAUDE.md'].includes(entry.name))content=Buffer.from(content.toString('utf8')+'\n\n## Zugeordnete Ordner\n\nPlanung und Anweisungen (lesen/schreiben): '+this.root+'\nProgrammdateien (bei Bedarf nur lesen): '+this.installationDirectory+'\nDie tatsächliche Zugriffsfreigabe muss die Lehrperson in ihrer KI-Anwendung bestätigen. Diese Datei ändert keine Sicherheitsrichtlinien.\n');
      bytes+=content.length;if(bytes>150000000)throw new Error('Der KI-Ordner ist zu gross.');files.push({name:entry.name,content});
    }
    if(!seen.has('data/plans.json')||!seen.has('Anweisungen KI-Agent/class-journey/SKILL.md'))throw new Error('Plandaten oder Skill fehlen.');
    files.push({name:'START_PROMPT.txt',content:Buffer.from(this.info(language).prompt)});return files;
  }
  async safeTarget(name){
    const target=path.resolve(this.root,...name.split('/'));if(!target.startsWith(this.root+path.sep))throw new Error('Ungültiger Zielpfad.');
    let current=this.root;
    for(const part of [null,...name.split('/')]){
      if(part)current=path.join(current,part);
      try{const item=await fs.lstat(current);if(item.isSymbolicLink())throw new Error('Verknüpfte Dateien im KI-Ordner werden nicht überschrieben.');}catch(error){if(error.code!=='ENOENT')throw error;}
    }
    return target;
  }
  async prepare(raw,choose,language='de'){
    const files=await this.files(raw,language);let present=false,different=false;
    for(const file of files){const target=await this.safeTarget(file.name);try{const current=await fs.readFile(target);present=true;if(!current.equals(file.content))different=true;}catch(error){if(error.code==='ENOENT')different=true;else throw error;}}
    let backup=null;
    if(present&&different){
      const choice=await choose();if(choice==='cancel')return {cancelled:true};if(choice==='existing'){await this.ensureInstructions(files);return {...this.info(language),existing:true};}
      if(choice!=='replace')throw new Error('Ungültige Auswahl.');
      backup=path.join(this.dataDirectory,'KI-Sicherungen','vor-verknuepfung-'+Date.now()+'-'+randomUUID().slice(0,8));
      if(!backup.startsWith(this.dataDirectory+path.sep))throw new Error('Ungültiger Sicherungspfad.');
      await fs.cp(this.root,backup,{recursive:true,dereference:false,verbatimSymlinks:true,errorOnExist:true,force:false});
    }
    if(!present||different){
      for(const file of files){const target=await this.safeTarget(file.name);await fs.mkdir(path.dirname(target),{recursive:true});const temporary=target+'.'+randomUUID()+'.tmp';try{await fs.writeFile(temporary,file.content,{flag:'wx'});await fs.rename(temporary,target);}catch(error){await fs.unlink(temporary).catch(()=>{});throw error;}}
    }
    return {...this.info(language),backup,existing:present&&!different};
  }
  async ensureInstructions(files){
    for(const file of files.filter(file=>file.name.startsWith('Anweisungen KI-Agent/')||['START_HERE.md','AGENTS.md','CLAUDE.md','START_PROMPT.txt'].includes(file.name))){const target=await this.safeTarget(file.name);try{const current=await fs.readFile(target);if(!current.length)throw new Error('Eine Skill-Datei ist leer. Bitte den App-Stand übertragen.');}catch(error){if(error.code!=='ENOENT')throw error;await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,file.content,{flag:'wx'});}}
  }
}
