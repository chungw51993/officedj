import { useEffect, useState, useRef } from 'react';
import Lottie from 'react-lottie';

import initialState from './lib/initialState';
import SocketClient from './lib/socket';

import './asset/style/App.scss';

import deltaThinkingAnim from './asset/animation/delta-thinking.json';

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
      // await socket.init();
      // socket.on('gonged:track', handleGong);
      // socket.on('add:track', handleAdd);
    } catch(err) {
      console.error(err);
    }
  }

  const handleGong = (data) => {
    const newState = {
      ...state,
      gong: data,
    };
    setState(newState);
  }

  const handleAdd = (data) => {
    const newPlaylist = [...state.playlist];
    newPlaylist.push(data);
    const newState = {
      ...state,
      playlist: newPlaylist,
    };
    setState(newState);
  }

  const gongTrack = () => {
    socket.emit('gong:track');
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
        <a
          href={`${API_URL}/auth/spotify`}
          className="login-button"
        >
          <img
            className="spotify"
            src={spotifyImg}
            alt="Spotify"
          />
          <span className="btn-text">Host DJ Delta</span>
        </a>
      </div>
    </div>
  );
};

export default App;
