/*
  Diagram figures — our own SVG reproductions of the public-domain figures
  (kept MIT-clean; not Klement's typeset images). currentColor throughout so
  they follow the reading theme.
*/

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4 } as const;

// 5.5423 — the Necker (ambiguous) cube: two offset squares, corners a (front)
// and b (back). Coordinates map the LaTeX unit grid (scale 40, y flipped).
export function Cube() {
  const s = 40,
    pad = 22,
    maxY = 3;
  const P = (x: number, y: number): [number, number] => [pad + x * s, pad + (maxY - y) * s];
  const front = [P(0, 0), P(2, 0), P(2, 2), P(0, 2)];
  const back = [P(1, 1), P(3, 1), P(3, 3), P(1, 3)];
  const poly = (pts: [number, number][]) => pts.map((p) => p.join(',')).join(' ');
  const diag: [[number, number], [number, number]][] = [
    [P(0, 0), P(1, 1)],
    [P(0, 2), P(1, 3)],
    [P(2, 2), P(3, 3)],
    [P(2, 0), P(3, 1)],
  ];
  return (
    <div className="fig">
      <svg className="fig-svg" viewBox="0 0 184 184" role="img" aria-label="An ambiguous cube figure">
        <polygon {...S} points={poly(front)} />
        <polygon {...S} points={poly(back)} />
        {diag.map(([a, b], i) => (
          <line key={i} {...S} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
        ))}
        {front.map((p, i) => (
          <text key={`a${i}`} className="fig-label" x={p[0]} y={p[1]} dx={-6} dy={14}>
            a
          </text>
        ))}
        {back.map((p, i) => (
          <text key={`b${i}`} className="fig-label" x={p[0]} y={p[1]} dx={4} dy={-4}>
            b
          </text>
        ))}
      </svg>
    </div>
  );
}

// 5.6331 — the visual field is NOT bounded like this: an eye and a field arc.
export function Eye() {
  return (
    <div className="fig">
      <svg className="fig-svg" viewBox="0 0 200 130" role="img" aria-label="An eye and a curved boundary">
        <text className="fig-label" x={8} y={69}>
          Eye
        </text>
        <line {...S} x1={40} y1={65} x2={58} y2={65} />
        <circle {...S} cx={66} cy={65} r={7} />
        <path {...S} d="M 78 62 C 150 20 150 110 78 70" />
      </svg>
    </div>
  );
}

// 6.36111 — two congruent one-dimensional figures a and b: ···∘—a—×  ×---∘—b—∘···
export function Line() {
  const y = 30;
  const x = (u: number) => 12 + u * 56;
  const cross = (cx: number) => (
    <>
      <line {...S} x1={cx - 4} y1={y - 4} x2={cx + 4} y2={y + 4} />
      <line {...S} x1={cx - 4} y1={y + 4} x2={cx + 4} y2={y - 4} />
    </>
  );
  return (
    <div className="fig">
      <svg className="fig-svg" viewBox="0 0 260 56" role="img" aria-label="Two congruent segments a and b on a line">
        <line {...S} strokeDasharray="3 3" x1={x(0.4)} y1={y} x2={x(1)} y2={y} />
        <circle {...S} cx={x(1)} cy={y} r={3.5} />
        <line {...S} x1={x(1)} y1={y} x2={x(2)} y2={y} />
        {cross(x(2))}
        <line {...S} strokeDasharray="3 3" x1={x(2)} y1={y} x2={x(2.55)} y2={y} />
        {cross(x(2.55))}
        <line {...S} x1={x(2.55)} y1={y} x2={x(3.55)} y2={y} />
        <circle {...S} cx={x(3.55)} cy={y} r={3.5} />
        <line {...S} strokeDasharray="3 3" x1={x(3.65)} y1={y} x2={x(4.25)} y2={y} />
        <text className="fig-label" x={x(1.5)} y={y + 18} textAnchor="middle">
          a
        </text>
        <text className="fig-label" x={x(3.05)} y={y + 18} textAnchor="middle">
          b
        </text>
      </svg>
    </div>
  );
}

/*
  6.1203 — Wittgenstein's T-F ("ab") notation. Each variable is written T–x–F;
  brackets tie the truth-arguments together, and (from fig. 2 on) lines tie the
  truth of the whole proposition to particular truth-combinations. Reproduced as
  SVG in the same left/right layout as the original (p on the left, q on the
  right), with the specific correlation lines of each figure.
*/
function AbFrame({
  children,
  label,
  width = 300,
}: {
  children: React.ReactNode;
  label: string;
  width?: number;
}) {
  return (
    <div className="fig">
      <svg
        className="fig-svg fig-ab"
        viewBox={`0 0 ${width} 120`}
        role="img"
        aria-label={label}
      >
        {/* p group (left) and q group (right) */}
        <text className="fig-tf" x={26} y={64}>
          T
        </text>
        <text className="fig-var" x={44} y={64}>
          p
        </text>
        <text className="fig-tf" x={62} y={64}>
          F
        </text>
        <text className="fig-tf" x={width - 74} y={64}>
          T
        </text>
        <text className="fig-var" x={width - 56} y={64}>
          q
        </text>
        <text className="fig-tf" x={width - 38} y={64}>
          F
        </text>
        {children}
      </svg>
    </div>
  );
}

// The four brackets linking p's and q's truth values above and below the line.
function baseBrackets(width: number) {
  const pT = 30,
    pF = 66,
    qT = width - 70,
    qF = width - 34;
  return (
    <>
      {/* outer: T(p) — T(q) over the top */}
      <path {...S} d={`M ${pT} 56 C ${pT} 18, ${qT} 18, ${qT} 56`} />
      {/* inner upper: T(p) — F(q) */}
      <path {...S} d={`M ${pT} 56 C ${pT} 34, ${qF} 34, ${qF} 56`} />
      {/* lower: F(p) — T(q) below */}
      <path {...S} d={`M ${pF} 68 C ${pF} 90, ${qT} 90, ${qT} 68`} />
      {/* outer lower: F(p) — F(q) */}
      <path {...S} d={`M ${pF} 68 C ${pF} 104, ${qF} 104, ${qF} 68`} />
    </>
  );
}

export function AbFigure1() {
  return (
    <AbFrame label="Truth-argument brackets for p and q">{baseBrackets(300)}</AbFrame>
  );
}

export function AbFigure2() {
  // adds an outer F node (top) tied to the T(p)–T(q) combination — p ⊃ q
  return (
    <AbFrame label="Correlation of truth-values, showing p implies q">
      {baseBrackets(300)}
      <text className="fig-tf" x={150} y={16}>
        F
      </text>
      <path {...S} d="M 150 20 C 150 8, 165 40, 165 40" />
    </AbFrame>
  );
}

export function AbFigure3() {
  // the form ~ξ: a single variable with its T and F swapped by a crossing link
  return (
    <div className="fig">
      <svg className="fig-svg fig-ab" viewBox="0 0 160 110" role="img" aria-label="The form not-xi">
        <text className="fig-tf" x={26} y={60}>
          T
        </text>
        <text className="fig-var" x={44} y={60}>
          ξ
        </text>
        <text className="fig-tf" x={62} y={60}>
          F
        </text>
        <path {...S} d="M 30 52 C 30 20, 120 20, 120 52" />
        <path {...S} d="M 66 64 C 66 92, 120 92, 120 64" />
        <text className="fig-tf" x={116} y={60}>
          ” “
        </text>
      </svg>
    </div>
  );
}

export function AbFigure4() {
  // the form ξ.η : two variables tied together (conjunction)
  return (
    <AbFrame label="The form xi and eta" width={300}>
      {baseBrackets(300)}
    </AbFrame>
  );
}

export function AbFigure5() {
  // ~(p.~q): the fuller correlation
  return (
    <AbFrame label="The proposition not (p and not q)" width={320}>
      {baseBrackets(320)}
      <text className="fig-tf" x={160} y={16}>
        F
      </text>
      <path {...S} d="M 160 20 C 160 6, 176 40, 176 40" />
    </AbFrame>
  );
}
