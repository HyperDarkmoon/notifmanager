# Notification Manager Auto-Startup Scripts

This directory contains scripts to automate the startup of both frontend and backend servers for the Notification Manager system.

## Files Overview

### Bash Scripts (Linux/WSL)
- `start-backend.sh` - Starts the backend server only
- `start-frontend.sh` - Starts the frontend server only  
- `start-services.sh` - Starts both servers with monitoring
- `stop-services.sh` - Stops all services

### Windows Scripts
- `start-services.bat` - Windows batch file to start both servers
- `stop-services.bat` - Windows batch file to stop all services
- `start-services.ps1` - PowerShell script for robust startup (recommended)
- `setup-autostart.ps1` - Configures Windows auto-startup on boot

## Directory Structure Expected

The scripts expect the following directory structure:
```
E:\
├── notifmanager\          (Frontend - React app)
│   ├── package.json
│   ├── src\
│   ├── build\             (Optional - for production mode)
│   └── ...
└── notificationbackend\   (Backend - Spring Boot app)
    ├── mvnw.cmd / gradlew.bat
    ├── pom.xml / build.gradle
    ├── src\
    └── ...
```

## Quick Start

### Windows (Recommended)

1. **Manual Startup:**
   ```powershell
   .\start-services.ps1
   ```

2. **Setup Auto-Startup on Boot:**
   ```powershell
   # Run as Administrator
   .\setup-autostart.ps1
   ```

3. **Stop Services:**
   ```powershell
   .\stop-services.ps1
   ```

### Linux/WSL

1. **Make scripts executable:**
   ```bash
   chmod +x *.sh
   ```

2. **Start services:**
   ```bash
   ./start-services.sh
   ```

3. **Stop services:**
   ```bash
   ./stop-services.sh
   ```

## Auto-Startup Configuration

### Windows Task Scheduler

To configure auto-startup on Windows boot:

1. **Run PowerShell as Administrator**
2. **Navigate to the notifmanager directory**
3. **Run the setup script:**
   ```powershell
   .\setup-autostart.ps1
   ```

This will create a Windows Task Scheduler task that:
- Runs at system startup
- Executes with SYSTEM privileges
- Starts both frontend and backend automatically
- Waits for network availability

### Remove Auto-Startup

To remove the auto-startup configuration:
```powershell
# Run as Administrator
.\setup-autostart.ps1 -Remove
```

### Linux Systemd (Alternative)

For Linux systems, you can create systemd services:

1. **Create service file:**
   ```bash
   sudo nano /etc/systemd/system/notifmanager.service
   ```

2. **Add content:**
   ```ini
   [Unit]
   Description=Notification Manager System
   After=network.target

   [Service]
   Type=forking
   User=your-username
   WorkingDirectory=/path/to/notifmanager
   ExecStart=/path/to/notifmanager/start-services.sh
   ExecStop=/path/to/notifmanager/stop-services.sh
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

3. **Enable service:**
   ```bash
   sudo systemctl enable notifmanager.service
   sudo systemctl start notifmanager.service
   ```

## Port Configuration

The scripts use the following default ports:
- **Frontend:** 3000
- **Backend:** 8090

Make sure these ports are available or modify the scripts accordingly.

## Logs

All logs are stored in the `logs/` directory:
- `logs/frontend.log` - Frontend server output
- `logs/backend.log` - Backend server output
- `logs/startup.log` - PowerShell startup script logs (Windows only)
- `logs/frontend.pid` - Frontend process ID
- `logs/backend.pid` - Backend process ID

## Troubleshooting

### Common Issues

1. **Port Already in Use:**
   - Run the stop script first: `.\stop-services.ps1`
   - Check for other applications using ports 3000 or 8090

2. **Build Tools Not Found:**
   - Ensure Maven or Gradle is installed for the backend
   - Ensure Node.js and npm are installed for the frontend

3. **Permission Errors:**
   - Run PowerShell as Administrator for Windows
   - Use `sudo` for Linux operations if needed

4. **Services Not Starting:**
   - Check the log files in the `logs/` directory
   - Verify directory paths in the scripts match your setup
   - Ensure all dependencies are installed

### Manual Verification

Check if services are running:
```bash
# Check ports
netstat -an | grep ":3000\|:8090"

# Check processes (Windows)
tasklist | findstr "node\|java"

# Check processes (Linux)
ps aux | grep "node\|java"
```

### Customization

To modify for different directories or ports:

1. **Edit the directory variables** at the top of each script
2. **Update port numbers** in the port checking functions
3. **Modify the Spring Boot profile** if using different configurations

## Security Notes

- The Windows Task Scheduler task runs as SYSTEM for reliability
- Consider running with a dedicated service account in production environments
- Ensure proper firewall configuration for the ports used
- Review and adjust script permissions as needed

## Production Recommendations

1. **Use production builds** for the frontend (`npm run build`)
2. **Configure proper logging** levels for both applications
3. **Set up monitoring** for the services
4. **Configure backup procedures** for application data
5. **Review security settings** and access controls
