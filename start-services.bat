@echo off
REM Windows Batch Script to Start Notification Manager System
REM This script can be used with Windows Task Scheduler for auto-startup

echo ===========================================
echo Notification Manager System Startup
echo ===========================================

REM Set directories
set FRONTEND_DIR=E:\notifmanager
set BACKEND_DIR=E:\notificationbackend
set LOG_DIR=%FRONTEND_DIR%\logs

REM Create log directory if it doesn't exist
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

REM Function to check if a port is in use
REM We'll use netstat to check ports

echo Cleaning up existing processes...

REM Kill existing processes on our ports
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8090 " ^| findstr "LISTENING"') do (
    echo Killing process %%a on port 8090
    taskkill /PID %%a /F >nul 2>&1
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo Killing process %%a on port 3000
    taskkill /PID %%a /F >nul 2>&1
)

REM Wait for processes to terminate
timeout /t 3 /nobreak >nul

echo Starting backend server...

REM Start backend
cd /d "%BACKEND_DIR%"
if exist "mvnw.cmd" (
    echo Using Maven wrapper...
    start "Backend Server" /min cmd /c "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=production > %LOG_DIR%\backend.log 2>&1"
) else if exist "gradlew.bat" (
    echo Using Gradle wrapper...
    start "Backend Server" /min cmd /c "gradlew.bat bootRun --args=--spring.profiles.active=production > %LOG_DIR%\backend.log 2>&1"
) else (
    echo Using system Maven/Gradle...
    where mvn >nul 2>&1
    if %errorlevel% equ 0 (
        start "Backend Server" /min cmd /c "mvn spring-boot:run -Dspring-boot.run.profiles=production > %LOG_DIR%\backend.log 2>&1"
    ) else (
        where gradle >nul 2>&1
        if %errorlevel% equ 0 (
            start "Backend Server" /min cmd /c "gradle bootRun --args=--spring.profiles.active=production > %LOG_DIR%\backend.log 2>&1"
        ) else (
            echo Error: Neither Maven nor Gradle found!
            pause
            exit /b 1
        )
    )
)

echo Waiting for backend to start...
timeout /t 15 /nobreak >nul

echo Starting frontend server...

REM Start frontend
cd /d "%FRONTEND_DIR%"

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
)

REM Check if build directory exists for production
if exist "build" (
    echo Starting production server...
    where serve >nul 2>&1
    if %errorlevel% equ 0 (
        start "Frontend Server" /min cmd /c "serve -s build -l 3000 > %LOG_DIR%\frontend.log 2>&1"
    ) else (
        echo Installing serve...
        npm install -g serve
        start "Frontend Server" /min cmd /c "serve -s build -l 3000 > %LOG_DIR%\frontend.log 2>&1"
    )
) else (
    echo Starting development server...
    start "Frontend Server" /min cmd /c "npm start > %LOG_DIR%\frontend.log 2>&1"
)

echo Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo ===========================================
echo Notification Manager System Started
echo ===========================================
echo Access the application at: http://localhost:3000
echo Backend API available at: http://localhost:8090
echo.
echo Logs are available at:
echo   Backend: %LOG_DIR%\backend.log
echo   Frontend: %LOG_DIR%\frontend.log
echo.
echo To stop the services, run: stop-services.bat
echo ===========================================

REM Keep window open if run manually
if "%1" neq "auto" (
    echo Press any key to exit...
    pause >nul
)
