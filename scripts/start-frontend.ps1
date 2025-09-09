Param(
  [int]$SleepSeconds = 3
)

$wd = "BCO/frontend"
$stdout = Join-Path $wd "vite.out"
$stderr = Join-Path $wd "vite.err"

if (Test-Path $stdout) { Remove-Item $stdout -Force }
if (Test-Path $stderr) { Remove-Item $stderr -Force }

$proc = Start-Process -FilePath "npm" -ArgumentList @("run","dev") -WorkingDirectory $wd -RedirectStandardOutput $stdout -RedirectStandardError $stderr -PassThru

Start-Sleep -Seconds $SleepSeconds

Write-Output ("Started Vite dev server. PID: {0}" -f $proc.Id)

if (Test-Path $stdout) {
  Write-Output "--- vite.out (last 40 lines) ---"
  Get-Content -Path $stdout -Tail 40
} elseif (Test-Path $stderr) {
  Write-Output "--- vite.err (last 40 lines) ---"
  Get-Content -Path $stderr -Tail 40
} else {
  Write-Output "No output yet."
}

