import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useApp, useSend } from '../state/GameContext';
import { ScreenTransition } from './components/ScreenTransition';
import { AboutScreen } from './screens/AboutScreen';
import { GameScreen } from './screens/GameScreen';
import { ResultScreen } from './screens/ResultScreen';
import { SetupScreen } from './screens/SetupScreen';
import { TitleScreen } from './screens/TitleScreen';

type Screen = 'title' | 'setup' | 'game' | 'about';

function initialScreen(): Screen {
  try {
    // Link com ?seed=... abre direto na preparação.
    if (new URLSearchParams(window.location.search).get('seed')) return 'setup';
  } catch {
    /* empty */
  }
  return 'title';
}

export function App() {
  const { game } = useApp();
  const send = useSend();
  const [screen, setScreen] = useState<Screen>(initialScreen);

  const base: Screen = screen === 'game' && !game ? 'title' : screen;
  const showResult = base === 'game' && game?.phase === 'ended' && !!game.result;

  const goHome = () => {
    send({ type: 'EXIT_TO_TITLE' });
    setScreen('title');
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {base === 'setup' && (
        <ScreenTransition key="setup">
          <SetupScreen onBack={() => setScreen('title')} onStarted={() => setScreen('game')} />
        </ScreenTransition>
      )}
      {base === 'about' && (
        <ScreenTransition key="about">
          <AboutScreen onBack={() => setScreen('title')} />
        </ScreenTransition>
      )}
      {base === 'game' && !showResult && (
        <ScreenTransition key="game">
          <GameScreen onExit={() => setScreen('title')} />
        </ScreenTransition>
      )}
      {showResult && (
        <ScreenTransition key="result">
          <ResultScreen onHome={goHome} />
        </ScreenTransition>
      )}
      {base === 'title' && (
        <ScreenTransition key="title">
          <TitleScreen
            onNewGame={() => setScreen('setup')}
            onResume={() => setScreen('game')}
            onAbout={() => setScreen('about')}
          />
        </ScreenTransition>
      )}
    </AnimatePresence>
  );
}
