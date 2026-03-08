#!/bin/bash

# CoreMail Desktop Installer
# Installiert CoreMail Desktop als AppImage mit Desktop-Integration
# Inklusive automatischer Ollama KI-Integration (v1.5.3+)

set -e

VERSION="1.5.3"
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
echo "✅ CoreMail Desktop Installation abgeschlossen!"
echo ""
echo "📍 App installiert in: $INSTALL_DIR/$APPIMAGE_NAME"
echo "📍 Icon installiert in: $ICON_FILE"
echo "📍 Desktop-Eintrag: $DESKTOP_FILE"
echo ""

# ============ OLLAMA KI-INTEGRATION (AUTOMATISCH) ============

echo ""
echo "💬 KI-Integration (Ollama)"
echo "=========================="

install_ollama_automatic() {
    echo "⬇️  Installiere Ollama..."
    
    if curl -fsSL https://ollama.com/install.sh | sh; then
        echo "✅ Ollama erfolgreich installiert!"
        return 0
    else
        echo "⚠️  Ollama-Installation fehlgeschlagen."
        echo "   CoreMail funktioniert trotzdem, aber ohne KI-Features."
        echo "   Du kannst Ollama später manuell installieren mit:"
        echo "   curl -fsSL https://ollama.com/install.sh | sh"
        return 1
    fi
}

start_ollama_service() {
    echo "🚀 Starte Ollama Service..."
    
    # Prüfe ob Service bereits läuft
    if pgrep -x "ollama" > /dev/null; then
        echo "   Ollama Service läuft bereits."
        return 0
    fi
    
    # Starte im Hintergrund
    nohup ollama serve &>/dev/null &
    sleep 3
    
    # Prüfe ob erfolgreich gestartet
    if pgrep -x "ollama" > /dev/null; then
        echo "   Ollama Service gestartet."
        return 0
    else
        echo "   Konnte Ollama Service nicht starten."
        return 1
    fi
}

download_default_model() {
    echo "📥 Lade Standard-Modell (llama3.2:1b, ~1.3GB)..."
    echo "   Dies kann einige Minuten dauern..."
    
    if ollama pull llama3.2:1b 2>&1; then
        echo "✅ KI-Modell erfolgreich installiert!"
        return 0
    else
        echo "⚠️  Modell-Download fehlgeschlagen."
        echo "   Du kannst es später in CoreMail unter Einstellungen → KI-Assistent herunterladen."
        return 1
    fi
}

# Hauptlogik für Ollama-Installation
echo "🔍 Prüfe Ollama-Installation..."

if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "unbekannt")
    echo "✅ Ollama ist bereits installiert (Version: $OLLAMA_VERSION)"
    
    # Starte Service falls nicht läuft
    start_ollama_service
    
    # Prüfe ob Standard-Modell vorhanden
    echo "🔍 Prüfe installierte Modelle..."
    if ollama list 2>/dev/null | grep -q "llama3.2:1b"; then
        echo "✅ Standard-Modell (llama3.2:1b) ist installiert."
    else
        echo "📦 Standard-Modell nicht gefunden."
        download_default_model
    fi
else
    echo "📦 Ollama ist nicht installiert."
    echo ""
    echo "   Ollama ermöglicht lokale KI-Funktionen in CoreMail:"
    echo "   • E-Mails zusammenfassen"
    echo "   • Antworten vorschlagen"
    echo "   • Texte verbessern"
    echo ""
    
    # Automatische Installation
    if install_ollama_automatic; then
        start_ollama_service
        download_default_model
    fi
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "🎉 CoreMail Desktop Installation abgeschlossen!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🚀 CoreMail kann jetzt gestartet werden:"
echo "   • Über das Anwendungsmenü"
echo "   • Oder direkt mit: $INSTALL_DIR/$APPIMAGE_NAME"
echo ""
echo "💡 Tipps für die KI-Integration:"
echo "   • Ollama startet automatisch mit: ollama serve"
echo "   • Verwalte Modelle in CoreMail unter Einstellungen → KI-Assistent"
