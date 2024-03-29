import { Router } from 'express';

import triviaController from '../controller/triviaController';

const router = Router();

router.post('/start', triviaController.handleStart);
router.post('/slack/help', triviaController.handleHelp);
router.post('/slack/category', triviaController.handleShowCategories);
router.post('/slack/name', triviaController.handleSetDisplayName);
router.post('/slack/show/name', triviaController.handleShowDisplayName);
router.post('/slack/button', triviaController.handleButton);

export default router;
