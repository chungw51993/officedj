import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import path from 'path';

import handleCORS from './middleware/handleCORS';
import logRequest from './middleware/logRequest';

import officedjRouter from './router/officedjRouter';
import triviaRouter from './router/triviaRouter';

const app = express();
const server = http.createServer(app);

app.use(handleCORS);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logRequest);

app.get('/health', (req, res) => {
  res.sendStatus(200);
});

app.use('/officedj', officedjRouter);
app.use('/trivia', triviaRouter);

if (process.env.NODE_ENV === 'PROD') {
  app.use(express.static(path.join(__dirname, 'build')));
}

export default server;
