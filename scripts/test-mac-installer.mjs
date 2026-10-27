import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
if(process.platform!=='darwin')throw new Error('This installer test requires macOS.');
const current=JSON.parse(await fs.readFile('package.json','utf8')).version;
const {previousVersion}=JSON.parse(await fs.readFile('desktop/test-baseline.json','utf8'));
const parent=path.resolve(process.env.RUNNER_TEMP||os.tmpdir());
const root=await fs.mkdtemp(path.join(parent,'classjourney-install-'));
if(!path.resolve(root).startsWith(parent+path.sep))throw new Error('Invalid test folder.');
const app=path.join(root,'ClassJourney.app'),data=path.join(root,'data');
const run=(cmd,args,timeout=90000)=>{const result=spawnSync(cmd,args,{encoding:'utf8',timeout});if(result.status!==0)throw new Error(cmd+': '+(result.stderr||result.stdout||result.error));return result.stdout.trim();};
let architectures='';
for(const [version,mode]of [[previousVersion,'write'],[current,'read']]){
  const mount=path.join(root,'mount-'+version);await fs.mkdir(mount);
  run('hdiutil',['attach','-quiet','-nobrowse','-readonly','-mountpoint',mount,path.resolve('dist-native',version,'ClassJourney-Mac-universal.dmg')]);
  try{if(mode==='read')await fs.rename(app,path.join(root,'ClassJourney-before-update.app'));run('/usr/bin/ditto',[path.join(mount,'ClassJourney.app'),app]);}
  finally{run('hdiutil',['detach','-quiet',mount]);}
  run('codesign',['--verify','--deep','--strict',app]);
  const actual=run('/usr/libexec/PlistBuddy',['-c','Print :CFBundleShortVersionString',path.join(app,'Contents/Info.plist')]);if(actual!==version)throw new Error('Wrong Mac bundle version: '+actual);
  const executable=path.join(app,'Contents/MacOS/ClassJourney');architectures=run('lipo',['-archs',executable]);
  if(!architectures.includes('x86_64')||!architectures.includes('arm64'))throw new Error('Universal architectures missing.');
  run(executable,['--self-test='+mode,'--test-data-dir='+data]);
  const report=JSON.parse(await fs.readFile(path.join(data,'self-test-'+mode+'.json'),'utf8'));if(report.version!==version)throw new Error('Wrong running Mac version.');
}
const final=JSON.parse(await fs.readFile(path.join(data,'self-test-read.json'),'utf8'));
if(!final.automaticAgentPlanAvailable||!final.agentOutputAcknowledged)throw new Error('Automatic AI output is not available in the installed Mac app.');
if(!final.fixtureRetained)throw new Error('The collection did not survive the Mac app replacement.');
const report={system:'macOS '+process.arch,previousVersion,installedVersion:current,realDmgInstallAndReplacement:true,automaticAgentOutputVerified:true,ownPlansImagesAndSettingsRetained:true,architectures,signature:'ad-hoc; not Apple Developer ID / notarized'};
await fs.writeFile('dist-native/update-test-mac-'+process.arch+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
