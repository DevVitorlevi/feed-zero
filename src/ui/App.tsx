import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useApp } from '../state/GameContext';
import { PressButton } from './components/PressButton';
import { ScreenTransition } from './components/ScreenTransition';
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
      {current === 'game' && game && (
        <ScreenTransition key="game">
          {/* Tela de jogo entra no Bloco 4. */}
          <main className="p-6">
            <p>Partida em andamento: {game.players.map((p) => p.name).join(', ')}</p>
            <PressButton className="btn mt-4" onClick={() => setScreen('title')}>
              Voltar ao título
            </PressButton>
          </main>
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
