import axios from 'axios';
import { WebClient } from '@slack/web-api';

class SlackClient {
  constructor(channelId, appToken) {
    this.slackChannel = channelId;
    this.slackClient = new WebClient(appToken);
  }

  async getAllChannelMembers() {
    const options = {
      channel: this.slackChannel,
    };
    return await this.slackClient.conversations.members(options);
  }

  async postEphemeral(userId, blocks) {
    const message = {
      channel: this.slackChannel,
      user: userId,
      blocks,
    };
    return await this.slackClient.chat.postEphemeral(message);
  }

  async postMessage(userId, blocks) {
    const message = {
      channel: this.slackChannel,
      user: userId,
      blocks,
    };
    return await this.slackClient.chat.postMessage(message);
  }

  async updateMessage(timestamp, blocks) {
    const message = {
      channel: this.slackChannel,
      ts: timestamp,
      blocks,
    };
    return await this.slackClient.chat.update(message);
  }

  deleteOriginalMessage(responseUrl) {
    axios.post(responseUrl, {
      delete_original: true,
    });
  }
}

export default SlackClient;
