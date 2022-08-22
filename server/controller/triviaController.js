import cron from 'node-cron';

import slackClient from '../util/slackClient';
import triviaClient from '../util/triviaClient';
import trivia from '../state/trivia';
import {
  help,
  showCategories,
  displayNameSet,
  noDisplayName,
  startReminder,
  startCounter,
  alreadyStart,
  triviaStarted,
  sendTriviaQuestion,
  sendAnswerCountDown,
  sendTriviaAnswers,
  sendCorrectAnswer,
  sendYouAnswered,
  sendEndRound,
  sendWrongPassword,
  sendSuddenDeath,
  endGameMessages,
  playerSelectCategory,
  categorySelected,
  selectCategories,
} from '../helper/formTriviaBlock';

import spotifyController from './spotifyController';

import Logger from '../util/logger';
import randomNumber from '../util/randomNumber';

import categories from '../helper/triviaCategory';

const { v4: uuidv4 } = require('uuid');

const {
  TRIVIA_CHANNEL_ID,
  TRIVIA_USER_ID,
  TRIVIA_APP_TOKEN,
} = process.env;

const COUNT_DOWN = 8;
const NUM_ROUND = 10;

const slack = new slackClient(TRIVIA_CHANNEL_ID, TRIVIA_APP_TOKEN);

class TriviaController {
  constructor() {
    this.logger = Logger.getLogger('TriviaController');
    this.handleStartReminder = this.handleStartReminder.bind(this);
    this.handleStart = this.handleStart.bind(this);
    this.handleButton = this.handleButton.bind(this);
    this.sendTriviaQuestion = this.sendTriviaQuestion.bind(this);
    this.countDownAnswer = this.countDownAnswer.bind(this);
    this.sendCorrectAnswer = this.sendCorrectAnswer.bind(this);
    cron.schedule('0 55 16 * * 1-5', this.handleStartReminder, {
      scheduled: true,
      timezone: 'America/Chicago',
    });
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

  async handleSetDisplayName(req, res) {
    const {
      user_id: userId,
      text,
    } = req.body;
    const players = trivia.get('players');
    if (players[userId]) {
      players[userId].displayName = text;
    } else {
      players[userId] = {
        displayName: text,
        lifeTimeScore: 0,
      };
    }
    await trivia.setState({
      players,
    });
    slack.postEphemeral(userId, displayNameSet(text));
    res.status(200).send();
  }

  handleShowDisplayName(req, res) {
    const {
      user_id: userId,
    } = req.body;
    const players = trivia.get('players');
    if (players[userId] && players[userId].displayName) {
      slack.postEphemeral(userId, displayNameSet(players[userId].displayName));
    } else {
      slack.postEphemeral(userId, noDisplayName());
    }
    res.status(200).send();
  }

  async handleStartReminder() {
    const state = trivia.get('state');
    const startVoter = trivia.get('startVoter');
    let startCount = trivia.get('startCount');
    if (state === 'waiting') {
      const message = await slack.postMessage(null, startReminder(5));
      await trivia.setState({
        reminderMessage: message,
        state: 'scheduled',
      });
      this.countDownReminder();
    }
  }

  countDownReminder() {
    let count = 5;
    const reminderMessage = trivia.get('reminderMessage');
    const intervalId = setInterval(() => {
      if (count <= 0) {
        clearInterval(intervalId);
      }
      slack.updateMessage(reminderMessage.message.ts, startReminder(count));
      count--;
      if (count === 0) {
        setTimeout(this.handleStart, 1000);
      }
    }, 60000);
  }

  async handleStart(req, res) {
    console.log('Starting trivia');
    const { members } = await slack.getAllChannelMembers();
    const currentPlayers = {};
    members.forEach((id) => {
      if (id !== TRIVIA_USER_ID) {
        currentPlayers[id] = {
          answers: [],
          score: 0,
        };
      }
    })
    await trivia.setState({
      currentRound: 1,
      currentGameId: uuidv4(),
      currentPlayers,
      state: 'started',
      startCount: 0,
      startVoter: [],
    });
    const messages = triviaStarted();
    sendMultipleMessages(messages, 3500, this.sendTriviaQuestion);
    if (res) {
      res.status(200).send();
    }
  }

  async sendTriviaQuestion() {
    const currentGameId = trivia.get('currentGameId');
    const currentRound = trivia.get('currentRound');
    const currentPlayers = trivia.get('currentPlayers');
    const selectedCategory = trivia.get('selectedCategory');
    let difficulty = 'easy';
    if (currentRound > 6) {
      difficulty = 'hard';
    } else if (currentRound > 3) {
      difficulty = 'medium';
    }

    let cat = selectedCategory;
    if (!cat.value) {
      const randomIdx = randomNumber(categories.length);
      const randomCategory = categories[randomIdx];
      cat = randomCategory;
    }
    try {
      const question = await triviaClient.getTriviaQuestion(cat.value, difficulty);

      console.log('Sending question: ', question);

      const messages = sendTriviaQuestion(currentRound, cat, question);
      await sendMultipleMessages(messages, 3000);

      const message = await delayMessage(sendAnswerCountDown(COUNT_DOWN));

      trivia.setState({
        currentQuestion: question,
        questionMessage: message,
        correctAnswers: [],
        wrongAnswers: [],
      });

      setTimeout(async () => {
        const postAnswers = [];
        Object.keys(currentPlayers).forEach((p) => {
          postAnswers.push(slack.postEphemeral(p, sendTriviaAnswers(currentGameId, question)));
        });
        await Promise.all(postAnswers);
        this.countDownAnswer();
      }, 3000);
    } catch (err) {
      console.error('Error sending trivia question: ', err);
    }
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
      } else if (action === 'categorySelect') {
        this.handleCategory(userId, data);
      }
    }

    res.status(200).send();
  }

  countDownAnswer() {
    let count = COUNT_DOWN;
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
    const correctAnswers = trivia.get('correctAnswers');
    const wrongAnswers = trivia.get('wrongAnswers');
    const players = trivia.get('players');
    const messages = sendCorrectAnswer(currentQuestion.correctAnswer);
    await trivia.setState({
      currentRound: currentRound + 1,
      currentQuestion: {},
    });
    await sendMultipleMessages(messages, 4000);
    const correctPlayers = [];
    const wrongPlayers = [];
    correctAnswers.forEach((k) => {
      let displayName = null;
      if (players[k] && players[k].displayName) {
        displayName = players[k].displayName;
      }
      correctPlayers.push({
        ...currentPlayers[k],
        id: k,
        displayName,
      });
    });
    wrongAnswers.forEach(({ id, answer }) => {
      let displayName = null;
      if (players[id] && players[id].displayName) {
        displayName = players[id].displayName;
      }
      wrongPlayers.push({
        ...currentPlayers[id],
        id,
        displayName,
        answer,
      });
    });
    const endMessages = sendEndRound(correctPlayers, wrongAnswers, currentRound === NUM_ROUND);
    await sendMultipleMessages(endMessages, 2000, () => {
      if (currentRound < NUM_ROUND) {
        this.nextRound();
      } else {
        this.endGame();
      }
    });
  }

  async nextRound() {
    const players = trivia.get('players');
    const correctAnswers = trivia.get('correctAnswers');
    if (correctAnswers.length > 0) {
      let displayName = null;
      if (players[correctAnswers[0]] && players[correctAnswers[0]].displayName) {
        displayName = players[correctAnswers[0]].displayName;
      }
      const playerSelecting = playerSelectCategory({
        id: correctAnswers[0],
        displayName,
      });
      slack.postMessage(correctAnswers[0], playerSelecting);
      delayEphemeralMessage(correctAnswers[0], selectCategories());
    } else {
      await trivia.setState({
        selectedCategory: {},
      });
      this.sendTriviaQuestion();
    }
  }

  async endGame() {
    const currentPlayers = trivia.get('currentPlayers');
    const players = trivia.get('players');
    let highScore = 0;
    const winners = [];
    const scores = {};
    Object.keys(currentPlayers).forEach((k) => {
      const {
        score,
      } = currentPlayers[k];
      if (score > 0) {
        let displayName = null;
        if (players[k] && players[k].displayName) {
          displayName = players[k].displayName;
        }
        if (scores[score]) {
          scores[score].push({
            ...currentPlayers[k],
            displayName,
            id: k,
          });
        } else {
          scores[score] = [{
            ...currentPlayers[k],
            displayName,
            id: k,
          }];
        }
        if (players[k]) {
          players[k].lifeTimeScore += score;
        } else {
          players[k] = {
            displayName: null,
            lifeTimeScore: score,
          };
        }
      }
    });
    const sortedScores = Object.keys(scores).sort((a, b) => b - a);
    if (sortedScores[0] && scores[sortedScores[0]].length > 1) {
      // TODO Figure out Sudden Death
      const suddenDeath = sendSuddenDeath();
      await sendMultipleMessages(suddenDeath, 2000);
    }
    sortedScores.forEach((score, idx) => {
      if (idx === 0) {
        highScore = score;
      }
      if (winners.length < 3) {
        winners.unshift(scores[score]);
      }
    });
    if (winners.length !== 3) {
      for (let i = winners.length; i < 3; i += 1) {
        winners.unshift(null);
      }
    }
    const endGame = endGameMessages(highScore, winners);
    sendMultipleMessages(endGame, 3500);
    await trivia.setState({
      players,
      currentGameId: null,
      currentPlayers: {},
      currentQuestion: {},
      currentAnswers: {},
      currentRound: 1,
      correctAnswers: [],
      questionMessage: {},
      state: 'waiting',
    });
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
    const correctAnswers = trivia.get('correctAnswers');
    const wrongAnswers = trivia.get('wrongAnswers');
    console.log('handling answer', currentQuestion.correctAnswer, correctAnswer, currentQuestion.correctAnswer === correctAnswer);
    if (gameId === currentGameId
      && currentQuestion.correctAnswer === correctAnswer) {
      const qAndA = {
        question: currentQuestion,
        answer,
      };
      currentPlayers[userId].answers.push(qAndA);
      if (answer === correctAnswer) {
        let point = 1;
        if (currentRound > 6) {
          point = 3;
        } else if (currentRound > 3) {
          point = 2;
        }
        currentPlayers[userId].score += point;
        correctAnswers.push(userId);
      } else {
        wrongAnswers.push({
          id: userId,
          answer,
        });
      }
      slack.postEphemeral(userId, sendYouAnswered(answer));
      trivia.setState({
        currentPlayers,
        correctAnswers,
        wrongAnswers,
      });
    }
  }

  async handleCategory(userId, data) {
    const {
      label,
      categoryId,
    } = data;
    const players = trivia.get('players');
    let displayName = null;
    if (players[userId] && players[userId].displayName) {
      displayName = players[userId].displayName;
    }
    const player = {
      id: userId,
      displayName,
    };
    await slack.postMessage(null, categorySelected(player, label));
    await trivia.setState({
      selectedCategory: {
        label,
        value: categoryId,
      },
    });
    setTimeout(this.sendTriviaQuestion, 2000);
  }
}

const delayMessage = (message, interval = 2000) => new Promise((resolve) => {
  setTimeout(() => {
    slack.postMessage(null, message)
      .then(resolve);
  }, interval);
});

const delayEphemeralMessage = (userId, message, interval = 2000) => new Promise((resolve) => {
  setTimeout(() => {
    slack.postEphemeral(userId, message)
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