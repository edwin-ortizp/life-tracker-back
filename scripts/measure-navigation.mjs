import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.PERF_URL ?? 'http://127.0.0.1:8031';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local benchmark only');
const browser = await chromium.launch();
const report = { samples: [], lifecycle: [], errors: [] };
const repetitions = Number(process.env.PERF_REPETITIONS ?? 20);
const summarize = rows => {
    const values = rows.map(r => r.ms).sort((a,b) => a-b);
    return {n:values.length, median:values[Math.floor(values.length/2)], p95:values[Math.ceil(values.length*.95)-1]};
};
try {
for (const dataset of ['small','large']) {
    const context = await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
    await context.addInitScript(() => {
        window.__trace = {done:null,click:0,longTasks:[]};
        new PerformanceObserver(list => {
            for (const e of list.getEntries()) window.__trace.longTasks.push({start:e.startTime,duration:e.duration});
        }).observe({type:'longtask',buffered:true});
        document.addEventListener('click',()=>{window.__trace.click=performance.now();},true);
        document.addEventListener('livewire:navigated',()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{
            window.__trace.done=performance.now();
        })));
    });
    const page=await context.newPage();
    page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto(base+'/login');
    await page.getByLabel('Correo electrónico').fill(dataset+'@performance.test');
    await page.getByLabel('Contraseña',{exact:true}).fill('password');
    await page.getByRole('button',{name:/Iniciar Sesión/}).click();
    await page.waitForURL(base+'/');
    await page.goto(base+'/health?range=all&status=all');
    await page.waitForFunction(()=>window.__trace.done!==null);
    for(let i=0;i<repetitions;i++) {
        await page.evaluate(()=>{window.__trace.done=null; performance.clearResourceTimings();});
        await page.getByRole('link',{name:'Tareas',exact:true}).first().click();
        await page.waitForFunction(()=>window.__trace.done!==null);
        report.samples.push({dataset,action:'navigate',visit:i,...await page.evaluate(()=>({
            ms:window.__trace.done-window.__trace.click,
            resources:performance.getEntriesByType('resource').filter(e=>e.name.includes('/tasks/list')).map(e=>({duration:e.duration,ttfb:e.responseStart-e.requestStart,bytes:e.encodedBodySize})),
        }))});
        const url=page.url();
        await page.reload();
        await page.waitForFunction(()=>window.__trace.done!==null);
        expect(page.url()).toBe(url);
        report.samples.push({dataset,action:'reload',visit:i,...await page.evaluate(()=>({
            ms:window.__trace.done,
            resources:performance.getEntriesByType('navigation').map(e=>({duration:e.responseEnd,ttfb:e.responseStart-e.requestStart,bytes:e.encodedBodySize})),
        }))});
        await page.evaluate(()=>{window.__trace.done=null;});
        await page.getByRole('link',{name:'Salud',exact:true}).click();
        await page.waitForFunction(()=>window.__trace.done!==null);
        await page.getByRole('button',{name:'Registrar evento',exact:true}).waitFor();
    }
    // Edit: visible shell immediately, independent request loads the record.
    for(let i=0;i<repetitions;i++) {
        const event=page.locator('.health-event').first();
        const expand=event.locator('.health-event__head');
        if(await expand.count()) await expand.click();
        else await event.getByRole('button').first().click();
        await event.getByRole('button',{name:/Más/}).last().click();
        await page.evaluate(()=>{window.__trace.click=0;window.__trace.visible=null;
            const poll=()=>{const el=document.querySelector('#health-event-dialog-title')?.closest('[role=dialog]');
                if(window.__trace.click && el?.getBoundingClientRect().width)window.__trace.visible=performance.now();else requestAnimationFrame(poll);};requestAnimationFrame(poll);
        });
        const response=page.waitForResponse(r=>r.request().method()==='POST' && r.url().includes('livewire'));
        await page.getByRole('menuitem',{name:'Editar evento',exact:true}).click();
        const r=await response; await r.finished();
        const dialog=page.getByRole('dialog').filter({visible:true});
        await expect(dialog.locator('input[name=title]')).not.toHaveValue('');
        report.samples.push({dataset,action:'edit-shell',visit:i,...await page.evaluate(()=>({ms:window.__trace.visible-window.__trace.click})),serverTiming:r.headers()['server-timing'],bytes:(await r.body()).length});
        await dialog.getByRole('button',{name:'Cerrar',exact:true}).click();
        await expect(dialog).toBeHidden();
        await event.getByRole('button').first().click();
    }
    for(let i=0;i<repetitions;i++) {
        await page.getByRole('button',{name:/^Filtros/}).first().click();
        const filters=page.locator('#health-filters');
        await filters.locator('select[name=status]').selectOption(i%2?'all':'active');
        const response=page.waitForResponse(r=>r.request().method()==='POST' && r.url().includes('livewire'));
        await filters.getByRole('button',{name:'Aplicar',exact:true}).click();
        const r=await response; await r.finished();
        report.samples.push({dataset,action:'filters-response',visit:i,ms:await page.evaluate(()=>performance.now()-window.__trace.click),serverTiming:r.headers()['server-timing'],bytes:(await r.body()).length});
    }
    if(dataset==='large') {
        const cdp=await context.newCDPSession(page);
        for(let cycle=0;cycle<=30;cycle++) {
            if(cycle>0) {
                await page.getByRole('link',{name:'Tareas',exact:true}).first().click();
                await page.getByRole('button',{name:'Nueva tarea',exact:true}).waitFor();
                await page.getByRole('link',{name:'Salud',exact:true}).click();
                await page.getByRole('button',{name:'Registrar evento',exact:true}).waitFor();
            }
            await page.waitForTimeout(500); // allow chart animations and destruction to settle before GC
            await cdp.send('HeapProfiler.collectGarbage');
            report.lifecycle.push({cycle,...await cdp.send('Memory.getDOMCounters'),...await cdp.send('Runtime.getHeapUsage'),charts:await page.locator('.apexcharts-canvas').count()});
        }
    }
    await context.close();
}
} finally {
    await browser.close();
    const groups={};for(const row of report.samples)(groups[row.dataset+'/'+row.action]??=[]).push(row);
    report.summary=Object.fromEntries(Object.entries(groups).map(([key,rows])=>[key,summarize(rows)]));
    await mkdir('storage/framework/testing/performance',{recursive:true});
    await writeFile('storage/framework/testing/performance/navigation.json',JSON.stringify(report,null,2));
    console.log(JSON.stringify({summary:report.summary,lifecycle:[report.lifecycle[0],report.lifecycle.at(-1)],errors:report.errors},null,2));
}
