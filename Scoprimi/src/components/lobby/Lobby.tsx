import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketEvents } from '../../../../Server/src/MiddleWare/SocketEvents.js';
import { socket } from '../../ts/socketInit.ts';
import { useSession } from '../../contexts/SessionContext.tsx';
import { Game } from '../../../../Server/src/data/Game.ts';
import Modal from '../common/Modal.tsx';
import Alert from '../common/Alert.tsx';
import LobbyPlayer from './LobbyPlayer.tsx';
import LobbyRecap from './LobbyRecap.tsx';
import BottomGameModal, { ModalUse } from '../newGame/NewGameModal.tsx';

const Lobby: React.FC = () => {

  const [game, setGame] = useState<Game | null>(null);
  const { currentLobby, currentPlayer, setCurrentLobby, currentPlayerImage } = useSession();
  const [isReady, setIsReady] = useState<boolean>(false);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {

        const data = {
          lobbyCode: currentLobby,
          playerName: currentPlayer,
          image: currentPlayerImage,
        };


        setLoading(true); // mostra la rotella di caricamento
        const timer = setTimeout(() => {
          socket.emit(SocketEvents.REQUEST_TO_JOIN_LOBBY, data);
          setLoading(false);
        }, 5000);

        // Pulizia del timer se la pagina diventa non visibile prima del timeout
        return () => clearTimeout(timer);
      }
    };

    // Ascolta i cambiamenti di visibilità
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Pulizia dell'event listener al momento dello smontaggio
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentLobby, currentPlayer, currentPlayerImage]);


  useEffect(() => {
    document.title = `Lobby - ${currentLobby}`;
    socket.emit(SocketEvents.REQUEST_RENDER_LOBBY, currentLobby, (data: Game) => {
      setGame(data);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setIsReady(data.players[currentPlayer!].isReadyToGame);
    });

    socket.on(SocketEvents.RENDER_LOBBY, (data: Game) => {
      console.log(data);
      setGame(data);

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      if (data.players[currentPlayer!] === null || data.players[currentPlayer!] === undefined) {
        console.log('Devo uscire dalla lobby');
        navigate('/');
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      setIsReady(data.players[currentPlayer!].isReadyToGame);
    });

    socket.on(SocketEvents.INIZIA, () => {
      setGame((prevGame) => {
        if (!prevGame) { return null; }
        return Object.assign(Object.create(Object.getPrototypeOf(prevGame)), prevGame, {
          isGameStarted: true,
        });
      });
      navigate('/game');
    });

    return () => {
      socket.off(SocketEvents.INIZIA);
      socket.off(SocketEvents.RENDER_LOBBY);
    };
  }, [currentLobby, navigate, currentPlayer]);

  const handleConfirmLeave = () => {
    socket.emit(SocketEvents.EXIT_LOBBY, { currentPlayer, currentLobby });
    setCurrentLobby(null);
    navigate('/');
  };

  const toggleReady = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    socket.emit(SocketEvents.TOGGLE_IS_READY_TO_GAME, { lobbyCode: currentLobby, playerName: currentPlayer });
  };

  const handleRemovePlayer = (playerName: string) => {
    console.log('Admin is removing the player:', playerName);
    socket.emit(SocketEvents.REMOVE_PLAYER, { playerName, currentLobby });
  };

  const handleCancelLeave = () => {
    setShowModal(false);
  };

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

  if (!game) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* {(log && <p style={{ whiteSpace: 'pre-wrap' }}>{log}</p>)} */}
      {loading && (
        <div className="loader"></div>
      )}
      <Alert text='Link copiato negli appunti' show={showAlert} onHide={() => setShowAlert(false)} />
      <button
        className='my-btn-login elegant-background'
        style={{ width: '55px', height: '55px', padding: '0' }}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        onClick={() => handleShareLobby(currentLobby!)}
      >
        <i className="fa-solid fa-share-from-square"></i>
      </button>
      <div className="paginator">
        <h2>ScopriMi</h2>
        {/* Primo blocco */}
        <div className="elegant-background mt-3">
          {/* <LobbyList lobbies={[game]} onJoin={() => void 0} /> */}
          <LobbyRecap isAdmin={game.admin === currentPlayer ? true : false} lobby={game} onModify={() => setIsModalOpen(true)} />
        </div>
        {/* Secondo blocco */}
        <div className="elegant-background mt-3 scrollable fill">
          {Object.values(game.players).map((player) => (
            <LobbyPlayer
              key={player.name}
              name={player.name}
              image={player.image}
              isReadyToGame={player.isReadyToGame}
              admin={game.admin}
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              currentPlayer={currentPlayer!}
              onRemove={handleRemovePlayer}
            />
          ))}
        </div>

        <div className='lobby-button-group mt-3'>
          <button
            onClick={() => setShowModal(true)}
            className="my-btn my-bg-elegant-backgorund"
            disabled={loading}
          >
            Indietro
          </button>
          <button
            id="toggleisReadyToGame"
            className={`my-btn ${isReady ? 'my-bg-error' : 'my-bg-success'}`}
            onClick={() => toggleReady()}
            disabled={loading}
          >
            {isReady ? 'Non pronto' : 'Pronto'}
          </button>
        </div>
        {/* Modal per confermare l'uscita dalla lobby */}
        <Modal
          show={showModal}
          onConfirm={handleConfirmLeave}
          onCancel={handleCancelLeave}
        />
        <BottomGameModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          playerName={currentPlayer!}
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          image={currentPlayerImage!}
          modalUse={ModalUse.modify}
        // TODO allinea anche il colore tramite prop
        />
      </div>
    </>
  );
};

export default Lobby;
