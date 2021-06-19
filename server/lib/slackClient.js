import axios from 'axios';
import { WebClient } from '@slack/web-api';

import formatSlackTrackMessage from './formatSlackTrackMessage';

const {
  SLACK_CHANNEL_ID,
  SLACK_APP_TOKEN,
} = process.env;

class SlackClient {
  constructor() {
    this.slackClient = new WebClient(SLACK_APP_TOKEN);
    this.slackChannel = SLACK_CHANNEL_ID;
  }

  sendHelpCommand(userId) {
    this.slackClient.chat.postEphemeral({
      channel: this.slackChannel,
      user: userId,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*/lookup*\nSearch for song by using song name',
        },
      }, {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*/current*\nShow current song playing',
        },
      }, {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*/gong*\nRing the gong for song to be skipped - 3 gongs will skip the song',
        },
      }, {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*/gongCount*\nShow gong count for current song playing',
        },
      }, {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*/next*\nShow the next song to play',
        },
      }, {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'Got it',
            },
            value: 'ignore',
          },
        ],
      }],
    });
  }

  sendNoTrackMessage(userId, songName) {
    this.slackClient.chat.postEphemeral({
      channel: this.slackChannel,
      user: userId,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Unfortunately I don't have ${songName} in my iPod*\nPlease try searching for a different song`,
        },
      }, {
        type: 'actions',
        elements: [{
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Let me try again',
          },
          value: 'ignore',
        }],
      }],
    });
  }

  sendNeedSongNameError(userId) {
    this.slackClient.chat.postEphemeral({
      channel: this.slackChannel,
      user: userId,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Unfortunately I\'m not a mind reader I only spin the tunes*\nPlease specify what song you want me to play',
        },
      }, {
        type: 'actions',
        elements: [{
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Let me try again',
          },
          value: 'ignore',
        }],
      }],
    });
  }

  sendAddTrackMessage(userId, tracks) {
    const blocks = formatSlackTrackMessage(tracks);
    this.slackClient.chat.postEphemeral({
      channel: this.slackChannel,
      user: userId,
      blocks,
    });
  }

  sendTrackAddedMessage(userId, trackInfo) {
    const {
      artist,
      name,
    } = trackInfo;
    this.slackClient.chat.postMessage({
      channel: this.slackChannel,
      blocks: [{
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `<@${userId}> just added *${name} by ${artist}* to the playlist!`,
        },
      }],
    });
  }

  deleteOriginalMessage(responseUrl) {
    axios.post(responseUrl, {
      delete_original: true,
    });
  }
}

export default SlackClient;
