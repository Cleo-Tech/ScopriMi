export enum QuestionGenre {
  GENERIC = 'generic',
  ADULT = 'adult',
  PHOTO = 'photo',
}

export let AllQuestions: { [key in QuestionGenre]: string[] }