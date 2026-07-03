/* ============================================================
   COMMANDS - Dead simple plain text output
   ============================================================ */

const COMMANDS = (() => {

  function getMenuHtml(selectedIndex = 0) {
    const items = [
      { id: 'about', label: 'about me' },
      { id: 'experience', label: 'work experience' },
      { id: 'projects', label: 'projects & builds' },
      { id: 'skills', label: 'skills' },
      { id: 'education', label: 'education' },
      { id: 'contact', label: 'contact info' },
      { id: 'old_backup', label: './old_backup/' }
    ];

    let html = `<div class="menu-container" id="active-menu">\n`;
    items.forEach((item, index) => {
      const selClass = index === selectedIndex ? 'selected' : '';
      const prefix = index === selectedIndex ? '&gt; ' : '  ';
      html += `<div class="menu-item ${selClass}" data-cmd="${item.id}" data-idx="${index}">${prefix}${item.label}</div>\n`;
    });
    html += `</div>\n`;
    return html;
  }

  function cmdMenu() {
    return `<span class="bold">Almog Dror</span>\n` +
           `<span class="dim">Use Up/Down arrows to select, Enter to view. Type any command to exit menu.</span>\n` +
           getMenuHtml(0);
  }

  function cmdHelp() {
    return `Available Commands:\n` +
           `  menu         Show navigation menu\n` +
           `  about        Profile summary\n` +
           `  experience   Work history\n` +
           `  projects     Featured builds\n` +
           `  skills       Technical stack\n` +
           `  education    Academic background\n` +
           `  contact      Reach out\n` +
           `  whoami       Display photo & info card\n` +
           `  clear        Clear screen\n\n`;
  }

  function cmdAbout() {
    return `<span class="bold">ALMOG DROR</span>\n` +
           `Tech Lead @ PwC Israel Innovation Center | Accountant | Builder\n\n` +
           `Accountant by training, builder by instinct.\n` +
           `At PwC Israel, I build AI driven workflows, automation solutions, and data tools that help teams adopt new technologies and improve decision making. I also provide technical and business advisory, deliver lectures, and conduct code reviews - bridging business, accounting, and engineering perspectives.\n\n` +
           `Outside of work, I ship projects across AI tooling, gaming, and developer productivity with over 3,000 monthly active users.\n\n` +
           `Currently building an advanced AI solution designed to help save lives.\n\n` +
           `<span class="dim">Type "whoami" to view avatar, or "menu" to return.</span>\n\n`;
  }

  function cmdWhoami() {
    return `<img src="assets/images/avatar.png" alt="Almog Dror" class="pixel-avatar">` +
           `<span class="bold">Almog Dror</span>\n` +
           `Tech Lead @ PwC Israel Innovation Center\n` +
           `<span class="dim">Location: Israel | Languages: Hebrew, English</span>\n\n`;
  }

  function cmdExperience() {
    return `<span class="bold">WORK EXPERIENCE</span>\n\n` +
           `PwC Israel — Innovation Center & CMAAS (2022 - Present)\n` +
           `  Tech Lead - Innovation Center (2025 - Present)\n` +
           `  - Developed internal and commercial tools - from RPA automations to Agentic workflows, and more.\n` +
           `  - Helped launch a new line of service at the intersection of Financial Operations and agentic AI.\n` +
           `  - Designed and delivered courses in AI, Prompt Engineering, Excel and programming.\n` +
           `  - Worked with GCP & Azure Cloud Platforms & various AI models, Built several tools and applications.\n` +
           `  - Highly skilled in Data Analysis work (Excel, PowerBI, SQL, Alteryx, UiPath, VBA programming, Macros).\n` +
           `  - Built several applications: Rev-Rec Software, XBRL & DCF & Billing & Data Migration Tools, and more.\n` +
           `  - Established & maintained communication channels between our team and global dev & AI PwC teams.\n` +
           `  - Advised clients and PwC leadership on AI, automation and technology implementation initiatives.\n\n` +
           `  Advisory & KYC Specialist - CMAAS (2022 - 2025)\n` +
           `  - Led Due Diligence, AML/KYC reviews, and Financial Risk analysis.\n` +
           `  - Advised clients on IFRS, US GAAP, and ASC 606 Revenue Recognition.\n\n` +
           `Self Employed — Lecturer (2022 - 2025)\n` +
           `  - Taught Programming, AI, and Prompt Engineering.\n\n` +
           `IDF — Golani Brigade Intelligence Unit Commander (2019 - 2021)\n` +
           `  - Managed 10 soldiers in tech-oriented operations.\n` +
           `  - Awarded Intelligence Directorate Certificate of Excellence.\n\n`;
  }

  function cmdProjects() {
    return `<span class="bold">FEATURED PROJECTS</span>\n\n` +
           `  [KASAO]            Offline-first case management & intelligence analysis platform for investigators\n` +
           `  [WHIP Cursor]      Physics-driven prompt-injection manager cursor for AI workflows\n` +
           `  [UniCalendar]      Centralized academic platform & AI Tutor for accounting students\n` +
           `  [Real Estate AI]   Agentic AI workflow for automated real estate market analysis\n\n` +
           `<span class="dim">Other builds & experiments: Vibe Extension, SwipeIt, NUMIO, TickerTracer, NewSight, Gross.net...</span>\n` +
           `GitHub: <a href="https://github.com/dalmog123" target="_blank">github.com/dalmog123</a>\n\n`;
  }

  function cmdSkills() {
    return `<span class="bold">TECHNICAL SKILLS</span>\n\n` +
           `  Core:              Python, SQL, TypeScript, Next.js, VBA, Streamlit\n` +
           `  Data & Automation: Excel, Power BI, Alteryx, UiPath (RPA), Data Analysis\n` +
           `  Cloud & AI:        GCP, Azure, Agentic Workflows, Prompt Engineering\n` +
           `  Domain:            Financial Analysis, Capital Markets, Accounting\n\n`;
  }

  function cmdEducation() {
    return `<span class="bold">EDUCATION</span>\n\n` +
           `Open University of Israel — B.A in Accounting and Economics (Grade: 85, Dean's List x2)\n` +
           `Ort Rabin Gan Yavne — Full Bagrut + Computer Science & Physics major\n\n` +
           `Programs: FintechX (Startup for Startup), ELI Leadership, Jerusalem Post C1 English, Microsoft SunSpark Game Dev.\n\n`;
  }

  function cmdContact() {
    return `<span class="bold">CONTACT</span>\n\n` +
           `  Email:    <a href="mailto:dalmog123@gmail.com">dalmog123@gmail.com</a>\n` +
           `  Phone:    054-5999731\n` +
           `  LinkedIn: <a href="https://www.linkedin.com/in/almogdror/" target="_blank">linkedin.com/in/almogdror/</a>\n` +
           `  GitHub:   <a href="https://github.com/dalmog123" target="_blank">github.com/dalmog123</a>\n\n`;
  }

  function cmdOldBackup() {
    return `Directory: ./old_backup/\n` +
           `Found 3 executable files:\n\n` +
           `  play snake         Launch Snake\n` +
           `  play tetris        Launch Tetris\n` +
           `  play minesweeper   Launch Minesweeper\n\n`;
  }

  return {
    cmdMenu, cmdHelp, cmdAbout, cmdWhoami, cmdExperience,
    cmdProjects, cmdSkills, cmdEducation, cmdContact,
    cmdOldBackup, getMenuHtml
  };
})();
