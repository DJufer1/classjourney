import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {AgentWorkspace,permissionPrompt,codexLink,discoverAgents,agentLaunchPlan,openAgent,copyAgentStart} from '../desktop/agent-link.mjs';

test('Codex receives the exact local folder and permission prompt as a draft, without shell commands',async()=>{
  const root='C:\\Users\\Jufer & Team\\ClassJourney\\KI-Agent',install='C:\\Programme\\ClassJourney';
  const prompt=permissionPrompt(root,install),plan=agentLaunchPlan({id:'codex',kind:'codex'},root,prompt,'win32');
  const link=new URL(plan.url);assert.equal(link.protocol,'codex:');assert.equal(link.hostname,'threads');assert.equal(link.pathname,'/new');assert.equal(link.searchParams.get('path'),root);assert.equal(link.searchParams.get('prompt'),prompt);assert.equal(plan.promptInLink,true);
  assert.ok(prompt.includes(root)&&prompt.includes(install));assert.ok(prompt.includes('Lese- und Schreibzugriff'));
  const observed=[];await openAgent(plan,{openExternal:async url=>observed.push(url),copyPrompt:value=>observed.push(value)},prompt);assert.deepEqual(observed,[prompt,plan.url]);
  assert.throws(()=>agentLaunchPlan({id:'unknown',kind:'editor',executable:'bad.exe'},root,prompt,'win32'));
  assert.equal(codexLink(root,'x'.repeat(5000)).promptInLink,false);
});
test('only installed known programs are offered; editor paths remain separate process arguments',async()=>{
  const cursor='C:\\Local\\Programs\\cursor\\Cursor.exe';
  const apps=await discoverAgents({platform:'win32',home:'C:\\Users\\Me',environment:{LOCALAPPDATA:'C:\\Local'},codexInstalled:async()=>true,pathExists:async value=>value===cursor});
  assert.deepEqual(apps.map(app=>app.id),['codex','cursor']);
  const root='C:\\Users\\Me\\project & safe';const launch=agentLaunchPlan(apps[1],root,'prompt','win32');assert.equal(launch.executable,cursor);assert.deepEqual(launch.args,['--new-window',root]);
  const none=await discoverAgents({platform:'win32',environment:{},codexInstalled:async()=>false,pathExists:async()=>false});assert.deepEqual(none,[]);
  const mac=await discoverAgents({platform:'darwin',home:'/Users/me',pathExists:async file=>file==='/Applications/Codex.app'});assert.deepEqual(mac.map(app=>app.id),['codex']);
});
test('the fixed app folder preserves AI edits unless the user chooses a backed-up replacement',async()=>{
  const data=await fs.mkdtemp(path.join(os.tmpdir(),'classjourney-agent-link-')),workspace=new AgentWorkspace(data,'/Applications/ClassJourney.app');
  const files=[{name:'data/plans.json',content:'{"plans":[]}'},{name:'Anweisungen KI-Agent/class-journey/SKILL.md',content:'skill'},{name:'AGENTS.md',content:'read skill'},{name:'assets/example.png',content:new Uint8Array([1,2,3])}];
  const first=await workspace.prepare(files,async()=>{throw new Error('Unexpected first-use prompt');});assert.equal(first.root,path.join(data,'KI-Agent'));
  assert.ok((await fs.readFile(path.join(first.root,'AGENTS.md'),'utf8')).includes(first.root));
  const target=path.join(first.root,'data/plans.json');await fs.writeFile(target,'agent edit');
  const existing=await workspace.prepare(files,async()=>'existing');assert.equal(existing.existing,true);assert.equal(await fs.readFile(target,'utf8'),'agent edit');
  assert.equal((await workspace.prepare(files,async()=>'cancel')).cancelled,true);
  const updatedFiles=files.map(file=>file.name.endsWith('SKILL.md')?{...file,content:'Current comic skill with automatic app delivery'}:file);
  const refreshed=await workspace.prepare(updatedFiles,async()=>'existing');assert.ok(refreshed.instructionsBackup);assert.equal(await fs.readFile(path.join(first.root,'Anweisungen KI-Agent/class-journey/SKILL.md'),'utf8'),'Current comic skill with automatic app delivery');assert.equal(await fs.readFile(target,'utf8'),'agent edit');assert.equal(await fs.readFile(path.join(refreshed.instructionsBackup,'Anweisungen KI-Agent/class-journey/SKILL.md'),'utf8'),'skill');
  const replaced=await workspace.prepare(files,async()=>'replace');assert.equal(await fs.readFile(path.join(replaced.backup,'data/plans.json'),'utf8'),'agent edit');assert.equal(await fs.readFile(target,'utf8'),files[0].content);
  await assert.rejects(()=>workspace.prepare([{...files[0],name:'../escape.json'},...files.slice(1)],async()=>'replace'));
});
test('copying the prompt first makes the complete skill accessible without launching an agent',async()=>{
  const data=await fs.mkdtemp(path.join(os.tmpdir(),'classjourney-copy-prompt-')),workspace=new AgentWorkspace(data,'/Applications/ClassJourney.app');
  const files=[{name:'data/plans.json',content:'{"plans":[]}'},{name:'Anweisungen KI-Agent/class-journey/SKILL.md',content:'Complete skill instructions'},{name:'Anweisungen KI-Agent/class-journey/references/LEKTIONEN.json',content:'{"lessons":[]}'}];
  let copied=null;
  const result=await copyAgentStart(workspace,files,async()=>'existing',async prompt=>{assert.equal(await fs.readFile(path.join(workspace.root,files[1].name),'utf8'),'Complete skill instructions');copied=prompt;});
  assert.equal(result.copied,true);assert.equal(result.permissionConfirmationRequired,true);assert.equal(copied,workspace.info().prompt);
  await fs.unlink(path.join(workspace.root,files[1].name));
  await fs.writeFile(path.join(workspace.root,'data/plans.json'),'AI work retained');
  await copyAgentStart(workspace,files,async()=>'existing',()=>{});
  assert.equal(await fs.readFile(path.join(workspace.root,files[1].name),'utf8'),'Complete skill instructions');assert.equal(await fs.readFile(path.join(workspace.root,'data/plans.json'),'utf8'),'AI work retained');
});
