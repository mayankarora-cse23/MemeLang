'use strict';

const { TT, Token } = require('./tokens');
const { Lexer } = require('./lexer');
const { Parser } = require('./parser');
const { Interpreter } = require('./runtimeInterpreter');

async function runMemeLang(code, inputs = []) {
  const result = {
    output: '',
    error: null,
    tokens: [],
    ast: null,
  };

  try {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();
    result.tokens = tokens.map(t => ({ type: t.type, value: t.value, line: t.line }));

    const parser = new Parser(tokens);
    const ast = parser.parse();
    result.ast = ast;

    const interp = new Interpreter();
    interp.setInputs(inputs);
    await interp.run(ast);
    result.output = interp.outputLines.join('\n');
  } catch (err) {
    result.error = err.message;
    result.output = 'ERROR: ' + err.message;
  }

  return result;
}

module.exports = { runMemeLang, Lexer, Parser, Interpreter, Token, TT };