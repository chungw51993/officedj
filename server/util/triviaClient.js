import axios from 'axios';

class TriviaClient {
  async getTriviaQuestion(difficulty) {
    const { data: { results } } = await axios({
      method: 'GET',
      url: `https://opentdb.com/api.php?amount=1&type=multiple&difficulty=${difficulty}`,
    });
    return results[0];
  }
}

export default new TriviaClient();
