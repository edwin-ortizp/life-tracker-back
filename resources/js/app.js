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
        mutations.forEach((mutation) => mutation.addedNodes.forEach(discoverHealthCharts));
    }).observe(document.body, { childList: true, subtree: true });
});
