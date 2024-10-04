import React, { useState, useEffect } from 'react';
import { socket } from '../../ts/socketInit';
import * as c from '../../../../Server/src/MiddleWare/socketConsts.js';
import { useSwipeable } from 'react-swipeable';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  image: string;
}

const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose, playerName, image }) => {
  const [numQuestions, setNumQuestions] = useState(5);
  const [categories, setCategories] = useState<string[]>([]); // Stato per le categorie
  const [selectedCategories, setSelectedCategories] = useState<boolean[]>([]); // Stato per le categorie selezionate

  // Incrementa il numero di domande
  const increment = () => {
    if (numQuestions < 50) {
      setNumQuestions(numQuestions + 1);
    }
  };

  // Decrementa il numero di domande
  const decrement = () => {
    if (numQuestions > 5) {
      setNumQuestions(numQuestions - 1);
    }
  };

  // Gestore per l'input manuale del numero di domande
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

  // Genera un codice per la lobby
  function generateLobbyCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  }

  // Crea una nuova partita
  const handleCreateGame = () => {
    const code = generateLobbyCode();
    console.log('eccoic');

    // Filtra le categorie selezionate
    const selected = categories.filter((_, index) => selectedCategories[index]);

    // Emette l'evento per creare la lobby
    socket.emit(c.CREATE_LOBBY, { code, numQuestionsParam: numQuestions, categories: selected });

    onClose();
  };

  useEffect(() => {
    // Ascolta il ritorno della creazione della partita
    socket.on(c.RETURN_NEWGAME, (data: { lobbyCode: string }) => {
      const datatoSend = {
        lobbyCode: data.lobbyCode,
        playerName: playerName,
        image: image,
      };
      console.log(data);
      socket.emit(c.REQUEST_TO_JOIN_LOBBY, datatoSend);
    });

    return () => {
      socket.off(c.RETURN_NEWGAME);
    };
  }, [image, playerName]);

  // Effetto che invia un socket.emit quando la pagina si apre e riceve categorie
  useEffect(() => {
    if (isOpen) {
      console.log('Modal aperto per il giocatore:', playerName);
      socket.emit(c.REQUEST_CATEGORIES);

      socket.on(c.SEND_GENRES, (data: { genres: string[] }) => {
        console.log('Categorie ricevute: ', data.genres);
        setCategories(data.genres);
        setSelectedCategories(new Array(data.genres.length).fill(false)); // Inizializza gli switch come non selezionati
      });
    }

    // Cleanup listener quando il modal si chiude
    return () => {
      socket.off(c.SEND_GENRES);
    };
  }, [isOpen, playerName]);

  // Gestore dello swipe per chiudere la modal
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => onClose(), // Chiusura su swipe verso il basso
    delta: 5, // Minima distanza di swipe per attivare l'evento
    trackMouse: true, // Attiva anche per il mouse
  });

  // Gestore del cambio di stato dello switch
  const handleSwitchChange = (index: number) => {
    setSelectedCategories(prev => {
      const newSelected = [...prev];
      newSelected[index] = !newSelected[index];
      return newSelected;
    });
  };

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
              max="50"
              disabled // Disabilita l'input manuale
            />
            <button className="btn-change-value my-bg-quartary" onClick={increment}>+</button>
          </div>
          <p>Categoria domande:</p>
          {/* Render dinamico delle categorie */}
          {categories.map((category, index) => (
            <div className="switch-container" key={index}>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={selectedCategories[index]}
                  onChange={() => handleSwitchChange(index)} // Gestore del cambio
                />
                <span className="slider round"></span>
              </label>
              <span className="switch-label">{category}</span>
            </div>
          ))}
          <div className='counter pt-3'>
            <button onClick={handleCreateGame} className="my-btn my-bg-quartary">Crea</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewGameModal;
