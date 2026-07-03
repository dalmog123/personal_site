/* ============================================================
   DALMOG OS - Minesweeper Game
   ============================================================ */

const MinesweeperGame = (() => {
  const DIFFICULTIES = {
    easy:   { cols: 9,  rows: 9,  mines: 10 },
    medium: { cols: 16, rows: 16, mines: 40 },
    hard:   { cols: 16, rows: 16, mines: 60 },
  };

  let config, board, revealed, flagged, mineSet;
  let gameState, startTime, timerInterval, firstClick;
  let container, minesEl, timerEl, diffEl, flagsEl;

  function init(containerEl, minesElement, timerElement, diffElement, flagsElement) {
    container = containerEl;
    minesEl   = minesElement;
    timerEl   = timerElement;
    diffEl    = diffElement;
    flagsEl   = flagsElement;

    config    = DIFFICULTIES.easy;
    firstClick= true;
    gameState = 'playing';
    startTime = null;
    clearInterval(timerInterval);
    if (timerEl) timerEl.textContent = '000';

    initBoard();
    render();

    document.addEventListener('keydown', handleKey);
  }

  function handleKey(e) {
    if (e.key === 'r' || e.key === 'R') restart();
    if (e.key === '1') setDifficulty('easy');
    if (e.key === '2') setDifficulty('medium');
    if (e.key === '3') setDifficulty('hard');
  }

  function setDifficulty(diff) {
    config = DIFFICULTIES[diff];
    if (diffEl) diffEl.textContent = diff.toUpperCase();
    restart();
  }

  function initBoard() {
    const { cols, rows } = config;
    board    = Array.from({ length: rows }, () => Array(cols).fill(0));
    revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    flagged  = Array.from({ length: rows }, () => Array(cols).fill(false));
    mineSet  = new Set();
    updateMineCount();
  }

  function placeMines(safeR, safeC) {
    const { cols, rows, mines } = config;
    while (mineSet.size < mines) {
      const r = Math.floor(Math.random() * rows);
      const c = Math.floor(Math.random() * cols);
      const key = r + ',' + c;
      if (Math.abs(r - safeR) <= 1 && Math.abs(c - safeC) <= 1) continue;
      if (mineSet.has(key)) continue;
      mineSet.add(key);
      board[r][c] = -1;
    }

    // Calculate numbers
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === -1) continue;
        let count = 0;
        neighbors(r, c).forEach(([nr, nc]) => {
          if (board[nr][nc] === -1) count++;
        });
        board[r][c] = count;
      }
    }
  }

  function neighbors(r, c) {
    const { cols, rows } = config;
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) out.push([nr, nc]);
      }
    }
    return out;
  }

  function reveal(r, c) {
    if (gameState !== 'playing') return;
    if (revealed[r][c] || flagged[r][c]) return;

    if (firstClick) {
      firstClick = false;
      placeMines(r, c);
      startTime = Date.now();
      timerInterval = setInterval(updateTimer, 1000);
    }

    revealed[r][c] = true;

    if (board[r][c] === -1) {
      gameState = 'lost';
      revealAll();
      render();
      clearInterval(timerInterval);
      return;
    }

    if (board[r][c] === 0) {
      neighbors(r, c).forEach(([nr, nc]) => {
        if (!revealed[nr][nc]) reveal(nr, nc);
      });
    }

    checkWin();
    render();
  }

  function toggleFlag(r, c) {
    if (gameState !== 'playing') return;
    if (revealed[r][c]) return;
    flagged[r][c] = !flagged[r][c];
    updateMineCount();
    render();
  }

  function revealAll() {
    const { cols, rows } = config;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (board[r][c] === -1) revealed[r][c] = true;
      }
    }
  }

  function checkWin() {
    const { cols, rows, mines } = config;
    let unrevealedSafe = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!revealed[r][c] && board[r][c] !== -1) unrevealedSafe++;
      }
    }
    if (unrevealedSafe === 0) {
      gameState = 'won';
      clearInterval(timerInterval);
    }
  }

  function updateTimer() {
    if (!timerEl || !startTime) return;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    timerEl.textContent = String(Math.min(999, elapsed)).padStart(3, '0');
  }

  function updateMineCount() {
    if (!minesEl) return;
    const { mines } = config;
    const flags = flagged.flat().filter(Boolean).length;
    minesEl.textContent = String(Math.max(0, mines - flags)).padStart(3, '0');
  }

  function render() {
    if (!container) return;
    const { cols, rows } = config;

    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${cols}, 26px)`;
    container.className = 'mines-grid';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.r = r;
        cell.dataset.c = c;

        if (revealed[r][c]) {
          cell.classList.add('revealed');
          if (board[r][c] === -1) {
            cell.classList.add(gameState === 'lost' ? 'mine-hit' : 'mine-safe');
            cell.textContent = '💣';
          } else if (board[r][c] > 0) {
            cell.textContent = board[r][c];
            cell.dataset.num = board[r][c];
          }
        } else if (flagged[r][c]) {
          cell.classList.add('flagged');
          cell.textContent = '🚩';
        } else if (gameState === 'won') {
          cell.classList.add('flagged');
          if (board[r][c] === -1) cell.textContent = '🚩';
        }

        cell.addEventListener('click',       () => reveal(r, c));
        cell.addEventListener('contextmenu', e  => { e.preventDefault(); toggleFlag(r, c); });

        container.appendChild(cell);
      }
    }

    // Status message
    if (gameState === 'won' || gameState === 'lost') {
      const msg = document.createElement('div');
      msg.style.cssText = `
        grid-column: 1 / -1;
        text-align: center;
        padding: 8px;
        font-size: 13px;
        font-weight: 700;
        color: ${gameState === 'won' ? 'var(--green)' : 'var(--red)'};
        margin-top: 6px;
      `;
      msg.textContent = gameState === 'won' ? '✓ MINEFIELD CLEARED!' : '✗ BOOM! Press R to restart.';
      container.appendChild(msg);
    }
  }

  function restart() {
    clearInterval(timerInterval);
    firstClick = true;
    gameState  = 'playing';
    startTime  = null;
    if (timerEl) timerEl.textContent = '000';
    initBoard();
    render();
  }

  function destroy() {
    clearInterval(timerInterval);
    document.removeEventListener('keydown', handleKey);
  }

  window.MinesweeperGame = { init, destroy, restart };
  return window.MinesweeperGame;
})();
