@echo off
cd /d "%~dp0"
start "Organization API :5001"   cmd /k "cd medicontinuum-organization\backend && npm start"
start "Organization portal :5174" cmd /k "cd medicontinuum-organization\frontend && npm run dev"
start "Patient site :5173"        cmd /k "cd medicontinuum-web && npm run dev"
