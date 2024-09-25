import { useSession } from '../../contexts/SessionContext';
import { useNavigate } from 'react-router-dom';

const images = [
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_1.png',
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_2.png',
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_3.png',
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_4.png',
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_5.png',
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_10.png',
  'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_7.png',
  'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_17.png',
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_6.png',
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_7.png',
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_8.png',
  'https://raw.githubusercontent.com/simomux/party-game-images/04d617ebf044d3b73978b3c45430d3d74c0e262c/images/profile_icon_9.png',
];

interface LoginProps {
  onButtonClick?: () => void; // Optional prop for a custom button click handler
}

const Login: React.FC<LoginProps> = ({ onButtonClick }) => {
  const { currentPlayer, setCurrentPlayer, currentPlayerImage, setCurrentPlayerImage } = useSession();
  const navigator = useNavigate();

  const handleImageSelect = (image: string) => {
    setCurrentPlayerImage(image);
  };

  const toHomePage = () => {
    navigator('/');
  };

  const handleClick = () => {
    if (onButtonClick) {
      onButtonClick(); // Call the custom function if provided
    } else {
      toHomePage(); // Otherwise, call the default function
    }
  };

  return (
    <div className="paginator">
      <h2>ScopriMi</h2>
      {/* Primo blocco */}
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
      {/* Secondo blocco */}
      <div className="elegant-background mt-3 fill">
        <div className="image-row">
          {images.map((image, index) => (
            <div key={index} className="image-column">
              <img
                src={image}
                alt={`Profile ${index + 1}`}
                className={`image-thumbnail ${currentPlayerImage === image ? 'selected' : ''}`}
                onClick={() => handleImageSelect(image)} />
            </div>
          ))}
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
