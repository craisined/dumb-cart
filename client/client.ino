#include <Adafruit_HX711.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2901.h>
#include <BLE2902.h>
#include <Encoder.h>
#include <LSM6DS3.h>
#include <Wire.h>

const float gravity = 9.81;

// accelerometer attaches to I2C slot, load cell attaches to A0/D0 slot, encoder attaches to UART slot
const uint8_t accelerometer_addr = 0x6A;
const uint8_t load_cell_data_pin = D9;
const uint8_t load_cell_clock_pin = D8;
const uint8_t encoder_pin_1 = D3;
const uint8_t encoder_pin_2 = D2;

LSM6DS3 accelerometer(I2C_MODE, accelerometer_addr);
Adafruit_HX711 load_cell(load_cell_data_pin, load_cell_clock_pin);
Encoder encoder(encoder_pin_1, encoder_pin_2);

typedef struct{
    float acceleration;
    float force;
    float encoder_position;
    int time;
} Sensors;
Sensors sensors;

const String service_uuid = "907da526-6f31-42c6-8b17-4fa0c76ad1d7";
const String sensor_characteristic_uuid = "383dfe4a-06d1-49bc-862f-06841d591a7e";
bool device_connected = false;

BLEServer *server_ptr;
BLEService *service_ptr;
BLECharacteristic *sensor_characteristic_ptr;
BLEAdvertising *advertising_ptr;

int last_send = 0;

class CartServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* server_ptr) {
        Serial.println("Device Connected");
        device_connected = true;
    };

    void onDisconnect(BLEServer* server_ptr) {
        Serial.println("Device Disconnected");
        device_connected = false;
        server_ptr->getAdvertising()->start();
    }
};

void begin_sensors(){
    accelerometer.begin();
    load_cell.begin();
    for (uint8_t t=0; t<3; t++) {
        load_cell.tareA(load_cell.readChannelRaw(CHAN_A_GAIN_128));
    }
}

void create_characteristic(BLECharacteristic* &characteristic_ptr, String characteristic_uuid, String description){
    characteristic_ptr = service_ptr->createCharacteristic(
        characteristic_uuid,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    BLE2901 *descriptor_ptr = new BLE2901();
    descriptor_ptr->setDescription(description);
    descriptor_ptr->setAccessPermissions(ESP_GATT_PERM_READ);
    characteristic_ptr->addDescriptor(descriptor_ptr);
    characteristic_ptr->addDescriptor(new BLE2902());
}

void begin_bluetooth(){
    BLEDevice::init("Dumb Cart");
    server_ptr = BLEDevice::createServer();
    server_ptr->setCallbacks(new CartServerCallbacks());
    service_ptr = server_ptr->createService(service_uuid);
    create_characteristic(sensor_characteristic_ptr, sensor_characteristic_uuid, "Sensors");
    service_ptr->start();
    advertising_ptr = BLEDevice::getAdvertising();
    advertising_ptr->addServiceUUID(service_uuid); 
    advertising_ptr->setScanResponse(true);
    BLEDevice::startAdvertising();
}

void update_sensors(){
    sensors.acceleration = accelerometer.readFloatAccelX() * gravity;
    sensors.force = load_cell.readChannelBlocking(CHAN_A_GAIN_128);
    sensors.encoder_position = encoder.read();
    sensors.time = millis();
}

void update_bluetooth(){
    sensor_characteristic_ptr->setValue((uint8_t*)&sensors, sizeof(sensors));
    sensor_characteristic_ptr->notify();
}

void setup() {
    Serial.begin(9600);
    begin_sensors();
    begin_bluetooth();
}

void loop() {
    update_sensors();
    if (millis() - last_send > 50){
        update_bluetooth();
        last_send = millis();
    }
}
