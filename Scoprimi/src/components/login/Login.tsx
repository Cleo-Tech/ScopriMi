import React, { useEffect, useState } from 'react';
import { useSession } from '../../contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

// Funzione per ottenere gli URL delle immagini
async function fetchImageUrls(apiUrl: string) {

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`Errore nella richiesta: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    // Restituire direttamente gli URL di download contenuti in "download_url"
    return data.map((file: { download_url: string }) => file.download_url);
  } catch (error) {
    console.error('Errore nel fetch degli URL delle immagini:', error);
    return [];
  }
}


interface LoginProps {
  onButtonClick?: () => void;
}

const Login: React.FC<LoginProps> = ({ onButtonClick }) => {
  const { currentPlayer, setCurrentPlayer, currentPlayerImage, setCurrentPlayerImage } = useSession();
  const [images, setImages] = useState<string[]>([]);
  const navigator = useNavigate();

  useEffect(() => {
    // Caricare le immagini al montaggio del componente
    const loadImages = async () => {
      const imageUrls = await fetchImageUrls('https://api.github.com/repos/Cleo-Tech/ScoprimiImages/contents/profilePic');
      setImages(imageUrls);
    };
    loadImages();
  }, []);

  const handleImageSelect = (image: string) => {
    setCurrentPlayerImage(image);
  };

  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick();
    } else {
      navigator('/');
    }
  };

  return (
    <div className="paginator">
      <h2>ScopriMi</h2>
      <div className="elegant-background mt-3 form-floating">
        <div className='flex justify-content-end'>
          <i className="icon-input fa-solid fa-user"></i>
        </div>
        <input
          name="new-username"
          maxLength={8}
          type="text"
          value={currentPlayer || ''}
          onChange={(e) => setCurrentPlayer(e.target.value)}
          className="my-input fill-input my-bg-secondary"
          placeholder="Username..."
          id="floatingInput"
          autoComplete="off"
          required
        />
        <label className='my-label'>Username</label>
      </div>
      <div className="elegant-background mt-3 fill">
        <div className="image-row">
          {(
            images.map((image, index) => (
              <div key={index} className="image-column">
                <img
                  src={image}
                  alt={`Profile ${index + 1}`}
                  className={`image-thumbnail ${currentPlayerImage === image ? 'selected' : ''}`}
                  onClick={() => handleImageSelect(image)} />
              </div>
            ))
          )}
        </div>
      </div>
      <button
        className={`my-btn mt-3 ${!currentPlayer || !currentPlayerImage ? 'my-bg-disabled' : 'my-bg-tertiary'}`}
        onClick={handleClick}
        disabled={!currentPlayer || !currentPlayerImage}
      >
        Crea utente
      </button>
    </div>
  );
};

export default Login;
