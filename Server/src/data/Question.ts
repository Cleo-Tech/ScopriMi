enum QuestionMode {
  Standard,
  Photo,
  Who,
  Theme
}

import { QuestionGenre } from "../API/questions";

// QuestionGenre (il genere di suddivisione del json nella domande)
// -generic
// -adult

// QuestionMode (REACT layout + logic)
// -standard (come who tranne per domanda)
// -photo (layout completamente diverso)
// -who (deve solo cambiare la frase della domanda)
// -theme (ha un contatore di x domande per poi fare apparire la frase)

export class Question {
  public questionMode: QuestionMode;
  public questionGenre: QuestionGenre;
  public question: string;
  public images: string[];

  constructor(questionMode: QuestionMode, questionGenre: QuestionGenre, question: string, images: string[]) {
    this.questionMode = questionMode;
    this.question = question;
    this.questionGenre = questionGenre;
    this.images = images;
  }


}
