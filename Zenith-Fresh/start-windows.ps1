# Zenith Fresh Windows PowerShell Startup Script

Write-Host "🚀 Starting Zenith Fresh on Windows..." -ForegroundColor Cyan
Write-Host ""

# Clear Next.js cache
if (Test-Path ".next") {
    Write-Host "🧹 Clearing Next.js cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
}

# Clear node_modules cache if needed
if (Test-Path "node_modules\.cache") {
    Write-Host "🧹 Clearing node modules cache..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "🌟 Starting development server..." -ForegroundColor Green
Write-Host ""
Write-Host "📍 You can access the application at: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔑 MASTER ADMIN CREDENTIALS:" -ForegroundColor Magenta
Write-Host "   Username: zenith_master" -ForegroundColor White
Write-Host "   Password: ZenithMaster2024!" -ForegroundColor White
Write-Host ""
Write-Host "👥 STAFF TEST ACCOUNTS:" -ForegroundColor Magenta
Write-Host "   • staff_1 / StaffTest2024!" -ForegroundColor White
Write-Host "   • staff_2 / StaffTest2024!" -ForegroundColor White
Write-Host "   • qa_lead / QALead2024!" -ForegroundColor White
Write-Host "   • dev_test / DevTest2024!" -ForegroundColor White
Write-Host ""
Write-Host "💎 PREMIUM FEATURES AVAILABLE:" -ForegroundColor Magenta
Write-Host "   ✅ AI-Powered Website Analysis" -ForegroundColor Green
Write-Host "   ✅ Real Website Health Checks" -ForegroundColor Green
Write-Host "   ✅ Competitive Analysis Engine" -ForegroundColor Green
Write-Host "   ✅ E-E-A-T Compliance Checking" -ForegroundColor Green
Write-Host "   ✅ GEO Optimization Tools" -ForegroundColor Green
Write-Host "   ✅ Advanced Analytics & Reporting" -ForegroundColor Green
Write-Host "   ✅ User Management System" -ForegroundColor Green
Write-Host ""
Write-Host "📋 QUICK START:" -ForegroundColor Magenta
Write-Host "   1. Go to http://localhost:3000/auth/signin" -ForegroundColor White
Write-Host "   2. Login with master credentials above" -ForegroundColor White
Write-Host "   3. Access admin panel at /admin" -ForegroundColor White
Write-Host "   4. Test website health checks with real URLs" -ForegroundColor White
Write-Host ""

# Start the development server
npm run dev