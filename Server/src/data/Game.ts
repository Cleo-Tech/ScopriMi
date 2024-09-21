import { Player } from "./Player";

export class Game {
  // Codice della lobby
  public lobbyCode: string;
  // Se il game e` iniziato o meno
  public isGameStarted: boolean;
  // elenco dei player
  public players: { [key: string]: Player };
  // Quanti hanno votato nella mache
  public numOfVoters: number;
  // A quale domanda siamo arrivati
  public currentQuestionIndex: number;
  // Numero di domande totale del game
  public numQuestions: number;
  // Elenco di domande del game
  public selectedQuestions: string[];
  public iterator: Iterator<string>;
  public creationTime: number;

  constructor(lobbyCode: string, numQuestions: number) {
    this.lobbyCode = lobbyCode;
    this.isGameStarted = false;
    this.players = {};
    this.numOfVoters = 0;
    this.currentQuestionIndex = 0;
    this.numQuestions = numQuestions >= 5 ? numQuestions : 5;
    this.selectedQuestions = [];
    this.iterator = this.createIterator();
    this.creationTime = Date.now();
  }

  getMostVotedPerson(): string {
    const voteCounts: { [key: string]: number } = {};
    let mostVotedPerson = '';
    let maxVotes = 0;
    let isTie = false;

    for (const voter in this.players) {
      const votedPerson = this.players[voter].whatPlayerVoted;
      if (votedPerson) {
        voteCounts[votedPerson] = (voteCounts[votedPerson] || 0) + 1;
      }
    }

    for (const person in voteCounts) {
      if (voteCounts[person] > maxVotes) {
        maxVotes = voteCounts[person];
        mostVotedPerson = person;
        isTie = false;
      } else if (voteCounts[person] === maxVotes) {
        isTie = true;
      }
    }

    if (isTie) mostVotedPerson = '';

    for (const player of Object.values(this.players)) {
      if (player.whatPlayerVoted === mostVotedPerson) {
        player.score += 1; // Incrementa il punteggio del giocatore
      }
    }

    console.log('MostVotedPerson: ', mostVotedPerson);
    this.resetVoters();
    return mostVotedPerson;
  }

  resetVoters(): void {
    this.numOfVoters = 0;
    Object.values(this.players).forEach(player => {
      player.whatPlayerVoted = ''; // Resetta il voto di ogni giocatore
    });
  }

  addPlayer(playerName: string, socketId: string, image: string): void {
    if (!(playerName in this.players)) {
      this.players[playerName] = new Player(playerName, socketId, image);
    }
  }

  removePlayer(playerName: string): void {
    delete this.players[playerName];
  }

  toggleIsReadyToGame(playerName: string): void {
    if (playerName in this.players) {
      this.players[playerName].isReadyToGame = !this.players[playerName].isReadyToGame;
    }
  }

  setNumQuestions(num: number): void {
    if (num >= 5) {
      this.numQuestions = num;
    } else {
      console.error('Il numero minimo di domande è 5.');
    }
  }

  selectQuestions(questions: string[]): void {
    if (questions.length >= this.numQuestions) {
      this.selectedQuestions = questions.slice(0, this.numQuestions);
    } else {
      console.error('Non ci sono abbastanza domande.');
    }
  }

  castVote(playerName: string, vote: string): void {
    if (playerName in this.players) {
      this.players[playerName].whatPlayerVoted = vote; // Imposta il voto del giocatore
      this.numOfVoters++;
    } else {
      console.error('Giocatore non trovato.');
    }
  }

  didAllPlayersVote(): boolean {
    return this.numOfVoters === Object.keys(this.players).length;
  }

  updateScore(playerName: string, score: number): void {
    if (playerName in this.players) {
      this.players[playerName].score += score;
    } else {
      console.error('Giocatore non trovato.');
    }
  }

  setReadyForNextQuestion(playerName: string): void {
    if (playerName in this.players) {
      this.players[playerName].readyForNextQuestion = true;
    } else {
      console.error('Giocatore non trovato.');
    }
  }

  getCurrentQuestion(): string | null {
    return this.selectedQuestions[this.currentQuestionIndex] || null;
  }

  nextQuestion(): void {
    if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      console.log('No more questions.');
    }
  }

  isAllPlayersReady(): boolean {
    return Object.values(this.players).every(player => player.readyForNextQuestion);
  }

  getNextQuestion(): IteratorResult<string> {
    return this.iterator.next();
  }

  *createIterator(): IterableIterator<string> {
    for (const question of this.selectedQuestions) {
      yield question;
    }
  }

  resetReadyForNextQuestion(): void {
    Object.values(this.players).forEach(player => {
      player.readyForNextQuestion = false;
    });
  }
}
