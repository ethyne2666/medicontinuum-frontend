@echo off
start "patient" cmd /k "cd medicontinuum-web && npm run dev"
start "organization" cmd /k "cd medicontinuum-organization && npm run dev"
