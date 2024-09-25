import { Socket } from "socket.io";
import { QuestionType } from "./QuestionType";

export class Question {
  public questionType: QuestionType;
  public question: string;
  public answers?: string[];

  constructor(questionType: QuestionType, question: string, answers?: string[]) {
    this.questionType = questionType;
    this.question = question;
    if (this.questionHasAnswers())
      this.answers = answers;
  }

  questionHasAnswers(): boolean {
    if (this.questionType === QuestionType.Personal || this.questionType === QuestionType.Photo)
      return true;
    return false;
  }

}

