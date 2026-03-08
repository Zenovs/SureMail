#!/bin/bash

# CoreMail Desktop Installer
# Installiert CoreMail Desktop als AppImage mit Desktop-Integration

set -e

VERSION="1.3.1"
APP_NAME="CoreMail Desktop"
APPIMAGE_NAME="CoreMail.Desktop-${VERSION}.AppImage"
INSTALL_DIR="$HOME/.local/share/coremail"
DESKTOP_FILE="$HOME/.local/share/applications/coremail.desktop"
ICON_DIR="$HOME/.local/share/icons"
ICON_FILE="$ICON_DIR/coremail.png"

echo "🚀 CoreMail Desktop v${VERSION} Installer"
echo "==========================================="

# Erstelle Verzeichnisse
mkdir -p "$INSTALL_DIR"
mkdir -p "$ICON_DIR"
mkdir -p "$(dirname "$DESKTOP_FILE")"

# Prüfe ob AppImage existiert
if [ -f "$APPIMAGE_NAME" ]; then
    echo "📦 AppImage gefunden: $APPIMAGE_NAME"
elif [ -f "dist/$APPIMAGE_NAME" ]; then
    APPIMAGE_NAME="dist/$APPIMAGE_NAME"
    echo "📦 AppImage gefunden: $APPIMAGE_NAME"
else
    echo "❌ Fehler: $APPIMAGE_NAME nicht gefunden!"
    echo "   Bitte zuerst mit 'npm run build' erstellen."
    exit 1
fi

# Kopiere AppImage
echo "📁 Kopiere AppImage nach $INSTALL_DIR..."
cp "$APPIMAGE_NAME" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/$APPIMAGE_NAME"

# Extrahiere Icon aus AppImage oder verwende assets
echo "🎨 Installiere Icon..."
if [ -f "assets/icon.png" ]; then
    cp "assets/icon.png" "$ICON_FILE"
    echo "   Icon aus assets/icon.png kopiert"
else
    # Extrahiere Icon aus AppImage
    cd "$INSTALL_DIR"
    ./"$APPIMAGE_NAME" --appimage-extract usr/share/icons/hicolor/256x256/apps/*.png 2>/dev/null || true
    if [ -f "squashfs-root/usr/share/icons/hicolor/256x256/apps/"*.png ]; then
        cp "squashfs-root/usr/share/icons/hicolor/256x256/apps/"*.png "$ICON_FILE"
        rm -rf squashfs-root
        echo "   Icon aus AppImage extrahiert"
    else
        echo "⚠️  Kein Icon gefunden, verwende Fallback"
    fi
    cd - > /dev/null
fi

# Erstelle Desktop-Entry
echo "📝 Erstelle Desktop-Eintrag..."
cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=CoreMail Desktop
Comment=Schlanker E-Mail-Client für Linux
Exec=$INSTALL_DIR/$APPIMAGE_NAME
Icon=$ICON_FILE
Terminal=false
Type=Application
Categories=Network;Email;Office;
Keywords=email;mail;imap;smtp;
StartupWMClass=coremail-desktop
EOF

# Update Desktop-Datenbank
echo "🔄 Aktualisiere Desktop-Datenbank..."
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
fi

echo ""
echo "✅ Installation abgeschlossen!"
echo ""
echo "📍 App installiert in: $INSTALL_DIR/$APPIMAGE_NAME"
echo "📍 Icon installiert in: $ICON_FILE"
echo "📍 Desktop-Eintrag: $DESKTOP_FILE"
echo ""
echo "🚀 CoreMail Desktop kann jetzt über das Anwendungsmenü gestartet werden."
echo "   Oder direkt mit: $INSTALL_DIR/$APPIMAGE_NAME"
