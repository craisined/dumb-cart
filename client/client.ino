#include "LSM6DS3.h"
#include "Wire.h"
#include "Encoder.h"
#include "Adafruit_HX711.h"

const float gravity = 9.81;
const int tick_circumference = 1;

const accelerometer_addr = 0x6A;
LSM6DS3 accelerometer(I2C_MODE, accelerometer_addr);

// Pins not accurate yet
const uint8_t load_cell_data_pin = 0;
const uint8_t load_cell_clock_pin = 1;
Adafruit_HX711 load_cell(load_cell_data_pin, load_cell_clock_pin);


// Pins not accurate yet
const uint8_t encoder_pin_1 = 0;
const uint8_t encoder_pin_2 = 1;
Encoder encoder(pin1, pin2);

void setup() {
    Serial.begin(9600);
    accelerometer.begin();
    load_cell.begin();
}

float get_x_acceleration(){
    return accelerometer.readFloatAccelX() * gravity;
}

float get_force(){
    return 0.1;
}

float get_encoder_pos(){
    return myEnc.read();
}

void loop() {
    Serial.print(get_x_acceleration());
    Serial.println(" m/s");

    Serial.print(get_force());
    Serial.println(" N");

    Serial.print(get_encoder_pos());
    Serial.println(" ticks");
}