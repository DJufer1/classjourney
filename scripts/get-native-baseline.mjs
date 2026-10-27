import fs from 'node:fs/promises';
import path from 'node:path';
import {InstallerUpdates} from '../desktop/update-service.mjs';
import {RELEASE_API,installerName} from '../src/updates.mjs';
const {previousVersion}=JSON.parse(await fs.readFile('desktop/test-baseline.json','utf8'));
const platform=process.platform;if(!['win32','darwin'].includes(platform))throw new Error('Native installer baseline requires Windows or Mac.');
const fetcher=(url,options)=>{
  const target=url===RELEASE_API?'https://api.github.com/repos/DJufer1/classjourney/releases/tags/v'+previousVersion:url;
  const authorization=new URL(target).origin==='https://api.github.com'&&process.env.GITHUB_TOKEN?{Authorization:'Bearer '+process.env.GITHUB_TOKEN}:{};
  return fetch(target,{...options,headers:{...options.headers,...authorization}});
};
const updates=new InstallerUpdates({version:'0.0.0',platform,directory:path.resolve('dist-native/baseline-downloads'),fetcher});
const downloaded=await updates.download();if(!downloaded.downloaded||downloaded.version!==previousVersion)throw new Error('Previous published installer not available.');
const verified=await updates.verifiedInstaller(),folder=path.resolve('dist-native',previousVersion);await fs.mkdir(folder,{recursive:true});await fs.copyFile(verified.path,path.join(folder,installerName(platform)));
console.log('Verified previous published installer '+previousVersion+' for '+platform);
