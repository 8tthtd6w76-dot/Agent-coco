# Groove Studio

A song-making studio for the Mac, separate from the Agent Coco game. Electron app; the studio itself is plain HTML/JS in `app/`.

- **Timeline on top** (tracks, clips, sections, loop), **tool panel below** for the selected track.
- **Voice** tracks: record from the mic. With Loop on, each pass around the loop becomes a new layer (loop pedal style). Pitch shift (keeps length), reverse, fades, normalize, chop a take onto 16 beat pads.
- **Beat** tracks: 4x4 pads (keys Z X C V / A S D F / Q W E R / 1 2 3 4), 5 synthesized kits, step sequencer, load your own samples, Vary.
- **Synth** tracks: the FM-1 6-operator synth from the game (`app/js/fm1_engine.js`, same patches), piano roll, Vary melody, tone dice, computer-keyboard playing (A–L row, Z/X octave).
- **Quick Loop** tab: pick a sound, press Play, tap a rhythm (mouse or keys). Taps snap to the beat and layer into the loop on Quick tracks. Undo last layer, tap tempo.
- Every instrument has its own color and lights up in it as it plays (pads, track headers, Quick Loop tiles).
- Every clip loops its content: stretch the right edge to repeat it.
- Files: `.groovestudio` (song + audio in one file). Imports Agent Coco songs (`.cocosong.json` or `COCO1:` codes). Exports WAV.
- Autosaves continuously and reopens the last song.

## Install or update on the Mac
```
curl -sL https://raw.githubusercontent.com/8tthtd6w76-dot/Agent-coco/refs/heads/claude/project-thread-39i250/groove-studio/install.sh | bash
```
After the first time, double-click "Update Groove Studio" on the Desktop.

## Run / build by hand
```
npm install
npm start                 # run without installing
npm run dist              # builds dist/mac-arm64/Groove Studio.app
codesign --force --deep -s - "dist/mac-arm64/Groove Studio.app"
cp -R "dist/mac-arm64/Groove Studio.app" /Applications/
```
Shortcuts: Space play/stop, Enter back to start, Cmd+R record, Cmd+L loop, Cmd+K click, Cmd+D duplicate clip, Cmd+B split, Delete removes clip, Cmd+Z / Shift+Cmd+Z undo/redo, Cmd+S save, Cmd+E export WAV.
