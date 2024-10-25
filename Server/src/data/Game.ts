import { QuestionGenre } from "../MiddleWare/Types.js";
import { Player } from "./Player.js";
import { Question, QuestionMode } from "./Question.js";

/**
 * Represents a game in a lobby.
 */
export class Game {
  // Lobby code
  public lobbyCode: string;
  // Indicates whether the game has started
  public isGameStarted: boolean;
  // List of players
  public players: { [key: string]: Player };
  // Number of voters in the current round
  public numOfVoters: number;
  // Current question index
  public currentQuestionIndex: number;
  // List of questions for the game
  public selectedQuestions: Question[];
  public iterator: Iterator<Question>;
  // Creation time of the lobby
  public creationTime: number;
  // Admin of the lobby (can start the game / remove a player from the lobby)
  public admin: string;

  /**
   * Creates an instance of the game.
   * @param lobbyCode - Unique code for the lobby
   * @param numQuestions - Number of questions for the game
   */
  constructor(lobbyCode: string, admin: string) {
    this.lobbyCode = lobbyCode;
    this.isGameStarted = false;
    this.players = {};
    this.numOfVoters = 0;
    this.currentQuestionIndex = 0;
    this.selectedQuestions = [];
    this.iterator = this.createIterator();
    this.creationTime = Date.now();
    this.admin = admin;
  }

  /**
   * Gets the most voted player.
   * @returns The name of the most voted player or an empty string in case of a tie.
   */
  getMostVotedPerson(): string {
    const voteCounts: { [key: string]: number } = {};
    let mostVotedPerson = '';
    let maxVotes = 0;
    let isTie = false;

    // Count votes for each player
    for (const voter in this.players) {
      const votedPerson = this.players[voter].whatPlayerVoted;
      if (votedPerson) {
        voteCounts[votedPerson] = (voteCounts[votedPerson] || 0) + 1;
      }
    }

    // Determine the player with the highest number of votes
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

    // Increment the score of the most voted player
    for (const player of Object.values(this.players)) {
      if (player.whatPlayerVoted === mostVotedPerson) {
        player.score += 1;
      }
    }

    this.resetVoters(); // Reset votes after the voting
    return mostVotedPerson;
  }

  /**
   * Resets the vote count and players' choices.
   */
  resetVoters(): void {
    this.numOfVoters = 0;
    Object.values(this.players).forEach(player => {
      player.whatPlayerVoted = ''; // Reset each player's vote
    });
  }

  /**
   * Adds a player to the lobby.
   * @param playerName - Name of the player
   * @param socketId - Socket ID of the player
   * @param image - URL of the player's image
   */
  addPlayer(playerName: string, socketId: string, image: string): Player {
    if (!(playerName in this.players)) {
      this.players[playerName] = new Player(playerName, socketId, image);
      return this.players[playerName];
    }
  }

  /**
   * Removes a player from the lobby.
   * @param playerName - Name of the player to remove
   */
  removePlayer(playerName: string): void {
    delete this.players[playerName];
  }

  /**
   * Toggles the readiness status of a player to start the game.
   * @param playerName - Name of the player
   */
  toggleIsReadyToGame(playerName: string): void {
    if (playerName in this.players) {
      this.players[playerName].isReadyToGame = !this.players[playerName].isReadyToGame;
    }
  }

  /**
   * Records a player's vote.
   * @param playerName - Name of the player
   * @param vote - Name of the voted player
   */
  castVote(playerName: string, vote: string): void {
    if (playerName in this.players) {
      this.players[playerName].whatPlayerVoted = vote; // Set the player's vote
      // save the value inside the GAME for late state
      // TODO valore "duplicato" per fare prima, potenzialmente ok
      this.selectedQuestions[this.currentQuestionIndex].whatPlayersVoted[playerName] = vote;
      this.numOfVoters++;
    } else {
      console.error('Player not found.');
    }
  }

  /**
   * Checks if all players have voted.
   * @returns True if all players have voted, otherwise false
   */
  didAllPlayersVote(): boolean {
    return this.numOfVoters === Object.keys(this.players).length;
  }

  /**
   * Updates a player's score.
   * @param playerName - Name of the player
   * @param score - Score to add
   */
  updateScore(playerName: string, score: number): void {
    if (playerName in this.players) {
      this.players[playerName].score += score;
    } else {
      console.error('Player not found.');
    }
  }

  /**
   * Marks a player as ready for the next question.
   * @param playerName - Name of the player
   */
  setReadyForNextQuestion(playerName: string): void {
    if (playerName in this.players) {
      this.players[playerName].readyForNextQuestion = true;
    } else {
      console.error('Player not found.');
    }
  }

  /**
   * Gets the current question.
   * @returns The current question or null if there are no questions
   */
  getCurrentQuestion(): Question | null {
    return this.selectedQuestions[this.currentQuestionIndex] || null;
  }

  /**
   * Checks if all players are ready for the next question.
   * @returns True if all players are ready, otherwise false
   */
  isAllPlayersReadyForNextQuestion(): boolean {
    return Object.values(this.players).every(player => player.readyForNextQuestion);
  }

  /**
   * Checks if all players are ready to game.
   * @returns True if all players are ready, otherwise false
   */
  isAllPlayersReadyToGame(): boolean {
    return Object.values(this.players).every(player => player.isReadyToGame);
  }

  /**
   * Checks if all players are ready to podium.
   * @returns True if all players are ready, otherwise false
   */
  isAllPlayersReadyToPodium(): boolean {
    return Object.values(this.players).every(player => player.isReadyToPodiumm);
  }

  /**
   * Returns the next result from the question iterator.
   * @returns The iterator result object
   */
  getNextQuestion(): IteratorResult<Question> {
    return this.iterator.next();
  }

  /**
   * Creates an iterator for the selected questions.
   * @returns An iterator for the questions
   */
  *createIterator(): IterableIterator<Question> {
    for (const question of this.selectedQuestions) {
      yield question;
    }
  }

  /**
   * Resets the readiness status for the next question for all players.
   */
  resetReadyForNextQuestion(): void {
    Object.values(this.players).forEach(player => {
      player.readyForNextQuestion = false;
    });
  }

  /**
   * Gets the voting status of players.
   * @returns An object mapping player names to their votes
   */
  getWhatPlayersVoted(): { [key: string]: string } {
    const votes: { [key: string]: string } = {};
    Object.values(this.players).forEach(player => {
      if (player.whatPlayerVoted !== '') {
        votes[player.name] = player.whatPlayerVoted;
      }
    });
    return votes;
  }

  /**
   * Gets a dictionary of player images.
   * @returns An object where keys are player names and values are their corresponding image URLs.
   */
  getImages(): { [key: string]: string } {
    const images: { [key: string]: string } = {};
    Object.values(this.players).forEach(player => {
      images[player.name] = player.image;
    });
    return images;
  }

  /**
  * Gets a dictionary of player scores.
  * @returns An object where keys are player names and values are their corresponding scores.
  */
  getScores(): { [key: string]: number } {
    const scores: { [key: string]: number } = {};
    Object.values(this.players).forEach(player => {
      scores[player.name] = player.score;
    });
    return scores;
  }

  /**
   * Resets the voting status for all players.
   * This method clears the `whatPlayerVoted` property for each player, indicating that they have not voted.
   */
  resetWhatPlayersVoted(): void {
    Object.values(this.players).forEach(p => {
      p.whatPlayerVoted = '';
    });
  }

  // --------- //
  // PREPODIUM //
  // --------- //

  getAllPlayersSummary(): { player: Player; phrase: string }[] {
    const playersSummary: { player: Player; phrase: string }[] = [];
    let player = '';

    player = this.getMostVotedPlayer();
    if (player !== '') {
      playersSummary.push({
        player: this.players[player],
        phrase: 'Sei la persona piu votata, sei la star!',
      });
    }

    player = this.getLeastVotedPlayer();
    if (player !== '') {
      playersSummary.push({
        player: this.players[player],
        phrase: 'AYO, nessuno ti sta votando!',
      });
    }

    player = this.getPlayerWithMostPhotoVotes();
    if (player !== '') {
      playersSummary.push({
        player: this.players[player],
        phrase: 'Il cecchino delle foto!',
      });
    }

    return playersSummary;
  }


  getLeastVotedPlayer(): string {
    const totalVotes: { [key: string]: number } = {};

    for (const qst of this.selectedQuestions) {
      if (qst.mode === QuestionMode.Photo || qst.mode === QuestionMode.Who)
        continue;
      for (const vote of Object.values(qst.whatPlayersVoted)) {
        totalVotes[vote] = (totalVotes[vote] || 0) + 1;
      }
    }

    if (totalVotes.length === 0)
      return '';

    // Trova il giocatore con il numero minimo di voti
    let minVotes = Infinity;
    let playerWithMinVotes = '';

    for (const player in totalVotes) {
      if (totalVotes[player] < minVotes) {
        minVotes = totalVotes[player];
        playerWithMinVotes = player;
      }
    }
    return playerWithMinVotes;
  }

  getMostVotedPlayer(): string {
    const totalVotes: { [key: string]: number } = {};

    // Itera su tutte le domande selezionate
    for (const qst of this.selectedQuestions) {
      if (qst.mode === QuestionMode.Photo || qst.mode === QuestionMode.Who)
        continue;
      // Itera su tutti i voti dei giocatori per la domanda corrente
      for (const vote of Object.values(qst.whatPlayersVoted)) {
        totalVotes[vote] = (totalVotes[vote] || 0) + 1;
      }
    }

    if (totalVotes.length === 0)
      return '';

    // Trova il giocatore con il numero massimo di voti
    let maxVotes = 0;
    let playerWithMaxVotes = '';

    for (const player in totalVotes) {
      if (totalVotes[player] > maxVotes) {
        maxVotes = totalVotes[player];
        playerWithMaxVotes = player;
      }
    }
    return playerWithMaxVotes;
  }


  getPlayerWithMostPhotoVotes(): string {
    const totalVotes: { [key: string]: number } = {};

    for (const qst of this.selectedQuestions) {
      if (qst.mode === QuestionMode.Photo) {
        for (const [voter, vote] of Object.entries(qst.whatPlayersVoted)) {
          if (vote === qst.winner) {
            totalVotes[voter] = (totalVotes[voter] || 0) + 1;
          }
        }
      }
    }

    // Trova il giocatore con il numero massimo di voti nelle domande "photo"
    let maxVotes = 0;
    let playerWithMaxPhotoVotes = '';

    for (const player in totalVotes) {
      if (totalVotes[player] > maxVotes) {
        maxVotes = totalVotes[player];
        playerWithMaxPhotoVotes = player;
      }
    }

    return playerWithMaxPhotoVotes;
  }


  getPlayerWithMostGenericVotes(): string {
    const totalVotes: { [key: string]: number } = {};

    for (const qst of this.selectedQuestions) {
      if (qst.genre === QuestionGenre.GENERIC) {
        for (const vote of Object.values(qst.whatPlayersVoted)) {
          totalVotes[vote] = (totalVotes[vote] || 0) + 1;
        }
      }
    }

    // Trova il giocatore con il numero massimo di voti nelle domande "generic"
    let maxVotes = 0;
    let playerWithMaxGenericVotes = '';

    for (const player in totalVotes) {
      if (totalVotes[player] > maxVotes) {
        maxVotes = totalVotes[player];
        playerWithMaxGenericVotes = player;
      }
    }

    return playerWithMaxGenericVotes;
  }

}
