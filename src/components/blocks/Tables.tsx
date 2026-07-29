/*
  Truth-table figures (our own reproduction of the public-domain schemata).
  4.31 — three truth-possibility tables; 4.442 — a single schema in quotes;
  5.101 — the sixteen truth-functions of two elementary propositions.
*/

import { MathSpan } from '../MathSpan';

const V = ({ x }: { x: string }) => <i className="tt-var">{x}</i>;

function Grid({ vars, rows }: { vars: string[]; rows: string[][] }) {
  return (
    <table className="truthtable">
      <thead>
        <tr>
          {vars.map((v) => (
            <th key={v}>
              <V x={v} />
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Table4_31() {
  return (
    <div className="fig fig-tables">
      <Grid
        vars={['p', 'q', 'r']}
        rows={[
          ['T', 'T', 'T'],
          ['F', 'T', 'T'],
          ['T', 'F', 'T'],
          ['T', 'T', 'F'],
          ['F', 'F', 'T'],
          ['F', 'T', 'F'],
          ['T', 'F', 'F'],
          ['F', 'F', 'F'],
        ]}
      />
      <Grid
        vars={['p', 'q']}
        rows={[
          ['T', 'T'],
          ['F', 'T'],
          ['T', 'F'],
          ['F', 'F'],
        ]}
      />
      <Grid vars={['p']} rows={[['T'], ['F']]} />
    </div>
  );
}

export function Table4_442() {
  return (
    <div className="fig">
      <table className="truthtable tt-quoted">
        <thead>
          <tr>
            <th className="tt-quote">“</th>
            <th>
              <V x="p" />
            </th>
            <th>
              <V x="q" />
            </th>
            {/* Spacer + result columns: unlabelled in Wittgenstein's original, so
                <td>, not an empty <th> claiming to head a column it doesn't. */}
            <td />
            <td />
          </tr>
        </thead>
        <tbody>
          <tr>
            <td />
            <td>T</td>
            <td>T</td>
            <td>T</td>
            <td />
          </tr>
          <tr>
            <td />
            <td>F</td>
            <td>T</td>
            <td>T</td>
            <td />
          </tr>
          <tr>
            <td />
            <td>T</td>
            <td>F</td>
            <td />
            <td />
          </tr>
          <tr>
            <td />
            <td>F</td>
            <td>F</td>
            <td>T</td>
            <td className="tt-quote">”</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// The sixteen truth-functions: [truth-tuple] (p,q) | label | words | [formula]
interface Fn {
  tf: string;
  label: string;
  words: string;
  formula?: string;
}
const FUNCTIONS: Fn[] = [
  { tf: 'TTTT', label: 'Tautology', words: '(if p then p; and if q then q)', formula: 'p \\supset p . q \\supset q' },
  { tf: 'FTTT', label: 'in words:', words: 'Not both p and q.', formula: '\\sim(p . q)' },
  { tf: 'TFTT', label: '” ”', words: 'If q then p.', formula: 'q \\supset p' },
  { tf: 'TTFT', label: '” ”', words: 'If p then q.', formula: 'p \\supset q' },
  { tf: 'TTTF', label: '” ”', words: 'p or q.', formula: 'p \\lor q' },
  { tf: 'FFTT', label: '” ”', words: 'Not q.', formula: '\\sim q' },
  { tf: 'FTFT', label: '” ”', words: 'Not p.', formula: '\\sim p' },
  { tf: 'FTTF', label: '” ”', words: 'p or q, but not both.', formula: 'p . \\sim q \\mathbin{:}\\lor\\mathbin{:} q . \\sim p' },
  { tf: 'TFFT', label: '” ”', words: 'If p, then q; and if q, then p.', formula: 'p \\equiv q' },
  { tf: 'TFTF', label: '” ”', words: 'p' },
  { tf: 'TTFF', label: '” ”', words: 'q' },
  { tf: 'FFFT', label: '” ”', words: 'Neither p nor q.', formula: '\\sim p . \\sim q \\ \\text{or}\\ p \\mid q' },
  { tf: 'FFTF', label: '” ”', words: 'p and not q.', formula: 'p . \\sim q' },
  { tf: 'FTFF', label: '” ”', words: 'q and not p.', formula: 'q . \\sim p' },
  { tf: 'TFFF', label: '” ”', words: 'p and q.', formula: 'p . q' },
  { tf: 'FFFF', label: 'Contradiction', words: '(p and not p; and q and not q.)', formula: 'p . \\sim p . q . \\sim q' },
];

export function Table5_101() {
  return (
    <div className="fig fig-fnlist">
      <table className="fnlist">
        <tbody>
          {FUNCTIONS.map((fn, i) => (
            <tr key={i}>
              <td className="fn-tuple">
                ({fn.tf.split('').map((v, j) => (
                  <span key={j} className="fn-tf">
                    {v}
                  </span>
                ))})
              </td>
              <td className="fn-pair">
                <MathSpan latex="(p,\ q)" />
              </td>
              <td className="fn-label">{fn.label}</td>
              <td className="fn-words">
                {fn.words}
                {fn.formula && (
                  <>
                    {'  '}
                    <MathSpan latex={`[${fn.formula}]`} />
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
