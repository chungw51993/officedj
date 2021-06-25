import { Server } from 'socket.io';

class SocketServer {
  constructor(server) {
    this.channel = 'keyboard-cat-1';
    this.io = new Server(server, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });
  }

  init() {
    this.io.on('connection', (conn) => {
      conn.join(this.channel);
      if (this.addListener) {
        this.addListener(conn);
      }
    });
  }

  on(conn, event, cb) {
    conn.on(event, cb);
  }

  emit(event, data) {
    this.io.sockets.to(this.channel).emit(event, data);
  }
}

export default SocketServer;
