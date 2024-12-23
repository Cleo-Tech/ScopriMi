import { Express } from 'express-serve-static-core';
import { Request, Response, NextFunction } from 'express';
import { GameManager } from "../data/GameManager.js";
import { performance, PerformanceObserver } from 'perf_hooks';

export function setupTest(app: Express) {


  const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers['authorization'];
    if (token && token === process.env.SECRET_TOKEN) {
      next();
    } else {
      res.status(403).json({ error: 'Accesso non autorizzato' });
    }
  };

  app.post('/api/start-test', authMiddleware, async (req, res) => {

    // Crea un osservatore per il monitoraggio delle performance
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.duration} ms`);
      }
    });
    obs.observe({ entryTypes: ['measure'] });

    const { numGames, numPlayers, numRounds } = req.query;

    // Converti i parametri in numeri
    const numGamesParsed = parseInt(numGames as string, 10);
    const numPlayersParsed = parseInt(numPlayers as string, 10);
    const numRoundsParsed = parseInt(numRounds as string, 10);

    try {
      performance.mark('start');
      const result = await mainTest(numGamesParsed, numPlayersParsed, numRoundsParsed);
      performance.mark('end');
      performance.measure('someFunction', 'start', 'end');
      res.status(200).json({ message: result });
    } catch (error) {
      res.status(500).json({ error: "Errore durante l'esecuzione del test", details: error });
    }
  });
}

function* makeId(): Generator<string> {
  let i = 0;
  while (true) {
    yield '' + i++;
  }
}

async function mainTest(numGames: number, numPlayers: number, numRounds: number) {
  console.log('Inizio Test');
  const TestManager = new GameManager();

  // 1. Creazione dei giochi contemporaneamente
  const gameIdGenerator = makeId();
  await Promise.all(
    Array.from({ length: numGames }).map(async () => {
      const gameId = gameIdGenerator.next().value;
      return TestManager.createGame(gameId, 'testADMIN');
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
        try {
          // Votazione contemporanea dei giocatori
          await Promise.all(
            Object.values(game.players).map(async (player) => {
              try {
                player.readyForNextQuestion = false;
                game.castVote(player.name, 'test0');
                player.readyForNextQuestion = true;
              } catch (err) {
                console.error(`Errore nella votazione per il giocatore ${player.name}:`, err);
              }
            })
          );
          // Se tutti i giocatori hanno votato, avanzare
          if (game.didAllPlayersVote()) {
            game.getMostVotedPerson();
            game.resetWhatPlayersVoted();
          } else {
          }
        } catch (err) {
          console.error(`Errore nel ciclo di votazione per il gioco ${game.lobbyCode}:`, err);
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

  console.log('Fine test');

}
