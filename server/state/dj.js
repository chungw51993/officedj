class DJ {
  constructor() {
    this.user = null;
    this.playlistId = null;
    this.playlist = [];
    this.current = {};
    this.gong = 0;
    this.error = null;
  }

  set(field, value) {
    this[field] = value;
  }

  gonged() {
    if (this.gong >= 2) {
      this.gong = 0;
    } else {
      this.gong += 1;
    }
    return this.gong;
  }

  addTrack(track) {
    if (!this.current.id) {
      this.current = track;
    } else {
      this.playlist.push(track);
    }
  }

  nextTrack() {
    if (this.playlist.length > 0) {
      const nextTrack = this.playlist.shift();
      this.current = nextTrack;
    } else {
      this.current = {};
    }
  }
}

export default DJ;
