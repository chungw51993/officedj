import axios from 'axios';

import randomNumber from './randomNumber';

class TriviaClient {
  getTriviaQuestion(category, difficulty) {
    console.log('Getting question for category: ', difficulty, category);
    return new Promise((resolve, reject) => {
      let url = `https://the-trivia-api.com/api/questions?limit=5&difficulty=${difficulty}`;
      if (category !== 'all') {
        url += `&categories=${category}`;
      }
      let question = null;
      const grabQuestion = () => {
        axios({
          method: 'GET',
          url,
        }).then(({ data }) => {
          console.log('Number of question grabbed: ', data.length);
          if (data.length > 0) {
            const randomIdx = randomNumber(data.length);
            console.log('Selected: ', randomIdx, ' question');
            question = data[randomIdx];
            resolve(data[randomIdx]);
          } else {
            grabQuestion();
          }
        }).catch();
      }
      grabQuestion();
    });
  }
}

export default new TriviaClient();
