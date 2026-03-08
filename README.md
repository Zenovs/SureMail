# 📧 CoreMail Desktop v1.1

Ein moderner, schlanker Desktop-E-Mail-Client für Linux mit Multi-Account-Unterstützung.

![CoreMail](https://img.shields.io/badge/version-1.1.0-cyan)
![Electron](https://img.shields.io/badge/electron-28.x-blue)
![Platform](https://img.shields.io/badge/platform-Linux-green)

## ✨ Features v1.1

### 🆕 Neu in v1.1
- **Mehrere E-Mail-Konten** - Unbegrenzte IMAP/SMTP-Konten verwalten
- **Kategorien/Gruppen** - Konten organisieren (Arbeit, Privat, Sonstiges, eigene...)
- **Dashboard** - Übersicht über alle Konten mit Statistiken
- **Split-View Inbox** - E-Mail-Liste und Vorschau nebeneinander
- **3 Themes** - Dark, Light, Minimal
- **Verbesserte Sidebar** - Mit Kategorien und Konten-Übersicht

### 📬 Basis-Features
- IMAP E-Mail-Empfang
- SMTP E-Mail-Versand
- E-Mail-Vorschau und Vollansicht
- Anhänge anzeigen und herunterladen
- Verschlüsselte Passwortspeicherung

## 🖥️ Systemanforderungen

| Komponente | Anforderung |
|------------|-------------|
| OS | Ubuntu 20.04+, Debian 11+, Fedora 35+ |
| Architektur | x86_64 (64-bit) |
| RAM | Mindestens 512 MB |
| Speicher | 200 MB |

## 📦 Installation

### AppImage (empfohlen)
```bash
# Download der AppImage-Datei
chmod +x CoreMail-Desktop-1.1.0.AppImage
./CoreMail-Desktop-1.1.0.AppImage
```

### Aus Quellcode
```bash
git clone https://github.com/your-repo/coremail-desktop.git
cd coremail-desktop
npm install
npm run build
```

## 🎨 Themes

| Theme | Beschreibung |
|-------|--------------|
| **Dark** | Dunkles Design mit Cyan-Akzenten (Standard) |
| **Light** | Helles Design mit blauen Akzenten |
| **Minimal** | Schwarz/Weiß, reduziert und fokussiert |

Theme wechseln: Einstellungen → Design

## ⌨️ Tastenkürzel

| Kürzel | Aktion |
|--------|--------|
| `↑` / `↓` | E-Mail-Navigation in der Liste |
| `Enter` | E-Mail in Vollansicht öffnen |

## 🔧 Konto einrichten

1. **Konten** in der Sidebar öffnen
2. **+ Neues Konto** klicken
3. IMAP- und SMTP-Einstellungen eingeben
4. Verbindung testen
5. Speichern

### Gmail-Nutzer
- Aktiviere "Zugriff durch weniger sichere Apps" oder
- Erstelle ein [App-Passwort](https://myaccount.google.com/apppasswords)
- IMAP: `imap.gmail.com:993`
- SMTP: `smtp.gmail.com:465`

## 🔒 Sicherheit

- Passwörter werden mit AES-256 verschlüsselt gespeichert
- Lokale Speicherung (keine Cloud)
- TLS/SSL für alle Verbindungen

## 📁 Projektstruktur

```
coremail-desktop/
├── src/
│   ├── context/          # React Contexts (Theme, Accounts)
│   ├── components/       # UI-Komponenten
│   └── pages/            # Seiten (Dashboard, Inbox, etc.)
├── main.js               # Electron Main Process
├── preload.js            # IPC Bridge
└── tailwind.config.js    # Styling
```

## 🚀 Entwicklung

```bash
# Entwicklungsmodus
npm run dev

# Nur React starten
npm run react-start

# Build erstellen
npm run build
```

## 📝 Changelog

### v1.1.0 (März 2026)
- Multi-Account-Unterstützung
- Kategorien für Konten
- Dashboard mit Statistiken
- Split-View Inbox
- Theme-System (Dark/Light/Minimal)
- Verbesserte Sidebar

### v1.0.0
- Erste Version
- Basis IMAP/SMTP-Funktionalität
- Dunkles Design

## 📄 Lizenz

MIT License

---

**Made with ❤️ for Linux**
