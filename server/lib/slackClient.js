import axios from 'axios';
import { WebClient } from '@slack/web-api';

const {
  SLACK_CHANNEL_ID,
  SLACK_APP_TOKEN,
} = process.env;

class SlackClient {
  constructor() {
    this.slackClient = new WebClient(SLACK_APP_TOKEN);
    this.slackChannel = SLACK_CHANNEL_ID;
  }

  postEphemeral(userId, blocks) {
    const message = {
      channel: this.slackChannel,
      user: userId,
      blocks,
    }
    this.slackClient.chat.postEphemeral(message);
  }

  postMessage(userId, blocks) {
    const message = {
      channel: this.slackChannel,
      user: userId,
      blocks,
    }
    this.slackClient.chat.postMessage(message);
  }

  deleteOriginalMessage(responseUrl) {
    axios.post(responseUrl, {
      delete_original: true,
    });
  }
}

export default SlackClient;
