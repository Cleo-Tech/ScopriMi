import React, { useState } from 'react';

interface CustomAnswerProps {
  handleSubmit: (arg0: string) => void;
}

const CustomAnswer: React.FC<CustomAnswerProps> = ({ handleSubmit }) => {
  const [answer, setAnswer] = useState<string>('');
  const [btnClicked, setBtnClicked] = useState(false);

  const handleClick = () => {
    setBtnClicked(true);
  };

  return (
    <div className='fill'>
      <div className='elegant-background' style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '15vh' }}>
        <label>La tua risposta:</label>
        <input
          className="my-input"
          type="text"
          maxLength={100}
          onChange={(e) => setAnswer(e.target.value)}
          style={{
            color: 'var(--background-color)',
            width: '90%',
          }}
        />
        <button
          className="my-btn mt-3"
          onClick={() => {
            handleSubmit(answer);
            handleClick();
          }}
          style={{
            backgroundColor: btnClicked || answer === '' ? 'var(--disabled-color)' : 'var(--success-color)',
          }}
          disabled={btnClicked || answer === ''} // Disabilita se il bottone è già stato cliccato o l'input è vuoto
        >
          Conferma
        </button>

      </div>
    </div >
  );
};

export default CustomAnswer;
