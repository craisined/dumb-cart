const chart_canvas = document.getElementById('chart');

// Tab switching code
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

// Export code
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
    bg_ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
    bg_ctx.fillRect(0, 0, bg_canvas.width, bg_canvas.height);
    bg_ctx.drawImage(chart_canvas, 0, 0);
    const a = document.createElement('a');
    a.href = bg_canvas.toDataURL(`image/${format}`);
    a.download = `lab.${format}`;
    a.click();
}