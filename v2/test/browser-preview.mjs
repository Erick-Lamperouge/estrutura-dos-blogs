import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
const origin='http://127.0.0.1:4321';
const server=spawn(process.platform==='win32'?'npm.cmd':'npm',['run','preview','--','--host','127.0.0.1','--port','4321'],{stdio:'inherit'});
let browser;
try{
  for(let i=0;i<60;i++){try{if((await fetch(origin+'/futebolando/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));}
  browser=await chromium.launch({headless:true});
  mkdirSync('review-shots',{recursive:true});
  for(const [name,route,locale,motif,width,height] of [
    ['futebolando-desktop','/futebolando/','pt-BR','pitch',1440,1050],
    ['futebolando-mobile','/futebolando/','pt-BR','pitch',390,844],
    ['futebolando-small','/futebolando/','pt-BR','pitch',320,700],
    ['futebolando-english','/futebolando/en/','en','pitch',1280,900],
    ['culinaria-desktop','/culinaria-demo/','pt-BR','table',1440,1050],
    ['culinaria-mobile','/culinaria-demo/en/','en','table',390,844]
  ]){
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,colorScheme:'light'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+route,{waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),locale);
    assert.equal(await page.locator('body').getAttribute('data-motif'),motif);
    assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('[data-pauta]:visible').count(),3);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'overflow '+name);
    assert.equal(await page.locator('script[src*="googlesyndication"],script[src*="googletagmanager"]').count(),0);
    assert.equal(await page.locator('body').getAttribute('data-density'),'minimal');
    assert.equal(await page.locator('html').getAttribute('data-blog-theme'),'light');
    const light=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
    await page.screenshot({path:'review-shots/'+name+'-light.png',fullPage:true,animations:'disabled'});
    await page.locator('#blog-theme').selectOption('dark');
    assert.equal(await page.locator('html').getAttribute('data-blog-theme'),'dark');
    const dark=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
    assert.notEqual(light,dark);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'dark overflow '+name);
    await page.screenshot({path:'review-shots/'+name+'-dark.png',fullPage:true,animations:'disabled'});
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await page.locator('#blog-theme').inputValue(),'dark');
    assert.equal(await page.locator('html').getAttribute('data-blog-theme'),'dark');
    if(motif==='pitch'){
      const img=page.locator('.story-media img');
      assert.equal(await img.count(),1);
      await img.scrollIntoViewIfNeeded();
      await img.evaluate(el=>el.decode());
      assert.ok(await img.evaluate(el=>el.naturalWidth>0&&el.alt.length>0));
    }
    await page.locator('#pauta-search').fill('zzzzzznomatch');
    assert.equal(await page.locator('[data-pauta]:visible').count(),0);
    await page.locator('#clear-filters').click();
    assert.equal(await page.locator('[data-pauta]:visible').count(),3);
    const first=await page.locator('[data-pauta]').first().getAttribute('data-category');
    await page.locator('[data-category-filter="'+first+'"]').click();
    assert.equal(await page.locator('[data-pauta]:visible').count(),1);
    assert.equal(await page.locator('[data-category-filter="'+first+'"]').getAttribute('aria-pressed'),'true');
    await page.locator('#clear-filters').click();
    assert.equal(await page.locator('[data-pauta]:visible').count(),3);
    const other=locale==='en'?'pt-BR':'en';
    const link=page.locator('.blog-languages a[hreflang="'+other+'"]');
    await link.click();
    assert.equal(await page.locator('html').getAttribute('lang'),other);
    assert.equal(await page.locator('#blog-theme').inputValue(),'dark');
    await page.locator('#blog-theme').selectOption('light');
    assert.equal(await page.locator('html').getAttribute('data-blog-theme'),'light');
    await page.locator('#blog-theme').selectOption('system');
    assert.equal(await page.locator('html').getAttribute('data-blog-theme'),'light');
    await page.emulateMedia({colorScheme:'dark'});
    await page.waitForFunction(()=>document.documentElement.dataset.blogTheme==='dark');
    assert.deepEqual(errors,[]);
    await page.close();
    console.log('PASS browser '+name);
  }
}finally{await browser?.close();server.kill();}
