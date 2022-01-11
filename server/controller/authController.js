import spotify from '../util/spotifyClient';
import spotifyController from './spotifyController';

import djDelta from '../state/djDelta';

import Logger from '../util/logger';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_REDIRECT_URL,
  CLIENT_URL,
} = process.env;

class AuthController {
  constructor() {
    this.logger = Logger.getLogger('AuthController');
    this.handleSpotifyCallback = this.handleSpotifyCallback.bind(this);
  }

  handleSpotifyAuth(req, res) {
    const scopes = 'user-read-email user-read-playback-state user-modify-playback-state user-read-currently-playing';
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
        await djDelta.setState({
          user: currentUser,
          state: 'hostFound',
        });
      }
      res.redirect(CLIENT_URL);
    } catch (err) {
      this.logger.error(err);
      res.redirect(CLIENT_URL);
    }
  }
}

export default new AuthController();
