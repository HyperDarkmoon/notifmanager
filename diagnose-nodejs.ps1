# Node.js Environment Diagnostic Script
Write-Host "=== Node.js Environment Diagnostics ===" -ForegroundColor Cyan

# Check Node.js installation
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "✓ Node.js Version: $nodeVersion" -ForegroundColor Green
    
    $nodePath = & where.exe node 2>&1
    Write-Host "✓ Node.js Path: $nodePath" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found or not working" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check npm installation
try {
    $npmVersion = & npm --version 2>&1
    Write-Host "✓ npm Version: $npmVersion" -ForegroundColor Green
    
    $npmPath = & where.exe npm 2>&1
    Write-Host "✓ npm Path: $npmPath" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found or not working" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check npx
try {
    $npxVersion = & npx --version 2>&1
    Write-Host "✓ npx Version: $npxVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npx not found or not working" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Check PATH environment
Write-Host "`n=== PATH Analysis ===" -ForegroundColor Cyan
$pathEntries = $env:PATH -split ';'
$nodeRelatedPaths = $pathEntries | Where-Object { $_ -like "*node*" -or $_ -like "*npm*" }

if ($nodeRelatedPaths) {
    Write-Host "Node.js related PATH entries:" -ForegroundColor Yellow
    $nodeRelatedPaths | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
} else {
    Write-Host "No Node.js related PATH entries found" -ForegroundColor Red
}

# Test simple commands
Write-Host "`n=== Command Tests ===" -ForegroundColor Cyan

# Test cmd.exe execution
try {
    $cmdResult = & cmd.exe /c "echo test" 2>&1
    Write-Host "✓ cmd.exe works: $cmdResult" -ForegroundColor Green
} catch {
    Write-Host "✗ cmd.exe failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test a simple npm command
try {
    Write-Host "Testing 'npm help'..." -ForegroundColor Yellow
    & npm help | Out-Null
    Write-Host "✓ npm help works" -ForegroundColor Green
} catch {
    Write-Host "✗ npm help failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check if we can create temporary files
try {
    $tempFile = Join-Path $env:TEMP "test-$(Get-Random).txt"
    Set-Content -Path $tempFile -Value "test"
    Remove-Item $tempFile
    Write-Host "✓ Temporary file creation works" -ForegroundColor Green
} catch {
    Write-Host "✗ Temporary file creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Recommendations ===" -ForegroundColor Cyan
Write-Host "If you see errors above:" -ForegroundColor Yellow
Write-Host "1. Reinstall Node.js from https://nodejs.org/" -ForegroundColor White
Write-Host "2. Make sure to restart PowerShell after installation" -ForegroundColor White
Write-Host "3. Check that your PATH includes Node.js directories" -ForegroundColor White
Write-Host "4. Try running PowerShell as Administrator" -ForegroundColor White
