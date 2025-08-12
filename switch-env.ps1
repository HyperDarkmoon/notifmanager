# NotifManager Environment Switcher PowerShell Script

function Show-Menu {
    Write-Host "=============================================="
    Write-Host " NotifManager Environment Switcher"
    Write-Host "=============================================="
    Write-Host ""
    Write-Host "Choose your environment:"
    Write-Host "1. Local Development (localhost:8090)"
    Write-Host "2. Production Server (10.41.15.227:8090)"
    Write-Host "3. Show current configuration"
    Write-Host "4. Exit"
    Write-Host ""
}

function Switch-ToLocal {
    Write-Host ""
    Write-Host "Switching to LOCAL development environment..." -ForegroundColor Yellow
    Copy-Item ".env.local" ".env" -Force
    Write-Host "SUCCESS: Environment set to LOCAL (localhost:8090)" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: npm start" -ForegroundColor Cyan
    Write-Host ""
}

function Switch-ToProduction {
    Write-Host ""
    Write-Host "Switching to PRODUCTION environment..." -ForegroundColor Yellow
    Copy-Item ".env.production" ".env" -Force
    Write-Host "SUCCESS: Environment set to PRODUCTION (10.41.15.227:8090)" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now run: npm start" -ForegroundColor Cyan
    Write-Host ""
}

function Show-CurrentConfig {
    Write-Host ""
    Write-Host "Current .env configuration:" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Gray
    Get-Content ".env" | Write-Host
    Write-Host "========================================" -ForegroundColor Gray
    Write-Host ""
}

# Main script
do {
    Show-Menu
    $choice = Read-Host "Enter your choice (1-4)"
    
    switch ($choice) {
        "1" { Switch-ToLocal }
        "2" { Switch-ToProduction }
        "3" { Show-CurrentConfig }
        "4" { 
            Write-Host "Goodbye!" -ForegroundColor Green
            break 
        }
        default { 
            Write-Host "Invalid choice. Please try again." -ForegroundColor Red
            Write-Host ""
        }
    }
    
    if ($choice -ne "4") {
        Write-Host "Press any key to continue..." -ForegroundColor Gray
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        Clear-Host
    }
} while ($choice -ne "4")
