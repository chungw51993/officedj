import axios from 'axios';

import randomNumber from './randomNumber';

class TriviaClient {
  async getTriviaQuestion(category, difficulty) {
    let url = `https://opentdb.com/api.php?amount=50&type=multiple&difficulty=${difficulty}`;
    if (category !== 'all') {
      url += `&category=${category}`;
    }
    const { data: { results } } = await axios({
      method: 'GET',
      url,
    });
    const randomIdx = randomNumber(results.length);
    return results[randomIdx];
  }
}

export default new TriviaClient();
