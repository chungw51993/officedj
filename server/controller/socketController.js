import SocketServer from '../socket';

class SocketController extends SocketServer {
  constructor(server, dj) {
    super(server);
    this.dj = dj;
    this.init();
    this.handleCurrent = this.handleCurrent.bind(this);
    this.handleGong = this.handleGong.bind(this);
  }

  addListener(conn) {
    this.on(conn, 'info:state', this.handleCurrent);
    this.on(conn, 'gong:track', this.handleGong);
  }

  handleCurrent(data, cb) {
    this.emit('current:state', data);
    if (cb) {
      cb();
    }
  }

  handleGong(data, cb) {
    const gong = this.dj.gonged();
    this.emit('gonged:track', gong);
    if (cb) {
      cb;
    }
  }

  emitAddTrack(track) {
    this.emit('add:track', track);
  }
}

export default SocketController;
