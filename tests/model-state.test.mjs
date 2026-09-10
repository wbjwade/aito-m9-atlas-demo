import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CATEGORIES, allVisible, clampExpansion, classifyPart, partLabel, visibleCount } from '../src/model-state.js';

test('eight uniquely named groups and independent initial visibility', () => {
  assert.equal(CATEGORIES.length, 8);
  assert.equal(new Set(CATEGORIES.map(c => c.id)).size, 8);
  assert.ok(CATEGORIES.every(c => c.name && c.color && c.section));
  const a = allVisible(); a.body = false;
  assert.equal(allVisible().body, true);
});
test('expansion handles endpoints and invalid input', () => {
  for (const [input, output] of [[0,0],[100,100],[110,100],[-1,0],['57',57],['x',0],[null,0],[Infinity,100]]) assert.equal(clampExpansion(input),output);
});
test('visibility count is actual mesh count', () => {
  const parts = [{category:'body'},{category:'body'},{category:'glass'}];
  assert.equal(visibleCount(parts, allVisible()), 3);
  assert.equal(visibleCount(parts, {...allVisible(), body:false}),1);
  assert.equal(visibleCount(parts, {}),0);
});
test('shared chassis ancestors do not swallow interior or paint', () => {
  assert.equal(classifyPart(['Seat_Leather_white_0_150','Seat Leather white_149','chassis_26'],'Seat Leather white'),'interior');
  assert.equal(classifyPart(['body_primary_0_33','body_32','chassis_26'],'Paint'),'body');
  assert.equal(classifyPart(['LCDs_147','base_71','chassis_26'],'LCD'),'interior');
});
test('light-coloured carpet and aluminium are not lights', () => {
  assert.equal(classifyPart(['Carpet_Light_138','base_71','chassis_26'],'Carpet Light'),'interior');
  assert.equal(classifyPart(['aluminium_226','door_rf_dummy_218'],'aluminium_light.0'),'doors');
});
test('brake light is not suspension; wheel ancestors retain wheel group', () => {
  assert.equal(classifyPart(['breake_int_59','black_lights_36'],'breaklight_l'),'glass');
  assert.equal(classifyPart(['suspensi_91','chassis_26'],'metal'),'suspension');
  assert.equal(classifyPart(['brake','hub_rf_8'],'metal'),'wheels');
  assert.equal(classifyPart(['unrecognized'],'unrecognized'),'trim');
});
test('part labels are semantic and have a fallback', () => {
  assert.equal(partLabel(['front_bumper_ok_268'],'body'),'前保险杠');
  assert.equal(partLabel(['unknown'],'interior'),'座舱与内饰');
});
test('bundled GLB has embedded assets, exact mesh count, and original CC attribution', async () => {
  const data = await readFile(new URL('../public/models/tesla-model-3-community.glb',import.meta.url));
  assert.equal(data.toString('utf8',0,4),'glTF');
  const json = JSON.parse(data.toString('utf8',20,20+data.readUInt32LE(12)));
  assert.equal(json.meshes.length,177);
  assert.match(json.asset.extras.license,/CC-BY-4.0/);
  assert.match(json.asset.extras.author,/aarajesh/);
  assert.ok(json.images.every(image => image.bufferView !== undefined));
  for (const name of ['draco_decoder.js','draco_decoder.wasm','draco_wasm_wrapper.js']) assert.ok((await readFile(new URL(`../public/draco/${name}`,import.meta.url))).length > 1000);
});
