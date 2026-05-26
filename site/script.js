const service_uuid = "907da526-6f31-42c6-8b17-4fa0c76ad1d7";
const characteristic_uuid = "383dfe4a-06d1-49bc-862f-06841d591a7e";

const connect_btn = document.getElementById("connect");

let ble_server;
let ble_service;
let ble_sensor_characteristic;

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
    let dataview = new DataView(buffer);
    let offset = 0;
    let sensors = {
        acceleration: dataview.getFloat32(offset, true),
        force: dataview.getFloat32(offset += 4, true),
        encoder: dataview.getFloat32(offset += 4, true),
        time: dataview.getInt32(offset += 4, true)
    };
    console.log(sensors);
}

async function connect(event){
    if (!web_bluetooth_enabled()){
        return null;
    }
    const device = await navigator.bluetooth.requestDevice({
        filters: [{name: "Dumb Cart"}],
        optionalServices: [service_uuid]
    })
    console.log("Device: ", device.name);
    const ble_server = await device.gatt.connect();
    const ble_service = await ble_server.getPrimaryService(service_uuid);
    const ble_sensor_characteristic = await ble_service.getCharacteristic(characteristic_uuid);
    ble_sensor_characteristic.startNotifications();
    ble_sensor_characteristic.addEventListener('characteristicvaluechanged', handle_characteristic_change);
    console.log("Connected!");
}

connect_btn.addEventListener("click", connect);