require('dotenv').config();

import app from './app';
import socket from './socket';

app.server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
