#!/bin/bash
#
# CoreMail Desktop - Uninstallation Script
# https://github.com/Zenovs/coremail
#
# Verwendung:
#   curl -sSL https://suremail.vercel.app/uninstall.sh | bash
#

set -e

# Farben für Ausgabe
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Konfiguration
BINARY_NAME="coremail-desktop"
INSTALL_DIR="$HOME/.local/bin"
APPLICATIONS_DIR="$HOME/.local/share/applications"
ICONS_DIR="$HOME/.local/share/icons"
EXTRACTED_DIR="$HOME/.local/share/coremail"

print_banner() {
    echo -e "${RED}"
    echo "  ╔═══════════════════════════════════════════════════╗"
    echo "  ║                                                   ║"
    echo "  ║       CoreMail Desktop Uninstaller                ║"
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

# Bestätigung
confirm_uninstall() {
    echo -e "${YELLOW}Möchtest du CoreMail Desktop wirklich deinstallieren?${NC}"
    read -p "[y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deinstallation abgebrochen."
        exit 0
    fi
}

# Entferne AppImage
remove_appimage() {
    if [ -f "${INSTALL_DIR}/${BINARY_NAME}" ]; then
        print_step "Entferne AppImage..."
        rm -f "${INSTALL_DIR}/${BINARY_NAME}"
        print_success "AppImage entfernt"
    else
        print_warning "AppImage nicht gefunden: ${INSTALL_DIR}/${BINARY_NAME}"
    fi
}

# Entferne Desktop-Entry
remove_desktop_entry() {
    if [ -f "${APPLICATIONS_DIR}/coremail.desktop" ]; then
        print_step "Entferne Desktop-Eintrag..."
        rm -f "${APPLICATIONS_DIR}/coremail.desktop"
        print_success "Desktop-Eintrag entfernt"
    else
        print_warning "Desktop-Eintrag nicht gefunden"
    fi
    
    # Aktualisiere Desktop-Datenbank
    if command -v update-desktop-database &> /dev/null; then
        update-desktop-database "$APPLICATIONS_DIR" 2>/dev/null || true
    fi
}

# Entferne Icon
remove_icon() {
    if [ -f "${ICONS_DIR}/coremail.png" ]; then
        print_step "Entferne Icon..."
        rm -f "${ICONS_DIR}/coremail.png"
        print_success "Icon entfernt"
    fi
}

# Entferne extrahiertes AppImage (falls vorhanden)
remove_extracted() {
    if [ -d "${EXTRACTED_DIR}" ]; then
        print_step "Entferne extrahierte Installation..."
        rm -rf "${EXTRACTED_DIR}"
        print_success "Extrahiertes Verzeichnis entfernt"
    fi
}

# Zeige Erfolgsmeldung
print_success_message() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✓ CoreMail Desktop wurde erfolgreich deinstalliert!${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Neu installieren:"
    echo -e "    ${CYAN}curl -sSL https://suremail.vercel.app/install.sh | bash${NC}"
    echo ""
}

# Hauptfunktion
main() {
    print_banner
    confirm_uninstall
    remove_appimage
    remove_extracted
    remove_desktop_entry
    remove_icon
    print_success_message
}

main
