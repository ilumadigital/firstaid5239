import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import path from 'node:path';
const dir=path.resolve('dist');
const faq=JSON.parse(await readFile('src/questions.json','utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const faqHtml=faq.map(([q,a],i)=>'<details class="faq-item"><summary><span class="faq-n">'+String(i+1).padStart(2,'0')+'</span><span>'+esc(q)+'</span><span class="faq-plus" aria-hidden="true">+</span></summary><p>'+esc(a)+'</p></details>').join('\n');
const org='https://firstaid5239.gr/#organization';
const graph=[
{'@type':'Organization','@id':org,name:'ΕΝΑΚ – Ελληνική Ναυαγοσωστική Ακαδημία',url:'https://enak.gr/',logo:{'@type':'ImageObject',url:'https://firstaid5239.gr/enak-logo.png',width:400,height:400},telephone:'+302109575470',email:'info@enak.gr',address:{'@type':'PostalAddress',streetAddress:'Μαντζαγριωτάκη 72, Πλατεία Δαβάκη',addressLocality:'Καλλιθέα',postalCode:'17672',addressCountry:'GR'},sameAs:['https://enak.gr/first-aid/']},
{'@type':'WebSite','@id':'https://firstaid5239.gr/#website',name:'Firstaid5239.gr | Νόμος 5239/2025',url:'https://firstaid5239.gr/',inLanguage:'el-GR',publisher:{'@id':org}},
{'@type':'WebPage','@id':'https://firstaid5239.gr/#webpage',url:'https://firstaid5239.gr/',name:'Νόμος 5239/2025 – Άρθρο 39: ΚΑΡΠΑ και Χάιμλιχ για Επιχειρήσεις',description:'Αναλυτικός οδηγός για το άρθρο 39 του Ν. 5239/2025 και εκπαίδευση πρώτων βοηθειών εργαζομένων από την ΕΝΑΚ.',inLanguage:'el-GR',isPartOf:{'@id':'https://firstaid5239.gr/#website'},dateModified:'2026-10-12',publisher:{'@id':org}},
{'@type':'Service','@id':'https://firstaid5239.gr/#service',name:'Εκπαίδευση ΚΑΡΠΑ και λαβής Χάιμλιχ για επιχειρήσεις',serviceType:'Εκπαίδευση πρώτων βοηθειών εργαζομένων',provider:{'@id':org},areaServed:{'@type':'Country',name:'Greece'},audience:{'@type':'BusinessAudience',audienceType:'Εργοδότες, HR και HSE'},description:'Προγράμματα εκπαίδευσης ΚΑΡΠΑ και Χάιμλιχ με δυνατότητα υλοποίησης στις εγκαταστάσεις της επιχείρησης.'},
{'@type':'Article','@id':'https://firstaid5239.gr/#law-guide',mainEntityOfPage:{'@id':'https://firstaid5239.gr/#webpage'},headline:'Νόμος 5239/2025 – άρθρο 39: εκπαίδευση ΚΑΡΠΑ και Χάιμλιχ',inLanguage:'el-GR',datePublished:'2026-10-12',dateModified:'2026-10-12',author:{'@id':org},publisher:{'@id':org},citation:['https://www.elinyae.gr/ethniki-nomothesia/n-52392025-fek-178a-20102025','https://www.taxheaven.gr/law/5239/2025/article/39/view','https://www.taxheaven.gr/law/5239/2025/article/103/view']},
{'@type':'FAQPage','@id':'https://firstaid5239.gr/#faq-schema',mainEntity:faq.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))}
];
const schema=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replaceAll('<','\\u003c');
const fragments=['01-header','02-law','03-programs','04-contact'];
let html=(await Promise.all(fragments.map(p=>readFile('src/'+p+'.html','utf8')))).join('\n');
html=html.replace('<!--STRUCTURED_DATA-->', '<script type="application/ld+json">'+schema+'</script>').replace('<!--FAQ_ITEMS-->',faqHtml);
if(html.includes('<!--FAQ_ITEMS-->')||html.includes('<!--STRUCTURED_DATA-->')||!html.includes('</html>'))throw Error('HTML template incomplete');
await mkdir(dir,{recursive:true});
await writeFile(path.join(dir,'index.html'),html);
await cp('public',dir,{recursive:true});
const faqDoc=['# Συχνές ερωτήσεις: Ν. 5239/2025, άρθρο 39 — ΕΝΑΚ','','Πηγή: https://firstaid5239.gr/#faq','Νομοθεσία: https://www.elinyae.gr/ethniki-nomothesia/n-52392025-fek-178a-20102025','Ενημέρωση: 12/10/2026','','## FAQ',...faq.flatMap(([q,a])=>['','### '+q,'',a])].join('\n')+'\n';
await writeFile(path.join(dir,'faq.md'),faqDoc);
console.log('Built dist/index.html with '+faq.length+' FAQs, '+graph.length+' schema graph nodes.');