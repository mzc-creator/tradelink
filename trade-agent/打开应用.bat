@echo off
cd /d "%~dp0"
set "HTML=%~dp0standalone.html"
if not exist "%HTML%" (
  echo [错误] 找不到文件: standalone.html
  pause
  exit /b 1
)
rundll32 url.dll,FileProtocolHandler "%HTML%"
