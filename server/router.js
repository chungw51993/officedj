import { Router } from 'express';

import SlackController from './controller/slackController';

module.exports = (socket) => {
  const router = Router();

  const slackController = new SlackController(socket);

  router.post('/slack/help', slackController.handleHelpCommand);

  router.post('/slack/lookup', slackController.handleLookupCommand);

  router.post('/slack/button', slackController.handleButtonCommand);

  return router;
}
