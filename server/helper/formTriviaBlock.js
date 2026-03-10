import categories from './triviaCategory';
import slackClient from '../util/slackClient';
import randomNumber from '../util/randomNumber';
import shuffle from '../util/shuffle';

const slack = new slackClient();

export const help = () => {
  return [
    ...slack.formTextSections([
      '*/category*\nShows all the categories.',
      '*/set-name*\nSet display name that will be used for trivia',
      '*/show-name*\nShow current display name',
      '*/start*\nStarts a round of trivia with 3 people!',
      '*/leaderboard*\nShow top 10 players by lifetime score',
      '*/stats*\nShow your category breakdown stats',
      '*/stats @user*\nShow another player\'s category stats',
    ]),
    {
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
    }
  ];
};

export const showCategories = () => {
  const blocks = slack.formTextSections('*These are all the categories for TRIVIA*');
  const sections = [];
  let fields = [];
  categories.slice(1).forEach(({ label }, idx) => {
    const field = {
      type: 'mrkdwn',
      text: `*${label}*`,
    }
    if (fields.length < 2) {
      fields.push(field);
    } else if (fields.length === 2) {
      sections.push({
        type: 'section',
        fields,
      });
      fields = [field];
    }
  });
  return [
    ...blocks,
    ...sections,
    {
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
    },
  ];
};

export const displayNameSet = (name) => {
  return [
    ...slack.formTextSections(`Your display name is\n*${name}*`),
    {
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
    },
  ];
};

export const noDisplayName = () => {
  return [
    ...slack.formTextSections('It doesn\'t look like you have a display name set.\nPlease use `/set-name` command to set your name'),
    {
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
    },
  ];
};

export const startReminder = (min) => slack.formTextSections(`:loudspeaker: Trivia commences in ${min} minutes`);

export const startCounter = (remaining) => {
  let text = null;
  if (remaining === 1) {
    text = 'Just ' + remaining + ' more player needed to start! Please type `/start` to start';
  } else if (remaining === 2) {
    text = 'Looks like we want to start a round of trivia. Just need ' + remaining + ' more players to type `/start`';
  }
  return slack.formTextSections(text);
};

export const alreadyStart = () => [
  ...slack.formTextSections('You already voted to start. Please get others to join in!'),
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Okay fine I\'ll try',
        },
        value: 'ignore',
      },
    ],
  },
];

export const triviaStarted = (lastWinner) => {
  const messages = [
    '<!here> :rotating_light: *TRIVIA COMMENCING!* :rotating_light:',
  ];

  if (lastWinner) {
    messages.push(`Last winner: :crown: *${lastWinner}* — can they defend the title?`);
  }

  messages.push(
    '10 rounds | :one: Easy (1pt) → :two: Medium (2pt) → :three: Hard (3pt)',
    'First correct answer picks the next category. Ties go to :skull_and_crossbones: *Sudden Death*',
    'Good luck everybody — here we go!',
  );

  return slack.formTextSections(messages);
};

export const sendTriviaQuestion = (round, category, trivia) => {
  const {
    difficulty,
    question,
  } = trivia;
  return slack.formTextSections([
    `*ROUND ${round}*`,
    `Category: *${category.label}*`,
    `Difficulty: *${difficulty.toUpperCase()}*`,
    `*${question}*`,
    '\n',
  ]);
};

export const sendAnswerCountDown = (count) => {
  let text = `Please select an answer below *you have ${count} seconds to answer!*`;
  if (count <= 0) {
    text = '*Times up!*';
  }
  return slack.formTextSections(text);
};

export const sendTriviaAnswers = (gameId, trivia) => {
  const {
    category,
    difficulty,
    question,
    correctAnswer,
    incorrectAnswers,
  } = trivia;
  if (!incorrectAnswers.includes(correctAnswer)) {
    incorrectAnswers.push(correctAnswer);
  }
  const answers = shuffle(incorrectAnswers);
  const buttons = [];
  answers.forEach((answer) => {
    buttons.push({
      type: 'actions',
      elements: [{
        type: 'button',
        text: {
          type: 'plain_text',
          text: answer,
        },
        value: JSON.stringify({
          action: 'triviaAnswer',
          gameId,
          answer,
          correctAnswer,
          question,
          category,
          difficulty,
        }),
      }],
    });
  });
  return buttons;
};

export const sendYouAnswered = answer => slack.formTextSections(`Your answer was *${answer}*`);

export const sendCorrectAnswer = (answer) => {
  return slack.formTextSections([
    'Correct answer was :drum_with_drumsticks:',
    `*${answer}*`,
    `\n`,
  ]);
};

export const sendEndRound = (correctPlayers, wrongPlayers, isLastRound) => {
  const responses = [
    'Now let\'s see who guessed correctly',
    'Let\'s take a look who got it right',
    'Who was smart enough to get this correct',
  ];
  const randomIdx = randomNumber(responses.length);
  const text = responses[randomIdx];
  const blocks = slack.formTextSections(text);
  if (correctPlayers.length > 0) {
    const sections = [];
    correctPlayers.forEach((p, idx) => {
      let name = `<@${p.id}>`;
      if (p.displayName) {
        name = `*${p.displayName}*`;
      }
      let fields = [{
        type: 'mrkdwn',
        text: name,
      }];
      if (idx === 0 && !isLastRound) {
        fields.push({
          type: 'mrkdwn',
          text: ':star2: Select Next Category',
        });
      }
      sections.push({
        type: 'section',
        fields,
      });
    });
    sections.push(...slack.formTextSections('\n\n'));
    blocks.push(...sections);
  } else {
    const noCorrectMsg = [
      'Nobody?! Well that\'s disappointing',
    ];
    blocks.push(...slack.formTextSections(noCorrectMsg));
  }
  if (wrongPlayers.length > 0) {
    const wrongResponses = [
      'Now let\'s see who guessed incorrectly :eyes:',
      'Let\'s take a look at who didn\'t know :face_palm:',
    ];
    const wRandomIdx = randomNumber(wrongResponses.length);
    const wText = wrongResponses[wRandomIdx];
    blocks.push(...slack.formTextSections(wText));
    const sections = [];
    wrongPlayers.forEach((p, idx) => {
      let text = `<@${p.id}> answered *${p.answer}*`;
      if (p.displayName) {
        text = `*${p.displayName}* answered *${p.answer}*`;
      }
      const fields = [{
        type: 'mrkdwn',
        text,
      }];
      sections.push({
        type: 'section',
        fields,
      });
    });
    sections.push(...slack.formTextSections('\n\n'));
    blocks.push(...sections);
  }
  if (correctPlayers.length === 0 && !isLastRound) {
    const noCorrectMsg = [
      'I guess I\'ll select the next category since nobody answered correctly',
      '\n',
    ];
    blocks.push(...slack.formTextSections(noCorrectMsg));
  }

  return blocks;
};

export const sendWrongPassword = () => {
  const responses = [
    'WRONG! Try to guess harder next time',
    'You were just off by one character I swear',
    'You\'ll never get it right!',
  ];
  const randomIdx = randomNumber(responses.length);
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: responses[randomIdx],
    },
  }, {
    type: 'actions',
    elements: [{
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'I\'m sorry for hacking',
      },
      value: 'ignore',
    }],
  }];
};

// ─── Sudden Death Messages ────────────────────────────────────

export const sendSuddenDeathIntro = (tiedPlayers) => {
  const playerNames = tiedPlayers.map(p =>
    p.displayName ? `*${p.displayName}*` : `<@${p.id}>`
  ).join(', ');

  return slack.formTextSections([
    ':rotating_light: :rotating_light: :rotating_light:',
    'Uh oh looks like we have a TIE for first place!',
    `${playerNames} are all tied up!`,
    '\n',
    'You know what that means...',
    ':skull_and_crossbones: *SUDDEN DEATH* :skull_and_crossbones:',
    '\n',
    'Here are the rules:',
    ':one: All questions are *HARD* difficulty',
    ':two: Answer *wrong* and you\'re *ELIMINATED* :coffin:',
    ':three: Last one standing takes the :crown:',
    '\n',
    'Let\'s go!',
  ]);
};

export const sendSuddenDeathQuestion = (round, category, trivia) => {
  const { difficulty, question } = trivia;
  return slack.formTextSections([
    `:skull_and_crossbones: *SUDDEN DEATH — ROUND ${round}* :skull_and_crossbones:`,
    `Category: *${category.label}*`,
    `Difficulty: *${difficulty.toUpperCase()}*`,
    `*${question}*`,
    '\n',
  ]);
};

export const sendSuddenDeathElimination = (player) => {
  const name = player.displayName ? `*${player.displayName}*` : `<@${player.id}>`;
  const responses = [
    `${name} got it wrong! :coffin: *ELIMINATED!*`,
    `${name} is out! :wave: Better luck next time!`,
    `Wrong answer! ${name} has been eliminated :skull:`,
  ];
  const idx = randomNumber(responses.length);
  return slack.formTextSections(responses[idx]);
};

export const sendSuddenDeathWinner = (player) => {
  const name = player.displayName ? `*${player.displayName}*` : `<@${player.id}>`;
  return slack.formTextSections([
    ':tada: :tada: :tada:',
    `${name} survives sudden death and takes the :crown:!`,
    '*What a champion!* :muscle:',
    '\n',
  ]);
};

export const sendSuddenDeathNobodyCorrect = () => {
  return slack.formTextSections([
    'Nobody got that one right :grimacing:',
    'Let\'s try another question...',
    '\n',
  ]);
};

export const sendSuddenDeathAllEliminated = () => {
  return slack.formTextSections([
    ':boom: Everyone got eliminated!',
    'That was quite the bloodbath :skull_and_crossbones:',
    ':recycle: *But we need a winner!* Everyone is back in — sudden death continues!',
    '\n',
  ]);
};

// ─── End Game Messages ────────────────────────────────────────

export const endGameMessages = (highScore, winners) => {
  if (winners[2]) {
    let endGameMessages = [
      'Alright well those were rough 10 rounds',
      'I don\'t even know if anybody deserves :one:st place',
      'But I guess let me reveal who won today\'s trivia',
      `\n`,
    ];
    if (highScore >= 15) {
      endGameMessages = [
        'Wow incredible one of yall was on :fire: today!',
        'I\'m sure everybody knows who\'s taking the :crown: today',
        'But let me announce today\'s winner!',
        '\n',
      ];
    } else if (highScore >= 10) {
      endGameMessages = [
        'Well hope everybody at least got half of those questions correct',
        'After 10 rounds let\'s see who takes home the :crown:',
        '\n',
      ];
    }
    const message = [];
    winners.map((players, idx) => {
      if (players) {
        if (idx === 0) {
          message.push(`:three:rd Place with ${players[0].score} points`);
        } else if (idx === 1) {
          message.push(`:two:nd Place with ${players[0].score} points`);
        } else if (idx === 2) {
          if (winners[1] && winners[1].players) {
            message.push('And');
          }
          message.push(`:one:st Place with ${players[0].score} points`);
          message.push(`and one${players.length > 1 ? 's' : ''} to take the :crown:`);
        }
        players.forEach((player) => {
          const {
            displayName,
            id,
          } = player;
          if (displayName) {
            message.push(`*${displayName}*`);
          } else {
            message.push(`<@${id}>`);
          }
        })
        message.push('\n');
      }
    });
    endGameMessages.push(...message);
    const byeMessage = [
      'I guess that\'s all for today\'s trivia',
      'Hope everybody learned something today',
      'I\'ll see you next time! :v:',
      '\n',
    ];
    endGameMessages.push(...byeMessage);
    return slack.formTextSections(endGameMessages);
  }
  return slack.formTextSections([
    'Hmmm I guess nobody played today or couldn\'t get any questions right!',
    'How disappointing :pensive:',
    '\n',
    'I guess that\'s all for today\'s trivia',
    'Hope everybody learned something today',
    'I\'ll see you next time! :v:',
    '\n',
  ]);
};

export const playerSelectCategory = (player, countdown) => {
  const {
    displayName,
    id,
  } = player;
  let text = `<@${id}>`;
  if (displayName) {
    text = `*${displayName}*`;
  }
  let timerText = `${text} is selecting the next round category`;
  if (countdown !== undefined) {
    timerText += countdown > 0
      ? ` — *${countdown}s* to pick or one will be chosen randomly!`
      : ' — *Time\'s up!* Picking a random category...';
  }
  return slack.formTextSections([
    timerText,
    '\n',
  ]);
};

export const categorySelected = (player, label) => {
  const {
    id,
    displayName,
  } = player;
  let text = `<@${id}>`;
  if (displayName) {
    text = `*${displayName}*`;
  }
  return slack.formTextSections([
    `${text} selected ${label}`,
    '\n',
  ]);
};

export const selectCategories = () => {
  const selectCats = [];
  const cCats = categories.slice();
  for(var i = cCats.length-1; selectCats.length < 4; i -= 1){
    const [cat] = cCats.splice(Math.floor(Math.random() * cCats.length), 1);
    selectCats.push(cat);
  }
  const buttons = [];
  selectCats.forEach((cat) => {
    const {
      label,
      value,
    } = cat;
    buttons.push({
      type: 'actions',
      elements: [{
        type: 'button',
        text: {
          type: 'plain_text',
          text: label,
          emoji: true,
        },
        value: JSON.stringify({
          action: 'categorySelect',
          label,
          categoryId: value,
        }),
      }],
    });
  });
  return [
    ...slack.formTextSections('Please select the next round category'),
    ...buttons,
  ];
};

// ─── Leaderboard & Stats Messages ─────────────────────────────

export const sendChannelLeaderboard = (playerList) => {
  if (!playerList || playerList.length === 0) {
    return null;
  }

  const medals = [':first_place_medal:', ':second_place_medal:', ':third_place_medal:'];
  const lines = playerList.slice(0, 5).map((p, idx) => {
    const rank = idx < 3 ? medals[idx] : `*${idx + 1}.*`;
    const name = p.displayName || `<@${p.id}>`;
    const winRate = p.gamesPlayed > 0
      ? `${Math.round((p.wins / p.gamesPlayed) * 100)}%`
      : '—';
    const sdLabel = p.suddenDeathWins > 0 ? ` | :skull_and_crossbones: ${p.suddenDeathWins}` : '';
    return `${rank} *${name}* — ${p.lifeTimeScore} pts | ${p.wins}W / ${p.gamesPlayed}G (${winRate})${sdLabel}`;
  });

  return slack.formTextSections([
    ':trophy: *CURRENT STANDINGS — TOP 5*',
    lines.join('\n'),
  ]);
};

export const sendLeaderboard = (playerList) => {
  if (!playerList || playerList.length === 0) {
    return [
      ...slack.formTextSections([
        ':trophy: *TRIVIA LEADERBOARD*',
        '\n',
        'No players have scored yet! Play some trivia first.',
      ]),
      {
        type: 'actions',
        elements: [{
          type: 'button',
          text: { type: 'plain_text', text: 'Got it' },
          value: 'ignore',
        }],
      },
    ];
  }

  const medals = [':first_place_medal:', ':second_place_medal:', ':third_place_medal:'];
  const blocks = slack.formTextSections(':trophy: *TRIVIA LEADERBOARD — TOP 10*');

  playerList.forEach((p, idx) => {
    const rank = idx < 3 ? medals[idx] : `*${idx + 1}.*`;
    const name = p.displayName || `<@${p.id}>`;
    const winRate = p.gamesPlayed > 0
      ? `${Math.round((p.wins / p.gamesPlayed) * 100)}%`
      : '—';
    const sdLabel = p.suddenDeathWins > 0 ? ` | :skull_and_crossbones: ${p.suddenDeathWins}` : '';

    blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `${rank} *${name}*`,
        },
        {
          type: 'mrkdwn',
          text: `:star: ${p.lifeTimeScore} pts | :trophy: ${p.wins}W / ${p.gamesPlayed}G (${winRate})${sdLabel}`,
        },
      ],
    });
  });

  blocks.push({
    type: 'actions',
    elements: [{
      type: 'button',
      text: { type: 'plain_text', text: 'Dismiss' },
      value: 'ignore',
    }],
  });

  return blocks;
};

export const sendPlayerStats = (player, categoryList) => {
  const name = player.displayName || `<@${player.id}>`;
  const winRate = player.gamesPlayed > 0
    ? `${Math.round((player.wins / player.gamesPlayed) * 100)}%`
    : '—';

  const blocks = slack.formTextSections([
    `:bar_chart: *STATS — ${name}*`,
  ]);

  // Overview section
  blocks.push({
    type: 'section',
    fields: [
      { type: 'mrkdwn', text: `:star: *Lifetime Score:* ${player.lifeTimeScore}` },
      { type: 'mrkdwn', text: `:video_game: *Games Played:* ${player.gamesPlayed}` },
      { type: 'mrkdwn', text: `:trophy: *Wins:* ${player.wins} (${winRate})` },
      { type: 'mrkdwn', text: `:skull_and_crossbones: *Sudden Death Wins:* ${player.suddenDeathWins}` },
    ],
  });

  blocks.push({ type: 'divider' });
  blocks.push(...slack.formTextSections('*Category Breakdown*'));

  const catStats = player.categoryStats || {};
  const catMap = {};
  categoryList.forEach(c => { catMap[c.value] = c.label; });

  // Build category rows
  const catEntries = Object.entries(catStats)
    .filter(([, stats]) => stats.correct > 0 || stats.wrong > 0)
    .sort((a, b) => b[1].points - a[1].points);

  if (catEntries.length === 0) {
    blocks.push(...slack.formTextSections('No category stats yet. Play some trivia!'));
  } else {
    catEntries.forEach(([catValue, stats]) => {
      const label = catMap[catValue] || catValue;
      const total = stats.correct + stats.wrong;
      const accuracy = total > 0 ? `${Math.round((stats.correct / total) * 100)}%` : '—';
      blocks.push({
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `${label}` },
          { type: 'mrkdwn', text: `:white_check_mark: ${stats.correct} | :x: ${stats.wrong} | :dart: ${accuracy} | :star: ${stats.points} pts` },
        ],
      });
    });
  }

  blocks.push({
    type: 'actions',
    elements: [{
      type: 'button',
      text: { type: 'plain_text', text: 'Dismiss' },
      value: 'ignore',
    }],
  });

  return blocks;
};

export const sendNoStats = (userId) => {
  return [
    ...slack.formTextSections(`No stats found for <@${userId}>. They haven't played any trivia yet!`),
    {
      type: 'actions',
      elements: [{
        type: 'button',
        text: { type: 'plain_text', text: 'Got it' },
        value: 'ignore',
      }],
    },
  ];
};
