#include <iostream>
#include <map>
#include <string>

// Define your data list
#define MY_LIST \
    X(Item1, "First item description") \
    X(Item2, "Second item description") \
    X(Item3, "Third item description")

// Test 1: Generate an enum
#define X(name, desc) name,
enum MyEnum { 
    MY_LIST 
};
#undef X

// Test 2: Generate a description map
#define X(name, desc) { MyEnum::name, desc },
std::map<MyEnum, std::string> descriptions = { 
    MY_LIST 
};
#undef X

// Test 3: Generate a switch statement function
const char* getDescription(MyEnum item) {
    switch(item) {
#define X(name, desc) case name: return desc;
        MY_LIST
#undef X
        default: return "Unknown";
    }
}

// Test 4: Try different parameter counts
#define COLOR_LIST \
    Y(Red, "Red color", 255, 0, 0) \
    Y(Green, "Green color", 0, 255, 0) \
    Y(Blue, "Blue color", 0, 0, 255)

// Generate enum with Y instead of X
#define Y(name, desc, r, g, b) name,
enum Color { 
    COLOR_LIST 
};
#undef Y

// Generate RGB values
#define Y(name, desc, r, g, b) { Color::name, {r, g, b} },
struct RGB { int r, g, b; };
std::map<Color, RGB> colorValues = { 
    COLOR_LIST 
};
#undef Y

int main() {
    std::cout << "=== Testing X-Macro Pattern ===\n\n";
    
    // Test the enum values
    std::cout << "Enum values:\n";
    std::cout << "Item1 = " << Item1 << std::endl;
    std::cout << "Item2 = " << Item2 << std::endl;
    std::cout << "Item3 = " << Item3 << std::endl;
    std::cout << std::endl;
    
    // Test the description map
    std::cout << "Using description map:\n";
    std::cout << "Item1: " << descriptions[Item1] << std::endl;
    std::cout << "Item2: " << descriptions[Item2] << std::endl;
    std::cout << "Item3: " << descriptions[Item3] << std::endl;
    std::cout << std::endl;
    
    // Test the switch function
    std::cout << "Using switch function:\n";
    std::cout << "Item1: " << getDescription(Item1) << std::endl;
    std::cout << "Item2: " << getDescription(Item2) << std::endl;
    std::cout << "Item3: " << getDescription(Item3) << std::endl;
    std::cout << std::endl;
    
    // Test the color system with more parameters
    std::cout << "Color system:\n";
    std::cout << "Red RGB: " << colorValues[Red].r << ", " 
              << colorValues[Red].g << ", " << colorValues[Red].b << std::endl;
    std::cout << "Green RGB: " << colorValues[Green].r << ", " 
              << colorValues[Green].g << ", " << colorValues[Green].b << std::endl;
    std::cout << "Blue RGB: " << colorValues[Blue].r << ", " 
              << colorValues[Blue].g << ", " << colorValues[Blue].b << std::endl;
    
    std::cout << "\nPress Enter to continue...";
    std::cin.get();
    return 0;