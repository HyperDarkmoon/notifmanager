@echo off
echo ============================================
echo    Testing Backend Connectivity
echo ============================================
echo.
echo Testing backend at: http://172.16.1.12:8090
echo.

echo Testing auth endpoint...
curl -s -w "Status: %%{http_code}\n" http://172.16.1.12:8090/api/auth/signin -o nul
echo.

echo Testing upload endpoint...
curl -s -w "Status: %%{http_code}\n" -X OPTIONS http://172.16.1.12:8090/api/content/upload-file -o nul
echo.

echo If you see "Status: 200" or "Status: 401" above, backend is accessible
echo If you see "curl: (7)" or connection errors, backend needs to be restarted
echo.
pause
