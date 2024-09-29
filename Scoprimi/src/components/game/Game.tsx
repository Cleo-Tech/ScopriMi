import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as c from '../../../../Server/src/socketConsts';
import { QuestionData, PlayerImages, PlayerScores, FinalResultData } from '../../ts/types';
import { socket } from '../../ts/socketInit';
import Timer from './Timer';
import Question from './Question';
import PlayerList from './PlayerList';
import { useSession } from '../../contexts/SessionContext';
import Results from './Results';
import { GameStates, useGameState } from '../../contexts/GameStateContext';
import { QuestionMode } from '../../../../Server/src/data/Question';
import ImageList from './ImageList';

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

  const { currentLobby, currentPlayer, setCurrentLobby } = useSession();
  const { actualState, transitionTo } = useGameState();
  const navigate = useNavigate();

  // Questo viene fatto solo 1 volta e amen
  useEffect(() => {
    socket.emit(c.READY_FOR_NEXT_QUESTION, { lobbyCode: currentLobby, playerName: currentPlayer });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    socket.on(c.SEND_QUESTION, ({ question, players, images }: QuestionData) => {
      console.log(question, players, images);
      setClicked(false);
      setIsTimerActive(true);
      setQuestion(question.text);
      setPlayers(players);
      setImages(images);
      setResetSelection(false);
      setButtonClicked(false);
      setPlayersWhoVoted([]);
      switch (question.mode) {
        case QuestionMode.Photo:
          // TODO fix
          transitionTo(GameStates.WHOQUESTION);
          break;
        case QuestionMode.Standard:
          transitionTo(GameStates.STANDARDQUESTION);
          break;
        default:
          console.error('non dovevi finire qua');
          break;
      }
    });
  }, [transitionTo]);


  useEffect(() => {
    socket.on(c.PLAYERS_WHO_VOTED, (data: { players: { [key: string]: string } }) => {
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
  };

  // TODO Da finire
  const handleVoteImage = (player: string) => {
    if (clicked) {
      console.log('Hai già votato!');
      return;
    }
    setClicked(true);
    setIsTimerActive(false);
    socket.emit(c.VOTE, { lobbyCode: currentLobby, voter: currentPlayer, vote: player });
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
      transitionTo(GameStates.STANDARDRESPONSE);
    }
    setIsTimerActive(false);
  };


  // Render delle page
  switch (actualState) {

    // case GameStates.NEXTQUESTION:
    //   break;
    // case GameStates.STANDARDRESPONSE:
    //   break;
    case GameStates.MOCK:
      break;
    case GameStates.WHOQUESTION:
      return (
        <div className="paginator">
          <Question question={question} />
          <div className='inline'>
            <div className='label-container'>
              <p>Scegli un giocatore</p>
            </div>
            <Timer duration={25} onTimeUp={handleTimeUp} isActive={isTimerActive} />
          </div>
          <ImageList images={['https://www.geo.tv/assets/uploads/updates/2024-09-29/566514_7476378_updates.jpg', 'https://images.rockol.it/wAQnkZSCoxywstvx1lWXOmhWTNU=/645x482/smart/rockol-img/img/foto/upload/kanye-west.2018-05-24-13-13-07.jpg',
            'https://www.trend-online.com/wp-content/uploads/2024/03/kanye-west-patrimonio.jpg', 'https://content.imageresizer.com/images/memes/Kanye-West-Stare-meme-10.jpg'
          ]} onVote={handleVote} disabled={clicked} resetSelection={resetSelection} />
        </div>
      );
    case GameStates.THEMEQUESTION:
      break;
    case GameStates.THEMERESPONSE:
      break;
    case GameStates.WHORESPONSE:
      break;
    case GameStates.THEMERESULTFINAL:
      break;

    case GameStates.STANDARDQUESTION:
    case GameStates.STANDARDRESPONSE:
      return (
        <div className="paginator">
          <Question question={question} />
          <div className='inline'>
            <div className='label-container'>
              <p>Scegli un giocatore</p>
            </div>
            <Timer duration={25} onTimeUp={handleTimeUp} isActive={isTimerActive} />
          </div>
          <div className='elegant-background fill scrollable'>
            <PlayerList players={players} images={images} onVote={handleVoteImage} disabled={clicked} resetSelection={resetSelection} playersWhoVoted={playersWhoVoted} />
          </div>
        </div>
      );

    case GameStates.RESULTOUTCOME:
    case GameStates.NEXTQUESTION:
      return (
        <div className="paginator">
          <div className="result-message text-center">
            {mostVotedPerson === '' ? (<h3>Pareggio!</h3>) : (<h3>Persona più votata</h3>)}
            <img
              src={playerImages[mostVotedPerson]}
              alt={mostVotedPerson}
              className="winnerImage"
            />
            <p>{mostVotedPerson}</p>
          </div>
          <div className='elegant-background image-container fill scrollable'>
            <Results mostVotedPerson={mostVotedPerson} playerImages={playerImages} voteRecap={voteRecap} />
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
