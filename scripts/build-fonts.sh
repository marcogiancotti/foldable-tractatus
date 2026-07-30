#!/usr/bin/env bash
#
# Regenerates public/fonts/ and src/styles/fonts.css.
#
# Run this only when the font stack changes — the outputs are committed, so a
# normal build and a normal clone need neither network nor Python. Requires
# curl and fonttools (`pipx install fonttools[woff]` or `pip install fonttools
# brotli zopfli`).
#
# Why the icon font is handled differently: Material Symbols Outlined is 508 KiB
# because it carries ~6,600 icons, and this app uses about twenty. It maps names
# to glyphs through `liga` ligatures, and two things follow from that.
#
# First, the naive `pyftsubset --text=...` is useless here: the letters a-z reach
# every ligature in the font, so the "subset" comes back at 419 KiB. Subsetting
# by the ligature OUTPUT GLYPHS with --no-layout-closure is what actually drops
# the rest (508 KiB -> 22 KiB).
#
# Second, the set of names a component may legally use is the font's LIGATURE
# names, which is NOT the same as its glyph names — `file_download` is a valid
# ligature whose output glyph is named something else entirely. Deriving the list
# from glyph names silently omits such icons, and the failure is invisible until
# the UI renders the literal text "file_download". So the universe below is read
# out of the GSUB ligature table.
#
# That universe is intersected with every lowercase token in src/, which
# deliberately over-includes (English words like "book" and "close" are also icon
# names). Over-inclusion costs a few KiB; under-inclusion breaks an icon, so err
# wide. vite/fonts.test.ts then fails if a name actually used in src/ is missing
# from the manifest.

set -euo pipefail
cd "$(dirname "$0")/.."

UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36'
TEXT_CSS='https://fonts.googleapis.com/css2?family=Hanken+Grotesk:ital,wght@0,300;0,400;0,500;1,300;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap'
ICON_CSS='https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,300,0..1,0&display=swap'

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
mkdir -p public/fonts

echo "→ text fonts"
curl -sS -m 30 -A "$UA" "$TEXT_CSS" -o "$WORK/text.css"

echo "→ icon font"
curl -sS -m 30 -A "$UA" "$ICON_CSS" -o "$WORK/icon.css"
ICON_URL="$(grep -o 'https://fonts.gstatic.com[^)]*\.woff2' "$WORK/icon.css" | head -1)"
curl -sS -m 90 -A "$UA" -o "$WORK/icons-full.woff2" "$ICON_URL"

python3 - "$WORK" <<'PY'
import glob, json, re, subprocess, sys
from fontTools.ttLib import TTFont

work = sys.argv[1]
SLUG = {'Hanken Grotesk': 'hanken-grotesk', 'IBM Plex Mono': 'ibm-plex-mono'}
KEEP = ('latin', 'latin-ext')  # the app's text; drop cyrillic/vietnamese

# ---- text faces: download the latin subsets and emit their @font-face rules ----
css = open(f'{work}/text.css').read()
blocks = re.findall(r'/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{(.*?)\}', css, re.S)
faces = []
for subset, b in blocks:
    if subset not in KEEP:
        continue
    fam = re.search(r"font-family:\s*'([^']+)'", b).group(1)
    weight = re.search(r'font-weight:\s*(\d+)', b).group(1)
    style = re.search(r'font-style:\s*(\w+)', b).group(1)
    urange = re.search(r'unicode-range:\s*([^;]+);', b).group(1).strip()
    url = re.search(r'url\((https://[^)]+)\)', b).group(1)
    name = f"{SLUG[fam]}-{weight}{'-italic' if style == 'italic' else ''}-{subset}.woff2"
    subprocess.run(['curl', '-sS', '-m', '60', '-o', f'public/fonts/{name}', url], check=True)
    faces.append((fam, style, weight, urange, name))

# ---- icon font: subset to the ligature outputs we need, no layout closure ----
full = TTFont(f'{work}/icons-full.woff2')

# The font maps both 'A' and 'a' onto the same letter glyph, so prefer the
# lowercase codepoint when reversing glyph -> character.
rev: dict[str, str] = {}
for cp, g in full.getBestCmap().items():
    ch = chr(cp)
    if g not in rev or ch.islower():
        rev[g] = ch

# ligature name (e.g. "file_download") -> output glyph. Lookup type 7 is an
# extension wrapper and has to be unwrapped to reach the real subtable.
liga: dict[str, str] = {}
for lk in full['GSUB'].table.LookupList.Lookup:
    subtables = [s.ExtSubTable for s in lk.SubTable] if lk.LookupType == 7 else lk.SubTable
    for st in subtables:
        if not hasattr(st, 'ligatures'):
            continue
        for first, ligs in st.ligatures.items():
            for lig in ligs:
                seq = [first] + list(lig.Component)
                liga[''.join(rev.get(s, s) for s in seq).lower()] = lig.LigGlyph

src = ''.join(
    open(p).read()
    for p in glob.glob('src/**/*.tsx', recursive=True) + glob.glob('src/**/*.ts', recursive=True)
)
# 'space' collides with the space character's own glyph name and is never an icon.
used = sorted((set(liga) & set(re.findall(r'[a-z][a-z0-9_]{2,}', src))) - {'space'})
glyphs = sorted({liga[n] for n in used})
json.dump(used, open('public/fonts/icon-names.json', 'w'), indent=0)
subprocess.run(
    [
        sys.executable, '-m', 'fontTools.subset', f'{work}/icons-full.woff2',
        f'--glyphs={",".join(glyphs)}', f'--text={" ".join(used)}',
        '--layout-features+=liga', '--no-layout-closure',
        '--flavor=woff2', '--with-zopfli',
        '--output-file=public/fonts/material-symbols-outlined-subset.woff2',
    ],
    check=True,
)
print(f'  {len(used)} icon names -> {len(glyphs)} glyphs')

# ---- emit src/styles/fonts.css ----
header = open('src/styles/fonts.css').read().split('*/')[0] + '*/' if glob.glob(
    'src/styles/fonts.css'
) else '/* generated by scripts/build-fonts.sh */'
out = [header]
for fam, style, weight, urange, name in faces:
    out.append(
        f"@font-face {{\n  font-family: '{fam}';\n  font-style: {style};\n"
        f"  font-weight: {weight};\n  font-display: swap;\n"
        f"  src: url('/fonts/{name}') format('woff2');\n  unicode-range: {urange};\n}}"
    )
out.append(
    "@font-face {\n  font-family: 'Material Symbols Outlined';\n  font-style: normal;\n"
    "  font-weight: 300;\n"
    "  font-display: block; /* an icon that swaps in late reads as a layout glitch */\n"
    "  src: url('/fonts/material-symbols-outlined-subset.woff2') format('woff2');\n}"
)
open('src/styles/fonts.css', 'w').write('\n\n'.join(out) + '\n')
print(f'  {len(faces)} text faces')
PY

echo "✓ public/fonts/ and src/styles/fonts.css regenerated"
