import SelectDragPlugin from '@01coder/chartjs-plugin-selectdrag';
Chart.register(SelectDragPlugin);

// Colors
const bg_color = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
const bg_subtle_color = getComputedStyle(document.documentElement).getPropertyValue('--bg-subtle-color').trim();
const fg_color = getComputedStyle(document.documentElement).getPropertyValue('--fg-color').trim();
const highlight_color = getComputedStyle(document.documentElement).getPropertyValue('--highlight').trim();

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
        },
        selectdrag: {
            enabled: true,
            output: 'value',
            onSelectComplete: (event) => {
                console.log('Selected range:', event.range);
                console.log('Selection bounding box:', event.boundingBox);
            },
            colors: {
                selection: bg_subtle_color + "4D",
            },
        },
        zoom: {
            pan: {
                enabled: true,
                modifierKey: 'shift',
                mode: 'xy',
            },
            zoom: {
                wheel: {
                    enabled: true,
                },
                mode: 'xy',
            }
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

//mouse selection