import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {validateCollection} from '../src/engine.mjs';

export const fingerprint=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const planKey=(plan,assets)=>fingerprint({plan,background:assets.backgrounds[plan.backgroundId]});
export function syncBaseline(collection){const data=validateCollection(collection);return {libraryId:data.libraryId,base:Object.fromEntries(data.plans.map(plan=>[plan.id,planKey(plan,data.assets)])),basePlans:Object.fromEntries(data.plans.map(plan=>[plan.id,fingerprint(plan)])),accepted:{},lastDigest:null};}

export function mergeAgentCollection(current,raw,syncState={}){
  const incoming=validateCollection(raw);
  const data=current?structuredClone(current):{...incoming,plans:[],assets:{...incoming.assets,backgrounds:{}}};
  if(current&&incoming.libraryId!==current.libraryId)throw new Error('Die KI-Ausgabe gehört zu einer anderen Sammlung.');
  const state=structuredClone(syncState),accepted=state.accepted??={},base=state.base??={};
  const result={added:0,updated:0,conflicts:0,changedIds:[],previousHashes:{}};
  const unique=(prefix,hash,items)=>{const key=prefix.slice(0,65)+'-ki-'+hash.slice(0,12);let id=key,index=2;while(Object.hasOwn(items,id))id=key+'-'+index++;return id;};
  for(const source of incoming.plans){
    const seen=planKey(source,incoming.assets),record=accepted[source.id];
    if(record?.seen===seen||(!record&&(base[source.id]===seen||state.basePlans?.[source.id]===fingerprint(source))))continue;
    let targetId=record?.targetId||source.id,target=data.plans.find(plan=>plan.id===targetId);
    const expected=record?.saved||base[source.id];
    if(target&&targetId===source.id&&planKey(target,data.assets)===seen){accepted[source.id]={seen,targetId,saved:seen};continue;}
    let conflict=false;
    if(target&&planKey(target,data.assets)!==expected||!target&&!!expected){
      const prefix=source.id.slice(0,65)+'-ki-'+seen.slice(0,12);
      const recovered=data.plans.find(candidate=>candidate.id.startsWith(prefix)&&fingerprint({...candidate,id:source.id,title:source.title,backgroundId:source.backgroundId})===fingerprint(source)&&fingerprint(data.assets.backgrounds[candidate.backgroundId])===fingerprint(incoming.assets.backgrounds[source.backgroundId]));
      if(recovered){accepted[source.id]={seen,targetId:recovered.id,saved:planKey(recovered,data.assets)};continue;}
      conflict=true;const ids=Object.fromEntries(data.plans.map(plan=>[plan.id,true]));targetId=unique(source.id,seen,ids);target=null;
    }
    const plan=structuredClone(source);plan.id=targetId;if(targetId!==source.id)plan.title=(source.title+' (KI)').slice(0,180);
    const background=incoming.assets.backgrounds[source.backgroundId];
    if(background){
      let id=source.backgroundId;const existing=data.assets.backgrounds[id];
      if(existing&&fingerprint(existing)!==fingerprint(background)){
        const hash=fingerprint(background),prefix=id.slice(0,65)+'-ki-'+hash.slice(0,12);
        id=prefix;let n=2;while(data.assets.backgrounds[id]&&fingerprint(data.assets.backgrounds[id])!==hash)id=prefix+'-'+n++;
      }
      data.assets.backgrounds[id]=structuredClone(background);plan.backgroundId=id;
    }
    if(!data.assets.atlas)data.assets.atlas=incoming.assets.atlas;if(!data.assets.fageAtlas)data.assets.fageAtlas=incoming.assets.fageAtlas;
    const index=data.plans.findIndex(item=>item.id===targetId);
    result.previousHashes[targetId]=index>=0?fingerprint(data.plans[index]):null;
    if(index>=0){data.plans[index]=plan;result.updated++;}else{data.plans.push(plan);result.added++;}
    if(conflict)result.conflicts++;result.changedIds.push(targetId);
    accepted[source.id]={seen,targetId,saved:planKey(plan,data.assets)};
  }
  const changed=result.changedIds.length>0;
  if(changed)data.modifiedAt=Math.max(Date.now(),(current?.modifiedAt||0)+1);
  return {...result,collection:changed?validateCollection(data):null,syncState:state};
}

export class AgentSync{
  constructor({store,root,directory,onChange=()=>{},onError=()=>{},intervalMs=2000}){
    this.store=store;this.root=path.resolve(root);this.file=path.join(this.root,'output','Sammlung.classjourney.json');this.stateFile=path.join(directory,'ki-sync.json');this.onChange=onChange;this.onError=onError;this.intervalMs=intervalMs;this.state={base:{},accepted:{},lastDigest:null};this.editing=false;this.suspended=false;this.busy=null;this.lastUserSave=0;this.lastErrorStamp=undefined;
  }
  async saveState(){const file=this.stateFile+'.'+randomUUID()+'.tmp';await fs.mkdir(path.dirname(file),{recursive:true});try{await fs.writeFile(file,JSON.stringify(this.state),{flag:'wx'});await fs.rename(file,this.stateFile);}finally{await fs.unlink(file).catch(()=>{});}}
  async status(value){const target=path.join(this.root,'output','APP-Status.json'),temporary=target+'.'+randomUUID()+'.tmp';try{await fs.writeFile(temporary,JSON.stringify(value,null,2),{flag:'wx'});await fs.rename(temporary,target);}finally{await fs.unlink(temporary).catch(()=>{});}}
  async baseline(collection){this.state=syncBaseline(collection);try{this.state.lastDigest=fingerprint(await fs.readFile(this.file,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}await this.saveState();}
  async start(){
    await fs.mkdir(path.dirname(this.file),{recursive:true});
    try{const saved=JSON.parse(await fs.readFile(this.stateFile,'utf8'));if(saved&&typeof saved==='object')this.state=saved;}catch(error){if(error.code!=='ENOENT')this.onError(error);}
    await this.inspect();this.timer=setInterval(()=>this.inspect(),this.intervalMs);this.timer.unref();
  }
  async inspect({force=false}={}){
    if(this.busy)return this.busy;if(this.suspended||this.editing||(!force&&Date.now()-this.lastUserSave<1500))return null;
    const job=async()=>{
      let stamp=null;
      try{
        for(const file of [this.root,path.dirname(this.file),this.file])if((await fs.lstat(file)).isSymbolicLink())throw new Error('Verknüpfte KI-Ausgaben werden nicht übernommen.');
        const before=await fs.stat(this.file);stamp=before.mtimeMs+':'+before.size;if(stamp===this.lastStatStamp||stamp===this.lastErrorStamp)return null;if(before.size>150000000)throw new Error('Die KI-Ausgabe ist zu gross.');
        const text=await fs.readFile(this.file,'utf8'),after=await fs.stat(this.file);if(before.mtimeMs!==after.mtimeMs||before.size!==after.size)return null;
        const digest=fingerprint(text);if(digest===this.state.lastDigest){this.lastStatStamp=stamp;return null;}
        const incoming=validateCollection(JSON.parse(text));
        const result=await this.store.transact(current=>this.editing||this.suspended?{deferred:true}:mergeAgentCollection(current,incoming,this.state),{backup:true});
        if(result.deferred)return result;
        this.state=result.syncState;this.state.lastDigest=digest;this.lastStatStamp=stamp;this.lastErrorStamp=null;
        if(result.collection)this.onChange(result);await this.saveState();
        await this.status({status:'applied',appliedAt:Date.now(),sourceModifiedAt:incoming.modifiedAt,added:result.added,updated:result.updated,conflicts:result.conflicts,planIds:result.changedIds});
        return result;
      }catch(error){if(error.code==='ENOENT')return null;if(this.lastErrorStamp!==stamp){this.lastErrorStamp=stamp;this.onError(error);}return {error:error.message};}
    };
    this.busy=job();try{return await this.busy;}finally{this.busy=null;}
  }
  async stop(){clearInterval(this.timer);if(this.busy)await this.busy;}
}
