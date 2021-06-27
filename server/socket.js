import { Server } from 'socket.io';

import server from './app';

class Socket {
  constructor() {
    this.channel = 'keyboard-cat';
    this.io = new Server(server, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });
  }

  handleConnection() {
    this.io.on('connection', (conn) => {
      conn.join(this.channel);
      conn.on('info:state', this.handleCurrent);
      conn.on('gong:track', this.handleGong);
    });
  }

  on(conn, event, cb) {
    conn.on(event, cb);
  }

  emit(event, data) {
    this.io.sockets.to(this.channel).emit(event, data);
  }
}

export default new Socket();
