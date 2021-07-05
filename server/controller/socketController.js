import socket from '../socket';

class SocketController {
  constructor() {
    this.handleCurrent = this.handleCurrent.bind(this);
    this.handleGong = this.handleGong.bind(this);
    this.handleConnection();
  }

  handleConnection() {
    socket.io.on('connection', (conn) => {
      socket.join(conn);
      socket.on(conn, 'info:state', this.handleCurrent);
      socket.on(conn, 'gong:track', this.handleGong);
    });
  }

  handleCurrent(data, cb) {
    socket.emit('current:state', data);
    if (cb) {
      cb();
    }
  }

  handleGong(data, cb) {
    socket.emit('gonged:track', data);
    if (cb) {
      cb;
    }
  }

  emitAddTrack(track) {
    socket.emit('add:track', track);
  }

  emitResetState() {
    socket.emit('reset:state', { reset: true });
  }
}

export default new SocketController();
