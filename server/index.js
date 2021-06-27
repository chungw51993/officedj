require('dotenv').config();

import server from './app';
import socket from './socket';

server.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
