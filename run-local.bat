@echo off
setlocal

title FormAuto Hub - Full Local App
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 goto :missing_node

where npm >nul 2>nul
if errorlevel 1 goto :missing_npm

where dotnet >nul 2>nul
if errorlevel 1 goto :missing_dotnet

cd /d "%~dp0apps\web"

if not exist "node_modules\.bin\concurrently.cmd" goto :install_dependencies
if not exist "node_modules\.bin\cross-env.cmd" goto :install_dependencies
goto :dependencies_ready

:install_dependencies
echo [SETUP] Installing frontend dependencies...
call npm install
if errorlevel 1 goto :install_failed

:dependencies_ready

dotnet dev-certs https --check >nul 2>nul
if errorlevel 1 (
  echo [WARN] HTTPS development certificate was not found.
  echo [WARN] Run: dotnet dev-certs https --trust
  echo.
)

echo ============================================================
echo   FormAuto Hub - Full Local App
echo   Web: http://localhost:3020
echo   API: https://localhost:7039
echo ============================================================
echo [INFO] Press Ctrl+C once to stop both API and Web.
echo.

call npm run dev
set "FORMAUTO_EXIT_CODE=%ERRORLEVEL%"

if not "%FORMAUTO_EXIT_CODE%"=="0" (
  echo.
  echo [ERROR] Full app stopped with exit code %FORMAUTO_EXIT_CODE%.
  pause
)

exit /b %FORMAUTO_EXIT_CODE%

:missing_node
echo [ERROR] Node.js is not installed or is not available in PATH.
goto :failed

:missing_npm
echo [ERROR] npm is not installed or is not available in PATH.
goto :failed

:missing_dotnet
echo [ERROR] .NET SDK is not installed or is not available in PATH.
goto :failed

:install_failed
echo [ERROR] Frontend dependency installation failed.

:failed
pause
exit /b 1
