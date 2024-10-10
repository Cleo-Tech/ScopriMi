import React, { useState, useEffect } from 'react';

interface ImageListProps {
  images: string[];
  onVote: (player: string) => void;
  disabled: boolean;
  resetSelection: boolean;
}

const ImageList: React.FC<ImageListProps> = ({ images, onVote, disabled, resetSelection }) => {
  const [clicked, setClicked] = useState(false);
  const [selectedImage, setSelectedImage] = useState(String);

  useEffect(() => {
    if (resetSelection) {
      setClicked(false);
    }
  }, [resetSelection]);

  const handlePlayerClick = (imageUrl: string) => {
    if (!disabled && !clicked) {
      onVote(imageUrl);
      setClicked(true);
      setSelectedImage(imageUrl);
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
          style={{
            cursor: clicked || disabled ? 'not-allowed' : 'pointer',
            opacity: clicked && selectedImage != imageUrl ? 0.5 : 1,
            filter: clicked && selectedImage != imageUrl ? 'grayscale(100%)' : 'none' // Applica il bianco e nero se l'immagine è stata cliccata
          }}
        />
      ))}
    </div>
  );
};

export default ImageList;
