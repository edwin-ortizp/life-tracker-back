const charts = new WeakMap();
const pendingCharts = new WeakSet();
let apexChartsPromise;

function color(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

async function renderHealthChart(element) {
    if (charts.has(element) || pendingCharts.has(element)) {
        return;
    }

    pendingCharts.add(element);

    const points = JSON.parse(element.dataset.healthChart ?? '[]');
    if (points.length === 0) {
        pendingCharts.delete(element);
        return;
    }

    apexChartsPromise ??= import('apexcharts').then((module) => module.default);
    const ApexCharts = await apexChartsPromise;
    const chart = new ApexCharts(element, {
        chart: {
            type: 'area',
            height: 220,
            toolbar: { show: false },
            fontFamily: 'inherit',
            animations: { easing: 'easeinout', speed: 450 },
        },
        series: [{ name: 'Intensidad', data: points.map((point) => point.intensity) }],
        colors: [color('--md-sys-color-primary')],
        stroke: { curve: 'smooth', width: 3 },
        fill: {
            type: 'gradient',
            gradient: { shadeIntensity: 0, opacityFrom: 0.42, opacityTo: 0.02, stops: [0, 92, 100] },
        },
        markers: { size: 4, strokeWidth: 2, strokeColors: color('--md-sys-color-surface') },
        dataLabels: { enabled: false },
        grid: { borderColor: color('--md-sys-color-outline-variant'), strokeDashArray: 4, padding: { left: 2, right: 8 } },
        xaxis: {
            categories: points.map((point) => point.date),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { colors: color('--md-sys-color-on-surface-variant'), fontSize: '11px' } },
        },
        yaxis: {
            min: 0,
            max: 10,
            tickAmount: 5,
            labels: {
                formatter: (value) => Number.isInteger(value) ? value : '',
                style: { colors: color('--md-sys-color-on-surface-variant'), fontSize: '11px' },
            },
        },
        tooltip: {
            theme: document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
            y: { formatter: (value) => `${value}/10` },
        },
        legend: { show: false },
    });

    charts.set(element, chart);
    pendingCharts.delete(element);
    chart.render();
}

function discoverHealthCharts(root = document) {
    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.('[data-health-chart]')) {
        renderHealthChart(root);
    }
    root.querySelectorAll?.('[data-health-chart]').forEach(renderHealthChart);
}

document.addEventListener('DOMContentLoaded', () => {
    discoverHealthCharts();
    new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach(discoverHealthCharts);
            mutation.removedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) return;
                const targets = node.matches?.('[data-health-chart]')
                    ? [node]
                    : [...(node.querySelectorAll?.('[data-health-chart]') ?? [])];
                targets.forEach((el) => {
                    const chart = charts.get(el);
                    if (chart) { chart.destroy(); charts.delete(el); }
                });
            });
        });
    }).observe(document.body, { childList: true, subtree: true });

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'l' && e.target.matches('textarea.md-markdown-editor-input')) {
            e.preventDefault();
            const ta = e.target;
            const start = ta.selectionStart;
            const value = ta.value;

            const lineStart = value.lastIndexOf('\n', start - 1) + 1;
            const lineEnd = value.indexOf('\n', start);
            const lineText = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
            const after = value.substring(lineStart + lineText.length);

            const unchecked = '- [ ] ';
            const checked = '- [x] ';

            if (lineText.startsWith(unchecked)) {
                ta.value = value.substring(0, lineStart) + checked + lineText.substring(unchecked.length) + after;
                ta.selectionStart = ta.selectionEnd = start;
            } else if (lineText.startsWith(checked)) {
                ta.value = value.substring(0, lineStart) + lineText.substring(checked.length) + after;
                ta.selectionStart = ta.selectionEnd = start - checked.length;
            } else {
                ta.value = value.substring(0, lineStart) + unchecked + value.substring(lineStart);
                ta.selectionStart = ta.selectionEnd = start + unchecked.length;
            }

            ta.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
});
