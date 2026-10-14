import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const root="Snapshots/North City/O's Apartment";
const manifest=JSON.parse(await readFile(root+'/manifest.json','utf8'));
const base='http://127.0.0.1:5178/'+root.split('/').map(encodeURIComponent).join('/')+'/';
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const errors=[];
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'index.html',{waitUntil:'domcontentloaded'});
 assert.equal(await page.locator('a.photo').count(),100);
 assert.equal(await page.locator('.ultrawide a.photo').count(),50);
 assert.equal(await page.locator('.phone a.photo').count(),50);
 await page.locator('a.photo img').first().evaluate(img=>img.decode());
 const hrefs=await page.locator('a.photo').evaluateAll(links=>links.map(a=>a.href));
 assert.equal(new Set(hrefs).size,100);
 for(let i=0;i<hrefs.length;i+=10){
  const results=await Promise.all(hrefs.slice(i,i+10).map(async url=>{const response=await context.request.head(url);const result={url,status:response.status(),type:response.headers()['content-type']};await response.dispose();return result;}));
  for(const r of results){assert.equal(r.status,200,r.url);assert.match(r.type,/image\/png/,r.url);}
 }
 await page.screenshot({path:'output/playwright/snapshot-gallery-preview.png'});
 assert.deepEqual(errors,[]);
 const report={gallery:base+'index.html',pictures:100,ultrawide:50,phone:50,allImageLinksStatus:200,errors,bytes:manifest.pictures.reduce((n,p)=>n+p.bytes,0)};
 await writeFile('output/playwright/snapshot-gallery-validation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}
