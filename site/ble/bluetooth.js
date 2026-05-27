const service_uuid = "907da526-6f31-42c6-8b17-4fa0c76ad1d7";
const characteristic_uuid = "383dfe4a-06d1-49bc-862f-06841d591a7e";

const connect_btn = document.getElementById("connect");
const disconnect_btn = document.getElementById("disconnect");

const ctx = document.getElementById("chart");

let ble_server;
let ble_service;
let ble_sensor_characteristic;

let sensor_data = {
    acceleration: [],
    force: [],
    encoder: [],
    time: [],
};

let datasets = {
    datasets: [
        {
            label: 'Force',
            data: []
        },
    ],
};

let options = {
    responsive: true,
    scales: {
        x: {
            type: 'linear',
            position: 'bottom'
        }
    },
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: true,
            text: 'Chart.js Line Chart'
        }
    }
};

let chart = new Chart(ctx, {
    type: "line",
    data: datasets,
    options: options
})

function web_bluetooth_enabled(){
    if (navigator.bluetooth){
        console.log("Bluetooth enabled!");
        return true;
    }
    console.log("Bluetooth disabled");
    return false;
}

function handle_characteristic_change(event){
    let buffer = event.target.value.buffer;
    let sensor_dataview = new DataView(buffer);
    let offset = 0;
    let acceleration = sensor_dataview.getFloat32(offset, true);
    let force = sensor_dataview.getFloat32(offset += 4, true);
    let encoder = sensor_dataview.getFloat32(offset += 4, true);
    let time = sensor_dataview.getInt32(offset += 4, true);
    sensor_data.acceleration.push(acceleration);
    sensor_data.force.push(force);
    sensor_data.encoder.push(encoder);
    sensor_data.time.push(time);
    chart.data.datasets[0].data.push({x: time, y: force});
    chart.update();
}

async function connect(event){
    if (!web_bluetooth_enabled()){
        return null;
    }
    const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [service_uuid] }],
    })
    console.log("Device: ", device.name);
    const ble_server = await device.gatt.connect();
    const ble_service = await ble_server.getPrimaryService(service_uuid);
    const ble_sensor_characteristic = await ble_service.getCharacteristic(characteristic_uuid);
    ble_sensor_characteristic.startNotifications();
    ble_sensor_characteristic.addEventListener('characteristicvaluechanged', handle_characteristic_change);
    console.log("Connected!");
}

async function disconnect(event){
    if (!ble_server || !ble_server.connected){
        return null;
    }
    ble_server.disconnect();
}

connect_btn.addEventListener("click", connect);
disconnect_btn.addEventListener("click", disconnect);