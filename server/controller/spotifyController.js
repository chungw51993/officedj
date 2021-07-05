import path from 'path';

import spotify from '../util/spotifyClient';
import base64Encode from '../helper/base64Encode';

class SpotifyController {
  async searchSongByName(name) {
    await spotify.checkAppToken();
    const { body: { tracks } } = await spotify.appClient.searchTracks(name);
    return tracks;
  }

  async getDevices() {
    await spotify.checkUserToken();
    const { body: { devices } } = await spotify.userClient.getMyDevices();
    return devices;
  }

  async getCurrentTrack() {
    await spotify.checkUserToken();
    const { body } = await spotify.userClient.getMyCurrentPlayingTrack();
    const {
      is_playing: isPlaying,
      item,
    } = body;
    if (isPlaying) {
      return item;
    }
    return false;
  }

  async addTrackToQueue(trackId) {
    await spotify.checkUserToken();
    const track = `spotify:track:${trackId}`;
    const { body: { is_playing: isPlaying } } = await spotify.userClient.getMyCurrentPlaybackState();
    if (!isPlaying) {
      const devices = await this.getDevices();
      if (devices[0]) {
        await spotify.userClient.play({ device_id: devices[0].id });
        await spotify.userClient.addToQueue(track);
        await spotify.userClient.skipToNext();
      }
    } else {
      await spotify.userClient.addToQueue(track);
    }
  }

  async skipToNextTrack() {
    await spotify.checkUserToken();
    await spotify.userClient.skipToNext();
  }

  async resetUser() {
    await spotify.checkUserToken();
    const { body: { is_playing: isPlaying } } = await spotify.userClient.getMyCurrentPlaybackState();
    if (isPlaying) {
      await spotify.userClient.pause();
    }
    spotify.resetUserClient();
  }
}

export default new SpotifyController();
