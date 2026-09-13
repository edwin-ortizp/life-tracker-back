import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.PERF_URL ?? 'http://127.0.0.1:8031';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Local benchmark only');
const label = process.argv[2] ?? 'baseline';
const repetitions = Number(process.env.PERF_REPETITIONS ?? 20);
const browser = await chromium.launch({headless: true});
const report = {label, repetitions, samples: []};
try {
for (const dataset of ['small', 'large']) {
    const context = await browser.newContext({viewport:{width:1440,height:900}, serviceWorkers:'block', reducedMotion:'no-preference'});
    await context.addInitScript(() => {
        window.__perf = {click:0, visible:0, longTasks:0};
        new PerformanceObserver(list => { window.__perf.longTasks += list.getEntries().length; }).observe({type:'longtask', buffered:true});
        document.addEventListener('click', () => {
            window.__perf.click = performance.now();
            window.__perf.visible = 0;
            requestAnimationFrame(() => requestAnimationFrame(() => { window.__perf.frame = performance.now(); }));
        }, true);
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + '/login');
    await page.getByLabel('Correo electrónico').fill(dataset+'@performance.test');
    await page.getByLabel('Contraseña', {exact:true}).fill('password');
    await page.getByRole('button', {name:/Iniciar Sesión/}).click();
    await page.waitForURL(base + '/');
    await page.goto(base + '/health?range=all&status=all');
    const dialog = page.getByRole('dialog').filter({visible:true});
    let requests = [];
    page.on('response', async response => {
        if (response.url().startsWith(base) && ['fetch','xhr','document'].includes(response.request().resourceType())) {
            requests.push({timing:response.headers()['server-timing'] ?? '', bytes:Number(response.headers()['content-length'] ?? 0), status:response.status()});
        }
    });
    async function measure(action, run, ready) {
        requests = [];
        await page.evaluate(() => { window.__perf.started=performance.now(); window.__perf.click=0; });
        // In-page rAF observation avoids including the automation wait in UI latency.
        await page.evaluate(({action}) => {
            window.__perf.result = null;
            window.__perf.before = !![...document.querySelectorAll('[role="dialog"]')].find(e=>e.getBoundingClientRect().width && getComputedStyle(e).visibility!=='hidden');
            function observe() {
                const visible = !![...document.querySelectorAll('[role="dialog"]')].find(e=>e.getBoundingClientRect().width && getComputedStyle(e).visibility!=='hidden');
                if (window.__perf.click && visible !== window.__perf.before) {
                    window.__perf.result=performance.now()-window.__perf.click;
                } else if (performance.now()-window.__perf.started < 15000 && /open|close|edit/.test(action)) requestAnimationFrame(observe);
            }
            if (/open|close|edit/.test(action)) requestAnimationFrame(observe);
        }, {action});
        await run(); await ready();
        if (/open|close|edit/.test(action)) await page.waitForFunction(() => window.__perf.result !== null);
        const stats = await page.evaluate(() => ({uiMs:window.__perf.result, observedMs:performance.now()-(window.__perf.started??0), longTasks:window.__perf.longTasks, nodes:document.querySelectorAll('*').length}));
        report.samples.push({dataset,action,...stats,requests:[...requests]});
    }
    for (let i=0;i<repetitions;i++) {
        await measure('health-open', ()=>page.getByRole('button',{name:'Registrar evento',exact:true}).click(), ()=>dialog.waitFor({state:'visible'}));
        await measure('health-field', ()=>page.locator('[wire\\:model\\.blur=title], [wire\\:model=title]').filter({visible:true}).fill('Draft only'), async()=>{await page.locator('input[type=date]').filter({visible:true}).first().focus(); await page.waitForTimeout(700);});
        await measure('health-close', ()=>page.getByRole('button',{name:'Cerrar',exact:true}).filter({visible:true}).click(), ()=>dialog.waitFor({state:'hidden'}));
    }
    for (let i=0;i<repetitions;i++) {
        await measure('tasks-navigate', ()=>page.getByRole('link',{name:'Tareas',exact:true}).first().click(), ()=>page.getByRole('button',{name:'Nueva tarea',exact:true}).waitFor());
        await measure('tasks-reload', ()=>page.reload(), ()=>page.getByRole('button',{name:'Nueva tarea',exact:true}).waitFor());
        await measure('task-open', ()=>page.getByRole('button',{name:'Nueva tarea',exact:true}).click(), ()=>dialog.waitFor({state:'visible'}));
        await measure('task-close', ()=>page.getByRole('button',{name:'Cerrar',exact:true}).filter({visible:true}).click(), ()=>dialog.waitFor({state:'hidden'}));
        await page.getByRole('link',{name:'Salud',exact:true}).click();
        await page.getByRole('button',{name:'Registrar evento',exact:true}).waitFor();
    }
    report[dataset+'Errors']=errors;
    await context.close();
}
} finally {
    await browser.close();
    await mkdir('storage/framework/testing/performance', {recursive:true});
    const groups = {};
    for (const s of report.samples) (groups[s.dataset+'/'+s.action] ??= []).push(s);
    report.summary = Object.fromEntries(Object.entries(groups).map(([key,rows])=>{
        const values=rows.map(r=>r.uiMs??r.observedMs).sort((a,b)=>a-b);
        return [key,{median:values[Math.floor(values.length/2)],p95:values[Math.ceil(values.length*.95)-1],requests:rows.reduce((n,r)=>n+r.requests.length,0)/rows.length}];
    }));
    await writeFile(`storage/framework/testing/performance/${label}.json`, JSON.stringify(report,null,2));
    console.log(JSON.stringify(report.summary,null,2));
}

