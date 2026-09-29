@echo off
start "SenaLeng API" cmd /k "cd /d %~dp0api && npm run dev"
start "SenaLeng App" cmd /k "cd /d %~dp0app && npx expo start"
