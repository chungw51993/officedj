import { useEffect, useState, useRef } from 'react';

import initialState from './lib/initialState';
import SocketClient from './lib/socket';

import './asset/style/App.scss';

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
      socket.on('gonged:track', handleGong);
      socket.on('add:track', handleAdd);
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

  return (
    <div className="App">
      <header className="App-header">
        <a
          href={`${API_URL}/auth/spotify`}
        >
          Spotify
        </a>
        <button
          className="header"
          onClick={gongTrack}
        >
          what is going on
        </button>
      </header>
      <div>
        {state.gong}
      </div>
    </div>
  );
};

export default App;
