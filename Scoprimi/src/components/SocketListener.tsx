import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketEvents } from '../../../Server/src/MiddleWare/SocketEvents.js';
import { socket } from '../ts/socketInit';

// Questo pezzo di codice serve per forzare luscita dalla lobby a tutti i player.
// Al riavvio del server le sessioni rimanevano appese e i player provavano a rientrare
// nelle vecchie lobby, non piu esistenti, facendo crashare il server
const SocketListener = () => {
  const navigate = useNavigate();

  useEffect(() => {
    socket.on(SocketEvents.FORCE_RESET, () => {
      navigate('/error');
    });

    return () => {
      socket.off(SocketEvents.FORCE_RESET);
    };
  }, [navigate]);

  return null;
};

export default SocketListener;
