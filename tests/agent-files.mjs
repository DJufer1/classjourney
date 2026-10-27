import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {buildAgentFiles,writeAgentFolder,AGENT_SKILL_PATH} from '../src/agent-files.mjs';

const seed=JSON.parse(await fs.readFile(new URL('../content/collection.json',import.meta.url),'utf8'));
const untouched=JSON.stringify(seed);
const files=buildAgentFiles({collection:seed,html:'offline-app',skill:'class-journey-skill',schema:'{}',lessons:'{}',updater:'update',builder:'build'});
assert.equal(JSON.stringify(seed),untouched);
const data=JSON.parse(files.find(f=>f.name==='data/plans.json').content);
assert.equal(data.plans.length,1);assert.equal(data.plans[0].isDemo,true);
assert.equal(data.assets.atlas,undefined);assert.equal(data.assets.fageAtlas,undefined);
assert.equal(files.find(f=>f.name===AGENT_SKILL_PATH+'/SKILL.md').content,'class-journey-skill');
for(const [id,asset]of Object.entries(data.assets.backgrounds)){
  assert.equal(asset.src,undefined);
  const image=files.find(f=>f.name===asset.srcFile);
  assert.deepEqual(Buffer.from(image.content),Buffer.from(seed.assets.backgrounds[id].src.split(',')[1],'base64'));
}

// Exercise the same directory-handle contract against real local files.
const testRoot=new URL('../dist/',import.meta.url);await fs.mkdir(testRoot,{recursive:true});
const directory=await fs.mkdtemp(path.join(path.resolve(testRoot.pathname.replace(/^\/(\w:)/,'$1')),'agent-write-'));
const handle=base=>({
  async getDirectoryHandle(name,options={}){
    const target=path.join(base,name);
    if(options.create)await fs.mkdir(target,{recursive:true});
    try{if(!(await fs.stat(target)).isDirectory())throw Object.assign(new Error('Not a directory'),{name:'TypeMismatchError'});}
    catch(error){if(error.code==='ENOENT')throw Object.assign(new Error('Not found'),{name:'NotFoundError'});throw error;}
    return handle(target);
  },
  async getFileHandle(name){return {async createWritable(){return {async write(content){await fs.writeFile(path.join(base,name),content);},async close(){},async abort(){}};}};}
});
const sample=[{name:'data/plans.json',content:'first'},{name:'Anweisungen KI-Agent/class-journey/SKILL.md',content:'skill'},{name:'assets/icon.png',content:new Uint8Array([1,2,3])}];
const first=await writeAgentFolder(handle(directory),sample,'ClassJourney-KI-test');
assert.equal(first.count,3);
const edited=path.join(directory,first.name,'data/plans.json');await fs.writeFile(edited,'agent edit');
const second=await writeAgentFolder(handle(directory),sample,'ClassJourney-KI-test');
assert.equal(second.name,'ClassJourney-KI-test-2');
assert.equal(await fs.readFile(edited,'utf8'),'agent edit');
assert.equal(await fs.readFile(path.join(directory,second.name,'data/plans.json'),'utf8'),'first');
assert.deepEqual(await fs.readFile(path.join(directory,second.name,'assets/icon.png')),Buffer.from([1,2,3]));
await assert.rejects(()=>writeAgentFolder(handle(directory),[{name:'../escape',content:''}],'safe'),/Ungültiger Dateipfad/);
await assert.rejects(()=>writeAgentFolder(handle(directory),sample,'../escape'),/Ungültiger Ordnername/);
console.log('Passed: agent handoff preserves source plans and every image, includes the Class Journey skill, writes binary files and never overwrites an existing handoff.');
