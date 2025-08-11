@echo off
echo ====================================
echo  NotifManager Backend Server
echo  IP: 10.41.15.227:8090
echo ====================================

cd /d C:\notifmanager\backend

echo Starting NotifManager Backend...
echo Server will be available at: http://10.41.15.227:8090
echo API Endpoints will be at: http://10.41.15.227:8090/api
echo.

java -jar notifmanager.jar --spring.profiles.active=production --server.port=8090 --server.address=0.0.0.0

pause
