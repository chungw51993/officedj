import spotify from '../util/spotifyClient';
import spotifyController from './spotifyController';

import djDelta from '../state/djDelta';

import Logger from '../util/logger';

class HostController {
  constructor() {
    this.logger = Logger.getLogger('HostController');
    this.handleGetCurrentHost = this.handleGetCurrentHost.bind(this);
    this.handleResetHost = this.handleResetHost.bind(this);
  }

  handleGetCurrentHost(req, res) {
    const host = djDelta.get('user');
    res.status(200).json(host);
  }

  async handleResetHost(req, res) {
    try {
      djDelta.resetToInitialState();
      await spotifyController.resetUser();
      res.status(200).json({
        result: 1,
        message: 'Host was reset!',
      });
    } catch (err) {
      res.status(500).json({
        result: -1,
        message: err,
      });
    }
  }
}

export default new HostController();
