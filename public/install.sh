#!/bin/bash
#
# CoreMail Desktop - One-Liner Installation Script
# https://github.com/Zenovs/coremail
#
# Verwendung:
#   curl -sSL https://suremail.vercel.app/install.sh | bash
#   oder
#   wget -qO- https://suremail.vercel.app/install.sh | bash
#

set -e

# Farben für Ausgabe
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Konfiguration
VERSION="1.0.0"
APP_NAME="CoreMail Desktop"
BINARY_NAME="coremail-desktop"
INSTALL_DIR="$HOME/.local/bin"
APPLICATIONS_DIR="$HOME/.local/share/applications"
ICONS_DIR="$HOME/.local/share/icons"
DOWNLOAD_URL="https://github.com/Zenovs/coremail/releases/download/v${VERSION}/CoreMail%20Desktop-${VERSION}.AppImage"
ICON_URL="https://i.pinimg.com/736x/7b/10/de/7b10de9767ac5f50b38ebf3c17ecc248.jpg"

print_banner() {
    echo -e "${CYAN}"
    echo "  ╔═══════════════════════════════════════════════════╗"
    echo "  ║                                                   ║"
    echo "  ║         CoreMail Desktop Installer                ║"
    echo "  ║              Version ${VERSION}                         ║"
    echo "  ║                                                   ║"
    echo "  ╚═══════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${CYAN}[*]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Prüfe ob curl oder wget verfügbar
check_downloader() {
    if command -v curl &> /dev/null; then
        DOWNLOADER="curl"
        DOWNLOAD_CMD="curl -fsSL -o"
    elif command -v wget &> /dev/null; then
        DOWNLOADER="wget"
        DOWNLOAD_CMD="wget -q -O"
    else
        print_error "Weder curl noch wget gefunden!"
        print_error "Bitte installiere curl oder wget:"
        echo "  sudo apt install curl"
        echo "  oder"
        echo "  sudo apt install wget"
        exit 1
    fi
}

# Erstelle notwendige Verzeichnisse
create_directories() {
    print_step "Erstelle Verzeichnisse..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$APPLICATIONS_DIR"
    mkdir -p "$ICONS_DIR"
}

# Lade AppImage herunter
download_appimage() {
    print_step "Lade CoreMail Desktop v${VERSION} herunter..."
    print_step "(Dies kann einige Minuten dauern - ~130 MB)"
    
    if [ "$DOWNLOADER" = "curl" ]; then
        curl -fSL --progress-bar -o "${INSTALL_DIR}/${BINARY_NAME}" "$DOWNLOAD_URL"
    else
        wget --show-progress -q -O "${INSTALL_DIR}/${BINARY_NAME}" "$DOWNLOAD_URL"
    fi
    
    if [ $? -ne 0 ]; then
        print_error "Download fehlgeschlagen!"
        print_error "Stelle sicher, dass GitHub Release v${VERSION} existiert."
        exit 1
    fi
}

# Mache ausführbar
make_executable() {
    print_step "Mache ausführbar..."
    chmod +x "${INSTALL_DIR}/${BINARY_NAME}"
}

# Lade Icon herunter (optional, fehler ignorieren)
download_icon() {
    print_step "Lade Icon herunter..."
    $DOWNLOAD_CMD "${ICONS_DIR}/coremail.png" "$ICON_URL" 2>/dev/null || {
        print_warning "Icon konnte nicht heruntergeladen werden (optional)"
        return 0
    }
}

# Erstelle Desktop-Entry
create_desktop_entry() {
    print_step "Erstelle Desktop-Eintrag..."
    
    cat > "${APPLICATIONS_DIR}/coremail.desktop" << EOF
[Desktop Entry]
Name=CoreMail Desktop
Comment=E-Mail Marketing Tool mit Darknet Design
Exec=${INSTALL_DIR}/${BINARY_NAME}
Icon=${ICONS_DIR}/coremail.png
Terminal=false
Type=Application
Categories=Network;Email;Office;
StartupWMClass=CoreMail Desktop
Keywords=email;mail;marketing;newsletter;
EOF

    # Aktualisiere Desktop-Datenbank (optional)
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    fi
}

# Füge zu PATH hinzu (falls nicht vorhanden)
setup_path() {
    if [[ ":$PATH:" != *":$INSTALL_DIR:"* ]]; then
        print_warning "${INSTALL_DIR} ist nicht in deinem PATH."
        print_step "Füge folgende Zeile zu deiner ~/.bashrc oder ~/.zshrc hinzu:"
        echo ""
        echo -e "  ${CYAN}export PATH=\"\$HOME/.local/bin:\$PATH\"${NC}"
        echo ""
    fi
}

# Zeige Erfolgsmeldung
print_success_message() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ CoreMail Desktop wurde erfolgreich installiert!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Starten:"
    echo -e "    ${CYAN}coremail-desktop${NC}           (im Terminal)"
    echo -e "    ${CYAN}CoreMail Desktop${NC}          (im App-Menü)"
    echo ""
    echo "  Installationsort:"
    echo -e "    ${CYAN}${INSTALL_DIR}/${BINARY_NAME}${NC}"
    echo ""
    echo "  Deinstallieren:"
    echo -e "    ${CYAN}curl -sSL https://suremail.vercel.app/uninstall.sh | bash${NC}"
    echo ""
}

# Hauptfunktion
main() {
    print_banner
    check_downloader
    create_directories
    download_appimage
    make_executable
    download_icon
    create_desktop_entry
    setup_path
    print_success_message
}

main
