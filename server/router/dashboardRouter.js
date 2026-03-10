import { Router } from 'express';

import dashboardController from '../controller/dashboardController';

const router = Router();

router.get('/leaderboard', dashboardController.getLeaderboard);
router.get('/players/:userId', dashboardController.getPlayer);
router.get('/history', dashboardController.getHistory);

export default router;
