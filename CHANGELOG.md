# Changelog

Alle wichtigen Änderungen an CoreMail Desktop werden in dieser Datei dokumentiert.

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

#### 🤖 Lokale KI-Integration (Ollama)
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