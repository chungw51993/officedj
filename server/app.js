import express, { Router } from 'express';
import bodyParser from 'body-parser';
import http from 'http';

import SocketController from './controller/socketController';

import handleCORS from './middleware/handleCORS';

import DJ from './state/dj';

require('dotenv').config();

const dj = new DJ();

const app = express();
const server = http.createServer(app);
const socket = new SocketController(server, dj);
const router = require('./router')(socket, dj);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(handleCORS);

app.get('/health', (req, res) => {
  res.sendStatus(200);
});
app.use(router);

export default server;
