import { FinalResultData } from '../../ts/types';
import { useLocation, useNavigate } from 'react-router-dom';

const FinalResults: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { finalResults } = location.state as { finalResults: FinalResultData };

  // Ordinamento con tipizzazione
  const sortedResults = Object.entries(finalResults)
    .sort(([, a], [, b]) => (b.score - a.score)); // Ordina per punteggio decrescente

  // Verifica se finalResults è definito
  if (!finalResults) {
    return <div className="text-center mt-5">Nessun risultato disponibile.</div>;
  }

  // Estrai i primi 3 risultati per il podio

  const fake = sortedResults.slice(0, 1);
  const podium = [fake, fake, fake].flat();
  const otherPlayers = sortedResults.slice(3);

  return (
    <>
      <div id="gameOverMessage" className="paginator">
        <h2 className="">Classifica</h2>

        <div className='podium' style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', width: '100%' }}>
          {podium.map(([player, { score, image }], index) => (
            <div
              key={player}
              className={`podium-position position-${index + 1}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1 1 0%', margin: '0 10px' }} // Maggiore flessibilità
            >
              <img src={image} alt={`${player} avatar`} style={{ height: '70px' }} />
              <div className='my-bg-error' style={{ height: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', borderRadius: '10px' }}><p style={{ margin: '0' }}>{score}</p></div>
              <p className={''} style={{ textAlign: 'center' }}>{player}</p>
            </div>
          ))}
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
