import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';

interface PlayerProps {
  name: string;
  image?: string;
  isReadyToGame: boolean;
  admin: string;
  currentPlayer: string;
  onRemove: (playerName: string) => void;
}

const Player: React.FC<PlayerProps> = ({ name, image, isReadyToGame, admin, currentPlayer, onRemove }) => {
  // Usa lo state per showDeleteBtn all'interno del componente
  const [showDeleteBtn, setShowDeleteBtn] = useState(false);

  const swipeHandler = useSwipeable({
    onSwipedLeft: () => {
      console.log('Swipe left for player: ', name);
      setShowDeleteBtn(true);
    },
    onSwipedRight: () => {
      console.log('Swipe right for player: ', name);
      setShowDeleteBtn(false);
    },
    delta: 5,
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  return (
    <div {...(admin === currentPlayer) ? swipeHandler : {}} className="player-item" key={name}>
      <div className="player-image">
        <img
          src={image || 'default-image-url'}
          alt={name}
          className="player-img"
        />
      </div>
      <div className="player-name">
        {admin === name ? name + ' 🔑' : name} {/* Chiave per l'admin */}
      </div>
      <div className="player-status">
        <span className={`status-pill ${isReadyToGame ? 'my-bg-success' : 'my-bg-error'}`}>
          {isReadyToGame ? 'Pronto' : 'Non pronto'}
        </span>
        {showDeleteBtn && currentPlayer !== name && (
          <button
            className="my-btn my-bg-error"
            onClick={() => onRemove(name)}
            style={{ marginLeft: '10px' }}
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

export default Player;
