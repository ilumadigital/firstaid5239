(() => {
'use strict';
const $=id=>document.getElementById(id);
const menu=$('menu-button'),mobile=$('mobile-nav');
if(menu&&mobile){
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));menu.setAttribute('aria-label',open?'Άνοιγμα μενού':'Κλείσιμο μενού');mobile.hidden=open;});
 mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobile.hidden=true;menu.setAttribute('aria-expanded','false');}));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){mobile.hidden=true;menu.setAttribute('aria-expanded','false');}});
}
const calc=$('calculator-form'),calcResult=$('calculator-result'),count=$('employee-count');
function updateCalc(){
 const n=Number(count?.value);
 if(!Number.isSafeInteger(n)||n<1||n>1000000){calcResult.innerHTML='<strong>Ελέγξτε τον αριθμό</strong><span>Δώστε έναν ακέραιο αριθμό από 1 έως 1.000.000.</span>';return;}
 if(n<=50){
  calcResult.innerHTML='<strong>Υλικό Υπουργείου</strong><span>Για '+n.toLocaleString('el-GR')+' εργαζομένους ανά εγκατάσταση, το άρθρο 39 προβλέπει δωρεάν εκπαιδευτικά βίντεο και υλικό του Υπουργείου Εργασίας.</span>';
 } else {
  const min=Math.ceil(n/2);
  calcResult.innerHTML='<strong>'+min.toLocaleString('el-GR')+' εργαζόμενοι</strong><span>Ενδεικτικό ελάχιστο 50% των '+n.toLocaleString('el-GR')+' εργαζομένων. Μαθήματα μέσω πιστοποιημένου φορέα τουλάχιστον ανά τριετία.</span>';
 }
}
if(calc){calc.addEventListener('submit',e=>{e.preventDefault();updateCalc();});count.addEventListener('input',updateCalc);updateCalc();}
document.querySelectorAll('[data-program]').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('select[name="program"]').forEach(select=>{select.value=link.dataset.program;});}));
// Both lead forms use the private PHP endpoint and independently verified Turnstile tokens.
const leadForms=[...document.querySelectorAll('form[data-lead-form]')];
const widgets=new Map();
const statuses=new Map();
function showFormMessage(form,message,isError=true){
 const status=statuses.get(form);
 if(!status)return;
 status.classList.toggle('error',isError);
 status.textContent=message;
}
async function loadTurnstile(){
 const res=await fetch('/api/config.php',{headers:{Accept:'application/json'},cache:'no-store',credentials:'same-origin'});
 const config=await res.json().catch(()=>({}));
 if(!res.ok||!config.ok||!config.turnstileSiteKey)throw new Error(config.message||'Δεν φορτώθηκε ο έλεγχος ασφαλείας.');
 await new Promise((resolve,reject)=>{
  if(window.turnstile){resolve();return;}
  const script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;
  script.onload=()=>window.turnstile?resolve():reject(new Error('Δεν φορτώθηκε το Turnstile.'));
  script.onerror=()=>reject(new Error('Δεν ήταν δυνατή η φόρτωση του Turnstile.'));
  document.head.appendChild(script);
 });
 for(const form of leadForms){
  const holder=document.createElement('div');
  holder.className='turnstile-container';
  holder.setAttribute('aria-label','Έλεγχος ασφαλείας Cloudflare Turnstile');
  const consent=form.querySelector('.privacy-consent');
  if(!consent)throw new Error('Η φόρμα δεν είναι πλήρης.');
  consent.before(holder);
  const id=window.turnstile.render(holder,{
   sitekey:config.turnstileSiteKey,
   theme:'auto',
   'expired-callback':()=>showFormMessage(form,'Ο έλεγχος ασφαλείας έληξε. Επαληθεύστε ξανά.'),
   'error-callback':()=>showFormMessage(form,'Δεν ολοκληρώθηκε ο έλεγχος ασφαλείας. Δοκιμάστε ξανά.')
  });
  if(id===undefined)throw new Error('Δεν ενεργοποιήθηκε το Turnstile.');
  widgets.set(form,id);
 }
}
if(leadForms.length){
 for(const form of leadForms){
  const status=form.querySelector('[data-form-status]');
  const button=form.querySelector('[data-form-submit]');
  const label=button?.querySelector('span');
  const initialLabel=label?.textContent||'Αποστολή αιτήματος';
  const stamp=form.querySelector('input[name="startedAt"]');
  const consent=form.querySelector('input[name="privacyAccepted"]');
  statuses.set(form,status);
  if(stamp)stamp.value=String(Date.now());
  if(button)button.disabled=true;
  form.addEventListener('submit',async e=>{
   e.preventDefault();
   if(!status||!button)return;
   showFormMessage(form,'',false);
   if(!form.reportValidity())return;
   if(consent?.checked!==true){
    showFormMessage(form,'Παρακαλούμε επιβεβαιώστε ότι διαβάσατε την Πολιτική Απορρήτου.');
    return;
   }
   const widgetId=widgets.get(form);
   const token=widgetId!==undefined&&window.turnstile?window.turnstile.getResponse(widgetId):'';
   if(!token){
    showFormMessage(form,'Παρακαλούμε ολοκληρώστε τον έλεγχο ασφαλείας Turnstile.');
    return;
   }
   const fields=Object.fromEntries(new FormData(form).entries());
   fields.privacyAccepted=true;
   fields['cf-turnstile-response']=token;
   button.disabled=true;
   if(label)label.textContent='Γίνεται αποστολή…';
   form.setAttribute('aria-busy','true');
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),23000);
   try{
    const response=await fetch('/api/contact.php',{
     method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},
     body:JSON.stringify(fields),signal:controller.signal,credentials:'same-origin'
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok||!result.ok)throw new Error(result.message||'Δεν ολοκληρώθηκε η αποστολή. Καλέστε στο 210 9575 470.');
    showFormMessage(form,'Ευχαριστούμε! Το αίτημα στάλθηκε στην ΕΝΑΚ και έγινε αποδεκτή η αποστολή επιβεβαίωσης στο email σας.',false);
    form.reset();
    if(stamp)stamp.value=String(Date.now());
    status.scrollIntoView({block:'nearest',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
   }catch(err){
    showFormMessage(form,err.name==='AbortError'
     ?'Η αποστολή καθυστέρησε. Επικοινωνήστε στο info@enak.gr πριν υποβάλετε ξανά.'
     :(err.message||'Αποτυχία αποστολής. Δοκιμάστε ξανά.'));
   }finally{
    clearTimeout(timeout);
    if(widgetId!==undefined&&window.turnstile)window.turnstile.reset(widgetId);
    button.disabled=false;
    if(label)label.textContent=initialLabel;
    form.removeAttribute('aria-busy');
   }
  });
 }
 loadTurnstile().then(()=>{
  leadForms.forEach(form=>{const button=form.querySelector('[data-form-submit]');if(button)button.disabled=false;});
 }).catch(err=>{
  leadForms.forEach(form=>showFormMessage(form,err.message||'Η ασφάλεια της φόρμας δεν είναι διαθέσιμη.'));
 });
}
})();
