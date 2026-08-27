@echo off
cd /d "%~dp0"
set "HTML=%~dp0proactive-agent-v1.html"
if not exist "%HTML%" (
  echo [错误] 找不到文件: proactive-agent-v1.html
  echo 请确认本 bat 与 html 在同一目录 trade-agent 下
  pause
  exit /b 1
)
rundll32 url.dll,FileProtocolHandler "%HTML%"