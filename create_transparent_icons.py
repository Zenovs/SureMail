#!/usr/bin/env python3
"""
Creates icons with transparent background for CoreMail Desktop v2.2.2
"""
from PIL import Image
import os

# Source icon
SOURCE_ICON = "/home/ubuntu/coremail-icons/original.png"

# Target sizes
SIZES = [512, 256, 128, 64, 32, 16]

# Output directories
OUTPUT_DIRS = [
    "/home/ubuntu/coremail-desktop/public",
    "/home/ubuntu/coremail-desktop/public/icons",
    "/home/ubuntu/coremail-desktop/assets"
]

def make_transparent(img):
    """Replace white/near-white background with transparency"""
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    
    for item in datas:
        r, g, b, a = item
        # Check if pixel is white or near-white (threshold 250)
        if r > 250 and g > 250 and b > 250:
            # Make transparent
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    
    img.putdata(new_data)
    return img

def main():
    print("Loading source icon...")
    original = Image.open(SOURCE_ICON)
    print(f"Original size: {original.size}, mode: {original.mode}")
    
    # Make background transparent
    print("Making background transparent...")
    transparent = make_transparent(original)
    
    # Ensure output directories exist
    for dir_path in OUTPUT_DIRS:
        os.makedirs(dir_path, exist_ok=True)
    
    # Generate all sizes
    for size in SIZES:
        resized = transparent.resize((size, size), Image.LANCZOS)
        
        # Save to public/icons/
        icons_path = f"/home/ubuntu/coremail-desktop/public/icons/icon-{size}.png"
        resized.save(icons_path, "PNG")
        print(f"Created: {icons_path}")
        
        # Save to assets/
        assets_path = f"/home/ubuntu/coremail-desktop/assets/coremail-icon-{size}.png"
        resized.save(assets_path, "PNG")
        print(f"Created: {assets_path}")
    
    # Save main icons (512x512)
    main_icon = transparent.resize((512, 512), Image.LANCZOS)
    
    # public/icon.png
    main_icon.save("/home/ubuntu/coremail-desktop/public/icon.png", "PNG")
    print("Created: /home/ubuntu/coremail-desktop/public/icon.png")
    
    # assets/icon.png
    main_icon.save("/home/ubuntu/coremail-desktop/assets/icon.png", "PNG")
    print("Created: /home/ubuntu/coremail-desktop/assets/icon.png")
    
    print("\n✅ All icons created with transparent background!")

if __name__ == "__main__":
    main()
