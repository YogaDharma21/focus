import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { ShieldOverlayRoot } from './components/modules/ShieldOverlayRoot';
import './index.css';

const isShieldOverlay =
  new URLSearchParams(window.location.search).get('overlay') === 'shield';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isShieldOverlay ? <ShieldOverlayRoot /> : <App />}
  </React.StrictMode>
);
