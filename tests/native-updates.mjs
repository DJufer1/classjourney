import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {compareVersions,installerName,selectReleaseUpdate,expectedChecksum,RELEASE_API,INSTALLER_CHECKSUMS} from '../src/updates.mjs';
import {InstallerUpdates} from '../desktop/update-service.mjs';

const bytes=Buffer.from('This is an installer fixture, not an executable.');
const digest=createHash('sha256').update(bytes).digest('hex');
const makeRelease=(platform='win32',version='1.2.0')=>({tag_name:'v'+version,draft:false,prerelease:false,assets:[installerName(platform),INSTALLER_CHECKSUMS].map(name=>({name,size:name===INSTALLER_CHECKSUMS?100:bytes.length,browser_download_url:'https://github.com/DJufer1/classjourney/releases/download/v'+version+'/'+name}))});
test('version comparison never offers a downgrade or confuses 1.10 with 1.2',()=>{
  assert.equal(compareVersions('1.10.0','1.2.9'),1);assert.equal(compareVersions('v1.2.0','1.2.0'),0);assert.equal(compareVersions('1.1.9','1.2.0'),-1);
  assert.equal(selectReleaseUpdate(makeRelease(),'1.2.0','win32').available,false);
  assert.equal(selectReleaseUpdate(makeRelease(),'1.3.0','win32').available,false);
  assert.throws(()=>compareVersions('bad','1.2.0'));
});
test('Windows and Mac select only their installer from this GitHub repository',()=>{
  for(const platform of ['win32','darwin'])assert.equal(selectReleaseUpdate(makeRelease(platform),'1.1.9',platform).installer.name,installerName(platform));
  const wrong=makeRelease();wrong.assets[0].browser_download_url='https://example.com/installer.exe';assert.throws(()=>selectReleaseUpdate(wrong,'1.1.9','win32'));
  const preview=makeRelease();preview.prerelease=true;assert.throws(()=>selectReleaseUpdate(preview,'1.1.9','win32'));
  assert.throws(()=>expectedChecksum(digest+'  a.exe\n'+digest+'  a.exe','a.exe'));
});
test('download is complete, hash-verified and checked again before an installer can be opened',async()=>{
  for(const platform of ['win32','darwin']){
    const release=makeRelease(platform),directory=await fs.mkdtemp(path.join(os.tmpdir(),'classjourney-update-'));
    const fetcher=async url=>{if(url===RELEASE_API)return Response.json(release);if(url.endsWith(INSTALLER_CHECKSUMS))return new Response(digest+'  '+installerName(platform));return new Response(bytes);};
    const service=new InstallerUpdates({version:'1.1.9',platform,directory,fetcher});
    const result=await service.download();assert.equal(result.version,'1.2.0');assert.equal(result.downloaded,true);
    const ready=await service.verifiedInstaller();assert.deepEqual(await fs.readFile(ready.path),bytes);
    await fs.writeFile(ready.path,'tampered');await assert.rejects(()=>service.verifiedInstaller(),/verändert/);
  }
});
test('a wrong checksum, a truncated download or missing checksum cannot become an installable update',async()=>{
  for(const failure of ['hash','truncated','missing']){
    const release=makeRelease(),directory=await fs.mkdtemp(path.join(os.tmpdir(),'classjourney-reject-'));
    const fetcher=async url=>{if(url===RELEASE_API)return Response.json(release);if(url.endsWith(INSTALLER_CHECKSUMS))return new Response(failure==='missing'?'':(failure==='hash'?'0'.repeat(64):digest)+'  '+installerName('win32'));return new Response(failure==='truncated'?bytes.subarray(0,3):bytes);};
    const service=new InstallerUpdates({version:'1.1.9',platform:'win32',directory,fetcher});
    await assert.rejects(()=>service.download());assert.equal(service.pending,null);await assert.rejects(()=>service.verifiedInstaller());
  }
});
