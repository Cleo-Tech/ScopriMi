import React from 'react';
import { FinalResultData } from '../../ts/types';
import { useLocation, useNavigate } from 'react-router-dom';

const FinalResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { finalResults } = location.state as { finalResults: FinalResultData };

  // Ordinamento con tipizzazione
  const sortedResults = Object.entries(finalResults)
    .sort(([, a], [, b]) => b.score - a.score);

  if (!finalResults) {
    return <div className="text-center mt-5">Nessun risultato disponibile.</div>;
  }

  const podium = sortedResults.slice(0, 3);

  if (podium.length > 1) {
    [podium[0], podium[1]] = [podium[1], podium[0]];
  }

  const otherPlayers = sortedResults.slice(3);

  let sameScore1And2 = false;
  let sameScore2And3 = false;
  let sameScore1And3 = false;

  if (podium.length >= 2) {
    sameScore1And2 = podium[0][1].score === podium[1][1].score;
    sameScore2And3 = podium[1][1].score === podium[2]?.[1]?.score;
    sameScore1And3 = podium[0][1].score === podium[2]?.[1]?.score;
  }

  console.log('sameScore1And2:', sameScore1And2);
  console.log('sameScore2And3:', sameScore2And3);
  console.log('sameScore1And3:', sameScore1And3);

  const allScoresEqual = sameScore1And2 && sameScore2And3;

  return (
    <>
      <div id="gameOverMessage" className="paginator">
        <h2 className="">Classifica</h2>

        <div className='podium' style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', width: '100%' }}>
          {podium.map(([player, { score, image }], index) => {
            let heightStyle;
            if (allScoresEqual) {
              heightStyle = { height: '7vh' };
            } else if (sameScore1And2 && index <= 1) {
              heightStyle = { height: '7vh' };
            } else if (sameScore2And3 && index >= 1) {
              heightStyle = { height: '6vh' };
            } else if (sameScore1And2 && sameScore1And3 && index !== 1) {
              heightStyle = { height: '7vh' };
            } else {
              heightStyle = index === 0 ? { height: '7vh' } : index === 1 ? { height: '8vh' } : { height: '6vh' };
            }

            let backgroundColor;

            // Assegna i colori in base alle condizioni
            if (allScoresEqual) {
              backgroundColor = '#cda434'; // Tutti oro
            } else if (sameScore1And2 && !sameScore2And3) {
              backgroundColor = index <= 1 ? '#cda434' : '#cd7f32'; // Primi due oro, terzo bronzo
            } else if (sameScore2And3 && !sameScore1And2) {
              // Se secondo e terzo hanno lo stesso punteggio, entrambi argento
              backgroundColor = index === 0 ? '#cda434' : '#8a9597'; // Primo oro, secondo e terzo argento
            } else {
              // Altrimenti, applica i colori predefiniti
              const backgroundColors = {
                1: '#cda434', // Oro
                0: '#8a9597', // Argento
                2: '#cd7f32', // Bronzo
              };
              backgroundColor = backgroundColors[index];
            }

            return (
              <div
                key={player}
                className={`podium-position position-${index + 1}`}
                style={{ display: 'flex', justifyContent: 'flex-end', flexDirection: 'column', alignItems: 'center', flex: '1 1 0%', margin: '0 10px' }}
              >
                <img src={image} alt={`${player} avatar`} style={{ height: '70px' }} />
                <div style={{ ...heightStyle, backgroundColor, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', borderRadius: '10px' }}>
                  <p style={{ margin: '0' }}>{score}</p>
                </div>
                <p style={{ textAlign: 'center' }}>{player}</p>
              </div>
            );
          })}
        </div>

        <div className="elegant-background mt-3 scrollable fill">
          <table className="my-table">
            <tbody>
              {otherPlayers.map(([player, { score, image }]) => (
                <tr key={player}>
                  <td>
                    <img
                      src={image}
                      alt={`${player} avatar`}
                      style={{ width: '40px', height: '40px', borderRadius: '10%' }} />
                  </td>
                  <td>{player}</td>
                  <td>{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          className='my-btn mt-3 my-bg-puss'
          onClick={() => navigate('/')}
        >
          Torna alla homepage
        </button>
      </div>
    </>
  );
};

export default FinalResults;
