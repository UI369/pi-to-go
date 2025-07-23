import React, { useState } from 'react';
import './App.css';

function App() {
  const [ledStatus, setLedStatus] = useState('off');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  // Replace with your Railway server URL
  const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'https://your-railway-url.up.railway.app';

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
          piId: 'pi-001'
        }),
      });

      if (response.ok) {
        setLedStatus(command);
        setConnected(true);
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
          piId: 'pi-001'
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

  return (
    <div className="App">
      <div className="container">
        <h1>🔌 Pi Control Dashboard</h1>
        
        <div className="status-section">
          <div className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          <div className={`led-status ${ledStatus}`}>
            LED: {ledStatus === 'on' ? '💡 ON' : '⚫ OFF'}
          </div>
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

        <div className="camera-section">
          <h2>📷 Camera</h2>
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

        <div className="info">
          <p>Controlling Pi LED and Camera via WebSocket</p>
          <p>Server: {SERVER_URL}</p>
        </div>
      </div>
    </div>
  );
}

export default App;