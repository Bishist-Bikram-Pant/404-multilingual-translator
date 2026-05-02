@echo off
REM Generate placeholder icons for TMT Translator Extension
REM Windows batch script - no external dependencies

setlocal enabledelayedexpansion

REM Get the directory where this script is located
set scriptDir=%~dp0
set assetsDir=%scriptDir%..\src\assets

REM Create assets directory if it doesn't exist
if not exist "%assetsDir%" mkdir "%assetsDir%"

echo Generating extension icons...
echo ----------------------------------------

REM Create simple 1x1 PNG files using base64
REM These are placeholder icons that can be customized later

REM icon-16.png (base64 encoded minimal PNG)
set icon16=iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAEUlEQVR42mNkYPhfAQAFhAF/wlxTIgAAAABJRU5ErkJggg==
set icon48=iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAJUlEQVR42u3YMQEAMAwAoD5r+bFwYUoDc3MzMzMzMzPzJR4mAQWvJFo3AAAAAElFTkSuQmCC
set icon128=iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADTAcNWAAAAJElEQVR42u3YMQEAMAwAoD5r+bFwYUoDc3MzMzMzM7PdX2IBBTRI9sJM8HgAAAAASUVORK5CYII=

REM Decode base64 and create PNG files using certutil
certutil -decode <nul "%icon16%" "%assetsDir%\icon-16.png" > nul 2>&1

REM Simple workaround: create the files using PowerShell one-liner
powershell -NoProfile -Command ^
  "$icon16='iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAEUlEQVR42mNkYPhfAQAFhAF/wlxTIgAAAABJRU5ErkJggg=='; [System.IO.File]::WriteAllBytes('%assetsDir%\icon-16.png', [Convert]::FromBase64String($icon16))"

powershell -NoProfile -Command ^
  "$icon48='iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAJUlEQVR42u3YMQEAMAwAoD5r+bFwYUoDc3MzMzMzMzPzJR4mAQWvJFo3AAAAAElFTkSuQmCC'; [System.IO.File]::WriteAllBytes('%assetsDir%\icon-48.png', [Convert]::FromBase64String($icon48))"

powershell -NoProfile -Command ^
  "$icon128='iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADTAcNWAAAAJElEQVR42u3YMQEAMAwAoD5r+bFwYUoDc3MzMzMzM7PdX2IBBTRI9sJM8HgAAAAASUVORK5CYII='; [System.IO.File]::WriteAllBytes('%assetsDir%\icon-128.png', [Convert]::FromBase64String($icon128))"

if exist "%assetsDir%\icon-16.png" echo Created: icon-16.png
if exist "%assetsDir%\icon-48.png" echo Created: icon-48.png
if exist "%assetsDir%\icon-128.png" echo Created: icon-128.png

echo.
echo ----------------------------------------
echo Icons generated successfully!
echo Icons saved to: %assetsDir%
echo.
echo You can now load the extension in Chrome:
echo   1. Go to chrome://extensions/
echo   2. Enable Developer mode (top-right)
echo   3. Click 'Load unpacked'
echo   4. Select the tmt-translator-extension folder
echo.
echo Then refresh Chrome to see the extension!
echo.
pause
