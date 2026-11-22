import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useApp } from '../state/GameContext';
import { ScreenTransition } from './components/ScreenTransition';
import { GameScreen } from './screens/GameScreen';
import { SetupScreen } from './screens/SetupScreen';
import { TitleScreen } from './screens/TitleScreen';

type Screen = 'title' | 'setup' | 'game';

export function App() {
  const { game } = useApp();
  const [screen, setScreen] = useState<Screen>('title');
  const current: Screen = screen === 'game' && !game ? 'title' : screen;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {current === 'setup' && (
        <ScreenTransition key="setup">
          <SetupScreen onBack={() => setScreen('title')} onStarted={() => setScreen('game')} />
        </ScreenTransition>
      )}
      {current === 'game' && (
        <ScreenTransition key="game">
          <GameScreen onExit={() => setScreen('title')} />
        </ScreenTransition>
      )}
      {current === 'title' && (
        <ScreenTransition key="title">
          <TitleScreen onNewGame={() => setScreen('setup')} onResume={() => setScreen('game')} />
        </ScreenTransition>
      )}
    </AnimatePresence>
  );
}
