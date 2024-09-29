import * as c from './socketConsts.js';
import { GameManager } from './data/GameManager.js';
import { Game } from './data/Game.js';
import { AllQuestions, QuestionGenre } from './API/questions.js';
import { Question } from './data/Question.js';

export const actualGameManager = new GameManager();

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
      io.emit(c.RENDER_LOBBIES, { lobbies });
    }
  });
}

function myExitLobby(socket, io, data: { currentPlayer: string; currentLobby: string; }) {
  const thisGame = actualGameManager.getGame(data.currentLobby);
  console.log(`Removing ${data.currentPlayer} from lobby ${data.currentLobby} where admin is ${thisGame?.admin}`);

  if (!thisGame) {
    socket.emit(c.FORCE_RESET);
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
  io.emit(c.RENDER_LOBBIES, { lobbies });
  io.to(data.currentLobby).emit(c.RENDER_LOBBY, thisGame);
}

function mydisconnect(socket, io) {
  console.log('Client disconnected:', socket.id);

  for (const lobbyCode of actualGameManager.listLobbiesCode()) {
    const game = actualGameManager.getGame(lobbyCode);
    if (!game) {
      socket.emit(c.FORCE_RESET);
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
      //   io.emit(c.RENDER_LOBBIES, { lobbies });
      //   break;
      // }

      // TODO fix veloce per quando un player si disconnette
      if (game.isGameStarted && game.didAllPlayersVote()) {
        const players = game.players;
        const voteRecap = game.getWhatPlayersVoted();
        const playerImages = game.getImages();
        const mostVotedPerson = game.getMostVotedPerson();
        game.resetWhatPlayersVoted();
        io.to(lobbyCode).emit(c.SHOW_RESULTS, { players, voteRecap, playerImages, mostVotedPerson });
      }
    }
  }
}




export function setupSocket(io: any) {
  io.on(c.CONNECTION, (socket: any) => {

    console.log(`Client connected: ${socket.id}`);
    // Avvia il controllo per l'eliminazione delle lobby (ogni 60 sec)
    setInterval(() => checkLobbiesAge(io), 10 * 1000);

    socket.on('mydisconnet', () => mydisconnect(socket, io));

    socket.on(c.DISCONNECT, () => mydisconnect(socket, io));

    socket.on(c.TEST_LOBBY, (data: { lobbyCode: string }, callback: (arg0: boolean) => void) => {
      const game = actualGameManager.getGame(data.lobbyCode);
      if (game && !game.isGameStarted) {
        callback(true);
      }
      callback(false);
    });

    // TODO check params on react
    socket.on(c.CREATE_LOBBY, (data: { code: string, numQuestionsParam: number, categories: string[], admin: string }) => {
      console.log('Creo la lobby con [codice - domande - admin]: ', data.code, ' - ', data.numQuestionsParam, ' - ', data.admin);
      console.log('Categorie scelte: ', data.categories);
      const newGame = actualGameManager.createGame(data.code, data.admin);

      const photoUrls = ["img1", "img2", "img3", "img4"]; // Simula gli URL delle immagini

      enum QuestionMode {
        Standard,
        Photo,
        Who,
        Theme
      }

      const allSelectedQuestions = data.categories
        .map(category => {
          const questions = AllQuestions[category as QuestionGenre]; // Ottiene le domande per categoria

          return questions.map((questionText) => {
            let questionMode = QuestionMode.Standard;
            let images: string[] = [];

            // Determina il `mode` in base alla categoria o altre logiche
            if (category === 'photo') {
              questionMode = QuestionMode.Photo;
              images = photoUrls.slice(0, 4); // Assegna un'immagine
            }
            // else if (category === 'who'){
            //   questionMode = QuestionMode.Who;
            // }

            // Crea l'istanza della classe `Question`
            return new Question(
              questionMode,
              category as QuestionGenre,
              questionText,
              images
            );
          });
        })
        .flat(); // Appiattisce l'array

      actualGameManager.getGame(data.code).selectedQuestions = shuffle(allSelectedQuestions).slice(0, data.numQuestionsParam);

      console.log(allSelectedQuestions);
      const lobbies = actualGameManager.listGames();
      io.emit(c.RENDER_LOBBIES, { lobbies });
      socket.emit(c.RETURN_NEWGAME, { newGame })
    });

    socket.on(c.REQUEST_TO_JOIN_LOBBY, (data: { lobbyCode: string; playerName: string, image: string }) => {
      if (actualGameManager.listLobbiesCode().includes(data.lobbyCode)) {
        const code = data.lobbyCode;
        const game = actualGameManager.getGame(code);

        if (!game) {
          console.error('non esiste questa lobby');
          socket.emit(c.FORCE_RESET);
          return;
        }

        // Controlla se il giocatore esiste già
        if (Object.keys(game.players).includes(data.playerName)) {
          console.log(`Player with name ${data.playerName} already exists in lobby ${data.lobbyCode}`);
          socket.emit(c.PLAYER_CAN_JOIN, { canJoin: false, lobbyCode: code, playerName: data.playerName });
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
        socket.emit(c.PLAYER_CAN_JOIN, { canJoin: true, lobbyCode: code, playerName: data.playerName });
        io.to(code).emit(c.RENDER_LOBBY, game);
        const lobbies = actualGameManager.listGames();
        io.emit(c.RENDER_LOBBIES, { lobbies });
      }
    });

    socket.on(c.REQUEST_RENDER_LOBBIES, () => {
      const lobbies = actualGameManager.listGames();
      socket.emit(c.RENDER_LOBBIES, { lobbies });
    });

    socket.on(c.TOGGLE_IS_READY_TO_GAME, (data: { lobbyCode: string; playerName: string }) => {
      console.log('Toggle', data.playerName, data.lobbyCode);
      const thisGame = actualGameManager.getGame(data.lobbyCode);
      if (!thisGame) {
        socket.emit(c.FORCE_RESET);
        return;
      }
      thisGame.toggleIsReadyToGame(data.playerName);
      io.to(data.lobbyCode).emit(c.RENDER_LOBBY, thisGame);
      if (!thisGame.isAllPlayersReadyToGame() ||
        process.env.NODE_ENV === 'production' && Object.keys(thisGame.players).length < 2) {
        return;
      }

      thisGame.isGameStarted = true;
      const lobbies = actualGameManager.listGames();
      io.emit(c.RENDER_LOBBIES, { lobbies });
      console.log(`Inizia partita - ${data.lobbyCode}`);
      io.to(data.lobbyCode).emit(c.INIZIA);
    });

    socket.on(c.VOTE, (data: { lobbyCode: string; voter: string, vote: string }) => {
      console.log('Ho ricevuto il voto ', data);

      const thisGame = actualGameManager.getGame(data.lobbyCode);

      if (!thisGame) {
        socket.emit(c.FORCE_RESET);
        return;
      }

      if (Object.keys(thisGame.players).includes(data.vote) || data.vote === '') {
        thisGame.castVote(data.voter, data.vote);
        io.to(data.lobbyCode).emit(c.PLAYERS_WHO_VOTED, { players: thisGame.getWhatPlayersVoted() });
      }


      if (thisGame.didAllPlayersVote()) {
        const players = thisGame.players;
        const voteRecap = thisGame.getWhatPlayersVoted();
        const playerImages = thisGame.getImages();
        const mostVotedPerson = thisGame.getMostVotedPerson();
        thisGame.resetWhatPlayersVoted()
        io.to(data.lobbyCode).emit(c.SHOW_RESULTS, { players, voteRecap, playerImages, mostVotedPerson });
      }
    });

    socket.on(c.READY_FOR_NEXT_QUESTION, (data: { lobbyCode: string; playerName: string }) => {
      const thisGame = actualGameManager.getGame(data.lobbyCode);
      if (!thisGame) {
        socket.emit(c.FORCE_RESET);
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
        console.log(players);
        const images = thisGame.getImages();
        console.log(images);
        io.to(data.lobbyCode).emit(c.SEND_QUESTION, { question, players, images });
      } else {
        console.log('Game Over: no more questions.');
        console.log('Risultati finali:');

        io.to(data.lobbyCode).emit(c.GAME_OVER, { playerScores: thisGame.getScores(), playerImages: thisGame.getImages() });
        actualGameManager.deleteGame(thisGame.lobbyCode);
      }
    });

    socket.on(c.REQUEST_RENDER_LOBBY, (lobbyCode: string, callback: (thisGame: Game) => void) => {
      const thisGame = actualGameManager.getGame(lobbyCode);
      if (thisGame) {
        callback(thisGame);
      }
    });

    const getQuestionGenresAsStrings = (): string[] => {
      return Object.values(QuestionGenre);
    }

    socket.on(c.REQUEST_CATEGORIES, () => {
      const genres = getQuestionGenresAsStrings();
      console.log('Generi da inviare: ', genres);
      socket.emit(c.SEND_GENRES, { genres });
    });

    socket.on(c.JOIN_ROOM, (data: { playerName: string, lobbyCode: string, image: string }) => {
      socket.join(data.lobbyCode);
      const thisGame = actualGameManager.getGame(data.lobbyCode);
      if (!thisGame) {
        socket.emit(c.FORCE_RESET);
        return;
      }
      thisGame.addPlayer(data.playerName, socket.id, data.image);
    })

    socket.on(c.LEAVE_ROOM, (data: { playerName: string, lobbyCode: string }) => {
      socket.leave(data.lobbyCode);
    })

    socket.on(c.REMOVE_PLAYER, (data: { playerName: string, currentLobby: string }) => {
      const thisGame = actualGameManager.getGame(data.currentLobby);
      thisGame.removePlayer(data.playerName);
      io.to(data.currentLobby).emit(c.RENDER_LOBBY, thisGame);
    })

    socket.on(c.EXIT_LOBBY, (data: { currentPlayer: string; currentLobby: string; }) => {
      myExitLobby(socket, io, data);
    });

  });
}
