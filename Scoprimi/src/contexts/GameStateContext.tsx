/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, ReactNode } from 'react';

// eslint-disable-next-line no-unused-vars
enum GameStates {
  START = 'START',
  NEXTQUESTION = 'NEXTQUESTION',
  // modalita standard
  STANDARDQUESTION = 'STANDARDQUESTION',
  STANDARDRESPONSE = 'STANDARDRESPONSE',
  // modalita con votare chi farebbe cosa
  WHOQUESTION = 'WHOQUESTION',
  WHORESPONSE = 'WHORESPONSE',
  // modalita con risposte a tema
  THEMEQUESTION = 'THEMEQUESTION',
  THEMERESPONSE = 'THEMERESPONSE',
  // risultato a fine manche
  RESULTOUTCOME = 'RESULTOUTCOME',
  // frase che esce a fine tema dopo x domande
  THEMERESULTFINAL = 'THEMERESULTFINAL',
  // DOPO CHE ESCE IL PODIO FARE USCIRE MOCK
  PODIUM = 'PODIUM',
  MOCK = 'MOCK',
}

// Define states with possible transitions using the enum
const states = {
  [GameStates.NEXTQUESTION]: [GameStates.STANDARDQUESTION, GameStates.WHOQUESTION, GameStates.THEMEQUESTION],

  [GameStates.STANDARDQUESTION]: [GameStates.STANDARDRESPONSE],
  [GameStates.STANDARDRESPONSE]: [GameStates.RESULTOUTCOME],

  [GameStates.WHOQUESTION]: [GameStates.WHORESPONSE],
  [GameStates.WHORESPONSE]: [GameStates.RESULTOUTCOME],

  [GameStates.THEMEQUESTION]: [GameStates.THEMERESPONSE],
  [GameStates.THEMERESPONSE]: [GameStates.RESULTOUTCOME],
  [GameStates.THEMERESULTFINAL]: [GameStates.MOCK, GameStates.NEXTQUESTION, GameStates.PODIUM],

  [GameStates.RESULTOUTCOME]: [GameStates.THEMERESULTFINAL, GameStates.MOCK, GameStates.NEXTQUESTION, GameStates.PODIUM],

  [GameStates.PODIUM]: [GameStates.MOCK],
  [GameStates.MOCK]: [GameStates.NEXTQUESTION],
};

// Define the context type
interface GameStateContextType {
  actualState: GameStates;
  transitionTo: (nextState: GameStates) => void;
}

// Create the context
const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

// Game state provider component
const GameStateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [actualState, setActualState] = useState<GameStates>(GameStates.NEXTQUESTION);

  const transitionTo = (nextState: GameStates) => {
    const validStates = states[actualState];
    if (validStates.includes(nextState)) {
      console.log(`Transitioned from ${actualState} to: ${nextState}`);
      setActualState(nextState);
    } else {
      console.error('Invalid state transition from', actualState, 'to', nextState);
    }
  };

  return (
    <GameStateContext.Provider value={{ actualState, transitionTo }}>
      {children}
    </GameStateContext.Provider>
  );
};

// Custom hook to use the game state context
const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

export { GameStateProvider, useGameState, GameStates };

