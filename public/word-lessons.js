import {areaInSquareCentimetres} from './area-units.js';
// Checked practice content; separate from raw Gemma responses and test benchmarks.
const stage=(calculation,expected,question,explain,hint,unit='')=>({calculation,expected,question,explain,hint,unit});
const item=(q,a,unit,rule,stages)=>({q,a,unit,rule,stages,wordProblem:true,
 h:[stages[0].question,stages[0].hint],
 steps:stages.map(s=>`${s.explain} ${s.calculation} = ${s.expected}${s.unit?' '+s.unit:''}.`)});
export const wordLessons=[
 {id:'percentages',topic:'Percentages',title:'Find the part, then the new price',items:[
  item('A bag costs 150 coins and has 20% off. What is its sale price?','120','coins','A discount is taken away from the original price.',[
   stage('150 ÷ 100','1.5','First find 1% of 150 coins. What is 150 ÷ 100?','Find one hundredth of the price.','10% is 15 coins. Divide that by 10 to find 1%. What is 15 ÷ 10?','coins'),
   stage('1.5 × 20','30','Now find the 20% discount. What is 1.5 × 20?','Multiply one percent by twenty.','Think of twenty groups of 1.5 coins. What do they total?','coins'),
   stage('150 − 30','120','Take the discount away from the price. What is 150 − 30?','Subtract the discount.','Take away three tens from fifteen tens. How many coins remain?','coins')]),
  item('A price of 80 coins increases by 10%. What is the new price?','88','coins','An increase is added to the original price.',[
   stage('80 ÷ 10','8','Find the 10% increase first. What is 80 ÷ 10?','Ten percent is one tenth.','Split 80 coins into ten equal groups. How many are in each?','coins'),
   stage('80 + 8','88','Add the increase to the original price. What is 80 + 8?','Add the increase.','Start at 80 and count on another eight coins. Where do you finish?','coins')])]},
 {id:'ratios',topic:'Sharing in a ratio',title:'Count the equal parts',items:[
  item('Share 63 counters in the ratio 2:7. How many counters go in the first share?','14','counters','The ratio counts equal-sized parts; the first share gets two parts.',[
   stage('2 + 7','9','Count all the ratio parts first. What is 2 + 7?','Count all the equal parts.','Draw two boxes for the first share and seven for the second. How many boxes altogether?','parts'),
   stage('63 ÷ 9','7','Share the 63 counters across nine equal parts. What is 63 ÷ 9?','Find the size of one part.','Nine times what number uses all 63 counters?','counters'),
   stage('2 × 7','14','The first share gets two parts. What is 2 × 7?','Take two of the equal parts.','Add the size of one part to itself. How many counters is that?','counters')]),
  item('Share 55 counters in the ratio 3:8. How many counters go in the first share?','15','counters','First find one equal part, then count three parts.',[
   stage('3 + 8','11','How many parts are there altogether? Work out 3 + 8.','Count all the parts.','Draw three boxes and eight more boxes. How many altogether?','parts'),
   stage('55 ÷ 11','5','What is 55 ÷ 11? This finds one equal part.','Find one part.','Eleven groups of what number total 55?','counters'),
   stage('3 × 5','15','The first share gets three parts. What is 3 × 5?','Take three parts.','Add 5 three times. What is the total?','counters')])]},
 {id:'angles',topic:'Triangle angles',title:'Use the whole triangle',items:[
  item('Two angles inside a triangle are 42° and 73°. What is the third angle?','65','degrees','The three interior angles of a triangle total 180°.',[
   stage('42 + 73','115','First add the two known angles. What is 42 + 73?','Find the known angle total.','Split 73 into 70 and 3. Add both parts to 42. What is the total?','degrees'),
   stage('180 − 115','65','Subtract that total from 180°. What is 180 − 115?','Find the missing part of 180°.','Take away 100 first, then another 15. What remains?','degrees')]),
  item('Two angles inside a triangle are 58° and 67°. What is the third angle?','55','degrees','Use the angle total of 180°.',[
   stage('58 + 67','125','First find 58 + 67. What do you get?','Add the known angles.','Add 60 to 58, then add the remaining 7. What is the total?','degrees'),
   stage('180 − 125','55','What is 180 − 125?','Subtract from the whole triangle.','Subtract 100, then subtract 25. What remains?','degrees')])]},
 {id:'surface',topic:'Surface area',title:'Count every face',items:[
  item('A cube has side length 3 cm. What is its total surface area in cm²?','54','cm²','A cube has six equal square faces.',[
   stage('3 × 3','9','Find the area of one square face. What is 3 × 3?','Multiply side by side.','Draw three rows with three squares in each row. How many unit squares?','cm²'),
   stage('6 × 9','54','There are six faces. What is 6 × 9?','Count all six faces.','Three faces cover 27 square centimetres. Double that to count six. What is the area?','cm²')]),
  item('A closed box is 2 cm by 4 cm by 6 cm. What is its total surface area in cm²?','88','cm²','A rectangular box has three pairs of matching faces.',[
   stage('2 × 4','8','Start with a 2 cm by 4 cm face. What is 2 × 4?','Find the first face area.','Think of two rows of four unit squares. How many?','cm²'),
   stage('2 × 6','12','Now find a 2 cm by 6 cm face. What is 2 × 6?','Find the second face area.','Add six unit squares and another six. What is the area?','cm²'),
   stage('4 × 6','24','Now find a 4 cm by 6 cm face. What is 4 × 6?','Find the third face area.','Double two rows of six to get four rows. How many unit squares?','cm²'),
   stage('8 + 12','20','Start adding the three different face areas. What is 8 + 12?','Combine the first two areas.','Add two to eight to reach ten, then add the other ten. What is the total?','cm²'),
   stage('20 + 24','44','Include the third face area. What is 20 + 24?','Include all three different faces.','Add two tens to 24. What do you get?','cm²'),
   stage('44 × 2','88','Each face has a matching opposite face. What is 44 × 2?','Double to include the opposite faces.','Add 44 and another 44. What is the total surface area?','cm²')])]},
 {id:'data',topic:'Mean and frequency',title:'Count every observation',items:[
  item('Find the mean of 8, 12, 16, and 20.','14','','The mean is the total divided by the number of observations.',[
   stage('8 + 12','20','Start adding the observations. What is 8 + 12?','Add the first two values.','Add two to eight, then add the remaining ten. What is the total?'),
   stage('20 + 16','36','Include the third value. What is 20 + 16?','Include the third observation.','Add ten to twenty, then another six. What is the total?'),
   stage('36 + 20','56','Include the fourth value. What is 36 + 20?','Include the last observation.','Add two tens to 36. What do you get?'),
   stage('56 ÷ 4','14','There are four observations. What is 56 ÷ 4?','Share the total across all four observations.','Four times what number equals 56?')]),
  item('A table has 2 once, 5 twice, and 8 once. What is the mean of all four observations?','5','','A repeated value must be counted each time it appears.',[
   stage('1 + 2 + 1','4','First count the observations. What is 1 + 2 + 1?','Count the frequencies.','Write the list with the repeated value included. How many entries are there?'),
   stage('5 × 2','10','The value 5 appears twice. What is 5 × 2?','Count both copies of five.','Add five and another five. What is their total?'),
   stage('2 + 10 + 8','20','Add all the values, including both fives. What is 2 + 10 + 8?','Find the weighted total.','Add 2 and 8 first, then include the two fives. What is the total?'),
   stage('20 ÷ 4','5','Divide by the four observations. What is 20 ÷ 4?','Find the mean.','Four equal shares must total twenty. How big is each share?')])]},
];
// Whole-problem calculations use the original givens, independently of the
// intermediate result literals in the teaching stages.
const calculations={percentages:['150-(150*20/100)','80+(80*10/100)'],ratios:['63/(2+7)*2','55/(3+8)*3'],angles:['180-(42+73)','180-(58+67)'],surface:['6*(3^2)','2*(2*4+2*6+4*6)'],data:['(8+12+16+20)/4','(2*1+5*2+8*1)/(1+2+1)']};
for(const topic of wordLessons)topic.items.forEach((it,i)=>{it.calculation=calculations[topic.id][i];});
// Practice asks for a number in a stated unit. Other units are a form question,
// not an automatically incorrect mathematical answer.
export function lessonNumber(input,unit=''){
 if(unit==='cm²'){const area=areaInSquareCentimetres(input);if(area)return area.value;}
 let value=input.trim().toLowerCase().replaceAll('−','-').replace(/[.!?]+$/,'');
 const aliases={coins:['coins','coin'],counters:['counters','counter'],parts:['parts','part'],degrees:['degrees','degree','°'],'cm²':['cm²','cm2','square centimetres','square centimeters']};
 for(const suffix of aliases[unit]||[]){if(value.endsWith(suffix)){value=value.slice(0,-suffix.length).trim();break;}}
 const words='zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');
 return words.includes(value)||/^[+-]?\d+(?:\.\d+)?(?:\s*\/\s*[+-]?\d+(?:\.\d+)?)?$/.test(value)||/^[+-]?\d+\s+\d+\s*\/\s*\d+$/.test(value)?value:null;
}
