// @ts-nocheck
/* eslint-disable no-restricted-globals */
import React from 'react';
import ReactDOM from 'react-dom';
import ZoomVideo from '@zoom/videosdk';
import './index.css';
import App from './App';
import ZoomContext from './context/zoom-context';

const zmClient = ZoomVideo.createClient();

ReactDOM.render(
  <React.StrictMode>
    <ZoomContext.Provider value={zmClient}>
      <App />
    </ZoomContext.Provider>
  </React.StrictMode>,
  document.getElementById('zoom-video-container')
);
