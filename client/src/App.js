import { useEffect, useState } from 'react';
import Lottie from 'react-lottie';
import axios from 'axios';

import ResetPopup from './ResetPopup';

import initialState from './lib/initialState';

import './asset/style/App.scss';

import deltaThinkingAnim from './asset/animation/delta-thinking.json';

import spotifyImg from './asset/img/spotify.png';

const {
  API_URL,
} = window;

const App = () => {
  const [state, setState] = useState(initialState());

  useEffect(() => {
    getCurrentHost();
  }, []);

  const changeState = (field, value) => {
    const newState = {
      ...state,
      [field]: value,
    };
    setState(newState);
  }

  const getCurrentHost = async () => {
    const { data } = await axios({
      method: 'GET',
      url: '/officedj/host/current',
    });
    if (data.display_name) {
      changeState('host', data);
    }
  }

  const resetHost = async () => {
    await axios({
      method: 'PUT',
      url: '/officedj/host/reset',
    });
    changeState('host', {});
    changeState('showResetPopup', false);
  }

  const loggingIn = () => {
    window.location.href = `${API_URL}/officedj/auth/spotify`;
  }

  const renderButton = () => {
    if (state.host.display_name) {
      return (
        <div className="hosted-container">
          <div className="hc-text">
            {state.host.display_name} is currently hosting DJ Delta
          </div>
          <button
            className="hc-button"
            onClick={() =>changeState('showResetPopup', true)}
          >
            RESET HOST
          </button>
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
      <ResetPopup
        show={state.showResetPopup}
        host={state.host}
        close={() => changeState('showResetPopup', false)}
        reset={resetHost}
      />
    </div>
  );
};

export default App;
