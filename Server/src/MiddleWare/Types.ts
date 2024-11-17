export enum QuestionGenre {
  GENERIC = 'generic',
  ADULT = 'adult',
  PHOTO = 'photo',
  WHO = 'who',
}

// ADDSQL il top sarebbe leggere i valori dell'enum e metterli nel sql

export let AllQuestions: { [key in QuestionGenre]: string[] }