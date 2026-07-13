[CmdletBinding(SupportsShouldProcess, ConfirmImpact = "High")]
param(
    [string]$RootPath = "C:\GSN",
    [string]$ScheduledTaskName = "GSN MT5 Import Worker",
    [switch]$RemoveData
)

$ErrorActionPreference = "Stop"
& schtasks.exe /Delete /TN $ScheduledTaskName /F 2>$null | Out-Null

if ($RemoveData) {
    $resolved = [IO.Path]::GetFullPath($RootPath).TrimEnd('\')
    if ($resolved -notmatch '^[A-Za-z]:\\GSN$') {
        throw "Refusing to delete unexpected root: $resolved"
    }
    if ((Test-Path -LiteralPath $resolved) -and $PSCmdlet.ShouldProcess($resolved, "Remove all GSN Worker data")) {
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}

Write-Host "Scheduled Task removed. Use -RemoveData with confirmation to delete C:\GSN." -ForegroundColor Yellow
