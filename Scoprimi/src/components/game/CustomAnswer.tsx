import React, { useState, useEffect } from 'react';

interface CustomAnswerProps {
  handleSubmit: (arg0: string) => void;
}

const CustomAnswer: React.FC<CustomAnswerProps> = ({ handleSubmit }) => {
  const [answer, setAnswer] = useState(String);
  const [btnClicked, setBtnClicked] = useState(false);


  const handleClick = () => {
    console.log('Hai cliccato!');
    setBtnClicked(true);
  };

  return (
    <div className='elegant-background' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
      <label>La tua risposta:</label>
      <input
        className="my-input"
        type="text"
        onChange={(e) => setAnswer(e.target.value)}
        style={{
          color: 'var(--background-color)',
        }}
      />
      <button
        className="my-btn"
        onClick={() => {
          handleSubmit(answer);
          handleClick();
        }}
        style={{
          backgroundColor: btnClicked ? 'var(--disabled-color)' : 'var(--success-color)',
        }}
        disabled={btnClicked ? true : false}   // Gestisce il problema del voto multiplo, ma resta da fixare nel backend!!
      >
        Conferma
      </button>
    </div>
  );
};

export default CustomAnswer;
