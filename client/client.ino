#include "LSM6DS3.h"
#include "Wire.h"
#include "Encoder.h"
#include "Adafruit_HX711.h"

const float gravity = 9.81;
const int tick_circumference = 1;

class Sensors{

    //Pins not updated
    const uint8_t accelerometer_addr = 0x6A;
    const uint8_t load_cell_data_pin = 0;
    const uint8_t load_cell_clock_pin = 1;
    const uint8_t encoder_pin_1 = 0;
    const uint8_t encoder_pin_2 = 1;

    LSM6DS3 accelerometer(I2C_MODE, accelerometer_addr);
    Adafruit_HX711 load_cell(load_cell_data_pin, load_cell_clock_pin);
    Encoder encoder(encoder_pin_1, encoder_pin_2);

public:
    void begin(){
        this.accelerometer.begin();
        this.load_cell.begin();
        for (uint8_t t=0; t<3; t++) {
            this.load_cell.tareA(this.load_cell.readChannelRaw(CHAN_A_GAIN_128));
        }
    }

    float get_acceleration(){
        return this.accelerometer.readFloatAccelX() * gravity;
    }

    float get_force(){
        return this.load_cell.readChannelBlocking(CHAN_A_GAIN_128);
    }

    float get_encoder_pos(){
        return this.encoder.read();
    }

};

Sensors sensors();

void setup() {
    Serial.begin(9600);
    sensors.begin();

}

void loop() {
}