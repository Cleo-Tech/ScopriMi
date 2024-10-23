import React, { useState, useEffect } from 'react';

interface QuestionListProps {
  questions: string[];
  onVote: (player: string) => void;
  disabled: boolean;
  resetSelection: boolean;
}

const QuestionList: React.FC<QuestionListProps> = ({ questions, onVote, disabled, resetSelection }) => {
  const [clicked, setClicked] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(String);

  useEffect(() => {
    if (resetSelection) {
      setClicked(false);
    }
  }, [resetSelection]);

  const handlePlayerClick = (question: string) => {
    if (!disabled && !clicked) {
      onVote(question);
      setClicked(true);
      setSelectedQuestion(question);
    }
  };

  return (
    <div className='fill sbu'>
      {questions.map((question, index) => (
        <div className='textualAnswer elegant-background' key={index}>
          <p
            onClick={() => handlePlayerClick(question)}
            style={{
              cursor: clicked || disabled ? 'not-allowed' : 'pointer',
              color: selectedQuestion === question ? 'green' : '',
            }}>
            {question}
          </p>
        </div>
      ))}
    </div>
  );
};

export default QuestionList;
