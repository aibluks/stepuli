// Exact metric area conversion for checked practice answers. No floating point.
const units=[
 ['mm²',1n,100n,['mm²','mm2','mm^2','square millimetres','square millimeters','square millimetre','square millimeter']],
 ['cm²',1n,1n,['cm²','cm2','cm^2','square centimetres','square centimeters','square centimetre','square centimeter']],
 ['dm²',100n,1n,['dm²','dm2','dm^2','square decimetres','square decimeters','square decimetre','square decimeter']],
 ['m²',10000n,1n,['m²','m2','m^2','square metres','square meters','square metre','square meter']],
 ['km²',10000000000n,1n,['km²','km2','km^2','square kilometres','square kilometers','square kilometre','square kilometer']],
];
const decimal=value=>{const [whole,part='']=value.split('.');return {n:BigInt(whole+part),d:10n**BigInt(part.length)};};
function rational(value){
 const mixed=value.match(/^([+-]?)(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
 if(mixed){const d=BigInt(mixed[4]);return d?{n:(mixed[1]==='-'?-1n:1n)*(BigInt(mixed[2])*d+BigInt(mixed[3])),d}:null;}
 if(!/^[+-]?\d+(?:\.\d+)?(?:\s*\/\s*[+-]?\d+(?:\.\d+)?)?$/.test(value))return null;
 const [a,b={n:1n,d:1n}]=value.split('/').map(v=>decimal(v.trim()));
 return b.n?{n:a.n*b.d,d:a.d*b.n}:null;
}
export function areaInSquareCentimetres(input){
 if(typeof input!=='string'||input.length>160)return null;
 const text=input.trim().toLowerCase().replaceAll('−','-').replace(/[.!?]+$/,'');
 for(const [sourceUnit,n,d,aliases] of units){
  for(const alias of aliases){
   if(!text.endsWith(alias))continue;
   const value=rational(text.slice(0,-alias.length).trim());
   if(!value)continue; // "cm²" also ends in "m²"; the entire number must parse.
   let numerator=value.n*n,denominator=value.d*d;
   if(denominator<0n){numerator=-numerator;denominator=-denominator;}
   let a=numerator<0n?-numerator:numerator,b=denominator;
   while(b){[a,b]=[b,a%b];}
   numerator/=a;denominator/=a;
   return {value:denominator===1n?String(numerator):`${numerator}/${denominator}`,sourceUnit,targetUnit:'cm²'};
  }
 }
 return null;
}
