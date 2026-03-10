import { NavLink } from 'react-router-dom';

const DashboardNav = () => (
  <nav className="trivia-nav">
    <NavLink exact to="/trivia" className="trivia-nav-link" activeClassName="active">
      Leaderboard
    </NavLink>
    <NavLink to="/trivia/history" className="trivia-nav-link" activeClassName="active">
      Game History
    </NavLink>
  </nav>
);

export default DashboardNav;
