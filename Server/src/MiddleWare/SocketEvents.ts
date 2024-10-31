export enum SocketEvents {
  CREATE_LOBBY = 'createLobby',
  ADD_NEW_PLAYER = 'addNewPlayer',
  START_GAME = 'startGame',
  REQUEST_TO_JOIN_LOBBY = 'joinLobby',
  VOTE = 'vote',
  SEND_QUESTION = 'sendQuestion',
  SHOW_RESULTS = 'showResults',
  RESULT_MESSAGE = 'resultMessage',
  READY_FOR_NEXT_QUESTION = 'readyForNextQuestion',
  GAME_OVER = 'gameOver',
  NEXT_QUESTION = 'nextQuestion',
  CONNECTION = 'connection',
  ERROR = 'error',
  INIZIA = 'inizia',
  READY = 'ready',
  RENDER_LOBBIES = 'renderLobbies',
  RENDER_LOBBY = 'renderLobby',
  REQUEST_RENDER_LOBBIES = 'requestRenderLobbies',
  REQUEST_RENDER_LOBBY = 'requestRenderLobby',
  TOGGLE_IS_READY_TO_GAME = 'toggleIsReadyToGame',
  DISCONNECT = 'disconnect',
  ERROR_SAME_NAME = 'errorSameName',
  PLAYER_CAN_JOIN = 'playerCanJoin',
  JOIN_ROOM = 'joinROOM',
  EXIT_LOBBY = 'exitLobby',
  LEAVE_ROOM = 'LeaveROOM',
  FORCE_RESET = 'FORCE_RESET',
  RETURN_NEWGAME = 'RETURN_NEWGAME',
  PLAYERS_WHO_VOTED = 'PLAYERS_WHO-VOTED',
  TEST_LOBBY = 'TEST_LOBBY',
  REMOVE_PLAYER = 'removePlayer',
  REQUEST_CATEGORIES = 'requestCategories',
  SEND_GENRES = 'SEND_GENRES',
  ENDGAMEWRAPPER = 'ENDGAMEWRAPPER',
  READY_FOR_PODIUM = 'READY_FOR_PODIUM',
  SET_NEXT_GAME = 'set_next_game',
}
