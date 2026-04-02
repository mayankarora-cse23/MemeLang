'use strict';

const { TT } = require('./tokens');

const N = {
  Program: (body) => ({ t: 'Program', body }),
  VarDecl: (name, init) => ({ t: 'VarDecl', name, init }),
  Assign: (name, op, val) => ({ t: 'Assign', name, op, val }),
  Print: (args) => ({ t: 'Print', args }),
  Input: (name) => ({ t: 'Input', name }),
  If: (cond, then, elifs, else_) => ({ t: 'If', cond, then, elifs, else_ }),
  While: (cond, body) => ({ t: 'While', cond, body }),
  FuncDecl: (name, params, body) => ({ t: 'FuncDecl', name, params, body }),
  Return: (val) => ({ t: 'Return', val }),
  Break: () => ({ t: 'Break' }),
  Continue: () => ({ t: 'Continue' }),
  Block: (stmts) => ({ t: 'Block', stmts }),
  BinOp: (op, left, right) => ({ t: 'BinOp', op, left, right }),
  UnaryOp: (op, operand) => ({ t: 'UnaryOp', op, operand }),
  Num: (v) => ({ t: 'Num', v }),
  Str: (v) => ({ t: 'Str', v }),
  Bool: (v) => ({ t: 'Bool', v }),
  Null: () => ({ t: 'Null' }),
  Ident: (name) => ({ t: 'Ident', name }),
  FuncCall: (name, args) => ({ t: 'FuncCall', name, args }),
};

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  error(msg, line) {
    const l = line || this.cur().line;
    throw new Error(`[ERR_PARSE] Line ${l}: ${msg}`);
  }

  cur() { return this.tokens[this.pos] || { type: TT.EOF, value: null, line: 0 }; }
  peek(n = 1) { return this.tokens[this.pos + n] || { type: TT.EOF, value: null, line: 0 }; }

  eat(type) {
    const t = this.cur();
    if (t.type !== type) {
      const friendly = {
        [TT.SEMI]: 'Semicolon bhool gaya  marks katenge bhai  (ERR_006)',
        [TT.RBRACE]: 'Curly bracket band nahi kiya  scope leak hua bhai (ERR_007)',
        [TT.RPAREN]: 'Closing bracket chahiye bhai',
        [TT.END]: 'Bhai gaya kahan? main chala likha nahi  (ERR_002)',
      };
      this.error(friendly[type] || `Expected ${type}, got '${t.value}' (${t.type})`);
    }
    return this.tokens[this.pos++];
  }

  match(...types) {
    if (types.includes(this.cur().type)) return this.tokens[this.pos++];
    return null;
  }

  check(...types) { return types.includes(this.cur().type); }

  parse() {
    if (!this.check(TT.START)) {
      this.error('Bhai padha kya? Program shuru karna bhool gaya   Missing: padh le bhai (ERR_001)', 1);
    }
    this.eat(TT.START);
    const body = this.parseStmtList();
    if (this.check(TT.EOF)) {
      this.error('Bhai gaya kahan? main chala likha nahi  (ERR_002)');
    }
    this.eat(TT.END);
    return N.Program(body);
  }

  parseStmtList() {
    const stmts = [];
    while (!this.check(TT.END, TT.RBRACE, TT.EOF)) {
      stmts.push(this.parseStmt());
    }
    return stmts;
  }

  parseStmt() {
    const t = this.cur();
    if (t.type === TT.VAR) return this.parseVarDecl();
    if (t.type === TT.PRINT) return this.parsePrint();
    if (t.type === TT.INPUT) return this.parseInput();
    if (t.type === TT.IF) return this.parseIf();
    if (t.type === TT.WHILE) return this.parseWhile();
    if (t.type === TT.FUNC) return this.parseFuncDecl();
    if (t.type === TT.RETURN) return this.parseReturn();
    if (t.type === TT.BREAK) { this.eat(TT.BREAK); this.match(TT.SEMI); return N.Break(); }
    if (t.type === TT.CONT) { this.eat(TT.CONT); this.match(TT.SEMI); return N.Continue(); }
    if (t.type === TT.LBRACE) return this.parseBlock();
    if (t.type === TT.IDENT) return this.parseAssignOrCall();
    this.error(`Unexpected token: '${t.value}'`);
  }

  parseVarDecl() {
    this.eat(TT.VAR);
    const name = this.eat(TT.IDENT).value;
    this.eat(TT.ASSIGN);
    const init = this.parseExpr();
    this.eat(TT.SEMI);
    return N.VarDecl(name, init);
  }

  parseAssignOrCall() {
    const name = this.eat(TT.IDENT).value;
    const assignOps = [TT.ASSIGN, TT.PLUS_EQ, TT.MINUS_EQ, TT.STAR_EQ, TT.SLASH_EQ];
    if (this.check(...assignOps)) {
      const op = this.tokens[this.pos++].value;
      const val = this.parseExpr();
      this.eat(TT.SEMI);
      return N.Assign(name, op, val);
    }
    if (this.check(TT.LPAREN)) {
      const args = this.parseArgList();
      this.eat(TT.SEMI);
      return N.FuncCall(name, args);
    }
    this.error(`Expected assignment or function call after '${name}'`);
  }

  parsePrint() {
    this.eat(TT.PRINT);
    const args = [this.parseExpr()];
    while (this.match(TT.COMMA)) args.push(this.parseExpr());
    this.eat(TT.SEMI);
    return N.Print(args);
  }

  parseInput() {
    this.eat(TT.INPUT);
    const name = this.eat(TT.IDENT).value;
    this.eat(TT.SEMI);
    return N.Input(name);
  }

  parseIf() {
    this.eat(TT.IF);
    this.eat(TT.LPAREN);
    const cond = this.parseExpr();
    this.eat(TT.RPAREN);
    const then = this.parseBlock();
    const elifs = [];
    let else_ = null;
    while (this.check(TT.ELIF)) {
      this.eat(TT.ELIF);
      this.eat(TT.LPAREN);
      const ec = this.parseExpr();
      this.eat(TT.RPAREN);
      const eb = this.parseBlock();
      elifs.push({ cond: ec, body: eb });
    }
    if (this.check(TT.ELSE)) {
      this.eat(TT.ELSE);
      else_ = this.parseBlock();
    }
    return N.If(cond, then, elifs, else_);
  }

  parseWhile() {
    this.eat(TT.WHILE);
    this.eat(TT.LPAREN);
    const cond = this.parseExpr();
    this.eat(TT.RPAREN);
    const body = this.parseBlock();
    return N.While(cond, body);
  }

  parseFuncDecl() {
    this.eat(TT.FUNC);
    const name = this.eat(TT.IDENT).value;
    this.eat(TT.LPAREN);
    const params = [];
    if (!this.check(TT.RPAREN)) {
      params.push(this.eat(TT.IDENT).value);
      while (this.match(TT.COMMA)) params.push(this.eat(TT.IDENT).value);
    }
    this.eat(TT.RPAREN);
    const body = this.parseBlock();
    return N.FuncDecl(name, params, body);
  }

  parseReturn() {
    this.eat(TT.RETURN);
    const val = this.parseExpr();
    this.eat(TT.SEMI);
    return N.Return(val);
  }

  parseBlock() {
    this.eat(TT.LBRACE);
    const stmts = this.parseStmtList();
    this.eat(TT.RBRACE);
    return N.Block(stmts);
  }

  parseArgList() {
    this.eat(TT.LPAREN);
    const args = [];
    if (!this.check(TT.RPAREN)) {
      args.push(this.parseExpr());
      while (this.match(TT.COMMA)) args.push(this.parseExpr());
    }
    this.eat(TT.RPAREN);
    return args;
  }

  parseExpr() { return this.parseOr(); }

  parseOr() {
    let left = this.parseAnd();
    while (this.check(TT.OR)) {
      const op = this.tokens[this.pos++].value;
      left = N.BinOp(op, left, this.parseAnd());
    }
    return left;
  }

  parseAnd() {
    let left = this.parseEquality();
    while (this.check(TT.AND)) {
      const op = this.tokens[this.pos++].value;
      left = N.BinOp(op, left, this.parseEquality());
    }
    return left;
  }

  parseEquality() {
    let left = this.parseRelational();
    while (this.check(TT.EQ, TT.NEQ)) {
      const op = this.tokens[this.pos++].value;
      left = N.BinOp(op, left, this.parseRelational());
    }
    return left;
  }

  parseRelational() {
    let left = this.parseAddSub();
    while (this.check(TT.LT, TT.GT, TT.LTE, TT.GTE)) {
      const op = this.tokens[this.pos++].value;
      left = N.BinOp(op, left, this.parseAddSub());
    }
    return left;
  }

  parseAddSub() {
    let left = this.parseMulDiv();
    while (this.check(TT.PLUS, TT.MINUS)) {
      const op = this.tokens[this.pos++].value;
      left = N.BinOp(op, left, this.parseMulDiv());
    }
    return left;
  }

  parseMulDiv() {
    let left = this.parseUnary();
    while (this.check(TT.STAR, TT.SLASH, TT.MOD)) {
      const op = this.tokens[this.pos++].value;
      left = N.BinOp(op, left, this.parseUnary());
    }
    return left;
  }

  parseUnary() {
    if (this.check(TT.NOT)) { this.pos++; return N.UnaryOp('!', this.parseUnary()); }
    if (this.check(TT.MINUS)) { this.pos++; return N.UnaryOp('-', this.parseUnary()); }
    return this.parsePrimary();
  }

  parsePrimary() {
    const t = this.cur();
    if (t.type === TT.NUMBER) { this.pos++; return N.Num(t.value); }
    if (t.type === TT.STRING) { this.pos++; return N.Str(t.value); }
    if (t.type === TT.TRUE) { this.pos++; return N.Bool(true); }
    if (t.type === TT.FALSE) { this.pos++; return N.Bool(false); }
    if (t.type === TT.NULL) { this.pos++; return N.Null(); }
    if (t.type === TT.IDENT) {
      this.pos++;
      if (this.check(TT.LPAREN)) {
        const args = this.parseArgList();
        return N.FuncCall(t.value, args);
      }
      return N.Ident(t.value);
    }
    if (t.type === TT.LPAREN) {
      this.eat(TT.LPAREN);
      const e = this.parseExpr();
      this.eat(TT.RPAREN);
      return e;
    }
    this.error(`Unexpected token in expression: '${t.value}' (${t.type})`);
  }
}

module.exports = { Parser };
