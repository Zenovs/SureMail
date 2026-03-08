# Changelog

Alle wichtigen Änderungen an CoreMail Desktop werden in dieser Datei dokumentiert.

## [1.7.1] - 2026-03-08

### 🐛 Bugfixes

#### 🤖 Ollama Auto-Start & Modell-Download
- **Automatischer Start**: Ollama wird jetzt automatisch beim CoreMail-Start gestartet, wenn es installiert aber nicht laufend ist
- **Kein manuelles Starten mehr nötig**: Ollama-Dienst startet im Hintergrund (via systemctl oder ollama serve)
- **Automatischer Modell-Download**: Nach der Ollama-Installation wird das Modell `llama3.2:1b` automatisch heruntergeladen

#### 🎨 Foundations Theme sichtbar
- **Theme-Auswahl korrigiert**: Das neue "Foundations" Theme wird jetzt korrekt in den Einstellungen angezeigt
- **Theme-Preview hinzugefügt**: Orange & Grün Kreise als visuelles Preview für das Theme
- **7 Themes jetzt vollständig sichtbar**: Dark, Light, Minimal, Morphismus, Glas, Retro, Foundations

### 🔧 Technische Änderungen
- **main.js**: Neue `autoStartOllama()` Funktion beim App-Start
- **SettingsV2.js**: "Foundations" Theme zu `themeOptions` Array hinzugefügt
- **SettingsV2.js**: Theme-Preview für Foundations mit Orange/Grün Kreisen

### 📦 Version
- Patch-Release: v1.7.0 → v1.7.1

---

## [1.7.0] - 2026-03-08

### ✨ Neue Features

#### 🎨 Neues "Foundations" Theme
- **Design-System basiert**: Professionelles Theme basierend auf modernem Design-System
- **Farbpalette**:
  - Dunkler Hintergrund: #1a1a1a bis #2e2e2e
  - Primäre Akzentfarbe: Orange (#d97706)
  - Sekundäre Akzentfarbe: Grün (#10b981)
- **Border-Radius-System**:
  - Small: 4px (für kleine Elemente)
  - Medium: 8px (Standard)
  - Large: 12px (für große Elemente)
  - Full: 999px (Pill-Form für Buttons)
- **Schatten-Effekte**:
  - Raised: Erhöhte Oberflächen mit Tiefeneffekt
  - Inset: Eingedrückte Oberflächen
  - Pressed: Gedrückte Buttons
  - Subtle: Dezente Schatten
- **Button-Stile**:
  - Primary: Orange mit Pill-Form
  - Secondary: Grau mit mittlerem Radius
  - Subtle: Transparent mit Border
  - Success: Grün mit Pill-Form
- **7 Themes verfügbar**: Dark, Light, Minimal, Morphismus, Glas, Retro, Foundations

### 🔧 Technische Änderungen
- **ThemeContext.js**: Neues "foundations" Theme mit customStyles
- **tailwind.config.js**: Neue Farben, Border-Radius und Schatten für Foundations
  - `foundations-900/800/700/600/500` Hintergrundfarben
  - `foundations-orange`, `foundations-green` Akzentfarben
  - `rounded-foundations-sm/md/lg/full` Border-Radius
  - `shadow-foundations-raised/inset/pressed` Schatten

### 📦 Version
- Minor-Release: v1.6.0 → v1.7.0

---

## [1.6.0] - 2026-03-08

### ✨ Neue Features

#### 🤖 In-App Ollama-Installation
- **OllamaInstaller-Komponente**: Neuer modaler Dialog für Ollama-Installation
- **Erster-Start-Dialog**: Automatische Anzeige beim ersten App-Start
- **Progress-Anzeige**: Echtzeit-Fortschrittsbalken während Installation
- **IPC-Integration**: 
  - `ollama:checkInstalled` - Prüft Installationsstatus
  - `ollama:install` - Startet Installation
  - `ollama:startService` - Startet Ollama-Dienst
  - `ollama:downloadModel` - Lädt KI-Modell herunter
  - `ollama:progress` - Echtzeit-Progress-Events
- **Automatischer Modell-Download**: llama3.2:1b wird automatisch geladen
- **Fehlerbehandlung**: Manuelle Anleitung bei Fehlschlag

#### 🎨 Theme-System
- **Alle 6 Themes verifiziert**: Dark, Light, Minimal, Morphismus, Glas, Retro
- **Theme-Previews**: Visuelle Vorschauen in Einstellungen
- **Konsistente Anwendung**: Themes werden korrekt in allen Komponenten angewendet

#### 📐 Verbesserte Einstellungen
- **OllamaSettings erweitert**: Installation direkt aus Einstellungen möglich
- **Status-Anzeige**: Zeigt Installationsstatus und Service-Status
- **Installation/Start-Buttons**: Direkte Aktionen aus der UI

### 🔧 Technische Änderungen
- **main.js**: Neue Funktionen für Ollama-Installation
  - `isOllamaInstalled()` - Prüft ob ollama Command verfügbar
  - `isOllamaRunning()` - Prüft HTTP-Verbindung zu Ollama
  - `installOllama()` - Führt curl-Installation aus
  - `startOllamaService()` - Startet systemd/nohup Service
  - `downloadOllamaModel()` - Lädt Modell mit Progress
- **preload.js**: Neue APIs für Renderer-Process
- **App.js**: useOllama Hook und OllamaInstaller-Integration
- **OllamaSettings.js**: Erweiterte UI für Installation

### 📦 Version
- **Minor-Release**: v1.5.4 → v1.6.0 (neues Feature)

---

## [1.5.4] - 2026-03-08

### 🐛 Bugfixes

#### 🔧 Robustere Ollama-Installation
- **Voraussetzungen-Prüfung**: Prüft ob curl verfügbar ist
- **Internet-Verbindung**: Prüft ob ollama.com erreichbar ist vor Installation
- **Verifikation**: Prüft ob Ollama nach Installation wirklich verfügbar ist
- **sudo-Unterstützung**: Installiert mit sudo falls nötig
- **Bessere Fehlermeldungen**: Klare Anleitung bei fehlgeschlagener Installation
- **systemd-Integration**: Versucht zuerst systemd-Service zu starten
- **Logging**: Alle Schritte werden in /tmp/coremail-install.log protokolliert

#### 📐 Verbesserte Einstellungs-UI
- **Breitere Sidebar**: Einstellungs-Sidebar von 224px auf 256px verbreitert
- **Scrolling**: overflow-y-auto in Sidebar für Scrolling bei vielen Tabs
- **Flex-Shrink**: Sidebar behält ihre Breite auch bei schmalem Fenster
- **Bessere Lesbarkeit**: Keine abgeschnittenen Texte mehr

### 🔧 Technische Änderungen
- **install.sh**: Komplett überarbeitet mit Logging-Funktionen
- **SettingsV2.js**: Layout-Verbesserungen für bessere UX

---

## [1.5.3] - 2026-03-08

### ✨ Neue Features

#### 💬 Professionelles Chat-Icon
- **Lucide MessageCircle Icon**: Roboter-Emoji (🤖) durch modernes Chat-Icon ersetzt
- **Konsistentes Design**: Icon-Änderung in allen Komponenten:
  - ChatWidget (schwebendes Panel + Button)
  - EmailView (Zusammenfassen-Button)
  - ComposeEmail (KI-Assistent-Button + Panel)
  - OllamaSettings (Status-Anzeige)
  - SettingsV2 (Tab-Icon + Changelog)
- **Lucide-React**: Neue Abhängigkeit für professionelle SVG-Icons

#### 🔧 Automatische Ollama-Installation
- **Keine manuelle Interaktion**: Ollama wird automatisch installiert
- **Intelligente Prüfung**: 
  - Prüft ob Ollama bereits installiert ist
  - Startet Ollama-Service falls nicht aktiv
  - Prüft und lädt Standard-Modell (llama3.2:1b)
- **Robuste Fehlerbehandlung**: CoreMail funktioniert auch ohne Ollama
- **Besseres Logging**: Klare Status-Meldungen während Installation

### 🔧 Technische Änderungen
- **lucide-react**: Neue Abhängigkeit für Icon-Komponenten
- **install.sh**: Komplett überarbeitet für automatische Installation

---

## [1.5.2] - 2026-03-08

### 🐛 Kritische Bugfixes

#### OpenGL-Fehler VOLLSTÄNDIG behoben
- **Hardware-Acceleration deaktiviert**: `app.disableHardwareAcceleration()` wird jetzt korrekt VOR `app.whenReady()` aufgerufen
- **Komplette GPU-Suppression**: Alle GPU-Flags richtig gesetzt:
  - `--disable-gpu`: Deaktiviert GPU komplett
  - `--disable-gpu-compositing`: Deaktiviert GPU-Compositing
  - `--disable-gpu-vsync`: Deaktiviert VSync (Hauptursache des Fehlers)
  - `--use-gl=swiftshader`: Erzwingt Software-Rendering
  - `--disable-features=VizDisplayCompositor`: Deaktiviert Viz Display Compositor
- **Logging unterdrückt**: GPU-bezogene Warnungen werden nicht mehr angezeigt
- **100% Kompatibilität**: Funktioniert auf allen Linux-Systemen, unabhängig von GPU/Treiber

### 🔧 Technische Details
- Die Kombination aus `app.disableHardwareAcceleration()` und den Command-Line-Flags garantiert, dass keine GPU-Funktionen verwendet werden
- Software-Rendering über SwiftShader ist zuverlässig und performant für E-Mail-Clients

---

## [1.5.1] - 2026-03-08

### 🐛 Bugfixes

#### OpenGL-Fehler behoben
- **GPU VSync-Fehler**: "GetVSyncParametersIfAvailable() failed" wird nicht mehr angezeigt
- **Electron GPU-Flags**: Chromium-GPU-Sandbox und VSync deaktiviert für bessere Kompatibilität
- **Linux-Grafiktreiber**: Verbesserte Unterstützung für verschiedene GPU-Konfigurationen

#### Update-Funktion repariert
- **Absturz beim Update behoben**: App stürzt nicht mehr ab beim Installieren von Updates
- **Robuster Download**: Besseres Error-Handling bei Redirects und fehlenden Content-Length Headern
- **AppImage-Start**: Verwendet jetzt `spawn` statt `shell.openPath` für zuverlässiges Starten
- **Timeout-Handling**: Download-Timeouts werden korrekt behandelt
- **Datei-Validierung**: Überprüfung der Download-Integrität vor Installation

### 🔧 Technische Verbesserungen
- **HTTP/HTTPS-Handling**: Unterstützung für beide Protokolle bei Redirects
- **Redirect-Limit**: Maximum 10 Weiterleitungen, um Endlos-Schleifen zu vermeiden
- **Progress-Anzeige**: Funktioniert jetzt auch ohne Content-Length Header

---

## [1.5.0] - 2026-03-08

### ✨ Neue Features

#### 💬 Lokale KI-Integration (Ollama)
- **Ollama-Integration**: Vollständig lokale KI ohne Cloud-Abhängigkeit
- **E-Mails zusammenfassen**: Ein-Klick-Zusammenfassung von E-Mail-Inhalten
- **Antwort-Vorschläge**: KI generiert Antwort-Entwürfe basierend auf Original-E-Mail
- **Textverbesserung**: Texte verbessern, kürzen, förmlicher oder freundlicher gestalten
- **KI-Chatbot Widget**: Schwebendes Chat-Panel (rechts unten) für direkte Fragen
- **Streaming-Antworten**: Echtzeit-Typing-Animation bei KI-Antworten
- **Chat-Historie**: Gespräche werden gespeichert (letzte 50 Nachrichten)

#### ⚙️ KI-Einstellungen
- **Neue Einstellungsseite**: "KI-Assistent" Tab in Einstellungen
- **Ollama-Status**: Anzeige ob Ollama läuft und verfügbar ist
- **Modell-Verwaltung**: Installierte Modelle anzeigen, aktives Modell wechseln
- **Modelle installieren**: Download neuer Modelle mit Fortschrittsanzeige
- **Modelle löschen**: Nicht mehr benötigte Modelle entfernen
- **Empfohlene Modelle**: Liste von empfohlenen Modellen (llama3.2:1b, mistral:7b, etc.)
- **Benutzerdefinierte Modelle**: Jedes Ollama-Modell installierbar

#### 📧 KI in E-Mails
- **Zusammenfassen-Button**: In E-Mail-Ansicht, zeigt Zusammenfassung oberhalb des Inhalts
- **KI-Assistent Panel**: In Compose-Ansicht, seitliches Panel mit KI-Aktionen
- **Antwort vorschlagen**: Generiert Antwort-Entwurf bei Reply
- **Text verbessern**: Verbesserung des geschriebenen Textes
- **Kürzen**: Text prägnanter formulieren
- **Förmlicher**: Geschäftlichen Ton verstärken
- **Freundlicher**: Lockeren, freundlichen Ton verwenden
- **Übernehmen**: KI-Vorschlag direkt in Text übernehmen

### 📥 Erweiterter Installer
- **Ollama-Installation**: Automatische Installation von Ollama (optional)
- **Modell-Download**: Standard-Modell (llama3.2:1b) installieren (optional)
- **Interaktive Prompts**: Benutzer wird gefragt, ob KI-Funktionen installiert werden sollen

### 🔧 Technisch

- Neuer `OllamaContext` für KI-State-Management
- API-Integration mit Ollama REST API (localhost:11434)
- Streaming-Response-Unterstützung für Typing-Effekt
- ChatWidget Komponente mit modernem Design
- OllamaSettings Komponente für Modell-Verwaltung
- Integration in EmailView und ComposeEmail

### 💡 Wichtig

- **Ollama ist optional**: App funktioniert vollständig ohne Ollama
- **Keine Cloud**: Alle KI-Operationen laufen lokal auf dem Computer
- **Datenschutz**: Keine E-Mail-Daten werden an externe Server gesendet
- **Ressourcen**: Empfohlen mindestens 4 GB RAM für KI-Funktionen

---

## [1.4.0] - 2026-03-08

### ✨ Neue Features

#### 📐 Individualisierbare Sidebar
- **Resize-Handle**: Sidebar-Breite durch Ziehen am rechten Rand anpassen
- **Min/Max-Breite**: Einstellbarer Bereich von 200px bis 400px
- **Icons-Only-Modus**: Kompakte Ansicht nur mit Icons
- **Auto-Collapse**: Automatisches Minimieren bei kleinen Fenstern
- **Neue Einstellungsseite**: Sidebar-Einstellungen unter Einstellungen → Sidebar
- **Persistente Einstellungen**: Werden beim Neustart wiederhergestellt

#### 📊 Widget-Dashboard
- **4 Widget-Typen**:
  - Konto-Widget: Einzelnes E-Mail-Konto mit Statistiken und Schnellzugriff
  - Kategorie-Widget: Übersicht einer Kategorie mit allen Konten
  - Statistik-Widget: Gesamtstatistiken aller Konten
  - Schnellaktionen-Widget: Schnellzugriff auf häufige Aktionen
- **Drag & Drop**: Widgets im Grid per Drag & Drop verschieben
- **3 Größen**: Klein (S), Mittel (M), Groß (L) pro Widget einstellbar
- **Bearbeitungsmodus**: Dashboard mit visuellen Hinweisen bearbeiten
- **Widget hinzufügen**: Modal zum Auswählen und Konfigurieren neuer Widgets
- **Persistentes Layout**: Widget-Positionen und -Größen werden gespeichert

### 🔧 Technisch

- Neuer `SidebarContext` für Sidebar-Einstellungen
- Neuer `DashboardContext` für Widget-Verwaltung
- Integration von `react-grid-layout` für Drag & Drop
- Modulare Widget-Komponenten unter `src/components/widgets/`
- Smooth Resize-Animation für Sidebar

### 📦 Dependencies

- `react-grid-layout` hinzugefügt für Dashboard-Grid

---

## [1.3.1] - 2026-03-08

### 🐛 Bugfixes

- **Versions-Anzeige korrigiert**: Die Version wird jetzt überall korrekt angezeigt
  - SidebarV2: Version dynamisch aus package.json geladen statt hardcodiert
  - UpdateSettings: Aktuelle Version wird beim Start geladen
  - Keine hardcodierten Versionen mehr im UI

### 🔧 Technisch

- SidebarV2 nutzt jetzt `useEffect` zum dynamischen Laden der Version
- UpdateSettings hat separaten State für `currentVersion`
- Alle Komponenten nutzen `window.electronAPI.getVersion()`

---

## [1.3.0] - 2026-03-08

### ✨ Neue Features

#### 🎨 3 Neue Themes
- **Morphismus Theme**: Glasmorphismus-Effekte mit weichen Schatten, Backdrop-Blur, transparente Karten und Cyan/Lila Farbverläufe
- **Glas Theme**: Starke Transparenz- und Blur-Effekte, minimalistisch mit hellen Akzenten
- **Retro Theme**: 80er/90er Neon-Design mit Pink, Cyan und Gelb, Glow-Effekte und optionale Scanlines

#### 📎 Verbesserte Anhang-Verwaltung
- **Drag & Drop**: Dateien direkt ins Compose-Fenster ziehen
- **Upload-Fortschrittsanzeige**: Animierter Fortschrittsbalken für jeden Anhang
- **Mehrere Anhänge gleichzeitig**: Unterstützung für Batch-Uploads
- **Visuelle Feedback**: Drop-Zone-Overlay beim Ziehen von Dateien
- **CC/BCC-Felder**: Erweiterte Empfänger-Felder im Compose

#### ✍️ Erweiterte Signatur-Verwaltung
- **6 Vorlagen**: Einfach, Professionell, Business, Freundlich, Minimal, Modern
- **Platzhalter-System**: Name, E-Mail, Datum, Firma, Telefon automatisch einfügen
- **Verbesserte Toolbar**: Mehr Formatierungsoptionen
- **Statusanzeige**: Grüner Haken bei Konten mit aktiver Signatur

#### 🔄 Verbesserte Update-Funktion
- Automatische tägliche Update-Prüfung
- Benachrichtigung bei verfügbarem Update beim App-Start
- Verbesserte Fehlerbehandlung

### 🎨 Verbesserungen

- **Theme-Auswahl**: Alle 6 Themes mit Vorschau in Einstellungen
- **Changelog in App**: Aktualisiert mit v1.3.0 Features
- **CSS-Erweiterungen**: Neue Utility-Klassen für Glow- und Neon-Effekte
- **Tailwind-Konfiguration**: Erweitert um Neon-Farben und Animationen

### 🔧 Technisch

- Version auf 1.3.0 erhöht
- ThemeContext mit 6 Themes erweitert
- Neue CSS-Klassen für Theme-Effekte
- Verbesserte Drag & Drop API Integration
- Erweiterte Attachment-State-Verwaltung

---

## [1.2.2] - 2026-03-08

### 🎨 Verbesserungen

- **Neues professionelles App-Icon**: Modernes E-Mail-Design mit Cyan-Akzenten
- **Icon in allen Größen**: 32x32, 64x64, 128x128, 256x256, 512x512
- **Icon-Anzeige korrigiert**: Icon wird jetzt korrekt in Desktop-Umgebung angezeigt

### 🔧 Technisch

- **Version dynamisch**: Version wird jetzt aus package.json gelesen
- **Versionanzeige korrigiert**: Settings zeigen jetzt die korrekte Version

---

## [1.2.1] - 2026-03-08

### 🐛 Bugfixes

- **Scrolling in E-Mail-Liste**: Behoben - E-Mail-Liste scrollt jetzt korrekt wenn viele Mails vorhanden sind
- **Scrolling in E-Mail-Vorschau**: Behoben - Lange E-Mails können jetzt in der Split-View gescrollt werden
- **Layout-Optimierung**: overflow-hidden auf Container-Elementen für korrektes Flexbox-Scrolling

---

## [1.2.0] - 2026-03-08

### ✨ Neue Features

#### 🔄 Update-Funktion
- Automatische Prüfung auf neue Versionen beim App-Start
- Manuelle Update-Prüfung in Einstellungen → Updates
- Download neuer Versionen direkt in der App
- Ein-Klick-Installation von Updates
- Anzeige von Release Notes
- Einstellung für Auto-Update-Check

#### 🔔 Desktop-Benachrichtigungen
- Benachrichtigungen bei neuen E-Mails
- Titel zeigt Absendername
- Body zeigt Betreff
- Klick auf Benachrichtigung öffnet E-Mail
- Konfigurierbar pro Konto
- Konfigurierbar pro Kategorie
- Sound ein/ausschaltbar
- Badge-Counter für ungelesene E-Mails

#### 📎 Verbesserte Anhang-Verwaltung
- Bildvorschau direkt in E-Mail-Ansicht
- PDF-Vorschau (erste Seite)
- "Alle Anhänge herunterladen" Button
- Download-Fortschritt pro Anhang
- Konfigurierbarer Standard-Download-Ordner
- Anhang-Liste mit Dateiname, Größe, Typ
- Download-Button pro Anhang
- Vorschau-Button für unterstützte Formate
- Öffnen mit Standard-App

#### ✍️ E-Mail-Signaturen
- Signatur-Editor pro Konto
- Rich-Text-Editor mit Formatierung:
  - Fett, Kursiv, Unterstrichen
  - Textausrichtung
  - Schriftgröße
  - Textfarbe
  - Links einfügen
  - Bilder einfügen
- Vorlagen für schnelle Einrichtung
- Signatur-Vorschau in Compose
- "Signatur verwenden" Checkbox
- Automatisches Anhängen beim Senden

### 🎨 Verbesserungen

- Neues App-Icon in mehreren Auflösungen (32, 64, 128, 256, 512px)
- Verbessertes Icon in Taskbar und Fenster
- Erweiterte Einstellungen mit Tab-Navigation
- Verbesserte Fehlerbehandlung

### 🔧 Technisch

- Version auf 1.2.0 erhöht
- Neue IPC-Handler für Updates, Benachrichtigungen, Signaturen
- Electron Notification API Integration
- GitHub Releases API für Updates
- Modulare Settings-Komponenten
- Verbesserte Anhang-Download-Logik

---

## [1.1.0] - 2026-03-07

### ✨ Neue Features

#### 👥 Multi-Account-Support
- Mehrere E-Mail-Konten verwalten
- Schneller Kontowechsel in der Sidebar
- Kontostatistiken im Dashboard

#### 📁 Kategorien
- Konten in Kategorien organisieren
- Vordefinierte Kategorien: Arbeit, Privat, Sonstiges
- Eigene Kategorien erstellen
- Farbkodierung pro Kategorie

#### 🎨 Themes
- 3 Themes verfügbar: Dark, Light, Minimal
- Theme-Auswahl in Einstellungen
- Persistente Theme-Speicherung

#### 📊 Dashboard
- Übersicht über alle Konten
- E-Mail-Statistiken
- Schnellzugriff auf Postfächer

### 🔧 Technisch

- AccountContext für Multi-Account-State
- ThemeContext für Theme-Verwaltung
- SidebarV2 mit Kategorien
- Rückwärtskompatibilität mit v1.0 Einstellungen

---

## [1.0.0] - 2026-03-06

### 🎉 Erste Version

#### 📧 E-Mail-Funktionen
- E-Mails empfangen (IMAP)
- E-Mails senden (SMTP)
- E-Mail-Vorschau
- Anhänge herunterladen

#### ⚙️ Einstellungen
- IMAP-Konfiguration
- SMTP-Konfiguration
- Verbindungstest

#### 🔒 Sicherheit
- Verschlüsselte Passwort-Speicherung
- electron-store mit Verschlüsselung

#### 🎨 Design
- Dunkles Theme
- Cyan-Akzentfarbe
- Minimalistisches Interface

---

## Geplant für zukünftige Versionen

- [ ] E-Mail-Suche
- [ ] Ordner-Verwaltung (Sent, Drafts, Trash)
- [ ] E-Mail-Labels/Tags
- [ ] Kontakte-Verwaltung
- [ ] Kalender-Integration
- [ ] Offline-Modus
- [ ] Mehrsprachigkeit
- [ ] Keyboard Shortcuts erweitern
- [ ] E-Mail-Regeln/Filter
- [ ] Verschlüsselung (PGP/GPG)