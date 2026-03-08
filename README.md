# 📧 CoreMail Desktop v1.2.1

Ein schlanker, benutzerfreundlicher E-Mail-Client für Linux mit modernem Design und fortschrittlichen Funktionen.

![CoreMail Desktop](assets/icon.png)

## ✨ Features

### 📬 E-Mail-Verwaltung
- **Multi-Account-Support**: Verwalte mehrere E-Mail-Konten gleichzeitig
- **Kategorien**: Organisiere Konten in Kategorien (Arbeit, Privat, etc.)
- **IMAP/SMTP**: Volle Unterstützung für IMAP und SMTP-Protokolle
- **Split-View**: E-Mail-Liste und Vorschau nebeneinander

### 🔔 Benachrichtigungen (NEU in v1.2)
- Desktop-Benachrichtigungen bei neuen E-Mails
- Konfigurierbar pro Konto und Kategorie
- Klick auf Benachrichtigung öffnet die E-Mail
- Badge-Counter für ungelesene E-Mails

### 🔄 Auto-Update (NEU in v1.2)
- Automatische Prüfung auf neue Versionen
- Ein-Klick-Download und Installation
- Update-Verlauf und Release Notes

### 📎 Anhang-Verwaltung (NEU in v1.2)
- Bildvorschau direkt in der E-Mail
- PDF-Vorschau integriert
- "Alle herunterladen" Button
- Download-Manager mit Fortschrittsanzeige
- Konfigurierbarer Download-Ordner

### ✍️ E-Mail-Signaturen (NEU in v1.2)
- Rich-Text-Editor für Signaturen
- Pro-Konto-Signaturen
- Vorlagen für schnelle Einrichtung
- Automatisches Anhängen beim Senden
- Vorschau im Compose-Fenster

### 🎨 Design
- 3 Themes: Dark, Light, Minimal
- Modernes, minimalistisches Interface
- Responsives Layout

## 📋 Systemanforderungen

| Komponente | Anforderung |
|------------|-------------|
| Betriebssystem | Linux (x64) |
| Grafik | X11 oder Wayland |
| Speicher | ~200 MB |

## 📥 Installation

### AppImage (empfohlen)

1. Lade `CoreMail.Desktop-1.2.1.AppImage` herunter
2. Mache die Datei ausführbar:
   ```bash
   chmod +x CoreMail.Desktop-1.2.1.AppImage
   ```
3. Starte die App:
   ```bash
   ./CoreMail.Desktop-1.2.1.AppImage
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

### Gmail

1. Aktiviere 2FA in deinem Google-Konto
2. Erstelle ein [App-Passwort](https://myaccount.google.com/apppasswords)
3. Verwende folgende Einstellungen:
   - **IMAP Host**: imap.gmail.com
   - **IMAP Port**: 993
   - **SMTP Host**: smtp.gmail.com
   - **SMTP Port**: 465

### Andere Anbieter

| Anbieter | IMAP Host | IMAP Port | SMTP Host | SMTP Port |
|----------|-----------|-----------|-----------|-----------|
| Outlook  | outlook.office365.com | 993 | smtp.office365.com | 587 |
| Yahoo    | imap.mail.yahoo.com | 993 | smtp.mail.yahoo.com | 465 |
| GMX      | imap.gmx.net | 993 | mail.gmx.net | 465 |

## ⌨️ Tastenkürzel

| Kürzel | Aktion |
|--------|--------|
| ↑ / ↓  | E-Mail Navigation |
| Enter  | E-Mail öffnen |
| Esc    | Zurück |

## 🔒 Sicherheit

- Passwörter werden lokal verschlüsselt gespeichert
- Keine Cloud-Synchronisation
- Keine Telemetrie oder Tracking
- Update-Downloads über HTTPS

## 📄 Changelog

Siehe [CHANGELOG.md](CHANGELOG.md) für Details zu allen Versionen.

### v1.2.1 (aktuell)
- 🐛 Bugfix: Scrolling in E-Mail-Liste behoben
- 🐛 Bugfix: Scrolling in E-Mail-Vorschau behoben

### v1.2.0
- 🔄 Update-Funktion mit GitHub Releases
- 🔔 Desktop-Benachrichtigungen
- 📎 Verbesserte Anhang-Verwaltung
- ✍️ E-Mail-Signaturen
- 🎨 Neues App-Icon

### v1.1.0
- Multi-Account-Support
- Kategorien
- 3 Themes
- Dashboard

### v1.0.0
- Erste Version
- IMAP/SMTP
- Grundlegende E-Mail-Funktionen

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstelle einen Issue oder Pull Request.

## 📜 Lizenz

MIT License - siehe LICENSE für Details.

---

**CoreMail Desktop** - ...die mit Wallisär Pauer 💪
