#!/usr/bin/env python3
"""
Xbox Wishlist Icon Generator
Generates 4 icon sizes from xbox-icon.png

Requirements: pip install Pillow
Run: python create-icons.py
"""

from PIL import Image
import os
import sys

def main():
    # Define paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(base_dir, 'src', 'icons')
    source_image = os.path.join(icons_dir, 'xbox-icon.png')
    
    print("=" * 80)
    print("Xbox Wishlist Icon Generator")
    print("=" * 80)
    print(f"\nBase directory: {base_dir}")
    print(f"Icons directory: {icons_dir}")
    print(f"Source image: {source_image}\n")
    
    # Check if source image exists
    if not os.path.exists(source_image):
        print(f"❌ Error: Source image not found!")
        print(f"   Expected: {source_image}")
        print(f"\n   Please ensure xbox-icon.png exists in the icons folder.")
        sys.exit(1)
    
    # Check if PIL is installed
    try:
        from PIL import Image
    except ImportError:
        print("❌ Error: Pillow is not installed!")
        print("   Install it with: pip install Pillow")
        sys.exit(1)
    
    try:
        # Open and prepare the source image
        print(f"Opening source image...")
        img = Image.open(source_image)
        
        if img.mode != 'RGBA':
            print(f"  Converting from {img.mode} to RGBA...")
            img = img.convert('RGBA')
        
        print(f"  ✓ Size: {img.size}")
        print(f"  ✓ Mode: {img.mode}\n")
        
        # Define icon sizes
        sizes = {
            'icon-16.png': 16,
            'icon-48.png': 48,
            'icon-128.png': 128,
            'icon-192.png': 192
        }
        
        # Create each icon size
        print("Creating icon files:\n")
        created_files = []
        
        for filename, size in sizes.items():
            output_path = os.path.join(icons_dir, filename)
            print(f"  Creating {filename}...", end=" ")
            
            # Resize using high-quality LANCZOS resampling
            resized = img.resize((size, size), Image.Resampling.LANCZOS)
            
            # Save as PNG
            resized.save(output_path, 'PNG')
            
            # Verify file was created
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                created_files.append((filename, size, file_size))
                print(f"✓ ({size}x{size}, {file_size:,} bytes)")
            else:
                print(f"✗ Failed!")
                sys.exit(1)
        
        # Summary
        print("\n" + "=" * 80)
        print("✅ SUCCESS - All icons created!")
        print("=" * 80)
        print(f"\nCreated {len(created_files)} icon files in:")
        print(f"  {icons_dir}\n")
        
        for fname, size, fsize in created_files:
            print(f"  ✓ {fname:20} | {size:3}x{size:<3} | {fsize:6,} bytes")
        
        print("\n" + "=" * 80)
        print("Next steps:")
        print("  1. Open Chrome")
        print("  2. Go to chrome://extensions")
        print("  3. Enable 'Developer mode'")
        print("  4. Click 'Load unpacked'")
        print("  5. Select: browser-extension/src")
        print("=" * 80 + "\n")
        
        return 0
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    sys.exit(main())
