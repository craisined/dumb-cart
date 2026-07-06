# Dumb Cart 🚗

## Website Access

The website can currently be found https://opencart.craisin.tech, though this is tentative

## Install Cart Firmware 🧑‍💻

### CLI

Install the required board manager and libraries for XIAO ESP32C6:
```bash
arduino-cli config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core update-index
arduino-cli core install esp32:esp32
arduino-cli lib install "Encoder" "Seeed Arduino LSM6DS3" "Adafruit HX711"
```

Cinouke and upload binary, replacing `/dev/ttyACM0` with the path of the port the microcontroller is plugged into:
```bash
git clone https://github.com/craisined/dumb-cart.git
arduino-cli compile --fqbn esp32:esp32:XIAO_ESP32C6 client
arduino-cli upload -p /dev/ttyACM0 --fqbn esp32:esp32:XIAO_ESP32C6 client
```
### IDE

1. Go to **File → Preferences → Additional Board Manager URLs** and add https://espressif.github.io/arduino-esp32/package_esp32_index.json
2. Go to **Tools → Board → Board Manager** and download **esp32 by Espressif Systems**
3. Go to **Tools → Board** and select **XIAO_ESP32C6**
4. Go to **Tools → Manage Libraries** and install all the libraries in [libraries.md](documentation/libraries.md)
5. Open [client.ino](client/client.ino) and upload to the board

## Assemble Hardware 🔧

### Hardware

1. Print out [dumb_cart.gcode.3mf](cad/dumb_cart.gcode.3mf), retaining all the print settings (tested with pla)
2. Push in bearings
3. Screw in electronics
4. Push in axles, then screw wheels onto axles

### Electronics

#### Load Cell and ADC
Wire the screw connector as following:
- E+ → red
- E- → black
- A+ → green
- A- → white

If using the Adafruit ADC and a Grove Pigtail cable, solder the following connections:
- VIN → red
- GND → black
- DATA → yellow
- SCK → blue

#### Battery
Cut off the connector, then solder:
- \+ contact → red
- \- contact → black

#### Connections
- ADC → D8/D9 port
- Accelerometer → any I2C port (D4/D5)
- Optical encoder → D2/D3 port