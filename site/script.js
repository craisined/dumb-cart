import { Chart, LineController, LineElement, PointElement, LinearScale, Tooltip } from 'https://cdn.jsdelivr.net/npm/chart.js@4.5.1/+esm';
import chartjsPluginZoom from 'https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@2.2.0/+esm'
import { parse, stringify } from 'https://cdn.jsdelivr.net/npm/@vanillaes/csv@4.1.3/+esm'

Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    Tooltip,
    chartjsPluginZoom,
);

// Colors
const bg_color = getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim();
const bg_subtle_color = getComputedStyle(document.documentElement).getPropertyValue('--bg-subtle-color').trim();
const fg_color = getComputedStyle(document.documentElement).getPropertyValue('--fg-color').trim();
const highlight_color = getComputedStyle(document.documentElement).getPropertyValue('--highlight').trim();

const colors = {
    red: getComputedStyle(document.documentElement).getPropertyValue('--red').trim(),
    green: getComputedStyle(document.documentElement).getPropertyValue('--green').trim(),
    yellow: getComputedStyle(document.documentElement).getPropertyValue('--yellow').trim(),
    blue: getComputedStyle(document.documentElement).getPropertyValue('--blue').trim(),
    purple: getComputedStyle(document.documentElement).getPropertyValue('--purple').trim(),
    cyan: getComputedStyle(document.documentElement).getPropertyValue('--cyan').trim(),
}

const dataset_color = {
    "acceleration": colors.red,
    "force": colors.green,
    "encoder": colors.blue,
}

// Initialize chart
const chart_canvas = document.getElementById('chart');
Chart.defaults.color = fg_color;
function color_point(ctx) {
    const dataset = ctx.chart.data.datasets[ctx.datasetIndex];
    const color = dataset_color[dataset.label];
    if (selection === null) { return color; }
    return (selection.min <= ctx.raw.x && ctx.raw.x <= selection.max) ? fg_color : color;
}
function color_line(ctx) {
    const dataset = ctx.chart.data.datasets[ctx.datasetIndex];
    const color = dataset_color[dataset.label];
    if (selection === null) { return color; }
    return (selection.min <= ctx.p0.raw.x && ctx.p1.raw.x <= selection.max) ? fg_color : color;
}
function size_point(ctx) {
    if (selection === null) { return 4; }
    return (selection.min <= ctx.raw.x && ctx.raw.x <= selection.max) ? 5 : 4;
}
function zoom_start({ chart, event }) {
    if (!select_mode) { return null; }
    pre_drag_limits = {
        min: chart.scales.x.min,
        max: chart.scales.x.max,
    };
    return true;
}
function zoom_complete({ chart }) {
    if (!pre_drag_limits) { return null; }
    selection = {
        min: chart.scales.x.min,
        max: chart.scales.x.max,
    };
    chart.zoomScale('x', { min: pre_drag_limits.min, max: pre_drag_limits.max });
    pre_drag_limits = null;
    update_selection_table();
}
Chart.defaults.datasets.line = {
    ...Chart.defaults.datasets.line,
    segment: { borderColor: color_line },
    pointBackgroundColor: color_point,
    pointBorderWidth: 0,
    pointRadius: size_point,
    hoverBackgroundColor: fg_color,
    hoverRadius: 6,
    hoverBorderWidth: 0,
}
Chart.defaults.font.family = "'Quicksand', sans-serif";
Chart.defaults.scales.linear = {
    ...Chart.defaults.scales.linear,
    beginAtZero: true,
    border: { color: fg_color },
    grid: { color: bg_subtle_color },
};

let selection = null;
let pre_drag_limits = null;
function label_content(ctx) {
    return [`${get_x()}: ${ctx.raw.x}`, `${ctx.dataset.label}: ${ctx.raw.y}`];
}
const chart_options = {
    animation: false,
    layout: { padding: 16 },
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        title: { display: false },
        zoom: {
            pan: {
                enabled: false,
                mode: 'xy',
            },
            zoom: {
                wheel: { enabled: false },
                drag: { enabled: true },
                mode: 'x',
                onZoomStart: zoom_start,
                onZoomComplete: zoom_complete,
            },
        },
        tooltip: {
            enabled: true,
            backgroundColor: bg_subtle_color,
            callbacks: {
                label: label_content,
                title: () => '',
            },
            displayColors: false,
        },
    },
    responsive: true,
    scales: {
        x: { type: 'linear' },
        y: { type: 'linear' }
    },
};
let chart = new Chart(chart_canvas, {
    type: "line",
    options: chart_options
})

// Zoom buttons
document.getElementById('zoom-in').addEventListener('click', () => {
    chart.options.plugins.zoom.zoom.mode = 'xy';
    chart.zoom(1.1);
    chart.options.plugins.zoom.zoom.mode = select_mode ? 'x' : 'xy';
});

document.getElementById('zoom-out').addEventListener('click', () => {
    chart.options.plugins.zoom.zoom.mode = 'xy';
    chart.zoom(0.9);
    chart.options.plugins.zoom.zoom.mode = select_mode ? 'x' : 'xy';
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

function handle_characteristic_change(event) {
    let buffer = event.target.value.buffer;
    let sensor_dataview = new DataView(buffer);
    let offset = 0;
    sensor_data = {
        acceleration: sensor_dataview.getFloat32(offset, true),
        force: sensor_dataview.getFloat32(offset += 4, true),
        encoder: sensor_dataview.getFloat32(offset += 4, true),
        time: sensor_dataview.getInt32(offset += 4, true),
    }
    update_active_trial();
}

async function connect_cart(event) {
    if (!navigator.bluetooth) {
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
    ble_device.addEventListener('gattserverdisconnected', on_disconnect);
    console.log("Connected! Device: ", ble_device.name);
}

async function disconnect_cart(event) {
    if (!ble_device || !ble_device.gatt.connected) {
        console.log("Already disconnected!");
        return null;
    }
    ble_device.gatt.disconnect();
}

function on_disconnect(event) {
    if (active_trial) {
        end_trial();
    }
    ble_device = null;
    sensor_data = null;
    console.log("Disconnected!");
}

const connect_btn = document.getElementById("connect-btn");
const disconnect_btn = document.getElementById("disconnect-btn");
connect_btn.addEventListener("click", connect_cart);
disconnect_btn.addEventListener("click", disconnect_cart);

// Selection
function get_selected_points(trials) {
    const checkboxes = document.querySelectorAll('input[name="y-axis"]:checked');
    const selected_attributes = Array.from(checkboxes).map(checkbox => checkbox.value);

    let points = [];
    let names = [];
    let attributes = [];

    if (selection === null) {return [0, [], [], []]};

    for (const trial of trials) {
        for (const attribute of selected_attributes) {
            points.push(
                trial[get_x()].map((value, index) => ({ x: value, y: trial[attribute][index] })).filter(point => selection.min <= point.x && point.x <= selection.max)
            );
            names.push(trial.name);
            attributes.push(attribute);
        }
    }
    return [trials.length * selected_attributes.length, points, names, attributes];
}

function trial_min(trial) {
    return Math.min(...trial.map(point => point.y));
}

function trial_max(trial) {
    return Math.max(...trial.map(point => point.y));
}

function trial_mean(trial) {
    return trial_area(trial) / (trial[trial.length - 1].x - trial[0].x);
}

function trial_median(trial) {
    let sorted_points = trial.map(point => point.y);
    sorted_points.sort();
    let weight_target = trial[trial.length - 1].x - trial[0].x;
    let current_weight = 0;
    for (let i = 0; i < trial.length - 1; i++) {
        current_weight += trial[i + 1].x - trial[i].x;
        if (current_weight >= weight_target) {
            return trial[i].y
        }
    }
    return trial[trial.length - 1].y;
}

function trial_area(trial) {
    let area = 0;
    for (let i = 0; i < trial.length - 1; i++) {
        area += (trial[i].y + trial[i + 1].y) * (0.5 * (trial[i + 1].x - trial[i].x));
    }
    return area;    
}

function update_selection_table() {
    const table_body = document.querySelector('#selection-table > tbody');
    table_body.replaceChildren();
    let [n, trial_data, trial_names, attributes] = get_selected_points(get_visible_trials());
    for (let i = 0; i < n; i++) {
        if (trial_data[i].length == 0) {
            continue;
        }
        let new_row = table_body.insertRow(-1);
        [
            trial_names[i],
            attributes[i],
            trial_min(trial_data[i]), 
            trial_max(trial_data[i]),
            trial_mean(trial_data[i]),
            trial_median(trial_data[i]),
            trial_area(trial_data[i])
        ].forEach((value, col) => {
            let cell = new_row.insertCell(col);
            cell.textContent = value;
        });
    }
}

// Trials
let trials = {};
let visible_trials = [];

function get_x() {
    return document.querySelector('input[name="x-axis"]:checked').value;
}

function get_visible_trials() {
    const checkboxes = document.querySelectorAll('input[name="trials"]:checked');
    const trial_indexes = Array.from(checkboxes).map(checkbox => checkbox.value);
    const visible_trials = trial_indexes.map(index => trials[parseInt(index)]);
    return visible_trials;
}

function get_selected_datasets(trials) {
    const checkboxes = document.querySelectorAll('input[name="y-axis"]:checked');
    const attributes = Array.from(checkboxes).map(checkbox => checkbox.value);
    let datasets = [];
    trials.forEach(trial => {
        attributes.forEach(attribute => {
            datasets.push({
                label: attribute,
                data: trial[get_x()].map((value, index) => ({ x: value, y: trial[attribute][index] })),
                pointStyle: trial.shape,
            });
        });
    });
    return datasets;
}

function update_selected_trials() {
    if (!active_trial) {
        chart.data.datasets = get_selected_datasets(get_visible_trials());
        chart.update();
        update_selection_table();
    }
}
document.querySelectorAll('input[name="x-axis"], input[name="y-axis"]').forEach(checkbox => {
    checkbox.addEventListener('change', update_selected_trials);
});

// Active trial
let active_trial;
let start_time;
let start_encoder;
let trial_number = 0;

const trial_shapes = ['circle', 'rect', 'triangle'];

function toggle_active_trial(event) {
    if (!sensor_data || !ble_device) { return null; }
    if (!active_trial) {
        chart.resetZoom();
        active_trial = {
            time: [],
            acceleration: [],
            force: [],
            encoder: [],
            name: `Trial ${trial_number + 1}`,
            shape: trial_shapes[trial_number % trial_shapes.length],
            mass: 0.1,
            number: trial_number,
        };
        trial_number++;
        start_time = sensor_data.time;
        start_encoder = sensor_data.encoder;
        update_active_trial();
    } else {
        end_trial();
    }
    start_trial_btn.classList.remove(active_trial ? "bi-play-circle-fill" : "bi-pause-circle-fill");
    start_trial_btn.classList.add(active_trial ? "bi-pause-circle-fill" : "bi-play-circle-fill");
}

const start_trial_btn = document.getElementById("start-trial-btn");
start_trial_btn.addEventListener("click", toggle_active_trial);

function update_active_trial() {
    if (!active_trial) { return null; }
    let data = {
        time: (sensor_data.time - start_time) / 1000,
        acceleration: sensor_data.acceleration,
        force: sensor_data.force,
        encoder: sensor_data.encoder - start_encoder,
    };
    Object.entries(data).forEach(([attribute, value]) => {
        active_trial[attribute].push(value);
    });
    chart.data.datasets = get_selected_datasets([active_trial]);
    chart.update();
}

const trial_icons = ['bi-circle-fill', 'bi-square-fill', 'bi-triangle-fill'];
function create_trial_html(trial_number) {
    const container_div = document.createElement('div');
    container_div.id = `trial-${trial_number}-container`;
    const header_h3 = document.createElement('h3');
    const header_span = document.createElement('span');
    header_span.id = `trial-${trial_number}-header`;
    header_span.textContent = trials[trial_number].name;
    const btn_span = document.createElement('span');
    btn_span.className = 'trial-btns';
    const header_icon = document.createElement('i');
    header_icon.className = `bi ${trial_icons[trial_number % trial_icons.length]}`;
    const checkbox_input = document.createElement('input');
    checkbox_input.type = 'checkbox';
    checkbox_input.name = 'trials';
    checkbox_input.value = trial_number;
    checkbox_input.checked = true;
    checkbox_input.addEventListener('change', update_selected_trials);
    const edit_icon = document.createElement('i');
    edit_icon.className = 'bi bi-pencil-square';
    edit_icon.id = `rename-trial-${trial_number}`;
    function edit_icon_event() {
        const new_name = prompt(`Rename ${trials[trial_number].name}:`);
        trials[trial_number].name = new_name;
        document.getElementById(`trial-${trial_number}-header`).innerText = new_name;
    }
    edit_icon.addEventListener('click', edit_icon_event);
    const delete_icon = document.createElement('i');
    delete_icon.className = 'bi bi-x-lg';
    delete_icon.id = `delete-trial-${trial_number}`;
    function delete_icon_event() {
        delete trials[trial_number];
        document.getElementById(`trial-${trial_number}-container`).remove();
        update_selected_trials();
    }
    delete_icon.addEventListener('click', delete_icon_event);
    const mass_label = document.createElement('label');
    mass_label.textContent = 'Cart Mass: ';
    const mass_input = document.createElement('input');
    mass_input.type = 'number';
    mass_input.step = 'any';
    mass_input.name = `mass-${trial_number}`;
    mass_input.value = trials[trial_number].mass;
    function change_mass_event(event) {
        let mass = event.target.valueAsNumber;
        if (Number.isNaN(mass)) { return null; }
        trials[trial_number].mass = mass;
        console.log(trials[trial_number]);
        update_selected_trials();
    }
    mass_input.addEventListener('change', change_mass_event);
    const kg_text = document.createTextNode(' kg');
    btn_span.append(header_icon, checkbox_input, edit_icon, delete_icon);
    header_h3.append(header_span, btn_span);
    mass_label.append(mass_input, kg_text);
    container_div.append(header_h3, mass_label);
    return container_div;
}

function end_trial() {
    trials[active_trial.number] = active_trial;
    const trials_section = document.getElementById("trials-section");
    trials_section.prepend(create_trial_html(active_trial.number));
    active_trial = null;
    update_selected_trials();
}

// Tab switching
const nav_tabs = document.querySelectorAll('.panel-nav-btn');
nav_tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const previous_active_tab_content = document.querySelector('.panel-content-selected');
        const previous_active_tab = document.querySelector('.panel-nav-btn-selected');
        const target = document.querySelector(tab.dataset.tabTarget);
        previous_active_tab_content.classList.remove('panel-content-selected');
        previous_active_tab.classList.remove('panel-nav-btn-selected');
        target.classList.add('panel-content-selected');
        tab.classList.add('panel-nav-btn-selected');
    });
});

// Export image
document.getElementById('export-btn').addEventListener('click', () => {
    const format = document.getElementById('export-format').value;
    if (format === 'png' || format === 'jpeg') { export_image(format); }
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
    selection_pan_btn.classList.remove(select_mode ? "bi-bounding-box-circles" : "bi-arrows-move");
    selection_pan_btn.classList.add(select_mode ? "bi-arrows-move" : "bi-bounding-box-circles");
    chart.options.plugins.zoom.pan.enabled = !select_mode;
    chart.options.plugins.zoom.zoom.wheel.enabled = !select_mode;
    chart.options.plugins.zoom.zoom.drag.enabled = select_mode;
    chart.options.plugins.zoom.zoom.mode = select_mode ? 'x' : 'xy';
    chart.update();
});