@echo off
echo ====================================
echo  NotifManager Server Setup
echo  Server IP: 10.41.15.227
echo ====================================

echo.
echo This script will start the frontend in production mode
echo Make sure the backend is running on port 8090
echo.

echo Starting frontend server on 10.41.15.227:3000...
echo Backend API will connect to: http://10.41.15.227:8090
echo.

set HOST=10.41.15.227
set PORT=3000
set HTTPS=false
set REACT_APP_API_URL=http://10.41.15.227:8090

call npm start

pause
