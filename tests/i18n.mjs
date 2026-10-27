import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import catalog from '../content/translations.json' with {type:'json'};
import {setUiLanguage,ui,tr,formatMessage,dayLabel,localizedDemo} from '../src/i18n.mjs';
import {compileUi,extractUiMessages} from '../scripts/i18n-source.mjs';
import {validateCollection} from '../src/engine.mjs';
import {permissionPrompt} from '../desktop/agent-link.mjs';

test('all captured interface messages have translations and keep every placeholder',async()=>{
  const sources=await Promise.all(['app','workspace'].map(name=>fs.readFile(new URL('../src/'+name+'.js',import.meta.url),'utf8')));
  const messages=new Set(sources.flatMap(extractUiMessages));
  const slots=text=>[...text.matchAll(/\{\d+\}/g)].map(match=>match[0]).sort();
  for(const language of ['en','fr','es','it']){
    for(const message of messages)assert.ok(Object.hasOwn(catalog[language],message),language+': '+message);
    for(const [key,value]of Object.entries(catalog[language]))assert.deepEqual(slots(value),slots(key),language+': '+key);
  }
});
test('language changes translate interface text while preserving personal text, HTML and control identifiers',()=>{
  const title='Neuer Unterrichtstag',escaped='A &lt; B',render=()=>ui`<button data-action="close-dialog" title="Schliessen">Schliessen</button><h1>${title}</h1><p>${escaped}</p>`;
  setUiLanguage('en');assert.equal(render(),'<button data-action="close-dialog" title="Close">Close</button><h1>Neuer Unterrichtstag</h1><p>A &lt; B</p>');
  setUiLanguage('fr');assert.ok(render().includes('Fermer'));assert.ok(render().includes(title));
  setUiLanguage('es');assert.equal(dayLabel(2),'martes');
  setUiLanguage('it');assert.equal(dayLabel(2),'martedì');
  setUiLanguage('de');assert.equal(dayLabel(2),'Dienstag');assert.ok(render().includes('Schliessen'));
});
test('demo translations are display-only; edited and own plans retain their original content',async()=>{
  const source=JSON.parse(await fs.readFile(new URL('../content/collection.json',import.meta.url),'utf8')),before=JSON.stringify(source);
  for(const language of ['en','fr','es','it']){
    setUiLanguage(language);const translated=localizedDemo(source.plans[0]);assert.notEqual(translated.title,source.plans[0].title);assert.notEqual(translated.activities[0].title,source.plans[0].activities[0].title);
    const edited={...source.plans[0],updatedAt:100};assert.equal(localizedDemo(edited),edited);
    const own={...source.plans[0],id:'own',isDemo:false};assert.equal(localizedDemo(own),own);
    assert.equal(validateCollection({...source,settings:{...source.settings,language}}).settings.language,language);
  }
  assert.equal(JSON.stringify(source),before);assert.equal(Object.hasOwn(validateCollection(source).settings,'language'),false);setUiLanguage('de');
});
test('translated agent prompts preserve both exact paths and point to the full skill with a real permission request',()=>{
  const root='C:\\Users\\Jufer & Team\\KI-Agent',installation='/Applications/ClassJourney.app';
  for(const language of ['de','en','fr','es','it']){
    const prompt=permissionPrompt(root,installation,language);assert.ok(prompt.includes(root));assert.ok(prompt.includes(installation));assert.ok(prompt.includes('Anweisungen KI-Agent/class-journey/SKILL.md'));assert.ok(prompt.includes('START_HERE.md'));assert.ok(!/\{\d+\}/.test(prompt));if(language!=='de')assert.notEqual(prompt,permissionPrompt(root,installation));
  }
  assert.equal(formatMessage('Version {0} installieren?',['1.2.1'],'en'),'Install version 1.2.1?');
});
test('compiled source and both generated entry points are valid JavaScript',async()=>{
  const source=await fs.readFile(new URL('../src/app.js',import.meta.url),'utf8'),workspace=await fs.readFile(new URL('../src/workspace.js',import.meta.url),'utf8');
  const compiled=compileUi(source.replace('// WORKSPACE_FUNCTIONS',()=>workspace),new Set(Object.keys(catalog.en)));new vm.Script(compiled);
  for(const name of ['ClassJourney.html','index.html']){
    const html=await fs.readFile(new URL('../docs/'+name,import.meta.url),'utf8');let count=0;
    for(const script of html.matchAll(/<script(?: id="[^"]+")?>([\s\S]*?)<\/script>/g)){new vm.Script(script[1],{filename:name});count++;}
    assert.ok(count>=1,name);
  }
});
