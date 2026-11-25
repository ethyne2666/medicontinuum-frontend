@echo off
for %d in (medicontinuum-web medicontinuum-organization) do (pushd %d && call npm install && popd)
