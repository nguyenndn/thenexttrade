[CmdletBinding()]
param(
    [string]$SourceTerminalPath = "C:\Program Files\MetaTrader 5\terminal64.exe",
    [string]$DestinationRoot = "C:\GSN\mt5\terminal"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $SourceTerminalPath -PathType Leaf)) {
    throw "Source terminal64.exe was not found: $SourceTerminalPath"
}

$sourceRoot = (Resolve-Path -LiteralPath (Split-Path -Parent $SourceTerminalPath)).Path.TrimEnd('\')
$destinationRoot = [IO.Path]::GetFullPath($DestinationRoot).TrimEnd('\')
if ($sourceRoot -eq $destinationRoot) {
    throw "Source and destination must be different directories."
}

$destinationTerminal = Join-Path $destinationRoot "terminal64.exe"
$running = Get-Process terminal64 -ErrorAction SilentlyContinue | Where-Object {
    $_.Path -and ((Resolve-Path -LiteralPath $_.Path -ErrorAction SilentlyContinue).Path -ieq $SourceTerminalPath)
}
if ($running) {
    throw "Close the source MT5 terminal before copying it."
}

New-Item -ItemType Directory -Path $destinationRoot -Force | Out-Null
& robocopy.exe $sourceRoot $destinationRoot /E /COPY:DAT /DCOPY:DAT /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) {
    throw "robocopy failed with exit code $LASTEXITCODE"
}

if (-not (Test-Path -LiteralPath $destinationTerminal -PathType Leaf)) {
    throw "Controlled terminal copy was not created: $destinationTerminal"
}

Write-Host "Controlled portable terminal ready: $destinationTerminal" -ForegroundColor Green
Write-Host "Update config.json paths.terminal to this path, then close any existing MT5 instance before starting the worker."
