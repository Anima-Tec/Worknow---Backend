Write-Host "Aplicando cambios de Prisma..." -ForegroundColor Green
npx prisma db push
Write-Host ""
Write-Host "Regenerando cliente de Prisma..." -ForegroundColor Green
npx prisma generate
Write-Host ""
Write-Host "Comandos completados!" -ForegroundColor Green
