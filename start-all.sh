#!/usr/bin/env bash
# Patient site :5173 · Organization portal :5174 (frontend only, no backend). Ctrl+C stops both.
cd "$(dirname "$0")"
trap 'kill 0' INT TERM EXIT
(cd medicontinuum-web && npm run dev) &
(cd medicontinuum-organization && npm run dev) &
wait
