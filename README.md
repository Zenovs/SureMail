# 📧 CoreMail Desktop v2.0.0

Ein schlanker, benutzerfreundlicher **IMAP/SMTP E-Mail-Client** für Linux mit modernem Design, lokalem KI-Assistenten, intelligentem Spam-Filter, automatischen Updates, anpassbaren Kategorien, Google Fonts und professionellem UI/UX.

> **⚠️ v2.0.0 - BREAKING CHANGE**: OAuth2/Microsoft-Integration wurde entfernt. Dieser Client unterstützt nur noch **IMAP/SMTP** mit Passwort/App-Passwort-Authentifizierung.

## 🚀 Schnellinstallation

```bash
curl -sSL https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/install.sh | bash
```

oder

```bash
wget -qO- https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/install.sh | bash
```

## 🆕 v2.0.0 - Nur IMAP/SMTP (BREAKING CHANGE)

### ⚠️ Was wurde entfernt?
- **OAuth2-Authentifizierung** für Microsoft 365/Exchange
- **"Mit Microsoft anmelden" Button**
- **Azure AD App-Registrierung Support**
- **OAuth2-Token-Verwaltung**

### ✅ Was funktioniert weiterhin?
- **IMAP/SMTP** für alle Provider (Gmail, Outlook, Yahoo, GMX, etc.)
- **App-Passwort-Authentifizierung** für Microsoft, Gmail, iCloud
- **Alle anderen Features** (Spam-Filter, KI, Auto-Update, Themes, etc.)

### 💡 Warum diese Änderung?
| Grund | Beschreibung |
|-------|--------------|
| **Einfachheit** | IMAP/SMTP ist einfacher einzurichten |
| **Zuverlässigkeit** | Keine OAuth2-Token-Probleme |
| **Weniger Abhängigkeiten** | Keine Microsoft-API erforderlich |
| **Universell** | Funktioniert mit jedem IMAP/SMTP-Server |

### 📧 Unterstützte Provider
| Provider | IMAP Host | SMTP Host | App-Passwort? |
|----------|-----------|-----------|---------------|
| **Microsoft 365** | outlook.office365.com | smtp.office365.com | ✅ Erforderlich |
| **Gmail** | imap.gmail.com | smtp.gmail.com | ✅ Erforderlich |
| **iCloud** | imap.mail.me.com | smtp.mail.me.com | ✅ Erforderlich |
| **Yahoo** | imap.mail.yahoo.com | smtp.mail.yahoo.com | ✅ Erforderlich |
| **GMX** | imap.gmx.net | mail.gmx.net | ❌ Nicht nötig |
| **WEB.DE** | imap.web.de | smtp.web.de | ❌ Nicht nötig |
| **IONOS/1&1** | imap.ionos.de | smtp.ionos.de | ❌ Nicht nötig |

### 🔑 App-Passwort erstellen

**Für Microsoft:** [account.microsoft.com/security](https://account.microsoft.com/security)
**Für Gmail:** [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
**Für iCloud:** [appleid.apple.com](https://appleid.apple.com)
**Für Yahoo:** [login.yahoo.com/account/security](https://login.yahoo.com/account/security)

---

## 🔄 v1.16.0 - Automatische Updates

- **Automatische Update-Prüfung**: Prüft alle 24 Stunden auf neue Versionen
- **Ein-Klick-Update**: Download und Installation mit einem Klick
- **Backup-Funktion**: Automatisches Backup der alten Version
- **Keine Terminal-Befehle nötig**: Alles direkt im Client

---

## 🛡️ v1.14.0 - Intelligenter Spam-Filter

- **Automatische Erkennung**: E-Mails werden auf Spam, Werbung, Phishing analysiert
- **4 Kategorien**: 📢 Werbung, 🚫 Spam, ⚠️ Schädlich, 🦠 Virus
- **Tags in Mail-Liste**: Farbige Badges neben dem "Neu"-Badge
- **Einstellbar**: Empfindlichkeit, Whitelist, Blacklist

---

## 🔍 v1.13.0 - Globale Suchfunktion

- **Globale Suche**: Durchsuche alle E-Mail-Konten gleichzeitig
- **Schnellzugriff**: `Ctrl+K` oder `Cmd+K` öffnet die Suchleiste
- **Erweiterte Filter**: Konto, Ordner, Datum, Status, Anhänge

---

<p align="center">
  <img src="assets/icon.png" width="128" height="128" alt="CoreMail Desktop">
</p>

## ✨ Features

### 📬 E-Mail-Verwaltung (IMAP/SMTP)
- **Multi-Account-Support**: Verwalte mehrere E-Mail-Konten
- **Server-Vorlagen**: Gmail, Outlook, Yahoo, GMX, WEB.DE, IONOS
- **Kategorien**: Organisiere Konten (Arbeit, Privat, etc.)
- **Split-View**: E-Mail-Liste und Vorschau nebeneinander

### 🤖 Lokale KI-Integration
- **Ollama-Integration**: Lokale KI ohne Cloud-Abhängigkeit
- **E-Mails zusammenfassen**: Ein Klick für Zusammenfassungen
- **Antwort-Vorschläge**: KI hilft beim Verfassen
- **KI-Chatbot**: Schwebendes Widget für Fragen

### 🎨 7 Themes
- **Dark**: Klassisches dunkles Design mit Cyan-Akzenten
- **Light**: Helles, klassisches Design
- **Minimal**: Minimalistisch in Schwarz-Weiß
- **Morphismus**: Glasmorphismus-Effekte
- **Glas**: Transparente Glaseffekte
- **Retro**: 80er/90er Neon-Stil
- **Foundations**: Professionelles Design-System

### 📊 Widget-Dashboard
- **4 Widget-Typen**: Konto, Kategorie, Statistik, Schnellaktionen
- **Drag & Drop**: Widgets verschieben
- **3 Größen**: Klein, Mittel, Groß

### 🔔 Benachrichtigungen
- Desktop-Benachrichtigungen bei neuen E-Mails
- Konfigurierbar pro Konto und Kategorie

### 📎 Anhang-Verwaltung
- Bildvorschau direkt in der E-Mail
- PDF-Vorschau integriert
- Drag & Drop für Anhänge

### ✍️ E-Mail-Signaturen
- Rich-Text-Editor
- 6 Vorlagen
- Pro-Konto-Signaturen

## 📋 Systemanforderungen

| Komponente | Anforderung |
|------------|-------------|
| Betriebssystem | Linux (x64) |
| Grafik | X11 oder Wayland |
| Speicher | ~200 MB |
| Für KI-Features | Ollama + min. 4 GB RAM |

## 📥 Installation

### AppImage (empfohlen)

1. Lade `CoreMail.Desktop-2.0.0.AppImage` herunter
2. Mache die Datei ausführbar:
   ```bash
   chmod +x CoreMail.Desktop-2.0.0.AppImage
   ```
3. Starte die App:
   ```bash
   ./CoreMail.Desktop-2.0.0.AppImage
   ```

### Aus Quellcode

```bash
# Repository klonen
git clone https://github.com/Zenovs/coremail.git
cd coremail

# Abhängigkeiten installieren
npm install

# Entwicklungsmodus
npm run dev

# AppImage erstellen
npm run build
```

## ⚙️ E-Mail-Konto einrichten

### Mit Server-Vorlage (empfohlen)

1. Öffne **Kontenverwaltung** → **+ Neues Konto**
2. Wähle eine **Server-Vorlage** (Gmail, Microsoft, etc.)
3. Gib deine **E-Mail-Adresse** ein
4. Gib dein **Passwort** oder **App-Passwort** ein
5. Klicke auf **Testen** und dann **Speichern**

### Manuelle Einrichtung

| Feld | Beschreibung |
|------|--------------|
| **IMAP Host** | z.B. `imap.gmail.com` |
| **IMAP Port** | 993 (TLS) |
| **SMTP Host** | z.B. `smtp.gmail.com` |
| **SMTP Port** | 465 (SSL) oder 587 (STARTTLS) |
| **E-Mail** | Deine E-Mail-Adresse |
| **Passwort** | Dein Passwort oder App-Passwort |

## 🔒 Datenschutz & Sicherheit

### 100% Lokal - Keine Daten verlassen deinen Computer

| Garantie | Status |
|----------|--------|
| Alle Daten bleiben auf deinem Computer | ✅ |
| Keine Cloud-Speicherung | ✅ |
| Keine Telemetrie oder Analytics | ✅ |
| Open Source & überprüfbar | ✅ |

### 📂 Wo werden deine Daten gespeichert?

| Datentyp | Speicherort | Technologie |
|----------|-------------|-------------|
| E-Mail-Cache | Lokal | IndexedDB |
| Kontoeinstellungen | Lokal | electron-store (verschlüsselt) |
| App-Einstellungen | Lokal | electron-store |

### 🌐 Externe Verbindungen

CoreMail verbindet sich **ausschließlich** zu:

| Dienst | Zweck |
|--------|-------|
| **Dein IMAP-Server** | E-Mails abrufen |
| **Dein SMTP-Server** | E-Mails senden |
| **Lokaler Ollama** | KI-Features (localhost:11434) |
| **GitHub** | Update-Prüfung |

## 📄 Changelog

Siehe [CHANGELOG.md](CHANGELOG.md) für Details zu allen Versionen.

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstelle einen Issue oder Pull Request.

## 📜 Lizenz

MIT License - siehe LICENSE für Details.

---

**CoreMail Desktop v2.0.0** - Einfacher IMAP/SMTP E-Mail-Client 📧
