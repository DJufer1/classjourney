import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {RELEASE_API,selectReleaseUpdate,expectedChecksum} from '../src/updates.mjs';

export class InstallerUpdates{
  constructor({version,platform,directory,fetcher=fetch,onProgress=()=>{}}){this.version=version;this.platform=platform;this.directory=path.resolve(directory);this.fetcher=fetcher;this.onProgress=onProgress;this.pending=null;this.busy=false;}
  async request(url,timeout=30000){
    const response=await this.fetcher(url,{headers:{Accept:url===RELEASE_API?'application/vnd.github+json':'application/octet-stream','User-Agent':'ClassJourney/'+this.version},signal:AbortSignal.timeout(timeout)});
    if(!response.ok)throw new Error('GitHub ist gerade nicht erreichbar ('+response.status+').');
    return response;
  }
  async check(){const response=await this.request(RELEASE_API);return selectReleaseUpdate(await response.json(),this.version,this.platform);}
  async download(){
    if(this.busy)throw new Error('Ein Download läuft bereits.');this.busy=true;this.pending=null;
    let temporary=null;
    try{
      const update=await this.check();if(!update.available)return update;
      const sums=await this.request(update.checksums.url);
      const text=await sums.text();if(text.length>100000)throw new Error('Ungültige Prüfsummendatei.');
      const expected=expectedChecksum(text,update.installer.name);
      const folder=path.join(this.directory,update.version+'-'+randomUUID());await fs.mkdir(folder,{recursive:true});
      const target=path.join(folder,update.installer.name);temporary=target+'.part';
      const response=await this.request(update.installer.url,600000);
      if(!response.body)throw new Error('Der Installer konnte nicht geladen werden.');
      const file=await fs.open(temporary,'wx'),hash=createHash('sha256');let received=0,lastPercent=-1;
      try{
        for await(const chunk of response.body){
          received+=chunk.length;if(received>update.installer.size)throw new Error('Der Download ist grösser als erwartet.');
          hash.update(chunk);await file.writeFile(chunk);
          const percent=Math.floor(received/update.installer.size*100);if(percent!==lastPercent){lastPercent=percent;this.onProgress(percent);}
        }
        await file.sync();
      }finally{await file.close();}
      if(received!==update.installer.size||hash.digest('hex')!==expected)throw new Error('Die Prüfsumme stimmt nicht. Der Installer wird nicht geöffnet.');
      await fs.rename(temporary,target);temporary=null;
      this.pending={...update,path:target,sha256:expected};
      return {available:true,version:update.version,downloaded:true,name:update.installer.name};
    }finally{if(temporary)await fs.unlink(temporary).catch(()=>{});this.busy=false;}
  }
  async verifiedInstaller(){
    if(!this.pending)throw new Error('Bitte zuerst das Update herunterladen.');
    const bytes=await fs.readFile(this.pending.path);
    if(bytes.length!==this.pending.installer.size||createHash('sha256').update(bytes).digest('hex')!==this.pending.sha256)throw new Error('Die heruntergeladene Datei wurde verändert. Bitte erneut laden.');
    return this.pending;
  }
}
