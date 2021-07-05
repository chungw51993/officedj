import express, { Router } from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import path from 'path';

import handleCORS from './middleware/handleCORS';
import logRequest from './middleware/logRequest';

import router from './router';

const app = express();
const server = http.createServer(app);

app.use(handleCORS);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logRequest);

app.get('/health', (req, res) => {
  res.sendStatus(200);
});

app.use(router);

app.use(express.static(path.join(__dirname, '..', 'client', 'build')));

export default server;
