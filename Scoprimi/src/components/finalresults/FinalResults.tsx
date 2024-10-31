import React, { useEffect, useState } from 'react';
import { FinalResultData } from '../../ts/types';
import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../../ts/socketInit';
import { SocketEvents } from '../../../../Server/src/MiddleWare/SocketEvents';
import { useSession } from '../../contexts/SessionContext';
import Alert from '../common/Alert';

const defaultHeights = [
  '7vh',
  '8vh',
  '6vh',
];

const defaultColors = [
  '#8a9597', // Argento
  '#cda434', // Oro
  '#cd7f32', // Bronzo
];


function getPodiumStats(sameScore1And2, sameScore1And3, sameScore2And3, positionsArray) {
  let podiumArray = [...positionsArray];

  if (sameScore1And2 && sameScore1And3 && sameScore2And3) {
    podiumArray = [positionsArray[1], positionsArray[1], positionsArray[1]]; // Tutti oro
  }
  else if (!sameScore1And2 && sameScore2And3) {
    podiumArray = [positionsArray[0], positionsArray[1], positionsArray[0]]; // 1 oro 2 argento
  }
  else if (sameScore1And2 && !sameScore2And3) {
    podiumArray = [positionsArray[1], positionsArray[1], positionsArray[2]]; // 2 oro 1 bronzo
  }
  else {
    podiumArray = [...positionsArray]; // Mantieni l'ordine normale
  }

  return podiumArray;
}
const FinalResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { finalResults } = location.state as { finalResults: FinalResultData };
  const { currentPlayer, setCurrentLobby, currentPlayerImage, currentLobby } = useSession();
  const [showAlert, setShowAlert] = useState<boolean>(false);

  function TODOREMATCH() {
    socket.emit(SocketEvents.SET_NEXT_GAME, { code: currentLobby, playerName: currentPlayer, image: currentPlayerImage });
  }

  useEffect(() => {
    socket.on(SocketEvents.ASK_TO_JOIN, (data) => {

      const datatoSend = {
        lobbyCode: data,
        playerName: currentPlayer,
        image: currentPlayerImage,
      };
      socket.emit(SocketEvents.REQUEST_TO_JOIN_LOBBY, datatoSend);

    });
  }, [currentPlayer, currentPlayerImage]);

  useEffect(() => {
    socket.on(SocketEvents.PLAYER_CAN_JOIN, (data) => {
      if (data.canJoin) {
        setCurrentLobby(data.lobbyCode);
        navigate('/lobby');
      } else {
        setShowAlert(true);
      }
    });

    return () => {
      socket.off(SocketEvents.PLAYER_CAN_JOIN);
    };
  }, [navigate, setCurrentLobby]);

  useEffect(() => {
    socket.on(SocketEvents.RETURN_NEWGAME, (data: { lobbyCode: string }) => {
      // TODO
      const datatoSend = {
        lobbyCode: data.lobbyCode,
        playerName: currentPlayer,
        image: currentPlayerImage,
      };
      socket.emit(SocketEvents.REQUEST_TO_JOIN_LOBBY, datatoSend);
    });

    return () => {
      socket.off(SocketEvents.RETURN_NEWGAME);
    };
  }, [currentPlayer, currentPlayerImage]);


  // Ordinamento con tipizzazione
  const sortedResults = Object.entries(finalResults)
    .sort(([, a], [, b]) => b.score - a.score);

  if (!finalResults) {
    return <div className="text-center mt-5">Nessun risultato disponibile.</div>;
  }

  const podium = sortedResults.slice(0, 3);

  if (podium.length > 1) {
    [podium[0], podium[1]] = [podium[1], podium[0]];
  }

  const otherPlayers = sortedResults.slice(3);

  let sameScore1And2 = false;
  let sameScore2And3 = false;
  let sameScore1And3 = false;

  if (podium.length >= 2) {
    sameScore1And2 = podium[1][1].score === podium[0][1].score;
    sameScore2And3 = podium[0][1].score === podium[2]?.[1]?.score;
    sameScore1And3 = podium[1][1].score === podium[2]?.[1]?.score;
  }

  const actualHeight = getPodiumStats(sameScore1And2, sameScore1And3, sameScore2And3, defaultHeights);
  const actualColors = getPodiumStats(sameScore1And2, sameScore1And3, sameScore2And3, defaultColors);

  return (
    <>
      <Alert text='Sei già in questa lobby' show={showAlert} onHide={() => setShowAlert(false)} />
      <div id="gameOverMessage" className="paginator">
        <h2 className="">Classifica</h2>

        <div
          className="podium"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '10px',
            width: '100%',
          }}
        >
          {podium.map(([player, { score, image }], index) => {
            const heightStyle = actualHeight[index];
            const backgroundColor = actualColors[index];

            return (
              <div
                key={player}
                className={`podium-position position-${index + 1}`}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: '1 1 0%',
                  margin: '0 10px',
                  opacity: 0, // Inizialmente invisibile, gestito dall'animazione
                  height: 0, // Altezza iniziale, crescerà con l'animazione
                }}
              >
                <img
                  src={image}
                  alt={`${player} avatar`}
                  style={{ height: '70px' }}
                />
                <div
                  style={{
                    height: heightStyle,
                    backgroundColor,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    borderRadius: '10px',
                  }}
                >
                  <p style={{ margin: '0' }}>{score}</p>
                </div>
                <p style={{ textAlign: 'center' }}>{player}</p>
              </div>
            );
          })}
        </div>

        <div className="elegant-background mt-3 scrollable fill">
          <table className="my-table">
            <tbody>
              {otherPlayers.map(([player, { score, image }]) => (
                <tr key={player}>
                  <td>
                    <img
                      src={image}
                      alt={`${player} avatar`}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10%',
                      }}
                    />
                  </td>
                  <td>{player}</td>
                  <td>{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>


        <button
          className="my-btn mt-3 my-bg-puss"
          onClick={() => navigate('/')}
        >
          Torna alla homepage
        </button>
        <button
          className='my-btn mt-3 my-bg-puss'
          onClick={TODOREMATCH}
        >
          Gioca ancora
        </button>
      </div>
    </>
  );

};

export default FinalResults;
