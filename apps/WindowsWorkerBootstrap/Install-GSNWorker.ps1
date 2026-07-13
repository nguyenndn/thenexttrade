[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath,
    [switch]$SkipMt5Install,
    [switch]$SkipPythonInstall
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"
$script:BootstrapDir = Split-Path -Parent $MyInvocation.MyCommand.Path

function Write-Step([string]$Message) {
    Write-Host ("[{0}] {1}" -f (Get-Date -Format "HH:mm:ss"), $Message) -ForegroundColor Cyan
}

function Assert-Administrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw "Run this installer as Administrator."
    }
}

function Ensure-Directory([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Get-PropertyValue($Object, [string]$Name, $Default = $null) {
    $property = $Object.PSObject.Properties[$Name]
    if ($null -eq $property -or $null -eq $property.Value) { return $Default }
    return $property.Value
}

function Assert-SafeRoot([string]$Path) {
    $full = [IO.Path]::GetFullPath($Path).TrimEnd('\')
    if ($full -notmatch '^[A-Za-z]:\\[^\\]+$') {
        throw "rootPath must be a dedicated top-level directory such as C:\GSN. Received: $Path"
    }
    return $full
}

function Assert-DownloadSignature([string]$Path, [bool]$AllowUnsigned, [string[]]$ExpectedPublishers) {
    $signature = Get-AuthenticodeSignature -FilePath $Path
    if ($signature.Status -eq [System.Management.Automation.SignatureStatus]::Valid) {
        $subject = $signature.SignerCertificate.Subject
        foreach ($publisher in $ExpectedPublishers) {
            if ($subject -like "*$publisher*") { return }
        }
        throw "Installer signer is valid but unexpected: $subject"
    }
    if (-not $AllowUnsigned) {
        throw "Installer has no valid Authenticode signature: $Path ($($signature.Status))"
    }
    Write-Warning "Unsigned installer allowed by config: $Path"
}

function Assert-Checksum([string]$Path, [string]$ExpectedSha256) {
    if ([string]::IsNullOrWhiteSpace($ExpectedSha256)) { return }
    $actual = (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($actual -ne $ExpectedSha256.Trim().ToLowerInvariant()) {
        throw "SHA-256 mismatch for $Path. Expected $ExpectedSha256, got $actual"
    }
}

function Get-Download([string]$Url, [string]$Destination, [string]$Sha256) {
    if ([string]::IsNullOrWhiteSpace($Url)) { throw "Download URL is empty." }
    try { $uri = [Uri]$Url } catch { throw "Invalid download URL: $Url" }
    $isHttps = $uri.Scheme -eq "https"
    $isLoopbackHttp = $uri.Scheme -eq "http" -and $uri.IsLoopback
    if (-not $isHttps -and -not ($script:AllowInsecureLocalhost -and $isLoopbackHttp)) {
        throw "Downloads must use HTTPS. Only explicit loopback development may use HTTP: $Url"
    }
    if (Test-Path -LiteralPath $Destination) {
        try {
            Assert-Checksum $Destination $Sha256
            Write-Step "Using cached download: $Destination"
            return
        } catch {
            Remove-Item -LiteralPath $Destination -Force
        }
    }
    Write-Step "Downloading $Url"
    Invoke-WebRequest -Uri $Url -OutFile $Destination -UseBasicParsing
    Assert-Checksum $Destination $Sha256
}

function Find-Mt5Terminal($Mt5Config, [string]$TargetTerminal) {
    if (Test-Path -LiteralPath $TargetTerminal) { return $TargetTerminal }
    foreach ($candidate in @($Mt5Config.terminalCandidates)) {
        if (-not [string]::IsNullOrWhiteSpace($candidate) -and (Test-Path -LiteralPath $candidate)) {
            return $candidate
        }
    }
    foreach ($base in @($env:ProgramFiles, ${env:ProgramFiles(x86)})) {
        if ([string]::IsNullOrWhiteSpace($base) -or -not (Test-Path -LiteralPath $base)) { continue }
        $found = Get-ChildItem -LiteralPath $base -Filter terminal64.exe -File -Recurse -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if ($null -ne $found) { return $found.FullName }
    }
    return $null
}

function Copy-DirectoryContents([string]$Source, [string]$Destination) {
    Ensure-Directory $Destination
    $resolvedSource = (Resolve-Path -LiteralPath $Source).Path.TrimEnd('\')
    $resolvedDestination = [IO.Path]::GetFullPath($Destination).TrimEnd('\')
    if ($resolvedSource -eq $resolvedDestination) { return }
    & robocopy.exe $resolvedSource $resolvedDestination /E /COPY:DAT /DCOPY:DAT /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy failed with exit code $LASTEXITCODE" }
}

function Write-WorkerConfig([string]$Path, [string]$BackendBaseUrl, [string]$WorkerId, [hashtable]$Paths) {
    $payload = [ordered]@{
        schemaVersion = "1.0"
        backendBaseUrl = $BackendBaseUrl.TrimEnd('/')
        workerId = $WorkerId
        paths = [ordered]@{
            root = $Paths.Root
            terminal = $Paths.Terminal
            terminalData = $Paths.TerminalData
            worker = $Paths.Worker
            logs = $Paths.Logs
            temp = $Paths.Temp
            venvPython = $Paths.VenvPython
        }
    }
    $payload | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath $Path -Encoding UTF8
}

Assert-Administrator
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$resolvedConfig = (Resolve-Path -LiteralPath $ConfigPath).Path
$config = Get-Content -LiteralPath $resolvedConfig -Raw | ConvertFrom-Json
$root = Assert-SafeRoot ([string]$config.rootPath)
$backendBaseUrl = ([string]$config.backendBaseUrl).Trim()
$allowInsecureLocalhost = [bool](Get-PropertyValue $config "allowInsecureLocalhost" $false)
$script:AllowInsecureLocalhost = $allowInsecureLocalhost
$isHttps = $backendBaseUrl -match '^https://'
$isLocalHttp = $backendBaseUrl -match '^http://(127\.0\.0\.1|localhost)(:\d+)?/?$'
if (-not $isHttps -and -not ($allowInsecureLocalhost -and $isLocalHttp)) {
    throw "backendBaseUrl must use HTTPS. Only loopback HTTP may be enabled with allowInsecureLocalhost=true."
}
if ($backendBaseUrl -like '*YOUR-WEBSITE*') { throw "Set backendBaseUrl before running bootstrap." }

$paths = @{
    Root = $root
    Config = Join-Path $root "config"
    Runtime = Join-Path $root "runtime"
    Python = Join-Path $root "runtime\python"
    Venv = Join-Path $root "runtime\venv"
    VenvPython = Join-Path $root "runtime\venv\Scripts\python.exe"
    Downloads = Join-Path $root "runtime\downloads"
    Mt5 = Join-Path $root "mt5"
    TerminalRoot = Join-Path $root "mt5\terminal"
    Terminal = Join-Path $root "mt5\terminal\terminal64.exe"
    TerminalData = Join-Path $root "terminals\slot-01"
    Worker = Join-Path $root "worker"
    Logs = Join-Path $root "logs"
    Temp = Join-Path $root "temp"
    Backups = Join-Path $root "backups"
}

foreach ($path in $paths.Values) {
    if ([IO.Path]::HasExtension([string]$path)) { continue }
    Ensure-Directory ([string]$path)
}

$logPath = Join-Path $paths.Logs ("bootstrap-{0}.log" -f (Get-Date -Format "yyyyMMdd-HHmmss"))
Start-Transcript -Path $logPath -Append | Out-Null
try {
    Write-Step "GSN root: $root"
    Copy-Item -LiteralPath $resolvedConfig -Destination (Join-Path $paths.Config "bootstrap.config.json") -Force

    $pythonExe = Join-Path $paths.Python "python.exe"
    if (-not (Test-Path -LiteralPath $pythonExe)) {
        if ($SkipPythonInstall) { throw "Python is missing and -SkipPythonInstall was supplied." }
        $pythonInstaller = Join-Path $paths.Downloads "python-installer.exe"
        Get-Download ([string]$config.python.installerUrl) $pythonInstaller ([string]$config.python.sha256)
        Assert-DownloadSignature $pythonInstaller ([bool]$config.python.allowUnsignedInstaller) @("Python Software Foundation")
        Write-Step "Installing Python into $($paths.Python)"
        $arguments = @(
            "/quiet", "InstallAllUsers=1", "PrependPath=0", "Include_test=0",
            "Include_launcher=0", "Include_pip=1", "Include_tcltk=0",
            "Shortcuts=0", "AssociateFiles=0", "TargetDir=$($paths.Python)"
        )
        $process = Start-Process -FilePath $pythonInstaller -ArgumentList $arguments -Wait -PassThru
        if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $pythonExe)) {
            throw "Python installer failed with exit code $($process.ExitCode)."
        }
    }
    Write-Step "Python ready: $(& $pythonExe --version)"

    if (-not (Test-Path -LiteralPath $paths.VenvPython)) {
        Write-Step "Creating Python virtual environment"
        & $pythonExe -m venv $paths.Venv
        if ($LASTEXITCODE -ne 0) { throw "Failed to create virtual environment." }
    }
    & $paths.VenvPython -m pip install --disable-pip-version-check --upgrade pip
    if ($LASTEXITCODE -ne 0) { throw "pip upgrade failed." }

    $terminalSource = Find-Mt5Terminal $config.mt5 $paths.Terminal
    $configuredSource = [string](Get-PropertyValue $config.mt5 "sourceTerminalDirectory" "")
    if (-not [string]::IsNullOrWhiteSpace($configuredSource)) {
        if (-not (Test-Path -LiteralPath (Join-Path $configuredSource "terminal64.exe"))) {
            throw "sourceTerminalDirectory does not contain terminal64.exe: $configuredSource"
        }
        $terminalSource = Join-Path $configuredSource "terminal64.exe"
    }

    if ($null -eq $terminalSource) {
        if ($SkipMt5Install) { throw "MT5 is missing and -SkipMt5Install was supplied." }
        $mt5Installer = Join-Path $paths.Downloads "mt5setup.exe"
        Get-Download ([string]$config.mt5.installerUrl) $mt5Installer ([string]$config.mt5.sha256)
        Assert-DownloadSignature $mt5Installer ([bool]$config.mt5.allowUnsignedInstaller) @("MetaQuotes")
        Write-Step "Installing MetaTrader 5"
        $mt5Process = Start-Process -FilePath $mt5Installer -ArgumentList ([string]$config.mt5.installArguments) -PassThru
        $timeout = [int](Get-PropertyValue $config.mt5 "installTimeoutSeconds" 300)
        try { Wait-Process -Id $mt5Process.Id -Timeout $timeout -ErrorAction SilentlyContinue } catch { }
        $deadline = (Get-Date).AddSeconds($timeout)
        do {
            Start-Sleep -Seconds 3
            $terminalSource = Find-Mt5Terminal $config.mt5 $paths.Terminal
        } while ($null -eq $terminalSource -and (Get-Date) -lt $deadline)
        if ($null -eq $terminalSource) {
            throw "MT5 setup finished but terminal64.exe was not found. Use the broker installer URL or set sourceTerminalDirectory."
        }
    }

    if ($terminalSource -ne $paths.Terminal) {
        Write-Step "Copying MT5 into controlled portable directory"
        Copy-DirectoryContents (Split-Path -Parent $terminalSource) $paths.TerminalRoot
    }
    if (-not (Test-Path -LiteralPath $paths.Terminal)) { throw "Controlled MT5 terminal is missing." }

    $workerPackageInstalled = $false
    $localWorkerSource = [string](Get-PropertyValue $config.workerPackage "localSourceDirectory" "")
    if (-not [string]::IsNullOrWhiteSpace($localWorkerSource) -and -not [IO.Path]::IsPathRooted($localWorkerSource)) {
        $localWorkerSource = Join-Path (Split-Path -Parent $resolvedConfig) $localWorkerSource
    }
    $workerPackageUrl = [string](Get-PropertyValue $config.workerPackage "packageUrl" "")
    $workerPackageRequired = [bool]$config.workerPackage.requirePackage
    if ($workerPackageRequired -and -not [string]::IsNullOrWhiteSpace($workerPackageUrl) -and
        [string]::IsNullOrWhiteSpace([string]$config.workerPackage.sha256)) {
        throw "workerPackage.sha256 is required for a required remote worker package."
    }
    if (-not [string]::IsNullOrWhiteSpace($localWorkerSource)) {
        Write-Step "Copying worker package from local source"
        Copy-DirectoryContents $localWorkerSource $paths.Worker
        $workerPackageInstalled = $true
    } elseif (-not [string]::IsNullOrWhiteSpace($workerPackageUrl)) {
        $workerZip = Join-Path $paths.Downloads "gsn-worker.zip"
        Get-Download $workerPackageUrl $workerZip ([string]$config.workerPackage.sha256)
        Write-Step "Extracting worker package"
        Expand-Archive -LiteralPath $workerZip -DestinationPath $paths.Worker -Force
        $workerPackageInstalled = $true
    }

    if (-not $workerPackageInstalled -and $workerPackageRequired) {
        throw "Worker package is required but packageUrl/localSourceDirectory is empty."
    }

    $bootstrapRequirements = Join-Path $script:BootstrapDir "bootstrap-requirements.txt"
    Write-Step "Installing baseline Python dependencies"
    & $paths.VenvPython -m pip install --disable-pip-version-check -r $bootstrapRequirements
    if ($LASTEXITCODE -ne 0) { throw "Baseline Python dependency installation failed." }

    $workerRequirements = Join-Path $paths.Worker ([string]$config.workerPackage.requirementsFile)
    if ($workerPackageInstalled -and (Test-Path -LiteralPath $workerRequirements)) {
        Write-Step "Installing worker package dependencies"
        & $paths.VenvPython -m pip install --disable-pip-version-check -r $workerRequirements
        if ($LASTEXITCODE -ne 0) { throw "Worker dependency installation failed." }
    }

    $workerId = [string]$config.workerId
    if ([string]::IsNullOrWhiteSpace($workerId) -or $workerId -eq "AUTO") {
        $existingWorkerConfig = Join-Path $paths.Config "worker.json"
        if (Test-Path -LiteralPath $existingWorkerConfig) {
            $existingWorkerId = [string](Get-Content -LiteralPath $existingWorkerConfig -Raw | ConvertFrom-Json).workerId
        } else {
            $existingWorkerId = ""
        }
        if (-not [string]::IsNullOrWhiteSpace($existingWorkerId)) {
            $workerId = $existingWorkerId
        } else {
            $workerId = "gsn-{0}-{1}" -f $env:COMPUTERNAME.ToLowerInvariant(), ([Guid]::NewGuid().ToString("N").Substring(0, 8))
        }
    }
    $workerConfigPath = Join-Path $paths.Config "worker.json"
    Write-WorkerConfig $workerConfigPath $backendBaseUrl $workerId $paths

    $entrypoint = Join-Path $paths.Worker ([string]$config.workerPackage.entrypoint)
    if ($workerPackageRequired -and -not (Test-Path -LiteralPath $entrypoint)) {
        throw "Worker package was supplied but required entrypoint is missing: $entrypoint"
    }
    $launcher = Join-Path $paths.Runtime "Start-GSNWorker.cmd"
    $launcherBody = @(
        "@echo off",
        "setlocal",
        "set PYTHONUNBUFFERED=1",
        ('"{0}" "{1}" --config "{2}" >> "{3}\worker.log" 2>&1' -f $paths.VenvPython, $entrypoint, $workerConfigPath, $paths.Logs)
    )
    $launcherBody | Set-Content -LiteralPath $launcher -Encoding ASCII

    $taskCreated = $false
    if ([bool]$config.runtime.createScheduledTask -and (Test-Path -LiteralPath $entrypoint)) {
        if ([string]$config.runtime.startMode -ne "ONLOGON") {
            throw "Only ONLOGON startMode is supported because MT5 needs an interactive Windows session."
        }
        $taskName = [string]$config.runtime.scheduledTaskName
        Write-Step "Registering Scheduled Task: $taskName"
        & schtasks.exe /Create /TN $taskName /SC ONLOGON /RL HIGHEST /TR ('"{0}"' -f $launcher) /F | Out-Null
        if ($LASTEXITCODE -ne 0) { throw "Failed to register Scheduled Task." }
        $taskCreated = $true
    }

    $status = if ((Test-Path -LiteralPath $entrypoint) -and $taskCreated) { "READY_FOR_ENROLLMENT" } else { "INFRASTRUCTURE_READY" }
    $report = [ordered]@{
        status = $status
        installedAtUtc = (Get-Date).ToUniversalTime().ToString("o")
        workerId = $workerId
        backendBaseUrl = $backendBaseUrl
        python = $pythonExe
        venvPython = $paths.VenvPython
        terminal = $paths.Terminal
        terminalMode = "PORTABLE"
        workerEntrypoint = $entrypoint
        workerPackageInstalled = $workerPackageInstalled
        scheduledTaskCreated = $taskCreated
        scheduledTaskName = [string]$config.runtime.scheduledTaskName
        enrollmentTokenPersisted = $false
    }
    $reportPath = Join-Path $paths.Config "installation-report.json"
    $report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $reportPath -Encoding UTF8
    Write-Step "Bootstrap status: $status"
    if ($status -ne "READY_FOR_ENROLLMENT") {
        Write-Warning "Python and MT5 are ready, but the Worker package/entrypoint is not installed. Website jobs cannot be processed yet."
    } else {
        Write-Warning "Worker is installed locally. It is ONLINE only after enrollment and a successful website heartbeat."
    }
    Write-Host "Report: $reportPath" -ForegroundColor Green
} finally {
    Stop-Transcript | Out-Null
}
