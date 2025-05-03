import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const server = createServer((req, res) => {
  // Handle HTTP requests with CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ 
  server,
  // Handle upgrade requests explicitly
  handleProtocols: (protocols) => {
    if (protocols.includes('ws')) {
      return 'ws';
    }
    return false;
  }
});

// Store connected clients
const clients = new Map();

// Log when server starts listening
server.listen(8080, () => {
  console.log('WebSocket server is running on port 8080');
});

wss.on('connection', (ws, request) => {
  console.log('New client connected');
  
  const id = Math.random().toString(36).substring(7);
  const color = Math.floor(Math.random() * 360);
  const metadata = { id, color };

  clients.set(ws, metadata);

  ws.on('message', (messageAsString) => {
    try {
      const message = JSON.parse(messageAsString);
      const metadata = clients.get(ws);

      message.sender = metadata.id;
      message.color = metadata.color;

      // Broadcast message to all connected clients
      [...clients.keys()].forEach((client) => {
        if (client.readyState === 1) { // Only send to clients that are open
          client.send(JSON.stringify(message));
        }
      });
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Handle server errors
wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
});