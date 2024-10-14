import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './components/home/Home';
import Lobby from './components/lobby/Lobby';
import Game from './components/game/Game';
import { SessionProvider } from './contexts/SessionContext';
import { PopStateProvider } from './contexts/EventListener';
import ProtectedRoute from './components/ProtectedRoutes';
import ErrorPage from './components/ErrorPage';
import Login from './components/login/Login';
import { webServerBaseUrl } from './ts/socketInit';
import Loader from './components/Loader';
import SocketListener from './components/SocketListener';
import JoinLobbyWithShare from './components/JoinLobbyWithShare/JoinLobbyWithShare';
import Page404 from './components/Page404';
import { GameStateProvider } from './contexts/GameStateContext';
import FinalResults from './components/finalresults/FinalResults';

const App = () => {
  const [serviceUp, setServiceUp] = useState<boolean | null>(null); // null: loading, true: up, false: down

  useEffect(() => {
    const checkServiceStatus = async () => {
      try {
        const response = await fetch(webServerBaseUrl + '/api/status');
        setServiceUp(response.ok);
      } catch (error) {
        console.error('Error checking service status:', error);
        setServiceUp(false);
      }
    };

    checkServiceStatus();
  }, []);

  if (serviceUp === null) {
    return (
      <div className='center'>
        <Loader />
        <p>Bro i server sono scarsi, dammi il tempo...</p>
      </div>
    );
  }

  if (!serviceUp) {
    return <div id="loader">Service is Down. Please try again later.</div>;
  }

  const GameWithState: React.FC = () => (
    <GameStateProvider>
      <Game />
    </GameStateProvider>
  );

  return (
    <SessionProvider>
      <Router>
        <SocketListener />
        <PopStateProvider>
          <Routes>
            <Route path="" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/lobby" element={<ProtectedRoute component={Lobby} />} />
            <Route path="/game" element={<ProtectedRoute component={GameWithState} />} />
            <Route path="/final-results" element={<FinalResults />} />
            <Route path="/join/:lobbyCode" element={<JoinLobbyWithShare />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="*" element={<Page404 />} />
          </Routes>
        </PopStateProvider>
      </Router>
    </SessionProvider >
  );
};

export default App;
