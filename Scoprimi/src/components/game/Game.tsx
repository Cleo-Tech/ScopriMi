import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as c from '../../../../Server/src/MiddleWare/socketConsts.js';
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
  const [buttonClicked, setButtonClicked] = useState<boolean>(false); // Nuovo stato per il bottone
  const [playersWhoVoted, setPlayersWhoVoted] = useState<string[]>([]); //non è come il server, questo è un array e bona
  const [questionImages, setQuestionImages] = useState<string[]>([]);

  const { currentLobby, currentPlayer, setCurrentLobby } = useSession();
  const { actualState, transitionTo, fromQuestionToResponse, fromNextQuestionToQuestion } = useGameState();
  const navigate = useNavigate();
  const [isPhoto, setIsPhoto] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');

  // Questo viene fatto solo 1 volta e amen
  useEffect(() => {
    socket.emit(c.READY_FOR_NEXT_QUESTION, { lobbyCode: currentLobby, playerName: currentPlayer });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on(c.SEND_QUESTION, (data: { question: Question, players: string[], images: { [key: string]: string }, selectedPlayer: string }) => {
      console.log(selectedPlayer);
      setClicked(false);
      setIsTimerActive(true);
      setQuestion(data.question.text);
      setPlayers(data.players);
      setImages(data.images);
      setResetSelection(false);
      setButtonClicked(false);
      console.log(playersWhoVoted);
      setPlayersWhoVoted([]);
      console.log(playersWhoVoted);
      fromNextQuestionToQuestion(data.question.mode);
      setQuestionImages(data.question.images);
      // TODO fix veloce per 2 pagine di show_result
      setIsPhoto(data.question.mode === QuestionMode.Photo);
      setSelectedPlayer(data.selectedPlayer);
    });
  }, [fromNextQuestionToQuestion, playersWhoVoted, selectedPlayer]);


  useEffect(() => {
    socket.on(c.PLAYERS_WHO_VOTED, (data: { players: { [key: string]: string } }) => {
      console.log(Object.keys(data.players));
      setPlayersWhoVoted(Object.keys(data.players));
    });
    return () => {
      socket.off(c.PLAYERS_WHO_VOTED);
    };
  }, []);

  useEffect(() => {
    socket.on(c.SHOW_RESULTS, (data: {
      voteRecap: { [key: string]: string },
      playerImages: { [key: string]: string },
      mostVotedPerson: string,
    }) => {
      setVoteRecap(data.voteRecap);
      setPlayerImages(data.playerImages);
      setMostVotedPerson(data.mostVotedPerson);
      setIsTimerActive(false);
      transitionTo(GameStates.RESULTOUTCOME);
    });

    socket.on(c.GAME_OVER, (data: { playerScores: PlayerScores, playerImages: PlayerImages }) => {
      setQuestion('');
      setPlayers([]);
      setCurrentLobby(undefined);
      socket.emit(c.LEAVE_ROOM, { playerName: currentPlayer, LobbyCode: currentLobby });

      const finalResults: FinalResultData = {};
      Object.keys(data.playerScores).forEach(playerName => {
        finalResults[playerName] = {
          score: data.playerScores[playerName],
          image: data.playerImages[playerName],
        };
      });
      console.log(finalResults);
      navigate('/final-results', { state: { finalResults } });
    });

    return () => {
      socket.off(c.SEND_QUESTION);
      socket.off(c.SHOW_RESULTS);
      socket.off(c.RESULT_MESSAGE);
      socket.off(c.GAME_OVER);
      //socket.off(c.PLAYERS_WHO_VOTED); IDK
    };
  }, [currentLobby, currentPlayer, navigate, setCurrentLobby, transitionTo]);


  const handleVote = (player: string) => {
    if (clicked) {
      console.log('Hai già votato!');
      return;
    }
    setClicked(true);
    setIsTimerActive(false);
    socket.emit(c.VOTE, { lobbyCode: currentLobby, voter: currentPlayer, vote: player });
    fromQuestionToResponse();
  };


  const handleNextQuestion = () => {
    setResetSelection(true);
    setButtonClicked(true); // Cambia lo stato del bottone
    socket.emit(c.READY_FOR_NEXT_QUESTION, { lobbyCode: currentLobby, playerName: currentPlayer });
    transitionTo(GameStates.NEXTQUESTION);
  };

  const handleTimeUp = () => {
    if (!clicked) {
      socket.emit(c.VOTE, { lobbyCode: currentLobby, voter: currentPlayer, vote: '' });
      fromQuestionToResponse();
    }
    setIsTimerActive(false);
  };

  // Render delle page
  switch (actualState) {

    case GameStates.MOCK:
      break;
    case GameStates.WHORESPONSE:
    case GameStates.WHOQUESTION:
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
            [
              'https://assets.vogue.com/photos/633a6fbd4956fb0b77008c17/4:3/w_2240,c_limit/Kanye-West-Paris-Couture-FW21-Shows-Photographed-by-Acielle---Styledumonde.jpg',
              'https://www.google.com/imgres?q=kanye%20west&imgurl=https%3A%2F%2Fassets.vogue.com%2Fphotos%2F633a6cf9e15addd21b68038a%2F1%3A1%2Fw_1999%2Ch_1999%2Cc_limit%2FKanye%2520West%2520Paris%2520Couture%2520FW21%2520Shows%2520Photographed%2520by%2520Acielle%2520_%2520Styledumonde.jpeg&imgrefurl=https%3A%2F%2Fwww.vogue.com%2Farticle%2Ftheres-no-one-thats-not-welcome-kanye-west-on-yzy-paris-and-his-three-phases-in-fashion&docid=oImDFM27PnjRXM&tbnid=UclKNp1z4fdmeM&vet=12ahUKEwiH7o7-1_WIAxWj7wIHHZwfKqIQM3oECGYQAA..i&w=1999&h=1999&hcb=2&ved=2ahUKEwiH7o7-1_WIAxWj7wIHHZwfKqIQM3oECGYQAA'
              , 'https://www.google.com/imgres?q=kanye%20west&imgurl=https%3A%2F%2Fcdn.britannica.com%2F00%2F236500-050-06E93F4F%2FKanye-West-2018.jpg&imgrefurl=https%3A%2F%2Fwww.britannica.com%2Fbiography%2FKanye-West&docid=WSV2FW2n5BKnhM&tbnid=6t_7ZejDj1l3IM&vet=12ahUKEwiH7o7-1_WIAxWj7wIHHZwfKqIQM3oECBkQAA..i&w=1600&h=1158&hcb=2&ved=2ahUKEwiH7o7-1_WIAxWj7wIHHZwfKqIQM3oECBkQAA'
              , 'https://www.google.com/imgres?q=kanye%20west&imgurl=https%3A%2F%2Fmedia.gqitalia.it%2Fphotos%2F5efc3ff8657d0a3f7c59a78d%2F4%3A3%2Fw_3552%2Ch_2664%2Cc_limit%2FGettyImages-1205196725.jpg&imgrefurl=https%3A%2F%2Fwww.gqitalia.it%2Fshow%2Farticle%2Fkanye-west-wash-us-in-the-blood-nuovo-singolo&docid=NTaQytFIZ9QSYM&tbnid=67EkabZDEGBo-M&vet=12ahUKEwiH7o7-1_WIAxWj7wIHHZwfKqIQM3oECH8QAA..i&w=3552&h=2664&hcb=2&ved=2ahUKEwiH7o7-1_WIAxWj7wIHHZwfKqIQM3oECH8QAA',
            ]
          } onVote={handleVote} disabled={clicked} resetSelection={resetSelection} />
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
            {mostVotedPerson === '' ? (<h3>Pareggio!</h3>) : (<h3>Persona più votata</h3>)}
            {!isPhoto ?
              <img
                src={playerImages[mostVotedPerson]}
                alt={mostVotedPerson}
                className="winnerImage"
              /> :
              <img
                src={mostVotedPerson}
                alt={mostVotedPerson.substring(mostVotedPerson.lastIndexOf('/') + 1).split('.')[0]}
                className="winnerImage"
              />}
            <p>{mostVotedPerson.substring(mostVotedPerson.lastIndexOf('/') + 1).split('.')[0]}</p>
          </div>
          <div className='elegant-background image-container fill scrollable'>
            <Results mostVotedPerson={mostVotedPerson} playerImages={playerImages} voteRecap={voteRecap} isPhoto={isPhoto} />
          </div>
          <div className="d-flex justify-content-center align-items-center">
            <button
              id="nextQuestionBtn"
              className="my-btn my-bg-tertiary mt-3"
              onClick={handleNextQuestion}
              style={{
                width: '100%',
                backgroundColor: buttonClicked ? 'var(--disabled-color)' : '#75b268', // Cambia il colore al clic
              }}
            >
              Prosegui al prossimo turno
            </button>
          </div>
        </div>
      );

    default:
      break;
  }
};

export default Game;
