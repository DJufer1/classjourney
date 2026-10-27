import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2);
const argument=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const packagePath=path.join(root,'package.json'),original=fs.readFileSync(packagePath,'utf8'),metadata=JSON.parse(original);
const version=argument('--version',metadata.version),platform=argument('--platform',process.platform==='darwin'?'mac':'win');
if(!/^\d+\.\d+\.\d+$/.test(version)||!['win','mac'].includes(platform))throw new Error('Invalid build version or platform.');
const build=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,stdio:'inherit',windowsHide:true});if(build.status!==0)process.exit(build.status||1);
try{
  metadata.version=version;fs.writeFileSync(packagePath,JSON.stringify(metadata,null,2)+'\n');
  const result=spawnSync(process.execPath,['node_modules/electron-builder/out/cli/cli.js','--config','desktop/config.cjs','--'+platform,'--publish','never','-c.directories.output=dist-native/'+version],{cwd:root,stdio:'inherit',windowsHide:true});
  if(result.status!==0)process.exitCode=result.status||1;
}finally{fs.writeFileSync(packagePath,original);}
