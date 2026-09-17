Set-Location C:\PrinterMaintenance

# Limpiar scripts temporales
Remove-Item "C:\PrinterMaintenance\fix_and_git.ps1" -ErrorAction SilentlyContinue
Remove-Item "C:\PrinterMaintenance\git_status.ps1" -ErrorAction SilentlyContinue

# Stage todos los cambios
git add -A

# Ver que va en el commit
Write-Host ">>> Staged:" -ForegroundColor Cyan
git diff --cached --stat

# Commit
git commit -m "fix: modal overlay display conflict with auth, add login screen and token auth"

# Push
Write-Host ""
Write-Host ">>> Pushing..." -ForegroundColor Cyan
git push origin main
