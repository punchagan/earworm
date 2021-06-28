#!/bin/bash

set -eu

GIT_URL=$(git remote get-url origin)

PUSH=${1:-}

pushd $(dirname $0)/..

# Build the demo site
rm -rf ./tests/public/
rollup -c rollup.config.js
poetry build
earworm -c tests/sample-config.yml

# Commit and publish the site
if [ ! -z "${PUSH}" ]; then
    pushd tests/public
    rm -r static/.webassets-cache
    git init
    git add .
    git commit -m "Update earworm demo site." \
        --author "Earworm <punchagan+earworm-demo@muse-amuse.in>"
    git log
    git push --force "${GIT_URL}" main:gh-pages
else
    echo "Not pushing to GitHub. Call ${0} with an argument to push."
fi
