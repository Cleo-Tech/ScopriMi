import React, { useState, useEffect } from 'react';

interface ImageListProps {
  images: string[];
  onVote: (player: string) => void;
  disabled: boolean;
  resetSelection: boolean;
}

const ImageList: React.FC<ImageListProps> = ({ images, onVote, disabled, resetSelection }) => {
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (resetSelection) {
      setClicked(false);
    }
  }, [resetSelection]);

  const handlePlayerClick = (imageUrl) => {
    if (!disabled) {
      onVote(imageUrl);
    }
  };

  return (
    <div className='elegant-background-images fill'>
      {images.map((imageUrl, index) => (
        <img
          key={index}
          src={imageUrl}
          className='image-question'
          alt={`image-${index}`}
          onClick={() => handlePlayerClick(imageUrl)}
          style={{ cursor: clicked || disabled ? 'not-allowed' : 'pointer', opacity: clicked || disabled ? 0.5 : 1 }}
        />
      ))}
    </div>
  );
};

export default ImageList;
