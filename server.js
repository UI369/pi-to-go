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

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
