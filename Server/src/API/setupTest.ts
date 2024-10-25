import { Express } from 'express-serve-static-core';

export function setupTest(app: Express) {
  // Endpoint per avviare il test
  app.post('/start-test', async (req, res) => {
    const { numGames, numPlayers, numRounds } = req.body;

    try {
      const result = await mainTest(numGames, numPlayers, numRounds);
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(500).json({ error: "Errore durante l'esecuzione del test", details: error });
    }
  });
}

// shit

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

async function mainTest(numGames: number, numPlayers: number, numRounds: number) {
  const TestManager = new GameManager();

  // 1. Creazione dei giochi contemporaneamente
  await Promise.all(
    Array.from({ length: numGames }).map(async () => {
      const gameId = makeid(6);
      return TestManager.createGame('testADMIN', gameId);
    })
  );

  // 2. Aggiunta giocatori e avvio dei giochi
  await Promise.all(
    TestManager.listGames().map(async (game) => {
      // Aggiunge i giocatori contemporaneamente
      await Promise.all(
        Array.from({ length: numPlayers }).map(async (_, i) => {
          const player = game.addPlayer('test' + i, 'testSocket' + i, 'img');
          player.isReadyToGame = true;
          player.readyForNextQuestion = true;
        })
      );
      // Avvia il gioco se tutti i giocatori sono pronti
      if (game.isAllPlayersReadyToGame()) {
        game.isGameStarted = true;
      }
    })
  );

  // 3. Simulazione voti per ogni turno in ogni gioco
  for (let round = 0; round < numRounds; round++) {
    await Promise.all(
      TestManager.listGames().map(async (game) => {
        // Votazione contemporanea dei giocatori
        await Promise.all(
          Object.values(game.players).map(async (player) => {
            player.readyForNextQuestion = false;
            game.castVote(player.name, 'test0');
            player.readyForNextQuestion = true;
          })
        );

        // Se tutti i giocatori hanno votato, avanzare
        if (game.didAllPlayersVote()) {
          game.getMostVotedPerson();
          game.resetWhatPlayersVoted();
        }
      })
    );
  }

  // 4. Eliminazione dei giochi alla fine
  await Promise.all(
    TestManager.listGames().map(async (game) => {
      TestManager.deleteGame(game.lobbyCode);
    })
  );

  console.log("Simulazione completata con successo!");
}
