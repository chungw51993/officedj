import express, { Router } from 'express';
import bodyParser from 'body-parser';
import http from 'http';

import SocketServer from './socket';

import handleCORS from './middleware/handleCORS';

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const socket = new SocketServer(server);
socket.initialize();

const router = require('./router')(socket);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(handleCORS);

app.get('/health', (req, res) => {
  res.sendStatus(200);
});
app.use(router);

export default server;
