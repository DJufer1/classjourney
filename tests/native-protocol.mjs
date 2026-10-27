import test from 'node:test';
import assert from 'node:assert/strict';
import protocol from '../desktop/protocol.cjs';
test('the browser can only request the local AI chooser; links cannot carry paths, prompts or commands',()=>{
  assert.equal(protocol.isAgentLink('classjourney://connect'),true);
  assert.equal(protocol.isAgentLink('classjourney://connect/'),true);
  for(const value of ['https://classjourney/connect','classjourney://connect?path=C:/private','classjourney://connect?agent=codex','classjourney://connect/execute','classjourney://connect#prompt','classjourney://user@connect','classjourney://connect:42','ClassJourney.exe --do-something',''])assert.equal(protocol.isAgentLink(value),false,value);
});
