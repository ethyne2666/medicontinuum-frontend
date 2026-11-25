#!/usr/bin/env bash
# Starts the API (5001), organization portal (5174) and patient site (5173). Ctrl+C stops all.
cd "$(dirname "$0")"
trap 'kill 0' INT TERM EXIT
(cd medicontinuum-organization/backend  && npm start) &
(cd medicontinuum-organization/frontend && npm run dev) &
(cd medicontinuum-web                   && npm run dev) &
wait
