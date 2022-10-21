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
      '*/start*\nStarts a round of trivia with 3 people!'
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

export const triviaStarted = () => {
  return slack.formTextSections([
    '<!here> TRIVIA COMMENCING!',
    'Welcome ladies and gentlemen',
    'It\'s time for another TRIVIA!',
    '\n',
    'Now before we start I\'ll explain how this works for all the newcomers',
    'There will be 10 rounds of multiple choice trivia question',
    'First 3 rounds will be easy questions for :one: point',
    'Honestly everybody should get these :eyes:',
    'Next 3 rounds will be medium for :two: points',
    'and last 4 rounds will consist of hard questions',
    'which will be for :three: points',
    'Player who answers correctly first will be rewarded',
    'by picking the next category',
    '\n',
    'After 10 rounds I\'ll see who has the most points and determine who deserves the :crown:',
    'and in case of a tie we\'ll head into sudden death :skull_and_crossbones:',
    '\n',
    'I know trivia can be exhilarating but *PLEASE*',
    'refrain yourself from chatting while rounds are going',
    'so everybody can read the question',
    '\n',
    'Well good luck to everybody and here we go!',
  ]);
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

export const sendSuddenDeath = () => {
  return slack.formTextSections([
    ':rotating_light: Uh oh looks like we have a tie for the first place',
    'We know what that means',
    'It\'s time for SUDDEN DEATH',
    '\n',
    '\n',
    'Coming Soon :sunglasses:',
    'Play rock scissors paper for it or something I don\'t know',
    '\n',
  ]);
};

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

export const playerSelectCategory = (player) => {
  const {
    displayName,
    id,
  } = player;
  let text = `<@${id}>`;
  if (displayName) {
    text = `*${displayName}*`;
  }
  return slack.formTextSections([
    `${text} is selecting the next round category`,
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
