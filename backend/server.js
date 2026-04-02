'use strict';

const express = require('express');
const cors = require('cors');
const path = require('path');
const { runMemeLang, Lexer, Parser, TT } = require('./interpreter');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

//  HEALTH CHECK 

app.get('/api/health', (req, res) => {
  res.json({
    status: 'alive',
    message: ' MemeLang server chal raha hai bhai!',
    version: '1.0.0',
    team: 'Core Dumpers'
  });
});

//  RUN CODE 

app.post('/api/run', async (req, res) => {
  try {
    const { code, inputs } = req.body;

    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ output: 'ERROR: Code daal bhai, blank kya submit kar raha hai ' });
    }

    const result = await runMemeLang(code, Array.isArray(inputs) ? inputs : []);
    res.json(result);

  } catch (err) {
    res.status(500).json({
      output: 'ERROR: Server side crash  classic bhai moment ',
      error: err.message
    });
  }
});

//  TOKENIZE (for educational view) 

app.post('/api/tokenize', (req, res) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Code string chahiye bhai' });
    }

    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    res.json({
      tokens: tokens.map(t => ({
        type: t.type,
        value: t.value === null ? 'EOF' : String(t.value),
        line: t.line
      }))
    });
  } catch (err) {
    res.json({ error: err.message, tokens: [] });
  }
});

//  PARSE (returns AST) 

app.post('/api/parse', (req, res) => {
  try {
    const { code } = req.body;
    if (typeof code !== 'string') {
      return res.status(400).json({ error: 'Code string chahiye bhai' });
    }

    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    const ast = parser.parse();

    res.json({ ast });
  } catch (err) {
    res.json({ error: err.message, ast: null });
  }
});

//  EXAMPLES 

app.get('/api/examples', (req, res) => {
  const examples = [
    {
      name: 'Hello World',
      file: 'hello_world.meme',
      emoji: '',
      code: `padh le bhai
  bol yaar "Bhai exam kal hai! ";
  bol yaar "Phir bhi yahan hoon code likhne...";
  bol yaar "Thug life. ";
main chala`
    },
    {
      name: 'CGPA Calculator',
      file: 'cgpa_calc.meme',
      emoji: '',
      code: `padh le bhai
  // bhai sun  CGPA calculator
  yaar ye hai cgpa = 6.9;
  yaar ye hai naam = "Sigma Bhai";
  yaar ye hai pass_hua = scene hai;
  yaar ye hai girlfriend = null pointer tha;

  cgpa = cgpa + 0.1;
  bol yaar naam, " ka CGPA: ", cgpa;
  bol yaar "Pass hua: ", pass_hua;
  bol yaar "Girlfriend: ", girlfriend;

  agar scene ho (cgpa >= 7.5) {
    bol yaar "Decent score bhai! ";
  } nahi to scene (cgpa >= 6.0) {
    bol yaar "Thoda aur grind kar yaar ";
  } warna yaar {
    bol yaar "Bhai... GATE bharo ";
  }
main chala`
    },
    {
      name: 'Backlog Loop',
      file: 'backlog_grind.meme',
      emoji: '',
      code: `padh le bhai
  yaar ye hai subjects_pending = 5;
  yaar ye hai total_done = 0;

  jab tak grind (subjects_pending > 0) {
    agar scene ho (subjects_pending == 3) {
      bol yaar "Raat ke 3 baj gaye, chai peeta hoon ";
      subjects_pending -= 1;
      skip kar;
    }
    agar scene ho (subjects_pending == 1) {
      bol yaar "Ek chhod deta hoon, grace aayega ";
      bas kar yaar;
    }
    subjects_pending -= 1;
    total_done += 1;
    bol yaar "Subject clear! Remaining: ", subjects_pending;
  }

  bol yaar "Total subjects done: ", total_done;
  bol yaar "Bhai kar diya! ";
main chala`
    },
    {
      name: 'Placement Checker',
      file: 'placement.meme',
      emoji: '',
      code: `padh le bhai

  /* ruk yaar
     Ye function check karta hai ki placement milegi ya nahi
  */
  kaam karo placement_milegi(cgpa, dsa_done) {
    agar scene ho (cgpa >= 8.0 && dsa_done == scene hai) {
      lele result "Google le jayega bhai ";
    } nahi to scene (cgpa >= 6.5) {
      lele result "Service company pakki ";
    } warna yaar {
      lele result "Bhai GATE bharo ";
    }
  }

  yaar ye hai mera_cgpa = 7.2;
  yaar ye hai dsa = scene nahi;
  bol yaar "Result: ", placement_milegi(mera_cgpa, dsa);

  yaar ye hai topper_cgpa = 9.2;
  yaar ye hai topper_dsa = scene hai;
  bol yaar "Topper ka result: ", placement_milegi(topper_cgpa, topper_dsa);

main chala`
    },
    {
      name: 'BTech Life Sim',
      file: 'btech_life.meme',
      emoji: '',
      code: `padh le bhai
  // bhai sun  Full BTech life simulation
  yaar ye hai cgpa = 7.5;
  yaar ye hai attendance = 68;
  yaar ye hai backlog = 0;

  // attendance boost loop
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
      lele result "FAANG ready hai bhai ";
    } nahi to scene (cg >= 7.0) {
      lele result "Service company, thoda aur padh ";
    } nahi to scene (cg >= 5.0) {
      lele result "GATE ki taiyari shuru kar yaar ";
    } warna yaar {
      lele result "Bhai... family business? ";
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
    {
      name: 'Input Demo',
      file: 'input_demo.meme',
      emoji: '',
      code: `padh le bhai
  bol yaar "Apna naam daalo yaar: ";
  sun yaar naam;

  bol yaar "Apna CGPA daalo: ";
  sun yaar cgpa;

  bol yaar "Hello, ", naam, "! Tera CGPA hai: ", cgpa;

  agar scene ho (cgpa >= 7.5) {
    bol yaar "Achha hai yaar! Keep grinding ";
  } nahi to scene (cgpa >= 6.0) {
    bol yaar "Theek thak hai, thoda aur padh ";
  } warna yaar {
    bol yaar "Bhai... uthao kitaab ";
  }
main chala`,
      requiresInput: true
    }
  ];

  res.json({ examples });
});

//  CATCH ALL  SERVE FRONTEND 

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

//  START SERVER 

app.listen(PORT, () => {
  console.log(`\n MemeLang Server  Core Dumpers Edition`);
  console.log(`   Running at: http://localhost:${PORT}`);
  console.log(`   API ready:  http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
