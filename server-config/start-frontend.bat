@echo off
echo ====================================
echo  NotifManager Frontend Server
echo  IP: 10.41.15.227:3000
echo ====================================

cd /d C:\notifmanager\frontend

echo Starting NotifManager Frontend...
echo Server will be available at: http://10.41.15.227:3000
echo Connecting to backend at: http://10.41.15.227:8090
echo.

npx serve -s . -l 3000 --host 10.41.15.227

pause
