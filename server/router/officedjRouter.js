import { Router } from 'express';

import authController from '../controller/authController';
import hostController from '../controller/hostController';
import officedjController from '../controller/officedjController';

const router = Router();

router.get('/auth/spotify', authController.handleSpotifyAuth);
router.get('/auth/spotify/callback', authController.handleSpotifyCallback);

router.get('/host/current', hostController.handleGetCurrentHost);
router.put('/host/reset', hostController.handleResetHost);

router.post('/slack/help', officedjController.handleHelp);
router.post('/slack/lookup', officedjController.checkForUser, officedjController.checkForDevices, officedjController.handleLookup);
router.post('/slack/gong', officedjController.checkForUser, officedjController.checkForDevices, officedjController.handleGong);
router.post('/slack/gong-count', officedjController.checkForUser, officedjController.checkForDevices, officedjController.handleGongCount);
router.post('/slack/current', officedjController.checkForUser, officedjController.checkForDevices, officedjController.handleCurrent);
router.post('/slack/coming-up', officedjController.checkForUser, officedjController.checkForDevices, officedjController.handleComingUp);
router.post('/slack/host', officedjController.checkForUser, officedjController.handleHost);
router.post('/slack/reset', officedjController.checkForUser, officedjController.handleReset);
router.post('/slack/button', officedjController.handleButton);

export default router;
