import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [ledStatus, setLedStatus] = useState('unknown');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [events, setEvents] = useState([]);

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
        // Wait a moment for LED to actually change, then take photo and refresh events
        setTimeout(() => {
          takePhoto();
          fetchEvents();
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

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${SERVER_URL}/led-events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  // Fetch current LED state and take a photo when component loads
  useEffect(() => {
    const fetchCurrentState = async () => {
      try {
        const response = await fetch(`${SERVER_URL}/led-status`);
        if (response.ok) {
          const data = await response.json();
          setLedStatus(data.status);
          setConnected(true);
        }
      } catch (error) {
        console.error('Error fetching LED status:', error);
        setConnected(false);
      }
    };

    fetchCurrentState();
    takePhoto();
    fetchEvents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
            LED: {ledStatus === 'on' ? '💡 ON' : ledStatus === 'off' ? '⚫ OFF' : '❓ UNKNOWN'}
          </div>
        </div>

        <div className="events-section">
          <h2>📝 Activity Log</h2>
          <div className="events-list">
            {events.length > 0 ? (
              events.map((event) => (
                <div key={event.id} className={`event-item ${event.command}`}>
                  <span className="event-time">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                  <span className="event-action">
                    LED turned {event.command.toUpperCase()}
                  </span>
                  <span className="event-source">
                    via {event.source}
                  </span>
                </div>
              ))
            ) : (
              <p>No events yet</p>
            )}
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
