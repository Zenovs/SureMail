# 📧 CoreMail Desktop

## 📥 Download & Installation

**Aktuelle Version: v2.2.3**

### 🚀 Schnell-Installation (Eine Zeile)

```bash
wget --no-check-certificate https://github.com/Zenovs/coremail/releases/download/v2.2.3/CoreMail.Desktop-2.2.3.AppImage -O ~/.local/bin/coremail-desktop && chmod +x ~/.local/bin/coremail-desktop && mkdir -p ~/.local/share/icons/hicolor/{16x16,32x32,64x64,128x128,256x256,512x512}/apps ~/.local/share/pixmaps ~/.local/share/applications && wget -q https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/icons/icon-16.png -O ~/.local/share/icons/hicolor/16x16/apps/coremail.png && wget -q https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/icons/icon-32.png -O ~/.local/share/icons/hicolor/32x32/apps/coremail.png && wget -q https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/icons/icon-64.png -O ~/.local/share/icons/hicolor/64x64/apps/coremail.png && wget -q https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/icons/icon-128.png -O ~/.local/share/icons/hicolor/128x128/apps/coremail.png && wget -q https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/icons/icon-256.png -O ~/.local/share/icons/hicolor/256x256/apps/coremail.png && wget -q https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/icons/icon-512.png -O ~/.local/share/icons/hicolor/512x512/apps/coremail.png && wget -q https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/icons/icon-512.png -O ~/.local/share/pixmaps/coremail.png && cat > ~/.local/share/icons/hicolor/index.theme << 'EOF'
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
cat > ~/.local/share/applications/coremail.desktop << 'EOF'
[Desktop Entry]
Version=1.0
Type=Application
Name=CoreMail Desktop
Comment=E-Mail Client für Linux
Exec=/home/$USER/.local/bin/coremail-desktop --no-sandbox
Icon=coremail
Terminal=false
Categories=Network;Email;Office;
StartupNotify=true
Keywords=email;mail;imap;smtp;
EOF
chmod +x ~/.local/share/applications/coremail.desktop && gtk-update-icon-cache -f ~/.local/share/icons/hicolor 2>/dev/null && update-desktop-database ~/.local/share/applications 2>/dev/null && ~/.local/bin/coremail-desktop --no-sandbox
```

### 📦 Direkter Download

**[⬇️ CoreMail Desktop v2.2.3 herunterladen](https://github.com/Zenovs/coremail/releases/download/v2.2.3/CoreMail.Desktop-2.2.3.AppImage)** (141 MB)

### 🗑️ Deinstallation

```bash
pkill -9 -f coremail ; pkill -9 -f CoreMail ; sleep 1 ; rm -rf ~/.local/bin/coremail* ~/.local/bin/CoreMail* ~/.local/share/applications/coremail* ~/.local/share/applications/CoreMail* ~/.local/share/icons/hicolor/*/apps/coremail* ~/.local/share/icons/hicolor/*/apps/CoreMail* ~/.local/share/icons/hicolor/index.theme ~/.local/share/pixmaps/coremail* ~/.local/share/pixmaps/CoreMail* ~/.config/coremail* ~/.config/CoreMail* /usr/share/applications/coremail* /usr/share/applications/CoreMail* 2>/dev/null ; gtk-update-icon-cache -f ~/.local/share/icons/hicolor 2>/dev/null ; update-desktop-database ~/.local/share/applications 2>/dev/null ; echo "✅ CoreMail wurde komplett entfernt!"
```

---

Ein schlanker, moderner **E-Mail-Client für Linux** – einfach zu bedienen, lokal und sicher.

<p align="center">
  <img src="assets/icon.png" width="128" height="128" alt="CoreMail Desktop">
</p>

---

## 📥 Download

### AppImage (empfohlen)

```bash
# Direkt herunterladen und starten
curl -sSL https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/install.sh | bash
```

Oder manuell: **[CoreMail.Desktop-2.3.1.AppImage](https://github.com/Zenovs/coremail/releases)**

```bash
chmod +x CoreMail.Desktop-2.3.1.AppImage
./CoreMail.Desktop-2.3.1.AppImage
```

---

## ✨ Was kann CoreMail?

### 📬 E-Mail verwalten
- **Mehrere Konten** – Gmail, Outlook, Yahoo, GMX, WEB.DE, iCloud und mehr
- **Server-Vorlagen** – Schnelle Einrichtung mit vordefinierten Einstellungen
- **Kategorien** – Organisiere Konten nach Arbeit, Privat, etc.
- **Anzeigename** – Eigenen Absendernamen pro Konto festlegen

### 🛡️ Spam-Filter
- Automatische Erkennung von Spam, Werbung und Phishing
- Farbige Tags direkt in der E-Mail-Liste
- Whitelist & Blacklist

### 🔍 Globale Suche
- Alle Konten gleichzeitig durchsuchen
- Tastenkürzel: `Ctrl+K` oder `Cmd+K`
- Filter nach Datum, Anhängen, gelesen/ungelesen

### 🤖 KI-Assistent (optional)
- Lokale KI mit Ollama – keine Cloud, keine Daten raus
- E-Mails zusammenfassen
- Antwortvorschläge generieren

### 🎨 7 Themes mit dynamischen Icons
Dark, Light, Minimal, Morphismus, Glas, Retro, Foundations
- **Dynamische Icons**: Das App-Icon passt sich automatisch an das gewählte Theme an

### 📊 Dashboard
- Anpassbare Widgets für Statistiken und Schnellaktionen
- Drag & Drop

### 🔄 Auto-Update
- Prüft automatisch auf neue Versionen
- Ein-Klick-Update direkt im Client

---

## 🔧 Systemanforderungen

| | |
|---|---|
| **Betriebssystem** | Linux (x64) |
| **Speicher** | ~200 MB |
| **KI-Features** | Ollama + 4 GB RAM (optional) |

---

## 🔒 Datenschutz

| | |
|---|---|
| ✅ | Alle Daten bleiben **lokal** auf deinem Computer |
| ✅ | **Keine Cloud**, keine Telemetrie |
| ✅ | **Open Source** |
| ✅ | Verbindet sich nur zu deinen E-Mail-Servern |

---

## 📧 Unterstützte Anbieter

| Anbieter | App-Passwort nötig? |
|----------|---------------------|
| Gmail | ✅ Ja |
| Microsoft 365 / Outlook | ✅ Ja |
| iCloud | ✅ Ja |
| Yahoo | ✅ Ja |
| GMX | ❌ Nein |
| WEB.DE | ❌ Nein |
| IONOS / 1&1 | ❌ Nein |
| Jeder IMAP/SMTP Server | – |

---

## 🛠️ Aus Quellcode bauen

```bash
git clone https://github.com/Zenovs/coremail.git
cd coremail
npm install
npm run dev      # Entwicklung
npm run build    # AppImage erstellen
```

---

## 📜 Lizenz

MIT License

---

**CoreMail Desktop** – Dein E-Mail-Client für Linux 📧
