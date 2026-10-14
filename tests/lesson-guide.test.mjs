import test from 'node:test';
import assert from 'node:assert/strict';
import {wordLessons,lessonNumber} from '../public/word-lessons.js';
import {sameAnswer} from '../public/lessons.js';
import {calculateExpression} from '../expression-guide.mjs';
import {lessonGuide} from '../lesson-guide.mjs';
const items=wordLessons.flatMap(t=>t.items);
test('every authored calculation and final stage is exact',()=>{
 assert.equal(items.length,10);
 for(const item of items){
  for(const s of item.stages)assert(sameAnswer(calculateExpression(s.calculation).result,s.expected),`${item.q}: ${s.calculation}`);
  assert(sameAnswer(item.stages.at(-1).expected,item.a));
 }
});
test('all ten lessons advance through correct stages and confirm completion',()=>{
 for(const item of items){
  const messages=[{role:'user',content:`Help me with ${item.q}. Give me one small first step.`}];
  let reply=lessonGuide(messages).reply;
  for(let i=0;i<item.stages.length;i++){
   assert(reply.includes(item.stages[i].question));
   messages.push({role:'assistant',content:reply},{role:'user',content:item.stages[i].expected});
   reply=lessonGuide(messages).reply;
   assert.match(reply,/correct/);
   if(sameAnswer(item.stages[i].expected,item.a))break;
  }
  assert.match(reply,/finished/);
 }
});
test('wrong values get a specific alternative hint; full requests finish',()=>{
 for(const item of items){
  const messages=[{role:'user',content:item.q},{role:'assistant',content:lessonGuide([{role:'user',content:item.q}]).reply},{role:'user',content:'999999'}];
  const bad=lessonGuide(messages).reply;
  assert.match(bad,/Not quite/);assert(bad.includes(item.stages[0].hint));assert(!bad.includes('Final answer:'));
  messages.push({role:'assistant',content:bad},{role:'user',content:'I am still stuck. Show every step and the final answer.'});
  const full=lessonGuide(messages).reply;
  for(const line of item.steps)assert(full.includes(line));
  assert(full.includes(`Final answer: ${item.a}`));
 }
});
test('correct final answers may jump ahead and include the requested unit',()=>{
 for(const item of items){
  const messages=[{role:'user',content:item.q},{role:'assistant',content:lessonGuide([{role:'user',content:item.q}]).reply},{role:'user',content:`${item.a} ${item.unit}`.trim()}];
  const reply=lessonGuide(messages).reply;assert.match(reply,/correct final answer/);assert(!reply.includes('?'));
 }
 assert.equal(lessonNumber('54 cm2?','cm²'),'54');
 assert.equal(lessonNumber('6.25 m²','cm²'),'62500');
 assert.equal(lessonNumber('2/0','coins'),'2/0');assert(!sameAnswer('2/0','2'));
});
test('unknown problems and unverified written methods stay with the model',()=>{
 assert.equal(lessonGuide([{role:'user',content:'Explain photosynthesis.'}]),null);
 const item=items[0];
 assert.equal(lessonGuide([{role:'user',content:item.q},{role:'assistant',content:item.h[0]},{role:'user',content:'I got120by adding20instead of subtracting.'}]),null);
 assert.equal(lessonGuide([{role:'user',content:item.q},{role:'assistant',content:item.h[0]},{role:'user',content:'120 square metres'}]),null);
});
