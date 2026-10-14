import {expressionGuide,wantsWorked} from './expression-guide.mjs';
// Exact, offline arithmetic for a deliberately narrow set of recognised questions.
// Anything ambiguous stays with the language model; no eval or generated code.
const gcd=(a,b)=>b?gcd(b,a%b):(a<0n?-a:a);
function rat(n,d=1n){if(!d)throw Error('zero denominator');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);return {n:n/g,d:d/g};}
const parse=s=>{const [n,d='1']=s.replace(/\s/g,'').split('/');return rat(BigInt(n),BigInt(d));};
const fmt=x=>x.d===1n?`${x.n}`:`${x.n}/${x.d}`;
const equal=(a,b)=>a.n*b.d===b.n*a.d;
const add=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d);
const sub=(a,b)=>rat(a.n*b.d-b.n*a.d,a.d*b.d);
const mul=(a,b)=>rat(a.n*b.n,a.d*b.d);
const div=(a,b)=>rat(a.n*b.d,a.d*b.n);
const operand='\\d{1,5}(?:\\s*/\\s*\\d{1,5})?';
const expression=new RegExp(`(${operand})\\s*(divided by|times|[+*×÷/−-]|x)\\s*(${operand})`,'gi');
export function recognise(text){
 text=text.split('=')[0];
 if(/[()^]/.test(text)||/\d\.\d/.test(text))return null;
 const matches=[...text.matchAll(expression)];
 if(matches.length!==1)return null;
 const m=matches[0],before=text.slice(0,m.index),after=text.slice(m.index+m[0].length);
 if(/[\d+*/×÷−-]\s*$/.test(before)||/^\s*(?:[\d+*/×÷−-]|times\b|divided\b)/i.test(after))return null;
 try{const a=parse(m[1]),b=parse(m[3]);const op=({times:'*',x:'*','×':'*','÷':'/','divided by':'/','−':'-'})[m[2].toLowerCase()]||m[2];if(op==='/'&&b.n===0n)return null;const result=({'+':add,'-':sub,'*':mul,'/':div})[op](a,b);return {a,b,op,result,expression:`${fmt(a)} ${op==='*'?'×':op} ${fmt(b)}`};}catch{return null;}
}
function lesson(p){
 const {a,b,op,result}=p;const A=fmt(a),B=fmt(b),R=fmt(result);let question,step,explanation,work,next;
 if(a.d>1n||b.d>1n){
  if(op==='+'||op==='-'){
   const d=a.d/gcd(a.d,b.d)*b.d,n=a.n*(d/a.d),m=b.n*(d/b.d),top=op==='+'?n+m:n-m;
   const chosen=a.d===d&&b.d!==d?b:a,chosenName=fmt(chosen),converted=chosen.n*(d/chosen.d);
   question=chosen.d===d?`Both fractions already have bottom number ${d}. What is ${a.n} ${op} ${b.n}?`:`Use equal-sized pieces with bottom number ${d}. Multiply the top and bottom of ${chosenName} by ${d/chosen.d}. What is its new top number?`;
   step=rat(chosen.d===d?top:converted);explanation=chosen.d===d?`${a.n} ${op} ${b.n} = ${top}.`:`${chosen.n} × ${d/chosen.d} = ${converted}, so ${chosenName} = ${converted}/${d}.`;
   next=`We now have ${n}/${d} and ${m}/${d}. ${chosen.d===d?'Keep that new top and write the final fraction with the same bottom.':'Now '+(op==='+'?'add':'subtract')+' the tops and keep the bottom '+d+'.'} What is the final fraction?`;
   work=`Use bottom number ${d} for both fractions. ${A} = ${n}/${d} and ${B} = ${m}/${d}. ${n} ${op} ${m} = ${top}. Keep the bottom: ${top}/${d}. ${p.expression} = ${R}${fmt(rat(top,d))!==`${top}/${d}`?' after simplifying':''}.`;
  }else if(op==='*'){
   step=rat(a.n*b.n);question=`For fraction multiplication, multiply the tops first. What is ${a.n} × ${b.n}?`;explanation=`${a.n} × ${b.n} = ${step.n}.`;next=`Now multiply the bottoms: ${a.d} × ${b.d}. Put the two results together and simplify. What is the final fraction?`;
   work=`Multiply the tops: ${a.n} × ${b.n} = ${a.n*b.n}. Multiply the bottoms: ${a.d} × ${b.d} = ${a.d*b.d}. This gives ${a.n*b.n}/${a.d*b.d}. Simplify: ${p.expression} = ${R}.`;
  }else{
   step=rat(b.d,b.n);question=`To divide by ${B}, multiply by its reciprocal: swap its top and bottom. What is the reciprocal of ${B}?`;explanation=`Swapping ${b.n} and ${b.d} gives ${fmt(step)}.`;next=`Now multiply ${A} by ${fmt(step)} and simplify. What is the final fraction?`;work=`The reciprocal of ${B} is ${fmt(step)}. Change division to multiplication: ${A} × ${fmt(step)} = ${a.n*b.d}/${a.d*b.n}. Simplify: ${p.expression} = ${R}.`;
  }
 }else if(op==='+'){
  step=rat(a.n+1n);question=`Start at ${A} on a number line. Add just ONE counter first. What number comes immediately after ${A}?`;explanation=`Adding one moves forward once: ${A} + 1 = ${fmt(step)}.`;next=`We have added one of the ${B} counters. Add ${b.n-1n} more to ${fmt(step)}. What is the final total?`;
  const tens=b.n/10n*10n,ones=b.n%10n;
  work=tens?`Split ${B} into ${tens} and ${ones}. ${A} + ${tens} = ${a.n+tens}. Then ${a.n+tens} + ${ones} = ${R}. So ${p.expression} = ${R}.`:`Start at ${A} and count on ${B} steps: ${Array.from({length:Number(b.n)},(_,i)=>`${a.n+BigInt(i)+1n}`).join(', ')||'no steps'}. So ${p.expression} = ${R}.`;
 }else if(op==='-'){
  step=rat(a.n-1n);question=`Start at ${A} on a number line. Take just ONE step backwards. Which number do you reach?`;explanation=`One step backwards gives ${A} - 1 = ${fmt(step)}.`;next=`We have taken away one of the ${B}. Take away ${b.n-1n} more from ${fmt(step)}. What is the final number?`;
  const tens=b.n/10n*10n,ones=b.n%10n;
  work=tens?`Split ${B} into ${tens} and ${ones}. ${A} - ${tens} = ${a.n-tens}. Then ${a.n-tens} - ${ones} = ${R}. So ${p.expression} = ${R}.`:`Start at ${A} and move backwards ${B} steps: ${Array.from({length:Number(b.n)},(_,i)=>`${a.n-BigInt(i)-1n}`).join(', ')||'no steps'}. So ${p.expression} = ${R}.`;
 }else if(op==='*'){
  const groups=a.n>=2n?2n:1n;step=rat(groups*b.n);question=`${A} × ${B} means ${A} equal groups of ${B}. Look at just ${groups} ${groups===1n?'group':'groups'} first. How many counters ${groups===1n?'are in that group':`make ${B} + ${B}`}?`;explanation=`${groups} ${groups===1n?'group':'groups'} of ${B} contain ${fmt(step)} counters.`;next=`Now count all ${A} groups of ${B}. What is the final total?`;
  work=a.n<=12n?`${A} groups of ${B} means ${Array.from({length:Number(a.n)},()=>B).join(' + ')||'no groups'}. The total is ${R}. So ${p.expression} = ${R}.`:`Split ${A} into ${a.n/10n*10n} and ${a.n%10n}. ${a.n/10n*10n} × ${B} = ${a.n/10n*10n*b.n}; ${a.n%10n} × ${B} = ${a.n%10n*b.n}. Add them: ${R}. So ${p.expression} = ${R}.`;
 }else{
  step=b;question=`Draw ${B} groups. Put ONE counter in each group for the first round. How many counters does that round use altogether?`;explanation=`One in each of ${B} groups uses ${B} counters.`;next=`Keep sharing the ${A} counters equally between all ${B} groups. What is the final amount in each group?`;work=result.d===1n?`Share ${A} counters into ${B} equal groups. Each round uses ${B} counters. ${B} × ${R} = ${A}, so there are ${R} complete rounds. Each group gets ${R}. So ${p.expression} = ${R}.`:`Sharing ${A} equally into ${B} groups gives the fraction ${A}/${B} in each group. Simplify by dividing top and bottom by ${gcd(a.n,b.n)}: ${p.expression} = ${R}.`;
 }
 return {question,step,explanation,next,work};
}
export function mathsGuide(messages){
 const mixed=expressionGuide(messages);if(mixed)return mixed;
 const last=messages.at(-1)?.content||'';
 const bare=/^\s*\d+(?:\s*\/\s*\d+)?[.!?]?\s*$/.test(last);
 let p=bare&&messages.length>1?null:recognise(last);
 const shortFollow=/^\s*\d+(?:\s*\/\s*\d+)?[.!?]?\s*$/.test(last)||/stuck|understand|worked|solution|more hint|don't know|do not know/i.test(last);
 if(!p&&shortFollow){for(let i=messages.length-2;i>=0;i--){if(messages[i].role==='user'&&(p=recognise(messages[i].content)))break;}}
 if(!p)return null;
 // Avoid misleading one-counter prompts for zero arithmetic; use the model instead.
 if(p.a.n===0n||p.b.n===0n)return null;
 const l=lesson(p),previous=messages.at(-2)?.role==='assistant'?messages.at(-2).content:'';
 const worked=wantsWorked(last);
 let reply;
 if(worked)reply=`Let’s work through it together. ${l.work}`;
 else if(/^\s*\d+(?:\s*\/\s*\d+)?[.!?]?\s*$/.test(last)){
  let answer;try{answer=parse(last.trim().replace(/[.!?]$/,''));}catch{return null;}
  if(equal(answer,p.result))reply=`Yes, ${p.expression} = ${fmt(p.result)}. That is the correct final answer!`;
  else if(previous.includes(l.question))reply=equal(answer,l.step)?`Yes, that step is correct. ${l.explanation} ${l.next}`:`Let’s check the small step. ${l.explanation} ${l.next}`;
  else reply=equal(answer,p.result)?`Yes, ${p.expression} = ${fmt(p.result)}. You got it!`:`Not quite. Let’s try a smaller step. ${l.question}`;
 }else if(/hint/i.test(last)&&previous.includes(l.question))reply=`Here is another way to see that step. ${l.explanation} ${l.next}`;
 else{
  const claim=last.match(/=\s*(\d+(?:\s*\/\s*\d+)?)/)||last.match(/\bgot\s+(\d+(?:\s*\/\s*\d+)?)\s+for\b/i);
  let correct=null;
  try{if(claim)correct=equal(parse(claim[1]),p.result);}catch{return null;}
  reply=correct===true?`Yes, that is correct. ${l.work}`:`${correct===false?'Not quite. We need to check the steps. ':''}${l.question}`;
 }
 return {reply,source:'Verified maths guide',model:'verified-arithmetic'};
}
