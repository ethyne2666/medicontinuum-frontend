#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
for d in medicontinuum-web medicontinuum-organization; do (cd "$d" && npm install); done
