import React, { useEffect, useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { socket } from '../../ts/socketInit';
import * as c from '../../../../Server/src/MiddleWare/socketConsts.js';
import { Player } from '../../../../Server/src/data/Player.js';

interface PlayerInfo {
  player: Player;
  phrase: string;
}

interface EndGameWrapperProps {
  pages: PlayerInfo[];
}

const EndGameWrapper: React.FC<EndGameWrapperProps> = ({ pages }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const { currentPlayer, currentLobby } = useSession();


  // Effetto per inviare l'evento quando si passa all'ultima pagina
  useEffect(() => {
    if (currentPage === pages.length - 1) {
      const data = {
        lobbyCode: currentLobby,
        playerName: currentPlayer,
      };
      setTimeout(() => {
        socket.emit(c.READY_FOR_PODIUM, data);
      }, 3000); // Esegui dopo 3 secondi (3000 ms)
    }
  }, [currentLobby, currentPage, currentPlayer, pages.length]);

  async function handleSwipeLeft() {
    if (currentPage < pages.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
    }
  }

  const handleSwipeRight = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };


  const swipeAreaStyle: React.CSSProperties = {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  };

  const navigationStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '20px',
  };

  return (
    <div className='paginator'>
      <div
        style={swipeAreaStyle}
        onTouchStart={(e) => {
          const startX = e.touches[0].clientX;
          const handleTouchMove = (e: TouchEvent) => {
            const currentX = e.touches[0].clientX;
            if (startX - currentX > 50) {
              handleSwipeLeft();
              document.removeEventListener('touchmove', handleTouchMove);
            } else if (currentX - startX > 50) {
              handleSwipeRight();
              document.removeEventListener('touchmove', handleTouchMove);
            }
          };
          document.addEventListener('touchmove', handleTouchMove);
          document.addEventListener(
            'touchend',
            () => {
              document.removeEventListener('touchmove', handleTouchMove);
            },
            { once: true },
          );
        }}
      >
        <div>
          <h2 className='mt-5 mb-5'>{pages[currentPage].phrase}</h2>
          <h2 className='mt-5'>{pages[currentPage].player.name}</h2>
          <img style={{ height: '70vw' }} src={pages[currentPage].player.image} className='mt-5' />
        </div>
      </div>

      <div className={'lobby-button-group'} style={navigationStyle}>
        <button className='my-btn my-bg-elegant-backgorund'
          onClick={handleSwipeRight}
          disabled={currentPage === 0}
        >
          Indietro
        </button>
        <button className='my-btn my-bg-elegant-backgorund'
          onClick={handleSwipeLeft}
          disabled={currentPage === pages.length - 1}
        >
          Avanti
        </button>
      </div>
    </div>
  );
};

export default EndGameWrapper;
