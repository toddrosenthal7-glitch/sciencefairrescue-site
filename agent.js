// Agent/AI-search helpers: head tags, JSON-LD, llms.txt, llms-full.txt, sitemap.xml, robots.txt. Zero deps.
const fs=require('fs');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BOTS=['GPTBot','OAI-SearchBot','ChatGPT-User','PerplexityBot','ClaudeBot','Google-Extended','Applebot-Extended','Googlebot','Bingbot'];
module.exports=function(base,siteName){
 base=String(base).replace(/\/$/,'');const pages=[];
 const url=p=>base+'/'+(p==='index.html'?'':p);
 const text=h=>h.replace(/<(script|style|form)[\s\S]*?<\/\1>/g,'').replace(/<li>/g,'\n- ').replace(/<h([1-6])>/g,(m,n)=>'\n\n'+'#'.repeat(+n)+' ').replace(/<\/(p|h\d|ul|ol|div)>/g,'\n').replace(/<br>/g,'\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/[ \t]+/g,' ').replace(/\n\s*\n\s*\n+/g,'\n\n').trim();
 const crumbs=(list)=>({'@type':'BreadcrumbList',itemListElement:list.map(([n,p],i)=>({'@type':'ListItem',position:i+1,name:n,item:url(p)}))});
 const org={'@type':'Organization','@id':base+'/#org',name:siteName,url:base+'/'};
 // register a page; returns extra <head> HTML (canonical, OG, JSON-LD)
 function head({path,title,desc,body,ld=[],crumb=[],type='website',image}){
  pages.push({path,title,desc,body});
  const graph={'@context':'https://schema.org','@graph':[...ld,...(crumb.length?[crumbs([['Home','index.html'],...crumb])]:[])]};
  return `<link rel="canonical" href="${esc(url(path))}"><meta property="og:type" content="${type}"><meta property="og:site_name" content="${esc(siteName)}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(url(path))}">${image?`<meta property="og:image" content="${esc(base+'/'+image)}">`:''}<meta name="twitter:card" content="summary"><link rel="alternate" type="text/plain" title="llms.txt" href="${esc(base)}/llms.txt"><script type="application/ld+json">${JSON.stringify(graph).replace(/</g,'\\u003c')}</script>`;
 }
 const homeLd=(desc,sameAs=[])=>[{...org,description:desc,...(sameAs.length?{sameAs}:{})},{'@type':'WebSite','@id':base+'/#site',name:siteName,url:base+'/',description:desc,publisher:{'@id':base+'/#org'},inLanguage:'en'}];
 const howTo=({name,desc,path,supplies=[],steps=[],time,video})=>({'@type':'HowTo',name,description:desc,url:url(path),...(time?{totalTime:time}:{}),supply:supplies.map(s=>({'@type':'HowToSupply',name:s})),step:steps.map((s,i)=>({'@type':'HowToStep',position:i+1,text:s,url:url(path)+'#step-'+(i+1)})),...(video&&video.uploadDate?{video:{'@type':'VideoObject',name,description:desc,embedUrl:video.url,thumbnailUrl:video.thumb||base+'/logo.png',uploadDate:video.uploadDate}}:{}),publisher:{'@id':base+'/#org'}});
 const faq=qa=>({'@type':'FAQPage',mainEntity:qa.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))});
 function finish(out,summary,intro=''){
  const sorted=[...pages].map(p=>({...p,title:p.title.replace(' | '+siteName,'')})).sort((a,b)=>(b.path==='index.html')-(a.path==='index.html'));
  fs.writeFileSync(out+'/llms.txt',`# ${siteName}\n\n> ${summary}\n\n${intro?intro+'\n\n':''}## Pages\n\n${sorted.map(p=>`- [${p.title}](${url(p.path)}): ${p.desc}`).join('\n')}\n\n## Optional\n\n- [Full text of every page](${base}/llms-full.txt): all site content in one plain-text file\n`);
  fs.writeFileSync(out+'/llms-full.txt',`# ${siteName}\n\n> ${summary}\n\n`+sorted.map(p=>`---\n\nURL: ${url(p.path)}\n\n${text(p.body)}\n`).join('\n'));
  fs.writeFileSync(out+'/sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sorted.map(p=>`<url><loc>${esc(url(p.path))}</loc><lastmod>${new Date().toISOString().slice(0,10)}</lastmod></url>`).join('\n')}\n</urlset>\n`);
  fs.writeFileSync(out+'/robots.txt',BOTS.map(b=>`User-agent: ${b}\nAllow: /\n`).join('\n')+`\nUser-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`);
  return sorted.length;
 }
 return {head,homeLd,howTo,faq,finish,url,text};
};
