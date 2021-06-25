#!/bin/bash

set -eu

rollup -c rollup.config.js
poetry build
