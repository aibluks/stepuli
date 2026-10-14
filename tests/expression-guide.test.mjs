import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculateExpression as calc,expressionGuide,recogniseExpression,wantsWorked} from '../expression-guide.mjs';
const user=content=>({role:'user',content}),assistant=content=>({role:'assistant',content});
test('precedence, associativity, brackets, unary signs and exact decimals',()=>{
 for(const [q,a] of [['3+5-6x4/2','-4'],['24/6*2','8'],['12-4-3','5'],['(3+5-6)*4/2','4'],['2^2^2','16'],['-2^2','-4'],['(-2)^2','4'],['0.1+0.2','3/10'],['-3-(-8)+2','7'],['1/2-5/12','1/12'],['(3+5)+2+6*4','34']])assert.equal(calc(q).result,a,q);
});
test('connected worked trace for user mixed example',()=>{assert.deepEqual(calc('3+5-6x4/2').steps.map(s=>[s.part,s.result]),[['6 × 4','24'],['24 ÷ 2','12'],['3 + 5','8'],['8 − 12','-4']]);});
test('hint hides final answer, feedback advances, full example finishes',()=>{
 const q=user('3+5-6x4/2');const h=expressionGuide([q]);assert.ok(h);assert.doesNotMatch(h.reply,/-4/);assert.match(h.reply,/What is/);
 const ok=expressionGuide([q,assistant(h.reply),user('24')]);assert.match(ok.reply,/step is correct/);assert.doesNotMatch(ok.reply,/-4/);
 const work=expressionGuide([q,assistant(h.reply),user('I am still stuck. Show every step.')]);assert.match(work.reply,/Final answer:.*-4/);assert.match(work.reply,/24 ÷ 2 = 12/);
});
test('invalid and unbounded input never executed',()=>{for(const q of ['2/0+3','2+process.exit()','2^100','2++','(2+3','2**3'])assert.throws(()=>calc(q));assert.equal(recogniseExpression('There are 3 children and 5 apples.'),null);});

test('bracket steps precede multiplication elsewhere',()=>{const s=calc('(3+5)+2+6*4').steps;assert.equal(s[0].part,'3 + 5');assert.equal(s[1].part,'6 × 4');});

test('hint-only requests never trigger a full solution because they mention the answer',()=>{
 for(const text of ['Give me one useful hint. Leave the final answer for me.','Do not give the answer for 3+5-6x4/2.','Give just a hint, without a worked solution.'])assert.equal(wantsWorked(text),false,text);
 for(const text of ['I am still stuck. Show every step and the final answer.','I tried one hint and am still stuck. Show every step.','Give me the final answer.','I do not understand. Show every step and the answer.'])assert.equal(wantsWorked(text),true,text);
 const q=user('3+5-6x4/2'),h=expressionGuide([q]);const reply=expressionGuide([q,assistant(h.reply),user('Give me one useful hint. Leave the final answer for me.')]);assert.doesNotMatch(reply.reply,/-4/);
});

test('wrong last step keeps final answer hidden and correct final answers can skip ahead',()=>{
 const q=user('3+5-6x4/2');const wrong=expressionGuide([q,assistant('Now use that result. What is 8 − 12?'),user('-3')]);assert.doesNotMatch(wrong.reply,/-4/);assert.match(wrong.reply,/zero/);
 const correct=expressionGuide([q,assistant('What is 6 × 4?'),user('-4')]);assert.match(correct.reply,/correct final answer/);
});

test('a follow-up hint changes the explanation while keeping the answer hidden',()=>{const q=user('3+5-6x4/2'),first=expressionGuide([q]);const next=expressionGuide([q,assistant(first.reply),user('Give me another hint, leave the answer for me.')]);assert.notEqual(next.reply,first.reply);assert.match(next.reply,/groups/);assert.doesNotMatch(next.reply,/-4/);});

test('negative-number hints use the correct number-line direction',()=>{const q=user('-3-(-8)+2'),first=expressionGuide([q]);const next=expressionGuide([q,assistant(first.reply),user('Give another hint please')]);assert.match(next.reply,/8 to the right/);assert.doesNotMatch(next.reply,/-8 to the left/);});
