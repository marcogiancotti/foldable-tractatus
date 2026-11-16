#!/usr/bin/env bash
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REFS_DIR="$SKILL_DIR/references"

ref_file="$(ls "$REFS_DIR"/*.md 2>/dev/null | head -1)"
if [ -z "$ref_file" ]; then
  echo "ERROR: no reference file found in $REFS_DIR" >&2
  exit 1
fi

ref_desc="$(awk '/^---$/{f++; next} f==1 && /^description:/{sub(/^description: */,""); print; exit}' "$ref_file")"

agent_name="$(awk '/^---$/{f++; next} f==1 && /^name:/{gsub(/-instructions$/,"",$2); print $2; exit}' "$ref_file")"
if [ -z "$agent_name" ]; then
  echo "ERROR: could not determine agent name from $ref_file" >&2
  exit 1
fi

CWD="$(pwd)"

project_root="$SKILL_DIR"
while [ "$project_root" != "$CWD" ] && [ "$project_root" != "/" ]; do
  if [ -d "$project_root/.git" ] || [ -d "$project_root/.opencode" ]; then
    break
  fi
  parent="$(dirname "$project_root")"
  if [ "$parent" = "$project_root" ]; then
    break
  fi
  project_root="$parent"
done

# If we hit CWD without finding .git or .opencode, CWD is the project root
if [ "$project_root" = "$CWD" ] && [ ! -d "$project_root/.git" ] && [ ! -d "$project_root/.opencode" ]; then
  :
fi

agents_dir="$project_root/.opencode/agents"
mkdir -p "$agents_dir"
target="$agents_dir/$agent_name.md"

if [ -f "$target" ]; then
  echo "Already exists: $target (skipping)"
  exit 0
fi

{
  printf '%s\n' '---'
  printf 'description: %s\n' "$ref_desc"

  awk '/^---$/{f++; next}
       f==1 && /^opencode:/{p=1; next}
       f==1 && p==1 && /^[a-zA-Z]/ && !/^opencode:/{p=0}
       f==1 && p==1 { sub(/^  /,""); print }
       f==2 { exit }' "$ref_file"

  printf '%s\n\n' '---'
} > "$target"

awk '/^---$/{f++; next} f>=2' "$ref_file" >> "$target"

echo "Generated: $target"