import slackClient from '../util/slackClient';
import triviaClient from '../util/triviaClient';
import trivia from '../state/trivia';
import {
  help,
  showCategories,
  startReminder,
  triviaStarted,
  sendTriviaQuestion,
  sendAnswerCountDown,
  sendTriviaAnswers,
  sendCorrectAnswer,
  sendYouAnswered,
  sendEndRound,
} from '../helper/formTriviaBlock';

import spotifyController from './spotifyController';

import Logger from '../util/logger';

import categories from '../helper/triviaCategory';

const { v4: uuidv4 } = require('uuid');

const {
  TRIVIA_CHANNEL_ID,
  TRIVIA_APP_TOKEN,
} = process.env;

const slack = new slackClient(TRIVIA_CHANNEL_ID, TRIVIA_APP_TOKEN);

class TriviaController {
  constructor() {
    this.logger = Logger.getLogger('TriviaController');
    this.handleButton = this.handleButton.bind(this);
    this.sendTriviaQuestion = this.sendTriviaQuestion.bind(this);
    this.countDownAnswer = this.countDownAnswer.bind(this);
    this.sendCorrectAnswer = this.sendCorrectAnswer.bind(this);
    this.handleStart();
  }

  handleHelp(req, res) {
    const {
      user_id: userId,
    } = req.body;
    slack.postEphemeral(userId, help());
    res.status(200).send();
  }

  handleShowCategories(req, res) {
    const {
      user_id: userId,
    } = req.body;
    slack.postEphemeral(userId, showCategories());
    res.status(200).send();
  }

  handleStartReminder() {
    slack.postMessage(null, startReminder());
  }

  async handleStart() {
    const { members } = await slack.getAllChannelMembers();
    const currentPlayers = {};
    members.forEach((id) => {
      currentPlayers[id] = {
        answers: [],
        score: 0,
      };
    })
    await trivia.setState({
      currentRound: 1,
      currentGameId: uuidv4(),
      currentPlayers,
      state: 'started',
    });

    const messages = triviaStarted();
    sendMultipleMessages(messages, 2000, this.sendTriviaQuestion);
  }

  async sendTriviaQuestion() {
    const randomIdx = Math.floor(Math.random() * categories.length);
    const randomCategory = categories[randomIdx];
    const currentGameId = trivia.get('currentGameId');
    const currentRound = trivia.get('currentRound');
    const currentPlayers = trivia.get('currentPlayers');
    let difficulty = 'easy';
    if (currentRound >= 6) {
      difficulty = 'hard';
    } else if (currentRound >= 3) {
      difficulty = 'medium';
    }

    const question = await triviaClient.getTriviaQuestion(randomCategory.value, difficulty);
    const messages = sendTriviaQuestion(currentRound, randomCategory, question);
    await sendMultipleMessages(messages, 3000);

    const message = await delayMessage(sendAnswerCountDown(15));

    trivia.setState({
      currentQuestion: question,
      questionMessage: message,
    });

    setTimeout(async () => {
      const postAnswers = [];
      Object.keys(currentPlayers).forEach((p) => {
        if (currentPlayers[p].alive || currentRound === 1) {
          postAnswers.push(slack.postEphemeral(p, sendTriviaAnswers(currentGameId, question)));
        }
      });
      await Promise.all(postAnswers);
      this.countDownAnswer();
    }, 3000);
  }

  async handleButton(req, res) {
    const {
      payload,
    } = req.body;
    const {
      response_url: responseUrl,
      actions,
      user: {
        id: userId,
      },
    } = JSON.parse(payload);

    slack.deleteOriginalMessage(responseUrl);

    const [action] = actions;
    const {
      value,
    } = action;
    if (value !== 'ignore') {
      const {
        action,
        ...data
      } = JSON.parse(value);
      if (action === 'triviaAnswer') {
        this.handleTriviaAnswer(userId, data);
      }
    }

    res.status(200).send();
  }

  countDownAnswer() {
    let count = 15;
    const questionMessage = trivia.get('questionMessage');
    const intervalId = setInterval(() => {
      if (count <= 0) {
        clearInterval(intervalId);
      }
      slack.updateMessage(questionMessage.message.ts, sendAnswerCountDown(count));
      count--;
      if (count === 0) {
        setTimeout(this.sendCorrectAnswer, 1000);
      }
    }, 1000);
  }

  async sendCorrectAnswer() {
    const currentQuestion = trivia.get('currentQuestion');
    const currentRound = trivia.get('currentRound');
    const currentPlayers = trivia.get('currentPlayers');
    const messages = sendCorrectAnswer(currentQuestion.correct_answer);
    await trivia.setState({
      currentRound: currentRound + 1,
    });
    await sendMultipleMessages(messages, 4000);
    const livePlayers = [];
    Object.keys(currentPlayers).forEach((k) => {
      const {
        alive,
        answers,
      } = currentPlayers[k];
      if (alive && currentRound === answers.length) {
        livePlayers.push({
          ...currentPlayers[k],
          id: k,
        });
      }
    });
    const endMessages = sendEndRound(livePlayers);
    await sendMultipleMessages(endMessages, 2000);
    if (livePlayers.length > 0) {
      this.sendTriviaQuestion();
    }
  }

  handleTriviaAnswer(userId, data) {
    const {
      gameId,
      answer,
      correctAnswer,
      difficulty,
      question,
    } = data;
    const currentGameId = trivia.get('currentGameId');
    const currentQuestion = trivia.get('currentQuestion');
    const currentRound = trivia.get('currentRound');
    const currentPlayers = trivia.get('currentPlayers');
    if (gameId === currentGameId
      && (currentPlayers[userId].alive || currentRound === 1)
      && currentQuestion.correct_answer === correctAnswer) {
      const qAndA = {
        question: currentQuestion,
        answer,
      };
      currentPlayers[userId].answers.push(qAndA);
      if (answer === correctAnswer) {
        currentPlayers[userId].score += 1;
        currentPlayers[userId].alive = true;
      } else {
        currentPlayers[userId].alive = false;
      }
      slack.postEphemeral(userId, sendYouAnswered(answer));
      trivia.setState({
        currentPlayers,
      });
    }
  }
}

const delayMessage = (message, interval = 2000) => new Promise((resolve) => {
  setTimeout(() => {
    slack.postMessage(null, message)
      .then(resolve);
  }, interval);
});

const sendMultipleMessages = (messages, interval = 2000, onEnd) => new Promise((resolve) => {
  messages.forEach((msg, idx) => {
    setTimeout(() => {
      slack.postMessage(null, [msg]);
      if (idx === messages.length - 1) {
        resolve();
        if (onEnd) {
          setTimeout(onEnd, interval);
        }
      }
    }, interval * idx);
  });
});

export default new TriviaController();