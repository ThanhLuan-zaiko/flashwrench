param(
    [switch]$Yes
)

$ErrorActionPreference = "Stop"
$scriptDirectory = $PSScriptRoot
$envFile = Join-Path $scriptDirectory ".env.local"

if (Test-Path -LiteralPath $envFile -PathType Leaf) {
    foreach ($line in [System.IO.File]::ReadAllLines($envFile)) {
        $entry = $line.Trim()
        if (-not $entry -or $entry.StartsWith("#")) {
            continue
        }
        if ($entry -match '^export\s+') {
            $entry = $entry -replace '^export\s+', ''
        }
        if ($entry -notmatch '^([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') {
            continue
        }

        $key = $Matches[1]
        $value = $Matches[2]
        if ($value -match '^\s*["'']') {
            $value = $value.Trim()
            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
                ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }
        } else {
            $value = $value.Trim()
        }
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$keyspace = if ($env:SCYLLA_KEYSPACE) { $env:SCYLLA_KEYSPACE } else { "flashwrench" }
$container = if ($env:SCYLLA_CONTAINER) { $env:SCYLLA_CONTAINER } else { "scylladb" }
$schema = Join-Path $scriptDirectory "schema.cql"

if ($keyspace -in @("system", "system_schema", "system_distributed", "system_traces", "system_auth")) {
    Write-Error "Refusing to reset reserved keyspace: '$keyspace'."
    exit 1
}
if ($keyspace -cnotmatch '^[a-z][a-z0-9_]{2,48}$') {
    Write-Error "Invalid keyspace name: '$keyspace'."
    exit 1
}
if (-not (Test-Path -LiteralPath $schema -PathType Leaf)) {
    Write-Error "Schema file not found: $schema"
    exit 1
}

if (-not $Yes) {
    $answer = Read-Host "Drop and recreate keyspace `"$keyspace`" in container `"$container`" through WSL Docker? [y/N]"
    if ($answer -cne "y") {
        Write-Output "Aborted."
        exit 0
    }
}

$wslPrefix = @()
if ($env:SCYLLA_WSL_DISTRO) {
    $wslPrefix += @("--distribution", $env:SCYLLA_WSL_DISTRO)
}

$schemaToCopy = $schema
$temporarySchema = $null
$failureMessage = $null

try {
    if ($keyspace -cne "flashwrench") {
        $temporarySchema = Join-Path ([System.IO.Path]::GetTempPath()) ("flashwrench-schema-{0}.cql" -f [guid]::NewGuid().ToString("N"))
        $schemaContent = [System.IO.File]::ReadAllText($schema)
        $schemaContent = $schemaContent.Replace("CREATE KEYSPACE IF NOT EXISTS flashwrench", "CREATE KEYSPACE IF NOT EXISTS $keyspace").Replace("USE flashwrench;", "USE $keyspace;")
        [System.IO.File]::WriteAllText($temporarySchema, $schemaContent, [System.Text.UTF8Encoding]::new($false))
        $schemaToCopy = $temporarySchema
    }

    $runningContainers = @(& wsl.exe @wslPrefix --exec docker ps --format "{{.Names}}" 2>&1)
    if ($LASTEXITCODE -ne 0) {
        throw "Could not run Docker through WSL: $($runningContainers -join [Environment]::NewLine)"
    }
    if ($runningContainers -notcontains $container) {
        throw "No running container '$container' was found through WSL Docker."
    }

    $schemaPathOutput = @(& wsl.exe @wslPrefix --exec wslpath -a -- $schemaToCopy 2>&1)
    if ($LASTEXITCODE -ne 0) {
        throw "Could not convert the schema path for WSL: $($schemaPathOutput -join [Environment]::NewLine)"
    }
    $schemaWslPath = ($schemaPathOutput -join "").Trim()
    if (-not $schemaWslPath) {
        throw "WSL returned an empty schema path."
    }

    Write-Output "-> Resetting keyspace `"$keyspace`" via WSL Docker container `"$container`"..."
    & wsl.exe @wslPrefix --exec docker exec -i $container cqlsh -e "DROP KEYSPACE IF EXISTS `"$keyspace`";"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to drop keyspace '$keyspace'."
    }
    & wsl.exe @wslPrefix --exec docker cp $schemaWslPath "${container}:/tmp/flashwrench_schema.cql"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to copy schema.cql into container '$container'."
    }
    & wsl.exe @wslPrefix --exec docker exec -i $container cqlsh -f /tmp/flashwrench_schema.cql
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to apply schema.cql to keyspace '$keyspace'."
    }

    Write-Output "Done. Keyspace `"$keyspace`" was dropped and recreated; all other keyspaces untouched."
} catch {
    $failureMessage = $_.Exception.Message
} finally {
    if ($temporarySchema -and (Test-Path -LiteralPath $temporarySchema)) {
        Remove-Item -LiteralPath $temporarySchema -ErrorAction SilentlyContinue
    }
}

if ($failureMessage) {
    [Console]::Error.WriteLine($failureMessage)
    exit 1
}
