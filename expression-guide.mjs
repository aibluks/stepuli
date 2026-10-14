// Bounded exact rational expression interpreter. Never executes JavaScript input.
const gcd=(a,b)=>b?gcd(b,a%b):(a<0n?-a:a);
function rat(n,d=1n){if(!d)throw Error('Cannot divide by zero');if(d<0n){n=-n;d=-d;}const g=gcd(n,d);const v={n:n/g,d:d/g};if(`${v.n}`.length>100||`${v.d}`.length>100)throw Error('Expression too large');return v;}
const fmt=v=>v.d===1n?`${v.n}`:`${v.n}/${v.d}`;
const eq=(a,b)=>a.n*b.d===b.n*a.d;
function decimal(s){let sign=1n;if(s.startsWith('-')){sign=-1n;s=s.slice(1);}const [a,b='']=s.split('.');return rat(sign*BigInt(a+b),10n**BigInt(b.length));}
function apply(a,op,b){switch(op){case '+':return rat(a.n*b.d+b.n*a.d,a.d*b.d);case '-':return rat(a.n*b.d-b.n*a.d,a.d*b.d);case '*':return rat(a.n*b.n,a.d*b.d);case '/':return rat(a.n*b.d,a.d*b.n);case '^':if(b.d!==1n||b.n<0n||b.n>6n)throw Error('Use whole-number powers from 0 to 6');return rat(a.n**b.n,a.d**b.n);}}
const display=s=>s.replaceAll('*','×').replaceAll('/','÷').replaceAll('-','−');
export function calculateExpression(source){
 const input=source.replaceAll('²','^2').replaceAll('³','^3').replace(/[×x]/g,'*').replaceAll('÷','/').replaceAll('−','-').replace(/\s/g,'');
 if(input.length>160||/[^\d.+*/^()-]/.test(input))throw Error('Unsupported expression');
 const tokens=input.match(/\d+(?:\.\d+)?|[+*/^()-]/g)||[];
 if(tokens.join('')!==input||tokens.length>64||tokens.some(s=>/^\d/.test(s)&&s.replace('.','').length>7))throw Error('Expression outside supported limits');
 let pos=0,nodes=0;
 function read(min=0){
  if(++nodes>64)throw Error('Expression too complex');
  let left;const t=tokens[pos++];
  if(t==='+'||t==='-'){const child=read(25);left={kind:'sign',sign:t,child};}
  else if(t==='('){left=read();if(tokens[pos++]!==')')throw Error('Missing bracket');left={kind:'bracket',child:left};}
  else if(t&&/^\d/.test(t))left={kind:'number',value:decimal(t),text:t};
  else throw Error('Expected a number');
  while(pos<tokens.length){const op=tokens[pos],power={'+':10,'-':10,'*':20,'/':20,'^':30}[op];if(power===undefined||power<min)break;pos++;left={kind:'operation',op,left,right:read(op==='^'?power:power+1)};}
  return left;
 }
 const tree=read();if(pos!==tokens.length)throw Error('Unexpected input');
 const steps=[],operations=[],values=new Map();let order=0;
 function collect(node,depth=0){
  if(node.kind==='bracket')collect(node.child,depth+1);
  else if(node.kind==='sign')collect(node.child,depth);
  else if(node.kind==='operation'){collect(node.left,depth);operations.push({node,depth,order:order++});collect(node.right,depth);}
 }
 collect(tree);
 function ready(node){
  if(values.has(node))return values.get(node);
  if(node.kind==='number')return {value:node.value,text:node.text};
  if(node.kind==='bracket'){const r=ready(node.child);return r?{...r,text:`(${r.text})`}:null;}
  if(node.kind==='sign'){const r=ready(node.child);if(!r)return null;const value=node.sign==='-'?rat(-r.value.n,r.value.d):r.value;return {value,text:fmt(value)};}
  return null;
 }
 while(operations.length){
  const candidates=operations.filter(o=>ready(o.node.left)&&ready(o.node.right));
  candidates.sort((a,b)=>b.depth-a.depth||({'^':30,'*':20,'/':20,'+':10,'-':10}[b.node.op]-{'^':30,'*':20,'/':20,'+':10,'-':10}[a.node.op])||a.order-b.order);
  if(!candidates.length)throw Error('Invalid dependencies');
  const item=candidates[0],node=item.node,a=ready(node.left),b=ready(node.right),value=apply(a.value,node.op,b.value);
  const part=`${a.text} ${display(node.op)} ${b.text}`;
  const reason=item.depth?'Work inside these brackets.':node.op==='^'?'Evaluate the power.':node.op==='*'||node.op==='/'?'Multiply and divide from left to right.':'Add and subtract from left to right.';
  steps.push({part,result:fmt(value),value,left:a.value,right:b.value,op:node.op,reason,question:`What is ${part}?`});
  values.set(node,{value,text:fmt(value)});operations.splice(operations.indexOf(item),1);
 }
 const result=ready(tree).value;
 return {expression:display(input),result:fmt(result),value:result,steps};
}
export function recogniseExpression(text){
 // A single arithmetic span, no additional numbers in the surrounding sentence.
 const beforeClaim=text.split('=')[0].replaceAll('²','^2').replaceAll('³','^3');
 const spans=[...beforeClaim.matchAll(/[\d(][\d\s.+*x×÷/^()−-]*/g)].filter(m=>/[+*x×÷/^−-]/.test(m[0]));
 if(spans.length!==1)return null;
 const m=spans[0];let candidate=m[0].trim().replace(/[.\s]+$/,'');
 const pre=beforeClaim.slice(0,m.index);if(/[-−]\s*$/.test(pre))candidate='-'+candidate;
 if(/^\d+(?:\s*\/\s*\d+)?\s*[+*x×÷/−-]\s*\d+(?:\s*\/\s*\d+)?$/.test(candidate))return null;
 try{const p=calculateExpression(candidate);if(p.steps.length<2&&!/[()^.]|^-/.test(candidate))return null;return p;}catch{return null;}
}
function claimedValue(text){
 const clean=text.trim().replace(/[!?]$/,'');
 if(/^[−-]?\d+(?:\.\d+)?(?:\s*\/\s*[−-]?\d+)?$/.test(clean)){
  try{const p=calculateExpression(clean);return p.value;}catch{return null;}
 }
 return null;
}
function alternativeHint(s){
 const a=fmt(s.left),b=fmt(s.right);
 const magnitude=v=>fmt(rat(v.n<0n?-v.n:v.n,v.d));
 let why;
 if(s.op==='*')why=s.left.n<0n||s.right.n<0n?'Multiply the magnitudes. Exactly one negative factor gives a negative product; two negative factors give a positive product.':s.left.d>1n||s.right.d>1n?'Multiply the numerators together, then the denominators together. Simplify the result.':`${s.part} means equal groups: think of ${a} groups of ${b}. Add the group size once for each group.`;
 else if(s.op==='/')why=`Use multiplication to check division: the share multiplied by ${b} should give ${a}.`;
 else if(s.op==='-')why=s.right.n<0n?`Subtracting a negative means adding its opposite. Begin at ${a}, then move ${magnitude(s.right)} to the right.`:`Taking away moves left on a number line. Begin at ${a}, then move ${b} to the left.`;
 else if(s.op==='+')why=`Begin at ${a} on a number line and move ${magnitude(s.right)} to the ${s.right.n<0n?'left':'right'}.`;
 else why=`A power tells you how many times to use ${a} as a factor.`;
 return `${why} ${s.question}`;
}
export function wantsWorked(text){
 const negative=/\b(?:do not|don't)\s+(?:give|tell|show|reveal|solve)(?!\s+up\b)\b|\bwithout\s+(?:(?:giving|showing|revealing)\s+)?(?:the\s+)?(?:answer|solution|worked)\b|\b(?:keep|leave)\b.{0,35}\b(?:hidden|for me)\b/i.test(text);
 if(negative)return false;
 const explicit=/worked|whole solution|every step|step.by.step|show.*(?:solution|example|steps)|still.*(?:stuck|understand)|no more hints|finish.*(?:example|solution|calculation)|(?:give|tell|state)(?: me)? (?:the )?(?:final )?answer/i.test(text);
 const onlyHint=/\b(?:only|just|one|tiny|small|useful)\b.{0,25}\bhint\b/i.test(text);
 return explicit&&(!onlyHint||/still.*(?:stuck|understand)|no more hints|show.*every step/i.test(text));
}
export function expressionGuide(messages){
 const last=messages.at(-1)?.content||'',numeric=claimedValue(last);
 let p=numeric&&messages.length>1?null:recogniseExpression(last);
 if(!p&&(numeric||/hint|stuck|understand|worked|solution|example|don't know|do not know/i.test(last))){for(let i=messages.length-2;i>=0;i--)if(messages[i].role==='user'&&(p=recogniseExpression(messages[i].content)))break;}
 if(!p)return null;
 const rule='Work inside brackets first, then powers, then multiplication and division from left to right, then addition and subtraction from left to right.';
 const full=wantsWorked(last);
 const previous=messages.at(-2)?.role==='assistant'?messages.at(-2).content:'';
 let reply;
 if(full){reply=`Let’s work through every step.\n${rule}\n`+p.steps.map((s,i)=>`${i+1}. ${s.part} = ${s.result}`).join('\n')+`\nFinal answer: ${p.expression} = ${p.result}.`;}
 else if(numeric&&eq(numeric,p.value)){reply=`Yes, that is the correct final answer: ${p.expression} = ${p.result}.`;}
 else if(numeric){
  const index=p.steps.findIndex(s=>previous.includes(s.question)||(previous.includes(s.part)&&/what|how many/i.test(previous)&&!previous.includes('Final answer:')));
  if(index>=0){const s=p.steps[index],next=p.steps[index+1];reply=eq(numeric,s.value)?`Yes, that step is correct: ${s.part} = ${s.result}. ${next?`Now use that result. ${next.question}`:`You have finished: ${p.expression} = ${p.result}.`}`:`${next?'Not quite for that small step. ':'Not quite for that last step. '}${next?alternativeHint(s):(s.op==='-'&&s.left.d===1n&&s.right.d===1n&&s.left.n>=0n&&s.right.n>s.left.n?`Start at ${fmt(s.left)}. Taking away ${fmt(s.left)} gets you to zero. How much of the ${fmt(s.right)} still needs taking away?`:`Use an inverse check for this last step. ${s.op==='/'?`What number multiplied by ${fmt(s.right)} gives ${fmt(s.left)}?`:s.op==='-'?`What number added to ${fmt(s.right)} gives ${fmt(s.left)}?`:`Try a number line or split one number into smaller parts. ${s.question}`}`)}`;}
  else reply=eq(numeric,p.value)?`Yes, ${p.result} is correct for ${p.expression}.`:`Not quite. Check the order before combining the numbers. ${p.steps[0].reason} ${p.steps[0].question}`;
 }else if(/hint/i.test(last)&&p.steps.some(s=>previous.includes(s.question))){const s=p.steps.find(s=>previous.includes(s.question));reply=alternativeHint(s);}
 else{
  const claim=last.match(/=\s*([−-]?\d+(?:\.\d+)?(?:\s*\/\s*[−-]?\d+)?)/),value=claim&&claimedValue(claim[1]);
  reply=value&&eq(value,p.value)?`Yes, that answer is correct: ${p.expression} = ${p.result}.`:`${value?'Not quite. Check the order of the operations. ':''}${p.steps[0].reason} ${p.steps[0].question}`;
 }
 return {reply,source:'Verified maths guide',model:'verified-arithmetic'};
}
