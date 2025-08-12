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
        $connection = New-Object System.Net.Sockets.TcpClient
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
    
    Start-Sleep -Seconds 3
    
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
            Start-Process -FilePath "npm" -ArgumentList "install" -Wait -WindowStyle Hidden
        }
        
        $frontendStarted = $false
        
        # Check if build exists for production mode
        if (Test-Path "build") {
            Write-Log "Using production build"
            
            # Check if serve is available
            if (Get-Command serve -ErrorAction SilentlyContinue) {
                $frontendProcess = Start-Process -FilePath "serve" -ArgumentList "-s", "build", "-l", "3000" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\frontend.log" -RedirectStandardError "$LogDir\frontend-error.log"
                $frontendStarted = $true
            } else {
                Write-Log "Installing serve globally..."
                Start-Process -FilePath "npm" -ArgumentList "install", "-g", "serve" -Wait -WindowStyle Hidden
                $frontendProcess = Start-Process -FilePath "serve" -ArgumentList "-s", "build", "-l", "3000" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\frontend.log" -RedirectStandardError "$LogDir\frontend-error.log"
                $frontendStarted = $true
            }
        } else {
            Write-Log "Using development server"
            $frontendProcess = Start-Process -FilePath "npm" -ArgumentList "start" -WindowStyle Hidden -PassThru -RedirectStandardOutput "$LogDir\frontend.log" -RedirectStandardError "$LogDir\frontend-error.log"
            $frontendStarted = $true
        }
        
        Pop-Location
        
        if ($frontendStarted) {
            $frontendProcess.Id | Out-File "$LogDir\frontend.pid"
            
            # Wait for frontend to start
            if (!(Wait-ForService -Port 3000 -ServiceName "Frontend" -TimeoutSeconds 60)) {
                Write-Log "Frontend startup failed" "Error"
            }
        }
    } else {
        Write-Log "Frontend directory not found: $FrontendDir" "Error"
    }
    
    Write-Log "Notification Manager System startup completed"
    Write-Log "Access the application at: http://localhost:3000"
    Write-Log "Backend API available at: http://localhost:8090"
    
} catch {
    Write-Log "Error during startup: $($_.Exception.Message)" "Error"
    exit 1
}

# If not running in auto mode, keep the PowerShell window open
if (!$Auto) {
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}
