import express from 'express';
import bodyParser from 'body-parser';

import routes from './routes';

require('dotenv').config();

const app = express();

app.use(bodyParser.json({ limit: '10mb' }));

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Credentials', true);
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept,Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

app.use(allowCrossDomain);

app.get('/health', (req, res) => {
  res.sendStatus(200);
});

export default app;
