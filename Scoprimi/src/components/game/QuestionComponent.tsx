import React from 'react';

interface QuestionProps {
  question: string;
  selectedPlayer: string;
}

const placeholderChar = '$';

const QuestionComponent: React.FC<QuestionProps> = ({ question, selectedPlayer }) => {
  // Sostituisce il placeholder con il nome del giocatore e `\n` con `<br />`
  const formattedQuestion = question
    .replace(placeholderChar, selectedPlayer)
    .replace(/\n/g, '<br />');

  return (
    <div id="questionContainer">
      <h4
        id="question"
        dangerouslySetInnerHTML={{ __html: formattedQuestion }}
      />
    </div>
  );
};

export default QuestionComponent;
