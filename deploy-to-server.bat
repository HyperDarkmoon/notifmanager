@echo off
echo ====================================
echo  NotifManager Server Deployment
echo  Target: 10.41.15.227
echo ====================================

set SERVER_IP=10.41.15.227
set FRONTEND_PORT=3000
set BACKEND_PORT=8090

echo.
echo Checking server connectivity...
ping -n 1 %SERVER_IP% >nul
if %ERRORLEVEL% neq 0 (
    echo WARNING: Cannot ping server %SERVER_IP%
    echo Please ensure the server is accessible
    echo.
)

echo.
echo 1. Building production version...
call npm run build:production

if %ERRORLEVEL% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo 2. Production build completed!
echo.
echo === DEPLOYMENT INSTRUCTIONS ===
echo.
echo Server Setup (on %SERVER_IP%):
echo 1. Create directories:
echo    mkdir C:\notifmanager
echo    mkdir C:\notifmanager\frontend
echo    mkdir C:\notifmanager\backend
echo    mkdir C:\notifmanager\data
echo    mkdir C:\notifmanager\logs
echo.
echo 2. Copy files to server:
echo    - Copy 'build' folder contents to C:\notifmanager\frontend\
echo    - Copy backend JAR to C:\notifmanager\backend\
echo.
echo 3. Install Node.js and Java on server if not already installed
echo.
echo 4. Start services:
echo    Backend:  java -jar C:\notifmanager\backend\notifmanager.jar --server.port=%BACKEND_PORT%
echo    Frontend: npx serve -s C:\notifmanager\frontend -l %FRONTEND_PORT%
echo.
echo 5. Configure Windows Firewall:
echo    netsh advfirewall firewall add rule name="NotifManager Frontend" dir=in action=allow protocol=TCP localport=%FRONTEND_PORT%
echo    netsh advfirewall firewall add rule name="NotifManager Backend" dir=in action=allow protocol=TCP localport=%BACKEND_PORT%
echo.
echo 6. Access URLs:
echo    Frontend: http://%SERVER_IP%:%FRONTEND_PORT%
echo    Backend:  http://%SERVER_IP%:%BACKEND_PORT%
echo.
echo === Windows Service Setup (Optional) ===
echo.
echo Download NSSM from nssm.cc and run these commands on the server:
echo.
echo Backend Service:
echo nssm install NotifManagerBackend java
echo nssm set NotifManagerBackend AppParameters "-jar C:\notifmanager\backend\notifmanager.jar --server.port=%BACKEND_PORT%"
echo nssm set NotifManagerBackend AppDirectory "C:\notifmanager\backend"
echo nssm start NotifManagerBackend
echo.
echo Frontend Service:
echo nssm install NotifManagerFrontend npx
echo nssm set NotifManagerFrontend AppParameters "serve -s C:\notifmanager\frontend -l %FRONTEND_PORT%"
echo nssm set NotifManagerFrontend AppDirectory "C:\notifmanager"
echo nssm start NotifManagerFrontend
echo.

pause
