import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { CONFIG } from '../content/config';
import { reduce } from '../engine/reducer';
import { createGame, setupRejection } from '../engine/setup';
import type { Action, GameEvent, GameState } from '../engine/types';
import { clearSave, loadGame, saveGame } from './persist';

export type UiAction = Action | { type: 'EXIT_TO_TITLE' } | { type: 'DISMISS_MESSAGE' };

export interface AppState {
  game: GameState | null;
  events: GameEvent[];
  tick: number;
  message: string | null;
}

function initialState(): AppState {
  return { game: loadGame(), events: [], tick: 0, message: null };
}

function appReducer(app: AppState, action: UiAction): AppState {
  switch (action.type) {
    case 'EXIT_TO_TITLE':
      return { game: null, events: [], tick: app.tick + 1, message: null };
    case 'DISMISS_MESSAGE':
      return { ...app, message: null };
    case 'START_GAME': {
      const reason = setupRejection(action.players, CONFIG);
      if (reason) return { ...app, message: reason, events: [], tick: app.tick + 1 };
      const r = createGame(action.players, action.seed?.trim() || undefined, CONFIG);
      return { game: r.state, events: r.events, tick: app.tick + 1, message: null };
    }
    default: {
      if (!app.game) return app;
      const r = reduce(app.game, action);
      const rejected = r.events.find((e) => e.kind === 'rejected');
      return {
        game: r.state,
        events: r.events,
        tick: app.tick + 1,
        message: rejected && rejected.kind === 'rejected' ? rejected.reason : null,
      };
    }
  }
}

const StateContext = createContext<AppState | null>(null);
const DispatchContext = createContext<Dispatch<UiAction> | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [app, dispatch] = useReducer(appReducer, undefined, initialState);

  useEffect(() => {
    if (app.game && app.game.phase !== 'ended') saveGame(app.game);
    else clearSave();
  }, [app.game]);

  return (
    <StateContext.Provider value={app}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useApp(): AppState {
  const ctx = useContext(StateContext);
  if (!ctx) throw new Error('useApp fora do GameProvider');
  return ctx;
}

export function useDispatch(): Dispatch<UiAction> {
  const ctx = useContext(DispatchContext);
  if (!ctx) throw new Error('useDispatch fora do GameProvider');
  return ctx;
}

export function useSend(): (action: UiAction) => void {
  const dispatch = useDispatch();
  return useCallback((action: UiAction) => dispatch(action), [dispatch]);
}

export function useGameMemo<T>(pick: (g: GameState) => T): T | null {
  const { game } = useApp();
  return useMemo(() => (game ? pick(game) : null), [game, pick]);
}
