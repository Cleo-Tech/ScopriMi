import { Express, Request, Response } from 'express';
import { randomInt } from 'crypto';
import { actualGameManager } from '../socket.js';

function makeid(length: number) {
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

export const setupGame = (app: Express) => {
  // Crea un giocatore e lo aggiunge alla lobby con stato "ready"
  app.post('/api/create-player/:lobbyCode', (req: Request, res: Response) => {
    const { lobbyCode } = req.params;
    const playerName = makeid(6);

    const imageList = [
      'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_1.png',
      'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_2.png',
      'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_3.png',
    ];

    // Trova il gioco esistente per la lobby
    const game = actualGameManager.getGame(lobbyCode);

    if (!game) {
      return res.status(404).json({ message: 'Lobby not found' });
    }

    // Aggiungi il giocatore al gioco
    game.addPlayer(playerName, 'socketId' + playerName, imageList[randomInt(imageList.length)]);
    game.toggleIsReadyToGame(playerName); // Imposta il giocatore come pronto a giocare

    // Invia una risposta al client
    return res.status(201).json({ message: 'Player created', playerName });
  });
};
