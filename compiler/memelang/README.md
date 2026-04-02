# MemeLang   The BTech CSE Programming Language

> A programming language for people who haven't slept since Tuesday.

**Team:** Core Dumpers  **Course:** Compiler Design PBL  **Year:** BTech CSE 3rd Year

---

##  Project Structure

```
memelang/
 backend/
    interpreter.js    Lexer + Parser + Interpreter (Node.js)
    server.js         Express.js REST API
 frontend/
    index.html        Full IDE UI (connects to backend)
 package.json
 README.md
```

---

##  How to Run

```bash
# 1. Install dependencies
npm install

# 2. Start the server
npm start

# 3. Open in browser
# http://localhost:3000
```

---

##  API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| POST | `/api/run` | Run MemeLang code |
| POST | `/api/tokenize` | Get token stream only |
| POST | `/api/parse` | Get AST only |
| GET | `/api/examples` | Preset example programs |

### POST /api/run

**Request:**
```json
{
  "code": "padh le bhai\n  bol yaar \"Hello\";\nmain chala",
  "inputs": ["Abhay", "7.5"]
}
```

**Response:**
```json
{
  "output": "Hello",
  "error": null,
  "tokens": [...],
  "ast": {...}
}
```

---

##  MemeLang Syntax

```
padh le bhai            Program start (required)
  yaar ye hai x = 10;   Variable declaration
  bol yaar x;           Print
  sun yaar name;        Input (stdin)

  agar scene ho (x > 5) {
    bol yaar "scene hai!";
  } nahi to scene (x == 5) {
    bol yaar "exactly 5";
  } warna yaar {
    bol yaar "nahi hua";
  }

  jab tak grind (x > 0) {
    x -= 1;
    bol yaar x;
    agar scene ho (x == 3) { bas kar yaar; }    break
    agar scene ho (x == 7) { skip kar; }         continue
  }

  kaam karo myFunc(a, b) {
    lele result a + b;    return
  }

  bol yaar myFunc(3, 4);

  // bhai sun  single line comment
  /* ruk yaar  multi line comment */

  yaar ye hai flag = scene hai;       true
  yaar ye hai flag2 = scene nahi;     false
  yaar ye hai ptr = null pointer tha;  null
main chala                            Program end (required)
```

---

##  Compiler Architecture

```
Source Code (.meme)
      
  [Lexer]  Token Stream (20+ token types)
      
  [Parser]  Abstract Syntax Tree (Recursive Descent, LL(1))
      
  [Interpreter]  Tree-Walk Evaluation
        (Environment chain for scoping, closures)
  Output / Errors
      
  [Express API]  JSON Response  Frontend
```

### Phases:
1. **Lexical Analysis**  Lexer tokenizes source into `TOK_START`, `TOK_VAR`, `TOK_PRINT`, etc.
2. **Syntax Analysis**  Recursive Descent Parser builds AST
3. **Semantic Analysis**  Checked at eval time (undeclared vars, type mismatches)
4. **Interpretation**  Tree-walk evaluator with scoped Environments
5. **HTTP Layer**  Express.js serves frontend + API

---

##  Error Codes

| Code | Trigger | Message |
|------|---------|---------|
| ERR_001 | Missing `padh le bhai` | Bhai padha kya? Program shuru karna bhool gaya  |
| ERR_002 | Missing `main chala` | Bhai gaya kahan? main chala likha nahi  |
| ERR_003 | Undeclared variable | Ye variable attend nahi kiya kabhi |
| ERR_005 | Division by zero | Zero se divide?! CGPA se bhi bura hai |
| ERR_006 | Missing semicolon | Semicolon bhool gaya  marks katenge bhai  |
| ERR_007 | Unclosed `{` | Curly bracket band nahi kiya |
| ERR_008 | Undeclared function | Function bula raha hai jo aaya hi nahi |

---

*Built with sleep deprivation & chai   Core Dumpers, Compiler Design PBL*
