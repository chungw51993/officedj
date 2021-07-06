import { useEffect, useState, useRef } from 'react';
import Lottie from 'react-lottie';

import initialState from './lib/initialState';
import SocketClient from './lib/socket';

import './asset/style/App.scss';

import deltaThinkingAnim from './asset/animation/delta-thinking.json';
import deltaGoodBadAnim from './asset/animation/delta-good-bad.json';

import spotifyImg from './asset/img/spotify.png';

const {
  API_URL,
} = window;

const App = () => {
  const [state, setState] = useState(initialState());
  const socket = useRef(new SocketClient()).current;

  useEffect(() => {
    initializeSocket();
  });

  const initializeSocket = async () => {
    try {
      await socket.init();
      socket.on('current:state', handleCurrentState);
    } catch(err) {
      console.error(err);
    }
  }

  const handleCurrentState = (data) => {
    const {
      state: s,
      user,
    } = data;
    const newState = {
      ...state,
      state: s,
      user,
    };
    setState(newState);
  }

  const loggingIn = () => {
    socket.emit('change:state', { state: 'loggingIn' });
    window.location.href = `${API_URL}/auth/spotify`;
  }

  const renderButton = () => {
    if (state.state === 'loggingIn') {
      return (
        <div className="loading-container">
          Someone is volunteering to be a host...
        </div>
      );
    }

    if (state.state === 'hostFound') {
      return (
        <div className="loading-container">
          {state.user.email} is currently hosting DJ Delta
        </div>
      );
    }

    return (
      <button
        className="login-button"
        onClick={loggingIn}
      >
        <img
          className="spotify"
          src={spotifyImg}
          alt="Spotify"
        />
        <span className="btn-text">Host DJ Delta</span>
      </button>
    );
  }

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: deltaThinkingAnim,
    rendererSettings: {
      preserveAspectRatio: 'xMidYMid slice'
    }
  };

  return (
    <div className="App">
      <div className="image-container">
        <Lottie
          options={defaultOptions}
          style={{ height: '200px', width: '200px' }}
        />
      </div>
      <div className="button-container">
        { renderButton() }
      </div>
    </div>
  );
};

export default App;
