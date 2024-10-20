import React, { useState, useEffect } from 'react';

interface QuestionListProps {
  questions: string[];
  onVote: (player: string) => void;
  disabled: boolean;
  resetSelection: boolean;
}

const QuestionList: React.FC<QuestionListProps> = ({ questions, onVote, disabled, resetSelection }) => {
  const [clicked, setClicked] = useState(false);
  const [selectedImage, setSelectedImage] = useState(String);

  useEffect(() => {
    if (resetSelection) {
      setClicked(false);
    }
  }, [resetSelection]);

  const handlePlayerClick = (question: string) => {
    if (!disabled && !clicked) {
      onVote(question);
      setClicked(true);
      setSelectedImage(question);
    }
  };

  return (
    <div className='elegant-background-images fill'>
      {questions.map((question, index) => (
        <img
          key={index}
          src={question}
          className='image-question'
          alt={`image-${index}`}
          onClick={() => handlePlayerClick(question)}
          style={{
            cursor: clicked || disabled ? 'not-allowed' : 'pointer',
            opacity: clicked && selectedImage !== question ? 0.5 : 1,
            filter: clicked && selectedImage !== question ? 'grayscale(100%)' : 'none', // Applica il bianco e nero se l'immagine è stata cliccata
          }}
        />
      ))}
    </div>
  );
};

export default QuestionList;
