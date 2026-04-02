'use strict';

const TT = {
  START: 'START', END: 'END', VAR: 'VAR', PRINT: 'PRINT', INPUT: 'INPUT',
  IF: 'IF', ELIF: 'ELIF', ELSE: 'ELSE', WHILE: 'WHILE', BREAK: 'BREAK',
  CONT: 'CONT', FUNC: 'FUNC', RETURN: 'RETURN',
  TRUE: 'TRUE', FALSE: 'FALSE', NULL: 'NULL',
  IDENT: 'IDENT', NUMBER: 'NUMBER', STRING: 'STRING',
  PLUS: 'PLUS', MINUS: 'MINUS', STAR: 'STAR', SLASH: 'SLASH', MOD: 'MOD',
  EQ: 'EQ', NEQ: 'NEQ', LT: 'LT', GT: 'GT', LTE: 'LTE', GTE: 'GTE',
  AND: 'AND', OR: 'OR', NOT: 'NOT',
  ASSIGN: 'ASSIGN', PLUS_EQ: 'PLUS_EQ', MINUS_EQ: 'MINUS_EQ',
  STAR_EQ: 'STAR_EQ', SLASH_EQ: 'SLASH_EQ',
  LPAREN: 'LPAREN', RPAREN: 'RPAREN', LBRACE: 'LBRACE', RBRACE: 'RBRACE',
  COMMA: 'COMMA', SEMI: 'SEMI', EOF: 'EOF'
};

class Token {
  constructor(type, value, line) {
    this.type = type;
    this.value = value;
    this.line = line;
  }
}

module.exports = { TT, Token };
