# Dumb Cart 🚗

## Install Cart Firmware 🧑‍💻

### CLI

Install the required board manager for XIAO ESP32C6:
```bash
arduino-cli config add board_manager.additional_urls https://espressif.github.io/arduino-esp32/package_esp32_index.json
arduino-cli core update-index
arduino-cli core install esp32:esp32
```

Upload precompiled binary, replacing `/dev/ttyACM0` with the path of the port the microcontroller is plugged into:
```bash
git clone https://github.com/craisined/dumb-cart.git
arduino-cli upload -p /dev/ttyACM0 --fqbn esp32:esp32:XIAO_ESP32C6 --input-file client/client.bin
```
### IDE

1. Go to **File → Preferences → Additional Board Manager URLs** and add https://espressif.github.io/arduino-esp32/package_esp32_index.json
2. Go to **Tools → Board → Board Manager** and download **esp32 by Espressif Systems**
3. Go to **Tools → Board** and select **XIAO_ESP32C6**
4. Go to **Tools → Manage Libraries** and install all the libraries in [libraries.md](documentation/libraries.md)
5. Open [client.ino](client/client.ino) and upload to the board

## Assemble Hardware 🔧

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
- ADC → D0/D1 port
- Accelerometer → any I2C port (print is modeled to be connected with the D4/D5 port)
- Optical encoder → D6/D7 port