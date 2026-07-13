[CmdletBinding(SupportsShouldProcess, ConfirmImpact = "High")]
param(
    [string]$ApiBaseUrl = "http://127.0.0.1:8765",
    [Parameter(Mandatory = $true)][string]$WorkerId,
    [string]$SecretsFile = ""
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($SecretsFile)) {
    $SecretsFile = Join-Path $PSScriptRoot "..\api\data\local-secrets.json"
}
if (-not $PSCmdlet.ShouldProcess($WorkerId, "Revoke local Worker identity")) { return }
$secrets = Get-Content -LiteralPath $SecretsFile -Raw | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($secrets.admin_token)" }
$result = Invoke-RestMethod -Method Post -Uri "$($ApiBaseUrl.TrimEnd('/'))/admin/v1/workers/$WorkerId/revoke" -Headers $headers
$result | Format-List
