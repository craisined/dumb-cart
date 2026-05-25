#include <LSM6DS3.h>
#include <Wire.h>
#include <Encoder.h>
#include <Adafruit_HX711.h>
#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>

const float gravity = 9.81;
const int tick_circumference = 1;

// accelerometer attaches to I2C slot, load cell attaches to A0/D0 slot, encoder attaches to UART slot
const uint8_t accelerometer_addr = 0x6A;
const uint8_t load_cell_data_pin = D0;
const uint8_t load_cell_clock_pin = D1;
const uint8_t encoder_pin_1 = D7; // pins switched here bc of silly
const uint8_t encoder_pin_2 = D6;

LSM6DS3 accelerometer(I2C_MODE, accelerometer_addr);
Adafruit_HX711 load_cell(load_cell_data_pin, load_cell_clock_pin);
Encoder encoder(encoder_pin_1, encoder_pin_2);

const String service_uuid = "907da526-6f31-42c6-8b17-4fa0c76ad1d7";
const String characteristic_uuid = "b05f71fc-c06c-47b0-ad5c-623db0469d4d";

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

float get_encoder_pos(){
  return encoder.read();
}

void begin_bluetooth(){
    BLEDevice::init("Dumb Cart");
    BLEServer *pServer = BLEDevice::createServer();
    BLEService *pService = pServer->createService(service_uuid);
    BLECharacteristic *pCharacteristic = pService->createCharacteristic(
        characteristic_uuid,
        BLECharacteristic::PROPERTY_READ
    );
    pCharacteristic->setValue("Hello World");
    pService->start();

    BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
    pAdvertising->addServiceUUID(service_uuid); 
    pAdvertising->setScanResponse(true);
    BLEDevice::startAdvertising();
}

void setup() {
    Serial.begin(9600);
    begin_sensors();
    begin_bluetooth();
}

void loop() {
    Serial.println(get_force());
    Serial.println(get_acceleration());
}
