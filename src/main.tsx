import { MotionConfig } from 'framer-motion';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameProvider } from './state/GameContext';
import { App } from './ui/App';
import './styles/tokens.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <GameProvider>
        <App />
      </GameProvider>
    </MotionConfig>
  </StrictMode>,
);
