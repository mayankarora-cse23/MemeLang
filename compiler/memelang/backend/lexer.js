'use strict';

const { TT, Token } = require('./tokens');

class Lexer {
  constructor(src) {
    this.src = src;
    this.pos = 0;
    this.line = 1;
    this.tokens = [];
  }

  error(msg) {
    throw new Error(`[ERR_LEX] Line ${this.line}: ${msg}`);
  }

  peek(offset = 0) { return this.src[this.pos + offset] || ''; }

  advance() {
    const c = this.src[this.pos++];
    if (c === '\n') this.line++;
    return c;
  }

  skipWhitespace() {
    while (this.pos < this.src.length && /[ \t\r\n]/.test(this.src[this.pos])) {
      this.advance();
    }
  }

  tokenize() {
    const kwMap = [
      ['padh le bhai', TT.START],
      ['main chala', TT.END],
      ['yaar ye hai', TT.VAR],
      ['bol yaar', TT.PRINT],
      ['sun yaar', TT.INPUT],
      ['agar scene ho', TT.IF],
      ['nahi to scene', TT.ELIF],
      ['warna yaar', TT.ELSE],
      ['jab tak grind', TT.WHILE],
      ['bas kar yaar', TT.BREAK],
      ['skip kar', TT.CONT],
      ['kaam karo', TT.FUNC],
      ['lele result', TT.RETURN],
      ['scene hai', TT.TRUE],
      ['scene nahi', TT.FALSE],
      ['null pointer tha', TT.NULL],
    ];

    while (this.pos < this.src.length) {
      this.skipWhitespace();
      if (this.pos >= this.src.length) break;

      const line = this.line;
      const c = this.src[this.pos];

      if (c === '/' && this.peek(1) === '/') {
        while (this.pos < this.src.length && this.src[this.pos] !== '\n') this.advance();
        continue;
      }

      if (c === '/' && this.peek(1) === '*') {
        this.advance(); this.advance();
        while (this.pos < this.src.length) {
          if (this.src[this.pos] === '*' && this.peek(1) === '/') {
            this.advance(); this.advance(); break;
          }
          this.advance();
        }
        continue;
      }

      let matched = false;
      for (const [kw, type] of kwMap) {
        if (this.src.startsWith(kw, this.pos)) {
          for (let i = 0; i < kw.length; i++) this.advance();
          this.tokens.push(new Token(type, kw, line));
          matched = true;
          break;
        }
      }
      if (matched) continue;

      if (c === '"' || c === "'") {
        const quote = this.advance();
        let s = '';
        while (this.pos < this.src.length && this.src[this.pos] !== quote) {
          if (this.src[this.pos] === '\\') {
            this.advance();
            const esc = this.advance();
            s += ({ n: '\n', t: '\t', r: '\r' }[esc] || esc);
          } else {
            s += this.advance();
          }
        }
        if (this.pos >= this.src.length) this.error('Unterminated string literal');
        this.advance();
        this.tokens.push(new Token(TT.STRING, s, line));
        continue;
      }

      if (/[0-9]/.test(c) || (c === '-' && /[0-9]/.test(this.peek(1)) &&
        (this.tokens.length === 0 || [TT.ASSIGN, TT.PLUS_EQ, TT.MINUS_EQ,
          TT.STAR_EQ, TT.SLASH_EQ, TT.LPAREN, TT.COMMA, TT.SEMI,
          TT.PRINT, TT.RETURN].includes(this.tokens[this.tokens.length - 1]?.type)))) {
        let num = '';
        if (c === '-') num += this.advance();
        while (this.pos < this.src.length && /[0-9]/.test(this.src[this.pos])) num += this.advance();
        if (this.src[this.pos] === '.') {
          num += this.advance();
          while (this.pos < this.src.length && /[0-9]/.test(this.src[this.pos])) num += this.advance();
        }
        this.tokens.push(new Token(TT.NUMBER, parseFloat(num), line));
        continue;
      }

      const ops2 = [
        ['==', TT.EQ], ['!=', TT.NEQ], ['<=', TT.LTE], ['>=', TT.GTE],
        ['&&', TT.AND], ['||', TT.OR],
        ['+=', TT.PLUS_EQ], ['-=', TT.MINUS_EQ], ['*=', TT.STAR_EQ], ['/=', TT.SLASH_EQ]
      ];
      let m2 = false;
      for (const [op, type] of ops2) {
        if (this.src.startsWith(op, this.pos)) {
          this.advance(); this.advance();
          this.tokens.push(new Token(type, op, line));
          m2 = true; break;
        }
      }
      if (m2) continue;

      const ops1 = [
        ['<', TT.LT], ['>', TT.GT], ['+', TT.PLUS], ['-', TT.MINUS],
        ['*', TT.STAR], ['/', TT.SLASH], ['%', TT.MOD], ['!', TT.NOT],
        ['=', TT.ASSIGN], ['(', TT.LPAREN], [')', TT.RPAREN],
        ['{', TT.LBRACE], ['}', TT.RBRACE], [',', TT.COMMA], [';', TT.SEMI]
      ];
      let m1 = false;
      for (const [op, type] of ops1) {
        if (c === op) {
          this.advance();
          this.tokens.push(new Token(type, op, line));
          m1 = true; break;
        }
      }
      if (m1) continue;

      if (/[a-zA-Z_]/.test(c)) {
        let ident = '';
        while (this.pos < this.src.length && /[a-zA-Z0-9_]/.test(this.src[this.pos])) {
          ident += this.advance();
        }
        this.tokens.push(new Token(TT.IDENT, ident, line));
        continue;
      }

      this.error(`Unexpected character: '${c}'`);
    }

    this.tokens.push(new Token(TT.EOF, null, this.line));
    return this.tokens;
  }
}

module.exports = { Lexer };
