import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {makeZip} from '../src/pack.mjs';
import {buildAgentFiles} from '../src/agent-files.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2);
if(args.includes('--out')&&!args[args.indexOf('--out')+1])throw new Error('Missing output folder.');
const out=path.resolve(args.includes('--out')?args[args.indexOf('--out')+1]:path.join(root,'dist'));
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const info=JSON.parse(read('app-info.json'));
const html=read('docs/ClassJourney.html');
if(!html.includes(`"version":"${info.version}"`))throw new Error('Build the current version before packaging.');
const skill='skill/class-journey/';
const files=buildAgentFiles({collection:JSON.parse(read('content/collection.json')),html,skill:read(skill+'SKILL.md'),schema:read(skill+'references/DATENFORMAT.json'),lessons:read(skill+'references/LEKTIONEN.json'),updater:read(skill+'scripts/update_collection.py'),builder:read(skill+'scripts/build_collection.py')});
files.push({name:'Anweisungen KI-Agent/class-journey/agents/openai.yaml',content:read(skill+'agents/openai.yaml')});
fs.mkdirSync(out,{recursive:true});
const portable=files.map(file=>({...file,name:'ClassJourney/'+file.name}));
for(const file of portable){const target=path.join(out,file.name);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file.content);}
fs.writeFileSync(path.join(out,'ClassJourney.html'),html);
const bundles=[{name:'ClassJourney-Windows-Mac.zip',bytes:makeZip(portable)},{name:'ClassJourney-Dokumente-lokaler-KI-Agent.zip',bytes:makeZip(files)}];
for(const bundle of bundles)fs.writeFileSync(path.join(out,bundle.name),bundle.bytes);
const checksum=(content,name)=>`${createHash('sha256').update(content).digest('hex')}  ${name}\n`;
fs.writeFileSync(path.join(out,'SHA256SUMS.txt'),bundles.map(b=>checksum(b.bytes,b.name)).join('')+checksum(html,'ClassJourney.html'));
console.log(JSON.stringify({version:info.version,output:out,archives:bundles.map(b=>({name:b.name,bytes:b.bytes.length})),files:files.length,platforms:['Windows','macOS'],entry:'ClassJourney/ClassJourney.html'}));
