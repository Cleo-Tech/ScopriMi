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
  modalPussy: ModalPussy;
}

export enum ModalPussy {
  // eslint-disable-next-line no-unused-vars
  new = 'Crea',
  // eslint-disable-next-line no-unused-vars
  modify = 'Modifica',
}

const NewGameModal: React.FC<NewGameModalProps> = ({ isOpen, onClose, playerName, image, modalPussy }) => {
  const [numQuestions, setNumQuestions] = useState(5);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<boolean[]>([]);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const { currentPlayer, currentLobby } = useSession();

  const categoryLabels: { [key: string]: string } = {
    adult: 'Domande +18',
    photo: 'Fotografie',
    generic: 'Domande Standard',
    who: 'Domande testuali',
  };

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
    const selected = categories.filter((_, index) => selectedCategories[index]);
    if (selected.length === 0) {
      setShowAlert(true);
      return;
    }
    if (modalPussy === ModalPussy.new) {
      const code = generateLobbyCode();
      socket.emit(SocketEvents.CREATE_LOBBY, { code, numQuestionsParam: numQuestions, categories: selected, admin: currentPlayer });
    } else if (modalPussy === ModalPussy.modify) {
      socket.emit(SocketEvents.MODIFY_GAME_CONFIG, { currentLobby, numQuestionsParam: numQuestions, categories: selected, admin: currentPlayer });
    }
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
                disabled
              />
              <button className="btn-change-value my-bg-quartary" onClick={increment}>+</button>
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
              <button onClick={handleCreateGame} style={{ paddingRight: '15vw', paddingLeft: '15vw' }} className="my-btn my-bg-quartary">modalPussy</button>
            </div>
          </div>
        </div>
      </div >
    </>
  );
};

export default NewGameModal;
