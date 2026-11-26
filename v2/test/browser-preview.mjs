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
    const expectedStories=motif==='pitch'?8:3;
    const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,colorScheme:'light'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+route,{waitUntil:'networkidle'});
    assert.equal(await page.locator('html').getAttribute('lang'),locale);
    assert.equal(await page.locator('body').getAttribute('data-motif'),motif);
    assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
    assert.equal(await page.locator('h1').count(),1);
    assert.equal(await page.locator('[data-pauta]:visible').count(),expectedStories);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'overflow '+name);
    assert.equal(await page.locator('script[src*="googlesyndication"],script[src*="googletagmanager"]').count(),0);
    assert.equal(await page.locator('body').getAttribute('data-density'),'minimal');
    assert.equal(await page.locator('html').getAttribute('data-blog-theme'),'light');
    await page.evaluate(()=>document.fonts.ready);
    const fontReport=await page.evaluate(async()=>{
      const specs=['800 24px "Barlow Condensed"','600 24px "Source Serif 4 Variable"','500 16px "Inter Variable"'];
      const loaded=await Promise.all(specs.map(s=>document.fonts.load(s,'Futebolando')));
      return loaded.map(a=>a.length>0&&a.every(f=>f.status==='loaded'));
    });
    assert.deepEqual(fontReport,[true,true,true]);
    const controls=await page.locator('.primary-nav a,.category-list button,.blog-languages a,#blog-theme,#pauta-search,#clear-filters,.search-link,.editorial-action').evaluateAll(nodes=>nodes.filter(n=>n.getClientRects().length).map(n=>{const r=n.getBoundingClientRect();return [n.textContent,r.width,r.height]}));
    assert.ok(controls.every(c=>c[1]>=44&&c[2]>=44),JSON.stringify(controls.filter(c=>c[1]<44||c[2]<44)));
    const keyboard=page.locator('[data-category-filter]').nth(1);
    await keyboard.focus();await page.keyboard.press('Space');
    assert.equal(await keyboard.getAttribute('aria-pressed'),'true');
    await page.locator('#clear-filters').click();
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
      assert.equal(await img.count(),7);
      for(const image of await img.all()){
        await image.scrollIntoViewIfNeeded();
        await image.evaluate(el=>el.decode());
        assert.ok(await image.evaluate(el=>el.naturalWidth>0&&el.alt.length>0));
      }
    }
    await page.locator('#pauta-search').fill('zzzzzznomatch');
    assert.equal(await page.locator('[data-pauta]:visible').count(),0);
    await page.locator('#clear-filters').click();
    assert.equal(await page.locator('[data-pauta]:visible').count(),expectedStories);
    const first=await page.locator('[data-pauta]').first().getAttribute('data-category');
    await page.locator('[data-category-filter="'+first+'"]').click();
    assert.equal(await page.locator('[data-pauta]:visible').count(),motif==='pitch'?4:1);
    assert.equal(await page.locator('[data-category-filter="'+first+'"]').getAttribute('aria-pressed'),'true');
    await page.locator('#clear-filters').click();
    assert.equal(await page.locator('[data-pauta]:visible').count(),expectedStories);
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
    await page.emulateMedia({reducedMotion:'reduce'});
    assert.equal(await page.locator('[data-category-filter]').first().evaluate(el=>getComputedStyle(el).transitionDuration),'0s');
    if(motif==='pitch'){
      const articleLink=page.locator('.story-copy .editorial-action').first();
      await articleLink.focus();await page.keyboard.press('Enter');
      await page.waitForURL(/\/(artigos|articles)\//);
      assert.equal(await page.locator('article.article-page h1').count(),1);
      assert.equal(await page.locator('.article-references a').count(),2);
      assert.equal(await page.locator('[data-section-role=quick]').count(),1);
      assert.equal(await page.locator('.episode-marker').count(),1);
      assert.equal(await page.locator('meta[name=robots]').getAttribute('content'),'noindex,nofollow');
      assert.equal(await page.locator('#blog-theme').inputValue(),'system');
      const next=other==='en'?'pt-BR':'en';
      await page.locator('.blog-languages a[hreflang="'+next+'"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'),next);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'article overflow');
      await page.locator('.episode-nav a').last().click();
      assert.equal(await page.locator('article.article-page h1').count(),1);
      await page.screenshot({path:'review-shots/'+name+'-article.png',fullPage:true,animations:'disabled'});
      await page.locator('.episode-marker a').click();
      assert.equal(await page.locator('.series-episodes li').count(),10);
      assert.equal(await page.locator('.series-episodes a').count(),4);
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'series overflow');
      await page.screenshot({path:'review-shots/'+name+'-series.png',fullPage:true,animations:'disabled'});
      await page.locator('.series-page > .editorial-action').first().click();
      assert.equal(await page.locator('.series-catalog .series-panel').count(),6);
      assert.equal(await page.locator('.series-catalog .editorial-action').count(),5);
      const prefix=next==='en'?'/futebolando/en/':'/futebolando/';
      await page.goto(origin+prefix,{waitUntil:'networkidle'});
      await page.locator('#pauta-search').fill('xG');
      assert.ok(await page.locator('[data-article-id="expected-goals"]').isVisible());
      await page.locator('#clear-filters').click();
      await page.locator('[data-category-filter="estatisticas"]').click();
      assert.equal(await page.locator('[data-pauta]:visible').count(),1);
      await page.locator('[data-article-id="expected-goals"] .editorial-action').click();
      assert.equal(await page.locator('[data-stat-example="illustrative"]').count(),1);
      assert.equal(await page.locator('[data-section-role=limitations]').count(),1);
      const chart=page.locator('.article-cover img');
      await chart.evaluate(el=>el.decode());
      assert.ok(await chart.evaluate(el=>el.naturalWidth>0&&el.alt.length>0));
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'stats article overflow');
      await page.screenshot({path:'review-shots/'+name+'-xg.png',fullPage:true,animations:'disabled'});
    }
    assert.deepEqual(errors,[]);
    await page.close();
    console.log('PASS browser '+name);
  }
}finally{await browser?.close();server.kill();}
