import { Router } from 'express';

import authController from './controller/authController';
import slackController from './controller/slackController';

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

export default router;
