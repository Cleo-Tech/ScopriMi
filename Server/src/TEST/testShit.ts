import { GameManager } from "../data/GameManager";

function makeid(length: number): string {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

void function mainTest(numGames: number, numPlayers: number, numRounds: number) {

  const TestManager = new GameManager();

  // 1. Creiamo `numGames` giochi
  for (let i = 0; i < numGames; i++) {
    TestManager.createGame('testADMIN', makeid(6));
  }

  // 2. Aggiungiamo i giocatori e facciamo partire ogni gioco
  TestManager.listGames().forEach(game => {
    for (let i = 0; i < numPlayers; i++) {
      const player = game.addPlayer('test' + i, 'testSocket' + i, 'img');
      player.isReadyToGame = true;
      player.readyForNextQuestion = true;
    }
    if (game.isAllPlayersReadyToGame()) {
      game.isGameStarted = true;
    }
  });

  // 3. Per ogni game e per ogni turno, simuliamo i voti dei giocatori
  TestManager.listGames().forEach(game => {
    for (let round = 0; round < numRounds; round++) {

      Object.values(game.players).forEach(player => {
        // Simula un voto casuale per ogni giocatore
        player.readyForNextQuestion = false;
        game.castVote(player.name, 'test1');
        player.readyForNextQuestion = true;
      });

      // Avanza al prossimo round se tutti hanno votato
      if (game.didAllPlayersVote()) {
        game.getMostVotedPerson();
        game.resetWhatPlayersVoted();
      }
    }
  });

  // 3. Per ogni game e per ogni turno, simuliamo i voti dei giocatori
  TestManager.listGames().forEach(game => {
    // TODO
    // ci sarebbe da testare il prepodio
    // che non è computazionalmente leggerissimo
    TestManager.deleteGame(game.lobbyCode);
  });

}