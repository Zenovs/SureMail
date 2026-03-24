```
 ██████╗ ██████╗ ██████╗ ███████╗███╗   ███╗ █████╗ ██╗██╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝████╗ ████║██╔══██╗██║██║
██║     ██║   ██║██████╔╝█████╗  ██╔████╔██║███████║██║██║
██║     ██║   ██║██╔══██╗██╔══╝  ██║╚██╔╝██║██╔══██║██║██║
╚██████╗╚██████╔╝██║  ██║███████╗██║ ╚═╝ ██║██║  ██║██║███████╗
 ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚══════╝
```

<p align="center">
  <strong>Moderner, schlanker E-Mail-Client für Linux</strong><br>
  Lokal. Schnell. Privat.
</p>

<p align="center">
  <img src="assets/icon.png" width="96" height="96" alt="CoreMail Desktop">
</p>

<p align="center">
  <a href="https://github.com/Zenovs/coremail/releases/latest">
    <img src="https://img.shields.io/github/v/release/Zenovs/coremail?label=Version&color=06b6d4" alt="Version">
  </a>
  <img src="https://img.shields.io/badge/Platform-Linux%20x64-informational?color=6366f1" alt="Platform">
  <img src="https://img.shields.io/badge/Lizenz-MIT-green" alt="MIT">
</p>

---

## ⚡ Installation

### Ein-Befehl-Installation (empfohlen)

```bash
curl -sSL https://raw.githubusercontent.com/Zenovs/coremail/initial-code/install.sh | bash
```

Oder mit `wget`:

```bash
wget -qO- https://raw.githubusercontent.com/Zenovs/coremail/initial-code/install.sh | bash
```

Das Script erledigt automatisch:
- AppImage herunterladen
- Icons installieren
- Desktop-Eintrag erstellen
- Icon-Cache aktualisieren

### Direkter Download

**[⬇️ CoreMail Desktop v2.9.5 herunterladen](https://github.com/Zenovs/coremail/releases/download/v2.9.5/CoreMail-Desktop-2.9.5.AppImage)** (~150 MB)

```bash
chmod +x CoreMail-Desktop-2.9.5.AppImage
./CoreMail-Desktop-2.9.5.AppImage --no-sandbox
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
- **7 Themes**: Dark, Light, Minimal, Morphismus, Glas, Retro, Foundations
- **Dynamische App-Icons** — passen sich automatisch ans Theme an
- **Schriftart-Auswahl** — Google Fonts direkt in den Einstellungen
- **Anpassbare Spaltenbreiten** — per Drag

### 📊 Dashboard
- Anpassbare Widgets: Statistiken, Schnellaktionen, Kontoübersicht, Kategorien
- Drag & Drop zum Anordnen

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
| **Betriebssystem** | Linux x64 |
| **Speicher** | ~200 MB |
| **KI-Features** | Ollama + mind. 4 GB RAM (optional) |

---

## 🛠️ Aus Quellcode bauen

```bash
git clone https://github.com/Zenovs/coremail.git
cd coremail
npm install
npm run dev      # Entwicklungsmodus
npm run build    # AppImage erstellen
```

---

## 📜 Lizenz

MIT License

---

<p align="center"><strong>CoreMail Desktop</strong> — Dein E-Mail-Client für Linux 📧</p>
