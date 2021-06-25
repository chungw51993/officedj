const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URL,
} = process.env;

class AuthController {
  constructor(spotify, dj) {
    this.spotify = spotify;
    this.dj = dj;
    this.handleSpotifyCallback = this.handleSpotifyCallback.bind(this);spotify
  }

  handleSpotifyAuth(req, res) {
    const scopes = 'user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-modify-private playlist-read-private ugc-image-upload';
    res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URL)}`);
  }

  async handleSpotifyCallback(req, res) {
    const {
      query,
    } = req;
    if (query.error) {
      this.dj.set('error', query.error);
    } else if (query.code) {
      const currentUser = await this.spotify.setUserClient(query.code);
      let playlistId = await this.spotify.getPlaylist();
      let playlist = [];
      if (!playlistId) {
        playlistId = await this.spotify.createPlaylist();
      } else {
        playlist = await this.spotify.getPlaylistTracks(playlistId);
      }
      this.dj.set('user', currentUser);
      this.dj.set('playlistId', playlistId);
      this.dj.set('playlist', playlist);
    }
    res.redirect('http://localhost:3000');
  }
}

export default AuthController;
