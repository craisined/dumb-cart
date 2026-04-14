const els = {
	serviceUuid: document.getElementById("serviceUuid"),
	characteristicUuid: document.getElementById("characteristicUuid"),
	deviceName: document.getElementById("deviceName"),
	namePrefix: document.getElementById("namePrefix"),
	writeText: document.getElementById("writeText"),
	connectBtn: document.getElementById("connectBtn"),
	disconnectBtn: document.getElementById("disconnectBtn"),
	readBtn: document.getElementById("readBtn"),
	writeBtn: document.getElementById("writeBtn"),
	notifyBtn: document.getElementById("notifyBtn"),
	stopNotifyBtn: document.getElementById("stopNotifyBtn"),
	clearLogBtn: document.getElementById("clearLogBtn"),
	status: document.getElementById("status"),
	logs: document.getElementById("logs"),
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

let device = null;
let server = null;
let service = null;
let characteristic = null;
let notificationsEnabled = false;

function now() {
	return new Date().toLocaleTimeString();
}

function appendLog(message) {
	els.logs.textContent += `[${now()}] ${message}\n`;
	els.logs.scrollTop = els.logs.scrollHeight;
}

function setStatus(message, type = "") {
	els.status.textContent = `Status: ${message}`;
	els.status.className = `status ${type}`.trim();
}

function assertWebBluetoothSupported() {
	if (!navigator.bluetooth) {
		throw new Error("Web Bluetooth is not available in this browser/context.");
	}
}

function buildRequestOptions() {
	const serviceUuid = els.serviceUuid.value.trim();
	const deviceName = els.deviceName.value.trim();
	const namePrefix = els.namePrefix.value.trim();

	if (!serviceUuid) {
		throw new Error("Service UUID is required.");
	}

	const filters = [];

	if (deviceName) {
		filters.push({ name: deviceName });
	}

	if (namePrefix) {
		filters.push({ namePrefix });
	}

	if (filters.length === 0) {
		// Filter by service if no name/namePrefix was provided.
		filters.push({ services: [serviceUuid] });
	}

	return {
		filters,
		optionalServices: [serviceUuid],
	};
}

function parseDataView(dataView) {
	const bytes = new Uint8Array(dataView.buffer, dataView.byteOffset, dataView.byteLength);
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(" ");
	let text = "";

	try {
		text = textDecoder.decode(bytes);
	} catch (err) {
		text = `<decode error: ${err.message}>`;
	}

	return { hex, text };
}

function onDisconnected() {
	appendLog("Device disconnected");
	setStatus("disconnected", "err");
	notificationsEnabled = false;
	server = null;
	service = null;
	characteristic = null;
}

async function ensureCharacteristic() {
	if (!characteristic) {
		throw new Error("Not connected. Press Connect first.");
	}

	return characteristic;
}

async function connect() {
	assertWebBluetoothSupported();

	const serviceUuid = els.serviceUuid.value.trim();
	const characteristicUuid = els.characteristicUuid.value.trim();

	if (!serviceUuid || !characteristicUuid) {
		throw new Error("Service UUID and Characteristic UUID are required.");
	}

	setStatus("requesting device...");
	const options = buildRequestOptions();
	appendLog(`Request options: ${JSON.stringify(options)}`);

	device = await navigator.bluetooth.requestDevice(options);
	appendLog(`Selected device: ${device.name || "<unnamed>"}`);
	device.addEventListener("gattserverdisconnected", onDisconnected);

	setStatus("connecting...");
	server = await device.gatt.connect();

	setStatus("discovering service/characteristic...");
	service = await server.getPrimaryService(serviceUuid);
	characteristic = await service.getCharacteristic(characteristicUuid);

	setStatus("connected", "ok");
	appendLog("Connected and characteristic ready");
}

async function disconnect() {
	if (device?.gatt?.connected) {
		device.gatt.disconnect();
	} else {
		setStatus("already disconnected");
	}
}

async function readValue() {
	const chr = await ensureCharacteristic();
	const data = await chr.readValue();
	const parsed = parseDataView(data);
	appendLog(`Read text: ${parsed.text}`);
	appendLog(`Read hex:  ${parsed.hex}`);
}

async function writeValue() {
	const chr = await ensureCharacteristic();
	const payload = els.writeText.value;
	const bytes = textEncoder.encode(payload);

	await chr.writeValue(bytes);
	appendLog(`Write text: ${payload}`);
	appendLog(`Write hex:  ${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(" ")}`);
}

function handleCharacteristicChanged(event) {
	const data = event.target.value;
	const parsed = parseDataView(data);
	appendLog(`Notify text: ${parsed.text}`);
	appendLog(`Notify hex:  ${parsed.hex}`);
}

async function startNotify() {
	const chr = await ensureCharacteristic();

	if (notificationsEnabled) {
		appendLog("Notifications are already enabled");
		return;
	}

	await chr.startNotifications();
	chr.addEventListener("characteristicvaluechanged", handleCharacteristicChanged);
	notificationsEnabled = true;
	appendLog("Notifications started");
}

async function stopNotify() {
	const chr = await ensureCharacteristic();

	if (!notificationsEnabled) {
		appendLog("Notifications are not active");
		return;
	}

	await chr.stopNotifications();
	chr.removeEventListener("characteristicvaluechanged", handleCharacteristicChanged);
	notificationsEnabled = false;
	appendLog("Notifications stopped");
}

async function withUiErrorHandling(action, label) {
	try {
		await action();
	} catch (err) {
		console.error(err);
		setStatus(`${label} failed`, "err");
		appendLog(`${label} failed: ${err.message || err}`);
	}
}

els.connectBtn.addEventListener("click", () => withUiErrorHandling(connect, "Connect"));
els.disconnectBtn.addEventListener("click", () => withUiErrorHandling(disconnect, "Disconnect"));
els.readBtn.addEventListener("click", () => withUiErrorHandling(readValue, "Read"));
els.writeBtn.addEventListener("click", () => withUiErrorHandling(writeValue, "Write"));
els.notifyBtn.addEventListener("click", () => withUiErrorHandling(startNotify, "Start notify"));
els.stopNotifyBtn.addEventListener("click", () => withUiErrorHandling(stopNotify, "Stop notify"));
els.clearLogBtn.addEventListener("click", () => {
	els.logs.textContent = "";
});

setStatus("idle");
appendLog("Ready. Click Connect to pair with a BLE peripheral.");
