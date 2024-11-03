import React, { useState, useEffect } from 'react';
import { socket } from '../../ts/socketInit';
import { SocketEvents } from '../../../../Server/src/MiddleWare/SocketEvents.js';
import { useSwipeable } from 'react-swipeable';
import Alert from '../common/Alert.js';
import { useSession } from '../../contexts/SessionContext';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  image: string;
}

const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose, playerName, image }) => {
  const [gameLenght, setGameLenght] = useState<string>('Corta');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<boolean[]>([]);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const { currentPlayer } = useSession();

  const categoryLabels: { [key: string]: string } = {
    adult: 'Domande +18',
    photo: 'Fotografie',
    generic: 'Domande Standard',
    who: 'Domande testuali',
  };

  const increment = () => {
    switch (gameLenght) {
      case 'Corta':
        setGameLenght('Media');
        break;
      case 'Media':
        setGameLenght('Lunga');
    }
  };

  const decrement = () => {
    switch (gameLenght) {
      case 'Media':
        setGameLenght('Corta');
        break;
      case 'Lunga':
        setGameLenght('Media');
    }
  };

  /* Per ora inutile
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
  }; */

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
    const selected = categories.filter((_, index) => selectedCategories[index]);
    if (selected.length === 0) {
      setShowAlert(true);
      return;
    }

    let numberOfQuestion: number;
    switch (gameLenght) {
      case 'Corta':
      default:
        numberOfQuestion = 10;
        break;
      case 'Media':
        numberOfQuestion = 20;
        break;
      case 'Lunga':
        numberOfQuestion = 30;
    }

    socket.emit(SocketEvents.CREATE_LOBBY, { code, numQuestionsParam: numberOfQuestion, categories: selected, admin: currentPlayer });
    onClose();
  };

  useEffect(() => {
    socket.on(SocketEvents.RETURN_NEWGAME, (data: { lobbyCode: string }) => {
      const datatoSend = {
        lobbyCode: data.lobbyCode,
        playerName: playerName,
        image: image,
      };
      socket.emit(SocketEvents.REQUEST_TO_JOIN_LOBBY, datatoSend);
    });

    return () => {
      socket.off(SocketEvents.RETURN_NEWGAME);
    };
  }, [image, playerName]);

  useEffect(() => {
    if (isOpen) {
      socket.emit(SocketEvents.REQUEST_CATEGORIES);

      socket.on(SocketEvents.SEND_GENRES, (data: { genres: string[] }) => {
        setCategories(data.genres);
        setSelectedCategories(new Array(data.genres.length).fill(false));
      });
    }

    return () => {
      socket.off(SocketEvents.SEND_GENRES);
    };
  }, [isOpen, playerName]);

  const swipeHandlers = useSwipeable({
    onSwipedDown: () => onClose(),
    delta: 5,
    trackMouse: true,
  });

  const handleSwitchChange = (index: number) => {
    setSelectedCategories(prev => {
      const newSelected = [...prev];
      newSelected[index] = !newSelected[index];
      return newSelected;
    });
  };

  return (
    <>
      <Alert text='Scegli una categoria!' show={showAlert} onHide={() => setShowAlert(false)} />
      <div {...swipeHandlers} className={`bottom-modal ${isOpen ? 'open' : ''}`}>
        <button className="btn-bottom-modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        <div className="paginator">
          <div className="elegant-background">
            <p>Lunghezza della partita:</p>
            <div className="counter mb-4">
              <button className="btn-change-value my-bg-quartary" onClick={decrement}>&lt;</button>
              <input
                className="my-input stretch text-center input-question"
                value={gameLenght}
                //onChange={(e) => handleInputChange(e.target.value)}
                min="5"
                max="50"
                disabled
              />
              <button className="btn-change-value my-bg-quartary" onClick={increment}>&gt;</button>
            </div>
            {/* <p>Categoria domande:</p> */}
            {/* Render dinamico delle categorie con mappatura */}
            <div className='mt-5'></div>
            {categories.map((category, index) => (
              <div className="switch-container" key={index}>
                <span className="switch-label">{categoryLabels[category] || category}</span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={selectedCategories[index]}
                    onChange={() => handleSwitchChange(index)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            ))}
            <div className='counter pt-3'>
              <button onClick={handleCreateGame} style={{ paddingRight: '15vw', paddingLeft: '15vw' }} className="my-btn my-bg-quartary">Crea</button>
            </div>
          </div>
        </div>
      </div >
    </>
  );
};

export default NewGameModal;
