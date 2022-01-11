import app from './app';

import djDelta from './state/djDelta';

class Socket {
  constructor() {
    this.channel = 'keyboard-cat';
    this.handleConnection = this.handleConnection.bind(this);
    this.io = app.io;
    app.io.on('connection', this.handleConnection);
  }

  handleConnection(conn) {
    conn.join(this.channel);

    const state = djDelta.get('state');
    const user = djDelta.get('user');
    let current = {
      state,
    };
    if (user.email) {
      current.user = user;
    }
    this.emit('current:state', current);

    conn.on('change:state', this.handleStateChange);
  }

  async handleStateChange(data) {
    const {
      state,
    } = data;
    await djDelta.set('state', state);
    this.emit('current:state', { state });
  }

  on(conn, event, cb) {
    conn.on(event, cb);
  }

  emit(event, data) {
    this.io.sockets.to(this.channel).emit(event, data);
  }
}

export default new Socket();
