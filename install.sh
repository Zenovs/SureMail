#!/bin/bash

# CoreMail Desktop Installation Script
# Version: 3.0.9

set -e

echo "🚀 CoreMail Desktop Installation"
echo "================================="
echo ""

# Farben
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variablen
VERSION="3.0.10"
APPIMAGE_URL="https://github.com/Zenovs/coremail/releases/download/v${VERSION}/CoreMail.Desktop-${VERSION}.AppImage"
ICON_BASE_URL="https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/icons"

# Verzeichnisse erstellen
echo "📁 Erstelle Verzeichnisse..."
mkdir -p ~/.local/bin
mkdir -p ~/.local/share/applications
mkdir -p ~/.local/share/pixmaps
mkdir -p ~/.local/share/icons/hicolor/{16x16,32x32,64x64,128x128,256x256,512x512}/apps

# AppImage herunterladen
echo "⬇️  Lade CoreMail Desktop v${VERSION} herunter..."
if command -v wget &> /dev/null; then
    wget --no-check-certificate -q --show-progress "${APPIMAGE_URL}" -O ~/.local/bin/coremail-desktop
elif command -v curl &> /dev/null; then
    curl -L "${APPIMAGE_URL}" -o ~/.local/bin/coremail-desktop
else
    echo -e "${RED}❌ Fehler: wget oder curl nicht gefunden!${NC}"
    exit 1
fi

chmod +x ~/.local/bin/coremail-desktop
echo -e "${GREEN}✅ AppImage heruntergeladen${NC}"

# Wrapper-Script erstellen (löst FUSE/GNOME Launcher Problem)
echo "📝 Erstelle Starter-Script..."
cat > ~/.local/bin/coremail << 'WRAPPER'
#!/bin/bash
# CoreMail Starter: Umgeht FUSE-Beschränkungen im GNOME-Kontext
export APPIMAGE_EXTRACT_AND_RUN=1
export ELECTRON_NO_SANDBOX=1
exec "$HOME/.local/bin/coremail-desktop" "$@"
WRAPPER
chmod +x ~/.local/bin/coremail
echo -e "${GREEN}✅ Starter-Script erstellt${NC}"

# Icons herunterladen
echo "🎨 Lade Icons herunter..."

if command -v wget &> /dev/null; then
    wget -q "${ICON_BASE_URL}/icon-16.png" -O ~/.local/share/icons/hicolor/16x16/apps/coremail.png 2>/dev/null || true
    wget -q "${ICON_BASE_URL}/icon-32.png" -O ~/.local/share/icons/hicolor/32x32/apps/coremail.png 2>/dev/null || true
    wget -q "${ICON_BASE_URL}/icon-64.png" -O ~/.local/share/icons/hicolor/64x64/apps/coremail.png 2>/dev/null || true
    wget -q "${ICON_BASE_URL}/icon-128.png" -O ~/.local/share/icons/hicolor/128x128/apps/coremail.png 2>/dev/null || true
    wget -q "${ICON_BASE_URL}/icon-256.png" -O ~/.local/share/icons/hicolor/256x256/apps/coremail.png 2>/dev/null || true
    wget -q "${ICON_BASE_URL}/icon-512.png" -O ~/.local/share/icons/hicolor/512x512/apps/coremail.png 2>/dev/null || true
    wget -q "${ICON_BASE_URL}/icon-512.png" -O ~/.local/share/pixmaps/coremail.png 2>/dev/null || true
else
    curl -s "${ICON_BASE_URL}/icon-16.png" -o ~/.local/share/icons/hicolor/16x16/apps/coremail.png 2>/dev/null || true
    curl -s "${ICON_BASE_URL}/icon-32.png" -o ~/.local/share/icons/hicolor/32x32/apps/coremail.png 2>/dev/null || true
    curl -s "${ICON_BASE_URL}/icon-64.png" -o ~/.local/share/icons/hicolor/64x64/apps/coremail.png 2>/dev/null || true
    curl -s "${ICON_BASE_URL}/icon-128.png" -o ~/.local/share/icons/hicolor/128x128/apps/coremail.png 2>/dev/null || true
    curl -s "${ICON_BASE_URL}/icon-256.png" -o ~/.local/share/icons/hicolor/256x256/apps/coremail.png 2>/dev/null || true
    curl -s "${ICON_BASE_URL}/icon-512.png" -o ~/.local/share/icons/hicolor/512x512/apps/coremail.png 2>/dev/null || true
    curl -s "${ICON_BASE_URL}/icon-512.png" -o ~/.local/share/pixmaps/coremail.png 2>/dev/null || true
fi

echo -e "${GREEN}✅ Icons heruntergeladen${NC}"

# index.theme erstellen
echo "📝 Erstelle Icon-Theme-Datei..."
cat > ~/.local/share/icons/hicolor/index.theme << 'EOF'
[Icon Theme]
Name=Hicolor
Comment=Fallback icon theme
Hidden=true
Directories=16x16/apps,32x32/apps,64x64/apps,128x128/apps,256x256/apps,512x512/apps

[16x16/apps]
Size=16
Context=Applications
Type=Threshold

[32x32/apps]
Size=32
Context=Applications
Type=Threshold

[64x64/apps]
Size=64
Context=Applications
Type=Threshold

[128x128/apps]
Size=128
Context=Applications
Type=Threshold

[256x256/apps]
Size=256
Context=Applications
Type=Threshold

[512x512/apps]
Size=512
Context=Applications
Type=Threshold
EOF

echo -e "${GREEN}✅ Icon-Theme-Datei erstellt${NC}"

# .desktop-Datei erstellen
echo "📝 Erstelle Desktop-Eintrag..."
cat > ~/.local/share/applications/coremail.desktop << EOF
[Desktop Entry]
Version=1.0
Type=Application
Name=CoreMail Desktop
Comment=E-Mail Client für Linux
Exec=$HOME/.local/bin/coremail
Icon=$HOME/.local/share/pixmaps/coremail.png
Terminal=false
Categories=Network;Email;Office;
StartupNotify=true
Keywords=email;mail;imap;smtp;
EOF

chmod +x ~/.local/share/applications/coremail.desktop
echo -e "${GREEN}✅ Desktop-Eintrag erstellt${NC}"

# Cache aktualisieren
echo "🔄 Aktualisiere Caches..."
gtk-update-icon-cache -f ~/.local/share/icons/hicolor 2>/dev/null || true
update-desktop-database ~/.local/share/applications 2>/dev/null || true
echo -e "${GREEN}✅ Caches aktualisiert${NC}"

echo ""
echo -e "${GREEN}✅ Installation abgeschlossen!${NC}"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Drücke die Super-Taste (Windows-Taste)"
echo "2. Suche nach 'CoreMail'"
echo "3. Klicke auf das Icon zum Starten"
echo ""
echo "Oder starte direkt mit:"
echo "  ~/.local/bin/coremail"
echo ""

# Optional: App direkt starten
read -p "Möchtest du CoreMail jetzt starten? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[JjYy]$ ]]; then
    echo "🚀 Starte CoreMail Desktop..."
    ~/.local/bin/coremail &
fi
