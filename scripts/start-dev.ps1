param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
. (Join-Path $PSScriptRoot 'local-server.ps1')
$launcherLock = $null
$startedServer = $false

try {
    $launcherLock = Lock-DevServerLauncher
    $serverProcess = Get-ManagedDevServer
    # Older launchers passed a loopback-only host that overrides vite.config.ts.
    if ($serverProcess -and $serverProcess.CommandLine -match '(?:^|\s)--host(?:\s+|=)"?(?:127\.0\.0\.1|localhost)"?(?=\s|$)') {
        Write-Host 'Restarting SynthViewTopy to enable local-network access...'
        $previousServer = Get-Process -Id $serverProcess.ProcessId
        Stop-Process -InputObject $previousServer
        if (-not $previousServer.WaitForExit(5000)) { throw 'The previous server did not stop within five seconds. Try Start again.' }
        $serverProcess = $null
    }
    if ($serverProcess) {
        Write-Host "SynthViewTopy is already running at $serverUrl (PID $($serverProcess.ProcessId))."
    } else {
        # A stale record must never be used to stop a reused PID.
        if (Test-Path -LiteralPath $serverStatePath) { Remove-Item -LiteralPath $serverStatePath -Force }
        $portProbe = New-Object Net.Sockets.TcpClient
        try {
            try { $portProbe.Connect('127.0.0.1', 5178) } catch { }
            if ($portProbe.Connected) {
                throw 'Port 5178 is already in use. Close the server using that port (Ctrl+C if started with npm run dev), then run Start SynthViewTopy.cmd again.'
            }
        } finally { $portProbe.Dispose() }

        $nodeCommand = Get-Command node.exe -ErrorAction SilentlyContinue
        if (-not $nodeCommand) { throw 'Node.js is required. Install Node.js 22.12 or newer, then run this launcher again.' }
        $nodeVersion = [version]((& $nodeCommand.Source --version).Trim().TrimStart('v'))
        if (-not (($nodeVersion.Major -eq 20 -and $nodeVersion.Minor -ge 19) -or ($nodeVersion.Major -eq 22 -and $nodeVersion.Minor -ge 12) -or $nodeVersion.Major -gt 22)) {
            throw "Node.js $nodeVersion is too old for this project. Install Node.js 22.12 or newer."
        }

        if (-not (Test-Path -LiteralPath $viteEntryPath)) {
            Write-Host 'Installing project dependencies (first launch)...'
            Push-Location -LiteralPath $projectRoot
            try {
                & npm.cmd ci --no-audit --no-fund
                if ($LASTEXITCODE -ne 0) { throw 'Dependency installation failed. Check the npm output above, then try again.' }
            } finally { Pop-Location }
        }

        $stdoutPath = Join-Path $runtimeDirectory 'dev-server.stdout.log'
        $stderrPath = Join-Path $runtimeDirectory 'dev-server.stderr.log'
        $child = Start-Process -FilePath $nodeCommand.Source -ArgumentList ('"' + $viteEntryPath + '"') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath -PassThru
        $serverProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($child.Id)"
        if (-not $serverProcess) { throw "The local server exited immediately. See $stderrPath" }
        @{
            projectRoot = $projectRoot
            processId = $child.Id
            creationTicks = $serverProcess.CreationDate.ToUniversalTime().Ticks.ToString()
            url = $serverUrl
        } | ConvertTo-Json | Set-Content -LiteralPath $serverStatePath -Encoding UTF8
        $startedServer = $true

        Write-Host 'Starting SynthViewTopy...'
        $deadline = [DateTime]::UtcNow.AddSeconds(30)
        $ready = $false
        while ([DateTime]::UtcNow -lt $deadline) {
            if (-not (Get-ManagedDevServer)) { throw "The local server stopped during startup. See $stderrPath" }
            try {
                $response = Invoke-WebRequest -Uri "$serverUrl/" -UseBasicParsing -TimeoutSec 2
                $ready = $response.StatusCode -eq 200 -and $response.Content.Contains('/@vite/client')
            } catch { }
            if ($ready) { break }
            Start-Sleep -Milliseconds 200
        }
        if (-not $ready) { throw "The local server did not become ready within 30 seconds. See $stderrPath" }
        Write-Host "SynthViewTopy is running at $serverUrl (PID $($child.Id))."
    }
    try {
        $networkUrls = @(Get-DevServerNetworkUrl)
        if ($networkUrls.Count -gt 0) {
            Write-Host 'On another device connected to the same network, open:'
            foreach ($networkUrl in $networkUrls) { Write-Host "  $networkUrl" }
        } else {
            Write-Host 'No active LAN IPv4 address found. Connect to Wi-Fi or Ethernet, then run Start again to show network links.'
        }
    } catch {
        Write-Warning 'Could not list network addresses. Run ipconfig and open http://<your IPv4 address>:5178 on the other device.'
    }
    Write-Host 'The server runs in the background. Use Stop SynthViewTopy.cmd when finished.'
} catch {
    if ($startedServer) {
        $failedServer = Get-ManagedDevServer
        if ($failedServer) { Stop-Process -Id $failedServer.ProcessId -ErrorAction SilentlyContinue }
        Remove-Item -LiteralPath $serverStatePath -Force -ErrorAction SilentlyContinue
    }
    Write-Host "Could not start SynthViewTopy: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    if ($launcherLock) { $launcherLock.Dispose() }
}

if (-not $NoBrowser) {
    try { Start-Process $serverUrl } catch { Write-Warning "The server is ready. Open $serverUrl in your browser." }
}
