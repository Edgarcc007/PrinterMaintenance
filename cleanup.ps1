Set-Location C:\PrinterMaintenance

# Configurar identidad Git
git config --global user.name "Edgar Carrasco"
git config --global user.email "ECARRASCO@TMSA.TCL.COM.MX"
Write-Host ">>> Git identity set" -ForegroundColor Green

# Agregar scripts al .gitignore
$gitignore = ""
if (Test-Path ".gitignore") {
    $gitignore = [System.IO.File]::ReadAllText(".gitignore")
}
if ($gitignore -notmatch "\.ps1") {
    $gitignore += "`n# Scripts de mantenimiento`n*.ps1`n"
    [System.IO.File]::WriteAllText(".gitignore", $gitignore)
    Write-Host ">>> .gitignore updated - *.ps1 excluded" -ForegroundColor Green
}

# Eliminar scripts del tracking de git (sin borrar archivos locales)
git rm --cached *.ps1 2>$null

# Commit y push
git add -A
Write-Host ""
Write-Host ">>> Changes:" -ForegroundColor Cyan
git status --short

git commit -m "chore: configure gitignore to exclude maintenance scripts"

Write-Host ""
Write-Host ">>> Pushing..." -ForegroundColor Cyan
git push origin main

Write-Host ""
Write-Host ">>> Identity:" -ForegroundColor Cyan
git config user.name
git config user.email
