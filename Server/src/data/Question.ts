export enum QuestionMode {
  Standard,
  Photo,
  Who,
  CustomWho
}

import { QuestionGenre } from "../MiddleWare/Types.js";

// QuestionGenre (il genere di suddivisione del json nella domande)
// -generic
// -adult
// -photo

// QuestionMode (REACT layout + logic)
// -standard (come who tranne per domanda)
// -photo (layout completamente diverso)
// -who (deve solo cambiare la frase della domanda)
// -theme (ha un contatore di x domande per poi fare apparire la frase)

export class Question {
  public mode: QuestionMode;
  public genre: QuestionGenre;
  public text: string;
  public images: string[];
  public whatPlayersVoted: { [key: string]: string };
  public winner: string;

  constructor() {
    this.mode;
    this.text = '';
    this.genre;
    this.images = [];
    this.whatPlayersVoted = {};
    this.winner = '';
  }

  // constructor(questionMode: QuestionMode, questionGenre: QuestionGenre, question: string, images: string[]) {
  //   this.mode = questionMode;
  //   this.text = question;
  //   this.genre = questionGenre;
  //   this.images = images;
  //   this.whatPlayersVoted = {};
  //   this.winner = '';
  // }
}
