#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
for d in medicontinuum-organization/backend medicontinuum-organization/frontend medicontinuum-web; do
  echo "→ npm install in $d"; (cd "$d" && npm install)
done
echo "Done. Optional demo data: (cd medicontinuum-organization/backend && npm run seed)"
