$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'local-server.ps1')
$launcherLock = $null

try {
    $launcherLock = Lock-DevServerLauncher
    $serverProcess = Get-ManagedDevServer
    if ($serverProcess) {
        $targetProcess = Get-Process -Id $serverProcess.ProcessId
        Stop-Process -InputObject $targetProcess
        if (-not $targetProcess.WaitForExit(5000)) { throw 'The server did not stop within five seconds. Try Stop again.' }
        Write-Host "Stopped SynthViewTopy (PID $($serverProcess.ProcessId))."
    } else {
        Write-Host 'No launcher-managed SynthViewTopy server is running.'
    }
    if (Test-Path -LiteralPath $serverStatePath) { Remove-Item -LiteralPath $serverStatePath -Force }
} catch {
    Write-Host "Could not stop SynthViewTopy: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
} finally {
    if ($launcherLock) { $launcherLock.Dispose() }
}
