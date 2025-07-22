import React, { useState } from 'react';
import './App.css';

function App() {
  const [ledStatus, setLedStatus] = useState('off');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(true);

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

  return (
    <div className="App">
      <div className="container">
        <h1>🔌 LED Control Dashboard</h1>
        
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

        <div className="info">
          <p>Controlling Pi LED via WebSocket</p>
          <p>Server: {SERVER_URL}</p>
        </div>
      </div>
    </div>
  );
}

export default App;