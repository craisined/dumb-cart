#include <BLEDevice.h>

const String serivce_uuid = "ae936f5c-108b-4eb4-a5f6-fc979626e073";
const String characteristic_uuid = "5d43ca63-8167-45a9-b697-e28945b6399c";

void setup() {
    Serial.begin(9600);
}

void loop() {
    Serial.println("Hello world");
}