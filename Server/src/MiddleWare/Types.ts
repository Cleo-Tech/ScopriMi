export enum QuestionGenre {
  GENERIC = 'generic',
  ADULT = 'adult',
  PHOTO = 'photo',
  WHO = 'who',
}

export let AllQuestions: { [key in QuestionGenre]: string[] }