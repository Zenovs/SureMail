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
VERSION="1.5.4"
APP_NAME="CoreMail Desktop"
BINARY_NAME="coremail-desktop"
INSTALL_DIR="$HOME/.local/bin"
APPLICATIONS_DIR="$HOME/.local/share/applications"
ICONS_DIR="$HOME/.local/share/icons"
EXTRACTED_DIR="$HOME/.local/share/coremail"
DOWNLOAD_URL="https://github.com/Zenovs/coremail/releases/download/v${VERSION}/CoreMail.Desktop-${VERSION}.AppImage"
ICON_URL="https://img.freepik.com/premium-vector/customer-service-representative-icon-with-phone-email-documents-other-communication-icons_150234-85805.jpg"
LOG_FILE="/tmp/coremail-install.log"

# Installationsmodus: appimage oder extracted
INSTALL_MODE="appimage"

# Ollama Installation (automatisch in v1.5.4+)
INSTALL_OLLAMA="true"

# ============ LOGGING FUNKTIONEN ============

log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$message" >> "$LOG_FILE"
}

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
    log "STEP: $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
    log "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
    log "WARNING: $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
    log "ERROR: $1"
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

# Automatische Ollama-Installation (v1.5.4+ mit verbessertem Logging)
show_ollama_info() {
    echo ""
    echo -e "${BOLD}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║  ${CYAN}🤖 v1.5.4: Robustere Ollama-Installation${NC}                  ${BOLD}║${NC}"
    echo -e "${BOLD}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  CoreMail Desktop v1.5.4 enthält ${BOLD}verbesserte KI-Integration${NC}:"
    echo -e "    • Robustere Ollama-Installation mit Logging"
    echo -e "    • Verbesserte Einstellungs-UI (breitere Leiste, Scrolling)"
    echo -e "    • KI-Chatbot Widget"
    echo -e "    • E-Mails zusammenfassen"
    echo -e "    • Antwort-Vorschläge generieren"
    echo -e "    • Texte verbessern"
    echo ""
    echo -e "  ${GREEN}✓ 100% lokal - Keine Cloud, keine Datenübertragung!${NC}"
    echo -e "  ${GREEN}✓ Deine E-Mails bleiben privat auf deinem Rechner.${NC}"
    echo -e "  ${GREEN}✓ Ollama wird automatisch installiert${NC}"
    echo ""
    echo -e "  📋 ${YELLOW}Installation-Log: ${LOG_FILE}${NC}"
    echo ""
}

# Installiere Ollama mit verbesserter Fehlerbehandlung
install_ollama() {
    if [ "$INSTALL_OLLAMA" != "true" ]; then
        return 0
    fi
    
    echo ""
    print_step "Installiere Ollama für lokale KI..."
    log "Starte Ollama-Installation"
    
    # Prüfe ob Ollama bereits installiert ist
    if command -v ollama &> /dev/null; then
        local version=$(ollama --version 2>/dev/null || echo "unbekannt")
        print_success "Ollama ist bereits installiert (Version: $version)!"
        log "Ollama bereits installiert: $version"
        OLLAMA_ALREADY_INSTALLED="true"
    else
        # Prüfe Internet-Verbindung
        print_step "Prüfe Internet-Verbindung..."
        if ! curl -s --connect-timeout 5 https://ollama.com > /dev/null 2>&1; then
            print_warning "Keine Verbindung zu ollama.com möglich"
            log "Internet-Verbindung zu ollama.com fehlgeschlagen"
            print_warning "Du kannst Ollama später manuell installieren:"
            echo -e "    ${CYAN}curl -fsSL https://ollama.com/install.sh | sh${NC}"
            return 1
        fi
        
        # Installiere Ollama
        print_step "Lade Ollama herunter und installiere..."
        log "Starte Ollama-Download"
        
        if curl -fsSL https://ollama.com/install.sh | sh >> "$LOG_FILE" 2>&1; then
            print_success "Ollama wurde erfolgreich installiert!"
            log "Ollama erfolgreich installiert"
        else
            print_error "Ollama-Installation fehlgeschlagen!"
            log "Ollama-Installation fehlgeschlagen"
            print_warning "Du kannst Ollama später manuell installieren:"
            echo -e "    ${CYAN}curl -fsSL https://ollama.com/install.sh | sh${NC}"
            echo ""
            echo -e "    ${YELLOW}Details siehe: ${LOG_FILE}${NC}"
            return 1
        fi
    fi
    
    # Starte Ollama Service falls nicht läuft
    print_step "Starte Ollama-Service..."
    if ! pgrep -x "ollama" > /dev/null; then
        nohup ollama serve >> "$LOG_FILE" 2>&1 &
        sleep 2
        log "Ollama Service gestartet"
    fi
    
    # Lade Standard-Modell herunter
    print_step "Lade KI-Modell herunter (llama3.2:1b - ca. 1.3 GB)..."
    print_step "(Dies kann einige Minuten dauern...)"
    log "Starte Modell-Download: llama3.2:1b"
    
    if ollama pull llama3.2:1b 2>&1 | tee -a "$LOG_FILE"; then
        print_success "KI-Modell 'llama3.2:1b' wurde erfolgreich heruntergeladen!"
        log "Modell llama3.2:1b erfolgreich heruntergeladen"
    else
        print_warning "Modell-Download fehlgeschlagen."
        log "Modell-Download fehlgeschlagen"
        print_warning "Du kannst es später manuell herunterladen:"
        echo -e "    ${CYAN}ollama pull llama3.2:1b${NC}"
    fi
    
    echo ""
    print_success "Ollama ist bereit für CoreMail Desktop!"
    echo ""
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
    
    if [ "$INSTALL_OLLAMA" = "true" ]; then
        echo ""
        echo -e "  ${CYAN}🤖 KI-Funktionen:${NC}"
        echo -e "    • Ollama ist installiert und bereit"
        echo -e "    • KI-Modell: llama3.2:1b"
        echo -e "    • ${GREEN}100% lokal – deine Daten bleiben privat!${NC}"
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
    echo "  📋 Installation-Log:"
    echo -e "    ${CYAN}${LOG_FILE}${NC}"
    echo ""
    echo "  Deinstallieren:"
    echo -e "    ${CYAN}curl -sSL https://suremail.vercel.app/uninstall.sh | bash${NC}"
    echo ""
}

# Hauptfunktion
main() {
    # Initialisiere Log-Datei
    echo "============================================" > "$LOG_FILE"
    echo "CoreMail Desktop v${VERSION} Installation" >> "$LOG_FILE"
    echo "Gestartet: $(date)" >> "$LOG_FILE"
    echo "============================================" >> "$LOG_FILE"
    
    print_banner
    check_downloader
    show_ollama_info
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
    install_ollama
    setup_path
    print_success_message
    
    log "Installation abgeschlossen"
}

main
