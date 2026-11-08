$ErrorActionPreference = "Stop"
$stripeExe = "C:\Users\wizdu\AppData\Roaming\npm\node_modules\@stripe\cli\node_modules\@stripe\cli-win32-x64\bin\stripe.exe"
if (-not (Test-Path -LiteralPath $stripeExe)) { throw "Native Stripe CLI executable was not found." }

Write-Host "Music Life Studios - Secure R2 credential setup" -ForegroundColor Cyan

function Save-ProjectSecret {
  param(
    [Parameter(Mandatory = $true)][string]$Name,
    [Parameter(Mandatory = $true)][string]$EnvKey,
    [Parameter(Mandatory = $true)][string]$Prompt
  )

  $secureValue = Read-Host $Prompt -AsSecureString
  $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)
  try {
    $plainValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    if ([string]::IsNullOrWhiteSpace($plainValue)) { throw "$EnvKey cannot be blank." }
    & $stripeExe projects variables set $Name --env-key $EnvKey --value $plainValue
    if ($LASTEXITCODE -ne 0) { throw "$EnvKey was not saved." }
  } finally {
    $plainValue = $null
    $secureValue.Dispose()
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
  }
}

Save-ProjectSecret -Name "r2-access-key-id" -EnvKey "R2_ACCESS_KEY_ID" -Prompt "Paste the Cloudflare Access Key ID"
Save-ProjectSecret -Name "r2-secret-access-key" -EnvKey "R2_SECRET_ACCESS_KEY" -Prompt "Paste the Cloudflare Secret Access Key"

Write-Host "R2 credentials saved securely. Return to Codex and say: credentials saved" -ForegroundColor Green
Read-Host "Press Enter to close"
