import axios from 'axios';

import randomNumber from './randomNumber';

class TriviaClient {
  getTriviaQuestion(category, difficulty) {
    console.log('Getting question for category: ', difficulty, category);
    return new Promise((resolve, reject) => {
      let url = `https://opentdb.com/api.php?amount=5&type=multiple&difficulty=${difficulty}`;
      if (category !== 'all') {
        url += `&category=${category}`;
      }
      let question = null;
      const grabQuestion = () => {
        axios({
          method: 'GET',
          url,
        }).then(({ data: { results } }) => {
          console.log('Number of question grabbed: ', results.length);
          if (results.length > 0) {
            const randomIdx = randomNumber(results.length);
            console.log('Selected: ', randomIdx, ' question');
            question = results[randomIdx];
            resolve(results[randomIdx]);
          } else {
            grabQuestion();
          }
        }).catch(grabQuestion);
      }
      grabQuestion();
    });
  }
}

export default new TriviaClient();
