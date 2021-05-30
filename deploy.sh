#!/bin/bash
set -e

EXPORT_DIR="output"

pushd $(dirname $0)

# Purge old data
rm -rf "${EXPORT_DIR}"

# Build the site
./generate.py --config my-music.yml

# Push to server
rsync -azP --copy-links "${EXPORT_DIR}/" "${SERVER_HOST}":"${SONG_PUBLIC_DIR}"
