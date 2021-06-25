import axios from 'axios';

import SlackClient from '../lib/slackClient';
import {
  help,
  needSongName,
  noTrack,
  lookup,
  trackAdded,
  trackGonged,
  gongCount,
  currentTrack,
  noCurrentTrack,
  comingUp,
  noComingUp,
} from '../lib/formSlackBlock';

class SlackController extends SlackClient {
  constructor(socket, spotify, dj) {
    super();
    this.socket = socket;
    this.spotify = spotify;
    this.dj = dj;
    this.handleHelp = this.handleHelp.bind(this);
    this.handleLookup = this.handleLookup.bind(this);
    this.handleGong = this.handleGong.bind(this);
    this.handleGongCount = this.handleGongCount.bind(this);
    this.handleCurrent = this.handleCurrent.bind(this);
    this.handleComingUp = this.handleComingUp.bind(this);
    this.handleButton = this.handleButton.bind(this);
  }

  handleHelp(req, res) {
    const {
      user_id: userId,
    } = req.body;

    this.postEphemeral(userId, help());

    res.status(200).send();
  }

  async handleLookup(req, res) {
    try {
      const {
        text,
        user_id: userId,
      } = req.body;

      if (text.length === 0) {
        this.postEphemeral(userId, needSongName());
      } else {
        const tracks = await this.spotify.searchSongByName(text);
        if (tracks.items.length === 0) {
          this.postEphemeral(userId, noTrack(text));
        } else {
          this.postEphemeral(userId, lookup(tracks.items));
        }
      }

      res.status(200).send();
    } catch (err) {
      res.status(500).json({
        err,
      });
    }
  };

  handleGong(req, res) {
    const {
      user_id: userId,
    } = req.body;

    const gong = this.dj.gonged();
    this.postMessage(userId, trackGonged(userId, gong));
    this.socket.emit('gong:track', gong);

    res.status(200).send();
  };

  handleGongCount(req, res) {
    const {
      user_id: userId,
    } = req.body;

    this.postMessage(userId, gongCount(this.dj.gong));

    res.status(200).send();
  }

  handleCurrent(req, res) {
    const {
      user_id: userId,
    } = req.body;

    if (this.dj.current.id) {
      this.postMessage(userId, currentTrack(this.dj.current));
    } else {
      this.postMessage(userId, noCurrentTrack());
    }

    res.status(200).send();
  }

  handleComingUp(req, res) {
    const {
      user_id: userId,
    } = req.body;

    if (!this.dj.current.id) {
      this.postMessage(userId, noCurrentTrack());
    } else if (this.dj.playlist.length > 0) {
      this.postMessage(userId, comingUp(this.dj.playlist));
    } else {
      this.postMessage(userId, noComingUp());
    }

    res.status(200).send();
  }

  async handleButton(req, res) {
    try {
      const {
        payload,
      } = req.body;
      const {
        response_url: responseUrl,
        actions,
        user: {
          id: userId,
        },
      } = JSON.parse(payload);

      this.deleteOriginalMessage(responseUrl);

      const [action] = actions;
      const {
        value,
      } = action;

      if (value !== 'ignore') {
        const {
          action,
          ...data
        } = JSON.parse(value);
        if (action === 'addTrack') {
          this.dj.addTrack(data);
          await this.spotify.addTrackToPlaylist(this.dj.playlistId, data.id);
          this.postMessage(userId, trackAdded(userId, data));
          this.socket.emitAddTrack(data);
        }
      }

      res.status(200).send();
    } catch (err) {
      res.status(500).json({
        err,
      });
    }
  };
}

export default SlackController;