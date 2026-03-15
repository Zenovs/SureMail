# CoreMail Desktop

**Einfacher, sicherer E-Mail-Client für Linux mit IMAP/SMTP-Unterstützung**

CoreMail Desktop ist ein moderner E-Mail-Client für Linux, der Wert auf Datenschutz, Einfachheit und Funktionalität legt. Alle Daten bleiben lokal auf deinem Gerät - keine Cloud, keine Datenübertragung.

---

## ✨ Features

### 📧 E-Mail-Verwaltung
- **Multi-Account-Support** - Verwalte mehrere E-Mail-Konten gleichzeitig
- **IMAP/SMTP** - Funktioniert mit allen IMAP/SMTP-Providern (Gmail, Yahoo, Outlook, etc.)
- **Anzeigename** - Lege individuellen Absendernamen pro Konto fest (z.B. "Dario Zenhäusern" <dario@bluewin.ch>)
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
   - Anzeigename (z.B. "Dario Zenhäusern")
   - E-Mail-Adresse
   - Passwort (oder App-Passwort)
   - IMAP/SMTP Server-Einstellungen

### Unterstützte Provider

- ✅ **Gmail** (mit App-Passwort)
- ✅ **Yahoo**
- ✅ **Outlook/Hotmail** (mit App-Passwort)
- ✅ **Alle anderen IMAP/SMTP-Provider**

### App-Passwort erstellen (Gmail/Outlook)

**Gmail:**
1. Gehe zu https://myaccount.google.com/security
2. Aktiviere "2-Step Verification"
3. Erstelle "App password"
4. Verwende das generierte Passwort in CoreMail

**Outlook:**
1. Gehe zu https://account.microsoft.com/security
2. Aktiviere "Two-step verification"
3. Erstelle "App password"
4. Verwende das generierte Passwort in CoreMail

---

## 🔧 Systemanforderungen

- **OS:** Ubuntu 20.04+ / Debian 11+ / Fedora 38+ / Linux Mint 21+
- **Architektur:** 64-bit Linux
- **RAM:** 2 GB
- **Speicher:** 200 MB

---

## 📋 Changelog

### v2.1.0 - Anzeigename für E-Mails
- ✅ Individueller Absendername pro Konto
- ✅ Beispiel: "Dario Zenhäusern" <dario@bluewin.ch>

### v2.0.0 - BREAKING CHANGE
- ❌ OAuth2/Microsoft-Integration entfernt
- ✅ Fokus auf IMAP/SMTP
- ✅ Einfacher, zuverlässiger Client

### v1.14.0 - Spam-Filter
- ✅ Intelligente Spam-Erkennung
- ✅ 4 Kategorien: Werbung, Spam, Schädlich, Virus

### v1.13.0 - Globale Suche
- ✅ Suche über alle Konten und Ordner
- ✅ Erweiterte Filter

---

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstelle einen Pull Request oder öffne ein Issue.

---

## 📄 Lizenz

MIT - Frei verwendbar für private und kommerzielle Projekte.

---

**Entwickelt mit ❤️ für Datenschutz und Einfachheit**

**Powered by wireon** 🚀
