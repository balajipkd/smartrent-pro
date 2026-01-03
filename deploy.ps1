# SmartRent Pro Deployment Script

Write-Host "🚀 Starting Deployment Process..." -ForegroundColor Cyan

# 1. Check Login
Write-Host "Checking Vercel Login status..."
$loginCheck = npx -y vercel whoami 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ You are not logged in. Opening login..." -ForegroundColor Yellow
    cmd /c "npx -y vercel login"
} else {
    Write-Host "✅ Logged in as $loginCheck" -ForegroundColor Green
}

# 2. Link Project
Write-Host "`n🔗 Linking Project..." -ForegroundColor Cyan
Write-Host "   (Select 'Yes' to default settings where possible)" -ForegroundColor Gray
cmd /c "npx -y vercel link"

# 3. Set Environment Variables
# Using cmd /c to handle piping reliably across shells
Write-Host "`n🔑 Setting Up Environment Variables..." -ForegroundColor Cyan

# VITE_SUPABASE_URL
Write-Host "   Setting VITE_SUPABASE_URL..."
$env:VITE_SUPABASE_URL = "https://iomxaakjqtmsjauefwdi.supabase.co"
cmd /c "echo $env:VITE_SUPABASE_URL | npx -y vercel env add VITE_SUPABASE_URL production"

# VITE_SUPABASE_ANON_KEY
Write-Host "   Setting VITE_SUPABASE_ANON_KEY..."
$env:VITE_SUPABASE_ANON_KEY = "sb_publishable_JxDE2Ndx4My0INTnbNs86g_LWAHv90S"
cmd /c "echo $env:VITE_SUPABASE_ANON_KEY | npx -y vercel env add VITE_SUPABASE_ANON_KEY production"

# 4. Deploy
Write-Host "`n🚀 Deploying to Production..." -ForegroundColor Cyan
cmd /c "npx -y vercel --prod"

Write-Host "`n✅ Deployment Complete! Check the URL above." -ForegroundColor Green
