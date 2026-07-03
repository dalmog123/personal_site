/* ============================================================
   GAMES CONTROLLER - Minimalist launcher
   ============================================================ */

const Games = (() => {
  const overlay     = document.getElementById('game-overlay');
  const gameCanvas  = document.getElementById('game-canvas');
  const gameTitleEl = document.getElementById('game-title-text');
  const quitBtn     = document.getElementById('game-quit-btn');
  const gameFooter  = document.getElementById('game-footer');
  const infoBar     = document.getElementById('game-infobar');

  let activeGame = null;
  let minesContainer = null;

  function showOverlay() {
    if (!overlay) return;
    overlay.classList.add('active');
    const input = document.getElementById('cmd-input');
    if (input) input.blur();
  }

  function hideOverlay() {
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => {
      const input = document.getElementById('cmd-input');
      if (input) input.focus();
    }, 100);
  }

  function destroyActive() {
    if (!activeGame) return;
    if (activeGame === 'snake' && window.SnakeGame)      SnakeGame.destroy();
    if (activeGame === 'tetris' && window.TetrisGame)     TetrisGame.destroy();
    if (activeGame === 'minesweeper' && window.MinesweeperGame) MinesweeperGame.destroy();
    activeGame = null;

    if (gameCanvas) {
      const ctx = gameCanvas.getContext('2d');
      ctx && ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    }
    if (minesContainer) {
      minesContainer.remove();
      minesContainer = null;
    }

    const nextEl = document.getElementById('tetris-next');
    if (nextEl) nextEl.style.display = 'none';

    hideOverlay();
    if (window.Terminal && window.Terminal.printOutput) {
      window.Terminal.printOutput('Game exited. Welcome back!');
    }
  }

  function buildInfoBar(items) {
    if (!infoBar) return;
    infoBar.innerHTML = items.map(item => `
      <div class="game-info-item">
        <span class="game-info-label">${item.label}:</span>
        <span class="game-info-value" id="${item.id}">${item.value}</span>
      </div>
    `).join('');
  }

  function startSnake() {
    if (activeGame) destroyActive();
    activeGame = 'snake';
    showOverlay();

    if (gameTitleEl) gameTitleEl.textContent = 'SNAKE';
    if (gameCanvas) gameCanvas.style.display = 'block';
    if (gameFooter) gameFooter.textContent = 'Arrow keys / WASD to move | P to pause | R to restart | Q to quit';

    buildInfoBar([
      { label: 'SCORE', id: 'snake-score', value: '0' },
      { label: 'LEVEL', id: 'snake-level', value: '1' },
    ]);

    if (window.SnakeGame) {
      SnakeGame.init(
        gameCanvas,
        document.getElementById('snake-score'),
        document.getElementById('snake-level')
      );
    }
  }

  function startTetris() {
    if (activeGame) destroyActive();
    activeGame = 'tetris';
    showOverlay();

    if (gameTitleEl) gameTitleEl.textContent = 'TETRIS';
    if (gameCanvas) gameCanvas.style.display = 'block';
    if (gameFooter) gameFooter.textContent = 'Arrows to move | Up/Z rotate | Down drop | Space hard drop | Q quit';

    const nextEl = document.getElementById('tetris-next');
    if (nextEl) nextEl.style.display = 'block';

    buildInfoBar([
      { label: 'SCORE', id: 'tetris-score', value: '0' },
      { label: 'LEVEL', id: 'tetris-level', value: '1' },
      { label: 'LINES', id: 'tetris-lines', value: '0' },
    ]);

    if (window.TetrisGame) {
      TetrisGame.init(
        gameCanvas,
        document.getElementById('tetris-next'),
        document.getElementById('tetris-score'),
        document.getElementById('tetris-level'),
        document.getElementById('tetris-lines')
      );
    }
  }

  function startMinesweeper() {
    if (activeGame) destroyActive();
    activeGame = 'minesweeper';
    showOverlay();

    if (gameTitleEl) gameTitleEl.textContent = 'MINESWEEPER';
    if (gameCanvas) gameCanvas.style.display = 'none';
    if (gameFooter) gameFooter.textContent = 'Left click reveal | Right click flag | R restart | 1/2/3 diff | Q quit';

    buildInfoBar([
      { label: 'MINES', id: 'mines-count', value: '010' },
      { label: 'TIME',  id: 'mines-timer', value: '000' },
      { label: 'MODE',  id: 'mines-diff',  value: 'EASY' },
    ]);

    minesContainer = document.createElement('div');
    minesContainer.className = 'mines-grid';
    minesContainer.id = 'mines-grid';
    const gameWindow = document.getElementById('game-window');
    if (gameWindow) {
      const footer = document.getElementById('game-footer');
      gameWindow.insertBefore(minesContainer, footer);
    }

    if (window.MinesweeperGame) {
      MinesweeperGame.init(
        minesContainer,
        document.getElementById('mines-count'),
        document.getElementById('mines-timer'),
        document.getElementById('mines-diff'),
        null
      );
    }
  }

  function launch(gameName) {
    if (gameName === 'snake') startSnake();
    else if (gameName === 'tetris') startTetris();
    else if (gameName === 'minesweeper') startMinesweeper();
  }

  if (quitBtn) {
    quitBtn.addEventListener('click', destroyActive);
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'q' || e.key === 'Q') {
      if (activeGame) { e.preventDefault(); destroyActive(); }
    }
  });

  window.Games = { launch, startSnake, startTetris, startMinesweeper, destroyActive };
  return window.Games;
})();
