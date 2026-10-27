import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {validateCollection} from '../src/engine.mjs';

export class CollectionStore{
  constructor(directory){this.directory=path.resolve(directory);this.file=path.join(this.directory,'collection.json');this.queue=Promise.resolve();}
  async load(){await this.flush();try{return validateCollection(JSON.parse(await fs.readFile(this.file,'utf8')));}catch(error){if(error.code==='ENOENT')return null;throw error;}}
  save(raw){
    const data=validateCollection(raw),text=JSON.stringify(data);
    if(Buffer.byteLength(text)>150000000)throw new Error('Die Sammlung ist zu gross. Bitte als Datei sichern.');
    const job=async()=>{
      await fs.mkdir(this.directory,{recursive:true});
      const temporary=path.join(this.directory,'collection-'+randomUUID()+'.tmp');
      try{const file=await fs.open(temporary,'wx');try{await file.writeFile(text,'utf8');await file.sync();}finally{await file.close();}await fs.rename(temporary,this.file);}
      catch(error){await fs.unlink(temporary).catch(()=>{});throw error;}
    };
    const next=this.queue.then(job,job);this.queue=next.catch(()=>{});return next;
  }
  async flush(){await this.queue;}
  async backup(version){
    if(!/^\d+\.\d+\.\d+$/.test(version))throw new Error('Ungültige Sicherungsversion.');
    await this.flush();
    const folder=path.join(this.directory,'backups');await fs.mkdir(folder,{recursive:true});
    const target=path.join(folder,'vor-update-'+version+'-'+Date.now()+'-'+randomUUID().slice(0,8)+'.json');
    try{await fs.copyFile(this.file,target,fs.constants.COPYFILE_EXCL);return target;}catch(error){if(error.code==='ENOENT')return null;throw error;}
  }
}
