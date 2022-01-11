import slack from '../util/slackClient';
import trivia from '../util/triviaClient';
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
  noTrackToGong,
  currentTrack,
  noCurrentTrack,
  comingUp,
  noComingUp,
  noUser,
  noDevice,
  currentHost,
  confirmReset,
  deltaReset,
  triviaQuestion,
  sendTriviaQuestion,
  triviaAnswerCorrect,
  triviaAnswerWrong,
} from '../helper/formSlackBlock';

import spotifyController from './spotifyController';

import Logger from '../util/logger';

class SlackController {
  constructor() {
    this.logger = Logger.getLogger('SlackController');
    this.handleLookup = this.handleLookup.bind(this);
    this.handleGong = this.handleGong.bind(this);
    this.handleButton = this.handleButton.bind(this);
  }

  checkForUser(req, res, next) {
    const {
      user_id: userId,
    } = req.body;
    const currentUser = djDelta.get('user');
    if (!currentUser || !currentUser.id) {
      slack.postMessage(userId, noUser());
      res.status(200).send();
    } else {
      next();
    }
  }

  async checkForDevices(req, res, next) {
    const {
      user_id: userId,
    } = req.body;
    const currentUser = djDelta.get('user');
    const devices = await spotifyController.getDevices();
    if (devices.length === 0) {
      slack.postMessage(userId, noDevice(currentUser));
    } else {
      next();
    }
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
  }

  async handleGong(req, res) {
    const {
      user_id: userId,
    } = req.body;
    try {
      const current = await spotifyController.getCurrentTrack();
      if (current) {
        const gong = await djDelta.gonged(userId, current);
        if (gong !== false) {
          slack.postMessage(userId, trackGonged(userId, gong));
          if (gong === 0) {
            await spotifyController.skipToNextTrack();
            const newCurrent = await spotifyController.getCurrentTrack();
            if (newCurrent) {
              slack.postMessage(userId, currentTrack(newCurrent));
            }
          }
        } else {
          slack.postEphemeral(userId, alreadyGonged(userId));
        }
      } else {
        slack.postEphemeral(userId, noTrackToGong());
      }
      res.status(200).send();
    } catch (err) {
      this.logger.error(err);
      res.status(500).json({
        err,
      });
    }
  }

  handleGongCount(req, res) {
    const {
      user_id: userId,
    } = req.body;
    const gong = djDelta.get('gong');
    slack.postMessage(userId, gongCount(gong));
    res.status(200).send();
  }

  async handleCurrent(req, res) {
    const {
      user_id: userId,
    } = req.body;
    const current = await spotifyController.getCurrentTrack();
    if (current) {
      slack.postMessage(userId, currentTrack(current));
    } else {
      slack.postEphemeral(userId, noCurrentTrack());
    }
    res.status(200).send();
  }

  async handleComingUp(req, res) {
    const {
      user_id: userId,
    } = req.body;
    const current = await spotifyController.getCurrentTrack();
    const queue = djDelta.comingUpOnQueue(current);
    if (queue.length > 0) {
      slack.postMessage(userId, comingUp(queue));
    } else {
      slack.postEphemeral(userId, noComingUp());
    }
    res.status(200).send();
  }

  handleHost(req, res) {
    const {
      user_id: userId,
    } = req.body;
    const current = djDelta.get('user');
    slack.postMessage(userId, currentHost(current));
    res.status(200).send();
  }

  handleReset(req, res) {
    const {
      user_id: userId,
    } = req.body;
    slack.postEphemeral(userId, confirmReset());
    res.status(200).send();
  }

  handleTrivia(req, res) {
    try {
      const {
        user_id: userId,
        text,
      } = req.body;
      slack.postEphemeral(userId, triviaQuestion());
      res.status(200).send();
    } catch (err) {
      this.logger.error(err);
      res.status(500).json({
        err,
      });
    }
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
          this.handleAddTrack(userId, data);
        } else if (action === 'resetState') {
          this.handleResetState(userId);
        } else if (action === 'triviaQuestion') {
          this.handleTriviaQuestion(userId, data);
        } else if (action === 'triviaAnswer') {
          this.handleTriviaAnswer(userId, data);
        }
      }

      res.status(200).send();
    } catch (err) {
      this.logger.error(err);
      res.status(500).json({
        err,
      });
    }
  }

  async handleAddTrack(userId, data) {
    await spotifyController.addTrackToQueue(data.id);
    djDelta.addTrackToQueue(data);
    slack.postMessage(userId, trackAdded(userId, data));
  }

  async handleResetState(userId) {
    djDelta.resetToInitialState();
    await spotifyController.resetUser();
    slack.postMessage(userId, deltaReset(userId));
  }

  async handleTriviaQuestion(userId, data) {
    const {
      difficulty,
    } = data;
    const question = await trivia.getTriviaQuestion(difficulty);
    slack.postEphemeral(userId, sendTriviaQuestion(question));
  }

  async handleTriviaAnswer(userId, data) {
    const {
      answer,
      correctAnswer,
      difficulty,
    } = data;
    if (answer === correctAnswer) {
      slack.postMessage(userId, triviaAnswerCorrect(userId, difficulty));
    } else {
      slack.postEphemeral(userId, triviaAnswerWrong(userId, answer, correctAnswer));
    }
  }
}

export default new SlackController();