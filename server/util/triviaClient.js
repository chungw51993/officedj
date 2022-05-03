import axios from 'axios';

class TriviaClient {
  async getTriviaQuestion(category, difficulty) {
    let url = `https://opentdb.com/api.php?amount=1&type=multiple&difficulty=${difficulty}`;
    if (category !== 'all') {
      url += `&category=${category}`;
    }
    const { data: { results } } = await axios({
      method: 'GET',
      url,
    });
    return results[0];
  }
}

export default new TriviaClient();
