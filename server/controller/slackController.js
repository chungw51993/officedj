import slack from '../util/slackClient';
import djDelta from '../state/djDelta';
import {
  help,
  needSongName,
  noTrack,
  lookup,
  trackAdded,
  trackGonged,
  alreadyGonged,
  gongCount,
  currentTrack,
  noCurrentTrack,
  comingUp,
  noComingUp,
} from '../helper/formSlackBlock';

import spotifyController from './spotifyController';
import socketController from './socketController';

import Logger from '../util/logger';

class SlackController {
  constructor() {
    this.logger = Logger.getLogger('SlackController');
    this.handleLookup = this.handleLookup.bind(this);
    this.handleGong = this.handleGong.bind(this);
    this.handleButton = this.handleButton.bind(this);
  }

  handleHelp(req, res) {
    const {
      user_id: userId,
    } = req.body;
    slack.postEphemeral(userId, help());
    res.status(200).send();
  }

  async handleLookup(req, res) {
    try {
      const {
        text,
        user_id: userId,
      } = req.body;
      if (text.length === 0) {
        slack.postEphemeral(userId, needSongName());
      } else {
        const tracks = await spotifyController.searchSongByName(text);
        if (tracks.items.length === 0) {
          slack.postEphemeral(userId, noTrack(text));
        } else {
          slack.postEphemeral(userId, lookup(tracks.items));
        }
      }
      res.status(200).send();
    } catch (err) {
      this.logger.error(err);
      res.status(500).json({
        err,
      });
    }
  };

  async handleGong(req, res) {
    const {
      user_id: userId,
    } = req.body;
    try {
      const gong = await djDelta.gonged(userId);
      if (gong !== false) {
        slack.postMessage(userId, trackGonged(userId, gong));
        socketController.handleGong(gong);
      } else {
        slack.postEphemeral(userId, alreadyGonged(userId));
      }
    } catch (err) {
      this.logger.error(err);
    }
    res.status(200).send();
  };

  handleGongCount(req, res) {
    const {
      user_id: userId,
    } = req.body;
    const gong = djDelta.get('gong');
    slack.postMessage(userId, gongCount(gong));
    res.status(200).send();
  }

  handleCurrent(req, res) {
    const {
      user_id: userId,
    } = req.body;
    const current = djDelta.currentTrack();
    if (current) {
      slack.postMessage(userId, currentTrack(current));
    } else {
      slack.postMessage(userId, noCurrentTrack());
    }
    res.status(200).send();
  }

  handleComingUp(req, res) {
    const {
      user_id: userId,
    } = req.body;
    const current = djDelta.currentTrack();
    const queue = djDelta.playlistQueue();
    if (!current) {
      slack.postMessage(userId, noCurrentTrack());
    } else if (next.length > 0) {
      slack.postMessage(userId, comingUp(queue));
    } else {
      slack.postMessage(userId, noComingUp());
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

      slack.deleteOriginalMessage(responseUrl);

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
          djDelta.addTrack(data);
          await spotifyController.addTrackToPlaylist(djDelta.get('playlistId'), data.id);
          slack.postMessage(userId, trackAdded(userId, data));
          socketController.emitAddTrack(data);
        }
      }

      res.status(200).send();
    } catch (err) {
      this.logger.error(err);
      res.status(500).json({
        err,
      });
    }
  };
}

export default new SlackController();