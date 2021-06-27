import spotify from '../util/spotifyClient';
import spotifyController from './spotifyController';

import djDelta from '../state/djDelta';

import Logger from '../util/logger';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URL,
} = process.env;

class AuthController {
  constructor() {
    this.logger = Logger.getLogger('AuthController');
    this.handleSpotifyCallback = this.handleSpotifyCallback.bind(this);
  }

  handleSpotifyAuth(req, res) {
    const scopes = 'user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing playlist-modify-private playlist-read-private ugc-image-upload';
    res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(SPOTIFY_REDIRECT_URL)}`);
  }

  async handleSpotifyCallback(req, res) {
    const {
      query,
    } = req;
    try {
      if (query.error) {
        djDelta.set('error', query.error);
      } else if (query.code) {
        const currentUser = await spotify.setUserClient(query.code);
        let playlistId = await spotifyController.getPlaylist();
        let playlist = [];
        if (!playlistId) {
          playlistId = await spotifyController.createPlaylist();
        } else {
          playlist = await spotifyController.getPlaylistTracks(playlistId);
        }
        await djDelta.set('user', currentUser);
        await djDelta.set('playlistId', playlistId);
        await djDelta.set('playlist', playlist);
      }
      res.redirect('http://localhost:3000');
    } catch (err) {
      this.logger.error(err);
      res.redirect('http://localhost:3000');
    }
  }
}

export default new AuthController();
