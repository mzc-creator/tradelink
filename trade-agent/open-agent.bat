@echo off
cd /d "%~dp0"
set "HTML=%~dp0proactive-agent-v1.html"
if not exist "%HTML%" (
  echo [ERROR] File not found: proactive-agent-v1.html
  echo Please run this bat from the trade-agent folder.
  pause
  exit /b 1
)
rundll32 url.dll,FileProtocolHandler "%HTML%"
