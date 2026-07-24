import { TRACTATUS, type StatementSource } from '../data/tractatus';

export interface Statement {
  n: string;
  text: string;
  refs: string[];
  parent: string | null;
  children: string[];
  depth: number;
}

export interface Tree {
  STATEMENTS: Statement[];
  byId: Map<string, Statement>;
  ROOT_IDS: string[];
  statement: (n: string) => Statement;
  ancestorsOf: (n: string) => string[];
  descendantsOf: (n: string) => string[];
}

/**
 * Build the derived tree (flat reading order + lookups) from authored sources.
 * The app uses the singleton `buildTree(TRACTATUS)` re-exported below; tests
 * build a small fixture tree so their assertions don't depend on the full text.
 */
export function buildTree(sources: StatementSource[]): Tree {
  const STATEMENTS: Statement[] = [];
  const byId = new Map<string, Statement>();

  (function walk(nodes: StatementSource[], parent: string | null, depth: number) {
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
  })(sources, null, 0);

  function statement(n: string): Statement {
    const s = byId.get(n);
    if (!s) throw new Error(`Unknown statement: ${n}`);
    return s;
  }

  /** Ancestor ids of `n`, nearest first (parent, grandparent, …). */
  function ancestorsOf(n: string): string[] {
    const out: string[] = [];
    let p = statement(n).parent;
    while (p !== null) {
      out.push(p);
      p = statement(p).parent;
    }
    return out;
  }

  /** Ids in the subtree rooted at `n`, excluding `n` itself. */
  function descendantsOf(n: string): string[] {
    const out: string[] = [];
    const stack = [...statement(n).children];
    while (stack.length) {
      const id = stack.shift()!;
      out.push(id);
      stack.unshift(...statement(id).children);
    }
    return out;
  }

  return {
    STATEMENTS,
    byId,
    ROOT_IDS: sources.map((r) => r.n),
    statement,
    ancestorsOf,
    descendantsOf,
  };
}

const tree = buildTree(TRACTATUS);

/** All statements in reading (decimal) order — depth-first over the authored tree. */
export const STATEMENTS = tree.STATEMENTS;
export const byId = tree.byId;
export const ROOT_IDS = tree.ROOT_IDS;
export const statement = tree.statement;
export const ancestorsOf = tree.ancestorsOf;
export const descendantsOf = tree.descendantsOf;
