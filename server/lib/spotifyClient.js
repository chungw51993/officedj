import axios from 'axios';
import qs from 'querystring';
import path from 'path';
import moment from 'moment';
import SpotifyWebAPI from 'spotify-web-api-node';

import base64Encode from './base64Encode';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URL,
} = process.env;

class SpotifyClient {
  constructor() {
    this.appClient = null;
    this.appTokenExpires = moment();
    this.userClient = null;
    this.userTokenExpires = moment();
    this.user = {};
    this.setAppClient();
    this.checkAppToken = this.checkAppToken.bind(this);
    this.setUserClient = this.setUserClient.bind(this);
    this.checkUserToken = this.checkUserToken.bind(this);
  }

  // APP METHODS
  async setAppClient() {
    const spotify = new SpotifyWebAPI({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URL,
    });
    const { body } = await spotify.clientCredentialsGrant();
    const {
      access_token: accessToken,
      expires_in: expiresIn,
    } = body;
    spotify.setAccessToken(accessToken);
    this.appClient = spotify;
    this.appTokenExpires.add(expiresIn, 'seconds');
  }

  async checkAppToken() {
    const currentTime = moment();
    if (this.appTokenExpires.isBefore(currentTime, 'seconds')) {
      await this.setAppClient();
    }
  }

  async searchSongByName(name) {
    await this.checkAppToken();
    const { body: { tracks } } = await this.appClient.searchTracks(name);
    return tracks;
  }

  // USER METHODS
  async setUserClient(code) {
    const spotify = new SpotifyWebAPI({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URL,
    });
    const { body } = await spotify.authorizationCodeGrant(code);
    const {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
    } = body;
    spotify.setAccessToken(accessToken);
    spotify.setRefreshToken(refreshToken);
    this.userClient = spotify;
    this.userTokenExpires.add(expiresIn, 'seconds');
    const { body: currentUser } = await spotify.getMe();
    return currentUser;
  }

  async checkUserToken() {
    const currentTime = moment();
    if (this.userTokenExpires.isBefore(currentTime, 'seconds')) {
      const { body } = await this.userClient.refreshAccessToken();
      const {
        expires_in: expiresIn,
      } = body;
      this.userTokenExpires = currentTime.add(expiresIn, 'seconds');
    }
  }

  async getPlaylist() {
    await this.checkUserToken();
    const { body: { items } } = await this.userClient.getUserPlaylists();
    let playlistId = null;
    items.forEach((playlist) => {
      const {
        id,
        name,
      } = playlist;
      if (name === 'DJDelta\'s iPod') {
        playlistId = id;
      }
    });
    return playlistId;
  }

  async getPlaylistTracks(playlistId) {
    await this.checkUserToken();
    const { body: { items } } = await this.userClient.getPlaylistTracks(playlistId);
    let playlist = [];
    if (items.length > 0) {
      playlist = items.map((item) => {
        const {
          track: {
            album,
            artists,
            href,
            name,
          },
        } = item;
        const [artist] = artists;
        const albumCover = album.images[2];
        const hrefId = href.split('/');
        return {
          album: album.name,
          albumCover: albumCover.url,
          artist: artist.name,
          name,
          id: hrefId[hrefId.length - 1],
        }
      });
    }
    return playlist;
  }

  async createPlaylist() {
    await this.checkUserToken();
    const { body: { id: playlistId } } = await this.userClient.createPlaylist('DJDelta\'s iPod', {
      description: 'DJDelta\'s iPod under the DJ booth',
      public: false,
    });
    const playlistImg = base64Encode(path.join(__dirname, '../asset/djdelta.png'));
    await this.userClient.uploadCustomPlaylistCoverImage(playlistId, playlistImg);
    return playlistId;
  }

  async addTrackToPlaylist(playlistId, trackId) {
    await this.checkUserToken();
    const tracks = [`spotify:track:${trackId}`];
    await this.userClient.addTracksToPlaylist(playlistId, tracks);
  }
}

export default SpotifyClient;
