const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* Serve every static file in the repo root */
app.use(express.static(__dirname));

/* Fallback for "/" */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

/* ---- WebSocket broadcast ---- */
wss.on('connection', socket => {
  console.log('Client connected');

  socket.on('message', data => {
    // Forward ANY message (draw OR clear) to all other clients
    wss.clients.forEach(client => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });

  socket.on('close', () => console.log('Client disconnected'));
});

server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
