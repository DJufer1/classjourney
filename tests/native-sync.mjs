import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
import {CollectionStore} from '../desktop/store.mjs';
import {AgentWorkspace} from '../desktop/agent-link.mjs';
import {AgentSync,mergeAgentCollection,syncBaseline} from '../desktop/agent-sync.mjs';
import {buildAgentFiles} from '../src/agent-files.mjs';
import {validateCollection} from '../src/engine.mjs';

const image='data:image/png;base64,'+(await fs.readFile(new URL('../assets/icon-32.png',import.meta.url))).toString('base64');
const fixture=()=>validateCollection({format:'classroomscreen',version:1,libraryId:'local-test',modifiedAt:10,plans:[{id:'own',title:'Mein Unterricht',className:'1i',topic:'Ressourcen',weekday:2,date:'',slots:[{start:'08:15',end:'09:00'}],activities:[{id:'start',title:'Einstieg',description:'Ressourcen sammeln',duration:45,icon:'resources',image:''}],backgroundId:'room',isDemo:false,example:false,updatedAt:10}],assets:{backgrounds:{room:{name:'Mein Bild',src:image,prompt:'Eigenes Motiv'}},atlas:'',fageAtlas:''},settings:{language:'fr',motion:true,backgroundOpacity:0.67}});
const extraPlan=(source,id='new')=>({...structuredClone(source.plans[0]),id,title:'Neuer KI-Tag',className:'2i',updatedAt:20});

test('new AI plans appear in the native collection with images; other plans and settings survive',()=>{
  const current=fixture(),incoming=fixture(),baseline=syncBaseline(current);incoming.plans.push(extraPlan(incoming));incoming.assets.backgrounds.room.prompt='Neues KI-Motiv';incoming.settings.language='en';
  const result=mergeAgentCollection(current,incoming,baseline);
  assert.equal(result.added,1);assert.equal(result.conflicts,0);assert.deepEqual(result.collection.plans[0],current.plans[0]);assert.deepEqual(result.collection.settings,current.settings);
  const added=result.collection.plans.find(plan=>plan.id==='new');assert.notEqual(added.backgroundId,'room');assert.equal(result.collection.assets.backgrounds[added.backgroundId].prompt,'Neues KI-Motiv');assert.equal(result.collection.assets.backgrounds.room.prompt,'Eigenes Motiv');
  assert.equal(mergeAgentCollection(result.collection,incoming,result.syncState).collection,null);
});
test('parallel edits keep both versions, and later AI edits update its own copy without duplicates',()=>{
  const original=fixture(),current=fixture(),incoming=fixture(),baseline=syncBaseline(original);current.plans[0].title='In der App bearbeitet';incoming.plans[0].title='Von der KI bearbeitet';
  const result=mergeAgentCollection(current,incoming,baseline);assert.equal(result.conflicts,1);assert.equal(result.collection.plans.length,2);assert.equal(result.collection.plans[0].title,'In der App bearbeitet');
  assert.equal(mergeAgentCollection(result.collection,incoming,baseline).collection,null,'Restarting before the acknowledgement was saved must not duplicate a conflict copy.');
  const copy=result.collection.plans[1];assert.ok(copy.title.endsWith('(KI)'));incoming.plans[0].activities[0].description='KI verbessert den Auftrag';
  const next=mergeAgentCollection(result.collection,incoming,result.syncState);assert.equal(next.conflicts,0);assert.equal(next.updated,1);assert.equal(next.collection.plans.length,2);assert.equal(next.collection.plans[1].id,copy.id);assert.equal(next.collection.plans[1].activities[0].description,'KI verbessert den Auftrag');
  const deleted=fixture();deleted.plans=[];assert.equal(mergeAgentCollection(deleted,original,baseline).collection,null);
  assert.throws(()=>mergeAgentCollection(original,{...incoming,libraryId:'other'},baseline),/anderen Sammlung/);
});
test('native folder monitoring defers editing, rejects incomplete output, backs up and resumes after restart',async t=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'classjourney-auto-')),store=new CollectionStore(directory),root=path.join(directory,'KI-Agent'),errors=[],events=[];
  await store.save(fixture());const sync=new AgentSync({store,root,directory,onChange:event=>events.push(event),onError:error=>errors.push(error),intervalMs:60000});await sync.start();t.after(()=>sync.stop());await sync.baseline(await store.load());
  const data=fixture();data.plans.push(extraPlan(data));data.modifiedAt=100;await fs.writeFile(sync.file,JSON.stringify(data));sync.editing=true;await sync.inspect({force:true});assert.equal((await store.load()).plans.length,1);
  sync.editing=false;await sync.inspect({force:true});assert.equal((await store.load()).plans.length,2);assert.equal(events.length,1);assert.ok(events[0].backup);assert.equal(JSON.parse(await fs.readFile(events[0].backup,'utf8')).plans.length,1);
  const status=JSON.parse(await fs.readFile(path.join(root,'output/APP-Status.json'),'utf8'));assert.equal(status.status,'applied');assert.equal(status.sourceModifiedAt,100);
  await fs.writeFile(sync.file,'{"unfinished":');await sync.inspect({force:true});assert.equal((await store.load()).plans.length,2);assert.equal(errors.length,1);
  await sync.stop();data.plans.push(extraPlan(data,'written-while-closed'));data.modifiedAt=200;await fs.writeFile(sync.file,JSON.stringify(data));
  const reopened=new AgentSync({store:new CollectionStore(directory),root,directory,intervalMs:60000});await reopened.start();t.after(()=>reopened.stop());assert.equal((await store.load()).plans.length,3);
});
test('the real AI builder writes the linked folder and the app picks it up without any import action',async t=>{
  const directory=await fs.mkdtemp(path.join(os.tmpdir(),'classjourney-real-builder-')),store=new CollectionStore(directory),workspace=new AgentWorkspace(directory,'C:/Programs/ClassJourney');await store.save(fixture());
  const read=async name=>fs.readFile(new URL('../'+name,import.meta.url),'utf8');
  const files=buildAgentFiles({collection:fixture(),html:'',skill:await read('skill/class-journey/SKILL.md'),schema:await read('skill/class-journey/references/DATENFORMAT.json'),lessons:await read('skill/class-journey/references/LEKTIONEN.json'),updater:await read('skill/class-journey/scripts/update_collection.py'),builder:await read('skill/class-journey/scripts/build_collection.py')}).filter(file=>file.name!=='ClassJourney.html');
  await workspace.prepare(files,async()=>'existing');const link=JSON.parse(await fs.readFile(path.join(workspace.root,'APP-Verbindung.json'),'utf8'));assert.equal(link.automaticImport,true);
  let received;const done=new Promise(resolve=>received=resolve),sync=new AgentSync({store,root:workspace.root,directory,onChange:received,intervalMs:30});await sync.start();t.after(()=>sync.stop());await sync.baseline(await store.load());
  const source=path.join(workspace.root,'data/plans.json'),data=JSON.parse(await fs.readFile(source,'utf8'));data.plans.push(extraPlan(data,'created-by-real-builder'));await fs.writeFile(source,JSON.stringify(data));
  const python=process.env.CLASSJOURNEY_PYTHON||(process.platform==='win32'?'python':'python3'),built=spawnSync(python,[path.join(workspace.root,'scripts/build_collection.py'),'--root',workspace.root],{encoding:'utf8',timeout:30000,windowsHide:true});assert.equal(built.status,0,built.stderr||built.error?.message);
  const event=await Promise.race([done,new Promise((_,reject)=>{const timer=setTimeout(()=>reject(new Error('The app did not pick up the AI output.')),5000);timer.unref();})]);assert.equal(event.added,1);assert.ok((await store.load()).plans.some(plan=>plan.id==='created-by-real-builder'));assert.equal((await fs.readdir(path.join(workspace.root,'output'))).some(name=>name.endsWith('.tmp')),false);
});
