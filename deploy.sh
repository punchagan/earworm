#!/bin/bash
set -e

EXPORT_DIR="out"

# Build the site
./generate.py "${SONG_DIR}"

# Push to server
rsync -azP --copy-links --delete "${EXPORT_DIR}/" "${SERVER_HOST}":"${SONG_PUBLIC_DIR}"
