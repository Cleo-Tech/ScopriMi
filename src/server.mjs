import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { setupRoutes } from './routes.mjs';
import { setupSocket } from './socket.mjs';

const app = express();
const server = createServer(app);
const io = new Server(server);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, '../public')));

let questions;
readFile(join(__dirname, '../questions.json'), 'utf8', (err, data) => {
  if (err) {
    console.error('Errore nella lettura del file delle domande:', err);
    return;
  }
  questions = JSON.parse(data);
});

// setup
setupRoutes(app, __dirname);
setupSocket(io, questions);


server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});
