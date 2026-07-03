/* ============================================================
   DALMOG OS - Tetris Game
   ============================================================ */

const TetrisGame = (() => {
  const COLS   = 10;
  const ROWS   = 20;
  const CELL   = 24;
  const COLORS = [
    null,
    '#00d4ff', // I - cyan
    '#ffb400', // O - amber
    '#c792ea', // T - purple
    '#00ff9c', // S - green
    '#ff3366', // Z - red
    '#4fc3f7', // J - light blue
    '#ff8c00', // L - orange
  ];

  const PIECES = [
    null,
    [[1,1,1,1]],                          // I
    [[1,1],[1,1]],                        // O
    [[0,1,0],[1,1,1]],                    // T
    [[0,1,1],[1,1,0]],                    // S
    [[1,1,0],[0,1,1]],                    // Z
    [[1,0,0],[1,1,1]],                    // J
    [[0,0,1],[1,1,1]],                    // L
  ];

  let canvas, ctx, nextCanvas, nextCtx, scoreEl, levelEl, linesEl;
  let board, piece, nextPieceType, score, level, lines, gameLoop, running, paused;

  function init(canvasEl, nextEl, scoreElement, levelElement, linesElement) {
    canvas     = canvasEl;
    ctx        = canvas.getContext('2d');
    nextCanvas = nextEl;
    nextCtx    = nextCanvas ? nextCanvas.getContext('2d') : null;
    scoreEl    = scoreElement;
    levelEl    = levelElement;
    linesEl    = linesElement;

    canvas.width  = COLS * CELL;
    canvas.height = ROWS * CELL;
    if (nextCanvas) { nextCanvas.width = 4 * CELL; nextCanvas.height = 4 * CELL; }

    board   = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    score   = 0;
    level   = 1;
    lines   = 0;
    running = true;
    paused  = false;

    nextPieceType = randomPiece();
    spawnPiece();

    document.addEventListener('keydown', handleKey);
    gameLoop = setInterval(tick, getSpeed());
  }

  function randomPiece() { return Math.floor(Math.random() * 7) + 1; }

  function getSpeed() { return Math.max(50, 800 - (level - 1) * 70); }

  function spawnPiece() {
    const type = nextPieceType;
    nextPieceType = randomPiece();
    piece = {
      type,
      shape: PIECES[type].map(r => [...r]),
      x: Math.floor((COLS - PIECES[type][0].length) / 2),
      y: 0,
    };

    if (collides(piece.shape, piece.x, piece.y)) {
      gameOver();
    }

    drawNextPiece();
  }

  function rotate(shape) {
    const rows = shape.length, cols = shape[0].length;
    return Array.from({ length: cols }, (_, c) =>
      Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c])
    );
  }

  function collides(shape, ox, oy) {
    return shape.some((row, dy) =>
      row.some((cell, dx) => {
        if (!cell) return false;
        const nx = ox + dx, ny = oy + dy;
        return nx < 0 || nx >= COLS || ny >= ROWS || (ny >= 0 && board[ny][nx]);
      })
    );
  }

  function lock() {
    piece.shape.forEach((row, dy) =>
      row.forEach((cell, dx) => {
        if (cell) board[piece.y + dy][piece.x + dx] = piece.type;
      })
    );
    clearLines();
    spawnPiece();
  }

  function clearLines() {
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(c => c)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(0));
        cleared++;
        y++;
      }
    }
    if (cleared) {
      const pts = [0, 40, 100, 300, 1200];
      score += (pts[cleared] || 1200) * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      if (scoreEl) scoreEl.textContent = score;
      if (levelEl) levelEl.textContent = level;
      if (linesEl) linesEl.textContent = lines;
      clearInterval(gameLoop);
      gameLoop = setInterval(tick, getSpeed());
    }
  }

  function tick() {
    if (!running || paused) return;
    if (!collides(piece.shape, piece.x, piece.y + 1)) {
      piece.y++;
    } else {
      lock();
    }
    draw();
  }

  function handleKey(e) {
    if (!running) return;
    switch (e.key) {
      case 'ArrowLeft':  if (!collides(piece.shape, piece.x - 1, piece.y)) piece.x--; e.preventDefault(); break;
      case 'ArrowRight': if (!collides(piece.shape, piece.x + 1, piece.y)) piece.x++; e.preventDefault(); break;
      case 'ArrowDown':
        if (!collides(piece.shape, piece.x, piece.y + 1)) piece.y++;
        else lock();
        e.preventDefault(); break;
      case 'ArrowUp': case 'z': case 'Z': {
        const rotated = rotate(piece.shape);
        if (!collides(rotated, piece.x, piece.y)) piece.shape = rotated;
        e.preventDefault(); break;
      }
      case ' ': {
        // Hard drop
        while (!collides(piece.shape, piece.x, piece.y + 1)) piece.y++;
        lock();
        e.preventDefault(); break;
      }
      case 'p': case 'P':
        paused = !paused;
        break;
    }
    draw();
  }

  function draw() {
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#060a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(0,255,156,0.05)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, canvas.height); ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(canvas.width, y * CELL); ctx.stroke();
    }

    // Draw ghost piece
    let ghostY = piece.y;
    while (!collides(piece.shape, piece.x, ghostY + 1)) ghostY++;
    if (ghostY !== piece.y) {
      drawShape(piece.shape, piece.x, ghostY, COLORS[piece.type], 0.2);
    }

    // Draw board
    board.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) drawCell(x, y, COLORS[cell], 1);
      });
    });

    // Draw active piece
    drawShape(piece.shape, piece.x, piece.y, COLORS[piece.type], 1);

    // Paused overlay
    if (paused) {
      ctx.fillStyle = 'rgba(6,10,15,0.8)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ff9c';
      ctx.font = 'bold 20px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
      ctx.font = '12px JetBrains Mono, monospace';
      ctx.fillStyle = '#8b949e';
      ctx.fillText('Press P to continue', canvas.width / 2, canvas.height / 2 + 30);
      ctx.textAlign = 'left';
    }
  }

  function drawShape(shape, ox, oy, color, alpha) {
    shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell) drawCell(ox + dx, oy + dy, color, alpha);
      });
    });
  }

  function drawCell(x, y, color, alpha) {
    const px = x * CELL, py = y * CELL;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = alpha === 1 ? 6 : 0;
    ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(px + 2, py + 2, CELL - 4, 3);
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  function drawNextPiece() {
    if (!nextCtx || !nextCanvas) return;
    nextCtx.fillStyle = '#060a0f';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    const shape = PIECES[nextPieceType];
    const color = COLORS[nextPieceType];
    const offX  = Math.floor((4 - shape[0].length) / 2);
    const offY  = Math.floor((4 - shape.length) / 2);

    shape.forEach((row, dy) => {
      row.forEach((cell, dx) => {
        if (cell) {
          const px = (offX + dx) * CELL, py = (offY + dy) * CELL;
          nextCtx.fillStyle = color;
          nextCtx.shadowColor = color;
          nextCtx.shadowBlur = 6;
          nextCtx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
          nextCtx.shadowBlur = 0;
        }
      });
    });
  }

  function gameOver() {
    running = false;
    clearInterval(gameLoop);
    document.removeEventListener('keydown', handleKey);

    ctx.fillStyle = 'rgba(6,10,15,0.88)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 22px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#00ff9c';
    ctx.font = '14px JetBrains Mono, monospace';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 5);
    ctx.fillText(`Lines: ${lines}  Level: ${level}`, canvas.width / 2, canvas.height / 2 + 25);

    ctx.fillStyle = '#8b949e';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.fillText('R to restart · Q to quit', canvas.width / 2, canvas.height / 2 + 55);
    ctx.textAlign = 'left';

    document.addEventListener('keydown', restartHandler);
  }

  function restartHandler(e) {
    if (e.key === 'r' || e.key === 'R') {
      document.removeEventListener('keydown', restartHandler);
      clearInterval(gameLoop);
      init(canvas, nextCanvas, scoreEl, levelEl, linesEl);
    }
  }

  function destroy() {
    running = false;
    clearInterval(gameLoop);
    document.removeEventListener('keydown', handleKey);
    document.removeEventListener('keydown', restartHandler);
  }

  window.TetrisGame = { init, destroy };
  return window.TetrisGame;
})();
