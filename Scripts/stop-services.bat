@echo off
REM Windows Batch Script to Stop Notification Manager System

echo ===========================================
echo Stopping Notification Manager System
echo ===========================================

REM Kill processes on specific ports
echo Stopping backend processes (port 8090)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8090 " ^| findstr "LISTENING"') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo Stopping frontend processes (port 3000)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr "LISTENING"') do (
    echo Killing process %%a
    taskkill /PID %%a /F >nul 2>&1
)

REM Kill any remaining related processes
echo Cleaning up remaining processes...

REM Kill npm/node processes
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM npm.exe >nul 2>&1

REM Kill Java processes (be careful with this in production)
for /f "tokens=2" %%a in ('tasklist /FI "IMAGENAME eq java.exe" /FO table /NH') do (
    for /f "tokens=*" %%b in ('wmic process where "ProcessId=%%a" get CommandLine /value ^| findstr "spring-boot"') do (
        echo Killing Spring Boot process %%a
        taskkill /PID %%a /F >nul 2>&1
    )
)

REM Wait for processes to terminate
echo Waiting for processes to terminate...
timeout /t 3 /nobreak >nul

REM Final check
echo Final port check:
netstat -an | findstr ":8090 " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo Warning: Port 8090 still in use
) else (
    echo Port 8090 is free
)

netstat -an | findstr ":3000 " | findstr "LISTENING" >nul
if %errorlevel% equ 0 (
    echo Warning: Port 3000 still in use
) else (
    echo Port 3000 is free
)

echo ===========================================
echo Notification Manager System Stopped
echo ===========================================

REM Keep window open if run manually
if "%1" neq "auto" (
    echo Press any key to exit...
    pause >nul
)
