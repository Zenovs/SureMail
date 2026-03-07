# 📧 CoreMail Desktop v1.0

Ein minimaler, sicherer E-Mail-Client für Linux/Ubuntu mit Darknet-Design.

![CoreMail Desktop](https://img.shields.io/badge/Version-1.0.0-cyan)
![Electron](https://img.shields.io/badge/Electron-28.x-blue)
![React](https://img.shields.io/badge/React-18.x-61dafb)

## ✨ Features

- **📥 Posteingang**: E-Mails anzeigen, sortiert nach Datum
- **📖 E-Mails lesen**: HTML und Plain-Text, mit Anhängen
- **✉️ E-Mails senden**: Neue E-Mails verfassen und versenden
- **⚙️ IMAP/SMTP-Konfiguration**: Sichere, verschlüsselte Speicherung
- **🎨 Darknet-Design**: Schwarzer Hintergrund, Cyan-Akzente, JetBrains Mono

## 🛠️ Technologie-Stack

- **Electron** - Desktop-Framework
- **React** - UI-Framework
- **Tailwind CSS** - Styling
- **imap-simple** - IMAP-Bibliothek
- **Nodemailer** - SMTP/E-Mail-Versand
- **electron-store** - Verschlüsselte lokale Speicherung

## 📦 Installation

### AppImage (Empfohlen für Endnutzer)

1. **AppImage herunterladen:**
   ```
   CoreMail Desktop-1.0.0.AppImage
   ```

2. **Ausführbar machen:**
   ```bash
   chmod +x "CoreMail Desktop-1.0.0.AppImage"
   ```

3. **Starten:**
   ```bash
   ./"CoreMail Desktop-1.0.0.AppImage"
   ```

> 💡 **Tipp:** Das AppImage ist eigenständig - keine Installation erforderlich!

### Systemanforderungen

| Anforderung | Minimum |
|-------------|---------|
| **OS** | Ubuntu 20.04+ / Debian 11+ / Fedora 35+ |
| **Architektur** | x86_64 (64-bit) |
| **RAM** | 512 MB |
| **Speicher** | 200 MB |
| **GLIBC** | 2.31+ |

### Development Setup (Für Entwickler)

```bash
# Repository klonen / In Projektordner wechseln
cd /home/ubuntu/coremail-desktop

# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev
```

### Produktion Build

```bash
# React Build erstellen und Electron packen
npm run build

# Nur Electron packen (ohne AppImage)
npm run pack

# AppImage/DEB erstellen
npm run dist
```

## 🚀 Verwendung

### 1. IMAP/SMTP einrichten

Nach dem Start der App:
1. Gehe zu **Einstellungen** ⚙️
2. Gib deine IMAP-Daten ein (Host, Port, Username, Password)
3. Gib deine SMTP-Daten ein
4. Teste die Verbindungen
5. Speichere die Einstellungen

### Beispiel-Konfiguration (Gmail)

**IMAP:**
- Host: `imap.gmail.com`
- Port: `993`
- TLS: ✅

**SMTP:**
- Host: `smtp.gmail.com`
- Port: `465`
- SSL: ✅

> ⚠️ Für Gmail benötigst du ein [App-Passwort](https://support.google.com/accounts/answer/185833)

### 2. E-Mails empfangen

- Klicke auf **Posteingang** 📥
- E-Mails werden automatisch geladen
- Klicke auf eine E-Mail zum Lesen

### 3. E-Mails senden

- Klicke auf **Neue E-Mail** ✏️
- Fülle An, Betreff und Nachricht aus
- Klicke auf **Senden** 📨

## 📁 Projektstruktur

```
coremail-desktop/
├── main.js              # Electron Main Process
├── preload.js           # Preload Script (IPC Bridge)
├── package.json         # Dependencies & Scripts
├── tailwind.config.js   # Tailwind Konfiguration
├── public/
│   └── index.html       # HTML Template
├── src/
│   ├── App.js           # Haupt-App-Komponente
│   ├── index.js         # React Entry Point
│   ├── components/      # UI-Komponenten
│   │   ├── Sidebar.js
│   │   ├── EmailListItem.js
│   │   └── LoadingSpinner.js
│   ├── pages/           # Seiten-Komponenten
│   │   ├── Inbox.js
│   │   ├── EmailView.js
│   │   ├── ComposeEmail.js
│   │   └── Settings.js
│   └── styles/
│       └── index.css    # Tailwind + Custom Styles
└── assets/
    └── icon.png         # App Icon
```

## 🔒 Sicherheit

- **Verschlüsselte Speicherung**: IMAP/SMTP-Credentials werden mit `electron-store` verschlüsselt gespeichert
- **Context Isolation**: Electron's Context Isolation ist aktiviert
- **Keine Cloud**: Alle Daten bleiben lokal auf deinem Computer

## 🐛 Bekannte Einschränkungen (v1.0)

- Nur ein E-Mail-Konto unterstützt
- Keine Ordner-Navigation (nur INBOX)
- Keine Anhänge beim Senden
- Keine E-Mail-Suche

## 🔮 Geplante Features (v2.0+)

- [ ] Mehrere E-Mail-Konten
- [ ] Ordner-Navigation (Gesendet, Entwürfe, etc.)
- [ ] Anhänge beim Senden
- [ ] E-Mail-Suche
- [ ] Signatur-Unterstützung
- [ ] HTML-Editor für E-Mails

## 📄 Lizenz

MIT License - Frei verwendbar und anpassbar.

---

Made with 💙 by CoreMail Team
