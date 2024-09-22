import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as c from '../../../../Server/src/socketConsts.js';
import { socket } from '../../ts/socketInit.ts';
import { useSession } from '../../contexts/SessionContext.tsx';
import LobbyList from '../common/LobbyList.tsx';
import { Game } from '../../../../Server/src/data/Game.ts';
import Modal from '../common/Modal.tsx';
import Alert from '../common/Alert.tsx';

function handleToggleisReadyToGame(data: { lobbyCode: string, playerName: string }) {
  console.log('handleLobbycode ', data.lobbyCode);
  socket.emit(c.TOGGLE_IS_READY_TO_GAME, data);
}

const Lobby: React.FC = () => {

  const [game, setGame] = useState<Game | undefined>(undefined);
  const { currentLobby, currentPlayer, setCurrentLobby, currentPlayerImage } = useSession();
  const [isReady, setIsReady] = useState<boolean>(false);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('VISIBILE');
        const data = {
          lobbyCode: currentLobby,
          playerName: currentPlayer,
          image: currentPlayerImage,
        };
        // Viene gestito dal server se gia presente.
        socket.emit(c.REQUEST_TO_JOIN_LOBBY, data);
      } else {
        console.log('Pagina non è più visibile');
      }
    };

    // Ascolta i cambiamenti di visibilità
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Pulizia dell'event listener al momento dello smontaggio
    return () => {
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentLobby, currentPlayer, currentPlayerImage]);

  useEffect(() => {
    document.title = `Lobby - ${currentLobby}`;
    socket.emit(c.REQUEST_RENDER_LOBBY, currentLobby, (data: Game) => {
      console.log('Received data:', data);
      setGame(data);
      setIsReady(data.players[currentPlayer].isReadyToGame);
    });

    socket.on(c.RENDER_LOBBY, (data: Game) => {
      console.log(data);
      setGame(data);
      setIsReady(data.players[currentPlayer].isReadyToGame);
    });
    socket.on(c.INIZIA, () => {
      setGame((prevGame) => {
        if (!prevGame) { return undefined; } // Check if prevGame is undefined

        // Return the full previous game state with the updated property
        return Object.assign(Object.create(Object.getPrototypeOf(prevGame)), prevGame, {
          isGameStarted: true,
        });
      });
      navigate('/game');
    });


    return () => {
      socket.off(c.INIZIA);
    };
  }, [currentLobby, navigate, currentPlayer]);

  const handleConfirmLeave = () => {
    socket.emit(c.EXIT_LOBBY, { currentPlayer, currentLobby });
    setCurrentLobby(undefined);
    navigate('/');
  };

  const handleCancelLeave = () => {
    setShowModal(false);
  };

  const toggleReady = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    handleToggleisReadyToGame({ lobbyCode: currentLobby, playerName: currentPlayer });
  };

  // TODO load page
  if (!game) {
    return <div>Loading...</div>;
  }

  async function handleShareLobby(lobbyCode: string) {
    const shareableLink = `${window.location.origin}/join/${lobbyCode}`;
    const shareData = {
      title: 'Join my lobby!',
      text: 'Click the link to join my lobby!\n',
      url: shareableLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareableLink);
        setShowAlert(true);
        console.log('Link copied to clipboard:', shareableLink);
      } catch (error) {
        console.error('Unable to copy to clipboard:', error);
      }
    }
  }

  return (
    <>
      <Alert text='Link copiato negli appunti' show={showAlert} onHide={() => setShowAlert(false)} />
      <button
        className='my-btn-login elegant-background'
        onClick={() => handleShareLobby(currentLobby)}
      >
        <i className="fa-solid fa-arrow-up-from-bracket"></i>
      </button>
      <div className="paginator">
        <h2>ScopriMi</h2>
        {/* Primo blocco */}
        <div className="elegant-background mt-3">
          <LobbyList lobbies={[game]} onJoin={() => void 0} />
        </div>
        {/* Secondo blocco */}
        <div className="elegant-background mt-3 scrollable fill">
          <div className="players-list">
            {Object.values(game.players).map((player) => (
              <div className="player-item" key={player.name}>
                <div className="player-image">
                  <img
                    // src={game.images[player] || 'default-image-url'}
                    src={player.image || 'default-image-url'}
                    alt={player.name}
                    className="player-img"
                  />
                </div>
                <div className="player-name">{player.name}</div>
                <div className="player-status">
                  <span className={`status-pill ${player.isReadyToGame ? 'my-bg-success' : 'my-bg-error'}`}>
                    {player.isReadyToGame ? 'Pronto' : 'Non pronto'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='lobby-button-group mt-3'>
          <button
            onClick={() => setShowModal(true)}
            className="my-btn my-bg-elegant-backgorund">
            Indietro
          </button>
          <button
            id="toggleisReadyToGame"
            className={`my-btn ${isReady ? 'my-bg-error' : 'my-bg-success'}`}
            onClick={() => toggleReady()}>
            {isReady ? 'Non pronto' : 'Pronto'}
          </button>
        </div>
        {/* // Modal for confirm exit lobby */}
        <Modal
          show={showModal}
          onConfirm={handleConfirmLeave}
          onCancel={handleCancelLeave}
        />
      </div>
    </>
  );

};

export default Lobby;
