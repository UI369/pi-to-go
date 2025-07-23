#!/usr/bin/env python3

import socketio
import subprocess
import sys
import time
import base64
import os

# Socket.IO client
sio = socketio.Client()

# Configuration
SERVER_URL = "YOUR_RAILWAY_URL_HERE"  # Replace with your Railway URL
PI_ID = "pi-001"  # Unique identifier for this Pi

def control_led(command):
    """Control the LED using pinctrl commands"""
    try:
        if command == "on":
            result = subprocess.run(["pinctrl", "set", "17", "dh"], 
                                  capture_output=True, text=True)
            print("LED turned ON")
            return "on"
        elif command == "off":
            result = subprocess.run(["pinctrl", "set", "17", "dl"], 
                                  capture_output=True, text=True)
            print("LED turned OFF") 
            return "off"
        else:
            print(f"Unknown command: {command}")
            return None
    except Exception as e:
        print(f"Error controlling LED: {e}")
        return None

@sio.event
def connect():
    print("Connected to server!")
    # Register this Pi with the server
    sio.emit('register_pi', {
        'piId': PI_ID,
        'location': 'home',
        'capabilities': ['led_control', 'camera']
    })

@sio.event
def disconnect():
    print("Disconnected from server")

@sio.event
def led_command(data):
    """Handle LED commands from server"""
    print(f"Received LED command: {data}")
    command = data.get('command')
    
    if command in ['on', 'off']:
        result = control_led(command)
        if result:
            # Send status update back to server
            sio.emit('led_status', {
                'piId': PI_ID,
                'status': result,
                'timestamp': time.time()
            })

@sio.event
def camera_command(data):
    """Handle camera commands from server"""
    print(f"Received camera command: {data}")
    command = data.get('command')
    
    if command == 'take_photo':
        photo_data = capture_photo()
        if photo_data:
            # Send photo back to server
            sio.emit('photo_data', {
                'piId': PI_ID,
                'photo': photo_data,
                'timestamp': time.time()
            })
        else:
            sio.emit('photo_error', {
                'piId': PI_ID,
                'error': 'Failed to capture photo',
                'timestamp': time.time()
            })

def capture_photo():
    """Capture photo and return as base64"""
    try:
        photo_path = "/tmp/pi_photo.jpg"
        result = subprocess.run(["rpicam-still", "-o", photo_path, "--timeout", "1", 
                               "--width", "1280", "--height", "960", "--quality", "85"], 
                              capture_output=True, text=True)
        
        if result.returncode == 0 and os.path.exists(photo_path):
            with open(photo_path, "rb") as f:
                photo_data = base64.b64encode(f.read()).decode('utf-8')
            os.remove(photo_path)  # Clean up
            print("Photo captured successfully")
            return photo_data
        else:
            print(f"Camera error: {result.stderr}")
            return None
    except Exception as e:
        print(f"Error capturing photo: {e}")
        return None

def setup_gpio():
      """Configure GPIO pin as output"""
      try:
          subprocess.run(["pinctrl", "set", "17", "op"], capture_output=True, text=True)
          print("GPIO pin 17 configured as output")
      except Exception as e:
          print(f"Error setting up GPIO: {e}")


def main():
    if len(sys.argv) > 1:
        global SERVER_URL
        SERVER_URL = sys.argv[1]
    
    print(f"Connecting to {SERVER_URL}")
    setup_gpio()
    
    try:
        sio.connect(SERVER_URL)
        print("Connected! Waiting for commands...")
        sio.wait()
    except Exception as e:
        print(f"Connection failed: {e}")
        print("Make sure the server URL is correct and the server is running")

if __name__ == "__main__":
    main()