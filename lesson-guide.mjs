import {wordLessons,lessonNumber} from './public/word-lessons.js';
import {areaInSquareCentimetres} from './public/area-units.js';
import {sameAnswer} from './public/lessons.js';
import {wantsWorked} from './expression-guide.mjs';
const items=wordLessons.flatMap(t=>t.items);
export function lessonGuide(messages){
 const last=messages.at(-1)?.content.trim()||'';
 let item;
 for(let i=messages.length-1;i>=0;i--){
  if(messages[i].role!=='user')continue;
  item=items.find(it=>messages[i].content===it.q||messages[i].content===`Help me with ${it.q}. Give me one small first step.`);
  if(item)break;
 }
 if(!item)return null;
 const previous=messages.at(-2)?.role==='assistant'?messages.at(-2).content:'';
 let reply;
 if(wantsWorked(last))reply=`${item.rule}\n`+item.steps.map((s,i)=>`${i+1}. ${s}`).join('\n')+`\nFinal answer: ${item.a}${item.unit?' '+item.unit:''}.`;
 else if(last===item.q||last===`Help me with ${item.q}. Give me one small first step.`)reply=`${item.rule} ${item.stages[0].question}`;
 else{
  const finalValue=lessonNumber(last,item.unit);
  // A child may have solved the whole problem before following every prompt.
  if(finalValue!==null&&sameAnswer(finalValue,item.a)){
   const area=item.unit==='cm²'?areaInSquareCentimetres(last):null;
   reply=`Yes, ${last} is the correct final answer. ${area&&area.sourceUnit!=='cm²'?`It equals ${item.a} cm². `:''}You have finished this problem.`;
  }
  else{
   const index=item.stages.findIndex(s=>previous.includes(s.question)||previous.includes(s.hint));
   const s=item.stages[index<0?0:index],next=item.stages[(index<0?0:index)+1];
   const value=lessonNumber(last,s.unit);
   if(value!==null){
    reply=sameAnswer(value,s.expected)?`Yes, that step is correct: ${s.calculation} = ${s.expected}${s.unit?' '+s.unit:''}. ${next?next.question:`You have finished. The answer is ${item.a}${item.unit?' '+item.unit:''}.`}`:`Not quite for that small step. ${s.hint}`;
   }else if(/hint|don't know|do not know|try another way/i.test(last))reply=s.hint;
   else return null; // Do not judge arbitrary working or guess unit conversions.
  }
 }
 return {reply,source:'Practice guide',model:'checked-lesson'};
}
