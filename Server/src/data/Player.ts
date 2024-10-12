export class Player {
  // Nome del player in game
  public name: string;
  // socket id
  public socketId: string;
  // Id dell immagine
  public image: string;
  // Punteggio del player nel game complessivo, somma 1 a manche vincente
  public score: number;
  // Pronto per startare il game
  public isReadyToGame: boolean;
  // Pronto a giocare prossima manche
  public readyForNextQuestion: boolean;
  // chi ha votato
  public whatPlayerVoted: string;

  constructor(name: string, socketId: string, image: string) {
    this.name = name;
    this.socketId = socketId;
    this.image = image;
    this.score = 0;
    this.isReadyToGame = false;
    this.readyForNextQuestion = false;
    this.whatPlayerVoted = '';
  }
}
