$ErrorActionPreference = "Stop"
$securePassword = Read-Host "Enter a new administrator password (8+ characters)" -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
  if ($plainPassword.Length -lt 8) { throw "Password must be at least 8 characters." }
  $plainPassword | npx.cmd tsx "$PSScriptRoot\reset-admin-password.ts"
  if ($LASTEXITCODE -ne 0) { throw "The administrator password was not updated." }
} finally {
  $plainPassword = $null
  $securePassword.Dispose()
  [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
Read-Host "Press Enter to close"
