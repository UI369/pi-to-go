import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [ledStatus, setLedStatus] = useState('off');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Replace with your Railway server URL
  const SERVER_URL =
    process.env.REACT_APP_SERVER_URL ||
    'https://your-railway-url.up.railway.app';

  const sendCommand = async (command) => {
    setLoading(true);
    try {
      const response = await fetch(`${SERVER_URL}/send-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: command,
          piId: 'pi-001',
        }),
      });

      if (response.ok) {
        setLedStatus(command);
        setConnected(true);
        // Wait a moment for LED to actually change, then take photo
        setTimeout(() => {
          takePhoto();
        }, 100);
      } else {
        console.error('Failed to send command');
        setConnected(false);
      }
    } catch (error) {
      console.error('Error sending command:', error);
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    setPhotoLoading(true);
    try {
      // Send photo command
      const response = await fetch(`${SERVER_URL}/take-photo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          piId: 'pi-001',
        }),
      });

      if (response.ok) {
        // Wait a moment for photo to be captured and processed
        setTimeout(async () => {
          try {
            const photoResponse = await fetch(`${SERVER_URL}/latest-photo`);
            if (photoResponse.ok) {
              const photoData = await photoResponse.json();
              setPhoto(photoData.photo);
              setConnected(true);
            }
          } catch (err) {
            console.error('Error fetching photo:', err);
          }
          setPhotoLoading(false);
        }, 2000);
      } else {
        console.error('Failed to trigger photo capture');
        setConnected(false);
        setPhotoLoading(false);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      setConnected(false);
      setPhotoLoading(false);
    }
  };

  // Take a photo when the component first loads
  useEffect(() => {
    takePhoto();
  }, []);

  return (
    <div className="App">
      <div className="container">
        <h1>🔌 Turn my LED on and off</h1>
        <h2>
          This is an LED in my office that you can turn on and off from the
          internet.
        </h2>
        <h1>GO NUTS</h1>

        <div className="camera-section">
          <button
            className="btn btn-camera"
            onClick={takePhoto}
            disabled={photoLoading}
          >
            {photoLoading ? '⏳ Capturing...' : '📷 Take Photo'}
          </button>

          {photo && (
            <div className="photo-container">
              <img
                src={`data:image/jpeg;base64,${photo}`}
                alt="Pi Camera"
                className="pi-photo"
              />
            </div>
          )}
        </div>
        <div className="controls">
          <button
            className={`btn btn-on ${ledStatus === 'on' ? 'active' : ''}`}
            onClick={() => sendCommand('on')}
            disabled={loading}
          >
            {loading && ledStatus !== 'on' ? '⏳' : '💡'} Turn ON
          </button>

          <button
            className={`btn btn-off ${ledStatus === 'off' ? 'active' : ''}`}
            onClick={() => sendCommand('off')}
            disabled={loading}
          >
            {loading && ledStatus !== 'off' ? '⏳' : '⚫'} Turn OFF
          </button>
        </div>

        <div className="status-section">
          <div className={`led-status ${ledStatus}`}>
            LED: {ledStatus === 'on' ? '💡 ON' : '⚫ OFF'}
          </div>
        </div>

        <div className="info">
          <p>Controlling Pi LED and Camera via WebSocket</p>
          <p>Server: {SERVER_URL}</p>
          <p>
            Open Source Repo:
            <a
              href="https://github.com/UI369/pi-to-go"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://github.com/UI369/pi-to-go
            </a>
          </p>
          <br />
          <br />
          <p>
            Made with ❤️ & ☕ by{' '}
            <a
              href="https://coff.ee/ui369"
              target="_blank"
              rel="noopener noreferrer"
            >
              UI369
            </a>
          </p>
          <p>
            Help me stay awake:{' '}
            <a
              href="https://coff.ee/ui369"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://coff.ee/ui369
            </a>
          </p>
          <div
            className={`status-indicator ${
              connected ? 'connected' : 'disconnected'
            }`}
          >
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
