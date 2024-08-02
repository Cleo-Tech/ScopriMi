import * as c from './socketConsts.mjs';
const socket = io();

document.addEventListener('DOMContentLoaded', function () {
  const playersTable = document.getElementById('playersTable');
  const startGameBtn = document.getElementById('startGameBtn');
  const numQuestionsInput = document.getElementById('numQuestions');
  const lobbyCodeTabTitle = document.getElementById('lobbyCodeTabTitle');
  const lobbyCodeTitle = document.getElementById('lobbyCodeTitle');


  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  const currentLobbyCode = params.get('lobbyCode');
  const currentPlayer = params.get('name');

  lobbyCodeTitle.textContent = lobbyCodeTabTitle.textContent = currentLobbyCode;

  socket.emit(c.REQUEST_RENDER_LOBBY, currentLobbyCode);

  socket.on(c.RENDER_LOBBY, (game) => {
    playersTable.innerHTML = '';
    game.players.forEach(player => {
      const row = document.createElement('tr');
      const cell = document.createElement('td');
      cell.textContent = player;
      row.appendChild(cell);
      playersTable.appendChild(row);
    });
  });

  startGameBtn.addEventListener('click', () => {
    const data = {
      lobbyCode: currentLobbyCode,
    };
    socket.emit(c.START_GAME, data);
  });

  socket.on('inizia', function () {
    window.location.href = `/game.html/?lobbyCode=${currentLobbyCode}&name=${currentPlayer}`;
  });
});
