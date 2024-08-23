import express from 'express';
import { Request } from "express";
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setupSocket } from './socket.js';
import { readFile } from 'node:fs/promises';
import cors from 'cors';

const app = express();
app.use(cors<Request>());


const server = createServer(app);

app.get('/test', function (req, res) {
  res.json({ message: 'Ciao, sono nel server' });
});

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://fmanto01.github.io'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

async function init() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const data = await readFile(join(__dirname, './questions.json'), 'utf8');
    const questions = JSON.parse(data);

    // setup
    setupSocket(io, questions);

    server.listen(3001, () => {
      console.log('Server is running');
    });
  } catch (err) {
    console.error('Error reading the questions file:', err);
  }
}

init();
