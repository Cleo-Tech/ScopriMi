import { Question } from '../../../Server/src/data/Question';

export interface QuestionData {
  question: Question;
  players: string[];
  images: { [key: string]: string };
}


export interface PlayerScores {
  [player: string]: number;
}

export interface PlayerImages {
  [player: string]: string;
}

// Interfaccia per i risultati di un singolo giocatore
export interface PlayerResult {
  score: number;
  image: string;
}

// Interfaccia per i risultati finali del gioco
export interface FinalResultData {
  [playerName: string]: PlayerResult;
}
