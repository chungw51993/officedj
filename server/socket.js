import { Server } from 'socket.io';

class SocketServer {
  constructor(server) {
    this.channel = 'djdelta-smac-fest';
    this.io = new Server(server, {
      cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });
  }

  initialize() {
    this.io.on('connection', (conn) => {
      conn.join(this.channel);

      conn.on('current:track', (data) => {
        this.io.sockets.to(this.channel).emit('catch:up', data);
      });

      conn.on('new:track', (data) => {
        this.io.sockets.to(this.channel).emit('add:track', data);
      });

      conn.on('skip:track', (data) => {
        this.io.sockets.to(this.channel).emit('next:track', data);
      });

      conn.on('remove:track', (data) => {
        this.io.sockets.to(this.channel).emit('delete:track', data);
      });

      conn.on('update:progress', (data) => {
        this.io.sockets.to(this.channel).emit('progress:track', data);
      });

      conn.on('gonged:track', (data) => {
        this.io.sockets.to(this.channel).emit('gong:track', data);
      });
    });
  }

  emitToChannel(event, data) {
    this.io.sockets.to(this.channel).emit('add:track', trackInfo);
  }
}

export default SocketServer;
