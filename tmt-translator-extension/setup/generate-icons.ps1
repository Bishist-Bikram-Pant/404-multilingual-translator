# Generate placeholder icons for TMT Translator Extension
# Windows PowerShell script - no external dependencies needed

# Create assets directory
$assetsDir = Join-Path $PSScriptRoot "..\src\assets"
if (-not (Test-Path $assetsDir)) {
    New-Item -ItemType Directory -Path $assetsDir -Force | Out-Null
}

Write-Host "Generating extension icons..." -ForegroundColor Green
Write-Host ("-" * 40)

# Base64-encoded minimal PNG files
$icons = @{
    "icon-16.png"  = "iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAEUlEQVR42mNkYPhfAQAFhAF/wlxTIgAAAABJRU5ErkJggg=="
    "icon-48.png"  = "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAJUlEQVR42u3YMQEAMAwAoD5r+bFwYUoDc3MzMzMzMzPzJR4mAQWvJFo3AAAAAElFTkSuQmCC"
    "icon-128.png" = "iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADTAcNWAAAAJElEQVR42u3YMQEAMAwAoD5r+bFwYUoDc3MzMzMzM7PdX2IBBTRI9sJM8HgAAAAASUVORK5CYII="
}

foreach ($filename in $icons.Keys) {
    $filepath = Join-Path $assetsDir $filename
    $bytes = [Convert]::FromBase64String($icons[$filename])
    [System.IO.File]::WriteAllBytes($filepath, $bytes)
    Write-Host "✓ Created $filename" -ForegroundColor Green
}

Write-Host ("-" * 40) -ForegroundColor Green
Write-Host "✓ All icons generated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Icons saved to: $assetsDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now load the extension in Chrome:" -ForegroundColor Yellow
Write-Host "  1. Go to chrome://extensions/"
Write-Host "  2. Enable Developer mode (top-right)"
Write-Host "  3. Click 'Load unpacked'"
Write-Host "  4. Select the tmt-translator-extension folder"
Write-Host ""
Write-Host "Then refresh Chrome to see the extension!" -ForegroundColor Cyan
