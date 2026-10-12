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
document.querySelectorAll('[data-program]').forEach(link=>link.addEventListener('click',()=>{const select=$('program');if(select)select.value=link.dataset.program;}));
const form=$('contact-form'),status=$('form-status'),button=$('submit-button');
const stamp=$('started-at');if(stamp)stamp.value=String(Date.now());
if(form){
 form.addEventListener('submit',async e=>{
  e.preventDefault();
  status.textContent='';status.classList.remove('error');
  if(!form.reportValidity())return;
  const fields=Object.fromEntries(new FormData(form).entries());
  fields.privacyAccepted=$('privacyAccepted')?.checked===true;
  if(!fields.privacyAccepted){status.classList.add('error');status.textContent='Απαιτείται ενημέρωση για την Πολιτική Απορρήτου.';return;}
  button.disabled=true;button.querySelector('span').textContent='Γίνεται αποστολή…';form.setAttribute('aria-busy','true');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
  try{
   const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(fields),signal:controller.signal,credentials:'same-origin'});
   const result=await response.json().catch(()=>({}));
   if(!response.ok||!result.ok)throw new Error(result.message||'Δεν ήταν δυνατή η αποστολή. Δοκιμάστε ξανά ή καλέστε στο 210 9575 470.');
   status.textContent='Το αίτημά σας καταχωρίστηκε για αποστολή. Στείλαμε ενημέρωση στην ΕΝΑΚ και επιβεβαίωση στο email σας. Ελέγξτε και τα ανεπιθύμητα.';
   form.reset();if(stamp)stamp.value=String(Date.now());
   status.scrollIntoView({block:'nearest',behavior:'smooth'});
  }catch(err){
   status.classList.add('error');
   status.textContent=err.name==='AbortError'?'Η αποστολή καθυστέρησε. Επικοινωνήστε στο info@enak.gr για επιβεβαίωση πριν υποβάλετε ξανά.':(err.message||'Αποτυχία αποστολής. Δοκιμάστε ξανά.');
  }finally{clearTimeout(timeout);button.disabled=false;button.querySelector('span').textContent='Αποστολή αιτήματος';form.removeAttribute('aria-busy');}
 });
}
})();