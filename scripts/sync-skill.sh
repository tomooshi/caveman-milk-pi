#!/usr/bin/env bash
# sync-skill.sh — fetch the latest caveman SKILL.md from upstream and diff against vendored copy.
#
# Usage: bash scripts/sync-skill.sh
#
# Workflow:
#   1. Downloads upstream SKILL.md to a temp file
#   2. Shows diff vs local skill/SKILL.md (minus our appended Document Exemption section)
#   3. If diff non-empty, prompts reviewer to apply
#   4. On accept: overwrites local file, re-appends Document Exemption, prints new commit SHA

set -euo pipefail

UPSTREAM_REPO="JuliusBrussee/caveman"
UPSTREAM_PATH="skills/caveman/SKILL.md"
LOCAL_FILE="skill/SKILL.md"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$REPO_ROOT"

if [[ ! -f "$LOCAL_FILE" ]]; then
	echo "ERROR: $LOCAL_FILE not found. Run from repo root." >&2
	exit 1
fi

TMPDIR="$(mktemp -d)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "Fetching upstream SKILL.md from $UPSTREAM_REPO..."
UPSTREAM_RAW="https://raw.githubusercontent.com/$UPSTREAM_REPO/main/$UPSTREAM_PATH"
curl -fsSL "$UPSTREAM_RAW" -o "$TMPDIR/upstream-SKILL.md"

# Get upstream commit SHA for the file
UPSTREAM_SHA="$(curl -fsSL "https://api.github.com/repos/$UPSTREAM_REPO/commits?path=$UPSTREAM_PATH&per_page=1" |
	grep -o '"sha": "[^"]*"' | head -1 | cut -d'"' -f4)"

# Strip our appended Document Exemption section from local for comparison
awk '/^## Document Exemption$/{exit} {print}' "$LOCAL_FILE" | sed -e :a -e '/^$/{$d;N;ba' -e '}' >"$TMPDIR/local-upstream-portion.md"

echo ""
echo "=== DIFF (upstream vs local-upstream-portion) ==="
if diff -u "$TMPDIR/local-upstream-portion.md" "$TMPDIR/upstream-SKILL.md"; then
	echo ""
	echo "No changes from upstream. Local SKILL.md already current."
	echo "Upstream SHA: $UPSTREAM_SHA"
	exit 0
fi

echo ""
echo "Upstream SHA: $UPSTREAM_SHA"
echo ""
read -r -p "Apply upstream changes to $LOCAL_FILE? [y/N] " answer
if [[ "$answer" != "y" && "$answer" != "Y" ]]; then
	echo "Aborted. No changes made."
	exit 0
fi

# Extract our appended exemption section
awk '/^## Document Exemption$/,/^$/{print} /^## Document Exemption$/,0{if (!/^## Document Exemption$/ && !/^$/) print}' "$LOCAL_FILE" >"$TMPDIR/exemption.md" || true
# Simpler: find line of "## Document Exemption" and take from there
EXEMPTION_LINE=$(grep -n "^## Document Exemption$" "$LOCAL_FILE" | head -1 | cut -d: -f1)
if [[ -n "$EXEMPTION_LINE" ]]; then
	tail -n +"$EXEMPTION_LINE" "$LOCAL_FILE" >"$TMPDIR/exemption.md"
fi

# Write new local: upstream content + blank line + our exemption (if it existed)
cp "$TMPDIR/upstream-SKILL.md" "$LOCAL_FILE"
if [[ -s "$TMPDIR/exemption.md" ]]; then
	echo "" >>"$LOCAL_FILE"
	cat "$TMPDIR/exemption.md" >>"$LOCAL_FILE"
fi

echo ""
echo "Updated $LOCAL_FILE"
echo "New upstream SHA: $UPSTREAM_SHA"
echo ""
echo "Next steps:"
echo "  1. Update CREDITS.md with new SHA: $UPSTREAM_SHA"
echo "  2. Review the change: git diff $LOCAL_FILE"
echo "  3. Commit: git add $LOCAL_FILE CREDITS.md && git commit -m \"sync: upstream SKILL.md to $UPSTREAM_SHA\""
