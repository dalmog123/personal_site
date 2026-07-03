/* ============================================================
   DALMOG OS - Effects (Matrix Rain & Typing Engine)
   ============================================================ */

const Effects = (() => {
  /* Matrix Rain */
  let matrixActive = false;
  let matrixAnimId = null;
  const canvas = document.getElementById('matrix-canvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const matrixChars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&@';
  let drops = [];
  let cols = 0;

  function initMatrix() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / 14);
    drops = Array(cols).fill(1);
  }

  function drawMatrix() {
    if (!canvas || !ctx) return;
    ctx.fillStyle = 'rgba(13, 13, 13, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#00ff66';
    ctx.font = '14px JetBrains Mono, monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
      ctx.fillText(char, i * 14, drops[i] * 14);
      if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    matrixAnimId = requestAnimationFrame(drawMatrix);
  }

  function toggleMatrix() {
    matrixActive = !matrixActive;
    if (matrixActive) {
      initMatrix();
      canvas.classList.add('active');
      drawMatrix();
    } else {
      if (matrixAnimId) cancelAnimationFrame(matrixAnimId);
      canvas.classList.remove('active');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return matrixActive;
  }

  /* Letter-by-letter typing engine */
  function typeText(element, htmlContent, speed = 4, onComplete = null) {
    // To support HTML tags cleanly while typing letter-by-letter, we create a temporary container
    const temp = document.createElement('div');
    temp.innerHTML = htmlContent;
    
    // We append children sequentially or type text nodes
    element.innerHTML = '';
    
    let nodes = Array.from(temp.childNodes);
    let currentIdx = 0;

    function processNextNode() {
      if (currentIdx >= nodes.length) {
        if (onComplete) onComplete();
        const term = document.getElementById('terminal');
        if (term) term.scrollTop = term.scrollHeight;
        return;
      }

      const node = nodes[currentIdx++];
      if (node.nodeType === Node.TEXT_NODE) {
        let text = node.textContent;
        let charIdx = 0;
        const textSpan = document.createTextNode('');
        element.appendChild(textSpan);

        function typeChar() {
          if (charIdx < text.length) {
            textSpan.textContent += text[charIdx++];
            const term = document.getElementById('terminal');
            if (term) term.scrollTop = term.scrollHeight;
            setTimeout(typeChar, speed);
          } else {
            processNextNode();
          }
        }
        typeChar();
      } else {
        // Element node (e.g. div, span, img, a)
        // If it's a menu or avatar or preformatted box, we can append it directly or type its inner text
        if (node.classList && (node.classList.contains('menu-box') || node.classList.contains('pixel-avatar') || node.tagName === 'A')) {
          element.appendChild(node.cloneNode(true));
          const term = document.getElementById('terminal');
          if (term) term.scrollTop = term.scrollHeight;
          setTimeout(processNextNode, speed * 5);
        } else {
          // Clone empty node and type inside it
          const clone = node.cloneNode(false);
          element.appendChild(clone);
          typeText(clone, node.innerHTML, speed, processNextNode);
        }
      }
    }

    processNextNode();
  }

  window.addEventListener('resize', () => { if (matrixActive) initMatrix(); });

  return { toggleMatrix, typeText };
})();
