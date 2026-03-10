import express, { Router } from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import path from 'path';

import handleCORS from './middleware/handleCORS';
import logRequest from './middleware/logRequest';

import officedjRouter from './router/officedjRouter';
import triviaRouter from './router/triviaRouter';
import dashboardRouter from './router/dashboardRouter';
import trivia from './state/trivia';

const app = express();
const server = http.createServer(app);

app.use(handleCORS);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logRequest);

app.get('/health', (req, res) => {
  res.sendStatus(200);
});

// Wait for trivia state to hydrate from Redis before handling requests
app.use('/trivia', async (req, res, next) => {
  await trivia.ready();
  next();
});
app.use('/api/trivia', async (req, res, next) => {
  await trivia.ready();
  next();
});

app.use('/officedj', officedjRouter);
app.use(express.json());
app.use('/trivia', triviaRouter);
app.use('/api/trivia', dashboardRouter);

if (process.env.NODE_ENV === 'PROD') {
  app.use(express.static(path.join(__dirname, 'build')));
}

export default server;
