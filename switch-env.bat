@echo off
:start
cls
echo ==============================================
echo  NotifManager Environment Switcher
echo ==============================================
echo.
echo Choose your environment:
echo 1. Local Development (localhost:8090)
echo 2. Production Server (10.41.15.227:8090)
echo 3. Show current configuration
echo 4. Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto local
if "%choice%"=="2" goto production
if "%choice%"=="3" goto show
if "%choice%"=="4" goto exit
goto invalid

:local
echo.
echo Switching to LOCAL development environment...
copy .env.local .env > nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Environment set to LOCAL ^(localhost:8090^)
) else (
    echo [ERROR] Failed to copy .env.local file
)
echo.
echo You can now run: npm start
echo.
pause
goto start

:production
echo.
echo Switching to PRODUCTION environment...
copy .env.production .env > nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Environment set to PRODUCTION ^(10.41.15.227:8090^)
) else (
    echo [ERROR] Failed to copy .env.production file
)
echo.
echo You can now run: npm start
echo.
pause
goto start

:show
echo.
echo Current .env configuration:
echo ========================================
if exist .env (
    type .env
) else (
    echo .env file not found
)
echo ========================================
echo.
pause
goto start

:invalid
echo Invalid choice. Please try again.
echo.
pause
goto start

:exit
echo Goodbye!
exit /b 0
