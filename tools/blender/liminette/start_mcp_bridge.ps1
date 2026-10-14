param([int]$Port = 9877)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
$blenderExe = 'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe'
$addonRoot = Join-Path $projectRoot '.runtime/blender-mcp-official/addon'
if (!(Test-Path -LiteralPath $addonRoot)) { throw 'Install the official Blender Lab source in .runtime/blender-mcp-official first.' }
$loaderFile = Join-Path $projectRoot '.runtime/load_official_blender_mcp.py'
$addonPythonPath = $addonRoot.Replace('\', '/')
@"
import sys
sys.path.insert(0, '$addonPythonPath')
import blender_mcp_addon
blender_mcp_addon.register()
"@ | Set-Content -LiteralPath $loaderFile -Encoding UTF8
# A separate background process preserves open UI scenes and preferences.
& $blenderExe --background --factory-startup --online-mode --python $loaderFile --command blender_mcp --host 127.0.0.1 --port $Port
