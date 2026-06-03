@echo off
REM Xbox Wishlist Icon Generator Batch Script
REM This script requires PIL/Pillow to be installed via Python

setlocal enabledelayedexpansion

echo.
echo ================================================================================
echo Xbox Wishlist Icon Generator
echo ================================================================================
echo.

REM Get the current directory
set "SCRIPT_DIR=%~dp0"
set "ICONS_DIR=%SCRIPT_DIR%src\icons"
set "SOURCE_IMAGE=%ICONS_DIR%\xbox-icon.png"

echo Base directory: %SCRIPT_DIR%
echo Icons directory: %ICONS_DIR%
echo Source image: %SOURCE_IMAGE%
echo.

REM Check if source image exists
if not exist "%SOURCE_IMAGE%" (
    echo ❌ Error: Source image not found!
    echo    Expected: %SOURCE_IMAGE%
    echo.
    pause
    exit /b 1
)

echo ✓ Source image found
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Error: Python is not installed or not in PATH!
    echo.
    echo Please install Python from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo ✓ Python found
echo.

REM Install Pillow if needed
echo Checking for Pillow...
python -m pip install Pillow -q
if %errorlevel% neq 0 (
    echo Warning: Could not install Pillow
    echo Attempting to continue...
)

echo ✓ Pillow ready
echo.

REM Run Python script to generate icons
echo Generating icons...
python -c "
from PIL import Image
import os

source = r'%SOURCE_IMAGE%'
icons_dir = r'%ICONS_DIR%'

img = Image.open(source)
if img.mode != 'RGBA':
    img = img.convert('RGBA')

sizes = {
    'icon-16.png': 16,
    'icon-48.png': 48,
    'icon-128.png': 128,
    'icon-192.png': 192
}

for filename, size in sizes.items():
    output_path = os.path.join(icons_dir, filename)
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(output_path, 'PNG')
    file_size = os.path.getsize(output_path)
    print(f'  ✓ {filename:20} | {size:3}x{size:<3} | {file_size:,} bytes')
"

if %errorlevel% neq 0 (
    echo ❌ Error generating icons!
    pause
    exit /b 1
)

echo.
echo ================================================================================
echo ✅ SUCCESS - All icons created!
echo ================================================================================
echo.
echo Icons created in:
echo   %ICONS_DIR%
echo.
echo Next steps:
echo   1. Open Chrome
echo   2. Go to chrome://extensions
echo   3. Enable 'Developer mode'
echo   4. Click 'Load unpacked'
echo   5. Select: %SCRIPT_DIR%src
echo.
echo ================================================================================
echo.
pause
