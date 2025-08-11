@echo off
echo ====================================
echo  NotifManager Production Build
echo  Target Server: 10.41.15.227
echo ====================================

echo.
echo 1. Installing dependencies...
call npm install

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo 2. Building for production...
call npm run build:production

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to build project
    pause
    exit /b 1
)

echo.
echo 3. Build completed successfully!
echo Built files are in the 'build' directory
echo.
echo Next steps:
echo - Copy the 'build' folder to your server at 10.41.15.227
echo - Copy the backend JAR file to the server
echo - Start the backend service on port 8090
echo - Serve the frontend files on port 3000
echo.
pause
