import { decode } from 'html-entities';

import categories from './triviaCategory';

export const help = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/category*\nShows all the categories.',
    },
  },{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/create*\nCreates a round of trivia and allow people to get ready for the round.',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/join-round*\nLet Delta Trebek know that you want to join the round!',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*/start*\nStarts the round but make sure everybody joined because nobody can join after round starts!',
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
  }];
};

export const showCategories = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '*These are all the categories*',
    },
  }, ...categories.slice(1).map(({ label }) => ({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${label}*`,
    },
  })), {
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
  }];
};

export const startReminder = () => {
  const responses = [
    'Trivia is about to start in 5 mins so please get ready!',
    ':loudspeaker: Trivia commences in 5 minutes',
  ];
  const randomIdx = Math.floor(Math.random() * responses.length);
  const text = responses[randomIdx];
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  }];
};

export const triviaStarted = () => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Welcome ladies and gentlemen',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'It\'s time for another TRIVIA!',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Good luck to everybody and here we go!',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '\n',
    },
  }];
};

export const sendTriviaQuestion = (round, category, trivia) => {
  const {
    difficulty,
    question,
  } = trivia;
  const q = decode(question);
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*ROUND ${round}*`,
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Category: *${category.label}*`,
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Difficulty: *${difficulty.toUpperCase()}*`,
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${q}*`,
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '\n',
    },
  }];
};

export const sendAnswerCountDown = (count) => {
  let text = `Please select an answer below *you have ${count} seconds to answer!*`;
  if (count <= 0) {
    text = '*Times up!*';
  }
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  }];
};

export const sendTriviaAnswers = (gameId, trivia) => {
  const {
    category,
    difficulty,
    question,
    correct_answer,
    incorrect_answers,
  } = trivia;
  incorrect_answers.push(correct_answer);
  const answers = incorrect_answers.map((ans) => decode(ans));
  for (let i = answers.length - 1; i < 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = answers[i];
    answers[i] = answers[j];
    answers[j] = temp;
  }
  const q = decode(question);
  const correctAnswer = decode(correct_answer);
  const buttons = [];
  answers.forEach((answer) => {
    buttons.push({
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
        question: q,
        category,
        difficulty,
      }),
    });
  });
  return [{
    type: 'actions',
    elements: buttons,
  }];
};

export const sendYouAnswered = (answer) => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Your answer was *${answer}*`,
    },
  }];
};

export const sendCorrectAnswer = (answer) => {
  return [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Correct answer was :drum_with_drumsticks:',
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*${answer}*`,
    },
  }, {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `\n`,
    },
  }];
};

export const sendEndRound = (currentPlayers) => {
  const contestants = currentPlayers.map((p) => `<@${p.id}>`);
  const responses = [
    'Now let\'s see who guessed correctly',
    'Let\'s take a look who got it right!',
    'Who was smart enough to get this right?',
  ];
  const nobodyResponses = [
    [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Nobody?!',
      },
    }, {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'That\'s disappointing',
      },
    }, {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Well I guess that\'s it for today see y\'all next time! :delta::zzz:',
      },
    }, {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '\n',
      },
    }],
  ];
  const randomIdx = Math.floor(Math.random() * responses.length);
  const nRandomIdx = Math.floor(Math.random() * nobodyResponses.length);
  const text = responses[randomIdx];
  const blocks = [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text,
    },
  }];
  if (contestants.length === 0) {
    const nobodyTexts = nobodyResponses[nRandomIdx];
    blocks.push(...nobodyTexts);
  } else {
    contestants.forEach((p) => {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: p,
        },
      });
    });
    const correctResponse = [{
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Alright moving on to next round!',
      },
    }, {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '\n',
      },
    }]
    blocks.push(...correctResponse);
  }
  return blocks;
}