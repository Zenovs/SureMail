#!/bin/bash

# CoreMail Desktop Installer
# Installiert CoreMail Desktop als AppImage mit Desktop-Integration
# Inklusive optionaler Ollama KI-Integration (v1.5.0+)

set -e

VERSION="1.5.0"
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

# ============ OLLAMA KI-INTEGRATION (OPTIONAL) ============

echo ""
echo "🤖 KI-Integration (Ollama)"
echo "=========================="

# Prüfe ob Ollama bereits installiert ist
if command -v ollama &> /dev/null; then
    echo "✅ Ollama ist bereits installiert."
    OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "unbekannt")
    echo "   Version: $OLLAMA_VERSION"
else
    echo ""
    echo "📦 Ollama ist nicht installiert."
    echo "   Ollama ermöglicht lokale KI-Funktionen in CoreMail:"
    echo "   - E-Mails zusammenfassen"
    echo "   - Antworten vorschlagen"
    echo "   - Texte verbessern"
    echo ""
    read -p "🔧 Ollama jetzt installieren? (j/n): " install_ollama
    
    if [[ "$install_ollama" =~ ^[jJyY]$ ]]; then
        echo ""
        echo "⬇️ Installiere Ollama..."
        curl -fsSL https://ollama.com/install.sh | sh
        
        if command -v ollama &> /dev/null; then
            echo "✅ Ollama erfolgreich installiert!"
            
            # Starte Ollama Service
            echo "🚀 Starte Ollama Service..."
            ollama serve &>/dev/null &
            sleep 2
            
            # Installiere Standard-Modell
            echo ""
            read -p "📥 Kompaktes KI-Modell (llama3.2:1b, ~1.3GB) herunterladen? (j/n): " install_model
            
            if [[ "$install_model" =~ ^[jJyY]$ ]]; then
                echo "⬇️ Lade llama3.2:1b herunter (kann einige Minuten dauern)..."
                ollama pull llama3.2:1b
                echo "✅ Modell erfolgreich installiert!"
            fi
        else
            echo "❌ Ollama-Installation fehlgeschlagen."
        fi
    else
        echo "ℹ️  Ollama-Installation übersprungen."
        echo "   Du kannst Ollama später manuell installieren mit:"
        echo "   curl -fsSL https://ollama.com/install.sh | sh"
    fi
fi

echo ""
echo "🚀 CoreMail Desktop kann jetzt über das Anwendungsmenü gestartet werden."
echo "   Oder direkt mit: $INSTALL_DIR/$APPIMAGE_NAME"
echo ""
echo "💡 Tipps für die KI-Integration:"
echo "   - Starte Ollama mit: ollama serve"
echo "   - Lade ein Modell mit: ollama pull llama3.2:1b"
echo "   - Verwalte Modelle in CoreMail unter Einstellungen → KI-Assistent"
