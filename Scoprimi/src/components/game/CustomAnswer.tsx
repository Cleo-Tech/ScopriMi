import React, { useState, useEffect } from 'react';
import * as c from '../../../../Server/src/MiddleWare/socketConsts.js';
import { socket } from '../../ts/socketInit';

interface CustomAnswerProps {
  handleSubmit: (arg0: string) => void;
}

const CustomAnswer: React.FC<CustomAnswerProps> = ({ handleSubmit }) => {
  const [answer, setAnswer] = useState(String);

  return (
    <div>
      <label>
        La tua risposta:
        <input className="" type="text" onChange={(e) => setAnswer(e.target.value)} />
      </label>
      <button className="btn-success" onClick={() => handleSubmit(answer)}>Conferma</button>
    </div>
  );
};

export default CustomAnswer;
