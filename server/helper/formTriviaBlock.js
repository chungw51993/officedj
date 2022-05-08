import { decode } from 'html-entities';

import categories from './triviaCategory';
import slackClient from '../util/slackClient';
import randomNumber from '../util/randomNumber';

const slack = new slackClient();

export const help = () => {
  return [
    ...slack.formTextSections([
      '*/category*\nShows all the categories.',
      '*/start*\nStarts the round but make sure everybody joined because nobody can join after round starts!',
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

export const startReminder = () => {
  const responses = [
    'Trivia is about to start in 5 mins so please get ready!',
    ':loudspeaker: Trivia commences in 5 minutes',
  ];
  const randomIdx = randomNumber(responses.length);
  return slack.formTextBlocks(responses[randomIdx]);
};

export const triviaStarted = () => {
  return slack.formTextSections([
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
    'Please follow the rule or my creator',
    ':candy-rapper-2:',
    'will ban you :wink:',
    '\n',
    'Well good luck to everybody and here we go!',
  ]);
};

export const sendTriviaQuestion = (round, category, trivia) => {
  const {
    difficulty,
    question,
  } = trivia;
  const q = decode(question);
  return slack.formTextSections([
    `*ROUND ${round}*`,
    `Category: *${category.label}*`,
    `Difficulty: *${difficulty.toUpperCase()}*`,
    `*${q}*`,
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
    correct_answer,
    incorrect_answers,
  } = trivia;
  incorrect_answers.push(correct_answer);
  const answers = incorrect_answers.map((ans) => decode(ans));
  for (let i = answers.length - 1; i < 0; i -= 1) {
    const j = randomNumber(i + 1);
    const temp = answers[i];
    answers[i] = answers[j];
    answers[j] = temp;
  }
  const q = decode(question);
  const correctAnswer = decode(correct_answer);
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
          question: q,
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

export const sendEndRound = (correctPlayers) => {
  const sections = [];
  correctPlayers.forEach((p) => {
    sections.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `<@${p.id}>`,
        },
        {
          type: 'mrkdwn',
          text: `${p.score} point${p.score > 1 ? 's' : ''}`,
        },
      ],
    });
  });
  const responses = [
    'Now let\'s see who guessed correctly',
    'Let\'s take a look who got it right!',
    'Who was smart enough to get this right?',
  ];
  const randomIdx = randomNumber(responses.length);
  const text = responses[randomIdx];
  const block = slack.formTextSections(text);
  return [
    ...block,
    ...sections,
    ...slack.formTextSections([
      '\n',
    ]),
  ];
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
