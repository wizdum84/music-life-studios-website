$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$securePassword = Read-Host "Enter a new password for the ROKIT test customer (8+ characters)" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if ($plainPassword.Length -lt 8) { throw "Password must be at least 8 characters." }
  $plainPassword | npx.cmd tsx "$PSScriptRoot\reset-rokit-test-password.ts"
  if ($LASTEXITCODE -ne 0) { throw "The test password was not updated." }
} finally {
  $plainPassword = $null
  $securePassword.Dispose()
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
Read-Host "Press Enter to close"
