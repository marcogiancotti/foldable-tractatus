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
        {front.map((p, i) => {
          // front = [bottom-left, bottom-right, top-right, top-left]; the two
          // upper corners (2, 3) get their label above the corner, not below.
          const upper = i === 2 || i === 3;
          return (
            <text
              key={`a${i}`}
              className="fig-label"
              x={p[0]}
              y={p[1]}
              dx={-6}
              dy={upper ? -6 : 14}
            >
              a
            </text>
          );
        })}
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
      <svg className="fig-svg" viewBox="0 0 200 120" role="img" aria-label="An eye and a curved boundary">
        <text className="fig-label" x={8} y={64}>
          Eye
        </text>
        <line {...S} x1={40} y1={60} x2={60} y2={60} />
        {/* small eye-point; the large reversed-C (visual field) meets it: the
            arc's two tips sit on the circle's right edge (both 5 from centre).
            The balloon is tall — control points spread far above/below centre. */}
        <circle {...S} cx={66} cy={60} r={5} />
        <path {...S} d="M 70 57 C 200 -80, 200 200, 70 63" />
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
  6.1203 — Wittgenstein's T-F ("ab") notation, redrawn from the 1922 print.
  Each variable is written T–x–F; CURLY BRACES (end hooks curling toward the
  letters, a sharp cusp pointing away) tie one pole of the left group to one
  pole of the right group — TT and TF above the line, FT and FF below. The
  cusps are functional: the thin correlation lines of figs 2/4/5 attach there.
*/

type Dir = -1 | 1;
interface BraceSpec {
  x1: number;
  x2: number;
  y: number; // anchor line: both end tips sit on it
  dir: Dir; // -1 opens down (top brace: hooks point down, cusp up); +1 mirrors
  h: number; // rise from anchor line to cusp tip
  cx?: number; // cusp x — defaults to the span midpoint (the print sometimes sets it off-centre)
}

// Where correlation lines attach.
const cuspOf = (b: BraceSpec) => ({ x: b.cx ?? (b.x1 + b.x2) / 2, y: b.y + b.dir * b.h });

function bracePath({ x1, x2, y, dir, h, cx }: BraceSpec) {
  const m = cx ?? (x1 + x2) / 2;
  const c = h * 0.45; // cusp portion of the rise
  const ys = y + dir * (h - c); // shoulder line
  const yc = y + dir * h; // cusp tip
  const r = Math.min(h, (x2 - x1) / 8); // hook / cusp shoulder radius
  return [
    `M ${x1} ${y}`,
    `Q ${x1} ${ys} ${x1 + r} ${ys}`,
    `L ${m - r} ${ys}`,
    `Q ${m} ${ys} ${m} ${yc}`,
    `Q ${m} ${ys} ${m + r} ${ys}`,
    `L ${x2 - r} ${ys}`,
    `Q ${x2} ${ys} ${x2} ${y}`,
  ].join(' ');
}

function Brace({
  b,
  strokeWidth,
  transform,
}: {
  b: BraceSpec;
  strokeWidth?: number;
  transform?: string;
}) {
  return <path {...S} strokeWidth={strokeWidth ?? S.strokeWidth} transform={transform} d={bracePath(b)} />;
}

// Correlation lines and pole-pair strokes are thin in the print.
const THIN = { fill: 'none', stroke: 'currentColor', strokeWidth: 1 } as const;

// Letter positions + the four combination braces for the two-variable figures.
// Nested braces share a pole end (both top ones bind T-left, both bottom ones
// F-left), so the outer one is offset a few px outward, as the print stacks them.
function abLayout(w: number, yB: number) {
  const pT = 30,
    pV = 52,
    pF = 74,
    qT = w - 74,
    qV = w - 52,
    qF = w - 30;
  const yTop = yB - 16,
    yBot = yB + 8;
  return {
    pT,
    pV,
    pF,
    qT,
    qV,
    qF,
    yB,
    tt: { x1: pT, x2: qT, y: yTop, dir: -1, h: 22 } as BraceSpec,
    tf: { x1: pT - 6, x2: qF, y: yTop - 3, dir: -1, h: 38 } as BraceSpec,
    ft: { x1: pF, x2: qT, y: yBot, dir: 1, h: 20 } as BraceSpec,
    ff: { x1: pF - 6, x2: qF, y: yBot + 3, dir: 1, h: 36 } as BraceSpec,
  };
}
type AbLayout = ReturnType<typeof abLayout>;

function PoleLetters({ L, vl, vr }: { L: AbLayout; vl: string; vr: string }) {
  const t = (x: number, cls: string, s: string, key: string) => (
    <text key={key} className={cls} x={x} y={L.yB} textAnchor="middle">
      {s}
    </text>
  );
  return (
    <>
      {t(L.pT, 'fig-tf', 'T', 'pT')}
      {t(L.pV, 'fig-var', vl, 'pV')}
      {t(L.pF, 'fig-tf', 'F', 'pF')}
      {t(L.qT, 'fig-tf', 'T', 'qT')}
      {t(L.qV, 'fig-var', vr, 'qV')}
      {t(L.qF, 'fig-tf', 'F', 'qF')}
    </>
  );
}

function ComboBraces({ L }: { L: AbLayout }) {
  return (
    <>
      <Brace b={L.tt} />
      <Brace b={L.tf} />
      <Brace b={L.ft} />
      <Brace b={L.ff} />
    </>
  );
}

function AbSvg({
  w,
  h,
  label,
  children,
}: {
  w: number;
  h: number;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="fig">
      <svg
        className="fig-svg fig-ab"
        width={w}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label={label}
      >
        {children}
      </svg>
    </div>
  );
}

export function AbFigure1() {
  const L = abLayout(360, 78);
  return (
    <AbSvg w={360} h={150} label="The four truth-combinations of p and q, tied by braces">
      <PoleLetters L={L} vl="p" vr="q" />
      <ComboBraces L={L} />
    </AbSvg>
  );
}

export function AbFigure2() {
  // p ⊃ q: the whole proposition's F sits on the TF cusp; its T (bottom) is
  // tied by thin lines to the TT, FT and FF cusps.
  const L = abLayout(360, 110);
  const cTT = cuspOf(L.tt),
    cTF = cuspOf(L.tf),
    cFT = cuspOf(L.ft),
    cFF = cuspOf(L.ff);
  const head = { x: 172, y: 190 }; // where the three lines converge, above T
  return (
    <AbSvg w={360} h={220} label="Correlation of truth-values for p implies q">
      <PoleLetters L={L} vl="p" vr="q" />
      <ComboBraces L={L} />
      <text className="fig-var" x={cTF.x} y={46} textAnchor="middle">
        F
      </text>
      <line {...THIN} x1={cTF.x} y1={49} x2={cTF.x} y2={cTF.y} />
      <text className="fig-tf" x={head.x} y={202} textAnchor="middle">
        T
      </text>
      <line {...THIN} x1={head.x - 2} y1={head.y} x2={cTT.x} y2={cTT.y} />
      <line {...THIN} x1={head.x} y1={head.y} x2={cFT.x} y2={cFT.y} />
      <line {...THIN} x1={head.x + 2} y1={head.y} x2={cFF.x} y2={cFF.y} />
      {/* the print's small ticks where the lines meet the T */}
      <line {...THIN} x1={head.x - 7} y1={head.y - 7} x2={head.x - 1} y2={head.y - 4} />
      <line {...THIN} x1={head.x + 1} y1={head.y - 4} x2={head.x + 7} y2={head.y - 7} />
    </AbSvg>
  );
}

export function AbFigure3() {
  // ~ξ: a compact vertical stack — the new poles T (above) and F (below)
  // attached to the quoted sign “TξF” by two short parallel diagonal strokes.
  return (
    <AbSvg w={150} h={150} label="The sign for not-xi: new poles on the quoted sign T xi F">
      <text className="fig-tf" x={84} y={26} textAnchor="middle">
        T
      </text>
      <text className="fig-tf" x={40} y={82} textAnchor="middle">
        “
      </text>
      <text className="fig-tf" x={56} y={82} textAnchor="middle">
        T
      </text>
      <text className="fig-var" x={72} y={82} textAnchor="middle">
        ξ
      </text>
      <text className="fig-tf" x={88} y={82} textAnchor="middle">
        F
      </text>
      <text className="fig-tf" x={104} y={82} textAnchor="middle">
        ”
      </text>
      <text className="fig-tf" x={74} y={138} textAnchor="middle">
        F
      </text>
      <line {...THIN} x1={80} y1={32} x2={60} y2={66} />
      <line {...THIN} x1={88} y1={90} x2={76} y2={124} />
    </AbSvg>
  );
}

export function AbFigure4() {
  // ξ.η: true only for TT — T (top) ties to the TT cusp, F (bottom) to the
  // TF, FT and FF cusps (the long stroke crosses the whole figure).
  const L = abLayout(400, 110);
  const cTT = cuspOf(L.tt),
    cTF = cuspOf(L.tf),
    cFT = cuspOf(L.ft),
    cFF = cuspOf(L.ff);
  const head = { x: 210, y: 204 }; // convergence just above the bottom F
  return (
    <AbSvg w={400} h={230} label="Correlation of truth-values for xi and eta">
      <PoleLetters L={L} vl="ξ" vr="η" />
      <ComboBraces L={L} />
      <text className="fig-tf" x={150} y={26} textAnchor="middle">
        T
      </text>
      <line {...THIN} x1={152} y1={30} x2={cTT.x} y2={cTT.y} />
      <text className="fig-var" x={head.x} y={216} textAnchor="middle">
        F
      </text>
      <line {...THIN} x1={head.x - 2} y1={head.y} x2={cTF.x} y2={cTF.y} />
      <line {...THIN} x1={head.x} y1={head.y} x2={cFT.x} y2={cFT.y} />
      <line {...THIN} x1={head.x + 2} y1={head.y} x2={cFF.x} y2={cFF.y} />
      <line {...THIN} x1={head.x - 7} y1={head.y - 7} x2={head.x - 1} y2={head.y - 4} />
      <line {...THIN} x1={head.x + 1} y1={head.y - 4} x2={head.x + 7} y2={head.y - 7} />
    </AbSvg>
  );
}

export function AbFigure5() {
  // ~(p.~q), fully constructed — hand-drawn by the author in Inkscape and
  // inlined here verbatim (exact glyph/brace/line geometry, original draw
  // order). The editable source is docs/figures/6.1203.5-source.svg; re-export
  // from there and re-paste to revise. Only two things were changed from the
  // source SVG when inlining: the hardcoded
  // black became `currentColor` so the figure follows the reading theme, and
  // the sans-serif letters now use the shared .fig-tf / .fig-var classes so
  // the type matches the sibling figures. viewBox and the group transform are
  // the author's own.
  const brace = { fill: 'currentColor', stroke: 'none' } as const;
  const link = { fill: 'none', stroke: 'currentColor', strokeWidth: 0.45 } as const;
  // letters keep the source's authored size; only the family/fill come from
  // the sibling classes (whose own font-size would be wrong in this smaller
  // coordinate system, so it's overridden here)
  const G = (x: number, y: number, s: string, variable = false) => (
    <text
      x={x}
      y={y}
      className={variable ? 'fig-var' : 'fig-tf'}
      textAnchor="middle"
      style={{ fontSize: variable ? 5.4 : 5 }}
    >
      {s}
    </text>
  );
  return (
    <div className="fig">
      <svg
        className="fig-svg fig-ab"
        width={220}
        viewBox="0 0 87.388992 99.600945"
        role="img"
        aria-label="The sign for not (p and not q), fully constructed"
      >
        <g transform="translate(-56.992475,-171.4203)">
          {G(64.379189, 216.04308, 'T')}
          {G(75.937561, 257.14777, 'F')}
          {G(59.828815, 240.59435, 'T')}
          {G(69.479019, 237.5957, 'q', true)}
          {G(77.896263, 234.68176, 'F')}
          {G(89.67041, 188.54054, 'T')}
          {G(72.125717, 178.97676, 'F')}
          {G(108.51359, 224.89648, 'T')}
          {G(118.1638, 221.89784, 'p', true)}
          {G(126.58104, 220.04222, 'F')}
          <path
            {...brace}
            d="m 88.719456,201.68737 c -0.536606,-0.10989 -0.590309,0.15237 -0.687898,0.3808 -0.37561,0.84222 -1.80547,2.61126 -6.683852,1.61231 L 70.615305,201.4828 c -0.487857,-0.0999 -0.975684,-0.19979 -1.473277,-0.252 -4.219858,-0.49148 -6.108165,1.77987 -6.445027,3.42494 -0.07323,0.35763 0.253685,0.4991 0.448708,0.53903 0.438824,0.0899 0.580583,-0.10469 0.67329,-0.30927 0.810276,-1.97044 3.576281,-2.07475 4.581229,-2.01802 0.702525,0.0445 1.385473,0.18435 2.068451,0.3242 l 10.586106,2.16772 c 0.585403,0.11988 1.170806,0.23975 1.717167,0.30194 2.688039,0.27718 4.595658,-0.59911 5.498352,-1.78054 0.8679,3.20836 5.07798,3.99594 5.712151,4.1258 l 11.415395,2.33754 c 0.97571,0.1998 4.06856,0.98217 4.83417,3.20077 0.24884,0.77136 -0.10727,1.26978 0.62424,1.41958 0.48782,0.0999 0.58541,-0.12854 0.62447,-0.31928 0.27815,-1.85582 -0.66287,-3.96129 -3.25809,-5.18828 -1.01953,-0.48202 -1.80005,-0.64184 -3.01963,-0.89158 l -10.634873,-2.17771 c -0.731746,-0.14984 -1.409863,-0.31353 -1.975734,-0.52879 -1.60495,-0.6019 -2.726889,-1.57688 -3.151183,-2.48352 -0.502303,-1.02199 0.107704,-1.51811 -0.721764,-1.68796 z"
          />
          <path
            {...brace}
            d="m 96.581881,192.21093 c -0.668126,-0.12822 -0.755326,0.32761 -0.895382,0.73068 -0.536291,1.48786 -2.470457,4.68472 -8.543858,3.51557 l -13.361434,-2.57211 c -0.607231,-0.11765 -1.214699,-0.23377 -1.837908,-0.26766 -5.281403,-0.37166 -7.830863,3.73882 -8.378306,6.60059 -0.118997,0.62212 0.282422,0.82842 0.525217,0.87516 0.546302,0.10533 0.739507,-0.8498 0.87163,-1.21139 1.168376,-3.4733 4.722572,-4.43045 5.984827,-4.44548 0.882034,-0.002 1.732281,0.16151 2.582563,0.32519 l 13.179303,2.53703 c 0.728769,0.14049 1.457603,0.28063 2.141531,0.32617 3.366923,0.17512 5.957517,-1.43704 7.183416,-3.56618 0.854074,5.41069 5.97999,6.18616 6.7695,6.33815 l 14.21175,2.7358 c 1.21474,0.23378 5.17511,1.94165 5.9742,5.66467 0.25598,1.29635 -0.41159,2.55491 0.49911,2.73024 0.60719,0.11764 0.74737,-0.28615 0.81085,-0.61798 0.48917,-3.21701 -0.53942,-6.72618 -3.7184,-8.54222 -1.24886,-0.71343 -2.22058,-0.90048 -3.73892,-1.19276 l -13.24002,-2.54874 c -0.91096,-0.17562 -1.75336,-0.38052 -2.45042,-0.68675 -1.977685,-0.85374 -3.318781,-2.40197 -3.785764,-3.91093 -0.556677,-1.69825 0.249156,-2.61818 -0.783498,-2.81698 z"
          />
          <path {...link} d="m 64.697675,217.3705 10.269474,10.61179" />
          <path {...link} d="m 89.381914,190.61451 -0.513473,10.09832" />
          <path {...link} d="m 61.852485,242.14622 10.269474,10.61179" />
          <path
            {...brace}
            d="m 99.857798,248.17636 c -0.39999,0.37421 -0.58287,0.17873 -0.78548,0.035 -0.760501,-0.52161 -2.90423,-1.28214 -6.540652,2.11975 l -8.000105,7.48417 c -0.363651,0.34021 -0.727291,0.68038 -1.124175,0.98502 -3.340348,2.62504 -6.137471,1.67604 -7.284667,0.4497 -0.249362,-0.2666 -0.04466,-0.55809 0.100714,-0.69408 0.327081,-0.30605 0.549648,-0.2143 0.735638,-0.0883 1.720836,1.25613 4.133299,-0.10097 4.960329,-0.67469 0.575611,-0.4052 1.08469,-0.88146 1.593797,-1.35772 l 7.891054,-7.38214 c 0.436366,-0.40824 0.872735,-0.81646 1.305968,-1.1551 2.146564,-1.64154 4.230862,-1.8918 5.617998,-1.35659 -0.937445,-3.18873 2.239803,-6.06109 2.712533,-6.50331 l 8.5092,-7.96045 c 0.72732,-0.68041 2.95486,-2.96423 2.44766,-5.25576 -0.1911,-0.78766 -0.75525,-1.02637 -0.20998,-1.53649 0.36363,-0.34019 0.56624,-0.19646 0.69925,-0.0543 1.2073,1.43662 1.50582,3.72341 -0.0651,6.12611 -0.61712,0.94389 -1.19895,1.48818 -2.10803,2.33864 l -7.9274,7.41615 c -0.54546,0.51029 -1.03797,1.00434 -1.40781,1.48366 -1.053512,1.35214 -1.500222,2.76981 -1.387942,3.7645 0.10608,1.1338 0.885452,1.23783 0.26716,1.81625 z"
          />
          <path
            {...brace}
            d="m 111.51437,252.14438 c -0.50253,0.45857 -0.81516,0.11558 -1.14527,-0.15484 -1.235,-0.98799 -4.55507,-2.70205 -9.12123,1.46967 l -10.045517,9.17776 c -0.456132,0.41775 -0.913274,0.83431 -1.426825,1.189 -4.307919,3.07785 -8.630133,0.90662 -10.592899,-1.24675 -0.426668,-0.46812 -0.192326,-0.85385 -0.0098,-1.02062 0.410637,-0.37538 1.074669,0.33783 1.376328,0.577 2.811785,2.35007 6.341992,1.30793 7.425882,0.66085 0.752947,-0.45939 1.392274,-1.04328 2.031541,-1.62732 l 9.908588,-9.05264 c 0.547812,-0.50076 1.095862,-1.00123 1.655072,-1.39761 2.77864,-1.90944 5.82984,-1.88945 7.98796,-0.71531 -2.10055,-5.05892 1.86372,-8.39972 2.45729,-8.94203 l 10.68481,-9.76183 c 0.91331,-0.83433 3.39654,-4.36065 2.13141,-7.95215 -0.45949,-1.23892 -1.68653,-1.96279 -1.00185,-2.58837 0.45612,-0.41771 0.78671,-0.14676 1.0143,0.10291 2.0988,2.48667 3.05649,6.01585 1.29591,9.22588 -0.69165,1.26106 -1.42222,1.92851 -2.56375,2.97143 l -9.95424,9.09436 c -0.68473,0.62594 -1.29574,1.241 -1.72987,1.86647 -1.23959,1.76167 -1.57344,3.78259 -1.18267,5.31306 0.41327,1.73871 1.58113,2.10166 0.80478,2.81098 z"
          />
          <path {...link} d="m 75.346968,178.29114 10.782947,5.99053" />
          {G(141.55573, 271.02124, 'T')}
          {G(129.05682, 256.62646, 'F')}
          <path {...link} d="m 130.75927,255.85484 7.23225,7.19367" />
          <path {...link} d="m 99.726161,248.83129 c 6.777509,12.10269 17.669929,8.22983 25.657699,5.80929" />
          <path {...link} d="m 112.79706,251.97799 h 12.34475" />
          <path {...link} d="m 95.369191,196.78973 c -3.87286,25.6577 16.217599,45.99022 30.014669,52.52567" />
        </g>
      </svg>
    </div>
  );
}
