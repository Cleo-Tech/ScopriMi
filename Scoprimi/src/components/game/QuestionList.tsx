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
    <div className='elegant-background-images fill'>
      {questions.map((question, index) => (
        <h4
          key={index}
          style={{
            cursor: clicked || disabled ? 'not-allowed' : 'pointer',
            color: selectedQuestion === question ? 'green' : 'red',
          }}>
          {question}
        </h4>

      ))}
    </div>
  );
};

export default QuestionList;
