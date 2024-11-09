import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from './SessionContext';
import { socket } from '../ts/socketInit';
import { SocketEvents } from '../../../Server/src/MiddleWare/SocketEvents.js';

const PopStateContext = createContext<void | null>(null);

// Hook per usare il contesto
export const useOnPopStateContext = () => {
  const context = useContext(PopStateContext);
  if (context === null) {
    throw new Error('PopStateContext must be used within a PopStateProvider');
  }
  return context;
};


export const PopStateProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentLobby, currentLobby, currentPlayer } = useSession();
  const [currentPage, setCurrentPage] = useState<string | null>(null);

  useEffect(() => {

    // Determina la pagina corrente basandoti sull'URL
    const pathname = location.pathname;
    if (pathname.includes('/lobby')) {
      setCurrentPage('lobby');
    } else if (pathname.includes('/game')) {
      setCurrentPage('game');
    } else {
      setCurrentPage(null);
    }
  }, [location.pathname]);

  useEffect(() => {
    // Definizione dell'handler per il popstate
    // TODO trova un modo per fixare questa merda
    // e` una completa merda, stakka funzioni allinfinito una sopra
    // allaltra di handlepopstate
    const handlePopState = () => {
      if (currentLobby !== null && currentPlayer !== null) {
        if (currentPage === 'lobby') {
          socket.emit(SocketEvents.EXIT_LOBBY, { currentPlayer, currentLobby });
          setCurrentLobby(null);
          navigate('/', { replace: true });
        } else if (currentPage === 'game') {
          socket.emit(SocketEvents.DISCONNECT);
          navigate('/', { replace: true });
        }
      }
    };

    // Aggiungi l'evento popstate quando il componente viene montato
    window.addEventListener('popstate', handlePopState);

  }, [currentPage, currentPlayer, currentLobby, navigate, setCurrentLobby]);

  return (
    <PopStateContext.Provider value={null}>
      {children}
    </PopStateContext.Provider>
  );
};
