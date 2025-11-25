Param()
Write-Host "Running Windows PowerShell pre-commit secret scan..."

$files = git diff --cached --name-only --diff-filter=ACM
$bad = $false
foreach ($f in $files) {
    # get staged content
    try {
        $content = git show :"$f" 2>$null
    } catch {
        continue
    }
    if ($content -match 'jwt.secret' -or $content -match 'spring.mail.password' -or $content -match 'MAIL_PASSWORD' -or $content -match 'BEGIN RSA PRIVATE KEY' -or $content -match 'BEGIN PRIVATE KEY' -or $content -match 'AWS_SECRET_ACCESS_KEY') {
        Write-Host "Potential secret found in staged file: $f"
        $bad = $true
    }
    if ($content -match '[0-9a-fA-F]{32,}') {
        Write-Host "Possible long hex token found in $f"
        $bad = $true
    }
    if ($content -match '[A-Za-z0-9+/=]{32,}') {
        Write-Host "Possible long base64 string found in $f"
        $bad = $true
    }
}
if ($bad) {
    Write-Host "`nERROR: Potential secrets detected in staged files. Remove them or move secrets to env vars/application-secret.properties before committing." -ForegroundColor Red
    exit 1
}
exit 0
