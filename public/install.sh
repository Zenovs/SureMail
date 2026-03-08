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
BOLD='\033[1m'
NC='\033[0m' # No Color

# Konfiguration
VERSION="1.0.0"
APP_NAME="CoreMail Desktop"
BINARY_NAME="coremail-desktop"
INSTALL_DIR="$HOME/.local/bin"
APPLICATIONS_DIR="$HOME/.local/share/applications"
ICONS_DIR="$HOME/.local/share/icons"
EXTRACTED_DIR="$HOME/.local/share/coremail"
DOWNLOAD_URL="https://github.com/Zenovs/coremail/releases/download/v${VERSION}/CoreMail.Desktop-${VERSION}.AppImage"
ICON_URL="https://i.pinimg.com/736x/7b/10/de/7b10de9767ac5f50b38ebf3c17ecc248.jpg"

# Installationsmodus: appimage oder extracted
INSTALL_MODE="appimage"

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

# Frage Benutzer mit Ja/Nein
ask_yes_no() {
    local prompt="$1"
    local default="${2:-y}"
    local answer
    
    if [ "$default" = "y" ]; then
        prompt="$prompt [J/n]: "
    else
        prompt="$prompt [j/N]: "
    fi
    
    # Bei Pipe-Ausführung (curl | bash) ist STDIN nicht verfügbar
    # In diesem Fall: Default verwenden
    if [ ! -t 0 ]; then
        if [ "$default" = "y" ]; then
            return 0
        else
            return 1
        fi
    fi
    
    read -r -p "$prompt" answer
    answer="${answer:-$default}"
    
    case "$answer" in
        [jJyY]|[jJ][aA]|[yY][eE][sS]) return 0 ;;
        *) return 1 ;;
    esac
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

# Prüfe ob FUSE installiert ist
check_fuse() {
    print_step "Prüfe FUSE-Abhängigkeit..."
    
    # Prüfe ob libfuse2 oder fuse verfügbar ist
    if ldconfig -p 2>/dev/null | grep -q "libfuse.so.2"; then
        print_success "FUSE ist installiert (libfuse2)"
        return 0
    fi
    
    if command -v fusermount &> /dev/null; then
        print_success "FUSE ist installiert (fusermount gefunden)"
        return 0
    fi
    
    # FUSE nicht gefunden
    return 1
}

# Installiere FUSE
install_fuse() {
    print_step "Installiere FUSE (libfuse2)..."
    
    # Prüfe ob sudo verfügbar ist
    if ! command -v sudo &> /dev/null; then
        print_error "sudo ist nicht verfügbar!"
        print_warning "FUSE kann nicht automatisch installiert werden."
        return 1
    fi
    
    # Erkenne Paketmanager und installiere FUSE
    if command -v apt &> /dev/null; then
        # Debian/Ubuntu/Linux Mint
        print_step "Erkannt: Debian/Ubuntu System"
        echo ""
        print_warning "sudo-Rechte werden benötigt für die Installation von libfuse2"
        echo ""
        
        sudo apt update -qq
        
        # Versuche zuerst libfuse2
        if apt-cache show libfuse2 &> /dev/null; then
            sudo apt install -y libfuse2
            print_success "libfuse2 wurde installiert"
            return 0
        fi
        
        # Falls libfuse2 nicht verfügbar, versuche fuse
        if apt-cache show fuse &> /dev/null; then
            sudo apt install -y fuse
            print_success "fuse wurde installiert"
            return 0
        fi
        
        print_error "Weder libfuse2 noch fuse im Repository gefunden!"
        return 1
        
    elif command -v dnf &> /dev/null; then
        # Fedora/RHEL
        print_step "Erkannt: Fedora/RHEL System"
        sudo dnf install -y fuse fuse-libs
        print_success "FUSE wurde installiert"
        return 0
        
    elif command -v pacman &> /dev/null; then
        # Arch Linux
        print_step "Erkannt: Arch Linux System"
        sudo pacman -S --noconfirm fuse2
        print_success "FUSE wurde installiert"
        return 0
        
    elif command -v zypper &> /dev/null; then
        # openSUSE
        print_step "Erkannt: openSUSE System"
        sudo zypper install -y fuse
        print_success "FUSE wurde installiert"
        return 0
        
    else
        print_error "Unbekannter Paketmanager!"
        print_warning "Bitte installiere FUSE manuell:"
        echo ""
        echo "  Debian/Ubuntu:  sudo apt install libfuse2"
        echo "  Fedora:         sudo dnf install fuse fuse-libs"
        echo "  Arch:           sudo pacman -S fuse2"
        echo "  openSUSE:       sudo zypper install fuse"
        echo ""
        return 1
    fi
}

# Handle FUSE-Abhängigkeit
handle_fuse_dependency() {
    if check_fuse; then
        return 0
    fi
    
    echo ""
    print_warning "FUSE ist nicht installiert!"
    echo ""
    echo -e "  ${BOLD}FUSE (Filesystem in Userspace)${NC} wird benötigt, um"
    echo "  AppImages direkt auszuführen."
    echo ""
    
    # Frage nach automatischer Installation
    if ask_yes_no "  Möchtest du FUSE jetzt automatisch installieren?" "y"; then
        echo ""
        if install_fuse; then
            return 0
        fi
    fi
    
    echo ""
    print_warning "FUSE wurde nicht installiert."
    echo ""
    
    # Biete Alternative an
    echo -e "  ${BOLD}Alternative:${NC} Das AppImage kann auch extrahiert werden,"
    echo "  sodass es ohne FUSE funktioniert."
    echo ""
    
    if ask_yes_no "  Möchtest du das AppImage extrahiert installieren?" "y"; then
        INSTALL_MODE="extracted"
        print_step "Installation wird im extrahierten Modus fortgesetzt..."
        return 0
    fi
    
    echo ""
    print_error "Installation abgebrochen."
    print_error "FUSE wird für AppImages benötigt."
    echo ""
    echo "  Installiere FUSE manuell:"
    echo "    sudo apt install libfuse2"
    echo ""
    echo "  Und führe dann das Script erneut aus."
    exit 1
}

# Erstelle notwendige Verzeichnisse
create_directories() {
    print_step "Erstelle Verzeichnisse..."
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$APPLICATIONS_DIR"
    mkdir -p "$ICONS_DIR"
    
    if [ "$INSTALL_MODE" = "extracted" ]; then
        mkdir -p "$EXTRACTED_DIR"
    fi
}

# Lade AppImage herunter
download_appimage() {
    local target_path
    
    if [ "$INSTALL_MODE" = "extracted" ]; then
        target_path="/tmp/coremail-desktop.AppImage"
    else
        target_path="${INSTALL_DIR}/${BINARY_NAME}"
    fi
    
    print_step "Lade CoreMail Desktop v${VERSION} herunter..."
    print_step "(Dies kann einige Minuten dauern - ~130 MB)"
    
    if [ "$DOWNLOADER" = "curl" ]; then
        curl -fSL --progress-bar -o "$target_path" "$DOWNLOAD_URL"
    else
        wget --show-progress -q -O "$target_path" "$DOWNLOAD_URL"
    fi
    
    if [ $? -ne 0 ]; then
        print_error "Download fehlgeschlagen!"
        print_error "Stelle sicher, dass GitHub Release v${VERSION} existiert."
        exit 1
    fi
    
    chmod +x "$target_path"
    
    # Speichere Pfad für spätere Verwendung
    DOWNLOADED_APPIMAGE="$target_path"
}

# Extrahiere AppImage (ohne FUSE)
extract_appimage() {
    print_step "Extrahiere AppImage (dies dauert einen Moment)..."
    
    # Wechsle ins Zielverzeichnis
    cd "$EXTRACTED_DIR"
    
    # Extrahiere mit --appimage-extract
    # Dies funktioniert ohne FUSE
    "$DOWNLOADED_APPIMAGE" --appimage-extract > /dev/null 2>&1
    
    if [ $? -ne 0 ]; then
        print_error "Extraktion fehlgeschlagen!"
        exit 1
    fi
    
    # Verschiebe squashfs-root nach coremail
    if [ -d "squashfs-root" ]; then
        rm -rf "coremail-app" 2>/dev/null || true
        mv "squashfs-root" "coremail-app"
    fi
    
    # Lösche temporäres AppImage
    rm -f "$DOWNLOADED_APPIMAGE"
    
    print_success "AppImage wurde extrahiert nach ${EXTRACTED_DIR}/coremail-app"
}

# Erstelle Wrapper-Script für extrahiertes AppImage
create_wrapper_script() {
    print_step "Erstelle Wrapper-Script..."
    
    cat > "${INSTALL_DIR}/${BINARY_NAME}" << 'EOF'
#!/bin/bash
# CoreMail Desktop Wrapper Script
# Startet die extrahierte AppImage-Version

EXTRACTED_APP="$HOME/.local/share/coremail/coremail-app"

if [ -f "$EXTRACTED_APP/AppRun" ]; then
    exec "$EXTRACTED_APP/AppRun" "$@"
elif [ -f "$EXTRACTED_APP/coremail-desktop" ]; then
    exec "$EXTRACTED_APP/coremail-desktop" "$@"
else
    echo "Fehler: CoreMail Desktop nicht gefunden!"
    echo "Erwartet in: $EXTRACTED_APP"
    exit 1
fi
EOF
    
    chmod +x "${INSTALL_DIR}/${BINARY_NAME}"
}

# Mache ausführbar (nur für AppImage-Modus)
make_executable() {
    if [ "$INSTALL_MODE" = "appimage" ]; then
        print_step "Mache ausführbar..."
        chmod +x "${INSTALL_DIR}/${BINARY_NAME}"
    fi
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
    
    if [ "$INSTALL_MODE" = "extracted" ]; then
        echo -e "  ${YELLOW}Hinweis:${NC} Extrahierte Installation (ohne FUSE)"
    fi
    echo ""
    echo "  Starten:"
    echo -e "    ${CYAN}coremail-desktop${NC}           (im Terminal)"
    echo -e "    ${CYAN}CoreMail Desktop${NC}          (im App-Menü)"
    echo ""
    echo "  Installationsort:"
    if [ "$INSTALL_MODE" = "extracted" ]; then
        echo -e "    ${CYAN}${EXTRACTED_DIR}/coremail-app${NC}"
    else
        echo -e "    ${CYAN}${INSTALL_DIR}/${BINARY_NAME}${NC}"
    fi
    echo ""
    echo "  Deinstallieren:"
    echo -e "    ${CYAN}curl -sSL https://suremail.vercel.app/uninstall.sh | bash${NC}"
    echo ""
}

# Hauptfunktion
main() {
    print_banner
    check_downloader
    handle_fuse_dependency
    create_directories
    download_appimage
    
    if [ "$INSTALL_MODE" = "extracted" ]; then
        extract_appimage
        create_wrapper_script
    else
        make_executable
    fi
    
    download_icon
    create_desktop_entry
    setup_path
    print_success_message
}

main
