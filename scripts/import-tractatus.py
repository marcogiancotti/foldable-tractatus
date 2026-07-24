#!/usr/bin/env python3
"""One-off: tlp_latex.json (Ogden) -> src/data/tractatus.ts.

Uses only the public-domain Ogden text + Wittgenstein's decimal numbering.
Remaps Klement's custom LaTeX macros to KaTeX-native primitives; replaces the
few genuine table/figure blocks with [[block:ID]] sentinels (rendered by our
own React components); keeps \\emph{...} for the renderer; joins paragraphs with
blank lines. Refs come only from real in-text "No. N" citations.

Usage:
    git clone https://bitbucket.org/frabjous/tractatus.git /tmp/tlp
    python3 scripts/import-tractatus.py /tmp/tlp src/data/tractatus.ts

Only the public-domain text/numbering from that repo is used; its CC BY-SA
index (tlp_index.json) is deliberately not read, so this project stays MIT.
"""
import json, re, sys

SRC = sys.argv[1]
OUT = sys.argv[2]
d = json.load(open(f"{SRC}/tlp_latex.json"))

IDS = {k for k in d if not k.startswith("P")}

# --- macro -> KaTeX substitution ------------------------------------------

ZERO_ARG = {
    r"\rnot": r"\mathord{\sim}",
    r"\rand": r"\mathrel{.}",
    r"\rimplies": r"\supset",
    r"\nop": r"\mathop{\mathrm{N}}",
    r"\Op": r"\mathop{\text{O'}}",
    r"\sheffer": r"\mathrel{\vert}",
    r"\ddrimpliesdd": r"\mathrel{\mathord{:}\mathord{\supset}\mathord{:}}",
    r"\drimpliesd": r"\mathrel{\mathord{.}\mathord{\supset}\mathord{.}}",
    r"\drimplies": r"\mathrel{\mathord{.}\mathord{\supset}}",
    r"\dlord": r"\mathrel{\mathord{.}\mathord{\lor}\mathord{.}}",
    r"\dshefferd": r"\mathrel{\mathord{.}\mathord{\vert}\mathord{.}}",
}
ONE_ARG = {
    "ralld": lambda a: r"\mathop{(" + a + r")\mathord{.}}",
    "ralldd": lambda a: r"\mathop{(" + a + r")\mathord{:}}",
    "rsomedd": lambda a: r"\mathop{(\mathord{\exists} " + a + r")\mathord{:}}",
    "rsomed": lambda a: r"\mathop{(\mathord{\exists} " + a + r")\mathord{.}}",
    "rsome": lambda a: r"\mathop{(\mathord{\exists} " + a + r")}",
}
# inline macros that expand to full $…$ math
POSS = r"$\mathrm{K}_n = \displaystyle\sum_{\nu = 0}^{n} \dbinom{n}{\nu}$"
MOREPOSS = r"$\displaystyle\sum_{\kappa = 0}^{\mathrm{K}_n} \dbinom{\mathrm{K}_n}{\kappa} = \mathrm{L}_n$"

# whole-block macros (6.02) that expand to display-math aligned environments
STACK = {
    r"\sixzerotwostackoneogden": r"\[ \begin{aligned} &x = \omop[0] x \text{ Def.\ and} \\ &\omop \omop[\nu] x = \omop[\nu + 1] x \text{ Def.} \end{aligned} \]",
    r"\sixzerotwostacktwoogden": r"\[ \begin{aligned} &0+1=1 \text{ Def.}\\ &0+1+1=2 \text{ Def.}\\ &0+1+1+1=3 \text{ Def.}\\ &\text{and so on.} \end{aligned} \]",
}

# paragraph-level block macros -> sentinel id
BLOCK_MACROS = {
    "fourthreeonetableenglish": "4.31",
    "fourfourfourtwotableogden": "4.442",
    "fiveonezeroonetableogden": "5.101",
    "thecube": "5.5423",
    "theeye": "5.6331",
    "theline": "6.36111",
    "abfigureoneenglish": "6.1203.1",
    "abfiguretwoenglish": "6.1203.2",
    "abfigurethreeenglish": "6.1203.3",
    "abfigurefourenglish": "6.1203.4",
    "abfigurefiveenglish": "6.1203.5",
}


def read_braced(s, i):
    """s[i] == '{'; return (content, index-after-closing-brace)."""
    assert s[i] == "{"
    depth, j = 0, i
    while j < len(s):
        if s[j] == "{":
            depth += 1
        elif s[j] == "}":
            depth -= 1
            if depth == 0:
                return s[i + 1 : j], j + 1
        j += 1
    raise ValueError("unbalanced braces: " + s[i : i + 40])


def expand_one_arg(s):
    for name, fn in ONE_ARG.items():
        while True:
            m = re.search(r"\\" + name + r"(?![A-Za-z])\s*\{", s)
            if not m:
                break
            arg, end = read_braced(s, m.end() - 1)
            s = s[: m.start()] + fn(expand_one_arg(arg)) + s[end:]
    return s


def expand_omop(s):
    # \omopparen[X]{Y} and \omop[X]  (optional bracket arg)
    def opt(s, i):
        if i < len(s) and s[i] == "[":
            j = s.index("]", i)
            return s[i + 1 : j], j + 1
        return "", i

    while True:
        m = re.search(r"\\omopparen(?![A-Za-z])", s)
        if not m:
            break
        x, i = opt(s, m.end())
        assert s[i] == "{"
        y, end = read_braced(s, i)
        s = s[: m.start()] + r"\mathop{(\mathord{\Omega}^{" + x + r"})^{" + y + r"}\mathord{\text{'}}}" + s[end:]
    while True:
        m = re.search(r"\\omop(?![A-Za-z])", s)
        if not m:
            break
        x, end = opt(s, m.end())
        s = s[: m.start()] + r"\mathop{\mathord{\Omega}^{" + x + r"}\mathord{\text{'}}}" + s[end:]
    return s


def convert_center(s):
    """\\begin{center} $m$ text \\\\ … \\end{center} -> $$\\begin{gathered}…$$."""
    def repl(m):
        lines = [l.strip() for l in re.split(r"\\\\", m.group(1)) if l.strip()]
        rows = []
        for line in lines:
            parts = []
            for seg in re.split(r"(\$[^$]*\$)", line):
                if not seg.strip():
                    continue
                if seg.startswith("$") and seg.endswith("$"):
                    parts.append(seg[1:-1])
                else:
                    parts.append(r"\text{" + seg.strip() + "}")
            rows.append(" ".join(parts))
        return r"$$\begin{gathered}" + r" \\ ".join(rows) + r"\end{gathered}$$"

    return re.sub(r"\\begin\{center\}(.*?)\\end\{center\}", repl, s, flags=re.DOTALL)


def expand_inline(s):
    for k, v in STACK.items():
        s = s.replace(k, v)
    s = s.replace(r"\possibilities", POSS).replace(r"\morepossibilities", MOREPOSS)
    s = re.sub(r"\\hyp(\{\})?", "-", s)  # breaking hyphen: pseudo-propositions
    s = expand_one_arg(s)
    s = expand_omop(s)
    for k, v in ZERO_ARG.items():
        s = re.sub(re.escape(k) + r"(?![A-Za-z])", lambda _m, v=v: v, s)
    s = convert_center(s)  # \begin{center}…\end{center} -> gathered display math
    s = s.replace(r"\[", "$$").replace(r"\]", "$$")  # display delimiters
    s = s.replace("\\\\", "\x00")  # protect aligned row breaks
    s = re.sub(r"\\ ", " ", s)  # control space -> space
    s = s.replace("\x00", "\\\\")
    return s


MATH_SPAN = re.compile(r"\$\$.*?\$\$|\$[^$]*\$", re.DOTALL)
PROSE_SPACING = re.compile(r"\\(?:neg)?(?:thin|thick|med)space(?![A-Za-z])")


def strip_prose_spacing(s):
    """Remove spacing macros only OUTSIDE math (inside math KaTeX handles them)."""
    out, last = [], 0
    for m in MATH_SPAN.finditer(s):
        out.append(PROSE_SPACING.sub("", s[last : m.start()]))
        out.append(m.group(0))
        last = m.end()
    out.append(PROSE_SPACING.sub("", s[last:]))
    return "".join(out)


def block_for(para):
    """If para is (optionally spaced) a single block macro, return its id."""
    stripped = re.sub(r"\\(negpbk|pbk|flushright)(\{\})?", "", para).strip()
    m = re.fullmatch(r"\\([A-Za-z]+)", stripped)
    if m and m.group(1) in BLOCK_MACROS:
        return BLOCK_MACROS[m.group(1)]
    return None


def fix_math_quotes(s):
    """Bare opening curly-quotes inside math -> \\text{…} (KaTeX strict-clean)."""
    def repl(m):
        span = m.group(0)
        return span.replace("“", r"\text{“}").replace("‘", r"\text{‘}")
    return MATH_SPAN.sub(repl, s)


def clean_prose(para):
    para = re.sub(r"\\(negpbk|pbk|flushright)(\{\})?", "", para)
    return fix_math_quotes(strip_prose_spacing(expand_inline(para))).strip()


def convert_text(paras):
    out = []
    for p in paras:
        bid = block_for(p)
        if bid:
            out.append(f"[[block:{bid}]]")
        else:
            out.append(clean_prose(p))
    return "\n\n".join(x for x in out if x)


# --- refs: real in-text "No. N" citations ---------------------------------

def refs_for(paras):
    txt = " ".join(paras)
    found = []
    for m in re.finditer(r"No\.\\?\s*(\d+\.\d+)", txt):
        t = m.group(1)
        if t in IDS and t not in found:
            found.append(t)
    return found


# --- nesting by longest existing decimal prefix ---------------------------

def parent_of(n):
    if "." not in n:
        return None
    intpart, frac = n.split(".")
    for i in range(len(frac) - 1, 0, -1):
        cand = f"{intpart}.{frac[:i]}"
        if cand in IDS:
            return cand
    return intpart if intpart in IDS else None


def dec_key(n):
    intpart, _, frac = n.partition(".")
    return (int(intpart), frac)  # frac compared lexically = Tractatus order


order = sorted(IDS, key=dec_key)
nodes = {n: {"n": n, "text": convert_text(d[n]["Ogden"]), "children": []} for n in order}
roots = []
for n in order:
    r = refs_for(d[n]["Ogden"])
    if r:
        nodes[n]["refs"] = r
    p = parent_of(n)
    if p is None:
        assert "." not in n, f"non-root without parent: {n}"
        roots.append(nodes[n])
    else:
        nodes[p]["children"].append(nodes[n])

# --- self-checks ----------------------------------------------------------

assert len(IDS) == len(nodes), "id/node mismatch"
def count(ns):
    return sum(1 + count(x["children"]) for x in ns)
assert count(roots) == len(IDS), "tree lost nodes"
assert [r["n"] for r in roots] == [str(i) for i in range(1, 8)], [r["n"] for r in roots]
leftover, prose_leftover = set(), {}
for n in order:
    t = nodes[n]["text"]
    for m in re.finditer(r"\\([A-Za-z]+)", t):
        leftover.add(m.group(1))
    # commands surviving OUTSIDE math (excluding emph) would render literally
    bare = MATH_SPAN.sub("", t)
    for m in re.finditer(r"\\([A-Za-z]+)", bare):
        if m.group(1) != "emph":
            prose_leftover.setdefault(m.group(1), []).append(n)
print(f"{len(IDS)} statements, {len(roots)} roots. LaTeX commands remaining in text:")
print(" ", ", ".join(sorted(leftover)))
print("PROSE-level leftovers (must be empty):", {k: v[:3] for k, v in prose_leftover.items()})


# --- emit -----------------------------------------------------------------

def clean(node):
    o = {"n": node["n"], "text": node["text"]}
    if node.get("refs"):
        o["refs"] = node["refs"]
    if node["children"]:
        o["children"] = [clean(c) for c in node["children"]]
    return o


data = [clean(r) for r in roots]
body = json.dumps(data, ensure_ascii=False, indent=2)

header = '''/*
  The statement tree — Ogden (1922) translation, public domain.

  GENERATED by scripts/import-tractatus.py — do not edit by hand; re-run the
  script to regenerate. Source text: the Ogden translation (public domain) and
  Wittgenstein's own decimal numbering, taken from Kevin Klement's
  Side-by-Side edition (https://bitbucket.org/frabjous/tractatus). Only the
  public-domain text/numbering is used here; Klement's CC BY-SA index is not.
  Custom LaTeX macros were remapped to KaTeX; a few genuine table/figure blocks
  are emitted as [[block:ID]] sentinels rendered by src/components/blocks/.

  `refs` are Wittgenstein's own in-text citations (his "No. N" form) — the whole
  book contains three. Mathematical notation is inline `$…$` / display `$$…$$`
  LaTeX (typeset by KaTeX); emphasis is `\\emph{…}` (see StatementText).
*/

export interface StatementSource {
  n: string;
  text: string;
  refs?: string[];
  children?: StatementSource[];
}

export const TRACTATUS: StatementSource[] = '''

open(OUT, "w").write(header + body + ";\n")
print("wrote", OUT)
