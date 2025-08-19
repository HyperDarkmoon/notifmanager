# PowerShell Script for Notification Manager Auto-Startup
# This script is designed to work with Windows Task Scheduler

param(
    [switch]$Auto,
    [string]$LogLevel = "Info"
)

# Configuration
$FrontendDir = "E:\notifmanager"
$BackendDir = "E:\notificationbackend"
$LogDir = "$FrontendDir\logs"

# Ensure log directory exists
if (!(Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# Logging function
function Write-Log {
    param([string]$Message, [string]$Level = "Info")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    
    Write-Host $logMessage
    Add-Content -Path "$LogDir\startup.log" -Value $logMessage
}

# Function to check if port is in use
function Test-Port {
    param([int]$Port)
    try {
        # Use netstat to check if port is listening (more reliable than TcpClient)
        $netstatResult = netstat -an | Select-String ":$Port " | Select-String "LISTENING"
        if ($netstatResult) {
            return $true
        }
        
        # Fallback to TcpClient method
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.ConnectTimeout = 1000
        $connection.Connect("localhost", $Port)
        $connection.Close()
        return $true
    } catch {
        return $false
    }
}

# Function to kill processes on specific port
function Stop-ProcessOnPort {
    param([int]$Port)
    
    Write-Log "Checking for processes on port $Port"
    
    $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | 
                 Select-Object -ExpandProperty OwningProcess -Unique
    
    if ($processes) {
        foreach ($processId in $processes) {
            try {
                $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Log "Stopping process $($process.ProcessName) (PID: $processId) on port $Port"
                    Stop-Process -Id $processId -Force
                }
            } catch {
                Write-Log "Failed to stop process PID: $processId" "Warning"
            }
        }
    } else {
        Write-Log "No processes found on port $Port"
    }
}

# Function to wait for service to be ready
function Wait-ForService {
    param([int]$Port, [string]$ServiceName, [int]$TimeoutSeconds = 60)
    
    Write-Log "Waiting for $ServiceName to start on port $Port..."
    
    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        if (Test-Port $Port) {
            Write-Log "$ServiceName is now running on port $Port"
            return $true
        }
        Start-Sleep -Seconds 2
        $elapsed += 2
        Write-Log "Waiting for $ServiceName... ($elapsed/$TimeoutSeconds seconds)"
    }
    
    Write-Log "$ServiceName failed to start within $TimeoutSeconds seconds" "Error"
    return $false
}

try {
    Write-Log "Starting Notification Manager System" "Info"
    
    # Clean up existing processes
    Write-Log "Cleaning up existing processes..."
    Stop-ProcessOnPort 8090  # Backend
    Stop-ProcessOnPort 3000  # Frontend
    # Note: Not stopping MySQL (port 3306) as it should remain running
    
    Start-Sleep -Seconds 3
    
    # Start MySQL/XAMPP
    Write-Log "Starting MySQL database..."
    
    # Common XAMPP installation paths
    $XamppPaths = @(
        "C:\xampp\mysql\bin\mysqld.exe",
        "D:\xampp\mysql\bin\mysqld.exe",
        "E:\xampp\mysql\bin\mysqld.exe",
        "C:\Program Files\xampp\mysql\bin\mysqld.exe",
        "C:\Program Files (x86)\xampp\mysql\bin\mysqld.exe"
    )
    
    $XamppControlPaths = @(
        "C:\xampp\xampp-control.exe",
        "D:\xampp\xampp-control.exe",
        "E:\xampp\xampp-control.exe",
        "C:\Program Files\xampp\xampp-control.exe",
        "C:\Program Files (x86)\xampp\xampp-control.exe"
    )
    
    # Check if MySQL is already running (more thorough check)
    Write-Log "Checking MySQL status on port 3306..."
    $netstatCheck = netstat -an | Select-String ":3306 " | Select-String "LISTENING"
    $mysqlRunning = $netstatCheck -ne $null
    
    if ($mysqlRunning) {
        Write-Log "MySQL is already running on port 3306"
        Write-Log "MySQL process details: $($netstatCheck | Out-String)"
    } else {
        Write-Log "MySQL not detected on port 3306, attempting to start..."
        
        # Try to find and start XAMPP MySQL
        $xamppStarted = $false
        
        # Method 1: Try XAMPP Control Panel
        foreach ($xamppPath in $XamppControlPaths) {
            if (Test-Path $xamppPath) {
                Write-Log "Found XAMPP Control at: $xamppPath"
                try {
                    # Start XAMPP Control Panel and try to start MySQL
                    Write-Log "Starting MySQL via XAMPP Control Panel..."
                    Start-Process -FilePath $xamppPath -ArgumentList "-start mysql" -WindowStyle Hidden
                    $xamppStarted = $true
                    break
                } catch {
                    Write-Log "Failed to start XAMPP Control: $($_.Exception.Message)" "Warning"
                }
            }
        }
        
        # Method 2: Try direct MySQL service start if XAMPP Control didn't work
        if (!$xamppStarted) {
            Write-Log "Trying to start MySQL service directly..."
            try {
                $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Select-Object -First 1
                if ($mysqlService) {
                    Write-Log "Found MySQL service: $($mysqlService.Name)"
                    if ($mysqlService.Status -ne "Running") {
                        Start-Service -Name $mysqlService.Name
                        Write-Log "Started MySQL service: $($mysqlService.Name)"
                        $xamppStarted = $true
                    } else {
                        Write-Log "MySQL service is already running"
                        $xamppStarted = $true
                    }
                }
            } catch {
                Write-Log "Failed to start MySQL service: $($_.Exception.Message)" "Warning"
            }
        }
        
        # Method 3: Try direct mysqld.exe execution
        if (!$xamppStarted) {
            foreach ($mysqlPath in $XamppPaths) {
                if (Test-Path $mysqlPath) {
                    Write-Log "Found MySQL at: $mysqlPath"
                    try {
                        $mysqlDir = Split-Path $mysqlPath -Parent
                        Push-Location $mysqlDir
                        Write-Log "Starting MySQL daemon directly..."
                        Start-Process -FilePath $mysqlPath -ArgumentList "--console" -WindowStyle Hidden -PassThru
                        Pop-Location
                        $xamppStarted = $true
                        break
                    } catch {
                        Write-Log "Failed to start MySQL daemon: $($_.Exception.Message)" "Warning"
                        Pop-Location
                    }
                }
            }
        }
        
        if ($xamppStarted) {
            # Wait for MySQL to start
            Write-Log "Waiting for MySQL to start on port 3306..."
            if (Wait-ForService -Port 3306 -ServiceName "MySQL" -TimeoutSeconds 30) {
                Write-Log "MySQL started successfully"
            } else {
                Write-Log "MySQL startup may have failed - continuing anyway" "Warning"
            }
        } else {
            Write-Log "Could not find or start MySQL/XAMPP automatically" "Warning"
            Write-Log "Please ensure MySQL is running on port 3306 before starting the backend" "Warning"
        }
    }
    
    # Start Backend
    Write-Log "Starting backend server..."
    
    if (Test-Path $BackendDir) {
        Push-Location $BackendDir
        
        $backendStarted = $false
        
        # Try Maven wrapper first
        if (Test-Path ".\mvnw.cmd") {
            Write-Log "Using Maven wrapper for backend"
            $backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=production" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\backend.log" -RedirectStandardError "$LogDir\backend-error.log"
            $backendStarted = $true
        }
        # Try system Maven
        elseif (Get-Command mvn -ErrorAction SilentlyContinue) {
            Write-Log "Using system Maven for backend"
            $backendProcess = Start-Process -FilePath "mvn" -ArgumentList "spring-boot:run", "-Dspring-boot.run.profiles=production" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\backend.log" -RedirectStandardError "$LogDir\backend-error.log"
            $backendStarted = $true
        }
        # Try Gradle wrapper
        elseif (Test-Path ".\gradlew.bat") {
            Write-Log "Using Gradle wrapper for backend"
            $backendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "gradlew.bat bootRun --args=--spring.profiles.active=production" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\backend.log" -RedirectStandardError "$LogDir\backend-error.log"
            $backendStarted = $true
        }
        # Try system Gradle
        elseif (Get-Command gradle -ErrorAction SilentlyContinue) {
            Write-Log "Using system Gradle for backend"
            $backendProcess = Start-Process -FilePath "gradle" -ArgumentList "bootRun", "--args=--spring.profiles.active=production" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\backend.log" -RedirectStandardError "$LogDir\backend-error.log"
            $backendStarted = $true
        }
        else {
            Write-Log "No build tool found for backend" "Error"
        }
        
        Pop-Location
        
        if ($backendStarted) {
            $backendProcess.Id | Out-File "$LogDir\backend.pid"
            
            # Wait for backend to start
            if (!(Wait-ForService -Port 8090 -ServiceName "Backend" -TimeoutSeconds 90)) {
                Write-Log "Backend startup failed" "Error"
            }
        }
    } else {
        Write-Log "Backend directory not found: $BackendDir" "Error"
    }
    
    # Start Frontend
    Write-Log "Starting frontend server..."
    
    if (Test-Path $FrontendDir) {
        Push-Location $FrontendDir
        
        # Check if node_modules exists
        if (!(Test-Path "node_modules")) {
            Write-Log "Installing frontend dependencies..."
            # Set environment variables to prevent hanging on updates
            $env:NPM_CONFIG_UPDATE_NOTIFIER = "false"
            $env:NPM_CONFIG_FUND = "false"
            $env:NPM_CONFIG_AUDIT = "false"
            Start-Process -FilePath "npm" -ArgumentList "install", "--no-update-notifier", "--no-fund", "--no-audit", "--silent" -Wait -WindowStyle Hidden
        }
        
        # Skip serve package installation - use alternative methods instead
        Write-Log "Skipping serve package installation to avoid hanging..."
        
        $frontendStarted = $false
        
        # Check if build exists for production mode
        if (Test-Path "build") {
            Write-Log "Using production build"
            Write-Log "Build directory found at: $FrontendDir\build"
            
            # Skip serve version check - it's causing issues
            Write-Log "Starting production server with reliable methods..."
            
            # Method 1: Try a simple batch file approach to avoid Node.js execution issues
            try {
                Write-Log "Creating temporary batch file for frontend serving..."
                $tempBat = Join-Path $env:TEMP "start-frontend.bat"
                $batContent = @"
@echo off
set NPM_CONFIG_UPDATE_NOTIFIER=false
set NPM_CONFIG_FUND=false
set NPM_CONFIG_AUDIT=false
cd /d "$FrontendDir"
echo Starting frontend server...
echo Trying npm serve first...
npm run serve:silent 2>nul
if %errorlevel% neq 0 (
    echo npm serve failed, trying npx serve...
    npx --yes --silent serve -s build -l 3000 2>nul
    if %errorlevel% neq 0 (
        echo serve failed, trying npm start...
        npm start --silent
    )
)
"@
                Set-Content -Path $tempBat -Value $batContent
                
                $frontendProcess = Start-Process -FilePath $tempBat -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\frontend.log" -RedirectStandardError "$LogDir\frontend-error.log"
                $frontendStarted = $true
                Write-Log "Batch file frontend server started with PID: $($frontendProcess.Id)"
                
            } catch {
                Write-Log "Batch file approach failed: $($_.Exception.Message)" "Warning"
                Write-Log "Trying direct cmd.exe approach..."
                
                try {
                    # Method 2: Try using cmd.exe directly with anti-hang settings
                    $env:NPM_CONFIG_UPDATE_NOTIFIER = "false"
                    $env:NPM_CONFIG_FUND = "false"
                    $env:NPM_CONFIG_AUDIT = "false"
                    $cmdArgs = "/c `"set NPM_CONFIG_UPDATE_NOTIFIER=false && set NPM_CONFIG_FUND=false && cd /d `"$FrontendDir`" && npm run serve:silent`""
                    $frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\frontend.log" -RedirectStandardError "$LogDir\frontend-error.log"
                    $frontendStarted = $true
                    Write-Log "cmd.exe direct approach started with PID: $($frontendProcess.Id)"
                    
                } catch {
                    Write-Log "cmd.exe approach failed: $($_.Exception.Message)" "Warning"
                    Write-Log "Final fallback: npm start..."
                    
                    # Final fallback: npm start with cmd.exe and anti-hang settings
                    $env:NPM_CONFIG_UPDATE_NOTIFIER = "false"
                    $env:NPM_CONFIG_FUND = "false"
                    $env:NPM_CONFIG_AUDIT = "false"
                    $cmdArgs = "/c `"set NPM_CONFIG_UPDATE_NOTIFIER=false && set NPM_CONFIG_FUND=false && cd /d `"$FrontendDir`" && npm start --silent`""
                    $frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList $cmdArgs -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\frontend.log" -RedirectStandardError "$LogDir\frontend-error.log"
                    $frontendStarted = $true
                    Write-Log "Final fallback npm start process started with PID: $($frontendProcess.Id)"
                }
            }
            
            if ($frontendStarted) {
                Start-Sleep -Seconds 8
                
                # Check if process is still running
                if (Get-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue) {
                    Write-Log "Frontend process is still running"
                } else {
                    Write-Log "Frontend process has already exited!" "Error"
                    Write-Log "Check logs at: $LogDir\frontend.log and $LogDir\frontend-error.log"
                    $frontendStarted = $false
                }
            }
        } else {
            Write-Log "No build directory found, using development server"
            Write-Log "Command: npm start"
            Write-Log "Working directory: $FrontendDir"
            
            # Check if package.json exists
            if (Test-Path "package.json") {
                Write-Log "package.json found"
            } else {
                Write-Log "package.json NOT found!" "Error"
            }
            
            # Set environment variables to prevent hanging on updates
            $env:NPM_CONFIG_UPDATE_NOTIFIER = "false"
            $env:NPM_CONFIG_FUND = "false"
            $env:NPM_CONFIG_AUDIT = "false"
            $frontendProcess = Start-Process -FilePath "npm" -ArgumentList "start", "--silent" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\frontend.log" -RedirectStandardError "$LogDir\frontend-error.log"
            $frontendStarted = $true
            Write-Log "Development server process started with PID: $($frontendProcess.Id)"
        }
        
        Pop-Location
        
        if ($frontendStarted) {
            $frontendProcess.Id | Out-File "$LogDir\frontend.pid"
            Write-Log "Frontend PID saved to: $LogDir\frontend.pid"
            
            # Wait for frontend to start
            Write-Log "Checking if frontend process is still alive before waiting for port..."
            if (Get-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue) {
                Write-Log "Frontend process is alive, waiting for port 3000..."
                
                if (!(Wait-ForService -Port 3000 -ServiceName "Frontend" -TimeoutSeconds 60)) {
                    Write-Log "Frontend startup failed - port not available" "Error"
                    
                    # Check if process is still running
                    if (Get-Process -Id $frontendProcess.Id -ErrorAction SilentlyContinue) {
                        Write-Log "Frontend process is still running but port 3000 is not available" "Error"
                        Write-Log "This might indicate the process is starting on a different port or has an error"
                    } else {
                        Write-Log "Frontend process has crashed or exited" "Error"
                    }
                    
                    # Try to read error logs if they exist
                    if (Test-Path "$LogDir\frontend-error.log") {
                        Write-Log "Frontend error log contents:"
                        $errorContent = Get-Content "$LogDir\frontend-error.log" -Raw -ErrorAction SilentlyContinue
                        if ($errorContent) {
                            Write-Log $errorContent "Error"
                        } else {
                            Write-Log "Error log is empty"
                        }
                    }
                    
                    if (Test-Path "$LogDir\frontend.log") {
                        Write-Log "Frontend output log contents:"
                        $outputContent = Get-Content "$LogDir\frontend.log" -Raw -ErrorAction SilentlyContinue
                        if ($outputContent) {
                            Write-Log $outputContent "Info"
                        } else {
                            Write-Log "Output log is empty"
                        }
                    }
                } else {
                    Write-Log "Frontend started successfully on port 3000"
                }
            } else {
                Write-Log "Frontend process died immediately after starting!" "Error"
            }
        }
    } else {
        Write-Log "Frontend directory not found: $FrontendDir" "Error"
    }
    
    Write-Log "Notification Manager System startup completed"
    Write-Log "Services status:"
    Write-Log "  MySQL Database: http://10.47.15.227:3306"
    Write-Log "  Frontend: http://10.47.15.227:3000"
    Write-Log "  Backend API: http://10.47.15.227:8090"
    
} catch {
    Write-Log "Error during startup: $($_.Exception.Message)" "Error"
    exit 1
}

# If not running in auto mode, keep the PowerShell window open
if (!$Auto) {
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
