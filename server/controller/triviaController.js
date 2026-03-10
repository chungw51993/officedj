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
  endGameMessages,
  playerSelectCategory,
  categorySelected,
  selectCategories,
  sendSuddenDeathIntro,
  sendSuddenDeathQuestion,
  sendSuddenDeathElimination,
  sendSuddenDeathWinner,
  sendSuddenDeathNobodyCorrect,
  sendSuddenDeathAllEliminated,
  sendChannelLeaderboard,
  sendLeaderboard,
  sendPlayerStats,
  sendNoStats,
} from '../helper/formTriviaBlock';

import spotifyController from './spotifyController';

import Logger from '../util/logger';
import randomNumber from '../util/randomNumber';

import categories from '../helper/triviaCategory';
import {
  ensurePlayerStats,
  ensureCategoryStats,
  updateCategoryStats,
  buildGameRecord,
} from '../helper/triviaStats';

const { v4: uuidv4 } = require('uuid');

const {
  TRIVIA_CHANNEL_ID,
  TRIVIA_USER_ID,
  TRIVIA_APP_TOKEN,
} = process.env;

const COUNT_DOWN = 8;
const NUM_ROUND = 10;

const slack = new slackClient(TRIVIA_CHANNEL_ID, TRIVIA_APP_TOKEN);

// Track category selection timer so it can be cancelled
let categoryTimerId = null;
let categoryMessageTs = null;

class TriviaController {
  constructor() {
    this.logger = Logger.getLogger('TriviaController');
    this.handleStartReminder = this.handleStartReminder.bind(this);
    this.handleStart = this.handleStart.bind(this);
    this.handleButton = this.handleButton.bind(this);
    this.sendTriviaQuestion = this.sendTriviaQuestion.bind(this);
    this.countDownAnswer = this.countDownAnswer.bind(this);
    this.sendCorrectAnswer = this.sendCorrectAnswer.bind(this);
    this.startSuddenDeath = this.startSuddenDeath.bind(this);
    this.sendSuddenDeathResult = this.sendSuddenDeathResult.bind(this);
    this.countDownSuddenDeath = this.countDownSuddenDeath.bind(this);
    this.countDownCategorySelection = this.countDownCategorySelection.bind(this);
    this.autoSelectCategory = this.autoSelectCategory.bind(this);
    this.handleLeaderboard = this.handleLeaderboard.bind(this);
    this.handleStats = this.handleStats.bind(this);
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
      players[userId] = ensurePlayerStats(players[userId]);
      players[userId].displayName = text;
    } else {
      players[userId] = ensurePlayerStats({ displayName: text });
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
      // Post top 5 leaderboard before countdown
      const players = trivia.get('players') || {};
      const topPlayers = Object.entries(players)
        .map(([id, p]) => ({ id, ...ensurePlayerStats(p) }))
        .filter(p => p.lifeTimeScore > 0 || p.gamesPlayed > 0)
        .sort((a, b) => b.lifeTimeScore - a.lifeTimeScore)
        .slice(0, 5);
      const leaderboardBlocks = sendChannelLeaderboard(topPlayers);
      if (leaderboardBlocks) {
        await slack.postMessage(null, leaderboardBlocks);
      }
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
    const gameHistory = trivia.get('gameHistory') || [];
    const lastWinner = gameHistory.length > 0 ? gameHistory[gameHistory.length - 1].winnerName : null;
    const messages = triviaStarted(lastWinner);
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
      const player = {
        id: correctAnswers[0],
        displayName,
      };
      const message = await slack.postMessage(null, playerSelectCategory(player, COUNT_DOWN));
      categoryMessageTs = message.message.ts;
      delayEphemeralMessage(correctAnswers[0], selectCategories());
      this.countDownCategorySelection(player);
    } else {
      await trivia.setState({
        selectedCategory: {},
      });
      this.sendTriviaQuestion();
    }
  }

  countDownCategorySelection(player) {
    let count = COUNT_DOWN;
    const intervalId = setInterval(() => {
      if (count <= 0) {
        clearInterval(intervalId);
      }
      if (categoryMessageTs) {
        slack.updateMessage(categoryMessageTs, playerSelectCategory(player, count));
      }
      count--;
      if (count === 0) {
        setTimeout(() => this.autoSelectCategory(), 1000);
      }
    }, 1000);
    categoryTimerId = intervalId;
  }

  async autoSelectCategory() {
    // Only fire if no category was manually selected
    const selectedCategory = trivia.get('selectedCategory');
    if (selectedCategory && selectedCategory.value) return;

    const randomIdx = randomNumber(categories.length);
    const cat = categories[randomIdx];
    if (categoryMessageTs) {
      slack.updateMessage(categoryMessageTs, playerSelectCategory({ id: '', displayName: 'Delta' }, 0));
    }
    await slack.postMessage(null, categorySelected({ id: '', displayName: 'Delta' }, cat.label));
    await trivia.setState({
      selectedCategory: {
        label: cat.label,
        value: cat.value,
      },
    });
    categoryMessageTs = null;
    setTimeout(this.sendTriviaQuestion, 2000);
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
        // Ensure player stats exist and update lifetime score
        players[k] = ensurePlayerStats(players[k] || { displayName });
        players[k].lifeTimeScore += score;
        players[k].gamesPlayed += 1;
      }
    });

    const sortedScores = Object.keys(scores).sort((a, b) => b - a);

    // Check for tie at the top
    if (sortedScores[0] && scores[sortedScores[0]].length > 1) {
      // Enter Sudden Death mode
      const tiedPlayers = {};
      scores[sortedScores[0]].forEach((p) => {
        tiedPlayers[p.id] = {
          id: p.id,
          displayName: p.displayName,
          score: p.score,
        };
      });

      // Save players with updated lifetime scores before sudden death
      await trivia.setState({
        players,
        suddenDeathPlayers: tiedPlayers,
        suddenDeathRound: 1,
        state: 'suddenDeath',
      });

      // Send sudden death intro then start
      const introMessages = sendSuddenDeathIntro(Object.values(tiedPlayers));
      await sendMultipleMessages(introMessages, 2500, this.startSuddenDeath);
      return;
    }

    // No tie — record wins and game history, then announce
    if (sortedScores[0] && scores[sortedScores[0]].length === 1) {
      const winnerId = scores[sortedScores[0]][0].id;
      players[winnerId] = ensurePlayerStats(players[winnerId]);
      players[winnerId].wins += 1;
    }

    // Record game history
    const gameHistory = trivia.get('gameHistory') || [];
    const gameRecord = buildGameRecord(
      trivia.get('currentGameId'),
      currentPlayers,
      players,
      sortedScores[0] && scores[sortedScores[0]].length === 1
        ? scores[sortedScores[0]][0]
        : null,
      false,
    );
    gameHistory.unshift(gameRecord);
    if (gameHistory.length > 50) gameHistory.pop();

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
      gameHistory,
      currentGameId: null,
      currentPlayers: {},
      currentQuestion: {},
      currentAnswers: {},
      currentRound: 1,
      correctAnswers: [],
      questionMessage: {},
      state: 'waiting',
      suddenDeathPlayers: {},
      suddenDeathRound: 0,
    });
  }

  // ─── Sudden Death ───────────────────────────────────────────────

  async startSuddenDeath() {
    const suddenDeathPlayers = trivia.get('suddenDeathPlayers');
    const suddenDeathRound = trivia.get('suddenDeathRound');
    const currentGameId = trivia.get('currentGameId');
    const remainingIds = Object.keys(suddenDeathPlayers);

    // No max round cap — sudden death goes until there's a winner

    try {
      const randomIdx = randomNumber(categories.length);
      const cat = categories[randomIdx];
      const question = await triviaClient.getTriviaQuestion(cat.value, 'hard');

      console.log('Sudden death question: ', question);

      const messages = sendSuddenDeathQuestion(suddenDeathRound, cat, question);
      await sendMultipleMessages(messages, 3000);

      const message = await delayMessage(sendAnswerCountDown(COUNT_DOWN));

      await trivia.setState({
        currentQuestion: question,
        questionMessage: message,
        correctAnswers: [],
        wrongAnswers: [],
      });

      setTimeout(async () => {
        const postAnswers = [];
        remainingIds.forEach((p) => {
          postAnswers.push(slack.postEphemeral(p, sendTriviaAnswers(currentGameId, question)));
        });
        await Promise.all(postAnswers);
        this.countDownSuddenDeath();
      }, 3000);
    } catch (err) {
      console.error('Error in sudden death: ', err);
    }
  }

  countDownSuddenDeath() {
    let count = COUNT_DOWN;
    const questionMessage = trivia.get('questionMessage');
    const intervalId = setInterval(() => {
      if (count <= 0) {
        clearInterval(intervalId);
      }
      slack.updateMessage(questionMessage.message.ts, sendAnswerCountDown(count));
      count--;
      if (count === 0) {
        setTimeout(this.sendSuddenDeathResult, 1000);
      }
    }, 1000);
  }

  async sendSuddenDeathResult() {
    const currentQuestion = trivia.get('currentQuestion');
    const correctAnswers = trivia.get('correctAnswers');
    const wrongAnswers = trivia.get('wrongAnswers');
    const suddenDeathPlayers = trivia.get('suddenDeathPlayers');
    const suddenDeathRound = trivia.get('suddenDeathRound');
    const players = trivia.get('players');

    // Reveal the correct answer
    const answerMessages = sendCorrectAnswer(currentQuestion.correctAnswer);
    await sendMultipleMessages(answerMessages, 2000);

    // Eliminate wrong answerers
    const eliminatedIds = [];
    wrongAnswers.forEach(({ id }) => {
      if (suddenDeathPlayers[id]) {
        eliminatedIds.push(id);
      }
    });

    // Send elimination messages
    for (const eliminatedId of eliminatedIds) {
      const p = suddenDeathPlayers[eliminatedId];
      const elimMsg = sendSuddenDeathElimination(p);
      await sendMultipleMessages(elimMsg, 1500);
      delete suddenDeathPlayers[eliminatedId];
    }

    const remainingIds = Object.keys(suddenDeathPlayers);

    // Check win conditions
    if (remainingIds.length === 1) {
      // One player left — they win
      await this.endSuddenDeath(remainingIds[0]);
      return;
    }

    if (remainingIds.length === 0) {
      // Everyone got eliminated — bring them all back and keep going
      const allEliminatedMsg = sendSuddenDeathAllEliminated();
      await sendMultipleMessages(allEliminatedMsg, 2000);

      // Restore all eliminated players back into sudden death
      eliminatedIds.forEach((id) => {
        suddenDeathPlayers[id] = {
          id,
          displayName: (players[id] && players[id].displayName) || null,
        };
      });

      await trivia.setState({
        suddenDeathPlayers,
        suddenDeathRound: suddenDeathRound + 1,
        currentQuestion: {},
      });

      setTimeout(this.startSuddenDeath, 3000);
      return;
    }

    // If some got it right and none were eliminated to win, or nobody answered
    if (correctAnswers.length > 0 && correctAnswers.length < remainingIds.length) {
      // Some correct, some didn't answer — eliminate non-answerers
      const answeredSet = new Set([
        ...correctAnswers,
        ...wrongAnswers.map(w => w.id),
      ]);
      const noAnswerEliminated = [];
      remainingIds.forEach((id) => {
        if (!answeredSet.has(id) && suddenDeathPlayers[id]) {
          noAnswerEliminated.push(id);
          const p = suddenDeathPlayers[id];
          delete suddenDeathPlayers[id];
        }
      });

      const stillRemaining = Object.keys(suddenDeathPlayers);
      if (stillRemaining.length === 1) {
        await this.endSuddenDeath(stillRemaining[0]);
        return;
      }
    }

    if (correctAnswers.length === 0 && eliminatedIds.length === 0) {
      // Nobody answered at all
      const nobodyMsg = sendSuddenDeathNobodyCorrect();
      await sendMultipleMessages(nobodyMsg, 2000);
    }

    // Continue to next sudden death round
    await trivia.setState({
      suddenDeathPlayers,
      suddenDeathRound: suddenDeathRound + 1,
      currentQuestion: {},
    });

    setTimeout(this.startSuddenDeath, 3000);
  }

  async endSuddenDeath(winnerId) {
    const players = trivia.get('players');
    const suddenDeathPlayers = trivia.get('suddenDeathPlayers');
    const winner = suddenDeathPlayers[winnerId] || { id: winnerId, displayName: null };

    // Update player stats
    players[winnerId] = ensurePlayerStats(players[winnerId] || { displayName: winner.displayName });
    players[winnerId].suddenDeathWins += 1;
    players[winnerId].wins += 1;

    // Send winner announcement
    const winnerMsg = sendSuddenDeathWinner(winner);
    await sendMultipleMessages(winnerMsg, 2500);

    await this.finishGame(winner, true);
  }

  async endSuddenDeathCoWinners(tiedPlayers) {
    const coWinnerNames = Object.values(tiedPlayers)
      .map(p => p.displayName || `<@${p.id}>`)
      .join(', ');

    const msg = [
      `:skull_and_crossbones: After ${MAX_SUDDEN_DEATH_ROUNDS} rounds of sudden death, nobody could break the tie!`,
      `*${coWinnerNames}* share the :crown: as co-champions!`,
      '\n',
    ];
    const slackInstance = new slackClient(TRIVIA_CHANNEL_ID, TRIVIA_APP_TOKEN);
    const blocks = slackInstance.formTextSections(msg);
    await sendMultipleMessages(blocks, 2500);

    // Credit wins to all tied players
    const players = trivia.get('players');
    Object.values(tiedPlayers).forEach((p) => {
      players[p.id] = ensurePlayerStats(players[p.id] || { displayName: p.displayName });
      players[p.id].wins += 1;
    });
    await trivia.setState({ players });

    await this.finishGame(null, true);
  }

  async finishGame(winner, wasSuddenDeath) {
    const currentPlayers = trivia.get('currentPlayers');
    const players = trivia.get('players');
    const gameHistory = trivia.get('gameHistory') || [];

    const gameRecord = buildGameRecord(
      trivia.get('currentGameId'),
      currentPlayers,
      players,
      winner,
      wasSuddenDeath,
    );
    gameHistory.unshift(gameRecord);
    if (gameHistory.length > 50) gameHistory.pop();

    await trivia.setState({
      players,
      gameHistory,
      currentGameId: null,
      currentPlayers: {},
      currentQuestion: {},
      currentAnswers: {},
      currentRound: 1,
      correctAnswers: [],
      questionMessage: {},
      state: 'waiting',
      suddenDeathPlayers: {},
      suddenDeathRound: 0,
    });
  }

  // ─── Answer Handling ────────────────────────────────────────────

  handleTriviaAnswer(userId, data) {
    const {
      gameId,
      answer,
      correctAnswer,
      difficulty,
      question,
      category,
    } = data;
    const currentGameId = trivia.get('currentGameId');
    const currentQuestion = trivia.get('currentQuestion');
    const currentRound = trivia.get('currentRound');
    const currentPlayers = trivia.get('currentPlayers');
    const correctAnswers = trivia.get('correctAnswers');
    const wrongAnswers = trivia.get('wrongAnswers');
    const players = trivia.get('players');
    const gameState = trivia.get('state');

    console.log('handling answer', currentQuestion.correctAnswer, correctAnswer, currentQuestion.correctAnswer === correctAnswer);

    if (gameId === currentGameId
      && currentQuestion.correctAnswer === correctAnswer) {

      // Prevent double submissions
      const alreadyAnswered = correctAnswers.includes(userId)
        || wrongAnswers.some(w => w.id === userId);
      if (alreadyAnswered) return;

      const isCorrect = answer === correctAnswer;

      // Sudden death: only process for sudden death players, no score tracking
      if (gameState === 'suddenDeath') {
        const suddenDeathPlayers = trivia.get('suddenDeathPlayers');
        if (!suddenDeathPlayers[userId]) return;

        if (isCorrect) {
          correctAnswers.push(userId);
        } else {
          wrongAnswers.push({ id: userId, answer });
        }
        slack.postEphemeral(userId, sendYouAnswered(answer));
        trivia.setState({ correctAnswers, wrongAnswers });
        return;
      }

      // Regular game answer
      if (!currentPlayers[userId]) return;

      const qAndA = {
        question: currentQuestion,
        answer,
      };
      currentPlayers[userId].answers.push(qAndA);

      if (isCorrect) {
        let point = 1;
        if (currentRound > 6) {
          point = 3;
        } else if (currentRound > 3) {
          point = 2;
        }
        currentPlayers[userId].score += point;
        correctAnswers.push(userId);

        // Track category stats
        updateCategoryStats(players, userId, category, true, point);
      } else {
        wrongAnswers.push({
          id: userId,
          answer,
        });

        // Track category stats
        updateCategoryStats(players, userId, category, false, 0);
      }

      slack.postEphemeral(userId, sendYouAnswered(answer));
      trivia.setState({
        currentPlayers,
        correctAnswers,
        wrongAnswers,
        players,
      });
    }
  }

  async handleCategory(userId, data) {
    // Cancel the auto-select timer
    if (categoryTimerId) {
      clearInterval(categoryTimerId);
      categoryTimerId = null;
    }
    categoryMessageTs = null;

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

  // ─── Leaderboard & Stats ───────────────────────────────────────

  handleLeaderboard(req, res) {
    const {
      user_id: userId,
    } = req.body;
    const players = trivia.get('players');
    const playerList = Object.entries(players)
      .map(([id, p]) => ({
        id,
        ...ensurePlayerStats(p),
      }))
      .filter(p => p.lifeTimeScore > 0 || p.gamesPlayed > 0)
      .sort((a, b) => b.lifeTimeScore - a.lifeTimeScore)
      .slice(0, 10);

    slack.postEphemeral(userId, sendLeaderboard(playerList));
    res.status(200).send();
  }

  handleStats(req, res) {
    const {
      user_id: userId,
      text,
    } = req.body;

    // Check if text contains a user mention like <@U12345>
    let targetId = userId;
    if (text) {
      const mentionMatch = text.trim().match(/<@(U[A-Z0-9]+)(\|[^>]*)?>/);
      if (mentionMatch) {
        targetId = mentionMatch[1];
      }
    }

    const players = trivia.get('players');
    const player = players[targetId];

    if (!player || (!player.lifeTimeScore && !player.gamesPlayed)) {
      slack.postEphemeral(userId, sendNoStats(targetId));
      res.status(200).send();
      return;
    }

    const fullPlayer = {
      id: targetId,
      ...ensurePlayerStats(player),
    };
    slack.postEphemeral(userId, sendPlayerStats(fullPlayer, categories));
    res.status(200).send();
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
