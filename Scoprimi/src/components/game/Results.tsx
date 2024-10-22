import React from 'react';
import { todoShitFunction } from './Game';

interface ResultsProps {
  curPlayer: string | null;
  voteRecap: { [key: string]: string };
  playerImages: { [key: string]: string };
  mostVotedPerson: string;
  isPhoto: boolean;
}

const Results: React.FC<ResultsProps> = ({ curPlayer, voteRecap, playerImages, mostVotedPerson, isPhoto }) => (
  <div id="resultsContainer" className="text-center">
    <div id="resultMessageContainer">
      {
        Object.entries(voteRecap).map(([voter, vote]) => (
          <div
            key={voter}
            className={`voteEntry ${curPlayer === voter ? 'font-semi-bold font-white' : ''}`}
          >
            <div className="voteEntryContent">
              <img
                src={playerImages[voter]}
                alt={voter}
                className="voteEntryImage"
              />
              <p className={`voteEntryText ${curPlayer !== voter ? 'text-gray' : ''}`}>
                {voter} {vote ? 'ha votato' : 'non ha votato'}{' '}
                {vote && (
                  <div className='player-status-vote'>
                    <span
                      className={`status-pill-vote ${mostVotedPerson === vote ? 'my-bg-success' : 'my-bg-error'}`}
                    >
                      {isPhoto ? todoShitFunction(vote) : vote}
                    </span>
                  </div>
                )}
              </p>
            </div>
          </div>
        ))
      }
    </div>
  </div>
);

export default Results;
