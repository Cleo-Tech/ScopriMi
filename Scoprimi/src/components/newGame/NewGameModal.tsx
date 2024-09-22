import React, { useState } from 'react';
import { socket } from '../../ts/socketInit';
import * as c from '../../../../Server/src/socketConsts.js';
import { useSwipeable } from 'react-swipeable';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  image: string;
}

const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose, playerName, image }) => {
  const [numQuestions, setNumQuestions] = useState(5);

  const increment = () => {
    if (numQuestions < 50) {
      setNumQuestions(numQuestions + 1);
    }
  };

  const decrement = () => {
    if (numQuestions > 5) {
      setNumQuestions(numQuestions - 1);
    }
  };

  const handleInputChange = (stringValue: string) => {
    let value = parseInt(stringValue);
    if (isNaN(value)) {
      value = 5;
    }

    if (value > 50) {
      value = 50;
    } else if (value < 5) {
      value = 5;
    }

    setNumQuestions(value);
  };

  function generateLobbyCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  const handleCreateGame = () => {
    const code = generateLobbyCode();
    socket.emit(c.CREATE_LOBBY, [code, numQuestions, playerName]);

    // Entrare nella lobby automaticamente
    socket.on(c.RETURN_NEWGAME, () => {
      const data = {
        lobbyCode: code,
        playerName: playerName,
        image: image,
      };
      console.log('Player creatore della lobby: ', data);
      socket.emit(c.REQUEST_TO_JOIN_LOBBY, data);
    });

    onClose();
  };

  // Gestore dello swipe
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => onClose(), // Chiusura su swipe verso il basso
    delta: 5, // Minima distanza di swipe per attivare l'evento
    trackMouse: true, // Facoltativo: attiva il test anche per il mouse
  });

  return (
    <div {...swipeHandlers} className={`bottom-modal ${isOpen ? 'open' : ''}`}>
      <button className="btn-bottom-modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
      <div className="paginator">
        <div className="elegant-background">
          <p>Numero di domande:</p>
          <div className="counter mb-4">
            <button className="btn-change-value my-bg-quartary" onClick={decrement}>-</button>
            <input
              type="number"
              className="my-input stretch text-center input-question"
              value={numQuestions}
              onChange={(e) => handleInputChange(e.target.value)}
              min="5"
              max="50" />
            <button className="btn-change-value my-bg-quartary" onClick={increment}>+</button>
          </div>
          <div className='counter pt-3'>
            <button onClick={handleCreateGame} className="my-btn my-bg-quartary">Crea</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewGameModal;
