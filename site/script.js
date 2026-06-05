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

function exportPNG() {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'chart.png';
  a.click();
}

function exportJPEG() {
  // JPEG needs a white background painted first
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  const ctx = copy.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, copy.width, copy.height);
  ctx.drawImage(canvas, 0, 0);

  const a = document.createElement('a');
  a.href = copy.toDataURL('image/jpeg', 0.95);
  a.download = 'chart.jpg';
  a.click();
}