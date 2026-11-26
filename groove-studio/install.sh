#!/bin/bash
# Groove Studio: download the newest version, build it, and install it to /Applications.
# Run again any time to update. Your songs and autosave are kept.
set -e
BRANCH="claude/project-thread-39i250"
SRC="$HOME/Documents/GrooveStudio"
echo "== Downloading Groove Studio =="
TMP=$(mktemp -d)
curl -sL -o "$TMP/gs.tgz" "https://codeload.github.com/8tthtd6w76-dot/Agent-coco/tar.gz/refs/heads/$BRANCH"
tar xzf "$TMP/gs.tgz" -C "$TMP"
mkdir -p "$SRC"
rsync -a --exclude node_modules --exclude dist "$TMP"/Agent-coco-*/groove-studio/ "$SRC/"
rm -rf "$TMP"
cd "$SRC"
echo "== Building (about a minute) =="
npm install --no-audit --no-fund
rm -rf dist
npm run dist
APP=$(ls -d dist/mac*/"Groove Studio.app" | head -1)
codesign --force --deep -s - "$APP"
echo "== Installing =="
osascript -e 'quit app "Groove Studio"' 2>/dev/null || true
sleep 1
rm -rf "/Applications/Groove Studio.app"
cp -R "$APP" /Applications/
xattr -cr "/Applications/Groove Studio.app" 2>/dev/null || true
# a Desktop icon for you, and a double-click updater
ln -sfn "/Applications/Groove Studio.app" "$HOME/Desktop/Groove Studio"
cp "$SRC/install.sh" "$HOME/Desktop/Update Groove Studio.command" && chmod +x "$HOME/Desktop/Update Groove Studio.command"
open -a "Groove Studio"
echo "== Groove Studio is installed and open =="
