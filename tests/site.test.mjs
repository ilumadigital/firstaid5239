import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import handler from '../api/contact.cjs';

const fakeRes=()=>({code:200,headers:{},setHeader(k,v){this.headers[k]=v;return this;},status(v){this.code=v;return this;},json(v){this.payload=v;return this;}});
const payload={company:'Acme ΕΠΕ',name:'Δοκιμή',email:'person@example.com',phone:'2109575470',privacyAccepted:true,website:'',employees:'75',program:'Workplace Compliance'};
const send=async (data,headers={})=>{const res=fakeRes();await handler({method:'POST',headers:{'content-type':'application/json',host:'localhost:3000',...headers},body:data},res);return res;};

test('generated static HTML matches FAQs and schema',async()=>{
 const html=await readFile('dist/index.html','utf8');
 const faqs=JSON.parse(await readFile('src/questions.json','utf8'));
 const structured=html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
 assert.ok(structured,'JSON-LD exists');
 const json=JSON.parse(structured[1]);
 assert.equal(json['@graph'].find(n=>n['@type']==='FAQPage').mainEntity.length,faqs.length);
 assert.equal((html.match(/class="faq-item"/g)||[]).length,faqs.length);
 for(const path of ['dist/styles.css','dist/sections.css','dist/mobile.css','dist/script.js','dist/robots.txt','dist/sitemap.xml','dist/llms.txt','dist/llms-full.txt','dist/faq.md','dist/privacy.html','dist/hero-art.svg'])assert.ok((await readFile(path)).length>20,path);
 for(const name of ['company','name','email','phone','privacyAccepted','startedAt'])assert.ok(html.includes('name="'+name+'"'),name);
 assert.ok(html.includes('https://firstaid5239.gr/'));
 assert.ok(html.includes('Συχνές'));
 assert.ok(!html.includes('<!--FAQ_ITEMS-->'));
});

test('rejects wrong methods and invalid fields',async()=>{
 const res=fakeRes();await handler({method:'GET',headers:{}},res);assert.equal(res.code,405);
 const invalid=await send({...payload,email:'invalid'});assert.equal(invalid.code,422);
 const noconsent=await send({...payload,privacyAccepted:false});assert.equal(noconsent.code,422);
 const spoof=await send(payload,{origin:'https://malicious.example'});assert.equal(spoof.code,403);
});

test('does not claim success when email service unconfigured',async()=>{
 const oldKey=process.env.RESEND_API_KEY,oldFrom=process.env.MAIL_FROM;
 delete process.env.RESEND_API_KEY;delete process.env.MAIL_FROM;
 try{const res=await send(payload);assert.equal(res.code,503);assert.equal(res.payload.ok,false);}
 finally{if(oldKey!==undefined)process.env.RESEND_API_KEY=oldKey;if(oldFrom!==undefined)process.env.MAIL_FROM=oldFrom;}
});

test('accepted batch consists of separate ENAK and customer emails',async()=>{
 const oldKey=process.env.RESEND_API_KEY,oldFrom=process.env.MAIL_FROM,oldTo=process.env.MAIL_TO,oldFetch=global.fetch;
 process.env.RESEND_API_KEY='re_test';process.env.MAIL_FROM='ENAK <no-reply@firstaid5239.gr>';process.env.MAIL_TO='info@enak.gr';
 let sent;
 global.fetch=async(url,init)=>{assert.equal(url,'https://api.resend.com/emails/batch');sent=JSON.parse(init.body);return{ok:true,json:async()=>({data:[{id:'email-one'},{id:'email-two'}]})};};
 try{
  const res=await send({...payload,company:'Acme <script>alert(1)</script>'});
  assert.equal(res.code,200);assert.equal(res.payload.ok,true);
  assert.equal(sent.length,2);assert.deepEqual(sent[0].to,['info@enak.gr']);assert.deepEqual(sent[1].to,['person@example.com']);
  assert.ok(!sent[0].html.includes('<script>alert(1)</script>'));
  assert.ok(sent[1].html.includes('Σας ευχαριστούμε'));
 }finally{global.fetch=oldFetch;for(const [key,val] of Object.entries({RESEND_API_KEY:oldKey,MAIL_FROM:oldFrom,MAIL_TO:oldTo})){if(val===undefined)delete process.env[key];else process.env[key]=val;}}
});

test('mail provider rejection returns an error',async()=>{
 const oldKey=process.env.RESEND_API_KEY,oldFrom=process.env.MAIL_FROM,oldFetch=global.fetch;
 process.env.RESEND_API_KEY='re_test';process.env.MAIL_FROM='noreply@firstaid5239.gr';
 global.fetch=async()=>({ok:false,status:403});
 try{const res=await send(payload);assert.equal(res.code,502);assert.equal(res.payload.ok,false);}
 finally{global.fetch=oldFetch;if(oldKey===undefined)delete process.env.RESEND_API_KEY;else process.env.RESEND_API_KEY=oldKey;if(oldFrom===undefined)delete process.env.MAIL_FROM;else process.env.MAIL_FROM=oldFrom;}
});
