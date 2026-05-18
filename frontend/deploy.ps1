# Dynamic PowerShell Deployment Script for GitHub Pages
# Bypasses local node limits and long path restrictions by deploying only the lightweight build folder.

Write-Host "Starting Vite Production Build..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Error "Build failed!"
    exit 1
}

Write-Host "Navigating to dist directory..." -ForegroundColor Cyan
cd dist

Write-Host "Initializing temporary Git repository in build folder..." -ForegroundColor Cyan
git init
git checkout -b gh-pages

Write-Host "Adding remote origin..." -ForegroundColor Cyan
git remote add origin https://MuskaanTabassum004@github.com/MuskaanTabassum004/uvion.git

Write-Host "Staging and committing compiled assets..." -ForegroundColor Cyan
git add .
git commit -m "Deploy to GitHub Pages via Custom Script"

Write-Host "Force pushing compiled assets to gh-pages branch on GitHub..." -ForegroundColor Green
git push -f origin gh-pages

Write-Host "Deploy completed successfully!" -ForegroundColor Green
