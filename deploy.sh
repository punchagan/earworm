#!/bin/bash
set -e

EXPORT_DIR="out"

# Build the site
./generate.py "${SONG_DIR}"

# Push to muse-amuse.in
rsync -azP --copy-links --delete "${EXPORT_DIR}/" muse-amuse.in:"${SONG_PUBLIC_DIR}"
