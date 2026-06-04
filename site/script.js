//Tab switching code
const nav_tabs = document.querySelectorAll('.panel-nav-btn');
const tab_contents = document.querySelectorAll('.panel-content');

nav_tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = document.querySelector(tab.dataset.tabTarget);
        nav_tabs.forEach(tab => {
            tab.classList.remove('panel-nav-btn-selected');
        })
        tab_contents.forEach(tab_content => {
            tab_content.classList.remove('panel-content-selected');
        })
        tab.classList.add('panel-nav-btn-selected');
        target.classList.add('panel-content-selected');
    })
});

//Export code
const canvas = document.getElementById('chart');
document.getElementById('export-trigger').addEventListener('click', () => {
  const format = document.getElementById('export-format').value;
  format === 'png' ? exportPNG() : exportJPEG();
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