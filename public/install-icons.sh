#!/bin/bash
# CoreMail Desktop Icon Installation Script v2.2.2
# Installiert Icons in alle relevanten Verzeichnisse

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ICON_DIR="$SCRIPT_DIR/icons"
APP_NAME="coremail"

echo "🎨 CoreMail Desktop Icon Installation"
echo "======================================"

# Create directories
mkdir -p ~/.local/share/pixmaps
mkdir -p ~/.local/share/icons/hicolor/512x512/apps
mkdir -p ~/.local/share/icons/hicolor/256x256/apps
mkdir -p ~/.local/share/icons/hicolor/128x128/apps
mkdir -p ~/.local/share/icons/hicolor/64x64/apps
mkdir -p ~/.local/share/icons/hicolor/32x32/apps
mkdir -p ~/.local/share/icons/hicolor/16x16/apps

# Install icons
echo "Installing icons..."

# Main icon to pixmaps
cp "$SCRIPT_DIR/icon.png" ~/.local/share/pixmaps/$APP_NAME.png
echo "✓ Installed to ~/.local/share/pixmaps/$APP_NAME.png"

# Icons in all sizes
for size in 512 256 128 64 32 16; do
    if [ -f "$ICON_DIR/icon-$size.png" ]; then
        cp "$ICON_DIR/icon-$size.png" ~/.local/share/icons/hicolor/${size}x${size}/apps/$APP_NAME.png
        echo "✓ Installed ${size}x${size} icon"
    fi
done

# Update icon cache
if command -v gtk-update-icon-cache &> /dev/null; then
    echo "Updating icon cache..."
    gtk-update-icon-cache -f -t ~/.local/share/icons/hicolor/ 2>/dev/null
    echo "✓ Icon cache updated"
fi

echo ""
echo "✅ Icons installed successfully!"
echo "You may need to log out and back in for changes to take effect."
