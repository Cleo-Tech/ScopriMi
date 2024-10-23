import React, { useState } from 'react';

interface PlayerProps {
  name: string;
  image?: string;
  isReadyToGame: boolean;
  admin: string;
  currentPlayer: string;
  onRemove: (playerName: string) => void;
}

const LobbyPlayer: React.FC<PlayerProps> = ({ name, image, isReadyToGame, admin, currentPlayer, onRemove }) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number | null>(null);
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setCurrentX(e.touches[0].clientX);
    // Durante il drag spengo la transition
    setTransitionEnabled(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX !== null) {
      setCurrentX(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    if (startX !== null && currentX !== null) {
      const deltaX = currentX - startX;
      // Mostra il pulsante di eliminazione solo se l'admin è il currentPlayer e il giocatore non è se stesso
      if (deltaX < -50 && admin === currentPlayer && name !== currentPlayer) {
        setShowDeleteBtn(true);
      } else if (deltaX > 50) {
        setShowDeleteBtn(false);
      }
    }
    // finito il drag la abilito
    setTransitionEnabled(true);
    setStartX(null);
    setCurrentX(null);
  };

  const handleDelete = () => {
    onRemove(name);
  };

  const translateX = currentX && startX ? Math.min(0, currentX - startX) : 0;

  return (
    <div
      className={'player-item swipeable'}
      key={name}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${translateX}px)`,
        transition: transitionEnabled ? 'transform 0.3s ease' : 'none', // Applica la transition al rilascio, non durante il drag
      }}
    >
      <div className="player-image">
        <img
          src={image || 'default-image-url'}
          alt={name}
          className="player-img"
        />
      </div>
      <div className="player-name">
        {admin === name ? name + ' 🔑' : name}
      </div>
      <div className="player-status">
        {!showDeleteBtn && (
          <span className={`status-pill ${isReadyToGame ? 'my-bg-success' : 'my-bg-error'}`}>
            {isReadyToGame ? 'Pronto' : 'Non pronto'}
          </span>
        )}
      </div>
      {showDeleteBtn && (
        <div className="action-button delete" onClick={handleDelete}>
          <span className="text"><i className="fa-solid fa-trash"></i></span>
        </div>
      )}
    </div>
  );
};

export default LobbyPlayer;
