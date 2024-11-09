import { useNavigate, useParams } from 'react-router-dom';
import Login from '../login/Login';
import { socket } from '../../ts/socketInit';
import { useSession } from '../../contexts/SessionContext';
import { SocketEvents } from '../../../../Server/src/MiddleWare/SocketEvents.js';
import React, { useEffect, useState } from 'react';
import Alert from '../common/Alert.js';

const JoinLobbyWithShare = () => {
  const navigate = useNavigate();
  const { lobbyCode } = useParams<string>();
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const { currentPlayer, currentPlayerImage, setCurrentLobby } = useSession();

  useEffect(() => {
    socket.emit(SocketEvents.TEST_LOBBY, { lobbyCode: lobbyCode }, (response: boolean) => {
      if (!response) {
        navigate('/error');
      }
    });
  }, [lobbyCode, navigate]);

  function handleJoinGame(lobbyCode: string) {
    const data = {
      lobbyCode: lobbyCode,
      playerName: currentPlayer,
      image: currentPlayerImage,
    };
    socket.emit(SocketEvents.REQUEST_TO_JOIN_LOBBY, data);
  }

  socket.on(SocketEvents.PLAYER_CAN_JOIN, (data) => {
    if (data.canJoin) {
      setCurrentLobby(data.lobbyCode);
      navigate('/lobby');
    } else {
      setShowAlert(true);
    }
  });

  return (
    <>
      <Alert text='Cambia nome' show={showAlert} onHide={() => setShowAlert(false)} />

      <Login onButtonClick={() =>
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        handleJoinGame(lobbyCode!)} />
    </>
  );
};

export default JoinLobbyWithShare;
