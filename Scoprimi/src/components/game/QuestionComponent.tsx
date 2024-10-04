import React from 'react';

interface QuestionProps {
  question: string;
  selectedPlayer: string;
}

const placeholderChar = '$';

const QuestionComponent: React.FC<QuestionProps> = ({ question, selectedPlayer }) => (
  <div id="questionContainer">
    <h4 id="question">{question.replace(placeholderChar, selectedPlayer)}</h4>
  </div>
);

export default QuestionComponent;
