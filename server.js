const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* Serve static files from the repo root */
app.use(express.static(__dirname));

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, 'index.html'))
);

const server = http.createServer(app);
const wss    = new WebSocket.Server({ server });

/* 🔑  Broadcast *any* incoming WS message to every other client */
wss.on('connection', socket => {
  console.log('Client connected');

  socket.on('message', data => {
    wss.clients.forEach(client => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(data);        // forward draw **and** clear messages
      }
    });
  });

  socket.on('close', () => console.log('Client disconnected'));
});

server.listen(PORT, () =>
  console.log(`Server running at http://localhost:${PORT}`)
);
