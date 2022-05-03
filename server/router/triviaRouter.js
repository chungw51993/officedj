import { Router } from 'express';

import triviaController from '../controller/triviaController';

const router = Router();

router.post('/slack/help', triviaController.handleHelp);
router.post('/slack/category', triviaController.handleShowCategories);
router.post('/slack/start', triviaController.handleStart);
router.post('/slack/button', triviaController.handleButton);

export default router;
