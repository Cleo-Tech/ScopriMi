import React, { useState, useEffect } from 'react';

interface PlayerListProps {
  players: string[]
  images: { [key: string]: string };
  onVote: (player: string) => void;
  disabled: boolean;
  resetSelection: boolean;
  playersWhoVoted: string[];
}

const PlayerList: React.FC<PlayerListProps> = ({ players, images, onVote, disabled, resetSelection, playersWhoVoted }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  useEffect(() => {
    if (resetSelection) {
      setSelectedPlayer(null); // Resetta la selezione quando `resetSelection` è vero
    }
  }, [resetSelection]);

  const handlePlayerClick = (player: string) => {
    if (!disabled) {
      setSelectedPlayer(player);
      onVote(player);
    }
  };

  return (
    <div id="playersContainer" className="image-row">
      {players.map(player => (
        <div
          key={player}
          className="player-image-card"
        >
          <div
            className="image-column"
            onClick={() => handlePlayerClick(player)}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer', position: 'relative' }}
          >
            <img
              src={images[player]}
              className="image-thumbnail"
              alt={`Image of ${player}`}
              style={{
                filter: disabled && selectedPlayer !== player ? 'grayscale(100%)' : 'none', // Colore normale per il giocatore selezionato
              }}
            />
            <i
              className="check-mark fa-solid fa-check"
              style={{
                display: disabled && playersWhoVoted.includes(player) ? 'block' : 'none', // Mostra la spunta verde per i giocatori che hanno votato
              }}
            ></i>
          </div>
          <p>{player}</p>
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
