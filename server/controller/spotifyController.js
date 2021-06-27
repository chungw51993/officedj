import path from 'path';

import spotify from '../util/spotifyClient';
import base64Encode from '../helper/base64Encode';

class SpotifyController {
  async searchSongByName(name) {
    await spotify.checkAppToken();
    const { body: { tracks } } = await spotify.appClient.searchTracks(name);
    return tracks;
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
    await spotify.userClient.addToQueue(track);
  }

  async skipToNextTrack() {
    await spotify.checkUserToken();
    await spotify.userClient.skipToNext();
  }
}

export default new SpotifyController();
