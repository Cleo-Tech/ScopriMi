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

const Game: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [players, setPlayers] = useState<string[]>([]);
  const [images, setImages] = useState<{ [key: string]: string }>({});
  const [mostVotedPerson, setMostVotedPerson] = useState<string>('');
  const [playerImages, setPlayerImages] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState<boolean>(false);
  const [voteRecap, setVoteRecap] = useState<{ [key: string]: string }>({});
  const [gameOver, setGameOver] = useState<boolean>(false);

  const [clicked, setClicked] = useState<boolean>(false);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);
  const [resetSelection, setResetSelection] = useState<boolean>(false);
  const [buttonClicked, setButtonClicked] = useState<boolean>(false); // Nuovo stato per il bottone
  const [playersWhoVoted, setPlayersWhoVoted] = useState<string[]>([]); //non è come il server, questo è un array e bona

  const { currentLobby, currentPlayer, setCurrentPlayer, setCurrentLobby } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Sono pronto a ricevere', currentLobby, currentPlayer);
    socket.emit(c.READY_FOR_NEXT_QUESTION, { lobbyCode: currentLobby, playerName: currentPlayer });
  }, [currentLobby, currentPlayer]);

  useEffect(() => {
    socket.on(c.PLAYERS_WHO_VOTED, (data: { players: { [key: string]: string } }) => {
      setPlayersWhoVoted(Object.keys(data.players));
    });
  }, []);

  useEffect(() => {
    socket.on(c.SEND_QUESTION, ({ question, players, images }: QuestionData) => {
      console.log(question, players, images);
      setClicked(false);
      setIsTimerActive(true);
      setQuestion(question);
      setPlayers(players);
      setImages(images);
      setShowResults(false);
      setResetSelection(false);
      setButtonClicked(false);
      setPlayersWhoVoted([]);
    });

    socket.on(c.SHOW_RESULTS, (data: {
      voteRecap: { [key: string]: string },
      playerImages: { [key: string]: string },
      mostVotedPerson: string,
    }) => {
      setVoteRecap(data.voteRecap);
      setPlayerImages(data.playerImages);
      setMostVotedPerson(data.mostVotedPerson);
      setShowResults(true);
      setIsTimerActive(false);
    });

    socket.on(c.GAME_OVER, (data: { playerScores: PlayerScores, playerImages: PlayerImages }) => {
      setGameOver(true);
      setQuestion('');
      setPlayers([]);
      setShowResults(false);
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
  }, [currentLobby, currentPlayer, setCurrentPlayer, navigate, setCurrentLobby]);


  const handleVote = (player: string) => {
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
  };

  const handleTimeUp = () => {
    if (!clicked) {
      socket.emit(c.VOTE, { lobbyCode: currentLobby, voter: currentPlayer, vote: '' });
    }
    setIsTimerActive(false);
  };

  return (
    <div className="paginator">
      <div className={showResults ? 'text-center' : 'text-left'}>
        {!gameOver && (
          <>
            {showResults ? (
              <div className="result-message">
                {mostVotedPerson === '' ? (<h3>Pareggio!</h3>) : (<h3>Persona più votata</h3>)}
                <img
                  src={playerImages[mostVotedPerson]}
                  alt={mostVotedPerson}
                  className="winnerImage"
                />
                <p>{mostVotedPerson}</p>
              </div>
            ) : (
              <>
                <Question question={question} />
                <div className='inline'>
                  <div className='label-container'>
                    <p>Scegli un giocatore</p>
                  </div>
                  <Timer duration={25} onTimeUp={handleTimeUp} isActive={isTimerActive} />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {!gameOver && (
        <div className='elegant-background image-container fill scrollable'>
          {showResults ? (
            <>
              <Results mostVotedPerson={mostVotedPerson} playerImages={playerImages} voteRecap={voteRecap} />
            </>
          ) : (
            <PlayerList players={players} images={images} onVote={handleVote} disabled={clicked} resetSelection={resetSelection} playersWhoVoted={playersWhoVoted} />
          )}
        </div>
      )}

      {showResults && (
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
      )}
    </div>
  );
};

export default Game;
