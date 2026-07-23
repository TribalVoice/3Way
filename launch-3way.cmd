@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title 3Way Lite
echo.
echo  ========================================
echo   3Way Lite launcher
echo  ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found on PATH.
  echo Install the LTS build from https://nodejs.org
  echo then close this window and try again.
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo [ERROR] package.json not found.
  echo Put this script in the 3Way project folder and run it from there.
  echo.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Dependencies missing — running npm install...
  echo.
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo [ERROR] npm install failed.
    pause
    exit /b 1
  )
  echo.
)

REM Open the app in the default browser after the server has a moment to start.
start "" cmd /c "timeout /t 4 /nobreak >nul & start http://localhost:3000/"

echo Starting the local server...
echo Keep this window open while you use 3Way Lite.
echo Press Ctrl+C to stop, then close the window.
echo.
echo Browser will open http://localhost:3000
echo.

call npm.cmd run dev
set EXITCODE=%ERRORLEVEL%

echo.
if not "%EXITCODE%"=="0" (
  echo Server exited with code %EXITCODE%.
)
pause
exit /b %EXITCODE%
