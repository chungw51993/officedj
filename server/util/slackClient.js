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
    try {
      return await this.slackClient.conversations.members(options);
    } catch (err) {
      console.error('Error getting channel members', err);
    }
  }

  async postEphemeral(userId, blocks) {
    const message = {
      channel: this.slackChannel,
      user: userId,
      blocks,
    };
    try {
      return await this.slackClient.chat.postEphemeral(message);
    } catch (err) {
      console.error('Error posting ephemeral', err, message);
    }
  }

  async postMessage(userId, blocks) {
    const message = {
      channel: this.slackChannel,
      user: userId,
      blocks,
    };
    try {
      return await this.slackClient.chat.postMessage(message);
    } catch (err) {
      console.error('Error posting message', err, message);
    }
  }

  async updateMessage(timestamp, blocks) {
    const message = {
      channel: this.slackChannel,
      ts: timestamp,
      blocks,
    };
    try {
      return await this.slackClient.chat.update(message);
    } catch (err) {
      console.error('Error updating message', err, message);
    }
  }

  deleteOriginalMessage(responseUrl) {
    axios.post(responseUrl, {
      delete_original: true,
    });
  }

  formTextSections(texts) {
    if (typeof texts === 'object') {
      return texts.map((text) => ({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      }));
    }
    return [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: texts,
      },
    }];
  }
}

export default SlackClient;
