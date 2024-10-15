import React, { useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { socket } from '../../ts/socketInit';
import * as c from '../../../../Server/src/MiddleWare/socketConsts.js';

// Todo decidi che cazzo vuoi mandare alla page
interface PlayerInfo {
  player: string;
  phrase: string;
}

interface EndGameWrapperProps {
  pages: PlayerInfo[];
}

const EndGameWrapper: React.FC<EndGameWrapperProps> = ({ pages }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const { currentPlayer, currentLobby } = useSession();

  async function handleSwipeLeft() {
    if (currentPage < pages.length - 1) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);

      // Invio dell'evento quando si passa all'ultima pagina
      if (nextPage === pages.length - 1) {
        const data = {
          lobbyCode: currentLobby,
          playerName: currentPlayer,
        };
        setTimeout(() => {
          socket.emit(c.READY_FOR_PODIUM, data);
        }, 3000); // Esegui dopo 3 secondi (3000 ms)
      }
    }
  }

  const handleSwipeRight = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // TODO chiedi a zelo
  return (
    <div className="paginator end-game-wrapper">
      <div
        className="swipe-area"
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
          document.addEventListener('touchend', () => {
            document.removeEventListener('touchmove', handleTouchMove);
          }, { once: true });
        }}
      >
        <div className="player-info">
          <h2>{pages[currentPage].player}</h2>
          <p>{pages[currentPage].phrase}</p>
        </div>
      </div>

      <div className="navigation">
        <button onClick={handleSwipeRight} disabled={currentPage === 0}>
          Indietro
        </button>
        <button onClick={handleSwipeLeft} disabled={currentPage === pages.length - 1}>
          Avanti
        </button>
      </div>
    </div>
  );
};

export default EndGameWrapper;
