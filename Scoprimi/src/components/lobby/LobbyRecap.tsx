import React from 'react';
import { Game } from '../../../../Server/src/data/Game.ts';

interface LobbyRecapProps {
  isAdmin: boolean;
  lobby: Game;
  onModify: () => void;
}

const LobbyRecap: React.FC<LobbyRecapProps> = ({ isAdmin, lobby, onModify }) => {
  const gearIconStyle: React.CSSProperties = {
    fontSize: '1.5em',
    color: '#fff',
    padding: '0.625em',
    border: '0.125em solid #444',
    borderRadius: '0.7em',
    backgroundColor: '#333',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  };

  return (
    <tr
      className={`lobby-row ${lobby.isGameStarted ? 'disabled' : ''}`}
      style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '14vw',
        paddingLeft: '4vw',
      }}
    >
      <td>{Object.keys(lobby.players).length}</td>
      <td>{lobby.lobbyCode}</td>
      <td>
        {isAdmin ? (
          <i
            className="my-i fa-solid fa-gear"
            style={gearIconStyle}
            onClick={onModify}
          ></i>
        ) : (
          <i style={{ visibility: 'hidden' }}></i>
        )}
      </td>
    </tr>
  );
};

export default LobbyRecap;
