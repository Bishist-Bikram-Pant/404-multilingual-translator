#!/usr/bin/env python3
"""
Generate placeholder icons for the TMT Translator Extension
Run this script once to create the required icon files
"""

import os
from PIL import Image, ImageDraw

def create_icon(size, filename):
    """Create a simple circular icon with the given size"""
    # Create a new image with green background
    img = Image.new('RGB', (size, size), color='#4CAF50')
    draw = ImageDraw.Draw(img)
    
    # Add a white circle border
    border = int(size * 0.1)
    draw.ellipse(
        [border, border, size - border, size - border],
        outline='white',
        width=2
    )
    
    # Add a "G" for Google/Global in the center
    try:
        # Try to use a built-in font, if available
        draw.text(
            (size // 2, size // 2),
            "🌐",
            fill='white',
            anchor='mm'
        )
    except:
        # Fallback: just save without text if font fails
        pass
    
    # Save the image
    img.save(filename)
    print(f"✓ Created {filename} ({size}x{size})")

def main():
    """Generate all required icons"""
    asset_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets')
    
    # Create assets directory if it doesn't exist
    os.makedirs(asset_dir, exist_ok=True)
    
    # Create icons for each required size
    icons = [
        (16, os.path.join(asset_dir, 'icon-16.png')),
        (48, os.path.join(asset_dir, 'icon-48.png')),
        (128, os.path.join(asset_dir, 'icon-128.png')),
    ]
    
    print("Generating extension icons...")
    print("-" * 40)
    
    try:
        for size, filepath in icons:
            create_icon(size, filepath)
        
        print("-" * 40)
        print("✓ All icons generated successfully!")
        print(f"\nIcons saved to: {asset_dir}/")
        print("\nYou can now load the extension in Chrome:")
        print("  1. Go to chrome://extensions/")
        print("  2. Enable Developer mode")
        print("  3. Click 'Load unpacked'")
        print("  4. Select the tmt-translator-extension folder")
        
    except ImportError:
        print("ERROR: Pillow library not found!")
        print("\nTo fix this, install Pillow:")
        print("  pip install pillow")
        print("\nOr use the alternative method:")
        print("  1. Download icons from: https://www.favicon-generator.org/")
        print("  2. Create 16x16, 48x48, and 128x128 PNG files")
        print("  3. Place them in: src/assets/")
        return False
    
    return True

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
