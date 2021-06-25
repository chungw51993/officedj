import { io } from 'socket.io-client';

const {
  SOCKET_URL,
} = window;

class SocketClient {
  constructor() {
    this.socket = io(SOCKET_URL, {
      autoConnect: false,
    });
  }

  init() {
    return new Promise((resolve) => {
      this.socket.connect();
      this.socket.on('connect', resolve);
    });
  }

  on(event, cb) {
    this.socket.on(event, cb);
  }

  emit(event, data) {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.socket.connected) {
        reject('Socket is not connected');
      } else {
        this.socket.emit(event, data, resolve);
      }
    });
  }
}

export default SocketClient;
