#!/bin/bash

# CoreMail Desktop Installer v1.11.2
# Installiert CoreMail Desktop als AppImage mit Desktop-Integration
# Inklusive verbesserter Ollama KI-Integration mit robuster Fehlerbehandlung
# v1.11.2: GitHub-Hosting, keine Vercel-Abhängigkeit mehr

set -e

VERSION="1.11.2"
APP_NAME="CoreMail Desktop"
APPIMAGE_NAME="CoreMail.Desktop-${VERSION}.AppImage"
INSTALL_DIR="$HOME/.local/share/coremail"
DESKTOP_FILE="$HOME/.local/share/applications/coremail.desktop"
ICON_DIR="$HOME/.local/share/icons"
ICON_DIR_HICOLOR="$HOME/.local/share/icons/hicolor"
ICON_FILE="$ICON_DIR/coremail.png"
LOG_FILE="/tmp/coremail-install.log"

# ============ LOGGING FUNKTIONEN ============

log() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
    echo "$message" | tee -a "$LOG_FILE"
}

log_success() {
    log "✅ $1"
}

log_warning() {
    log "⚠️  $1"
}

log_error() {
    log "❌ $1"
}

log_info() {
    log "ℹ️  $1"
}

# ============ HILFSFUNKTIONEN ============

check_curl() {
    if ! command -v curl &> /dev/null; then
        log_error "curl ist nicht installiert!"
        log_info "Bitte installiere curl mit: sudo apt install curl"
        return 1
    fi
    log_success "curl ist verfügbar"
    return 0
}

check_internet() {
    log_info "Prüfe Internet-Verbindung..."
    if curl -s --connect-timeout 5 https://ollama.com > /dev/null 2>&1; then
        log_success "Internet-Verbindung vorhanden"
        return 0
    else
        log_warning "Keine Internet-Verbindung zu ollama.com"
        return 1
    fi
}

verify_ollama_installation() {
    # Warte kurz, damit sich alles initialisiert
    sleep 2
    
    if command -v ollama &> /dev/null; then
        local version=$(ollama --version 2>/dev/null || echo "unbekannt")
        log_success "Ollama ist installiert (Version: $version)"
        return 0
    else
        log_error "Ollama wurde nicht korrekt installiert"
        return 1
    fi
}

# ============ BEGINN INSTALLATION ============

# Initialisiere Log-Datei
echo "============================================" > "$LOG_FILE"
echo "CoreMail Desktop v${VERSION} Installation" >> "$LOG_FILE"
echo "Gestartet: $(date)" >> "$LOG_FILE"
echo "============================================" >> "$LOG_FILE"

echo ""
echo "🚀 CoreMail Desktop v${VERSION} Installer"
echo "==========================================="
echo "📋 Log-Datei: $LOG_FILE"
echo ""

log "Installation gestartet"

# Erstelle Verzeichnisse
log_info "Erstelle Verzeichnisse..."
mkdir -p "$INSTALL_DIR"
mkdir -p "$ICON_DIR"
mkdir -p "$(dirname "$DESKTOP_FILE")"
log_success "Verzeichnisse erstellt"

# Prüfe ob AppImage existiert
log_info "Suche AppImage..."
if [ -f "$APPIMAGE_NAME" ]; then
    log_success "AppImage gefunden: $APPIMAGE_NAME"
elif [ -f "dist/$APPIMAGE_NAME" ]; then
    APPIMAGE_NAME="dist/$APPIMAGE_NAME"
    log_success "AppImage gefunden: $APPIMAGE_NAME"
else
    log_error "Fehler: $APPIMAGE_NAME nicht gefunden!"
    log_info "Bitte zuerst mit 'npm run build' erstellen."
    exit 1
fi

# Kopiere AppImage
log_info "Kopiere AppImage nach $INSTALL_DIR..."
cp "$APPIMAGE_NAME" "$INSTALL_DIR/"
chmod +x "$INSTALL_DIR/$(basename $APPIMAGE_NAME)"
log_success "AppImage installiert"

# Installiere Icons in verschiedenen Größen (v1.9.0)
log_info "Installiere Icons..."

# Erstelle hicolor Icon-Verzeichnisse
for size in 16 32 64 128 256 512; do
    mkdir -p "$ICON_DIR_HICOLOR/${size}x${size}/apps"
done

# Kopiere Icons in verschiedenen Größen
if [ -f "assets/icon.png" ]; then
    cp "assets/icon.png" "$ICON_FILE"
    log_success "Haupt-Icon kopiert"
fi

# Installiere alle Größen in hicolor
if [ -f "assets/coremail-icon-16.png" ]; then
    cp "assets/coremail-icon-16.png" "$ICON_DIR_HICOLOR/16x16/apps/coremail.png"
fi
if [ -f "assets/coremail-icon-32.png" ]; then
    cp "assets/coremail-icon-32.png" "$ICON_DIR_HICOLOR/32x32/apps/coremail.png"
fi
if [ -f "assets/coremail-icon-64.png" ]; then
    cp "assets/coremail-icon-64.png" "$ICON_DIR_HICOLOR/64x64/apps/coremail.png"
fi
if [ -f "assets/coremail-icon-128.png" ]; then
    cp "assets/coremail-icon-128.png" "$ICON_DIR_HICOLOR/128x128/apps/coremail.png"
fi
if [ -f "assets/coremail-icon-256.png" ]; then
    cp "assets/coremail-icon-256.png" "$ICON_DIR_HICOLOR/256x256/apps/coremail.png"
fi
if [ -f "assets/coremail-icon-512.png" ]; then
    cp "assets/coremail-icon-512.png" "$ICON_DIR_HICOLOR/512x512/apps/coremail.png"
fi

# Kopiere auch SVG wenn vorhanden
if [ -f "assets/icon.svg" ]; then
    mkdir -p "$ICON_DIR_HICOLOR/scalable/apps"
    cp "assets/icon.svg" "$ICON_DIR_HICOLOR/scalable/apps/coremail.svg"
    log_success "SVG-Icon installiert"
fi

# Falls keine Icons gefunden, versuche aus AppImage zu extrahieren
if [ ! -f "$ICON_FILE" ]; then
    cd "$INSTALL_DIR"
    ./$(basename "$APPIMAGE_NAME") --appimage-extract usr/share/icons/hicolor/256x256/apps/*.png 2>/dev/null || true
    if [ -f "squashfs-root/usr/share/icons/hicolor/256x256/apps/"*.png ]; then
        cp "squashfs-root/usr/share/icons/hicolor/256x256/apps/"*.png "$ICON_FILE"
        rm -rf squashfs-root
        log_success "Icon aus AppImage extrahiert"
    else
        log_warning "Kein Icon gefunden, verwende Fallback"
    fi
    cd - > /dev/null
fi

log_success "Icons installiert"

# Update Icon-Cache
if command -v gtk-update-icon-cache &> /dev/null; then
    gtk-update-icon-cache -f "$ICON_DIR_HICOLOR" 2>/dev/null || true
    log_success "Icon-Cache aktualisiert"
fi

# Erstelle Desktop-Entry
log_info "Erstelle Desktop-Eintrag..."
cat > "$DESKTOP_FILE" << EOF
[Desktop Entry]
Name=CoreMail Desktop
Comment=Schlanker E-Mail-Client für Linux
Exec=$INSTALL_DIR/$(basename $APPIMAGE_NAME)
Icon=$ICON_FILE
Terminal=false
Type=Application
Categories=Network;Email;Office;
Keywords=email;mail;imap;smtp;
StartupWMClass=coremail-desktop
EOF
log_success "Desktop-Eintrag erstellt"

# Update Desktop-Datenbank
log_info "Aktualisiere Desktop-Datenbank..."
if command -v update-desktop-database &> /dev/null; then
    update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
    log_success "Desktop-Datenbank aktualisiert"
fi

echo ""
log_success "CoreMail Desktop Installation abgeschlossen!"
echo ""
echo "📍 App installiert in: $INSTALL_DIR/$(basename $APPIMAGE_NAME)"
echo "📍 Icon installiert in: $ICON_FILE"
echo "📍 Desktop-Eintrag: $DESKTOP_FILE"
echo ""

# ============ OLLAMA KI-INTEGRATION (VERBESSERT) ============

echo ""
echo "💬 KI-Integration (Ollama)"
echo "=========================="
log "Starte Ollama-Integration"

install_ollama_automatic() {
    log_info "Versuche Ollama zu installieren..."
    
    # Prüfe Voraussetzungen
    if ! check_curl; then
        return 1
    fi
    
    if ! check_internet; then
        log_warning "Kann Ollama ohne Internet-Verbindung nicht installieren"
        return 1
    fi
    
    log_info "Lade Ollama-Installationsskript herunter..."
    
    # Versuche Installation
    local install_result=0
    
    # Prüfe ob sudo verfügbar/nötig ist
    if [ "$(id -u)" = "0" ]; then
        # Bereits root
        log_info "Installiere als root..."
        curl -fsSL https://ollama.com/install.sh | sh >> "$LOG_FILE" 2>&1 || install_result=$?
    else
        # Versuche mit sudo
        log_info "Installiere mit sudo (Passwort könnte benötigt werden)..."
        echo ""
        curl -fsSL https://ollama.com/install.sh | sudo sh >> "$LOG_FILE" 2>&1 || install_result=$?
    fi
    
    if [ $install_result -ne 0 ]; then
        log_error "Ollama-Installation fehlgeschlagen (Exit-Code: $install_result)"
        log_info "Mögliche Ursachen:"
        log_info "  - Keine sudo-Berechtigung"
        log_info "  - Firewall blockiert Download"
        log_info "  - Nicht unterstütztes System"
        echo ""
        echo "📋 Manuelle Installation:"
        echo "   curl -fsSL https://ollama.com/install.sh | sh"
        echo ""
        return 1
    fi
    
    # Verifiziere Installation
    if verify_ollama_installation; then
        log_success "Ollama erfolgreich installiert!"
        return 0
    else
        log_error "Ollama-Installation konnte nicht verifiziert werden"
        return 1
    fi
}

start_ollama_service() {
    log_info "Starte Ollama Service..."
    
    # Prüfe ob Ollama verfügbar
    if ! command -v ollama &> /dev/null; then
        log_error "Ollama nicht gefunden - kann Service nicht starten"
        return 1
    fi
    
    # Prüfe ob Service bereits läuft
    if pgrep -x "ollama" > /dev/null 2>&1; then
        log_success "Ollama Service läuft bereits"
        return 0
    fi
    
    # Prüfe ob systemd Service existiert
    if systemctl list-unit-files ollama.service &>/dev/null 2>&1; then
        log_info "Versuche systemd Service zu starten..."
        if sudo systemctl start ollama 2>/dev/null; then
            sleep 2
            if pgrep -x "ollama" > /dev/null 2>&1; then
                log_success "Ollama Service über systemd gestartet"
                return 0
            fi
        fi
    fi
    
    # Fallback: Manuell starten
    log_info "Starte Ollama manuell im Hintergrund..."
    nohup ollama serve >> "$LOG_FILE" 2>&1 &
    
    # Warte und prüfe
    local max_attempts=10
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        sleep 1
        if pgrep -x "ollama" > /dev/null 2>&1; then
            log_success "Ollama Service gestartet"
            return 0
        fi
        attempt=$((attempt + 1))
    done
    
    log_warning "Konnte Ollama Service nicht starten"
    log_info "Versuche 'ollama serve' manuell auszuführen"
    return 1
}

download_default_model() {
    log_info "Lade Standard-Modell (llama3.2:1b, ~1.3GB)..."
    echo "   Dies kann einige Minuten dauern..."
    
    # Prüfe ob Ollama läuft
    if ! pgrep -x "ollama" > /dev/null 2>&1; then
        log_warning "Ollama Service läuft nicht - starte ihn zuerst"
        start_ollama_service
        sleep 2
    fi
    
    # Versuche Modell herunterzuladen
    local pull_result=0
    ollama pull llama3.2:1b 2>&1 | tee -a "$LOG_FILE" || pull_result=$?
    
    if [ $pull_result -ne 0 ]; then
        log_warning "Modell-Download fehlgeschlagen"
        log_info "Du kannst es später in CoreMail unter Einstellungen → KI-Assistent herunterladen"
        return 1
    fi
    
    # Verifiziere Download
    if ollama list 2>/dev/null | grep -q "llama3.2:1b"; then
        log_success "KI-Modell erfolgreich installiert!"
        return 0
    else
        log_warning "Modell wurde heruntergeladen, aber konnte nicht verifiziert werden"
        return 1
    fi
}

# ============ HAUPTLOGIK FÜR OLLAMA-INSTALLATION ============

log_info "Prüfe Ollama-Installation..."

if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "unbekannt")
    log_success "Ollama ist bereits installiert (Version: $OLLAMA_VERSION)"
    
    # Starte Service falls nicht läuft
    start_ollama_service
    
    # Prüfe ob Standard-Modell vorhanden
    log_info "Prüfe installierte Modelle..."
    if ollama list 2>/dev/null | grep -q "llama3.2:1b"; then
        log_success "Standard-Modell (llama3.2:1b) ist installiert"
    else
        log_info "Standard-Modell nicht gefunden"
        download_default_model
    fi
else
    log_info "Ollama ist nicht installiert"
    echo ""
    echo "   Ollama ermöglicht lokale KI-Funktionen in CoreMail:"
    echo "   • E-Mails zusammenfassen"
    echo "   • Antworten vorschlagen"
    echo "   • Texte verbessern"
    echo ""
    
    # Automatische Installation versuchen
    if install_ollama_automatic; then
        start_ollama_service
        download_default_model
    else
        echo ""
        log_warning "CoreMail funktioniert trotzdem, aber ohne KI-Features"
        echo ""
        echo "💡 Ollama manuell installieren:"
        echo "   curl -fsSL https://ollama.com/install.sh | sh"
        echo ""
        echo "   Nach der Installation:"
        echo "   ollama serve &"
        echo "   ollama pull llama3.2:1b"
        echo ""
    fi
fi

# ============ ABSCHLUSS ============

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🎉 CoreMail Desktop Installation abgeschlossen!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🚀 CoreMail kann jetzt gestartet werden:"
echo "   • Über das Anwendungsmenü"
echo "   • Oder direkt mit: $INSTALL_DIR/$(basename $APPIMAGE_NAME)"
echo ""
echo "💡 Tipps für die KI-Integration:"
echo "   • Ollama startet automatisch mit: ollama serve"
echo "   • Verwalte Modelle in CoreMail unter Einstellungen → KI-Assistent"
echo ""
echo "📋 Installation-Log: $LOG_FILE"
echo ""

log "Installation beendet"
