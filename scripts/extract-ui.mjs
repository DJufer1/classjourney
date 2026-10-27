import fs from 'node:fs';
import {extractUiMessages} from './i18n-source.mjs';
const paths=['src/app.js','src/workspace.js'];
const messages=new Set(paths.flatMap(file=>extractUiMessages(fs.readFileSync(file,'utf8'))));
const data=JSON.parse(fs.readFileSync('content/collection.json','utf8'));
for(const plan of data.plans)if(plan.isDemo){messages.add(plan.title);for(const activity of plan.activities){messages.add(activity.title);if(activity.description)messages.add(activity.description);}}
for(const background of Object.values(data.assets.backgrounds))messages.add(background.name);
const list=[...messages].sort((a,b)=>a.localeCompare(b,'de'));fs.writeFileSync('../ui-messages.json',JSON.stringify(list,null,2));console.log(JSON.stringify({messages:list.length,characters:list.reduce((n,s)=>n+s.length,0),output:'../ui-messages.json'}));
