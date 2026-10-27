import assert from 'node:assert/strict';
import {artFingerprint,refreshBuiltinArt} from '../src/engine.mjs';
const old={backgrounds:{resources:{src:'old-resource',name:'Alt'},journey:{src:'old-journey'}},atlas:'old-atlas',fageAtlas:'old-fage'};
const shipped={backgrounds:{resources:{src:'new-resource',name:'Neu'},journey:{src:'new-journey'},room:{src:'new-room'}},atlas:'new-atlas',fageAtlas:'new-fage'};
const previous={backgrounds:{resources:artFingerprint('old-resource'),journey:artFingerprint('old-journey')},atlas:artFingerprint('old-atlas'),fageAtlas:artFingerprint('old-fage')};
const current=structuredClone(old);current.backgrounds.journey={src:'my-own-journey',name:'Mein Bild'};current.backgrounds.private={src:'private-source',name:'Eigener Hintergrund'};current.fageAtlas='my-fage-atlas';
assert.equal(refreshBuiltinArt(current,shipped,previous),true);
assert.equal(current.backgrounds.resources.src,'new-resource');
assert.equal(current.backgrounds.room.src,'new-room');
assert.equal(current.backgrounds.journey.src,'my-own-journey');
assert.equal(current.backgrounds.private.src,'private-source');
assert.equal(current.atlas,'new-atlas');assert.equal(current.fageAtlas,'my-fage-atlas');
assert.equal(refreshBuiltinArt(current,shipped,previous),false);
console.log('Passed: shipped artwork refreshes once; custom backgrounds and custom atlases remain intact.');
// People skipping a release still receive the shipped comic art; personal art remains untouched.
for(const source of ['v1-source','v2-source']){
  const asset={backgrounds:{resources:{src:source},private:{src:'my-drawing'}},atlas:source,fageAtlas:'my-custom-fage'};
  const history={backgrounds:{resources:[artFingerprint('v1-source'),artFingerprint('v2-source')]},atlas:[artFingerprint('v1-source'),artFingerprint('v2-source')],fageAtlas:[artFingerprint('v1-fage')]};
  assert.equal(refreshBuiltinArt(asset,shipped,history),true);assert.equal(asset.backgrounds.resources.src,'new-resource');assert.equal(asset.atlas,'new-atlas');assert.equal(asset.backgrounds.private.src,'my-drawing');assert.equal(asset.fageAtlas,'my-custom-fage');
}
