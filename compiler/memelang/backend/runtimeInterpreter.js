'use strict';

class ReturnSignal { constructor(val) { this.val = val; } }
class BreakSignal {}
class ContSignal {}

class Environment {
  constructor(parent = null) {
    this.vars = {};
    this.parent = parent;
  }
  get(name) {
    if (name in this.vars) return this.vars[name];
    if (this.parent) return this.parent.get(name);
    throw new Error(`[ERR_003] Ye variable attend nahi kiya kabhi  undeclared hai yaar: '${name}'`);
  }
  set(name, val) {
    if (name in this.vars) { this.vars[name] = val; return; }
    if (this.parent && this.parent.has(name)) { this.parent.set(name, val); return; }
    this.vars[name] = val;
  }
  define(name, val) { this.vars[name] = val; }
  has(name) { return name in this.vars || (this.parent ? this.parent.has(name) : false); }
}

class Interpreter {
  constructor() {
    this.globals = new Environment();
    this.outputLines = [];
    this.inputQueue = [];
    this.inputIndex = 0;
  }

  setInputs(inputs) {
    this.inputQueue = inputs || [];
    this.inputIndex = 0;
  }

  output(text) {
    this.outputLines.push(String(text));
  }

  async run(ast) {
    await this.execBlock(ast.body, this.globals);
  }

  async execBlock(stmts, env) {
    for (const stmt of stmts) {
      const r = await this.exec(stmt, env);
      if (r instanceof ReturnSignal || r instanceof BreakSignal || r instanceof ContSignal) return r;
    }
  }

  async exec(node, env) {
    switch (node.t) {
      case 'VarDecl': {
        const val = await this.eval(node.init, env);
        env.define(node.name, val);
        return;
      }
      case 'Assign': {
        const val = await this.eval(node.val, env);
        const cur = node.op !== '=' ? env.get(node.name) : null;
        let newVal;
        switch (node.op) {
          case '=': newVal = val; break;
          case '+=': newVal = this.add(cur, val); break;
          case '-=': newVal = cur - val; break;
          case '*=': newVal = cur * val; break;
          case '/=':
            if (val === 0) throw new Error('[ERR_005] Zero se divide?! Bhai ye toh CGPA se bhi bura hai');
            newVal = cur / val;
            break;
        }
        env.set(node.name, newVal);
        return;
      }
      case 'Print': {
        const parts = await Promise.all(node.args.map(a => this.eval(a, env)));
        this.output(parts.map(v => this.display(v)).join(''));
        return;
      }
      case 'Input': {
        let input = '';
        if (this.inputIndex < this.inputQueue.length) {
          input = String(this.inputQueue[this.inputIndex++]);
        }
        const num = parseFloat(input);
        env.define(node.name, isNaN(num) ? input : num);
        return;
      }
      case 'If': {
        const cond = await this.eval(node.cond, env);
        if (this.truthy(cond)) return await this.exec(node.then, env);
        for (const elif of node.elifs) {
          const ec = await this.eval(elif.cond, env);
          if (this.truthy(ec)) return await this.exec(elif.body, env);
        }
        if (node.else_) return await this.exec(node.else_, env);
        return;
      }
      case 'While': {
        let iterations = 0;
        while (this.truthy(await this.eval(node.cond, env))) {
          if (++iterations > 10000) {
            throw new Error('Infinite loop detected  jab tak grind ka infinite version  (max 10,000 iterations)');
          }
          const r = await this.exec(node.body, env);
          if (r instanceof BreakSignal) break;
          if (r instanceof ReturnSignal) return r;
        }
        return;
      }
      case 'FuncDecl': {
        env.define(node.name, { __func__: true, params: node.params, body: node.body, closure: env });
        return;
      }
      case 'Return': {
        const val = await this.eval(node.val, env);
        return new ReturnSignal(val);
      }
      case 'Break': return new BreakSignal();
      case 'Continue': return new ContSignal();
      case 'Block': {
        const inner = new Environment(env);
        return await this.execBlock(node.stmts, inner);
      }
      case 'FuncCall': {
        await this.callFunc(node.name, node.args, env);
        return;
      }
      default:
        throw new Error(`Unknown statement node: ${node.t}`);
    }
  }

  async eval(node, env) {
    switch (node.t) {
      case 'Num': return node.v;
      case 'Str': return node.v;
      case 'Bool': return node.v;
      case 'Null': return null;
      case 'Ident': return env.get(node.name);
      case 'FuncCall': return await this.callFunc(node.name, node.args, env);
      case 'UnaryOp': {
        const v = await this.eval(node.operand, env);
        if (node.op === '!') return !this.truthy(v);
        if (node.op === '-') return -v;
        break;
      }
      case 'BinOp': {
        const l = await this.eval(node.left, env);
        const r = await this.eval(node.right, env);
        switch (node.op) {
          case '+': return this.add(l, r);
          case '-': return l - r;
          case '*': return l * r;
          case '/':
            if (r === 0) throw new Error('[ERR_005] Zero se divide?! Bhai ye toh CGPA se bhi bura hai');
            return l / r;
          case '%':
            if (r === 0) throw new Error('[ERR_005] Modulo by zero bhi nahi chalta bhai');
            return l % r;
          case '==': return l === r;
          case '!=': return l !== r;
          case '<': return l < r;
          case '>': return l > r;
          case '<=': return l <= r;
          case '>=': return l >= r;
          case '&&': return this.truthy(l) && this.truthy(r);
          case '||': return this.truthy(l) || this.truthy(r);
        }
        break;
      }
    }
    throw new Error(`Cannot evaluate node: ${node.t}`);
  }

  async callFunc(name, argNodes, env) {
    const fn = env.get(name);
    if (!fn || !fn.__func__) {
      throw new Error(`[ERR_008] '${name}'  function bula raha hai jo aaya hi nahi  attendance zero`);
    }
    if (argNodes.length !== fn.params.length) {
      throw new Error(`Function '${name}': expects ${fn.params.length} args, got ${argNodes.length}`);
    }
    const args = await Promise.all(argNodes.map(a => this.eval(a, env)));
    const inner = new Environment(fn.closure);
    fn.params.forEach((p, i) => inner.define(p, args[i]));
    const r = await this.exec(fn.body, inner);
    if (r instanceof ReturnSignal) return r.val;
    return null;
  }

  add(a, b) {
    if (typeof a === 'string' || typeof b === 'string') {
      return this.display(a) + this.display(b);
    }
    return a + b;
  }

  truthy(v) {
    if (v === null || v === undefined) return false;
    if (v === false) return false;
    if (v === 0) return false;
    if (v === '') return false;
    return true;
  }

  display(v) {
    if (v === null) return 'null pointer tha';
    if (v === true) return 'scene hai';
    if (v === false) return 'scene nahi';
    if (typeof v === 'number') {
      if (Number.isInteger(v)) return String(v);
      return String(Math.round(v * 1000000) / 1000000);
    }
    return String(v);
  }
}

module.exports = { Interpreter };