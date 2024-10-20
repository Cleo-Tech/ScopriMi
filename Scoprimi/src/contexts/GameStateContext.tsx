/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { QuestionMode } from '../../../Server/src/data/Question';

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
  // Modalità dove voti foto
  PHOTOQUESTION = 'PHOTOQUESTION',
  PHOTORESPONSE = 'PHOTORESPONSE',
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
  [GameStates.NEXTQUESTION]: [GameStates.STANDARDQUESTION, GameStates.WHOQUESTION, GameStates.PHOTOQUESTION, GameStates.THEMEQUESTION],

  [GameStates.STANDARDQUESTION]: [GameStates.STANDARDRESPONSE],
  [GameStates.STANDARDRESPONSE]: [GameStates.RESULTOUTCOME],

  [GameStates.WHOQUESTION]: [GameStates.WHORESPONSE],
  [GameStates.WHORESPONSE]: [GameStates.RESULTOUTCOME],

  [GameStates.PHOTOQUESTION]: [GameStates.PHOTORESPONSE],
  [GameStates.PHOTORESPONSE]: [GameStates.RESULTOUTCOME],

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
  fromNextQuestionToQuestion: (qstMode: QuestionMode) => void;
  fromQuestionToResponse: () => void;
}

// Create the context
const GameStateContext = createContext<GameStateContextType | null>(null);

// Custom hook to use the game state context
const useGameState = () => {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

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

  const fromNextQuestionToQuestion = (qstMode: QuestionMode) => {
    switch (qstMode) {
      case QuestionMode.Photo:
        // TODO add ALL
        transitionTo(GameStates.PHOTOQUESTION);
        break;
      case QuestionMode.Standard:
        transitionTo(GameStates.STANDARDQUESTION);
        break;
      case QuestionMode.Who:
        transitionTo(GameStates.WHOQUESTION);
      default:
        console.error('non dovevi finire qua');
        break;
    }
  };

  const fromQuestionToResponse = () => {

    switch (actualState) {
      case GameStates.STANDARDQUESTION:
        // TODO add ALL
        transitionTo(GameStates.STANDARDRESPONSE);
        break;
      case GameStates.WHOQUESTION:
        transitionTo(GameStates.WHORESPONSE);
        break;
      case GameStates.PHOTOQUESTION:
        transitionTo(GameStates.PHOTORESPONSE);
        break;
      case GameStates.THEMEQUESTION:
        transitionTo(GameStates.THEMERESPONSE);
        break;
      default:
        console.error('non dovevi finire qua');
        break;
    }
  };

  return (
    <GameStateContext.Provider value={{ actualState, transitionTo, fromNextQuestionToQuestion, fromQuestionToResponse }}>
      {children}
    </GameStateContext.Provider>
  );
};


export { GameStateProvider, useGameState, GameStates };

