#include <LSM6DS3.h>
#include <Wire.h>
#include <Encoder.h>
#include <Adafruit_HX711.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2901.h>
#include <BLE2904.h>

const float gravity = 9.81;
const float tick_circumference = 1;

// accelerometer attaches to I2C slot, load cell attaches to A0/D0 slot, encoder attaches to UART slot
const uint8_t accelerometer_addr = 0x6A;
const uint8_t load_cell_data_pin = D0; // pins switched here bc of silly
const uint8_t load_cell_clock_pin = D1;
const uint8_t encoder_pin_1 = D7;
const uint8_t encoder_pin_2 = D6;

LSM6DS3 accelerometer(I2C_MODE, accelerometer_addr);
Adafruit_HX711 load_cell(load_cell_data_pin, load_cell_clock_pin);
Encoder encoder(encoder_pin_1, encoder_pin_2);

float acceleration;
float force;
float encoder_position;

const String service_uuid = "907da526-6f31-42c6-8b17-4fa0c76ad1d7";
const String acceleration_characteristic_uuid = "383dfe4a-06d1-49bc-862f-06841d591a7e";
const String force_characteristic_uuid = "b05f71fc-c06c-47b0-ad5c-623db0469d4d";
const String encoder_characteristic_uuid = "577f7a22-9108-418e-9421-68d99ea21778";
bool device_connected = false;

BLEServer *server_ptr;
BLEService *service_ptr;
BLECharacteristic *acceleration_characteristic_ptr;
BLECharacteristic *force_characteristic_ptr;
BLECharacteristic *encoder_characteristic_ptr;
BLEAdvertising *advertising_ptr;

const uint8_t newtons_ble_code = 0x2723;
const uint8_t unitless_ble_code = 0x2700;

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

float get_acceleration(){
  return accelerometer.readFloatAccelX() * gravity;
}

float get_force(){
  return load_cell.readChannelBlocking(CHAN_A_GAIN_128);
}

float get_encoder_position(){
  return encoder.read();
}

void create_characteristic(BLECharacteristic* &characteristic_ptr, String characteristic_uuid, String description, uint8_t units){
    characteristic_ptr = service_ptr->createCharacteristic(
        characteristic_uuid,
        BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_NOTIFY
    );
    BLE2901 *descriptor_ptr = new BLE2901();
    descriptor_ptr->setDescription(description);
    descriptor_ptr->setAccessPermissions(ESP_GATT_PERM_READ);
    characteristic_ptr->addDescriptor(descriptor_ptr);

    BLE2904 *presentation_ptr = new BLE2904();
    presentation_ptr->setFormat(BLE2904::FORMAT_FLOAT32);
    presentation_ptr->setUnit(units);
    characteristic_ptr->addDescriptor(presentation_ptr);
}

void begin_bluetooth(){
    BLEDevice::init("Dumb Cart");
    server_ptr = BLEDevice::createServer();
    server_ptr->setCallbacks(new CartServerCallbacks());
    service_ptr = server_ptr->createService(service_uuid);
    create_characteristic(acceleration_characteristic_ptr, acceleration_characteristic_uuid, "Acceleration (x)", unitless_ble_code);
    create_characteristic(force_characteristic_ptr, force_characteristic_uuid, "Force", newtons_ble_code);
    create_characteristic(encoder_characteristic_ptr, encoder_characteristic_uuid, "Encoder Position", unitless_ble_code);
    service_ptr->start();
    advertising_ptr = BLEDevice::getAdvertising();
    advertising_ptr->addServiceUUID(service_uuid); 
    advertising_ptr->setScanResponse(true);
    BLEDevice::startAdvertising();
}

void update_sensors(){
    acceleration = get_acceleration();
    force = get_force();
    encoder_position = get_encoder_position();
}

void update_bluetooth(){
    acceleration_characteristic_ptr->setValue((uint8_t*)&acceleration, 4);
    force_characteristic_ptr->setValue((uint8_t*)&force, 4);
    encoder_characteristic_ptr->setValue((uint8_t*)&encoder_position, 4);
    acceleration_characteristic_ptr->notify();
    force_characteristic_ptr->notify();
    encoder_characteristic_ptr->notify();
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
    }
}
