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