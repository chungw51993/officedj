import { Router } from 'express';

import AuthController from './controller/authController';
import SlackController from './controller/slackController';

import SpotifyClient from './lib/spotifyClient';

module.exports = (socket, dj) => {
  const spotify = new SpotifyClient();
  const authController = new AuthController(spotify, dj);
  const slackController = new SlackController(socket, spotify, dj);

  const router = Router();

  router.get('/auth/spotify', authController.handleSpotifyAuth);

  router.get('/auth/spotify/callback', authController.handleSpotifyCallback);

  router.post('/slack/help', slackController.handleHelp);

  router.post('/slack/lookup', slackController.handleLookup);

  router.post('/slack/gong', slackController.handleGong);

  router.post('/slack/gong-count', slackController.handleGongCount);

  router.post('/slack/current', slackController.handleCurrent);

  router.post('/slack/coming-up', slackController.handleComingUp);

  router.post('/slack/button', slackController.handleButton);

  return router;
}
