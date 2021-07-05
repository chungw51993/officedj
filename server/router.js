import { Router } from 'express';

import authController from './controller/authController';
import slackController from './controller/slackController';

const router = Router();

router.get('/auth/spotify', authController.handleSpotifyAuth);

router.get('/auth/spotify/callback', authController.handleSpotifyCallback);

router.post('/slack/help', slackController.handleHelp);

router.post('/slack/lookup', slackController.checkForUser, slackController.checkForDevices, slackController.handleLookup);

router.post('/slack/gong', slackController.checkForUser,slackController.checkForDevices, slackController.handleGong);

router.post('/slack/gong-count', slackController.checkForUser,slackController.checkForDevices, slackController.handleGongCount);

router.post('/slack/current', slackController.checkForUser,slackController.checkForDevices, slackController.handleCurrent);

router.post('/slack/coming-up', slackController.checkForUser,slackController.checkForDevices, slackController.handleComingUp);

router.post('/slack/host', slackController.checkForUser, slackController.handleHost);

router.post('/slack/reset', slackController.checkForUser, slackController.handleReset);

router.post('/slack/button', slackController.handleButton);

export default router;
