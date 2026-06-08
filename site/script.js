// Colors
const bg_color = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
const bg_subtle_color = getComputedStyle(document.documentElement).getPropertyValue('--bg-subtle-color').trim();
const fg_color = getComputedStyle(document.documentElement).getPropertyValue('--fg-color').trim();
const highlight_color = getComputedStyle(document.documentElement).getPropertyValue('--hightlight').trim();

// Initialize chart
const chart_canvas = document.getElementById('chart');
Chart.defaults.font.family = "'Quicksand', sans-serif";
Chart.defaults.color = fg_color; 
const chart_datasets = {
    datasets: [
        {
            label: 'Force',
            data: [{x:1,y:1}]
        },
    ],
};
const chart_options = {
    animation: false,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: false,
        },
        title: {
            display: false,
        }
    },
    responsive: true,
    scales: {
        x: {
            border: { color: fg_color },
            grid: { color: bg_subtle_color },
            type: 'linear',
        },
        y: {
            border: { color: fg_color },
            grid: { color: bg_subtle_color },
        }
    },
};
let chart = new Chart(chart_canvas, {
    type: "line",
    data: chart_datasets,
    options: chart_options
})

// Tab switching
const nav_tabs = document.querySelectorAll('.panel-nav-btn');
nav_tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = document.querySelector(tab.dataset.tabTarget);
        previous_active_tab = document.querySelector('.panel-nav-btn-selected');
        previous_active_tab.classList.remove('panel-nav-btn-selected');
        previous_active_tab_content = document.querySelector('.panel-content-selected');
        previous_active_tab_content.classList.remove('panel-content-selected');
        tab.classList.add('panel-nav-btn-selected');
        target.classList.add('panel-content-selected');
    })
});

// Export image
document.getElementById('export-trigger').addEventListener('click', () => {
    const format = document.getElementById('export-format').value;
    if (format === 'png' || format === 'jpeg') {
        export_image(format);
    }
});

function export_image(format) {
    const bg_canvas = document.createElement('canvas');
    bg_canvas.width = chart_canvas.width;
    bg_canvas.height = chart_canvas.height;
    const bg_ctx = bg_canvas.getContext('2d');
    bg_ctx.fillStyle = bg_color;
    bg_ctx.fillRect(0, 0, bg_canvas.width, bg_canvas.height);
    bg_ctx.drawImage(chart_canvas, 0, 0);
    const a = document.createElement('a');
    a.href = bg_canvas.toDataURL(`image/${format}`);
    a.download = `lab.${format}`;
    a.click();
}