param (
    [string]$msg = "chore: update biolink code"
)

Write-Host "1. Git add..."
git add .

Write-Host "2. Git commit: $msg..."
git commit -m "$msg"

Write-Host "3. Git push origin main..."
git push origin main

Write-Host "4. Deploying to Oracle Cloud Linux Server via SSH..."
$sshCmd = "cd /var/www/biolink ; git pull origin main ; pm2 restart biolink"
& "C:\Program Files\PuTTY\plink.exe" -batch -i "C:\Users\Matheus\Downloads\private\private.ppk" ubuntu@134.65.252.205 $sshCmd

Write-Host "Deploy Concluido com Sucesso!"
