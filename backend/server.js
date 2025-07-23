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
app.post('/send-command', (req, res) => {
  const { command, piId } = req.body;
  console.log(`Command received: ${command} for Pi: ${piId}`);
  
  if (command === 'on' || command === 'off') {
    io.emit('led_command', { command });
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
