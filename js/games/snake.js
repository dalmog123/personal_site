/* ============================================================
   DALMOG OS - Snake Game
   ============================================================ */

const SnakeGame = (() => {
  const CELL = 20;
  const COLS = 20;
  const ROWS = 20;
  const TICK_START = 160;
  const TICK_MIN   = 60;

  let canvas, ctx, scoreEl, levelEl;
  let snake, dir, nextDir, food, score, level, gameLoop, running, paused;

  function init(canvasEl, scoreElement, levelElement) {
    canvas   = canvasEl;
    ctx      = canvas.getContext('2d');
    scoreEl  = scoreElement;
    levelEl  = levelElement;

    canvas.width  = COLS * CELL;
    canvas.height = ROWS * CELL;

    snake   = [{ x: 10, y: 10 }];
    dir     = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    food    = spawnFood();
    score   = 0;
    level   = 1;
    running = true;
    paused  = false;

    document.addEventListener('keydown', handleKey);
    tick();
  }

  function handleKey(e) {
    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W': if (dir.y !== 1)  nextDir = { x: 0, y: -1 }; e.preventDefault(); break;
      case 'ArrowDown':  case 's': case 'S': if (dir.y !== -1) nextDir = { x: 0, y: 1  }; e.preventDefault(); break;
      case 'ArrowLeft':  case 'a': case 'A': if (dir.x !== 1)  nextDir = { x: -1,y: 0  }; e.preventDefault(); break;
      case 'ArrowRight': case 'd': case 'D': if (dir.x !== -1) nextDir = { x: 1, y: 0  }; e.preventDefault(); break;
      case 'p': case 'P': togglePause(); break;
    }
  }

  function togglePause() {
    paused = !paused;
    if (!paused) tick();
  }

  function spawnFood() {
    let pos;
    do {
      pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  function tick() {
    if (!running || paused) return;

    dir = { ...nextDir };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision (wrap)
    head.x = (head.x + COLS) % COLS;
    head.y = (head.y + ROWS) % ROWS;

    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += 10 * level;
      level = Math.floor(score / 100) + 1;
      food = spawnFood();
      if (scoreEl) scoreEl.textContent = score;
      if (levelEl) levelEl.textContent = level;
    } else {
      snake.pop();
    }

    draw();
    const speed = Math.max(TICK_MIN, TICK_START - (level - 1) * 10);
    gameLoop = setTimeout(tick, speed);
  }

  function draw() {
    if (!ctx) return;

    // Background
    ctx.fillStyle = '#060a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid dots
    ctx.fillStyle = 'rgba(0,255,156,0.05)';
    for (let x = 0; x < COLS; x++) {
      for (let y = 0; y < ROWS; y++) {
        ctx.fillRect(x * CELL + CELL / 2 - 1, y * CELL + CELL / 2 - 1, 2, 2);
      }
    }

    // Food
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    ctx.fillStyle = `rgba(255, 51, 102, ${pulse})`;
    ctx.shadowColor = '#ff3366';
    ctx.shadowBlur = 10;
    const fx = food.x * CELL + 3;
    const fy = food.y * CELL + 3;
    ctx.beginPath();
    ctx.roundRect(fx, fy, CELL - 6, CELL - 6, 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Snake body
    snake.forEach((seg, i) => {
      const alpha = Math.max(0.3, 1 - i * 0.03);
      const brightness = i === 0 ? 1 : 0.7;
      ctx.fillStyle = i === 0 ? '#00ff9c' : `rgba(0, ${Math.floor(200 * brightness)}, ${Math.floor(120 * brightness)}, ${alpha})`;
      ctx.shadowColor = i === 0 ? '#00ff9c' : 'transparent';
      ctx.shadowBlur  = i === 0 ? 8 : 0;
      const sx = seg.x * CELL + 2;
      const sy = seg.y * CELL + 2;
      ctx.beginPath();
      ctx.roundRect(sx, sy, CELL - 4, CELL - 4, i === 0 ? 4 : 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Eyes on head
    const hx = snake[0].x * CELL;
    const hy = snake[0].y * CELL;
    ctx.fillStyle = '#0a0e14';
    if (dir.x === 1)  { ctx.fillRect(hx+14, hy+4, 3, 3); ctx.fillRect(hx+14, hy+13, 3, 3); }
    if (dir.x === -1) { ctx.fillRect(hx+3,  hy+4, 3, 3); ctx.fillRect(hx+3,  hy+13, 3, 3); }
    if (dir.y === -1) { ctx.fillRect(hx+4,  hy+3, 3, 3); ctx.fillRect(hx+13, hy+3, 3, 3); }
    if (dir.y === 1)  { ctx.fillRect(hx+4,  hy+14, 3, 3); ctx.fillRect(hx+13, hy+14, 3, 3); }
  }

  function gameOver() {
    running = false;
    clearTimeout(gameLoop);
    document.removeEventListener('keydown', handleKey);

    // Draw game over
    ctx.fillStyle = 'rgba(6, 10, 15, 0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ff3366';
    ctx.font = 'bold 28px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 30);

    ctx.fillStyle = '#00ff9c';
    ctx.font = '16px JetBrains Mono, monospace';
    ctx.fillText(`Score: ${score}`, canvas.width / 2, canvas.height / 2 + 10);

    ctx.fillStyle = '#8b949e';
    ctx.font = '12px JetBrains Mono, monospace';
    ctx.fillText('Press R to restart · Q to quit', canvas.width / 2, canvas.height / 2 + 40);
    ctx.textAlign = 'left';

    document.addEventListener('keydown', restartHandler);
  }

  function restartHandler(e) {
    if (e.key === 'r' || e.key === 'R') {
      document.removeEventListener('keydown', restartHandler);
      clearTimeout(gameLoop);
      init(canvas, scoreEl, levelEl);
    }
  }

  function destroy() {
    running = false;
    clearTimeout(gameLoop);
    document.removeEventListener('keydown', handleKey);
    document.removeEventListener('keydown', restartHandler);
  }

  window.SnakeGame = { init, destroy };
  return window.SnakeGame;
})();
