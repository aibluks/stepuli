import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,dirname} from 'node:path';
import {mathsGuide} from './maths-guide.mjs';
import {lessonGuide} from './lesson-guide.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||3000);
const upstream=new URL(process.env.MODEL_API_URL||'http://127.0.0.1:8080');
if(!['127.0.0.1','localhost','[::1]'].includes(upstream.hostname)||upstream.protocol!=='http:') throw Error('The model API must be on loopback HTTP.');
const modelId=process.env.MODEL_ID||'';
const system=await readFile(join(root,process.env.TUTOR_PROMPT_FILE||'tutor-prompt.txt'),'utf8');
const hosts=new Set([`127.0.0.1:${port}`,`localhost:${port}`]);
let busy=false;
const headers={'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
function json(res,status,data){res.writeHead(status,headers);res.end(JSON.stringify(data));}
export function validateMessages(messages){
  return Array.isArray(messages)&&messages.length>0&&messages.length<=24&&messages.at(-1)?.role==='user'&&messages.every(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string'&&m.content.trim().length>0&&m.content.length<=3000)&&messages.reduce((n,m)=>n+m.content.length,0)<=18000;
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const files={'/':'index.html','/app.js':'app.js','/lessons.js':'lessons.js','/word-lessons.js':'word-lessons.js','/area-units.js':'area-units.js','/styles.css':'styles.css','/icon.svg':'icon.svg','/manifest.webmanifest':'manifest.webmanifest','/sw.js':'sw.js'};
export const server=http.createServer(async(req,res)=>{
  if(!hosts.has(req.headers.host)){json(res,403,{error:'Use localhost to open this app.'});return;}
  if(req.headers.origin&&![...hosts].some(host=>req.headers.origin===`http://${host}`)){json(res,403,{error:'Origin not allowed.'});return;}
  const path=new URL(req.url,'http://localhost').pathname;
  if(path==='/api/status'&&req.method==='GET'){
    try{const response=await fetch(new URL('/v1/models',upstream),{signal:AbortSignal.timeout(3000)});if(!response.ok)throw Error();const data=await response.json();const selected=modelId?data.data?.find(m=>m.id===modelId):data.data?.[0];json(res,200,{connected:!!selected,model:selected?.id||null,api:upstream.origin});}
    catch{json(res,200,{connected:false,model:null,api:upstream.origin});}return;
  }
  if(path==='/api/chat'&&req.method==='POST'){
    if(!req.headers['content-type']?.startsWith('application/json'))return json(res,415,{error:'JSON required.'});
    if(busy)return json(res,429,{error:'The tutor is answering another question. Please try again shortly.'});
    let raw='',ownsSlot=false;
    try{
      for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>100000){json(res,413,{error:'Conversation too long. Start a new lesson.'});return;}}
      const data=JSON.parse(raw);if(!validateMessages(data.messages))return json(res,400,{error:'Please send a shorter question or start a new lesson.'});
      const guide=lessonGuide(data.messages)||mathsGuide(data.messages);if(guide)return json(res,200,guide);
      if(busy)return json(res,429,{error:'The tutor is answering another question. Please try again shortly.'});
      busy=true;ownsSlot=true;
      const response=await fetch(new URL('/v1/chat/completions',upstream),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...modelId?{model:modelId}:{},messages:[{role:'system',content:system},...data.messages],temperature:0.35,max_tokens:512,reasoning_effort:'none',stream:false,chat_template_kwargs:{enable_thinking:false}}),signal:AbortSignal.timeout(180000)});
      if(!response.ok)throw Error('Model server rejected the request. Check its terminal.');
      const result=await response.json();const reply=result.choices?.[0]?.message?.content;
      if(typeof reply!=='string'||!reply.trim())throw Error('The model did not return an answer. Try a shorter question.');
      json(res,200,{reply,model:result.model||'Local Gemma',usage:result.usage});
    }catch(e){json(res,e instanceof SyntaxError?400:503,{error:e instanceof SyntaxError?'Invalid request.':'The local model is unavailable or could not finish. Check Settings and try again.'});}
    finally{if(ownsSlot)busy=false;}return;
  }
  if(req.method!=='GET'||!files[path])return json(res,404,{error:'Not found.'});
  const file=files[path];const ext=file.slice(file.lastIndexOf('.'));
  res.writeHead(200,{'Content-Type':mime[ext]||'text/plain','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});res.end(await readFile(join(root,'public',file)));
});
if(process.argv[1]===fileURLToPath(import.meta.url))server.listen(port,'127.0.0.1',()=>console.log(`Little Steps: http://127.0.0.1:${port}\nModel API: ${upstream.origin}\nLocal only. Ctrl+C to stop.`));
