import express from 'express';
import http from 'http';
import WebSocket from 'ws';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let lastMessage: { message: any; ws: any; } | null = null;

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    
    console.log(`Received message: ${message}`);
    if (lastMessage) {
      // Send the last message and the current message to previous client and current client

      lastMessage.ws.send(JSON.stringify({ messages: [lastMessage.message.toString(), message.toString()] }));
      ws.send(JSON.stringify({ messages: [lastMessage.message.toString(), message.toString()] }));
      lastMessage = null;
    } else {
      // last message is a tuple of the message and the client that sent it
      lastMessage = {message, ws};
    }
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});