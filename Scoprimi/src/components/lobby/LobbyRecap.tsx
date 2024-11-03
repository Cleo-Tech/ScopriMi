import React from 'react';
import { Game } from '../../../../Server/src/data/Game.ts';

interface LobbyRecapProps {
  lobby: Game;
  onModify: () => void;
}

const LobbyRecap: React.FC<LobbyRecapProps> = ({ lobby, onModify }) => {
  const gearIconStyle: React.CSSProperties = {
    fontSize: '24px', // Dimensione dell'icona
    color: '#fff', // Colore dell'icona
    padding: '10px', // Padding per aumentare l'area cliccabile
    border: '2px solid #444', // Bordo scuro
    borderRadius: '16px', // Rende il bordo arrotondato
    backgroundColor: '#333', // Sfondo scuro per evidenziare
    cursor: 'pointer', // Cambia il cursore quando si passa sopra l'icona
    transition: 'background-color 0.3s', // Transizione per l'effetto hover
  };

  return (
    <tr
      className={`lobby-row ${lobby.isGameStarted ? 'disabled' : ''}`}
    >
      <td>{Object.keys(lobby.players).length}</td>
      <td>{lobby.lobbyCode}</td>
      <td>
        <i
          className="my-i fa-solid fa-gear"
          style={gearIconStyle}
          onClick={onModify}
        ></i>
      </td>
    </tr>
  );
};

export default LobbyRecap;
