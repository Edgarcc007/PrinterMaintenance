Set-Location C:\PrinterMaintenance

git add -A

Write-Host ">>> Changes:" -ForegroundColor Cyan
git status --short

git commit -m "fix: modal overlay display conflict - replace inline display:none with classList toggle"

Write-Host ""
Write-Host ">>> Pushing..." -ForegroundColor Cyan
git push origin main
