@echo off
setlocal EnableExtensions
cd /d "%~dp0"

set "TARGET=%~dp0launch-3way.cmd"
set "DESKTOP=%USERPROFILE%\Desktop"
if not exist "%DESKTOP%\" set "DESKTOP=%USERPROFILE%\OneDrive\Desktop"

set "LNK=%DESKTOP%\3Way Lite.lnk"

if not exist "%TARGET%" (
  echo [ERROR] launch-3way.cmd not found next to this script.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%LNK%'); $s.TargetPath = '%TARGET%'; $s.WorkingDirectory = '%~dp0'; $s.WindowStyle = 1; $s.Description = 'Start 3Way Lite local server'; $s.Save(); Write-Host 'Created: %LNK%'"

if errorlevel 1 (
  echo [ERROR] Could not create the desktop shortcut.
  echo You can still right-click launch-3way.cmd -^> Send to -^> Desktop.
  pause
  exit /b 1
)

echo.
echo Desktop shortcut created: 3Way Lite
echo Double-click it anytime after Node.js and npm install are set up.
echo.
pause
