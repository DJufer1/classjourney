import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createLessonClock,migrateStarterPlans,validateCollection} from '../src/engine.mjs';

const seed=JSON.parse(fs.readFileSync(new URL('../content/collection.json',import.meta.url),'utf8'));
assert.equal(seed.plans.length,1);
const demo=seed.plans[0];
assert.equal(demo.title,'Demo-Tag');
assert.equal(demo.isDemo,true);
assert.equal(validateCollection(seed).plans[0].isDemo,true);

let wall=new Date(2026,9,27,21,47,0),elapsed=1000;
const clock=createLessonClock({systemNow:()=>wall,monotonicNow:()=>elapsed});
clock.open(demo);
assert.equal(clock.mode,'demo');
assert.equal(clock.now(),500); // Always 08:20, even if opened at night.
elapsed+=120000;
assert.equal(clock.now(),502);
wall=new Date(2026,9,28,2,3,0);
assert.equal(clock.now(),502); // Changing device date and clock cannot move the demo.
clock.toggle();
assert.equal(clock.running,false);
elapsed+=600000;
assert.equal(clock.now(),502);
clock.step(5);
assert.equal(clock.now(),507);
clock.toggle();
elapsed+=60000;
assert.equal(clock.now(),508);
clock.reset();
assert.equal(clock.now(),500);
assert.equal(clock.running,true);
clock.set(550);
elapsed+=60000;
assert.equal(clock.now(),551);
clock.open(demo,true);
assert.equal(clock.mode,'demo');
assert.equal(clock.now(),500);

const own={...demo,id:'my-lesson',isDemo:false,example:false,date:'2030-01-02'};
clock.open(own);
assert.equal(clock.mode,'live');
assert.equal(clock.now(),123);
wall=new Date(2026,9,28,8,22,30);
assert.equal(clock.now(),502.5); // Real lessons always follow the device, including clock changes.
clock.step(5);clock.toggle();clock.reset();
assert.equal(clock.now(),502.5);
clock.open(own,true);
assert.equal(clock.mode,'preview');
elapsed+=3600000;
assert.equal(clock.now(),515);
clock.open(own);
assert.equal(clock.now(),502.5);

const old=(id,changes={})=>({...own,id,example:true,updatedAt:2,...changes});
const edited=old('beispiel-1i-do',{title:'Mein angepasster Tag',updatedAt:99});
const originalOwn={...own,updatedAt:100};
const migration=migrateStarterPlans([old('beispiel-1i-di'),edited,old('beispiel-2i-mi'),originalOwn],seed.plans);
assert.equal(migration.changed,true);
assert.deepEqual(migration.plans.map(p=>p.id),['demo-tag','beispiel-1i-do','my-lesson']);
assert.deepEqual(migration.plans[1],{...edited,example:false,isDemo:false});
assert.equal(migration.plans[2],originalOwn);
assert.equal(migration.plans.filter(p=>p.isDemo).length,1);
assert.equal(migrateStarterPlans(migration.plans,seed.plans).changed,false);
assert.deepEqual(migrateStarterPlans([originalOwn],seed.plans),{plans:[originalOwn],changed:false});
assert.deepEqual(migrateStarterPlans([],seed.plans),{plans:[],changed:false}); // A deliberately deleted demo stays deleted.
assert.equal(migrateStarterPlans([demo,old('beispiel-1i-di')],seed.plans).plans.length,1);
assert.equal(migrateStarterPlans([old('custom-example')],seed.plans).changed,false);
console.log('Passed: one Demo-Tag; independent running, paused, adjusted and reset demo time; real device time; explicit preview; safe and idempotent migration preserving edited and custom plans.');
