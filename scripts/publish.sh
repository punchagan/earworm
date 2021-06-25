#!/bin/bash

set -eu

REPO="${1:-test}"

echo "Publishing to ${REPO} repository"

function test {
    poetry publish -r testpypi
}

function live {
    poetry publish
    git push origin $(poetry version -s)
}

case "${REPO}" in
    "test")
        test ;;
    "live")
        live ;;
esac
