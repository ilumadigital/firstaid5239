'use strict';
const httpsUrl='https://api.resend.com/emails/batch';
const clean=(v,max=200)=>typeof v==='string'?v.trim().slice(0,max):'';
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isEmail=e=>e.length<=254&&/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(e)&&!/[^\x20-\x7e]/.test(e);
const hasNewline=s=>/[\r\n]/.test(s);
const success=(res,status,data)=>res.status(status).json(data);
const valid=(o)=>o&&typeof o==='object'&&!Array.isArray(o);
const htmlLayout=(title,body)=>'<!doctype html><html lang="el"><head><meta charset="utf-8"></head><body style="margin:0;background:#f4f6f6;font:15px Arial,sans-serif;color:#1a2a36"><div style="max-width:640px;margin:35px auto;background:white;padding:34px;border-top:5px solid #ee4748"><h1 style="color:#172633;font-size:24px">'+escapeHtml(title)+'</h1>'+body+'<p style="margin-top:32px;border-top:1px solid #ddd;padding-top:18px;font-size:12px;color:#71808b">ΕΝΑΚ – Ελληνική Ναυαγοσωστική Ακαδημία<br>Μαντζαγριωτάκη 72, Καλλιθέα | 210 9575 470 | info@enak.gr</p></div></body></html>';
const line=(label,val)=>'<tr><td style="vertical-align:top;padding:9px;border-bottom:1px solid #eee;color:#71808b;width:34%">'+escapeHtml(label)+'</td><td style="vertical-align:top;padding:9px;border-bottom:1px solid #eee;white-space:pre-wrap;overflow-wrap:anywhere">'+escapeHtml(val||'—')+'</td></tr>';
module.exports=async function contact(req,res){
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Content-Type','application/json; charset=utf-8');
 if(req.method!=='POST'){res.setHeader('Allow','POST');return success(res,405,{ok:false,message:'Επιτρέπεται μόνο POST.'});}
 const origin=req.headers.origin;
 if(origin){try{if(new URL(origin).host!==req.headers.host)return success(res,403,{ok:false,message:'Μη επιτρεπόμενο αίτημα.'});}catch{return success(res,403,{ok:false,message:'Μη επιτρεπόμενο αίτημα.'});}}
 if(!String(req.headers['content-type']||'').toLowerCase().includes('application/json'))return success(res,415,{ok:false,message:'Μη υποστηριζόμενος τύπος δεδομένων.'});
 if(Number(req.headers['content-length']||0)>12000)return success(res,413,{ok:false,message:'Το αίτημα είναι πολύ μεγάλο.'});
 let data=req.body;
 try{if(typeof data==='string')data=JSON.parse(data);}catch{return success(res,400,{ok:false,message:'Μη έγκυρα δεδομένα.'});}
 if(!valid(data))return success(res,400,{ok:false,message:'Μη έγκυρα δεδομένα.'});
 if(JSON.stringify(data).length>12000)return success(res,413,{ok:false,message:'Το αίτημα είναι πολύ μεγάλο.'});
 if(clean(data.website,200))return success(res,200,{ok:true}); // honeypot: do not mail bots
 const fields={company:clean(data.company,140),name:clean(data.name,100),role:clean(data.role,100),email:clean(data.email,254),phone:clean(data.phone,35),city:clean(data.city,100),employees:clean(String(data.employees??''),10),program:clean(data.program,80),message:clean(data.message,2000)};
 if(!fields.company||!fields.name||!isEmail(fields.email)||!fields.phone||fields.phone.length<7||data.privacyAccepted!==true)return success(res,422,{ok:false,message:'Συμπληρώστε επωνυμία, ονοματεπώνυμο, έγκυρο email, τηλέφωνο και αποδοχή ενημέρωσης απορρήτου.'});
 if([fields.email,fields.name,fields.company].some(hasNewline))return success(res,422,{ok:false,message:'Μη έγκυρα στοιχεία επικοινωνίας.'});
 if(fields.employees&&(!/^\d+$/.test(fields.employees)||Number(fields.employees)<1||Number(fields.employees)>1000000))return success(res,422,{ok:false,message:'Μη έγκυρος αριθμός εργαζομένων.'});
 if(!['','Workplace Compliance','Workplace Safety Plus'].includes(fields.program))return success(res,422,{ok:false,message:'Μη έγκυρη επιλογή προγράμματος.'});
 const apiKey=process.env.RESEND_API_KEY;
 const from=process.env.MAIL_FROM;
 const to=process.env.MAIL_TO||'info@enak.gr';
 if(!apiKey||!from)return success(res,503,{ok:false,message:'Η αποστολή email δεν έχει ακόμη ενεργοποιηθεί. Επικοινωνήστε στο info@enak.gr ή 210 9575 470.'});
 const subject='Νέο αίτημα Ν. 5239/2025 | '+fields.company;
 const entries=[['Επωνυμία',fields.company],['Ονοματεπώνυμο',fields.name],['Θέση',fields.role],['Email',fields.email],['Τηλέφωνο',fields.phone],['Πόλη',fields.city],['Εργαζόμενοι / εγκατάσταση',fields.employees],['Πρόγραμμα',fields.program],['Σχόλια',fields.message]];
 const adminBody='<p>Νέο αίτημα προσφοράς από το <strong>firstaid5239.gr</strong>.</p><table style="width:100%;border-collapse:collapse">'+entries.map(([k,v])=>line(k,v)).join('')+'</table><p style="font-size:12px;color:#72828b">Ο αποστολέας ενημερώθηκε για την Πολιτική Απορρήτου. Απαντήστε στο email του ενδιαφερόμενου.</p>';
 const adminText='Νέο αίτημα από firstaid5239.gr\n\n'+entries.map(([k,v])=>k+': '+(v||'—')).join('\n');
 const clientBody='<p>Αγαπητέ/ή <strong>'+escapeHtml(fields.name)+'</strong>,</p><p>Σας ευχαριστούμε για την επικοινωνία σας με την ΕΝΑΚ και το ενδιαφέρον σας για εκπαίδευση ΚΑΡΠΑ και λαβής Χάιμλιχ σύμφωνα με τον Ν. 5239/2025.</p><p>Το αίτημά σας για την επιχείρηση <strong>'+escapeHtml(fields.company)+'</strong> έχει καταχωριστεί και θα το εξετάσουμε για να επικοινωνήσουμε μαζί σας.</p><p>Για άμεση επικοινωνία: <a href="tel:+302109575470">210 9575 470</a> ή <a href="mailto:info@enak.gr">info@enak.gr</a>.</p><p>Με εκτίμηση,<br><strong>Η ομάδα της ΕΝΑΚ</strong></p>';
 const clientText='Αγαπητέ/ή '+fields.name+',\n\nΣας ευχαριστούμε για την επικοινωνία με την ΕΝΑΚ σχετικά με τον Ν. 5239/2025. Το αίτημά σας για '+fields.company+' έχει καταχωριστεί. Θα επικοινωνήσουμε μαζί σας.\n\nΕΝΑΚ | 210 9575 470 | info@enak.gr';
 const emails=[
  {from,to:[to],reply_to:fields.email,subject,html:htmlLayout('Νέο αίτημα εκπαίδευσης',adminBody),text:adminText},
  {from,to:[fields.email],reply_to:to,subject:'Επιβεβαίωση αιτήματος | ΕΝΑΚ – Ν. 5239/2025',html:htmlLayout('Σας ευχαριστούμε για την επικοινωνία σας',clientBody),text:clientText}
 ];
 try{
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),12000);
  let response;
  try{response=await fetch(httpsUrl,{method:'POST',headers:{Authorization:'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify(emails),signal:controller.signal});}finally{clearTimeout(timer);}
  if(!response.ok){console.error('Email provider request rejected, status:',response.status);return success(res,502,{ok:false,message:'Δεν ολοκληρώθηκε η αποστολή. Επικοινωνήστε στο info@enak.gr ή δοκιμάστε ξανά.'});}
  const receipt=await response.json().catch(()=>({}));
  if(!Array.isArray(receipt.data)||receipt.data.length!==2||!receipt.data.every(x=>x.id)){console.error('Email provider incomplete acknowledgment');return success(res,502,{ok:false,message:'Δεν επιβεβαιώθηκε η αποστολή δύο email. Επικοινωνήστε με την ΕΝΑΚ.'});}
  return success(res,200,{ok:true,message:'Το αίτημα έγινε αποδεκτό για αποστολή.'});
 }catch(err){console.error('Email provider unavailable:',err.name);return success(res,502,{ok:false,message:'Προσωρινό πρόβλημα αποστολής. Επικοινωνήστε στο info@enak.gr.'});}
};
