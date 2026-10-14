import {wordLessons} from './word-lessons.js';
export const mathsLessons=[
 {id:'mixed',topic:'Order of operations',title:'Which part comes first?',items:[
  {q:'3 + 5 − 6 × 4 ÷ 2',focus:'6 × 4 ÷ 2',a:'-4',h:['Multiplication and division come before addition and subtraction. Start with 6 × 4. What is that product?','Use the product of 6 × 4, then divide it by 2. Keep 3 + 5 for the next part.'],steps:['6 × 4 = 24','24 ÷ 2 = 12','3 + 5 = 8','8 − 12 = −4'],rule:'Multiply and divide from left to right, then add and subtract from left to right.'},
  {q:'10 + 2 × 9 − 12 ÷ 3',a:'24',h:['Find 2 × 9 and 12 ÷ 3 before adding or subtracting. What is 2 × 9?'],steps:['2 × 9 = 18','12 ÷ 3 = 4','10 + 18 = 28','28 − 4 = 24'],rule:'Multiplication and division have the same priority.'}]},
 {id:'addition',topic:'Addition',title:'Put the groups together',items:[
  {q:'2 + 2',a:'4',counters:true,h:['Start with two counters. Count on once for each of the other two counters.','Touch each counter once, saying the next number each time.'],steps:['Start at 2.','Count on: 3, then 4.','2 + 2 = 4'],rule:'Addition joins quantities.'},
  {q:'27 + 18',a:'45',h:['Split 18 into 10 and 8. What is 27 + 10?'],steps:['18 = 10 + 8','27 + 10 = 37','37 + 8 = 45'],rule:'Use small parts and keep a running total.'}]},
 {id:'subtraction',topic:'Subtraction',title:'Take it away in small steps',items:[
  {q:'52 − 28',a:'24',h:['Split the amount to take away, 28, into 20 and 8. What is 52 − 20?'],steps:['28 = 20 + 8','52 − 20 = 32','32 − 8 = 24'],rule:'Subtract both parts from the starting amount.'},
  {q:'700 − 368',a:'332',h:['Take away 300 first. What is 700 − 300?'],steps:['368 = 300 + 60 + 8','700 − 300 = 400','400 − 60 = 340','340 − 8 = 332'],rule:'Split the amount you take away, then subtract each part.'}]},
 {id:'multiplication',topic:'Multiplication',title:'Think in equal groups',items:[
  {q:'3 × 7',a:'21',h:['Three groups of seven means 7 + 7 + 7. Start with the first two groups. What is 7 + 7?'],steps:['7 + 7 = 14','14 + 7 = 21','3 × 7 = 21'],rule:'Multiplication counts equal groups.'},
  {q:'24 × 6',a:'144',h:['Split 24 into 20 and 4. What is 20 × 6?'],steps:['20 × 6 = 120','4 × 6 = 24','120 + 24 = 144'],rule:'Multiply both parts, then add the products.'}]},
 {id:'division',topic:'Division',title:'Share equally',items:[
  {q:'84 ÷ 6',a:'14',remainderCheck:true,h:['Try ten groups of six first. How much does 6 × 10 use?','After ten groups use 60, there are 24 left. How many more groups of six make 24?'],steps:['6 × 10 = 60','84 − 60 = 24','24 ÷ 6 = 4','10 + 4 = 14','Check: 6 × 14 = 84'],rule:'A remainder must be smaller than the divisor. If it makes another full group, add that group to the quotient.'},
  {q:'84 ÷ 7',a:'12',h:['Try ten in each of seven groups first. How many items does 7 × 10 use?'],steps:['7 × 10 = 70','84 − 70 = 14','14 ÷ 7 = 2','10 + 2 = 12','Check: 7 × 12 = 84'],rule:'Every group gets the same share, and all items are used.'},
  {q:'156 ÷ 12',a:'13',h:['Find 12 × 10 first. How much of 156 does that use?'],steps:['12 × 10 = 120','156 − 120 = 36','36 ÷ 12 = 3','10 + 3 = 13','Check: 12 × 13 = 156'],rule:'Check division by multiplying the answer by the divisor.'}]},
 {id:'fractions',topic:'Fractions',title:'Make the pieces the same size',items:[
  {q:'3/4 + 1/8',a:'7/8',fractionBars:true,h:['Make both fractions use eighths. Each quarter is two eighths. How many eighths are three quarters?','Three quarters is six eighths. Add one more eighth and keep the pieces as eighths. What is 6 + 1?'],steps:['3/4 = 6/8','6/8 + 1/8 = 7/8'],rule:'Addition joins equal-sized pieces. Match the denominators; do not add the bottom numbers.'},
  {q:'5/6 − 1/3',focus:'1/3',a:'1/2',h:['Change one third into sixths by multiplying top and bottom by two. What is 1 × 2?','One third is two sixths. Subtract the top numbers, keeping the bottom six.'],steps:['1/3 = 2/6','5/6 − 2/6 = 3/6','3/6 = 1/2'],rule:'For addition and subtraction, match the denominators first.'},
  {q:'3/4 ÷ 1/2',calculation:'(3/4)/(1/2)',a:'3/2',h:['Keep 3/4. Swap the top and bottom of the second fraction. What is the reciprocal of 1/2?'],steps:['The reciprocal of 1/2 is 2/1.','3/4 × 2/1 = 6/4','6/4 = 3/2'],rule:'To divide by a fraction, multiply by its reciprocal.'}]},
 {id:'decimals',topic:'Decimals',title:'Keep track of place value',items:[
  {q:'0.7 + 0.45',a:'1.15',h:['Write 0.7 as 0.70 so hundredths line up. What is 70 + 45?'],steps:['0.7 = 0.70','70 hundredths + 45 hundredths = 115 hundredths','115 hundredths = 1.15'],rule:'Line up the decimal points when adding or subtracting.'},
  {q:'2.4 ÷ 0.15',a:'16',h:['Multiply BOTH numbers by 100. What calculation does that give?'],steps:['2.4 ÷ 0.15 = 240 ÷ 15','15 × 16 = 240','240 ÷ 15 = 16'],rule:'Scaling the dividend and divisor by the same amount keeps the quotient equal.'}]},
 {id:'brackets',topic:'Brackets and powers',title:'Start inside the brackets',items:[
  {q:'(8 − 3) × 2²',a:'20',h:['First work inside the brackets. What is 8 − 3?'],steps:['8 − 3 = 5','2² = 2 × 2 = 4','5 × 4 = 20'],rule:'Brackets first, then powers, then multiplication/division, then addition/subtraction.'},
  {q:'−3 − (−8) + 2',a:'7',h:['Subtracting a negative means adding its opposite. What does −3 − (−8) become?'],steps:['−3 − (−8) = −3 + 8','−3 + 8 = 5','5 + 2 = 7'],rule:'Subtracting a negative moves right on a number line.'}]}
 ,...wordLessons
];
// Numeric equivalence for practice answers only: integer, finite decimal or fraction.
export function sameAnswer(input,expected){
 const parse=s=>{s=s.trim().toLowerCase().replaceAll('−','-');const words=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];if(words.includes(s))s=String(words.indexOf(s));const mixed=s.match(/^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);if(mixed){const den=BigInt(mixed[4]);if(!den)return null;return {n:(mixed[1]==='-'?-1n:1n)*(BigInt(mixed[2])*den+BigInt(mixed[3])),d:den};}if(!/^[+-]?\d+(?:\.\d+)?(?:\s*\/\s*[+-]?\d+(?:\.\d+)?)?$/.test(s)||s.length>80)return null;const parts=s.split('/').map(v=>{const [whole,decimal='']=v.trim().split('.');return {n:BigInt(whole+decimal),d:10n**BigInt(decimal.length)};});const [a,b={n:1n,d:1n}]=parts;if(b.n===0n)return null;return {n:a.n*b.d,d:a.d*b.n};};
 try{const a=parse(input),b=parse(expected);return !!a&&!!b&&a.n*b.d===b.n*a.d;}catch{return false;}
}
