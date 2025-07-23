#!/usr/bin/env python3

import socketio
import subprocess
import sys
import time

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
        'capabilities': ['led_control']
    })

@sio.event
def disconnect():
    print("Disconnected from server")

@sio.event
def led_command(data):
    """Handle LED commands from server"""
    print(f"Received command: {data}")
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

def main():
    if len(sys.argv) > 1:
        global SERVER_URL
        SERVER_URL = sys.argv[1]
    
    print(f"Connecting to {SERVER_URL}")
    
    try:
        sio.connect(SERVER_URL)
        print("Connected! Waiting for commands...")
        sio.wait()
    except Exception as e:
        print(f"Connection failed: {e}")
        print("Make sure the server URL is correct and the server is running")

if __name__ == "__main__":
    main()