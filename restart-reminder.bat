@echo off
echo ============================================
echo    BACKEND RESTART REMINDER
echo ============================================
echo.
echo IMPORTANT: After making changes to WebSecurityConfig.java
echo you MUST restart your Spring Boot backend for the 
echo CORS and security changes to take effect!
echo.
echo Steps:
echo 1. Stop your backend (Ctrl+C in the backend terminal)
echo 2. Restart your backend application
echo 3. Wait for it to start on port 8090
echo 4. Then run your frontend with: npm start
echo.
echo Network IP: 172.16.1.12
echo Frontend will be available at: http://172.16.1.12:3000
echo Backend API will be available at: http://172.16.1.12:8090
echo.
pause
