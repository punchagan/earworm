#!/bin/bash

set -eu

VERSION=$1
RULES=("patch" "minor" "major" "prepatch" "preminor" "premajor" "prerelease")

FOUND=""
case "${RULES[@]}" in
    *"${VERSION}"*)
        FOUND="found" ;;
esac

if [ -z $FOUND ]; then
    echo "'${VERSION}' is not a valid rule. Use one of ${RULES[@]}"
else
    NOTE=$(poetry version -s "${VERSION}")
    git add pyproject.toml
    git commit -m "release: ${NOTE}"
    git tag $(poetry version -s)
    rollup -c rollup.config.js
    poetry build
fi
