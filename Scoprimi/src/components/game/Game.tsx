import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketEvents } from '../../../../Server/src/MiddleWare/SocketEvents.js';
import { PlayerImages, PlayerScores, FinalResultData } from '../../ts/types';
import { socket } from '../../ts/socketInit';
import Timer from './Timer';
import QuestionComponent from './QuestionComponent.js';
import PlayerList from './PlayerList';
import { useSession } from '../../contexts/SessionContext';
import Results from './Results';
import { GameStates, useGameState } from '../../contexts/GameStateContext';
import ImageList from './ImageList';
import { Question, QuestionMode } from '../../../../Server/src/data/Question';
import QuestionList from './QuestionList';
import EndGameWrapper from './EndGameWrapper.js';

// Funzione per il parsing di filename di immagini
export const todoShitFunction = (votestring: string) => {
  const wordlList = votestring.substring(votestring.lastIndexOf('/') + 1).split('_');

  // Gestisce nel caso il filename non sia sburato come li rende cloudinary aggiungendo roba a caso dopo il nome. Ex. vedi il file 'fursuit.jpg'
  if (wordlList.length === 1) {
    return wordlList[0].replace(/\.(.*)$/, '');
  }
  wordlList.pop();
  return wordlList.join(' ');
};

const Game: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [players, setPlayers] = useState<string[]>([]);
  const [images, setImages] = useState<{ [key: string]: string }>({});
  const [mostVotedPerson, setMostVotedPerson] = useState<string>('');
  const [playerImages, setPlayerImages] = useState<{ [key: string]: string }>({});
  const [voteRecap, setVoteRecap] = useState<{ [key: string]: string }>({});

  const [clicked, setClicked] = useState<boolean>(false);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [resetSelection, setResetSelection] = useState<boolean>(false);
  const [buttonClicked, setButtonClicked] = useState<boolean>(false);
  const [playersWhoVoted, setPlayersWhoVoted] = useState<string[]>([]); //non è come il server, questo è un array e bona
  const [questionImages, setQuestionImages] = useState<string[]>([]);

  const { currentLobby, currentPlayer, setCurrentLobby } = useSession();
  const { actualState, transitionTo, fromQuestionToResponse, fromNextQuestionToQuestion } = useGameState();
  const navigate = useNavigate();
  const [isPhoto, setIsPhoto] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');

  const [pages, setPages] = useState<any>();

  const [isWho, setIsWho] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = 'Sicuro di voler uscire?'; // Messaggio non personalizzabile, ma appare una finestra di dialogo di conferma.
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Questo viene fatto solo 1 volta e amen
  useEffect(() => {
    socket.emit(SocketEvents.READY_FOR_NEXT_QUESTION, { lobbyCode: currentLobby, playerName: currentPlayer });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on(SocketEvents.SEND_QUESTION, (data: { question: Question, players: string[], images: { [key: string]: string }, selectedPlayer: string }) => {
      console.log('questions: ');
      console.log(data.question.images);
      setClicked(false);
      setIsTimerActive(true);
      setQuestion(data.question.text);
      setPlayers(data.players);
      setImages(data.images);
      setResetSelection(false);
      setButtonClicked(false);
      setPlayersWhoVoted([]);
      fromNextQuestionToQuestion(data.question.mode);
      setQuestionImages(data.question.images);
      // TODO fix veloce per 2 pagine di show_result
      setIsPhoto(data.question.mode === QuestionMode.Photo);
      setSelectedPlayer(data.selectedPlayer);
      setIsWho(data.question.mode === QuestionMode.Who);
    });
  }, [fromNextQuestionToQuestion, playersWhoVoted, selectedPlayer]);

  useEffect(() => {
    socket.on(SocketEvents.ENDGAMEWRAPPER, (data: { pages }) => {
      setPages(data.pages);
      transitionTo(GameStates.PREPODIUMWRAP);
    });
  }, [transitionTo]);

  useEffect(() => {
    socket.on(SocketEvents.PLAYERS_WHO_VOTED, (data: { players: { [key: string]: string } }) => {
      console.log(Object.keys(data.players));
      setPlayersWhoVoted(Object.keys(data.players));
    });
    return () => {
      socket.off(SocketEvents.PLAYERS_WHO_VOTED);
    };
  }, []);

  useEffect(() => {
    socket.on(SocketEvents.SHOW_RESULTS, (data: {
      voteRecap: { [key: string]: string },
      playerImages: { [key: string]: string },
      mostVotedPerson: string,
    }) => {
      console.log('Madonna sburra');
      setVoteRecap(data.voteRecap);
      setPlayerImages(data.playerImages);
      setMostVotedPerson(data.mostVotedPerson);
      setIsTimerActive(false);
      transitionTo(GameStates.RESULTOUTCOME);
    });

    socket.on(SocketEvents.GAME_OVER, (data: { playerScores: PlayerScores, playerImages: PlayerImages }) => {
      setQuestion('');
      setCurrentLobby(null);
      setPlayers([]);
      socket.emit(SocketEvents.LEAVE_ROOM, { playerName: currentPlayer, LobbyCode: currentLobby });

      const finalResults: FinalResultData = {};
      Object.keys(data.playerScores).forEach(playerName => {
        finalResults[playerName] = {
          score: data.playerScores[playerName],
          image: data.playerImages[playerName],
        };
      });

      navigate('/final-results', { state: { finalResults } });
    });

    return () => {
      socket.off(SocketEvents.SEND_QUESTION);
      socket.off(SocketEvents.SHOW_RESULTS);
      socket.off(SocketEvents.RESULT_MESSAGE);
      socket.off(SocketEvents.GAME_OVER);
    };
  }, [currentLobby, currentPlayer, navigate, setCurrentLobby, transitionTo]);


  const handleVote = (player: string) => {
    if (clicked) {
      console.log('Hai già votato!');
      return;
    }
    setClicked(true);
    setIsTimerActive(false);
    socket.emit(SocketEvents.VOTE, { lobbyCode: currentLobby, voter: currentPlayer, vote: player });
    fromQuestionToResponse();
  };


  const handleNextQuestion = () => {
    setResetSelection(true);
    setButtonClicked(true);
    socket.emit(SocketEvents.READY_FOR_NEXT_QUESTION, { lobbyCode: currentLobby, playerName: currentPlayer });
    transitionTo(GameStates.NEXTQUESTION);
  };

  const handleTimeUp = () => {
    if (!clicked) {
      socket.emit(SocketEvents.VOTE, { lobbyCode: currentLobby, voter: currentPlayer, vote: null });
      fromQuestionToResponse();
    }
    setIsTimerActive(false);
  };

  // Render delle page
  switch (actualState) {

    case GameStates.MOCK:
      break;


    case GameStates.PHOTOQUESTION:
    case GameStates.PHOTORESPONSE:
      return (
        <div className="paginator">
          <QuestionComponent question={question} selectedPlayer={selectedPlayer} />
          <div className='inline'>
            <div className='label-container'>
              <p>Scegli un giocatore</p>
            </div>
            <Timer duration={25} onTimeUp={handleTimeUp} isActive={isTimerActive} />
          </div>
          <ImageList images={
            questionImages
          } onVote={handleVote} disabled={clicked} resetSelection={resetSelection} />
        </div>
      );

    case GameStates.WHOQUESTION:
    case GameStates.WHORESPONSE:
      return (
        <div className="paginator">
          <QuestionComponent question={question} selectedPlayer={selectedPlayer} />
          <div className='inline'>
            <div className='label-container'>
              <p>Scegli un giocatore</p>
            </div>
            <Timer duration={25} onTimeUp={handleTimeUp} isActive={isTimerActive} />
          </div>
          <QuestionList questions={questionImages} onVote={handleVote} disabled={clicked} resetSelection={resetSelection} />
        </div>
      );

    case GameStates.THEMEQUESTION:
      break;
    case GameStates.THEMERESPONSE:
      break;
    case GameStates.THEMERESULTFINAL:
      break;

    case GameStates.STANDARDQUESTION:
    case GameStates.STANDARDRESPONSE:
      return (
        <div className="paginator">
          <QuestionComponent question={question} selectedPlayer={selectedPlayer} />
          <div className='inline'>
            <div className='label-container'>
              <p>Scegli un giocatore</p>
            </div>
            <Timer duration={25} onTimeUp={handleTimeUp} isActive={isTimerActive} />
          </div>
          <div className='elegant-background fill scrollable'>
            <PlayerList players={players} images={images} onVote={handleVote} disabled={clicked} resetSelection={resetSelection} playersWhoVoted={playersWhoVoted} />
          </div>
        </div>
      );

    case GameStates.RESULTOUTCOME:
    case GameStates.NEXTQUESTION:
      return (
        <div className="paginator">
          <div className="result-message text-center">
            <h4 style={{ textAlign: 'left' }}>{selectedPlayer ? question.replace('$', selectedPlayer) : question}</h4>
            <p className="result-subtitle" style={{ textAlign: 'left' }}>
              {mostVotedPerson === '' ? 'Pareggio!' : 'Scelta più votata:'}
            </p>
            {isWho ? <h4>{mostVotedPerson}</h4> : ( // Da fixare, fa un pò cagare
              isPhoto ?
                <img
                  src={mostVotedPerson}
                  alt={todoShitFunction(mostVotedPerson)}
                  className="winnerImage"
                />
                :
                <img
                  src={playerImages[mostVotedPerson]}
                  alt={mostVotedPerson}
                  className="winnerImage"
                />
            )}
            <p>{isPhoto ? todoShitFunction(mostVotedPerson) : !isWho ? mostVotedPerson : ''}</p>
          </div>
          <div className="elegant-background image-container fill scrollable">
            <Results
              curPlayer={currentPlayer}
              mostVotedPerson={mostVotedPerson}
              playerImages={playerImages}
              voteRecap={voteRecap}
              isPhoto={isPhoto}
            />
          </div>
          <div className="d-flex justify-content-center align-items-center">
            <button
              id="nextQuestionBtn"
              className="my-btn my-bg-tertiary mt-3"
              onClick={handleNextQuestion}
              style={{
                width: '100%',
                backgroundColor: buttonClicked ? 'var(--disabled-color)' : '#75b268',
              }}
            >
              Prosegui
            </button>
          </div>
        </div>
      );

    case GameStates.PREPODIUMWRAP:
      return (
        <EndGameWrapper pages={pages} />
      );

    default:
      break;
  }
};

export default Game;
