import path from 'path';

import spotify from '../util/spotifyClient';
import base64Encode from '../helper/base64Encode';

class SpotifyController {
  async searchSongByName(name) {
    await spotify.checkAppToken();
    const { body: { tracks } } = await spotify.appClient.searchTracks(name);
    return tracks;
  }

  async getPlaylist() {
    await spotify.checkUserToken();
    const { body: { items } } = await spotify.userClient.getUserPlaylists();
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
    await spotify.checkUserToken();
    const { body: { items } } = await spotify.userClient.getPlaylistTracks(playlistId);
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
    await spotify.checkUserToken();
    const { body: { id: playlistId } } = await spotify.userClient.createPlaylist('DJDelta\'s iPod', {
      description: 'DJDelta\'s iPod under the DJ booth',
      public: false,
    });
    const playlistImg = base64Encode(path.join(__dirname, '../asset/djdelta.png'));
    await spotify.userClient.uploadCustomPlaylistCoverImage(playlistId, playlistImg);
    return playlistId;
  }

  async addTrackToPlaylist(playlistId, trackId) {
    await spotify.checkUserToken();
    const tracks = [`spotify:track:${trackId}`];
    await spotify.userClient.addTracksToPlaylist(playlistId, tracks);
  }
}

export default new SpotifyController();
