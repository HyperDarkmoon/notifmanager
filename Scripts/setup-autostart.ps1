# Setup Script for Windows Task Scheduler Auto-Startup
# Run this script as Administrator to configure auto-startup

param(
    [switch]$Remove
)

$TaskName = "NotificationManagerAutoStart"
$ScriptPath = "E:\notifmanager\start-services.ps1"
$WorkingDirectory = "E:\notifmanager"

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host "This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

if ($Remove) {
    # Remove the scheduled task
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction Stop
        Write-Host "Successfully removed scheduled task: $TaskName" -ForegroundColor Green
    } catch {
        Write-Host "Failed to remove scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    }
    exit
}

# Check if script file exists
if (!(Test-Path $ScriptPath)) {
    Write-Host "Script file not found: $ScriptPath" -ForegroundColor Red
    Write-Host "Please ensure the start-services.ps1 file exists at the specified location." -ForegroundColor Yellow
    exit 1
}

try {
    # Remove existing task if it exists
    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false -ErrorAction SilentlyContinue
        Write-Host "Removed existing task..." -ForegroundColor Yellow
    } catch {
        # Task doesn't exist, continue
    }

    # Create a new scheduled task action
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$ScriptPath`" -Auto" -WorkingDirectory $WorkingDirectory

    # Create a trigger for system startup
    $trigger = New-ScheduledTaskTrigger -AtStartup

    # Create task settings
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -RunOnlyIfNetworkAvailable

    # Create the principal (run as SYSTEM with highest privileges)
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

    # Register the scheduled task
    Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "Auto-start Notification Manager System on boot"

    Write-Host "Successfully created scheduled task: $TaskName" -ForegroundColor Green
    Write-Host ""
    Write-Host "The Notification Manager will now start automatically when the system boots." -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  Name: $TaskName" -ForegroundColor White
    Write-Host "  Script: $ScriptPath" -ForegroundColor White
    Write-Host "  Trigger: At system startup" -ForegroundColor White
    Write-Host "  User: SYSTEM" -ForegroundColor White
    Write-Host ""
    Write-Host "You can manage this task through:" -ForegroundColor Cyan
    Write-Host "  - Task Scheduler (taskschd.msc)" -ForegroundColor White
    Write-Host "  - PowerShell: Get-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
    Write-Host ""
    Write-Host "To remove auto-startup, run: .\setup-autostart.ps1 -Remove" -ForegroundColor Yellow

} catch {
    Write-Host "Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
