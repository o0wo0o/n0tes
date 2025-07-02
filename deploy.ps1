Write-Host "Enter commit message:"
$commitMsg = Read-Host

Write-Host "`n[1/4] Copying images..."
node scripts\copy-assets.js
if ($LASTEXITCODE -ne 0) {
    Write-Error "❌ Error running copy-assets.js"
    exit $LASTEXITCODE
}

Write-Host "`n[2/4] Staging changes..."
git add .

Write-Host "`n[3/4] Committing: $commitMsg"
git commit -m "$commitMsg"

Write-Host "`n[4/4] Pushing to main with --force..."
git push origin main --force

Write-Host "`n✅ Done!"
