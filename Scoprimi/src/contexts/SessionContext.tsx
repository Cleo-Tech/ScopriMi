import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface SessionContextProps {
  currentLobby: string | undefined;
  setCurrentLobby: (lobby: string | undefined) => void;
  currentPlayer: string | undefined;
  setCurrentPlayer: (name: string | undefined) => void;
  isSetPlayer: boolean;
  currentPlayerImage: string | undefined;
  setCurrentPlayerImage: (image: string | undefined) => void;
}

const SessionContext = createContext<SessionContextProps | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  // Stato della lobby
  const [currentLobby, setCurrentLobby] = useState<string | undefined>(undefined);

  // Stato del player
  const [currentPlayer, setCurrentPlayer] = useState<string | undefined>(undefined);
  const [currentPlayerImage, setCurrentPlayerImage] = useState<string | undefined>(undefined);
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
