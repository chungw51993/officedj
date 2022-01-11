import axios from 'axios';
import qs from 'querystring';
import path from 'path';
import moment from 'moment';
import SpotifyWebAPI from 'spotify-web-api-node';

import redis from '../util/redisClient';

import Logger from './logger';

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET,
  SPOTIFY_REDIRECT_URL,
} = process.env;

class SpotifyClient {
  constructor() {
    this.logger = Logger.getLogger('SpotifyClient');
    this.appClient = null;
    this.appAccessToken = null;
    this.appTokenExpires = moment();
    this.userClient = null;
    this.userAccessToken = null;
    this.userRefreshToken = null;
    this.userTokenExpires = moment();
    this.initialize();
  }

  async initialize() {
    try {
      const spotify = await redis.getObject('spotifySession');
      if (spotify) {
        Object.keys(spotify).forEach((k) => {
          if (k.includes('TokenExpires')) {
            this[k] = moment(spotify[k]);
          } else {
            this[k] = spotify[k];
          }
        });
      }
      await this.setAppClient();
      if (this.userAccessToken) {
        await this.setUserClient();
      }
    } catch (err) {
      this.logger.error(err);
    }
  }

  updateSpotifySession() {
    const spotifySession = {
      appAccessToken: this.appAccessToken,
      appTokenExpires: this.appTokenExpires.valueOf(),
      userAccessToken: this.userAccessToken,
      userRefreshToken: this.userRefreshToken,
      userTokenExpires: this.userTokenExpires.valueOf(),
    };
    redis.setObject('spotifySession', spotifySession);
  }

  // APP METHODS
  async setAppClient() {
    const currentTime = moment();
    const spotify = new SpotifyWebAPI({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
    });
    if (this.appAccessToken
      && !this.appTokenExpires.isBefore(currentTime, 'seconds')) {
      spotify.setAccessToken(this.appAccessToken);
    } else {
      const { body } = await spotify.clientCredentialsGrant();
      const {
        access_token: accessToken,
        expires_in: expiresIn,
      } = body;
      spotify.setAccessToken(accessToken);
      this.appAccessToken = accessToken;
      this.appTokenExpires = currentTime.add(expiresIn, 'seconds');
    }
    this.appClient = spotify;
    this.updateSpotifySession();
  }

  async checkAppToken() {
    const currentTime = moment();
    if (this.appTokenExpires.isBefore(currentTime)) {
      await this.setAppClient();
    }
  }

  // USER METHODS
  async setUserClient(code) {
    const currentTime = moment();
    const spotify = new SpotifyWebAPI({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET,
      redirectUri: SPOTIFY_REDIRECT_URL,
    });
    if (this.userAccessToken && this.userRefreshToken) {
      spotify.setAccessToken(this.userAccessToken);
      spotify.setRefreshToken(this.userRefreshToken);
      this.userClient = spotify;
      await this.checkUserToken()
    } else {
      const { body } = await spotify.authorizationCodeGrant(code);
      const {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expiresIn,
      } = body;
      spotify.setAccessToken(accessToken);
      spotify.setRefreshToken(refreshToken);
      this.userAccessToken = accessToken;
      this.userRefreshToken = refreshToken;
      this.userTokenExpires = currentTime.add(expiresIn, 'seconds');
      this.userClient = spotify;
    }
    this.updateSpotifySession();
    const { body: currentUser } = await spotify.getMe();
    return currentUser;
  }

  async checkUserToken() {
    const currentTime = moment();
    if (this.userTokenExpires.isBefore(currentTime)) {
      const { body } = await this.userClient.refreshAccessToken();
      const {
        access_token: accessToken,
        expires_in: expiresIn,
      } = body;
      this.userClient.setAccessToken(accessToken);
      this.userAccessToken = accessToken;
      this.userTokenExpires = currentTime.add(expiresIn, 'seconds');
      this.updateSpotifySession();
    }
  }

  resetUserClient() {
    this.userClient = null;
    this.userAccessToken = null;
    this.userRefreshToken = null;
    this.userTokenExpires = moment();
    this.updateSpotifySession();
  }
}

export default new SpotifyClient();
