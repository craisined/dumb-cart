// Colors
const bg_color = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
const bg_subtle_color = getComputedStyle(document.documentElement).getPropertyValue('--bg-subtle-color').trim();
const fg_color = getComputedStyle(document.documentElement).getPropertyValue('--fg-color').trim();
const highlight_color = getComputedStyle(document.documentElement).getPropertyValue('--highlight').trim();

const red = "#cd8275";
const green = "#70a97b";
const yellow = "#ac975c";
const blue = "#8396d1";
const purple = "#bf7fb9";
const cyan = "#5ea5b2";

const red_highlight = "#dc9b90";
const green_highlight = "#84bf90";
const yellow_highlight = "#c3ac70";
const blue_highlight = "#9cacdd";
const purple_highlight = "#d099ca";
const cyan_highlight = "#73bbc8";

const highlight = {
    red: red_highlight,
    green: green_highlight,
    yellow: yellow_highlight,
    blue: blue_highlight,
    purple: purple_highlight,
    cyan: cyan_highlight,
}

// Initialize chart
const chart_canvas = document.getElementById('chart');
Chart.defaults.font.family = "'Quicksand', sans-serif";
Chart.defaults.color = fg_color; 
const chart_datasets = {
    datasets: [
        {
            label: 'Force',
            data: [{x:1,y:1}, {x:2,y: 0.5}, {x: 2.5, y: 1}],
            segment: {
                borderColor(ctx){
                    if (selection === null){
                        return blue;
                    }
                    return (selection.min <= ctx.p0.raw.x && ctx.p1.raw.x <= selection.max) ? fg_color : blue;
                }
            },
            pointBorderWidth: 0,
            pointRadius(ctx){
                if (selection === null){
                    return 4;
                }
                return (selection.min <= ctx.raw.x && ctx.raw.x <= selection.max) ? 5 : 4;
            },
            pointBackgroundColor(ctx){
                if (selection === null){
                    return blue;
                }
                return (selection.min <= ctx.raw.x && ctx.raw.x <= selection.max) ? fg_color : blue;
            },
            hoverBackgroundColor: fg_color,
            hoverRadius: 6,
            hoverBorderWidth: 0,
        },
    ],
};
let selection = null;
let pre_drag_limits = null;
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
        },
        zoom: {
            pan: {
                enabled: false,
                mode: 'xy',
            },
            zoom: {
                wheel: {
                    enabled: false,
                },
                drag: {
                    enabled: true,
                    threshold: 1,
                },
                mode: 'x',
                onZoomStart({ chart, event }) {
                    if (!select_mode) {
                        return null;
                    }
                    pre_drag_limits = {
                        min: chart.scales.x.min,
                        max: chart.scales.x.max,
                    };
                    return true;
                },
                onZoomComplete({chart}) {
                    if (pre_drag_limits === null){
                        return null;
                    }
                    selection = {
                        min: chart.scales.x.min,
                        max: chart.scales.x.max,
                    };
                    chart.zoomScale('x', { min: pre_drag_limits.min, max: pre_drag_limits.max });
                    pre_drag_limits = null;
                }
            },
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

//zoom buttons
document.getElementById('zoom-in').addEventListener('click', () => {
    chart.zoom(1.1); 
});

document.getElementById('zoom-out').addEventListener('click', () => {
    chart.zoom(0.9); 
});

document.getElementById('zoom-reset').addEventListener('click', () => {
    chart.resetZoom(); 
});

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
let trials = [];
let active_trial;

function toggle_trial(event){
    if (!sensor_data || !ble_device) {
        return null;
    }
    if (!active_trial){
        active_trial = {
            start_time: sensor_data.time,
            time: [],
            acceleration: [],
            force: [],
            encoder: [],
        };
        update_trial();
        start_trial_btn.classList.remove("bi-play-circle-fill");
        start_trial_btn.classList.add("bi-pause-circle-fill");
    } else {
        add_trial();
        active_trial = null;
        start_trial_btn.classList.remove("bi-pause-circle-fill");
        start_trial_btn.classList.add("bi-play-circle-fill");
    }
}

function update_trial(){
    if (!active_trial) {
        return null;
    }
    let data = structuredClone(sensor_data);
    data.time = (data.time - active_trial.start_time) / 1000;
    ["time", "acceleration", "force", "encoder"].forEach(attribute => {
        active_trial[attribute].push(data[attribute]);
    });
    console.log(get_selected_datasets(active_trial));
    chart.data.datasets = get_selected_datasets(active_trial);
}

const start_trial_btn = document.getElementById("start-trial-btn");
start_trial_btn.addEventListener("click", toggle_trial);

// TODO: x-axis stuff
// Dataset Generation
function get_selected_datasets(trial){
    const checkboxes = document.querySelectorAll('input[name="y-axis"]:checked');
    const selected_vals = Array.from(checkboxes).map(checkbox => checkbox.value);
    const datasets = selected_vals.map(attribute => ({
        label: attribute,
        data: trial.time.map((time, index) => ({x: time, y: trial[attribute][index]})),
    }));
    chart.update()
    return datasets;
}

// Trial section fuckery
let trial_number = 0;
function add_trial(){
    trials.push(active_trial);
    const trials_panel = document.getElementById("trials-panel");
    trials_panel.insertAdjacentHTML("beforeend", `
    <div>
        <h3>Trial ${trial_number}<span class="trial-btns"><input type="checkbox" name="trial" value=${trials_panel} checked><i class="bi bi-x-lg"></i><i class="bi bi-pencil-square"></i></span></h3>
        <label>Cart Mass: <input type="input" name="mass-${trial_number}"> kg</label>
    </div>
    `);
    trial_number++;

}

// Tab switching
const nav_tabs = document.querySelectorAll('.panel-nav-btn');
nav_tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = document.querySelector(tab.dataset.tabTarget);
        const previous_active_tab = document.querySelector('.panel-nav-btn-selected');
        const previous_active_tab_content = document.querySelector('.panel-content-selected');
        if (previous_active_tab) {
            previous_active_tab.classList.remove('panel-nav-btn-selected');
        }
        if (previous_active_tab_content) {
            previous_active_tab_content.classList.remove('panel-content-selected');
        }
        tab.classList.add('panel-nav-btn-selected');
        if (target) {
            target.classList.add('panel-content-selected');
        } else {
            console.error(`Could not find target element matching selector: ${tab.dataset.tabTarget}`);
        }
    });
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

// Selection/pan buttons
let select_mode = true;
const selection_pan_btn = document.getElementById("selection-pan-btn");
selection_pan_btn.addEventListener("click", () => {
    select_mode = !select_mode;
    chart.options.plugins.zoom.pan.enabled = !select_mode;
    chart.options.plugins.zoom.zoom.wheel.enabled = !select_mode;
    chart.options.plugins.zoom.zoom.drag.enabled = select_mode;
    chart.options.plugins.zoom.zoom.mode = select_mode ? 'x' : 'xy';
    chart.update();
    if (select_mode) {
        selection_pan_btn.classList.remove("bi-bounding-box-circles");
        selection_pan_btn.classList.add("bi-arrows-move");
    } else {
        selection_pan_btn.classList.remove("bi-arrows-move");
        selection_pan_btn.classList.add("bi-bounding-box-circles");
    }
});