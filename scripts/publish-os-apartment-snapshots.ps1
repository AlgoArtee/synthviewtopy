param(
  [string]$Staging = 'output/playwright/os-apartment-snapshots-100'
)
$ErrorActionPreference = 'Stop'
$workspacePath = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$stagePath = [IO.Path]::GetFullPath((Join-Path $workspacePath $Staging))
$destinationPath = [IO.Path]::GetFullPath((Join-Path $workspacePath "Snapshots/North City/O's Apartment"))
$workspacePrefix = $workspacePath.TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
foreach ($checkedPath in @($stagePath, $destinationPath)) {
  if (-not $checkedPath.StartsWith($workspacePrefix, [StringComparison]::OrdinalIgnoreCase)) { throw "Path outside workspace: $checkedPath" }
}
$manifestPath = Join-Path $stagePath 'manifest.json'
$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
if ($manifest.pictures.Count -ne 100) { throw 'Expected 100 completed new snapshots' }
if ($manifest.errors.Count -ne 0) { throw 'Capture errors must be resolved before publishing' }
$newFiles = @(Get-ChildItem -LiteralPath $stagePath -File -Recurse -Filter '*.png')
if ($newFiles.Count -ne 100) { throw 'Staging folder must contain exactly 100 PNG files' }
foreach ($format in @('ultrawide','phone')) {
  if (@($manifest.pictures | Where-Object format -eq $format).Count -ne 50) { throw "Expected 50 $format images" }
}
$stagePrefix = $stagePath.TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
foreach ($picture in $manifest.pictures) {
  $picturePath = [IO.Path]::GetFullPath((Join-Path $stagePath $picture.filename))
  if (-not $picturePath.StartsWith($stagePrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid image path' }
  if ((Get-FileHash -LiteralPath $picturePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $picture.sha256) { throw "Hash mismatch: $picturePath" }
}
foreach ($sourceProperty in $manifest.sourceHashes.PSObject.Properties) {
  $sourcePath = [IO.Path]::GetFullPath((Join-Path $workspacePath $sourceProperty.Name))
  if (-not $sourcePath.StartsWith($workspacePrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Invalid source path' }
  if ((Get-FileHash -LiteralPath $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant() -ne $sourceProperty.Value) { throw "Scene source changed: $sourcePath" }
}
if (-not (Test-Path -LiteralPath $destinationPath -PathType Container)) { throw 'Existing room snapshot folder not found' }
$oldFiles = @(Get-ChildItem -LiteralPath $destinationPath -File -Filter '*.png')
if ($oldFiles.Count -ne 50) { throw 'Expected exactly the 50 old room pictures at the destination root' }
$oldManifest = Get-Content -LiteralPath (Join-Path $destinationPath 'manifest.json') -Raw | ConvertFrom-Json
if ($oldManifest.pictures.Count -ne 50) { throw 'Old manifest must list 50 snapshots' }
$destinationPrefix = $destinationPath.TrimEnd('\','/') + [IO.Path]::DirectorySeparatorChar
foreach ($oldFile in $oldFiles) {
  $resolvedOldPath = [IO.Path]::GetFullPath($oldFile.FullName)
  if (-not $resolvedOldPath.StartsWith($destinationPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Old picture outside room folder' }
  if ([IO.Path]::GetDirectoryName($resolvedOldPath) -ne $destinationPath) { throw 'Only root-level old PNG files may be deleted' }
  if ($oldFile.Name -notin $oldManifest.pictures.filename) { throw 'Unexpected existing picture; stopping' }
}
foreach ($folderName in @('Ultrawide','Phone')) {
  $targetFolder = [IO.Path]::GetFullPath((Join-Path $destinationPath $folderName))
  $sourceFolder = [IO.Path]::GetFullPath((Join-Path $stagePath $folderName))
  if (-not $targetFolder.StartsWith($destinationPrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe move destination' }
  if (-not $sourceFolder.StartsWith($stagePrefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Unsafe move source' }
  if (Test-Path -LiteralPath $targetFolder) { throw "Destination exists: $targetFolder" }
}
# Place the completed new collection before removing the explicitly requested old files.
foreach ($folderName in @('Ultrawide','Phone')) {
  Move-Item -LiteralPath (Join-Path $stagePath $folderName) -Destination (Join-Path $destinationPath $folderName)
}
foreach ($oldFile in $oldFiles) { Remove-Item -LiteralPath $oldFile.FullName -Force }
foreach ($metadataFile in @('index.html','manifest.json')) {
  Move-Item -LiteralPath (Join-Path $stagePath $metadataFile) -Destination (Join-Path $destinationPath $metadataFile) -Force
}
$finalPictures = @(Get-ChildItem -LiteralPath $destinationPath -Recurse -File -Filter '*.png')
if ($finalPictures.Count -ne 100) { throw 'Final image count must be 100' }
foreach ($oldFile in $oldFiles) { if (Test-Path -LiteralPath $oldFile.FullName) { throw 'Old snapshot was not removed' } }
[pscustomobject]@{ DeletedOldPictures = $oldFiles.Count; NewPictures = $finalPictures.Count; Destination = $destinationPath } | ConvertTo-Json
