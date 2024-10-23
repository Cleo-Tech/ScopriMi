export enum QuestionGenre {
  GENERIC = 'generic',
  ADULT = 'adult',
  PHOTO = 'photo',
  // WHO = 'who', Uncomment this when who questions are ready for deployment
}

export let AllQuestions: { [key in QuestionGenre]: string[] }