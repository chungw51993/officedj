import express, { Router } from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import path from 'path';
import { Server } from 'socket.io';

import handleCORS from './middleware/handleCORS';
import logRequest from './middleware/logRequest';

import router from './router';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

app.use(handleCORS);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logRequest);

app.get('/health', (req, res) => {
  res.sendStatus(200);
});

app.use(router);

if (process.env.NODE_ENV === 'PROD') {
  app.use(express.static(path.join(__dirname, 'build')));
}

export default {
  io,
  server,
};
