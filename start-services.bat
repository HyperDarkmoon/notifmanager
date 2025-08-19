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

REM Kill existing processes on our ports (not including MySQL port 3306)
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

echo Starting MySQL database...

REM Check if MySQL is already running on port 3306
netstat -ano | findstr ":3306 " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo MySQL is already running on port 3306
) else (
    echo MySQL not detected, attempting to start...
    
    REM Try to start MySQL via XAMPP Control Panel
    if exist "C:\xampp\xampp-control.exe" (
        echo Starting MySQL via XAMPP Control Panel...
        start "" "C:\xampp\xampp-control.exe" -start mysql
    ) else if exist "D:\xampp\xampp-control.exe" (
        echo Starting MySQL via XAMPP Control Panel...
        start "" "D:\xampp\xampp-control.exe" -start mysql
    ) else if exist "E:\xampp\xampp-control.exe" (
        echo Starting MySQL via XAMPP Control Panel...
        start "" "E:\xampp\xampp-control.exe" -start mysql
    ) else (
        REM Try to start MySQL service directly
        echo Trying to start MySQL service...
        net start MySQL 2>nul
        if %errorlevel% neq 0 (
            net start MySQL80 2>nul
            if %errorlevel% neq 0 (
                echo Warning: Could not start MySQL automatically
                echo Please ensure MySQL is running on port 3306
            )
        )
    )
    
    REM Wait for MySQL to start
    echo Waiting for MySQL to start...
    timeout /t 10 /nobreak >nul
)

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
    REM Set environment variables to prevent hanging on updates
    set NPM_CONFIG_UPDATE_NOTIFIER=false
    set NPM_CONFIG_FUND=false
    set NPM_CONFIG_AUDIT=false
    npm install --no-update-notifier --no-fund --no-audit --silent
)

REM Skip serve package installation to avoid hanging

REM Check if build directory exists for production
if exist "build" (
    echo Starting production server...
    
    REM Set environment variables to prevent npm update prompts
    set NPM_CONFIG_UPDATE_NOTIFIER=false
    set NPM_CONFIG_FUND=false
    set NPM_CONFIG_AUDIT=false
    
    REM Use npm serve script (most reliable)
    echo Using npm serve script...
    start "Frontend Server" /min cmd /c "set NPM_CONFIG_UPDATE_NOTIFIER=false && set NPM_CONFIG_FUND=false && npm run serve:silent > %LOG_DIR%\frontend.log 2>&1"
    
    timeout /t 5 /nobreak >nul
    
    REM Check if serve worked, if not try npx serve as fallback
    netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
    if %errorlevel% neq 0 (
        echo npm serve failed, trying npx serve...
        start "Frontend Server" /min cmd /c "set NPM_CONFIG_UPDATE_NOTIFIER=false && npx --yes --silent serve -s build -l 3000 > %LOG_DIR%\frontend.log 2>&1"
        timeout /t 3 /nobreak >nul
        
        REM Final fallback to npm start
        netstat -ano | findstr ":3000 " | findstr "LISTENING" >nul
        if %errorlevel% neq 0 (
            echo serve failed, trying npm start...
            start "Frontend Server" /min cmd /c "set NPM_CONFIG_UPDATE_NOTIFIER=false && set NPM_CONFIG_FUND=false && npm start --silent > %LOG_DIR%\frontend.log 2>&1"
        )
    )
) else (
    echo Starting development server...
    start "Frontend Server" /min cmd /c "set NPM_CONFIG_UPDATE_NOTIFIER=false && set NPM_CONFIG_FUND=false && npm start --silent > %LOG_DIR%\frontend.log 2>&1"
)

echo Waiting for frontend to start...
timeout /t 10 /nobreak >nul

echo ===========================================
echo Notification Manager System Started
echo ===========================================
echo Services status:
echo   MySQL Database: http://localhost:3306
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:8090
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
