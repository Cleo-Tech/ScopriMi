import { Player } from "./Player.js";

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
  // Total number of questions in the game
  public numQuestions: number;
  // List of questions for the game
  public selectedQuestions: string[];
  public iterator: Iterator<string>;
  // Creation time of the lobby
  public creationTime: number;

  /**
   * Creates an instance of the game.
   * @param lobbyCode - Unique code for the lobby
   * @param numQuestions - Number of questions for the game
   */
  constructor(lobbyCode: string, numQuestions: number) {
    this.lobbyCode = lobbyCode;
    this.isGameStarted = false;
    this.players = {};
    this.numOfVoters = 0;
    this.currentQuestionIndex = 0;
    this.numQuestions = numQuestions >= 5 ? numQuestions : 5; // Ensure at least 5 questions
    this.selectedQuestions = [];
    this.iterator = this.createIterator();
    this.creationTime = Date.now();
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

    console.log('MostVotedPerson: ', mostVotedPerson);
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
  addPlayer(playerName: string, socketId: string, image: string): void {
    if (!(playerName in this.players)) {
      this.players[playerName] = new Player(playerName, socketId, image);
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
   * Sets the number of questions for the game.
   * @param num - Number of questions
   */
  setNumQuestions(num: number): void {
    if (num >= 5) {
      this.numQuestions = num;
    } else {
      console.error('The minimum number of questions is 5.');
    }
  }

  /**
   * Selects the questions for the game.
   * @param questions - Array of available questions
   */
  selectQuestions(questions: string[]): void {
    if (questions.length >= this.numQuestions) {
      this.selectedQuestions = questions.slice(0, this.numQuestions);
    } else {
      console.error('Not enough questions available.');
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
  getCurrentQuestion(): string | null {
    return this.selectedQuestions[this.currentQuestionIndex] || null;
  }

  /**
   * Advances to the next question.
   */
  nextQuestion(): void {
    if (this.currentQuestionIndex < this.selectedQuestions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      console.log('No more questions.');
    }
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
   * Returns the next result from the question iterator.
   * @returns The iterator result object
   */
  getNextQuestion(): IteratorResult<string> {
    return this.iterator.next();
  }

  /**
   * Creates an iterator for the selected questions.
   * @returns An iterator for the questions
   */
  *createIterator(): IterableIterator<string> {
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
      votes[player.name] = player.whatPlayerVoted;
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

}
