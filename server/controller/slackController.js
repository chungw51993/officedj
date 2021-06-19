import axios from 'axios';

import SlackClient from '../lib/slackClient';
import SpotifyClient from '../lib/spotifyClient';

class SlackController {
  constructor(socket) {
    this.slack = new SlackClient();
    this.spotify = new SpotifyClient();
    this.socket = socket;
  }

  async handleHelpCommand(req, res) {
    try {
      const {
        user_id: userId,
      } = req.body;

      this.slack.sendHelpCommand(userId);

      res.status(200).send();
    } catch (err) {
      res.status(500).json({
        err,
      });
    }
  }

  async handleLookupCommand(req, res) {
    try {
      const {
        text,
        user_id: userId,
      } = req.body;

      if (text.length === 0) {
        this.slack.sendNeedSongNameError(userId);
      } else {
        const { body: { tracks } } = await spotify.searchSongByName(text);
        console.log(tracks.items[0]);
        if (tracks.items.length === 0) {
          this.slack.sendNoTrackMessage(userId, text);
        } else {
          this.slack.sendAddTrackMessage(userId, tracks.items);
        }
      }

      res.status(200).send();
    } catch (err) {
      console.log(err);
      res.status(500).json({
        err,
      });
    }
  };

  async handleButtonCommand(req, res) {
    try {
      const {
        payload,
      } = req.body;
      const {
        response_url: responseUrl,
        actions,
        user: {
          id,
        },
      } = JSON.parse(payload);

      const [action] = actions;

      const {
        value,
      } = action;

      if (value !== 'ignore') {
        const trackInfo = JSON.parse(value);
        this.slack.sendTrackAddedMessage(id, trackInfo);
        this.socket.emitToChannel('add:track', trackInfo);
      }

      this.slack.deleteOriginalMessage(responseUrl);

      return res.status(200).send();
    } catch (err) {
      return res.status(500).json({
        err,
      });
    }
  };
}

export default SlackController;