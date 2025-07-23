#include <iostream>
#include <cstdlib>

// Simple GPIO control using pinctrl commands
class GPIO {
private:
    int pin;

public:
    GPIO(int pin_num) : pin(pin_num) {
        std::cout << "GPIO pin " << pin << " initialized" << std::endl;
    }

    void turn_on() {
        std::string command = "pinctrl set " + std::to_string(pin) + " dh";
        system(command.c_str());
        std::cout << "LED ON" << std::endl;
    }

    void turn_off() {
        std::string command = "pinctrl set " + std::to_string(pin) + " dl";
        system(command.c_str());
        std::cout << "LED OFF" << std::endl;
    }
};

int main() {
    GPIO led(17);  // Pin 17 for your LED
    
    std::cout << "LED Control Test" << std::endl;
    std::cout << "Press '1' to turn ON, '0' to turn OFF, 'q' to quit" << std::endl;
    
    char input;
    while (std::cin >> input) {
        if (input == '1') {
            led.turn_on();
        }
        else if (input == '0') {
            led.turn_off();
        }
        else if (input == 'q') {
            std::cout << "Goodbye!" << std::endl;
            break;
        }
        else {
            std::cout << "Invalid input. Use '1', '0', or 'q'" << std::endl;
        }
    }
    
    return 0;
}