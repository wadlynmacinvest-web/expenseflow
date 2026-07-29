$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$env:JWT_SECRET = if ($env:JWT_SECRET) { $env:JWT_SECRET } else { "expenseflow-local-secret" }
$env:NODE_ENV = if ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }

Write-Host "Installing workspace dependencies (if needed)..."
pnpm install

$apiOutLog = Join-Path $repoRoot "artifacts/api-server/.local-api.out.log"
$apiErrLog = Join-Path $repoRoot "artifacts/api-server/.local-api.err.log"
$frontendOutLog = Join-Path $repoRoot "artifacts/expenseflow-frontend/.local-frontend.out.log"
$frontendErrLog = Join-Path $repoRoot "artifacts/expenseflow-frontend/.local-frontend.err.log"

Write-Host "Starting API server..."
$apiProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "set PORT=8080 && pnpm.cmd --filter @workspace/api-server run dev" -WorkingDirectory $repoRoot -PassThru -RedirectStandardOutput $apiOutLog -RedirectStandardError $apiErrLog

Write-Host "Starting frontend dev server..."
$frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "set PORT=25051 && set BASE_PATH=/ && pnpm.cmd --filter @workspace/expenseflow-frontend run dev" -WorkingDirectory $repoRoot -PassThru -RedirectStandardOutput $frontendOutLog -RedirectStandardError $frontendErrLog

Start-Sleep -Seconds 8
Write-Host "API server PID: $($apiProcess.Id)"
Write-Host "Frontend PID: $($frontendProcess.Id)"
Write-Host "API logs: $apiOutLog | $apiErrLog"
Write-Host "Frontend logs: $frontendOutLog | $frontendErrLog"
Write-Host "Open http://localhost:25051"
Write-Host "API health: http://localhost:8080/api/healthz"
