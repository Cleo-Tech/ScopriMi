import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as c from '../../../../Server/src/socketConsts.js';
import { socket } from '../../ts/socketInit.ts';
import { useSession } from '../../contexts/SessionContext.tsx';
import LobbyList from '../common/LobbyList.tsx';
import { Game } from '../../../../Server/src/data/Game.ts';
import Modal from '../common/Modal.tsx';
import Alert from '../common/Alert.tsx';
import LobbyPlayer from './LobbyPlayer.tsx'; // Import del nuovo componente Player

const Lobby: React.FC = () => {

  const [game, setGame] = useState<Game | undefined>(undefined);
  const { currentLobby, currentPlayer, setCurrentLobby, currentPlayerImage } = useSession();
  const [isReady, setIsReady] = useState<boolean>(false);
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [log, setlog] = useState<string>('');
  const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
  const [loading, setLoading] = useState(false); // stato per gestire il caricamento

  // ATTENZIONE
  // Non modificare chiedere a PESTO se proprio
  useEffect(() => {
    const handleVisibilityChange = () => {
      setlog(log + '------------------\n');
      setlog(log + `DOCUMENT.hidden: ${document.hidden}\n`);
      setIsPageVisible(!document.hidden);
      if (!document.hidden) {
        setIsPageVisible(!document.hidden);
        const data = {
          lobbyCode: currentLobby,
          playerName: currentPlayer,
          image: currentPlayerImage,
        };
        setlog(log + Object.values(data) + '\n');


        setLoading(true); // mostra la rotella di caricamento
        const timer = setTimeout(() => {
          socket.emit(c.REQUEST_TO_JOIN_LOBBY, data);
          setlog(log + 'sto per lanciare evento\n');
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
      // document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentLobby, currentPlayer, currentPlayerImage, isPageVisible, log]);

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

      if (data.players[currentPlayer] === undefined || data.players[currentPlayer] === null) {
        console.log('Devo uscire dalla lobby');
        navigate('/');
        return;
      }

      setIsReady(data.players[currentPlayer].isReadyToGame);
    });

    socket.on(c.INIZIA, () => {
      setGame((prevGame) => {
        if (!prevGame) { return undefined; }
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

  const toggleReady = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
    socket.emit(c.TOGGLE_IS_READY_TO_GAME, { lobbyCode: currentLobby, playerName: currentPlayer });
  };

  const handleRemovePlayer = (playerName: string) => {
    console.log('Admin is removing the player:', playerName);
    socket.emit(c.REMOVE_PLAYER, { playerName, currentLobby });
    console.log('Io sono il giocatore: ', currentPlayer);
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
        onClick={() => handleShareLobby(currentLobby)}
      >
        <i className="fa-solid fa-share-from-square"></i>
      </button>
      <div className="paginator">
        <h2>ScopriMi</h2>
        {/* Primo blocco */}
        <div className="elegant-background mt-3">
          <LobbyList lobbies={[game]} onJoin={() => void 0} />
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
              currentPlayer={currentPlayer}
              onRemove={handleRemovePlayer}
            />
          ))}
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
        {/* Modal per confermare l'uscita dalla lobby */}
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
