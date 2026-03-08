# 📧 CoreMail Desktop v1.7.2

Ein schlanker, benutzerfreundlicher E-Mail-Client für Linux mit modernem Design, lokaler KI-Integration und fortschrittlichen Funktionen.

<p align="center">
  <img src="assets/icon.png" width="128" height="128" alt="CoreMail Desktop">
</p>

## ✨ Features

### 🤖 In-App Ollama-Installation (NEU in v1.7.0)
- **Automatische Installation**: Ollama direkt in der App installieren
- **Erster-Start-Dialog**: Einrichtungsassistent beim ersten Öffnen
- **Progress-Anzeige**: Fortschrittsbalken während der Installation
- **Modell-Download**: Automatischer Download des KI-Modells
- **Keine Terminal-Befehle**: Alles über die GUI
- **Einstellungs-Integration**: Installation auch über Einstellungen möglich

### 💬 Lokale KI-Integration
- **Ollama-Integration**: Lokale KI ohne Cloud-Abhängigkeit
- **E-Mails zusammenfassen**: Ein Klick für prägnante Zusammenfassungen
- **Antwort-Vorschläge**: KI hilft beim Verfassen von Antworten
- **Textverbesserung**: Text verbessern, kürzen, förmlicher/freundlicher machen
- **KI-Chatbot**: Schwebendes Widget für direkte Fragen
- **Modell-Verwaltung**: Installiere und verwalte verschiedene KI-Modelle
- **Streaming-Antworten**: Echtzeit-Typing-Animation

### 📬 E-Mail-Verwaltung
- **Multi-Account-Support**: Verwalte mehrere E-Mail-Konten gleichzeitig
- **Kategorien**: Organisiere Konten in Kategorien (Arbeit, Privat, etc.)
- **IMAP/SMTP**: Volle Unterstützung für IMAP und SMTP-Protokolle
- **Split-View**: E-Mail-Liste und Vorschau nebeneinander

### 📐 Individualisierbare Sidebar
- **Resize-Handle**: Sidebar-Breite per Drag & Drop anpassen
- **Min/Max-Breite**: 200px bis 400px einstellbar
- **Icons-Only-Modus**: Kompakte Ansicht nur mit Icons
- **Auto-Collapse**: Automatisches Minimieren bei kleinen Fenstern
- **Persistente Einstellungen**: Werden beim Neustart wiederhergestellt

### 📊 Widget-Dashboard
- **4 Widget-Typen**: 
  - Konto-Widget: Einzelnes E-Mail-Konto mit Statistiken
  - Kategorie-Widget: Übersicht einer Kategorie
  - Statistik-Widget: Gesamtstatistiken aller Konten
  - Schnellaktionen-Widget: Schnellzugriff auf häufige Aktionen
- **Drag & Drop**: Widgets per Drag & Drop verschieben
- **3 Größen**: Klein (S), Mittel (M), Groß (L)
- **Bearbeitungsmodus**: Dashboard im Edit-Mode anpassen
- **Persistentes Layout**: Widget-Positionen werden gespeichert

### 🎨 6 Themes
- **Dark**: Klassisches dunkles Design mit Cyan-Akzenten
- **Light**: Helles, klassisches Design
- **Minimal**: Minimalistisch in Schwarz-Weiß
- **Morphismus**: Glasmorphismus-Effekte mit weichen Schatten
- **Glas**: Transparente Glaseffekte mit starkem Blur
- **Retro**: 80er/90er Neon-Stil mit Pink, Cyan und Gelb

### 🔔 Benachrichtigungen
- Desktop-Benachrichtigungen bei neuen E-Mails
- Konfigurierbar pro Konto und Kategorie
- Klick auf Benachrichtigung öffnet die E-Mail
- Badge-Counter für ungelesene E-Mails

### 🔄 Auto-Update
- Automatische Prüfung auf neue Versionen (täglich)
- Ein-Klick-Download und Installation
- Update-Verlauf und Release Notes
- Benachrichtigung bei verfügbarem Update

### 📎 Anhang-Verwaltung
- Bildvorschau direkt in der E-Mail
- PDF-Vorschau integriert
- Drag & Drop: Dateien direkt ins Compose-Fenster ziehen
- "Alle herunterladen" Button
- Upload-Fortschrittsanzeige
- Konfigurierbarer Download-Ordner

### ✍️ E-Mail-Signaturen
- Rich-Text-Editor für Signaturen
- Pro-Konto-Signaturen
- 6 Vorlagen: Einfach, Professionell, Business, Freundlich, Minimal, Modern
- Platzhalter-Unterstützung: Name, E-Mail, Datum, etc.
- Automatisches Anhängen beim Senden

## 📋 Systemanforderungen

| Komponente | Anforderung |
|------------|-------------|
| Betriebssystem | Linux (x64) |
| Grafik | X11 oder Wayland |
| Speicher | ~200 MB |
| Für KI-Features | Ollama + min. 4 GB RAM |

## 📥 Installation

### AppImage (empfohlen)

1. Lade `CoreMail.Desktop-1.5.0.AppImage` herunter
2. Mache die Datei ausführbar:
   ```bash
   chmod +x CoreMail.Desktop-1.5.0.AppImage
   ```
3. Starte die App:
   ```bash
   ./CoreMail.Desktop-1.5.0.AppImage
   ```

### Installer mit KI-Setup

```bash
# Installer ausführen (installiert auch Ollama optional)
./install.sh
```

Der Installer bietet an:
- Ollama automatisch zu installieren
- Ein kompaktes KI-Modell (llama3.2:1b, ~1.3 GB) herunterzuladen

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

### Ollama manuell installieren

Falls du Ollama separat installieren möchtest:

```bash
# Ollama installieren
curl -fsSL https://ollama.com/install.sh | sh

# Ollama starten
ollama serve

# Empfohlenes Modell laden
ollama pull llama3.2:1b
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

### v1.5.3 (aktuell)
- 💬 **Professionelles Chat-Icon**
  - Roboter-Emoji durch modernes Lucide Chat-Icon ersetzt
  - Konsistentes Design in allen Komponenten
- 🔧 **Automatische Ollama-Installation**
  - Ollama wird automatisch bei Installation installiert
  - Kein manuelles Nachfragen mehr
  - Standard-Modell (llama3.2:1b) wird automatisch geladen

### v1.5.0 - v1.5.2
- 💬 **Lokale KI-Integration mit Ollama**
  - E-Mails mit einem Klick zusammenfassen
  - Antwort-Vorschläge generieren lassen
  - Texte verbessern, kürzen, förmlicher/freundlicher machen
  - KI-Chatbot Widget (schwebendes Panel)
  - Streaming-Antworten mit Typing-Animation
- ⚙️ **KI-Einstellungen**
  - Neue Einstellungsseite "KI-Assistent"
  - Modelle installieren, verwalten und wechseln
  - Download-Fortschrittsanzeige
  - Empfohlene Modelle: llama3.2:1b, mistral:7b, etc.

### v1.4.0
- 📐 **Individualisierbare Sidebar**
- 📊 **Widget-Dashboard** mit Drag & Drop

### v1.3.0
- 🎨 3 neue Themes: Morphismus, Glas, Retro
- 📎 Drag & Drop für Anhänge
- ✍️ 6 Signatur-Vorlagen

### v1.2.0
- 🔄 Auto-Update-Funktion
- 🔔 Desktop-Benachrichtigungen

### v1.1.0
- Multi-Account-Support
- Kategorien

### v1.0.0
- Erste Version

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstelle einen Issue oder Pull Request.

## 📜 Lizenz

MIT License - siehe LICENSE für Details.

---

**CoreMail Desktop** - ...die mit Wallisär Pauer 💪
