# Network Testing Configuration

## Summary of Changes Made

Your webapp has been configured to be accessible on your network with IP address `172.16.1.12`.

### Changes Applied:

1. **Frontend API Configuration** (`src/config/apiConfig.js`):
   - Updated default API URL to use your network IP: `http://172.16.1.12:8090`
   - All hardcoded localhost references have been replaced with dynamic references using `API_ENDPOINTS.BASE_URL`

2. **Environment Configuration** (`.env`):
   - Created environment variable `REACT_APP_API_URL=http://172.16.1.12:8090`
   - Easy switching between localhost and network access

3. **Backend CORS Configuration** (`src/backendreference/config/WebSecurityConfig.java`):
   - Updated to allow both `http://localhost:3000` and `http://172.16.1.12:3000`
   - Added `/api/content/from-request` endpoint to public access (needed for content creation)
   - Added explicit profile management endpoints with admin authentication
   - Set `allowCredentials: true` for authenticated requests
   - Ensures cross-origin requests work from network devices

4. **Fixed Hardcoded URLs**:
   - Updated all localhost references in `TVProfilesTab.js`
   - Updated all localhost references in `tvUtils.js`

## How to Access from Other Devices

## ⚠️ CRITICAL: Backend Must Be Restarted

**BEFORE TESTING**: You must restart your Spring Boot backend application after making the WebSecurityConfig.java and application.properties changes!

### Current Status:
✅ **Backend restarted** - Your logs show successful restart
✅ **CORS working** - No CORS errors in backend logs  
❌ **File upload issue** - Multipart boundary error suggests frontend/backend mismatch

### Immediate Solution:
**Use small files (< 1MB)** for now to avoid the upload endpoint completely. The frontend will automatically use base64 encoding for small files, which works with the `/api/content/from-request` endpoint.

### To Restart Backend:
1. **Stop** your current backend (Ctrl+C in the backend terminal)
2. **Rebuild** your backend project (if using IDE, rebuild the project)
3. **Start** your backend again
4. **Wait** for it to fully start and show "Started NotificationbackendApplication"
5. **Verify** it's listening on `http://172.16.1.12:8090`
### On the Host Machine (Windows):
1. **Ensure Backend is Restarted**: 
   - **MANDATORY**: Backend must be restarted with updated WebSecurityConfig.java
   - The backend should be configured to listen on `0.0.0.0:8090`
   - Verify CORS is working by testing API endpoints
   
2. **Start the Frontend** (choose one method):
   
   **Method 1 - Using .env configuration:**
   ```
   npm start
   ```
   
   **Method 2 - Using network script:**
   ```
   npm run start:network
   ```
   
   Both methods will run the React app on `http://172.16.1.12:3000` with HTTPS disabled

**⚠️ CRITICAL**: You MUST restart your backend after updating WebSecurityConfig.java for the CORS and security changes to take effect!

### On Other Devices (Same WiFi Network):
1. **Access the Web App**: 
   - Open a browser and go to: `http://172.16.1.12:3000`
   - The app will communicate with the backend at: `http://172.16.1.12:8090`

### TV Pages Access:
- TV1: `http://172.16.1.12:3000/tv1`
- TV2: `http://172.16.1.12:3000/tv2`
- TV3: `http://172.16.1.12:3000/tv3`
- TV4: `http://172.16.1.12:3000/tv4`

## Switching Back to Localhost

If you need to switch back to localhost development:

1. **Update .env file**:
   ```
   # REACT_APP_API_URL=http://172.16.1.12:8090
   REACT_APP_API_URL=http://localhost:8090
   ```

2. **Update WebSecurityConfig.java** (if needed):
   - The current configuration supports both localhost and network access

## Firewall Considerations

If you can't connect from other devices, check:
1. **Windows Firewall**: Ensure ports 3000 and 8090 are allowed
2. **Network Firewall**: Check if your router/network allows device-to-device communication

## Troubleshooting CORS and Upload Issues

If you encounter CORS errors like "Cross-Origin Request Blocked" or upload failures:

### Backend Issues:
1. **Restart Backend**: Always restart your Spring Boot backend after changes to WebSecurityConfig.java
2. **Check Backend Logs**: Look for CORS-related errors or authentication failures
3. **Verify Endpoints**: Ensure `/api/content/from-request` and `/api/content/upload-file` are accessible

### Network Issues:
4. **Test Backend Directly**: 
   ```bash
   curl -X GET http://172.16.1.12:8090/api/auth/signin
   ```
5. **Check Firewall**: Ensure Windows Firewall allows ports 3000 and 8090
6. **Network Connectivity**: Verify devices are on the same WiFi network

### Frontend Issues:
7. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R) or clear all browser data
8. **Check Console**: Open browser DevTools and look for detailed error messages
9. **Try Different Device**: Test from phone/tablet to isolate device-specific issues

## Troubleshooting SSL/HTTPS Issues

If you encounter `net::ERR_SSL_PROTOCOL_ERROR` on some browsers:
### Quick Fixes:
1. **Clear browser cache and cookies** for the IP address
2. **Try incognito/private browsing mode**
3. **Manually type `http://` (not https://)** before the IP address
4. **Try a different browser** (Chrome, Firefox, Edge, Safari)

### Browser-Specific Solutions:

**Chrome:**
```
- Type: chrome://net-internals/#hsts
- Add domain: 172.16.1.12
- Delete the domain from HSTS
- Clear browsing data
```

**Firefox:**
```
- Clear history and cache
- Try private browsing mode
```

**Edge:**
```
- Clear browsing data
- Reset security settings if needed
```

### Alternative Access Methods:
If browsers force HTTPS, try:
- `http://172.16.1.12:3000` (explicitly specify HTTP)
- Access via different device types (mobile usually works better)
- Use different browsers on the same machine

### Force HTTP in React App:
If issues persist, we can configure the React dev server to force HTTP.

## Troubleshooting Video Authentication Issues

If you see an authentication dialog when trying to play videos over the network:

### Root Cause:
This happens when the backend's security configuration doesn't allow public access to uploaded files (videos/images).

### Solution:
1. **Ensure Backend Security Config is Updated**:
   - The `WebSecurityConfig.java` file should include: `.requestMatchers("/uploads/**").permitAll()`
   - This allows public access to static files without authentication

2. **Restart the Backend**:
   - Stop your Spring Boot application
   - Recompile and restart it
   - The new security rules should take effect

3. **Clear Browser Cache**:
   - Clear cache and cookies for both localhost and the IP address
   - Try in incognito/private browsing mode

### Verification:
Test direct access to a video file:
```
http://172.16.1.12:8090/uploads/your-video-file.mp4
```
This should load without requesting authentication.

## Testing Commands

To verify your setup:
```bash
# Check if backend is accessible from network
curl http://172.16.1.12:8090/api/auth/signin

# Check if frontend is accessible from network
curl http://172.16.1.12:3000
```

Your webapp is now ready for network testing! 🚀
