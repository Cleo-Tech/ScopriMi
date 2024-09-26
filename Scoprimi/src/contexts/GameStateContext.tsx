/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, ReactNode } from 'react';

// eslint-disable-next-line no-unused-vars
enum GameStates {
  NEXTQUESTION,
  GENERICQUESTION,
  GENERICRESPONSE,
  WHOQUESTION,
  WHORESPONSE,
  THEMEQUESTION,
  THEMERESPONSE,
  RESULT_OUTCOME,
  THEMERESULTFINAL,
  PERCULARE,
}

// Define states with possible transitions using the enum
const states = {
  [GameStates.NEXTQUESTION]: [GameStates.GENERICQUESTION, GameStates.WHOQUESTION, GameStates.THEMEQUESTION],
  [GameStates.GENERICQUESTION]: [GameStates.GENERICRESPONSE],
  [GameStates.GENERICRESPONSE]: [GameStates.RESULT_OUTCOME],
  [GameStates.WHOQUESTION]: [GameStates.WHORESPONSE],
  [GameStates.WHORESPONSE]: [GameStates.RESULT_OUTCOME],
  [GameStates.THEMEQUESTION]: [GameStates.THEMERESPONSE],
  [GameStates.THEMERESPONSE]: [GameStates.RESULT_OUTCOME],
  [GameStates.RESULT_OUTCOME]: [GameStates.THEMERESULTFINAL, GameStates.PERCULARE],
  [GameStates.THEMERESULTFINAL]: [GameStates.PERCULARE],
  [GameStates.PERCULARE]: [GameStates.NEXTQUESTION],
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
      setActualState(nextState);
      console.log('Transitioned to:', nextState);
    } else {
      console.log('Invalid state transition from', actualState, 'to', nextState);
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

