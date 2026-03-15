# CoreMail Desktop

**Einfacher, sicherer E-Mail-Client für Linux mit IMAP/SMTP-Unterstützung**

CoreMail Desktop ist ein moderner E-Mail-Client für Linux, der Wert auf Datenschutz, Einfachheit und Funktionalität legt. Alle Daten bleiben lokal auf deinem Gerät - keine Cloud, keine Datenübertragung.

---

## ✨ Features

### 📧 E-Mail-Verwaltung
- **Multi-Account-Support** - Verwalte mehrere E-Mail-Konten gleichzeitig
- **IMAP/SMTP** - Funktioniert mit allen IMAP/SMTP-Providern (Gmail, Yahoo, Outlook, etc.)
- **Anzeigename** - Lege individuellen Absendernamen pro Konto fest (z.B. "Max Mustermann" <max@example.com>)
- **Ordner-Struktur** - Posteingang, Postausgang, Gesendete E-Mails, Entwürfe
- **Kategorien** - Organisiere E-Mails in eigenen Kategorien

### 🔍 Intelligente Funktionen
- **Globale Suche** - Durchsuche alle Konten und Ordner gleichzeitig
- **Spam-Filter** - Intelligente Erkennung von Werbung, Spam, schädlichen E-Mails und Viren
- **Lokale KI** - KI-Chatbot für E-Mail-Zusammenfassungen und Antwort-Vorschläge (100% lokal mit Ollama)

### 🎨 Benutzeroberfläche
- **7 Themes** - Dark, Light, Minimal, Morphismus, Glas, Retro, Foundations
- **Anpassbare Sidebar** - Breite, Auto-Collapse, Icons-Only Modus
- **Widget-Dashboard** - Drag & Drop Widgets für personalisierte Übersicht

### 🔄 Automatisierung
- **Auto-Update** - Updates direkt im Client installieren
- **Desktop-Benachrichtigungen** - Bei neuen E-Mails
- **E-Mail-Signaturen** - Rich-Text-Editor mit Vorlagen

### 🔒 Datenschutz
- **100% lokal** - Alle Daten bleiben auf deinem Gerät
- **Keine Cloud** - Keine Datenübertragung zu externen Servern
- **Verschlüsselte Speicherung** - Passwörter werden sicher gespeichert
- **Open Source** - Transparenter Code

---

## 🚀 Installation

### Quick Install (Eine Zeile)

**Mit wget:**
```bash
wget --no-check-certificate https://github.com/Zenovs/coremail/releases/download/v2.1.0/CoreMail.Desktop-2.1.0.AppImage -O ~/.local/bin/coremail-desktop && chmod +x ~/.local/bin/coremail-desktop && ~/.local/bin/coremail-desktop --no-sandbox
```

### Manuelle Installation

1. **Download AppImage:**
   ```bash
   wget --no-check-certificate https://github.com/Zenovs/coremail/releases/download/v2.1.0/CoreMail.Desktop-2.1.0.AppImage -O ~/.local/bin/coremail-desktop
   ```

2. **Ausführbar machen:**
   ```bash
   chmod +x ~/.local/bin/coremail-desktop
   ```

3. **Starten:**
   ```bash
   ~/.local/bin/coremail-desktop --no-sandbox
   ```

---

## 📖 Verwendung

### E-Mail-Konto hinzufügen

1. **Öffne CoreMail Desktop**
2. **Klicke auf "Konten verwalten"**
3. **Gib deine Daten ein:**
   - Konto-Name (z.B. "Privat")
   - Anzeigename (z.B. "Max Mustermann")
   - E-Mail-Adresse
   - Passwort (oder App-Passwort)
   - IMAP/SMTP Server-Einstellungen

### Unterstützte Provider

- ✅ **Gmail** (mit App-Passwort)
- ✅ **Yahoo**
- ✅ **Outlook/Hotmail** (mit App-Passwort)
- ✅ **Alle anderen IMAP/SMTP-Provider**

## 🔧 Systemanforderungen

- **OS:** Ubuntu 20.04+ / Debian 11+ / Fedora 38+ / Linux Mint 21+
- **Architektur:** 64-bit Linux
- **RAM:** 2 GB
- **Speicher:** 200 MB

---
