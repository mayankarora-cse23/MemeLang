'use strict';

//  PRESETS 

const PRESETS = {
  hello: {
    file: 'hello_world.meme',
    requiresInput: false,
    code: `padh le bhai
  bol yaar "Bhai exam kal hai! x";
  bol yaar "Phir bhi yahan hoon code likhne...";
  bol yaar "Thug life. x";
main chala`
  },
  cgpa: {
    file: 'cgpa_calculator.meme',
    requiresInput: false,
    code: `padh le bhai
  // bhai sun  CGPA calculator
  yaar ye hai cgpa = 6.9;
  yaar ye hai naam = "Sigma Bhai";
  yaar ye hai pass_hua = scene hai;
  yaar ye hai girlfriend = null pointer tha;

  cgpa = cgpa + 0.1;
  bol yaar naam, " ka CGPA: ", cgpa;
  bol yaar "Pass hua: ", pass_hua;
  bol yaar "Girlfriend: ", girlfriend;

  agar scene ho (cgpa >= 7.5) {
    bol yaar "Decent score bhai! x";
  } nahi to scene (cgpa >= 6.0) {
    bol yaar "Thoda aur grind kar yaar xa";
  } warna yaar {
    bol yaar "Bhai... GATE bharo x";
  }
main chala`
  },
  loop: {
    file: 'backlog_grind.meme',
    requiresInput: false,
    code: `padh le bhai
  yaar ye hai subjects_pending = 5;
  yaar ye hai total_done = 0;

  jab tak grind (subjects_pending > 0) {
    agar scene ho (subjects_pending == 3) {
      bol yaar "Raat ke 3 baj gaye, chai peeta hoon "";
      subjects_pending -= 1;
      skip kar;
    }
    agar scene ho (subjects_pending == 1) {
      bol yaar "Ek chhod deta hoon, grace aayega x"";
      bas kar yaar;
    }
    subjects_pending -= 1;
    total_done += 1;
    bol yaar "Subject clear! Remaining: ", subjects_pending;
  }

  bol yaar "Total done: ", total_done;
  bol yaar "Bhai kar diya! x";
main chala`
  },
  func: {
    file: 'placement_checker.meme',
    requiresInput: false,
    code: `padh le bhai

  /* ruk yaar
     Placement function  the most important function of btech
  */
  kaam karo placement_milegi(cgpa, dsa_done) {
    agar scene ho (cgpa >= 8.0 && dsa_done == scene hai) {
      lele result "Google le jayega bhai xa";
    } nahi to scene (cgpa >= 6.5) {
      lele result "Service company pakki x"";
    } warna yaar {
      lele result "Bhai GATE bharo x";
    }
  }

  yaar ye hai mera_cgpa = 7.2;
  yaar ye hai dsa = scene nahi;
  bol yaar "Mera result: ", placement_milegi(mera_cgpa, dsa);

  yaar ye hai topper_cgpa = 9.2;
  yaar ye hai topper_dsa = scene hai;
  bol yaar "Topper ka result: ", placement_milegi(topper_cgpa, topper_dsa);

main chala`
  },
  btech: {
    file: 'btech_life_simulator.meme',
    requiresInput: false,
    code: `padh le bhai
  // bhai sun  Full BTech life simulation
  yaar ye hai cgpa = 7.5;
  yaar ye hai attendance = 68;
  yaar ye hai backlog = 0;

  yaar ye hai i = 0;
  jab tak grind (i < 10) {
    agar scene ho (i % 2 == 0) {
      i += 1;
      skip kar;
    }
    attendance += 3;
    i += 1;
  }

  kaam karo check_future(cg, att) {
    agar scene ho (cg >= 9.0 && att >= 75) {
      lele result "FAANG ready hai bhai xa";
    } nahi to scene (cg >= 7.0) {
      lele result "Service company, thoda aur padh xa";
    } nahi to scene (cg >= 5.0) {
      lele result "GATE ki taiyari shuru kar yaar x&";
    } warna yaar {
      lele result "Bhai... family business? x";
    }
  }

  bol yaar "=== BTech Life Report ===";
  bol yaar "CGPA: ", cgpa;
  bol yaar "Final Attendance: ", attendance;
  bol yaar "Backlog: ", backlog;
  bol yaar "Future: ", check_future(cgpa, attendance);
  bol yaar "========================";
main chala`
  },
  input: {
    file: 'input_demo.meme',
    requiresInput: true,
    code: `padh le bhai
  bol yaar "Apna naam daalo yaar: ";
  sun yaar naam;

  bol yaar "Apna CGPA daalo: ";
  sun yaar cgpa;

  bol yaar "Hello, ", naam, "! Tera CGPA hai: ", cgpa;

  agar scene ho (cgpa >= 7.5) {
    bol yaar "Achha hai yaar! Keep grinding x";
  } nahi to scene (cgpa >= 6.0) {
    bol yaar "Theek thak hai, thoda aur padh xa";
  } warna yaar {
    bol yaar "Bhai... uthao kitaab x";
  }
main chala`
  }
};

//  DOM REFS 

const editor    = document.getElementById('code-editor');
const consolEl  = document.getElementById('output-console');
const status    = document.getElementById('output-status');
const lineNums  = document.getElementById('line-nums');
const fileLabel = document.getElementById('file-label');
const runBtn    = document.getElementById('run-btn');
const tokenTbody = document.getElementById('token-tbody');
const tokenConsole = document.getElementById('token-console');
const outputConsole = document.getElementById('output-console');
const stdinSection = document.getElementById('stdin-queue-section');
const stdinItems   = document.getElementById('stdin-items');
const stdinInput   = document.getElementById('stdin-queue-input');

let stdinQueue = [];
let showingTokens = false;

//  BACKEND URL 

const API = window.location.origin; // Same origin since backend serves frontend

//  SERVER STATUS CHECK 

async function checkServer() {
  const dot  = document.getElementById('status-dot');
  const text = document.getElementById('status-text');
  try {
    const r = await fetch(`${API}/api/health`, { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      dot.className  = 'status-dot online';
      text.textContent = 'server online';
    } else throw new Error();
  } catch {
    dot.className  = 'status-dot offline';
    text.textContent = 'server offline';
  }
}
checkServer();
setInterval(checkServer, 15000);

//  TAB MANAGEMENT 

function showTab(tab) {
  showingTokens = tab === 'tokens';
  document.getElementById('tab-output').classList.toggle('active', !showingTokens);
  document.getElementById('tab-tokens').classList.toggle('active', showingTokens);
  outputConsole.style.display = showingTokens ? 'none' : 'block';
  tokenConsole.style.display  = showingTokens ? 'block' : 'none';
}

function toggleTokenView() {
  showTab(showingTokens ? 'output' : 'tokens');
}

//  STDIN QUEUE 

function addStdinItem() {
  const val = stdinInput.value.trim();
  if (!val) return;
  stdinQueue.push(val);
  stdinInput.value = '';
  renderStdin();
}

function removeStdinItem(i) {
  stdinQueue.splice(i, 1);
  renderStdin();
}

function clearStdin() {
  stdinQueue = [];
  renderStdin();
}

function renderStdin() {
  stdinItems.innerHTML = stdinQueue.map((v, i) =>
    `<div class="stdin-chip">${v} <button onclick="removeStdinItem(${i})"></button></div>`
  ).join('');
}

stdinInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') addStdinItem();
});

//  LINE NUMBERS 

function updateLineNums() {
  const lines = editor.value.split('\n').length;
  let html = '';
  for (let i = 1; i <= lines; i++) html += `<span>${i}</span>`;
  lineNums.innerHTML = html;
}

function syncScroll() {
  lineNums.scrollTop = editor.scrollTop;
}

function handleTab(e) {
  if (e.key === 'Tab') {
    e.preventDefault();
    const s = editor.selectionStart, end = editor.selectionEnd;
    editor.value = editor.value.substring(0, s) + '  ' + editor.value.substring(end);
    editor.selectionStart = editor.selectionEnd = s + 2;
    updateLineNums();
  }
}

//  OUTPUT HELPERS 

function addLine(text, cls = 'out') {
  const div = document.createElement('div');
  div.className = 'out-line ' + cls;
  div.textContent = text;
  outputConsole.appendChild(div);
  outputConsole.scrollTop = outputConsole.scrollHeight;
}

function setStatus(s, text) {
  status.className = 'output-status ' + s;
  status.textContent = text;
}

function clearOutput() {
  outputConsole.innerHTML = '';
  tokenTbody.innerHTML = '';
  addLine('// Output cleared', 'sys');
  setStatus('ready', 'READY');
}

//  PRESET LOADER 

function loadPreset(name) {
  const p = PRESETS[name];
  if (!p) return;
  editor.value = p.code;
  fileLabel.textContent = p.file;
  updateLineNums();
  clearOutput();
  addLine(`// Loaded: ${p.file}`, 'sys');

  // Show/hide stdin section
  stdinSection.style.display = p.requiresInput ? 'block' : 'none';
  if (p.requiresInput) {
    addLine('// This program uses sun yaar  add stdin inputs above the IDE', 'warn');
  }
}

//  RENDER TOKENS 

function renderTokens(tokens) {
  tokenTbody.innerHTML = tokens.map((t, i) =>
    `<tr>
      <td class="tok-line">${i + 1}</td>
      <td class="tok-type">${t.type}</td>
      <td class="tok-val">${t.value === null ? '' : String(t.value)}</td>
      <td class="tok-line">${t.line}</td>
    </tr>`
  ).join('');
}

//  RUN CODE 

async function runCode() {
  clearOutput();
  setStatus('running', 'RUNNING');
  runBtn.disabled = true;
  runBtn.textContent = ' RUNNING';

  const code = editor.value;

  addLine('// MemeLang v1.0  Sending to backend xa', 'sys');
  addLine(`// POST ${API}/api/run`, 'sys');
  addLine('// ' + ''.repeat(40), 'sys');

  try {
    const res = await fetch(`${API}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, inputs: stdinQueue }),
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}  Server ne reject kar diya`);
    }

    const data = await res.json();

    // Render tokens if available
    if (data.tokens && data.tokens.length > 0) {
      renderTokens(data.tokens);
    }

    if (data.error) {
      addLine('// ' + ''.repeat(40), 'sys');
      addLine(data.error, 'err');
      addLine('// R Program crashed  classic BTech moment', 'err');
      setStatus('error', 'ERROR');
    } else {
      // Print output lines
      const outputLines = (data.output || '').split('\n');
      for (const line of outputLines) {
        if (line !== '') addLine(line, 'out');
      }
      addLine('// ' + ''.repeat(40), 'sys');
      addLine('// S& main chala  Program exited successfully', 'ok');
      setStatus('ok', 'OK');
    }

  } catch (err) {
    addLine('// ' + ''.repeat(40), 'sys');
    if (err.name === 'TimeoutError') {
      addLine('ERROR: Request timeout  server ka kuch hua bhai x', 'err');
    } else if (err.message.includes('Failed to fetch')) {
      addLine('ERROR: Cannot connect to backend  server start kiya kya? Run: npm start', 'err');
      addLine('// Hint: cd memelang && npm install && npm start', 'warn');
    } else {
      addLine('ERROR: ' + err.message, 'err');
    }
    setStatus('error', 'ERROR');
  }

  runBtn.disabled = false;
  runBtn.textContent = ' \u00a0RUN .meme';
}

//  INIT 

loadPreset('hello');
