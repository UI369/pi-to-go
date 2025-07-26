const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

// Store connected Pi devices
const connectedPis = new Map();
// Store latest photo
let latestPhoto = null;
// Store current LED state
let currentLedState = 'unknown'; // unknown, on, off
// Store LED event log (keep last 100 events)
const ledEventLog = [];

// Helper function to get location from IP
async function getLocationFromIP(ip) {
  console.log('Attempting geolocation for IP:', ip);
  
  try {
    // Skip private/local IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip?.startsWith('192.168.') || ip?.startsWith('10.')) {
      console.log('Skipping private IP, returning Local');
      return { city: 'Local', country: 'Network', flag: '🏠' };
    }
    
    const apiUrl = `http://ip-api.com/json/${ip}?fields=city,country,countryCode`;
    console.log('Calling geolocation API:', apiUrl);
    
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    console.log('Geolocation API response:', data);
    
    if (data.status === 'success') {
      // Get flag emoji from country code
      const flag = data.countryCode ? 
        String.fromCodePoint(...data.countryCode.toUpperCase().split('').map(c => 0x1F1E6 + c.charCodeAt(0) - 65)) :
        '🌍';
      
      return {
        city: data.city || 'Unknown',
        country: data.country || 'Unknown',
        flag: flag
      };
    } else {
      console.log('Geolocation API returned unsuccessful status:', data);
    }
  } catch (error) {
    console.log('Geolocation lookup failed:', error.message);
  }
  
  return { city: 'Unknown', country: 'Unknown', flag: '🌍' };
}

// Helper function to log LED events
async function logLedEvent(command, source = 'unknown', metadata = {}) {
  // Get location if this is a web request
  let location = null;
  if (source === 'web' && metadata.ip) {
    location = await getLocationFromIP(metadata.ip);
  }

  const event = {
    id: Date.now() + Math.random(), // Simple unique ID
    timestamp: new Date().toISOString(),
    command: command, // 'on', 'off', or 'unknown'
    source: source, // 'web', 'pi', 'system'
    location: location, // { city, country, flag }
    metadata: {
      ...metadata,
      browser: metadata.userAgent ? getBrowserInfo(metadata.userAgent) : null,
      isMobile: metadata.userAgent ? /Mobile|Android|iPhone|iPad/.test(metadata.userAgent) : false
    }
  };
  
  ledEventLog.unshift(event); // Add to beginning of array
  
  // Keep only last 100 events
  if (ledEventLog.length > 100) {
    ledEventLog.pop();
  }
  
  console.log(`LED Event: ${command} from ${source}${location ? ` (${location.city}, ${location.country})` : ''}`);
}

// Helper function to extract browser info
function getBrowserInfo(userAgent) {
  if (!userAgent) return 'Unknown';
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
  if (userAgent.includes('Edg')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
}

// WebSocket connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle Pi registration
  socket.on('register_pi', (piInfo) => {
    connectedPis.set(socket.id, {
      ...piInfo,
      socketId: socket.id,
      connected: true,
    });
    console.log('Pi registered:', piInfo);
  });

  // Handle status updates from Pi
  socket.on('led_status', (status) => {
    console.log('LED status update:', status);
    // Update server's knowledge of LED state
    const previousState = currentLedState;
    currentLedState = status.status;
    
    // Log the event if state actually changed
    if (previousState !== currentLedState) {
      logLedEvent(currentLedState, 'pi', { piId: status.piId });
    }
    
    // Broadcast to all web clients
    socket.broadcast.emit('led_status', status);
  });

  // Handle photo data from Pi
  socket.on('photo_data', (data) => {
    console.log('Photo received from Pi:', data.piId);
    latestPhoto = data;
    // Broadcast to all web clients
    socket.broadcast.emit('photo_update', {
      piId: data.piId,
      timestamp: data.timestamp
    });
  });

  // Handle photo errors from Pi
  socket.on('photo_error', (error) => {
    console.log('Photo error:', error);
    socket.broadcast.emit('photo_error', error);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    connectedPis.delete(socket.id);
  });
});

// REST API endpoints
app.get(['/', '/api/health'], (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/pis', (req, res) => {
  const pis = Array.from(connectedPis.values());
  res.json({ pis });
});

// LED control endpoints
app.post('/api/led/on', (req, res) => {
  console.log('LED ON command received');
  io.emit('led_command', { command: 'on' });
  res.json({ success: true, command: 'LED ON' });
});

app.post('/api/led/off', (req, res) => {
  console.log('LED OFF command received');
  io.emit('led_command', { command: 'off' });
  res.json({ success: true, command: 'LED OFF' });
});

// Generic command endpoint for React app
app.post('/send-command', async (req, res) => {
  const { command, piId } = req.body;
  console.log(`Command received: ${command} for Pi: ${piId}`);
  
  if (command === 'on' || command === 'off') {
    io.emit('led_command', { command });
    
    // Log the web command
    const previousState = currentLedState;
    currentLedState = command;
    
    if (previousState !== currentLedState) {
      const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
      console.log('Client IP extracted:', clientIP, 'Headers:', {
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip'],
        'req.ip': req.ip,
        'remoteAddress': req.connection.remoteAddress
      });
      
      await logLedEvent(command, 'web', { 
        piId: piId,
        userAgent: req.headers['user-agent'],
        ip: clientIP
      });
    }
    
    res.json({ success: true, command: `LED ${command.toUpperCase()}` });
  } else {
    res.status(400).json({ error: 'Invalid command' });
  }
});

// Camera endpoints
app.post('/take-photo', (req, res) => {
  const { piId } = req.body;
  console.log(`Photo command for Pi: ${piId}`);
  
  io.emit('camera_command', { command: 'take_photo' });
  res.json({ success: true, message: 'Photo command sent' });
});

app.get('/latest-photo', (req, res) => {
  if (latestPhoto) {
    res.json({
      success: true,
      photo: latestPhoto.photo,
      timestamp: latestPhoto.timestamp,
      piId: latestPhoto.piId
    });
  } else {
    res.status(404).json({ error: 'No photo available' });
  }
});

// Get current LED state
app.get('/led-status', (req, res) => {
  res.json({
    success: true,
    status: currentLedState,
    timestamp: new Date().toISOString()
  });
});

// Get LED event log
app.get('/led-events', (req, res) => {
  res.json({
    success: true,
    events: ledEventLog,
    count: ledEventLog.length
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
