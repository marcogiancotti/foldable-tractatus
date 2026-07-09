import { TRACTATUS, type StatementSource } from '../data/tractatus';

export interface Statement {
  n: string;
  text: string;
  refs: string[];
  parent: string | null;
  children: string[];
  depth: number;
}

/** All statements in reading (decimal) order — depth-first over the authored tree. */
export const STATEMENTS: Statement[] = [];

export const byId = new Map<string, Statement>();

function walk(nodes: StatementSource[], parent: string | null, depth: number) {
  for (const node of nodes) {
    const s: Statement = {
      n: node.n,
      text: node.text,
      refs: node.refs ?? [],
      parent,
      children: (node.children ?? []).map((c) => c.n),
      depth,
    };
    STATEMENTS.push(s);
    byId.set(s.n, s);
    walk(node.children ?? [], node.n, depth + 1);
  }
}
walk(TRACTATUS, null, 0);

export const ROOT_IDS = TRACTATUS.map((r) => r.n);

export function statement(n: string): Statement {
  const s = byId.get(n);
  if (!s) throw new Error(`Unknown statement: ${n}`);
  return s;
}

/** Ancestor ids of `n`, nearest first (parent, grandparent, …). */
export function ancestorsOf(n: string): string[] {
  const out: string[] = [];
  let p = statement(n).parent;
  while (p !== null) {
    out.push(p);
    p = statement(p).parent;
  }
  return out;
}

/** Ids in the subtree rooted at `n`, excluding `n` itself. */
export function descendantsOf(n: string): string[] {
  const out: string[] = [];
  const stack = [...statement(n).children];
  while (stack.length) {
    const id = stack.shift()!;
    out.push(id);
    stack.unshift(...statement(id).children);
  }
  return out;
}
