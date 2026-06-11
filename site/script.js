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
    layout: {
        padding: 16,
    },
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
            beginAtZero: true,
            border: { color: fg_color },
            grid: { color: bg_subtle_color },
            type: 'linear',
        },
        y: {
            beginAtZero: true,
            border: { color: fg_color },
            grid: { color: bg_subtle_color },
            type: 'linear',
        }
    },
};
let chart = new Chart(chart_canvas, {
    type: "line",
    data: chart_datasets,
    options: chart_options
})

// Bluetooth
const service_uuid = "907da526-6f31-42c6-8b17-4fa0c76ad1d7";
const characteristic_uuid = "383dfe4a-06d1-49bc-862f-06841d591a7e";

let ble_device;
let ble_server;
let ble_service;
let ble_sensor_characteristic;

let sensor_data;

function handle_characteristic_change(event){
    let buffer = event.target.value.buffer;
    let sensor_dataview = new DataView(buffer);
    let offset = 0;
    sensor_data = {
        acceleration: sensor_dataview.getFloat32(offset, true),
        force: sensor_dataview.getFloat32(offset += 4, true),
        encoder: sensor_dataview.getFloat32(offset += 4, true),
        time: sensor_dataview.getInt32(offset += 4, true),
    }
    update_trial();
}

async function connect_cart(event){
    if (!navigator.bluetooth){
        alert("Web Bluetooth not enabled! Try a Chromium based browser (sorry).");
        return null;
    }
    ble_device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [service_uuid] }],
    })
    ble_server = await ble_device.gatt.connect();
    ble_service = await ble_server.getPrimaryService(service_uuid);
    ble_sensor_characteristic = await ble_service.getCharacteristic(characteristic_uuid);
    ble_sensor_characteristic.startNotifications();
    ble_sensor_characteristic.addEventListener('characteristicvaluechanged', handle_characteristic_change);
    console.log("Connected! Device: ", ble_device.name);
}

async function disconnect_cart(event){
    if (!ble_device || !ble_device.gatt.connected){
        console.log("Already disconnected!");
    }
    ble_device.gatt.disconnect();
    console.log("Disconnected!");
}
const connect_btn = document.getElementById("connect-btn");
const disconnect_btn = document.getElementById("disconnect-btn");
connect_btn.addEventListener("click", connect_cart);
disconnect_btn.addEventListener("click", disconnect_cart);

// Trial
let active_trial;
let active_trial_start;

function toggle_trial(event){
    if (!sensor_data) {
        return null;
    }
    if (!active_trial){
        active_trial = [];
        active_trial_start = sensor_data.time;
        update_trial();
    } else {
        console.log(active_trial);
        active_trial = null;
    }
}

function update_trial(){
    if (!active_trial) {
        return null;
    }
    let data = structuredClone(sensor_data);
    data.time -= active_trial_start;
    active_trial.push(data);
}

const start_trial_btn = document.getElementById("start-trial-btn");
start_trial_btn.addEventListener("click", toggle_trial);

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