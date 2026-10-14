# Shared launcher paths and process ownership checks.
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot '.runtime'
$serverStatePath = Join-Path $runtimeDirectory 'dev-server.json'
$viteEntryPath = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'
$serverUrl = 'http://127.0.0.1:5178'

function Get-ManagedDevServer {
    if (-not (Test-Path -LiteralPath $serverStatePath)) { return $null }
    try {
        $state = Get-Content -LiteralPath $serverStatePath -Raw | ConvertFrom-Json
        if ($state.projectRoot -ne $projectRoot) { return $null }
        $recordedProcessId = [int]$state.processId
        if ($recordedProcessId -le 0) { return $null }
    } catch {
        return $null
    }
    # Inspection failures (for example, permission errors) must preserve the record.
    $serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $recordedProcessId" -ErrorAction Stop
    if (-not $serverProcess -or $serverProcess.Name -ne 'node.exe') { return $null }
    if ($serverProcess.CreationDate.ToUniversalTime().Ticks.ToString() -ne $state.creationTicks) { return $null }
    if (-not $serverProcess.CommandLine -or $serverProcess.CommandLine.IndexOf($viteEntryPath, [StringComparison]::OrdinalIgnoreCase) -lt 0) { return $null }
    return $serverProcess
}

function Lock-DevServerLauncher {
    New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null
    try {
        return [IO.File]::Open((Join-Path $runtimeDirectory 'launcher.lock'), [IO.FileMode]::OpenOrCreate, [IO.FileAccess]::ReadWrite, [IO.FileShare]::None)
    } catch {
        throw 'Another SynthViewTopy start/stop command is running. Please try again when it finishes.'
    }
}
