import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface SessionContextProps {
  currentLobby: string | null;
  setCurrentLobby: (lobby: string | null) => void;
  currentPlayer: string | null;
  setCurrentPlayer: (name: string | null) => void;
  isSetPlayer: boolean;
  currentPlayerImage: string | null;
  setCurrentPlayerImage: (image: string | null) => void;
}

const SessionContext = createContext<SessionContextProps | null>(null);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  // Stato della lobby
  const [currentLobby, setCurrentLobby] = useState<string | null>(null);

  // Stato del player
  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [currentPlayerImage, setCurrentPlayerImage] = useState<string | null>(null);
  const [isSetPlayer, setIsSetPlayer] = useState<boolean>(false);

  useEffect(() => {
    if (currentPlayer && currentPlayerImage) {
      setIsSetPlayer(true);
    } else {
      setIsSetPlayer(false);
    }
  }, [currentPlayer, currentPlayerImage]);

  return (
    <SessionContext.Provider
      value={{
        currentLobby,
        setCurrentLobby,
        currentPlayer,
        setCurrentPlayer,
        currentPlayerImage,
        isSetPlayer,
        setCurrentPlayerImage,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
