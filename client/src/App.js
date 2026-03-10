import { Switch, Route } from 'react-router-dom';

import DJApp from './DJApp';
import Leaderboard from './trivia/Leaderboard';
import PlayerDetail from './trivia/PlayerDetail';
import GameHistory from './trivia/GameHistory';

import './asset/style/App.scss';
import './asset/style/Trivia.scss';

const App = () => (
  <Switch>
    <Route exact path="/trivia" component={Leaderboard} />
    <Route path="/trivia/players/:userId" component={PlayerDetail} />
    <Route path="/trivia/history" component={GameHistory} />
    <Route path="/" component={DJApp} />
  </Switch>
);

export default App;
