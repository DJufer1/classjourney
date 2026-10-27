import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {CollectionStore} from '../desktop/store.mjs';

const fixture=()=>({format:'classroomscreen',version:1,libraryId:'my-class',modifiedAt:100,plans:[{id:'own-day',title:'Mein eigener Unterricht',className:'1i',topic:'Skelett',date:'',weekday:2,slots:[{start:'08:15',end:'09:00'}],activities:[{id:'a',title:'Knochen kennenlernen',description:'Am Skelettmodell arbeiten.',duration:45,icon:'care',image:''}],backgroundId:'skeleton',isDemo:false,example:false,updatedAt:100}],assets:{backgrounds:{skeleton:{name:'Skelettmodell',src:'data:image/png;base64,AQID',prompt:'Skelettmodell im Raum'}},atlas:'',fageAtlas:''},settings:{motion:true,backgroundOpacity:0.67}});
test('native update preserves own plans, embedded images, settings and an immutable backup',async()=>{
  const folder=await fs.mkdtemp(path.join(os.tmpdir(),'classjourney-native-storage-'));
  const oldVersion=new CollectionStore(folder);assert.equal(await oldVersion.load(),null);
  await oldVersion.save(fixture());const before=await oldVersion.load();
  const backup=await oldVersion.backup('1.2.0');assert.ok(backup.startsWith(path.join(folder,'backups')+path.sep));
  const newVersion=new CollectionStore(folder);assert.deepEqual(await newVersion.load(),before);
  const changed=fixture();changed.plans[0].title='Nach dem Update bearbeitet';changed.modifiedAt=200;
  await newVersion.save(changed);assert.equal((await newVersion.load()).plans[0].title,changed.plans[0].title);
  assert.deepEqual(JSON.parse(await fs.readFile(backup,'utf8')),before);
  const one=fixture(),two=fixture();one.modifiedAt=300;two.modifiedAt=301;two.plans[0].title='Letzte Änderung';
  await Promise.all([newVersion.save(one),newVersion.save(two)]);assert.equal((await newVersion.load()).plans[0].title,'Letzte Änderung');
  assert.throws(()=>newVersion.save({...fixture(),plans:[{id:'broken'}]}));
  assert.equal((await newVersion.load()).plans[0].title,'Letzte Änderung');
});
