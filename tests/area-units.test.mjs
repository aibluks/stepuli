import test from 'node:test';
import assert from 'node:assert/strict';
import {areaInSquareCentimetres} from '../public/area-units.js';
import {lessonNumber,wordLessons} from '../public/word-lessons.js';
import {sameAnswer} from '../public/lessons.js';
import {lessonGuide} from '../lesson-guide.mjs';
test('area conversions square the length scale and remain exact',()=>{
 // A square with2m sides has4m²=40000cm²; a10cm square has100cm²=1dm².
 assert.equal(areaInSquareCentimetres('4 m²').value,'40000');
 assert.equal(areaInSquareCentimetres('1 dm²').value,'100');
 assert.equal(areaInSquareCentimetres('100 mm²').value,'1');
 assert.equal(areaInSquareCentimetres('0.00000001 km²').value,'100');
 assert.equal(areaInSquareCentimetres('0.0088 m²').value,'88');
 assert.equal(areaInSquareCentimetres('0.001 m²').value,'10');
});
test('fractions, mixed numbers and metric spelling variants convert',()=>{
 assert.equal(areaInSquareCentimetres('1/2 dm2').value,'50');
 assert.equal(areaInSquareCentimetres('1 1/2 square metres').value,'15000');
 assert.equal(areaInSquareCentimetres('−1/2 m^2').value,'-5000');
 assert.equal(areaInSquareCentimetres('54 square centimeters?').value,'54');
 assert.equal(areaInSquareCentimetres('88 cm²').sourceUnit,'cm²');
});
test('wrong dimensions, ambiguous units and malformed values are not judged',()=>{
 for(const value of ['88 cm','88 cm³','88 feet²','88 square meters<script>','1/0 m²','m²','1 + 2 m²','1e6 m²','9'.repeat(161)+' m²'])assert.equal(areaInSquareCentimetres(value),null,value);
 assert.equal(lessonNumber('88 m²','coins'),null);
 assert(!sameAnswer(lessonNumber('88 m²','cm²'),'88'));
 assert(!sameAnswer(lessonNumber('0.88 m²','cm²'),'88'));
});
test('equivalent final and intermediate areas work in the actual lesson guide',()=>{
 const item=wordLessons.find(t=>t.id==='surface').items[1];
 const initial=lessonGuide([{role:'user',content:item.q}]).reply;
 const messages=[{role:'user',content:item.q},{role:'assistant',content:initial}];
 const final=lessonGuide([...messages,{role:'user',content:'0.0088 m²'}]).reply;
 assert.match(final,/correct final answer/);assert.match(final,/It equals 88 cm²/);assert.match(final,/finished/);assert(!final.includes('?'));
 const step=lessonGuide([...messages,{role:'user',content:'0.0008 m²'}]).reply;
 assert.match(step,/step is correct/);assert(step.includes(item.stages[1].question));
});
