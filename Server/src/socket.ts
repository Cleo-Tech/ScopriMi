import { SocketEvents } from './MiddleWare/SocketEvents.js';
import { GameManager } from './data/GameManager.js';
import { Game } from './data/Game.js';
import { AllQuestions } from './API/questions.js';
import { Question } from './data/Question.js';
import { QuestionGenre } from './MiddleWare/Types.js';
import { photoUrls } from './API/images.js';
import { QuestionMode } from './data/Question.js';

import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';


export const actualGameManager = new GameManager();

// TODOshitImprove
function getTextQuestion(input: string): string {
  const index = input.indexOf('£');
  if (index !== -1) {
    return input.substring(index + 1); // Restituisce tutto dopo il carattere £
  }
  return input;
}

// TODOshitImprove
function getContextQuestion(input: string): string {
  const index = input.indexOf('£');
  if (index !== -1) {
    return input.substring(0, index).trim(); // Restituisce tutto prima del carattere £ e rimuove eventuali spazi
  }
  return '';
}

function shuffle(array: Question[]) {
  if (!Array.isArray(array)) {
    return [];
  }
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Funzione per verificare se una lobby è da eliminare
function checkLobbiesAge(io: any) {
  const lobbies = actualGameManager.listGames();
  const currentTime = Date.now();

  lobbies.forEach(lobby => {
    const game = actualGameManager.getGame(lobby.lobbyCode);
    if (game && currentTime - game.creationTime >= 60 * 60 * 1000) { // Eliminazione lobby dopo 60 minuti
      console.log(`Lobby da eliminare: ${lobby.lobbyCode}`);
      actualGameManager.deleteGame(lobby.lobbyCode);
      const lobbies = actualGameManager.listGames();
      io.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
    }
  });
}

function myCreateLobby(socket, io, data: { code: string, numQuestionsParam: number, categories: QuestionGenre[], admin: string }) {
  console.log('Creo la lobby con [codice - domande - admin]: ', data.code, ' - ', data.numQuestionsParam, ' - ', data.admin);
  console.log('Categorie scelte: ', data.categories);
  actualGameManager.createGame(data.code, data.admin);
  const thisGame = actualGameManager.getGame(data.code);
  thisGame.gamesGenre = data.categories;

  const allSelectedQuestions = data.categories
    .map(category => {
      const questions = AllQuestions[category as QuestionGenre]; // Ottiene le domande per categoria

      return questions.map((questionText) => {
        let questionMode = QuestionMode.Standard;
        // Ora la domanda nel JSON è del tipo: contesto$domanda -> prendo solo domanda
        const formattedQuestion = getTextQuestion(questionText);
        let images: string[] = [];

        // Determina il `mode` in base alla categoria o altre logiche
        if (category === 'photo') {
          const context = getContextQuestion(questionText);
          questionMode = QuestionMode.Photo;

          const onlyContextImages = photoUrls
            .filter(p => p['tags'].includes(context))
            .map(p => p['secure_url']);

          // Mescola l'array photoUrls in modo casuale
          const shuffledonlyContextImages = onlyContextImages.sort(() => 0.5 - Math.random());

          // Prendi i primi 4 elementi dall'array mescolato
          images = shuffledonlyContextImages.slice(0, 4);

        }
        else if (category === 'who') {
          questionMode = QuestionMode.Who;

          const who_questions = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/answers.json'), 'utf8'));   // Lettura sincrona perché spacca allSelectedQuestions
          who_questions.sort(() => 0.5 - Math.random());
          images = who_questions.slice(0, 4);
          console.log(images);
        }

        // Crea l'istanza della classe `Question`
        return new Question(
          questionMode,
          category as QuestionGenre,
          formattedQuestion,
          images
        );
      });
    })
    .flat(); // Appiattisce l'array

  actualGameManager.getGame(data.code).selectedQuestions = shuffle(allSelectedQuestions).slice(0, data.numQuestionsParam);

  const lobbies = actualGameManager.listGames();
  io.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
  const lobbyCode = data.code;
  socket.emit(SocketEvents.RETURN_NEWGAME, { lobbyCode });
}


function myExitLobby(socket, io, data: { currentPlayer: string; currentLobby: string; }) {
  const thisGame = actualGameManager.getGame(data.currentLobby);
  console.log(`Removing ${data.currentPlayer} from lobby ${data.currentLobby} where admin is ${thisGame?.admin}`);

  if (!thisGame) {
    socket.emit(SocketEvents.FORCE_RESET);
    return;
  }

  // Rimuovo il giocatore dalla lobby
  thisGame.removePlayer(data.currentPlayer);

  // Se l'admin lascia la lobby, assegno il ruolo a un altro giocatore
  // Se non ci sono giocatori, non c'è nessun admin
  if (data.currentPlayer === thisGame.admin) {
    const remainingPlayers = Object.keys(thisGame.players);

    if (remainingPlayers.length > 0) {
      // Imposto il primo giocatore come nuovo admin
      thisGame.admin = remainingPlayers[0];
      console.log(`New admin for lobby ${data.currentLobby} is ${thisGame.admin}`);
    } else {
      thisGame.admin = '';
    }
  }

  const lobbies = actualGameManager.listGames();
  socket.leave(data.currentLobby);
  io.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
  io.to(data.currentLobby).emit(SocketEvents.RENDER_LOBBY, thisGame);
}

function mydisconnect(socket, io) {
  console.log('Client disconnected:', socket.id);

  for (const lobbyCode of actualGameManager.listLobbiesCode()) {
    const game = actualGameManager.getGame(lobbyCode);
    if (!game) {
      socket.emit(SocketEvents.FORCE_RESET);
      return;
    }
    const playerName = Object.keys(game.players).find(name => game.players[name].socketId === socket.id);

    if (playerName) {

      const data = {
        currentPlayer: playerName,
        currentLobby: lobbyCode,
      };

      myExitLobby(socket, io, data);

      // // Se la lobby è vuota, la elimino
      // if (game.players.length === 0) {
      //   console.log(`Deleting empty lobby ${lobbyCode}`);
      //   actualGameManager.deleteGame(lobbyCode);
      //   const lobbies = actualGameManager.listGames();
      //   io.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
      //   break;
      // }

      // TODO fix veloce per quando un player si disconnette
      if (game.isGameStarted && game.didAllPlayersVote()) {
        const players = game.players;
        const voteRecap = game.getWhatPlayersVoted();
        const playerImages = game.getImages();
        const mostVotedPerson = game.getMostVotedPerson();
        game.resetWhatPlayersVoted();
        io.to(lobbyCode).emit(SocketEvents.SHOW_RESULTS, { players, voteRecap, playerImages, mostVotedPerson });
      }
    }
  }
}

// QUII
function generateLobbyCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

export function setupSocket(io: any) {
  io.on(SocketEvents.CONNECTION, (socket: any) => {

    console.log(`Client connected: ${socket.id}`);

    setInterval(() => checkLobbiesAge(io), 10 * 1000);

    socket.on('mydisconnet', () => mydisconnect(socket, io));

    socket.on(SocketEvents.DISCONNECT, () => mydisconnect(socket, io));

    socket.on(SocketEvents.TEST_LOBBY, (data: { lobbyCode: string }, callback: (arg0: boolean) => void) => {
      const game = actualGameManager.getGame(data.lobbyCode);
      if (game && !game.isGameStarted) {
        callback(true);
      }
      callback(false);
    });

    socket.on(SocketEvents.SET_NEXT_GAME, (data: { code: string, playerName: string, image: string }) => {
      const thisGame = actualGameManager.getGame(data.code);
      if (!thisGame) {
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }

      const codeTmp = generateLobbyCode();
      const dataCreateLobby = {
        code: codeTmp,
        numQuestionsParam: thisGame.selectedQuestions.length,
        categories: thisGame.gamesGenre,
        admin: data.playerName,
      }

      if (thisGame.nextGame === undefined) {
        // la lobby non esiste, crea lobby
        // e qua ci va il valore thisGame.nextGame 
        myCreateLobby(socket, io, dataCreateLobby);
        thisGame.nextGame = codeTmp;
      } else {
        // gia esiste il game, gli restituisco quello che esiste
        socket.emit(SocketEvents.RETURN_NEWGAME, { lobbyCode: thisGame.nextGame });
      }
    });

    // TODO check params on react
    socket.on(SocketEvents.CREATE_LOBBY, async (data: { code: string, numQuestionsParam: number, categories: QuestionGenre[], admin: string }) => {
      myCreateLobby(socket, io, data);
    });

    socket.on(SocketEvents.REQUEST_TO_JOIN_LOBBY, (data: { lobbyCode: string; playerName: string, image: string }) => {
      if (actualGameManager.listLobbiesCode().includes(data.lobbyCode)) {
        const code = data.lobbyCode;
        const game = actualGameManager.getGame(code);

        if (!game) {
          console.error('non esiste questa lobby');
          socket.emit(SocketEvents.FORCE_RESET);
          return;
        }

        // Controlla se il giocatore esiste già
        if (Object.keys(game.players).includes(data.playerName)) {
          console.log(`Player with name ${data.playerName} already exists in lobby ${data.lobbyCode}`);
          socket.emit(SocketEvents.PLAYER_CAN_JOIN, { canJoin: false, lobbyCode: code, playerName: data.playerName });
          return;
        }

        // Se la lobby non ha un admin, assegna il primo giocatore come admin
        if (!game.admin) {
          game.admin = data.playerName;
          console.log(`New admin is ${data.playerName} for lobby ${data.lobbyCode}`);
        }

        console.log(`${data.playerName} just joined the lobby ${data.lobbyCode}`);

        game.addPlayer(data.playerName, socket.id, data.image);
        socket.join(code);
        socket.emit(SocketEvents.PLAYER_CAN_JOIN, { canJoin: true, lobbyCode: code, playerName: data.playerName });
        io.to(code).emit(SocketEvents.RENDER_LOBBY, game);
        const lobbies = actualGameManager.listGames();
        io.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
      }
    });

    socket.on(SocketEvents.REQUEST_RENDER_LOBBIES, () => {
      const lobbies = actualGameManager.listGames();
      socket.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
    });

    socket.on(SocketEvents.TOGGLE_IS_READY_TO_GAME, (data: { lobbyCode: string; playerName: string }) => {
      console.log('Toggle', data.playerName, data.lobbyCode);
      const thisGame = actualGameManager.getGame(data.lobbyCode);
      if (!thisGame) {
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }
      thisGame.toggleIsReadyToGame(data.playerName);
      io.to(data.lobbyCode).emit(SocketEvents.RENDER_LOBBY, thisGame);
      if (!thisGame.isAllPlayersReadyToGame() ||
        process.env.NODE_ENV === 'production' && Object.keys(thisGame.players).length < 2) {
        return;
      }

      thisGame.isGameStarted = true;
      const lobbies = actualGameManager.listGames();
      io.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
      console.log(`Inizia partita - ${data.lobbyCode}`);
      io.to(data.lobbyCode).emit(SocketEvents.INIZIA);
    });

    //socket.on(SocketEvents.VOTE_IMAGE) // TODO Una roba del genere

    socket.on(SocketEvents.VOTE, (data: { lobbyCode: string; voter: string, vote: string }) => {
      console.log('Ho ricevuto il voto ', data);

      const thisGame = actualGameManager.getGame(data.lobbyCode);

      if (!thisGame) {
        console.log('Force reset');
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }

      //if (Object.keys(thisGame.players).includes(data.vote) || data.vote === null || data.vote.startsWith('https')) {
      thisGame.castVote(data.voter, data.vote);
      io.to(data.lobbyCode).emit(SocketEvents.PLAYERS_WHO_VOTED, { players: thisGame.getWhatPlayersVoted() });
      //}

      console.log(thisGame.players);

      if (thisGame.didAllPlayersVote()) {
        const players = thisGame.players;
        const voteRecap = thisGame.getWhatPlayersVoted();
        const playerImages = thisGame.getImages();
        const mostVotedPerson = thisGame.getMostVotedPerson();
        thisGame.resetWhatPlayersVoted();
        console.log('Tutti i giocatori hanno votato: ', voteRecap);
        thisGame.selectedQuestions[thisGame.currentQuestionIndex].winner = mostVotedPerson;
        thisGame.currentQuestionIndex++;
        io.to(data.lobbyCode).emit(SocketEvents.SHOW_RESULTS, { players, voteRecap, playerImages, mostVotedPerson });
      }
    });

    socket.on(SocketEvents.READY_FOR_NEXT_QUESTION, (data: { lobbyCode: string; playerName: string }) => {
      const thisGame = actualGameManager.getGame(data.lobbyCode);
      if (!thisGame) {
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }
      thisGame.setReadyForNextQuestion(data.playerName);

      if (!thisGame.isAllPlayersReadyForNextQuestion()) {
        return;
      }
      // chiedo la prossima domanda, se posso altrimento partita finita
      const { value: question, done } = thisGame.getNextQuestion();

      if (!done) {
        thisGame.resetReadyForNextQuestion(); // Reset readiness for the next round
        const players = Object.keys(thisGame.players);
        const images = thisGame.getImages();
        const keys = Object.keys(thisGame.players);
        const selectedPlayer = keys[Math.floor(Math.random() * keys.length)];
        io.to(data.lobbyCode).emit(SocketEvents.SEND_QUESTION, { question, players, images, selectedPlayer });
      } else {
        const pages = thisGame.getAllPlayersSummary();
        if (pages.length > 0) {
          io.to(data.lobbyCode).emit(SocketEvents.ENDGAMEWRAPPER, { pages });
        } else {
          // actualGameManager.deleteGame(thisGame.lobbyCode); cantiere della sburra
          io.to(data.lobbyCode).emit(SocketEvents.GAME_OVER, { playerScores: thisGame.getScores(), playerImages: thisGame.getImages() });
        }
      }
    });

    socket.on(SocketEvents.READY_FOR_PODIUM, (data: { lobbyCode: string; playerName: string }) => {
      const thisGame = actualGameManager.getGame(data.lobbyCode);
      if (!thisGame) {
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }
      thisGame.players[data.playerName].isReadyToPodiumm = true;
      if (!thisGame.isAllPlayersReadyToPodium()) {
        return;
      }

      // actualGameManager.deleteGame(thisGame.lobbyCode); cantiere della sburra
      io.to(data.lobbyCode).emit(SocketEvents.GAME_OVER, { playerScores: thisGame.getScores(), playerImages: thisGame.getImages() });
    });

    socket.on(SocketEvents.REQUEST_RENDER_LOBBY, (lobbyCode: string, callback: (thisGame: Game) => void) => {
      const thisGame = actualGameManager.getGame(lobbyCode);
      if (thisGame) {
        callback(thisGame);
      }
    });

    const getQuestionGenresAsStrings = (): string[] => {
      return Object.values(QuestionGenre);
    }

    socket.on(SocketEvents.REQUEST_CATEGORIES, () => {
      const genres = getQuestionGenresAsStrings();
      console.log('Generi da inviare: ', genres);
      socket.emit(SocketEvents.SEND_GENRES, { genres });
    });

    socket.on(SocketEvents.JOIN_ROOM, (data: { playerName: string, lobbyCode: string, image: string }) => {
      socket.join(data.lobbyCode);
      const thisGame = actualGameManager.getGame(data.lobbyCode);
      if (!thisGame) {
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }
      thisGame.addPlayer(data.playerName, socket.id, data.image);
    })

    socket.on(SocketEvents.LEAVE_ROOM, (data: { playerName: string, lobbyCode: string }) => {
      socket.leave(data.lobbyCode);
    })

    socket.on(SocketEvents.REMOVE_PLAYER, (data: { playerName: string, currentLobby: string }) => {
      const thisGame = actualGameManager.getGame(data.currentLobby);
      thisGame.removePlayer(data.playerName);
      io.to(data.currentLobby).emit(SocketEvents.RENDER_LOBBY, thisGame);
    })

    socket.on(SocketEvents.EXIT_LOBBY, (data: { currentPlayer: string; currentLobby: string; }) => {
      myExitLobby(socket, io, data);
    });

  });
}
