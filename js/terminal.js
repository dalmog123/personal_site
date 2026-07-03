/* ============================================================
   TERMINAL CONTROLLER - Minimalist & dead simple
   ============================================================ */

const Terminal = (() => {
  const outputEl = document.getElementById('output');
  const inputEl = document.getElementById('cmd-input');
  const typedEl = document.getElementById('typed-input');
  const terminalEl = document.getElementById('terminal');

  let history = [];
  let historyIdx = -1;
  let menuActive = false;
  let selectedMenuIdx = 0;
  let isTyping = false;

  const menuCmds = ['about', 'experience', 'projects', 'skills', 'education', 'contact', 'old_backup'];

  function init() {
    document.addEventListener('click', (e) => {
      const overlay = document.getElementById('game-overlay');
      if (overlay && overlay.classList.contains('active')) return;
      if (inputEl) inputEl.focus();
    });

    if (inputEl) {
      inputEl.focus();
      inputEl.addEventListener('input', () => {
        if (typedEl) typedEl.textContent = inputEl.value;
      });

      inputEl.addEventListener('keydown', handleKeyDown);
    }

    printOutput(COMMANDS.cmdMenu(), () => {
      menuActive = true;
      bindMenuEvents();
    });
  }

  function bindMenuEvents() {
    const menuBox = document.getElementById('active-menu');
    if (!menuBox) return;

    const items = menuBox.querySelectorAll('.menu-item');
    items.forEach((item, idx) => {
      item.addEventListener('mouseenter', () => {
        if (!menuActive || isTyping) return;
        updateMenuSelection(idx);
      });
      item.addEventListener('click', () => {
        if (!menuActive || isTyping) return;
        const cmd = item.getAttribute('data-cmd');
        runCommand(cmd);
      });
    });
  }

  function updateMenuSelection(newIdx) {
    const menuBox = document.getElementById('active-menu');
    if (!menuBox) return;
    const items = menuBox.querySelectorAll('.menu-item');
    if (!items.length) return;

    selectedMenuIdx = (newIdx + items.length) % items.length;

    items.forEach((item, idx) => {
      if (idx === selectedMenuIdx) {
        item.classList.add('selected');
        item.innerHTML = '&gt; ' + item.innerHTML.replace(/^(&gt;|\s+)\s*/g, '');
      } else {
        item.classList.remove('selected');
        item.innerHTML = '  ' + item.innerHTML.replace(/^(&gt;|\s+)\s*/g, '');
      }
    });
  }

  function handleKeyDown(e) {
    if (isTyping) {
      e.preventDefault();
      return;
    }

    if (menuActive && inputEl.value.trim() === '') {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateMenuSelection(selectedMenuIdx - 1);
        return;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateMenuSelection(selectedMenuIdx + 1);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = menuCmds[selectedMenuIdx];
        runCommand(cmd);
        return;
      }
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      if (historyIdx === -1) historyIdx = history.length - 1;
      else historyIdx = Math.max(0, historyIdx - 1);
      inputEl.value = history[historyIdx];
      typedEl.textContent = inputEl.value;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx !== -1) {
        historyIdx = Math.min(history.length - 1, historyIdx + 1);
        if (historyIdx === history.length - 1) {
          historyIdx = -1;
          inputEl.value = '';
        } else {
          inputEl.value = history[historyIdx];
        }
        typedEl.textContent = inputEl.value;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const rawCmd = inputEl.value.trim();
      inputEl.value = '';
      typedEl.textContent = '';
      runCommand(rawCmd);
    }
  }

  function printOutput(htmlContent, callback = null) {
    if (!outputEl) return;
    isTyping = true;
    
    const lineDiv = document.createElement('div');
    lineDiv.style.marginBottom = '16px';
    outputEl.appendChild(lineDiv);

    Effects.typeText(lineDiv, htmlContent, 2, () => {
      isTyping = false;
      if (terminalEl) terminalEl.scrollTop = terminalEl.scrollHeight;
      if (callback) callback();
    });
  }

  function printEcho(cmdText) {
    const echoDiv = document.createElement('div');
    echoDiv.style.color = '#666666';
    echoDiv.style.marginBottom = '4px';
    echoDiv.textContent = `> ${cmdText}`;
    outputEl.appendChild(echoDiv);
  }

  function runCommand(rawCmd) {
    if (!rawCmd) return;
    
    if (menuActive) {
      const oldMenu = document.getElementById('active-menu');
      if (oldMenu) oldMenu.removeAttribute('id');
      menuActive = false;
    }

    printEcho(rawCmd);

    history.push(rawCmd);
    historyIdx = -1;

    const parts = rawCmd.toLowerCase().split(/\s+/);
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ');

    if (cmd === 'play' || ['snake', 'tetris', 'minesweeper'].includes(cmd)) {
      const gameName = cmd === 'play' ? arg : cmd;
      if (['snake', 'tetris', 'minesweeper'].includes(gameName)) {
        setTimeout(() => {
          const gameController = window.Games || (typeof Games !== 'undefined' ? Games : null);
          if (gameController) gameController.launch(gameName);
        }, 300);
        return;
      }
    }

    switch (cmd) {
      case 'menu':
        selectedMenuIdx = 0;
        printOutput(COMMANDS.cmdMenu(), () => {
          menuActive = true;
          bindMenuEvents();
        });
        break;
      case 'help':
        printOutput(COMMANDS.cmdHelp());
        break;
      case 'about':
        printOutput(COMMANDS.cmdAbout());
        break;
      case 'whoami':
        printOutput(COMMANDS.cmdWhoami());
        break;
      case 'experience':
        printOutput(COMMANDS.cmdExperience());
        break;
      case 'projects':
        printOutput(COMMANDS.cmdProjects());
        break;
      case 'skills':
        printOutput(COMMANDS.cmdSkills());
        break;
      case 'education':
        printOutput(COMMANDS.cmdEducation());
        break;
      case 'contact':
        printOutput(COMMANDS.cmdContact());
        break;
      case 'old_backup':
      case './old_backup/':
      case 'backup':
      case 'games':
        printOutput(COMMANDS.cmdOldBackup());
        break;
      case 'clear':
      case 'cls':
        outputEl.innerHTML = '';
        break;
      default:
        const safeCmd = rawCmd.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        printOutput(`Command not found: "${safeCmd}". Type "help" or "menu".`);
        break;
    }
  }

  window.TERMINAL = { runCommand, printOutput };
  window.addEventListener('DOMContentLoaded', init);

  return { init, runCommand, printOutput };
})();
