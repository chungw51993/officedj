import axios from 'axios';
import qs from 'querystring';
import moment from 'moment';
import SpotifyWebAPI from 'spotify-web-api-node';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
} = process.env;

class SpotifyClient {
  constructor() {
    this.spotify = new SpotifyWebAPI({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
    });
    this.tokenExpiresIn = moment();
    this.getClientToken();
  }

  async getClientToken() {
    const token = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
    const authorization = `Basic ${token}`;
    const payload = {
      grant_type: 'client_credentials',
    };
    const data = qs.stringify(payload);
    const { data: d } = await axios({
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: authorization,
      },
      data,
    });
    const {
      access_token: accessToken,
      expires_in: expiresIn,
    } = d;
    this.spotify.setAccessToken(accessToken);
    this.tokenExpiresIn.add(expiresIn, 'seconds');
  }

  async searchSongByName(name) {
    const currentTime = moment();
    let data = null;
    if (this.tokenExpiresIn.isBefore(currentTime, 'seconds')) {
      await this.getClientToken();
      data = await this.spotify.searchTracks(name);
    } else {
      data = await this.spotify.searchTracks(name);
    }
    return data;
  }
}

export default SpotifyClient;
