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
  <a href="https://github.com/Zenovs/coremail/releases/latest">
    <img src="https://img.shields.io/github/v/release/Zenovs/coremail?label=Version&color=06b6d4" alt="Version">
  </a>
  <img src="https://img.shields.io/badge/Platform-Linux%20x64%20%7C%20arm64-informational?color=6366f1" alt="Platform">
</p>

---

## ⚡ Installation

### Architektur wählen

| | x64 | arm64 |
|---|---|---|
| **Geräte** | Standard-PC, Laptop | Raspberry Pi 4/5 (64-bit OS), Apple Silicon (Rosetta) |
| **Erkennung** | `uname -m` → `x86_64` | `uname -m` → `aarch64` |

> Das Installations-Script erkennt die Architektur **automatisch**.

---

### Ein-Befehl-Installation (empfohlen)

```bash
curl -sSL https://raw.githubusercontent.com/Zenovs/coremail/initial-code/install.sh | bash
```

Oder mit `wget`:

```bash
wget -qO- https://raw.githubusercontent.com/Zenovs/coremail/initial-code/install.sh | bash
```

Das Script erledigt automatisch:
- Architektur erkennen (x64 / arm64)
- Passendes AppImage herunterladen
- Icons installieren
- Desktop-Eintrag erstellen
- Icon-Cache aktualisieren

---

### Direkter Download

| Architektur | Download | Grösse |
|---|---|---|
| **x64** (Standard-PC) | [CoreMail-Desktop-4.1.0-x64.AppImage](https://github.com/Zenovs/coremail/releases/download/v4.1.0/CoreMail-Desktop-4.1.0-x64.AppImage) | ~150 MB |
| **arm64** (Raspberry Pi 4/5) | [CoreMail-Desktop-4.1.0-arm64.AppImage](https://github.com/Zenovs/coremail/releases/download/v4.1.0/CoreMail-Desktop-4.1.0-arm64.AppImage) | ~150 MB |

```bash
# x64
chmod +x CoreMail-Desktop-4.1.0-x64.AppImage
./CoreMail-Desktop-4.1.0-x64.AppImage

# arm64
chmod +x CoreMail-Desktop-4.1.0-arm64.AppImage
./CoreMail-Desktop-4.1.0-arm64.AppImage
```

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
- **Microsoft Exchange / Microsoft 365** — OAuth2-Login via Microsoft Graph API
- **Hostpoint & Bluewin** — vorkonfigurierte Vorlagen
- **Split-View** — Mailliste und Vorschau nebeneinander, alle Spalten verstellbar
- **Inline-Antwort** — direkt in der Vorschau antworten, ohne Seitenwechsel
- **Allen antworten & Weiterleiten** — inkl. CC/BCC-Unterstützung
- **Gesendete Mails** — zeigt Empfängeradresse statt eigener Adresse
- **Ordner-Navigation** — alle IMAP-Ordner durchsuchen und wechseln
- **Tag-Eingabe für Empfänger** — An/CC/BCC als einzelne Chips, einfach entfernbar

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
- **Anzeigename** — pro Mail frei wählbar

### 🤖 KI-Assistent *(optional)*
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

## 🔒 Datenschutz

| | |
|---|---|
| ✅ | Alle Daten bleiben **lokal** auf deinem Computer |
| ✅ | **Keine Telemetrie**, kein Tracking |
| ✅ | Verbindet sich ausschliesslich mit deinen eigenen E-Mail-Servern |
| ✅ | KI-Features laufen **vollständig offline** (Ollama) |
| ✅ | Open Source |

---

## 🔧 Systemanforderungen

| | |
|---|---|
| **Betriebssystem** | Linux x64 / arm64 |
| **Speicher** | ~200 MB |
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


<p align="center"><strong>CoreMail Desktop</strong> — Dein E-Mail-Client für Linux 📧</p>
