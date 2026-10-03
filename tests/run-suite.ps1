# Run every test file of one suite directory in its own process.
# Same contract as tests/run-suite.sh (Bun shares one module registry per
# process, so mock.module calls would leak across files in a single run).
# Usage: powershell -File tests/run-suite.ps1 tests/unit
param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$SuiteDir
)

$files = Get-ChildItem -Path (Join-Path $SuiteDir "*.test.ts") -File |
  Sort-Object Name

if ($files.Count -eq 0) {
  Write-Error "No test files found in $SuiteDir"
  exit 1
}

foreach ($file in $files) {
  & bun test $file.FullName
  if ($LASTEXITCODE -ne 0) {
    Write-Error "FAIL: $($file.Name)"
    exit 1
  }
}

Write-Output "All green: $($files.Count) files in $SuiteDir"
exit 0
