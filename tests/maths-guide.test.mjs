import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mathsGuide,recognise} from '../maths-guide.mjs';
const ask=s=>mathsGuide([{role:'user',content:s}]);
test('wrong answer leads to a smaller hint without revealing final answer',()=>{
 const result=mathsGuide([{role:'user',content:'What is 2 + 2?'},{role:'assistant',content:'How many apples altogether?'},{role:'user',content:'3'}]);
 assert.match(result.reply,/ONE counter/);assert.doesNotMatch(result.reply,/\b4\b/);assert.equal(result.source,'Verified maths guide');
});
test('correct intermediate step is acknowledged before the final question',()=>{
 const first=ask('Help me with 2 + 2');
 const result=mathsGuide([{role:'user',content:'Help me with 2 + 2'},{role:'assistant',content:first.reply},{role:'user',content:'3'}]);
 assert.match(result.reply,/step is correct/);assert.match(result.reply,/Add 1 more to 3/);assert.doesNotMatch(result.reply,/\b4\b/);
});
test('stuck learner receives complete solution, not another question',()=>{
 const first=ask('Help me understand 14 + 9');
 const result=mathsGuide([{role:'user',content:'Help me understand 14 + 9'},{role:'assistant',content:first.reply},{role:'user',content:'I am still stuck. Please show the whole solution.'}]);
 assert.match(result.reply,/14 \+ 9 = 23/);assert.doesNotMatch(result.reply,/\?/);
});
test('subtraction hint does not invent an invalid split',()=>{
 const r=ask('Help me understand 15 - 4. Give me one small hint.');assert.match(r.reply,/ONE step backwards/);assert.doesNotMatch(r.reply,/1 and 14/);
});
test('fraction subtraction uses exact equal denominators',()=>{
 assert.match(ask('Please show a worked example of 5/6 - 1/3').reply,/5\/6 - 1\/3 = 1\/2/);
 assert.match(ask('Please show every step of 3/4 divided by 1/2').reply,/3\/4 \/ 1\/2 = 3\/2/);
});
test('fraction misconception is corrected without endorsing the wrong answer',()=>{
 const r=ask('Is 1/2 + 1/4 = 2/6? I added the tops and bottoms.');assert.match(r.reply,/Not quite/);assert.match(r.reply,/bottom number 4/);assert.doesNotMatch(r.reply,/= 2\/6/);
});
test('correct final answer is confirmed, including equivalent fractions',()=>{
 assert.match(ask('I got 23 for 14 + 9. Am I right?').reply,/Yes/);
 assert.match(ask('Is 5/6 - 1/3 = 3/6?').reply,/Yes/);
 const answer=mathsGuide([{role:'user',content:'Help with 1/2 + 1/4'},{role:'assistant',content:'What is the final fraction?'},{role:'user',content:'3/4'}]);
 assert.match(answer.reply,/Yes, 1\/2 \+ 1\/4 = 3\/4/);
});
test('ambiguous, unsupported and invalid expressions are delegated',()=>{
 for(const q of ['2 + 3 * 4','(2 + 3) * 4','2.5 + 1.5','-2 + 3','2 + 2 and 3 + 3','What is a noun?','1/0 + 1/2','4 / 0','2 + 999999'])assert.equal(recognise(q),null,q);
});
test('compact multiplication notation works',()=>assert.match(ask('Show a worked example of 4x4').reply,/4 × 4 = 16/));
