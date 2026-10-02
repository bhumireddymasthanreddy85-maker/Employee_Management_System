$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$python = Join-Path $projectRoot ".venv\Scripts\python.exe"
$frontend = Join-Path $projectRoot "frontend"

function Test-LocalPort([int]$Port) {
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $result = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
        return $result.AsyncWaitHandle.WaitOne(250) -and $client.Connected
    }
    catch {
        return $false
    }
    finally {
        $client.Dispose()
    }
}

function Escape-PowerShellString([string]$Value) {
    return $Value.Replace("'", "''")
}

if (-not (Test-Path $python)) {
    throw "Python environment not found at $python. Create it and install backend/requirements.txt first."
}
if (-not (Test-Path (Join-Path $frontend "node_modules"))) {
    throw "Frontend dependencies are missing. Run 'npm install' in the frontend folder first."
}

if (-not (Test-LocalPort 27017)) {
    $mongod = Get-Command mongod.exe -ErrorAction SilentlyContinue
    if (-not $mongod) {
        throw "mongod.exe was not found on PATH. Install MongoDB Community Server or start MongoDB manually."
    }
    New-Item -ItemType Directory -Force -Path "C:\data\db" | Out-Null
    New-Item -ItemType Directory -Force -Path "C:\data" | Out-Null
    Start-Process -FilePath $mongod.Source -ArgumentList @(
        "--dbpath", "C:\data\db",
        "--logpath", "C:\data\mongod.log",
        "--bind_ip", "127.0.0.1",
        "--port", "27017"
    ) -WindowStyle Minimized
    Write-Host "Started local MongoDB."
}
else {
    Write-Host "MongoDB is already listening on port 27017."
}

if (-not (Test-LocalPort 8000)) {
    $escapedPython = Escape-PowerShellString $python
    $backendCommand = "Set-Location -LiteralPath '$((Escape-PowerShellString $projectRoot))'; & '$escapedPython' -m uvicorn app.main:app --app-dir backend --reload --host 127.0.0.1 --port 8000"
    Start-Process powershell.exe -ArgumentList "-NoExit -Command `"$backendCommand`"" -WorkingDirectory $projectRoot
    Write-Host "Started FastAPI at http://localhost:8000."
}
else {
    Write-Host "A service is already listening on port 8000; leaving it running."
}

if (-not (Test-LocalPort 5173)) {
    $frontendCommand = "Set-Location -LiteralPath '$((Escape-PowerShellString $frontend))'; npm run dev -- --host 127.0.0.1"
    Start-Process powershell.exe -ArgumentList "-NoExit -Command `"$frontendCommand`"" -WorkingDirectory $frontend
    Write-Host "Started frontend at http://localhost:5173."
}
else {
    Write-Host "A service is already listening on port 5173; leaving it running."
}

Start-Process "http://localhost:5173"
Write-Host "Employee Management System startup requested. Close the service windows to stop the app."