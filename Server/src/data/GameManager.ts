import { Game } from './Game.js';

export class GameManager {
  public games: { [key: string]: Game } = {};

  constructor() {
    this.games = {}; // A map of lobby codes to game instances
  }

  /**
   * Creates a new game with the specified lobby code and number of questions.
   * 
   * @param {string} lobbyCode - The unique code for the lobby.
   * @param {number} numQuestionsParam - The number of questions for the game.
   * @returns {Game | null} The created game instance or null if the lobby code already exists.
   */
  createGame(lobbyCode: string, numQuestionsParam: number, admin: string): Game | null {
    if (!this.games[lobbyCode]) {
      this.games[lobbyCode] = new Game(lobbyCode, numQuestionsParam, admin);
      return this.games[lobbyCode];
    }
    console.error('Lobby code already exists.');
    return null;
  }

  /**
   * Retrieves a game instance by its lobby code.
   * 
   * @param {string} lobbyCode - The unique code for the lobby.
   * @returns {Game | null} The game instance associated with the lobby code or null if not found.
   */
  getGame(lobbyCode: string): Game | null {
    return this.games[lobbyCode] || null;
  }

  /**
   * Deletes a game associated with the specified lobby code.
   * 
   * @param {string} lobbyCode - The unique code for the lobby.
   */
  deleteGame(lobbyCode: string) {
    if (this.games[lobbyCode]) {
      delete this.games[lobbyCode];
    } else {
      console.error('Game not found.');
    }
  }

  /**
   * Lists all current game instances.
   * 
   * @returns {Game[]} An array of all game instances.
   */
  listGames(): Game[] {
    return Object.values(this.games);
  }

  /**
   * Lists all lobby codes currently in use.
   * 
   * @returns {string[]} An array of all lobby codes.
   */
  listLobbiesCode(): string[] {
    return Object.keys(this.games);
  }
}
