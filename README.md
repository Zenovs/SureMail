<p align="center">
<pre>
  ██████╗ ██████╗ ██████╗ ███████╗███╗   ███╗ █████╗ ██╗██╗
 ██╔════╝██╔═══██╗██╔══██╗██╔════╝████╗ ████║██╔══██╗██║██║
 ██║     ██║   ██║██████╔╝█████╗  ██╔████╔██║███████║██║██║
 ██║     ██║   ██║██╔══██╗██╔══╝  ██║╚██╔╝██║██╔══██║██║██║
 ╚██████╗╚██████╔╝██║  ██║███████╗██║ ╚═╝ ██║██║  ██║██║███████╗
  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚══════╝
                  D e s k t o p   E - M a i l   C l i e n t
</pre>
</p>

<p align="center">
  <img src="assets/icon.png" width="96" height="96" alt="CoreMail Desktop">
</p>

<p align="center">
  <strong>Lightweight open-source email client for Linux — IMAP/SMTP + Microsoft 365 + local AI</strong>
</p>

<p align="center">
  <a href="https://github.com/Zenovs/coremail/releases/latest">
    <img src="https://img.shields.io/github/v/release/Zenovs/coremail?label=Release&color=06b6d4" alt="Release">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="MIT License">
  </a>
  <img src="https://img.shields.io/badge/Platform-Linux%20x64%20%7C%20arm64-6366f1" alt="Platform">
  <img src="https://img.shields.io/badge/Electron-28-47848f?logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/Built%20with-React%2018-61dafb?logo=react" alt="React">
</p>

---

## What is CoreMail?

CoreMail Desktop is a **free, open-source email client for Linux** built with Electron and React. It supports any IMAP/SMTP server as well as **Microsoft 365 / Exchange via OAuth2** (no app passwords needed). An optional **local AI assistant powered by Ollama** lets you summarize emails and generate replies — fully offline, no data leaves your machine.

**Key highlights:**
- Multiple accounts (IMAP/SMTP + Microsoft 365 Graph API)
- 11 dark/light themes, virtual scrolling, split-view
- Local spam filter and sender management
- Optional AI assistant (Ollama) — runs entirely offline
- Raspberry Pi 4/5 (arm64) support
- One-command install via AppImage

---

## ⚡ Installation

Wähle deine Architektur und füge den Befehl ins Terminal ein — das Script lädt CoreMail herunter, installiert Icons und erstellt einen Desktop-Eintrag.

#### 🖥️ x64 — Standard-PC / Laptop

```bash
curl -sSL https://raw.githubusercontent.com/Zenovs/coremail/initial-code/install.sh | bash -s -- --x64
```

```bash
wget -qO- https://raw.githubusercontent.com/Zenovs/coremail/initial-code/install.sh | bash -s -- --x64
```

#### 🍓 arm64 — Raspberry Pi 4/5 (64-bit OS)

```bash
curl -sSL https://raw.githubusercontent.com/Zenovs/coremail/initial-code/install.sh | bash -s -- --arm64
```

```bash
wget -qO- https://raw.githubusercontent.com/Zenovs/coremail/initial-code/install.sh | bash -s -- --arm64
```

> Nicht sicher welche Architektur? `uname -m` im Terminal eingeben: `x86_64` → x64, `aarch64` → arm64.

---

### Direkter Download

| Architektur | Download |
|---|---|
| **x64** (Standard-PC) | [⬇️ CoreMail-Desktop-5.1.4-x86_64.AppImage](https://github.com/Zenovs/coremail/releases/latest) |
| **arm64** (Raspberry Pi 4/5) | [⬇️ CoreMail-Desktop-5.1.4-arm64.AppImage](https://github.com/Zenovs/coremail/releases/latest) |

---

## 🔄 Update

Das Installations-Script erkennt eine bestehende Installation automatisch und aktualisiert sie:

```bash
curl -sSL https://raw.githubusercontent.com/Zenovs/coremail/initial-code/install.sh | bash -s -- --x64
# oder --arm64 für Raspberry Pi
```

> Einstellungen, Konten und Daten bleiben beim Update erhalten.

---

## 🗑️ Deinstallation

```bash
pkill -9 -f coremail ; pkill -9 -f CoreMail ; sleep 1 ; \
rm -rf \
  ~/.local/bin/coremail* \
  ~/.local/bin/CoreMail* \
  ~/.local/share/applications/coremail* \
  ~/.local/share/applications/CoreMail* \
  ~/.local/share/icons/hicolor/*/apps/coremail* \
  ~/.local/share/icons/hicolor/*/apps/CoreMail* \
  ~/.local/share/pixmaps/coremail* \
  ~/.local/share/pixmaps/CoreMail* \
  ~/.config/coremail* \
  ~/.config/CoreMail* \
  /usr/share/applications/coremail* \
  /usr/share/applications/CoreMail* \
  2>/dev/null ; \
gtk-update-icon-cache -f ~/.local/share/icons/hicolor 2>/dev/null ; \
update-desktop-database ~/.local/share/applications 2>/dev/null ; \
echo "✅ CoreMail wurde komplett entfernt!"
```

---

## ✨ Funktionen

### 📬 E-Mail & Konten
- **Mehrere Konten gleichzeitig** — beliebig viele IMAP/SMTP-Konten
- **Microsoft Exchange / Microsoft 365** — OAuth2-Login via Microsoft Graph API, kein App-Passwort nötig
- **Hostpoint & Bluewin** — vorkonfigurierte Vorlagen
- **Split-View** — Mailliste und Vorschau nebeneinander, alle Spalten verstellbar
- **Inline-Antwort** — direkt in der Vorschau antworten, ohne Seitenwechsel
- **Allen antworten & Weiterleiten** — inkl. CC/BCC-Unterstützung
- **Ordner-Navigation** — alle IMAP-Ordner durchsuchen und wechseln
- **Tag-Eingabe für Empfänger** — An/CC/BCC als einzelne Chips

### 📎 Anhänge
- **Speichern** — Anhang direkt in den Download-Ordner speichern
- **Öffnen** — Anhang speichern und sofort mit der Standard-Anwendung öffnen
- **Alle herunterladen** — alle Anhänge einer Mail auf einmal speichern
- **Vorschau** — Bilder und PDFs direkt in der App anzeigen

### 🔍 Suche & Filter
- **Globale Suche** über alle Konten — `Ctrl+K`
- **Nur-Ungelesen-Filter** — schnell alle ungelesenen Mails anzeigen
- **Kategorie-Filter** — nach Werbung, Spam, etc. filtern

### 🛡️ Spam-Schutz & Kategorisierung
- **Automatischer Spam-Filter** — erkennt Werbung, Phishing, Schadsoftware
- **Manuelle Kategorien** — Mails als Werbung / Spam / Schädlich / Virus / Vertrauenswürdig markieren
- **Absender-Regeln** — neue Mails vom gleichen Absender werden automatisch kategorisiert
- **Absender-Verwaltung** — alle kategorisierten Absender in einer Übersicht

### ✏️ Verfassen
- **Rich-Text-Editor** mit Formatierungs-Toolbar (Fett, Kursiv, Listen, Farben, Links)
- **HTML-Quellcode-Modus** und **Vorschau**
- **HTML-Vorlagen** — Leer, Formeller Brief, Newsletter, Angebot, eigenes HTML
- **Signaturen** — pro Konto, mit HTML-Unterstützung
- **Anhänge** — per Dateiauswahl oder Drag & Drop
- **Zeitversetztes Senden** — Mail zu einem bestimmten Zeitpunkt versenden
- **Entwurf-Autosave** — Entwürfe werden alle 10 Sekunden gespeichert

### 🤖 KI-Assistent *(optional, vollständig offline)*
- **Lokal mit Ollama** — keine Cloud, keine Daten verlassen deinen Computer
- E-Mails zusammenfassen
- Antwortvorschläge generieren
- Text verbessern, kürzen, förmlicher/freundlicher formulieren

### 🎨 Design & Darstellung
- **11 Themes**: Dark, Light, Minimal, Morphismus, Glas, Retro, Foundations, Lollipop, Nerd, Colorful, Indie
- **Dynamische App-Icons** — passen sich automatisch ans Theme an
- **Schriftart-Auswahl** — Google Fonts direkt in den Einstellungen
- **Anpassbare Spaltenbreiten** — per Drag
- **CSS-Isolation** — E-Mail-CSS beeinflusst niemals die App-Oberfläche

### 📊 Dashboard
- Anpassbare Widgets: Statistiken, Schnellaktionen, Kontoübersicht, Kategorien
- Drag & Drop zum Anordnen

### 📋 Logbuch
- **Vollständiges Ereignisprotokoll** — alle App-Aktionen nachvollziehbar
- Hilft bei der Diagnose von Verbindungs- und Synchronisierungsproblemen

### 🔄 Updates
- Automatische Update-Prüfung beim Start
- Ein-Klick-Update direkt im Client

---

## 📡 Unterstützte Anbieter

| Anbieter | Protokoll | Hinweis |
|---|---|---|
| Microsoft Exchange / Microsoft 365 | Graph API (OAuth2) | Kein App-Passwort nötig |
| Hostpoint | IMAP/SMTP | Vorlage vorhanden |
| Bluewin | IMAP/SMTP | Vorlage vorhanden |
| Gmail | IMAP/SMTP | App-Passwort erforderlich |
| iCloud | IMAP/SMTP | App-Passwort erforderlich |
| Yahoo / GMX / WEB.DE | IMAP/SMTP | — |
| Jeder IMAP/SMTP-Server | IMAP/SMTP | Benutzerdefiniert |

---

## 🔒 Datenschutz & Sicherheit

| | |
|---|---|
| ✅ | Alle Daten bleiben **lokal** auf deinem Computer |
| ✅ | **Keine Telemetrie**, kein Tracking, keine Analytics |
| ✅ | Verbindet sich ausschliesslich mit deinen eigenen E-Mail-Servern |
| ✅ | KI-Features laufen **vollständig offline** (Ollama) |
| ✅ | Kontodaten **AES-verschlüsselt** gespeichert |
| ✅ | Open Source — vollständig einsehbarer Code |

---

## 🔧 Systemanforderungen

| | |
|---|---|
| **Betriebssystem** | Linux x64 / arm64 |
| **Speicher** | ~200 MB |
| **RAM** | mind. 512 MB (2 GB+ für KI-Features) |
| **KI-Features** | Ollama + mind. 4 GB RAM (optional) |

---

## 🛠️ Aus Quellcode bauen

```bash
git clone https://github.com/Zenovs/coremail.git
cd coremail
npm install
npm run dev      # Entwicklungsmodus
npm run build    # AppImage erstellen (x64 + arm64)
```

Einzelne Architektur bauen:

```bash
# Nur x64
./node_modules/.bin/electron-builder --linux appimage --x64

# Nur arm64 (Cross-Kompilierung, läuft auch auf x64)
./node_modules/.bin/electron-builder --linux appimage --arm64
```

---

## 🤝 Contributing

Beiträge sind willkommen! So kannst du helfen:

1. **Fork** das Repository
2. **Branch** erstellen: `git checkout -b feature/meine-funktion`
3. **Änderungen committen**: `git commit -m 'Add: neue Funktion'`
4. **Push**: `git push origin feature/meine-funktion`
5. **Pull Request** öffnen

Für grössere Änderungen bitte zuerst ein **Issue** öffnen, um die Richtung abzustimmen.

**Bug melden:** [Issues öffnen](https://github.com/Zenovs/coremail/issues)

---

## 📄 Lizenz

Dieses Projekt steht unter der **MIT-Lizenz** — see [LICENSE](LICENSE) for details.

Frei verwendbar, modifizierbar und weitergebbar — auch kommerziell.

---

<p align="center"><strong>CoreMail Desktop</strong> — Free, open-source email client for Linux 📧</p>
