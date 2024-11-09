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
import { randomInt } from 'crypto';

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

function shuffle(array: any[]): any[] {
  let copy = [...array];
  let currentIndex = copy.length;

  while (currentIndex != 0) {

    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [copy[currentIndex], copy[randomIndex]] = [
      copy[randomIndex], copy[currentIndex]];
  }

  // Restituisce l'array mescolato senza modificare l'originale
  return copy;
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

function myCreateLobby(data: { code: string, numQuestionsParam: number, selectedGenres: QuestionGenre[], oldQuestions?: Question[] }) {
  console.log('Creo la lobby con [codice - domande]: ', data.code, ' - ', data.numQuestionsParam);
  const thisGame = actualGameManager.getGame(data.code);

  thisGame.gamesGenre = data.selectedGenres;

  const questionsPerGenre = Math.floor(data.numQuestionsParam / data.selectedGenres.length);
  const extraQuestions = data.numQuestionsParam % data.selectedGenres.length;

  let allSelectedQuestions: Question[] = [];

  data.selectedGenres.forEach((genre, index) => {
    let genreQuestions: Question[] = [];

    AllQuestions[genre].forEach(wholeText => {
      let tmpQuestion = new Question();
      tmpQuestion.genre = genre;

      tmpQuestion.text = getTextQuestion(wholeText);

      let conversion = {
        'generic': QuestionMode.Standard,
        'adult': QuestionMode.Standard,
        'photo': QuestionMode.Photo,
        'who': (randomInt(0, 100) > -1) ? QuestionMode.CustomWho : QuestionMode.Who,
      };
      tmpQuestion.mode = conversion[genre];


      // imposta il valore di images[]
      switch (tmpQuestion.mode) {
        case QuestionMode.Photo:
          const context = getContextQuestion(wholeText);
          const onlyContextImages = photoUrls
            .filter(p => p['tags'].includes(context))
            .map(p => p['secure_url']);

          const shuffledOnlyContextImages = shuffle(onlyContextImages);
          tmpQuestion.images = shuffledOnlyContextImages.slice(0, 4);
          break;

        case QuestionMode.Who:
          const whoQuestions = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/answers.json'), 'utf8'));
          tmpQuestion.images = shuffle(whoQuestions).slice(0, 4);
          break;

        case QuestionMode.Standard:
        case QuestionMode.CustomWho:
          tmpQuestion.images = [];
          break;

        default:
          console.error('Errore: tipo di domanda sconosciuto');
      }

      genreQuestions.push(tmpQuestion);
    });

    const selectedGenreQuestions = shuffle(genreQuestions).slice(0, questionsPerGenre + (index < extraQuestions ? 1 : 0));
    allSelectedQuestions = allSelectedQuestions.concat(selectedGenreQuestions);
  });

  // Funzione di utilità per ottenere le domande in proporzione anche in caso di rematch
  function selectProportionalQuestions(questions: Question[], numQuestions: number): Question[] {
    const proportionalQuestions: Question[] = [];
    const genreCount = data.selectedGenres.length;
    const questionsPerGenreRematch = Math.floor(numQuestions / genreCount);
    const extraQuestionsRematch = numQuestions % genreCount;

    data.selectedGenres.forEach((genre, index) => {
      const genreQuestions = questions.filter(q => q.genre === genre);
      const selectedQuestions = shuffle(genreQuestions).slice(0, questionsPerGenreRematch + (index < extraQuestionsRematch ? 1 : 0));
      proportionalQuestions.push(...selectedQuestions);
    });

    return shuffle(proportionalQuestions);
  }

  // Assegna le domande mantenendo le proporzioni
  if (data.oldQuestions === undefined) {
    actualGameManager.getGame(data.code).selectedQuestions = selectProportionalQuestions(allSelectedQuestions, data.numQuestionsParam);
  } else {
    const filteredQuestions = allSelectedQuestions.filter(newQuestion =>
      !data.oldQuestions.includes(newQuestion)
    );

    const questionsToAssign = filteredQuestions.length >= data.numQuestionsParam
      ? selectProportionalQuestions(filteredQuestions, data.numQuestionsParam)
      : selectProportionalQuestions(allSelectedQuestions, data.numQuestionsParam);

    actualGameManager.getGame(data.code).selectedQuestions = questionsToAssign;
  }
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


    // Creazione di un gioco successivo
    // Creato da "Gioca ancora"
    socket.on(SocketEvents.SET_NEXT_GAME, (data: { code: string, playerName: string, image: string }) => {
      console.log('Dati partita vecchia: ', actualGameManager.getGame(data.code).selectedQuestions);

      const thisGame = actualGameManager.getGame(data.code);
      if (!thisGame) {
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }

      // sposta il generateLobbyCode nel GAME/GameManager
      const codeTmp = generateLobbyCode();
      const dataCreateLobby = {
        code: codeTmp,
        numQuestionsParam: thisGame.selectedQuestions.length,
        selectedGenres: thisGame.gamesGenre,
        oldQuestions: actualGameManager.getGame(data.code).selectedQuestions,
      }

      if (thisGame.nextGame === undefined) {
        // crea lobby per partita successiva
        actualGameManager.createGame(codeTmp, data.playerName);
        myCreateLobby(dataCreateLobby);
        const lobbies = actualGameManager.listGames();
        io.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
        socket.emit(SocketEvents.RETURN_NEWGAME, { lobbyCode: codeTmp });
        thisGame.nextGame = codeTmp;
      } else {
        // gia esiste il game, gli restituisco quello che esiste (il secondo che preme gioca ancora)
        socket.emit(SocketEvents.RETURN_NEWGAME, { lobbyCode: thisGame.nextGame });
      }
    });


    socket.on(SocketEvents.CREATE_LOBBY, async (data: { code: string, numQuestionsParam: number, selectedGenres: QuestionGenre[], admin: string, oldQuestions: Question[] }) => {
      actualGameManager.createGame(data.code, data.admin);
      myCreateLobby(data);
      const lobbies = actualGameManager.listGames();
      io.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
      const lobbyCode = data.code;
      socket.emit(SocketEvents.RETURN_NEWGAME, { lobbyCode });
    });


    socket.on(SocketEvents.MODIFY_GAME_CONFIG, (data: { code: string, numQuestionsParam: number, selectedGenres: QuestionGenre[], oldQuestions: Question[], admin: string }) => {
      const thisGame = actualGameManager.getGame(data.code);
      if (!thisGame) {
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }
      myCreateLobby(data);
      io.to(data.code).emit(SocketEvents.RENDER_LOBBY, thisGame)
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

    socket.on(SocketEvents.SEND_CUSTOM_ANSWER, (data: { answer: string, currentPlayer: string, currentLobby: string }) => {
      const defaultAnswers = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/answers.json'), 'utf8'));
      const thisGame = actualGameManager.getGame(data.currentLobby);
      if (!thisGame) {
        console.error('non esiste questa lobby');
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }

      // Se la domande è vuota gliene do un di default
      if (data.answer.trim().length === 0) {
        data.answer = defaultAnswers[randomInt(defaultAnswers.length)]
      }

      if (data.answer.length > 100) {
        data.answer.slice(0, 99);
      }

      thisGame.selectedQuestions[thisGame.currentQuestionIndex].images.push(data.answer);

      if (thisGame.selectedQuestions[thisGame.currentQuestionIndex].images.length === Object.keys(thisGame.players).length) {
        const images = thisGame.selectedQuestions[thisGame.currentQuestionIndex].images;
        io.to(data.currentLobby).emit(SocketEvents.ALL_CUSTOM_ANSWER, { answers: images });
      }
    });

    socket.on(SocketEvents.REQUEST_RENDER_LOBBIES, () => {
      const lobbies = actualGameManager.listGames();
      socket.emit(SocketEvents.RENDER_LOBBIES, { lobbies });
    });

    socket.on(SocketEvents.TOGGLE_IS_READY_TO_GAME, (data: { lobbyCode: string; playerName: string }) => {
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


    socket.on(SocketEvents.VOTE, (data: { lobbyCode: string; voter: string, vote: string }) => {

      const thisGame = actualGameManager.getGame(data.lobbyCode);

      if (!thisGame) {
        console.log('Force reset');
        socket.emit(SocketEvents.FORCE_RESET);
        return;
      }

      thisGame.castVote(data.voter, data.vote);
      io.to(data.lobbyCode).emit(SocketEvents.PLAYERS_WHO_VOTED, { players: thisGame.getWhatPlayersVoted() });

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
        thisGame.resetReadyForNextQuestion();
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
