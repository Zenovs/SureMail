# Changelog

Alle wichtigen Änderungen an CoreMail Desktop werden in dieser Datei dokumentiert.

## [2.7.5] - 2026-03-15

### Bugfix: Lollipop Theme in Einstellungen anzeigen

- `themeOptions` in SettingsV2.js war hardcodiert — Lollipop fehlte in der Auswahlliste
- Lollipop-Eintrag mit bunter Vorschau (5 farbige Kreise) hinzugefügt

---

## [2.7.4] - 2026-03-15

### Bugfix: Update-System vollständig korrigiert

**Wurzelfehler gefunden und behoben:**

- **Problem 1 – Kein AppImage in Release**: `checkForUpdates` lieferte früher immer eine Download-URL, auch wenn kein AppImage-Asset im Release vorhanden war. Die Funktion fiel auf `release.html_url` (eine HTML-Seite) zurück → die App lud eine HTML-Seite herunter und versuchte sie als AppImage zu installieren.
  - **Fix**: Update wird jetzt nur als verfügbar markiert, wenn ein echtes `.appimage`-Asset im Release existiert.

- **Problem 2 – Keine Validierung beim Install**: Der Install-Code prüfte nur ob die Datei > 1000 Bytes ist. Eine HTML-Seite besteht diesen Test leicht.
  - **Fix 1**: Mindestgröße auf 1 MB erhöht (AppImages sind typisch 80+ MB).
  - **Fix 2**: ELF-Magic-Bytes werden geprüft (`0x7f 0x45 0x4c 0x46`). Nur echte Linux-Executables werden installiert.
  - **Fix 3**: Bei Fehler wird eine klare Meldung angezeigt statt still zu scheitern.

- **Problem 3 – ETXTBSY beim Ersetzen**: Direkte Überschreibung einer laufenden Datei schlägt auf Linux fehl.
  - **Fix**: Temp-Datei schreiben → alte Datei löschen (laufender Prozess behält Inode) → atomar umbenennen.

---

## [2.7.3] - 2026-03-15

### Bugfix: ETXTBSY beim Update-Install behoben

- **Kernproblem**: Linux verbietet das direkte Überschreiben einer laufenden Datei (`ETXTBSY` - Text file busy)
- **Fix**: Update schreibt neue Datei zuerst als `.new`-Tempfile, löscht danach die alte Datei (laufender Prozess behält seinen Inode-Handle), benennt die neue Datei atomar um
- Fallback: Falls `APPIMAGE`-Umgebungsvariable nicht gesetzt ist, wird `~/.local/bin/coremail-desktop` direkt verwendet

---

## [2.7.2] - 2026-03-15

### Bugfix: SyntaxError in Update-Installation

- **Fix**: `const currentAppImage` war doppelt deklariert → SyntaxError → Install-Funktion crashte → alte Version blieb aktiv
- Update ersetzt nun die AppImage-Datei korrekt und dauerhaft

---

## [2.7.1] - 2026-03-15

### Bugfix: Update-Installation dauerhaft

- **Fix Update-Persistenz**: Nach einem Update wird die AppImage-Datei nun dauerhaft ersetzt — die neue Version bleibt auch nach manuellem Neustart erhalten
- Vorher: neue Version lief nur einmalig aus dem Downloads-Ordner, beim nächsten Start öffnete sich die alte Datei

---

## [2.7.0] - 2026-03-15

### Lollipop Theme - Farbenfrohes Candy-Design

#### Neue Features

- **Lollipop Theme**
  - Komplett neues, farbenfrohes Theme im Candy-/Lollipop-Stil
  - Heller, pastelliger Hintergrund in zartem Pink (#FFF0F7)
  - Bunter Regenbogen-Verlauf im Sidebar (Pink → Lila → Blau → Türkis)
  - Animierter Regenbogen-Text-Effekt (`lollipop-rainbow-text`)
  - Akzentfarben: Pink (#FF4D8B), Lila (#BD4CFF), Gelb (#FFD60A), Grün (#00CC88), Orange (#FF7F50), Blau (#4DAFFF)
  - Farbige Karten-Schatten in Pink und Lila
  - Bunter Lollipop-Scrollbar (Verlauf Pink → Lila)
  - Candy-Fokus-Ring mit mehrschichtigem Farbverlauf
  - Bunter Trennstrich mit Regenbogen-Gradient
  - 21 neue Tailwind-Farb-Tokens unter `lollipop.*`

---

## [2.6.0] - 2026-03-15

### Manuelle Mail-Kategorisierung mit Absender-Lernen

Dieses Feature-Release fügt ein leistungsstarkes System zur manuellen E-Mail-Kategorisierung hinzu, das Absender automatisch lernt.

#### Neue Features

- **Manuelle E-Mail-Kategorisierung**
  - Neue Kategorisierungs-Buttons in der E-Mail-Vorschau
  - 4 Kategorien: 📢 Werbung, 🚫 Spam, ⚠️ Schädlich, 🦠 Virus
  - Visuelle Feedback mit farbigen Buttons
  - Ein-Klick-Kategorisierung direkt beim Lesen

- **Absender-Lernen (Sender Learning)**
  - Absender werden automatisch gespeichert wenn eine E-Mail kategorisiert wird
  - Zukünftige E-Mails vom gleichen Absender werden automatisch kategorisiert
  - Re-Kategorisierung möglich: Neue Kategorie überschreibt alte
  - Persistente Speicherung (überlebt App-Neustart)

- **Absender-Verwaltung (Einstellungen → Absender)**
  - Übersicht aller gelernten Absender
  - Statistiken pro Kategorie
  - Suche und Filterung nach Kategorie
  - Kategorie ändern per Dropdown
  - Einzelne Absender oder alle löschen
  - Export/Import der Absender-Kategorien (JSON)

- **Verbesserte Kategorisierung**
  - Manuelle Kategorisierung hat Vorrang vor automatischer Spam-Erkennung
  - Sender-basierte Kategorien werden sofort auf alle E-Mails angewendet
  - Zähler in Inbox-Unterordnern berücksichtigen manuelle Kategorien

#### Technische Änderungen

- **Neue Dateien:**
  - `src/services/SenderCategoryManager.js` - Singleton für Absender-Kategorien-Management
  - `src/pages/SenderManagement.js` - Einstellungsseite für Absender-Verwaltung

- **Geänderte Dateien:**
  - `src/pages/InboxSplitView.js`:
    - Import von SenderCategoryManager
    - Neue `CategoryButtons` Komponente
    - `handleCategorize` Handler für manuelle Kategorisierung
    - `getEmailCategory` für effektive Kategorie (manuell > automatisch)
    - Aktualisierte `categoryCounts` und `filteredEmails` für manuelle Kategorien
  - `src/pages/SettingsV2.js`:
    - Neuer Tab "Absender" mit SenderManagement-Komponente

#### API

**SenderCategoryManager:**
- `setSenderCategory(email, category)` - Setzt Kategorie für Absender
- `getSenderCategory(email)` - Holt Kategorie für Absender
- `getAllSenders()` - Liste aller kategorisierten Absender
- `getStats()` - Statistiken nach Kategorie
- `removeSender(email)` - Entfernt Absender
- `export()` / `import(data)` - Backup-Funktionen

---

## [2.4.2] - 2026-03-15

### Neue Server-Vorlagen: Hostpoint & Bluewin

#### Hinzugefügt
- **Hostpoint Mail-Server-Vorlage**
  - IMAP: `imap.mail.hostpoint.ch` (Port 993, SSL/TLS)
  - SMTP: `asmtp.mail.hostpoint.ch` (Port 465, SSL/TLS)
  - Schweizer Hosting-Anbieter mit automatischem Benutzername-Ausfüllen
  - Icon: 🇨🇭

- **Bluewin (Swisscom) Mail-Server-Vorlage**
  - IMAP: `imaps.bluewin.ch` (Port 993, SSL/TLS)
  - SMTP: `smtpauths.bluewin.ch` (Port 465, SSL/TLS)
  - Swisscom Bluewin Mail mit automatischem Benutzername-Ausfüllen
  - Icon: 📶

#### Technische Änderungen
- `src/pages/AccountManager.js`:
  - Neue Einträge in `SERVER_PRESETS` Array
  - `autoFillUsername: true` für beide Anbieter
  - Hilfreiche Hinweise zur Benutzername-Konfiguration

---

## [2.4.1] - 2026-03-15

### Bugfix Release: Icon-Transparenz und Stabilität

#### Behoben
- **Icon-Transparenz**: Alle Icons haben jetzt korrekten transparenten Hintergrund
  - Entfernung des grau/weißen karierten Hintergrunds
  - Alle Icons (16px bis 512px) wurden neu generiert
  - Theme-Icons ebenfalls mit Transparenz aktualisiert
  - Notification-Icons mit korrektem Alpha-Kanal

- **Fenster-Stabilität**: Verbesserte Fehlerbehandlung beim App-Start
  - Automatische Wiederherstellung bei Render-Prozess-Absturz
  - Verbesserte Fehlerprotokollierung für Debugging
  - Responsive/Unresponsive-Zustand wird überwacht
  - Klare Fehlermeldung wenn Build-Dateien fehlen

#### Technische Änderungen
- `main.js`:
  - Neue Event-Handler: `did-fail-load`, `did-finish-load`
  - `render-process-gone` Handler mit automatischem Reload
  - `unresponsive`/`responsive` Event-Logging
  - Verbesserte Pfadprüfung für Production-Build
- Alle PNG-Icons zu RGBA konvertiert mit korrektem Alpha-Kanal
- `assets/` und `public/icons/` synchronisiert

---

## [2.4.0] - 2026-03-15

### Feature Release: Inbox-Unterordner mit automatischer Kategorisierung

#### Neue Features
- **Virtuelle Inbox-Unterordner**: E-Mails werden automatisch kategorisiert und können nach Kategorie gefiltert werden
  - 📢 **Werbung**: Marketing-Mails und Newsletter (Orange)
  - 🚫 **Spam**: Unerwünschte E-Mails (Rot)
  - ⚠️ **Schädlich**: Phishing-Versuche und verdächtige Mails (Gelb)
  - 🦠 **Virus**: E-Mails mit gefährlichen Anhängen (Lila)

- **Ausklappbare Ordner-Struktur**: 
  - Posteingang (alle E-Mails)
    - └ Werbung (nur Werbe-Mails)
    - └ Spam (nur Spam)
    - └ Schädlich (nur schädliche E-Mails)
    - └ Virus (nur Virus-E-Mails)

- **Kategorie-Filter**: 
  - Klick auf Unterordner filtert E-Mails nach Kategorie
  - Anzeige der Anzahl pro Kategorie als Badge
  - Aktiver Filter wird im Header angezeigt mit "×" zum Entfernen
  - Leerer Zustand mit "Alle E-Mails anzeigen" Button

- **Automatische Kategorisierung**:
  - Basierend auf dem bestehenden Spam-Filter (v1.14.0)
  - Kategorisierung durch Betreff-, Absender- und Inhaltsanalyse
  - Regelbasierte Erkennung von Werbung, Spam, Phishing und Viren

#### UI-Verbesserungen
- Expand/Collapse Button für INBOX-Unterordner (▼/▶)
- Farbcodierte Kategorie-Badges
- Smooth Transitions bei Filterwechsel
- Anzeige von "X E-Mails (von Y gesamt)" bei aktivem Filter

#### Technische Änderungen
- `src/pages/InboxSplitView.js`:
  - Neue INBOX_SUBFOLDERS Konstante mit Kategorie-Definitionen
  - `categoryFilter` und `inboxExpanded` States
  - `categoryCounts` useMemo für Kategorie-Zähler
  - `filteredEmails` useMemo für gefilterte E-Mail-Liste
  - Aktualisierte handleSelectEmail, handleSelectAll für filteredEmails
  - Reset der Auswahl bei Filterwechsel
- Neue Lucide-Icons: ChevronDown, ChevronRight, Megaphone, Ban, ShieldAlert, Bug

---

## [2.3.1] - 2026-03-15

### Bugfix Release: IMAP-Fetch-Problem behoben

#### Behoben
- **Alle E-Mails werden jetzt geladen**: Das bisherige Limit von 50 E-Mails wurde entfernt
  - E-Mails wurden vorher nur teilweise heruntergeladen (max. 50)
  - Neue E-Mails erschienen erst nach dem Löschen alter E-Mails
  - Jetzt werden ALLE E-Mails im Posteingang vollständig geladen

#### Technische Änderungen
- `main.js`: `imap:fetchEmailsForAccount` - Standard-Limit von 50 auf 0 (unbegrenzt) geändert
- `main.js`: `imap:fetchEmailsFromFolder` - Standard-Limit von 50 auf 0 (unbegrenzt) geändert
- `main.js`: `imap:fetchEmails` (Legacy) - Standard-Limit von 50 auf 0 (unbegrenzt) geändert
- Neue Logik: `limit = 0` bedeutet "alle E-Mails laden"
- `hasMore` gibt korrekt `false` zurück wenn alle E-Mails geladen wurden

---

## [2.3.0] - 2026-03-15

### Feature Release: Multi-Select & Bulk Delete, Icon-Fixes

#### Neue Features
- **Multi-Select für E-Mails**: Mehrere E-Mails können nun gleichzeitig ausgewählt werden
  - Checkbox in jeder E-Mail-Zeile (über den Mehrfachauswahl-Button aktivierbar)
  - "Alle auswählen" / "Keine" Button im Header
  - Shift+Klick für Bereichsauswahl
  - Ctrl/Cmd+A wählt alle E-Mails aus
  - Ausgewählte E-Mails werden visuell hervorgehoben
  
- **Bulk Delete (Massenlöschung)**: Ausgewählte E-Mails können mit einem Klick gelöscht werden
  - "Löschen (X)" Button erscheint wenn E-Mails ausgewählt sind
  - Bestätigungs-Dialog vor dem Löschen
  - Fortschrittsanzeige während des Löschens
  - Escape zum Abbrechen der Auswahl
  - Delete-Taste löscht ausgewählte E-Mails

#### Behoben
- **Icon-Problem behoben**: Icons werden nun korrekt in gepackten Apps angezeigt
  - Verbesserte Pfadauflösung für Theme-Icons
  - Unterstützung für verschiedene Paketierungsmethoden (asar, unpacked)
  - Fallback-Mechanismus für fehlende Icons

- **Benachrichtigungs-Icon mit transparentem Hintergrund**
  - Neues `notification.png` Icon ohne Hintergrund
  - Benachrichtigungen verwenden nun das transparente Icon
  - Icons in verschiedenen Größen (32px - 512px)

#### Technische Änderungen
- `src/pages/InboxSplitView.js`: Multi-Select & Bulk Delete Funktionalität
- `main.js`: Verbesserte `getIconPath()` und `getIconPathForTheme()` Funktionen
- `main.js`: Neue `getNotificationIconPath()` Funktion
- `assets/notification.png`: Neues Benachrichtigungs-Icon mit Transparenz

---

## [2.2.3] - 2026-03-15

### Bugfix: Theme-Icon-Transparenz-Fix

#### Behoben
- **light.png und retro.png**: Konvertiert von RGB zu RGBA-Format
- **Alpha-Kanal hinzugefügt**: Beide Theme-Icons haben nun Transparenz in den Ecken
- **Konsistenz**: Alle Theme-Icons in `build/icons/themes/` sind nun RGBA mit ca. 24% Eckenradius

#### Technische Änderungen
- `build/icons/themes/light.png`: Von RGB zu RGBA konvertiert, runde Ecken mit Transparenz
- `build/icons/themes/retro.png`: Von RGB zu RGBA konvertiert, runde Ecken mit Transparenz

---

## [2.2.2] - 2026-03-15

### Bugfix: Icon-Transparenz und alle Größen

#### Behoben
- **Transparenter Hintergrund**: Alle Icons haben nun 100% transparenten Hintergrund
- **Icon-Probleme behoben**: Schnellsuche, Taskbar und Benachrichtigungen zeigen korrekte Icons
- **Alle Icon-Größen**: 512x512, 256x256, 128x128, 64x64, 32x32, 16x16 erstellt
- **RGBA-Format**: Alle Icons verwenden RGBA mit Alpha-Kanal für echte Transparenz

#### Technische Änderungen
- `public/icon.png`: Icon mit transparentem Hintergrund (RGBA)
- `public/icons/`: Alle Größen mit Transparenz (icon-16.png bis icon-512.png)
- `assets/`: Aktualisierte Build-Assets mit Transparenz
- `public/install-icons.sh`: Neues Script zur manuellen Icon-Installation

---

## [2.2.1] - 2026-03-15

### Bugfix: Desktop-Icon aktualisiert

#### Behoben
- **Desktop-Icon im App-Menü**: Das neue "C"-Icon wird nun korrekt im Schnellstart und App-Menü angezeigt
- Neues Icon (mit "C") als Standard-Icon in `public/icon.png` und `assets/icon.png` gesetzt
- Icon-Größen für alle Plattformen erstellt (512x512, 256x256, 128x128, 64x64, 32x32)

#### Technische Änderungen
- `public/icon.png`: Neues Standard-Icon
- `public/icons/`: Icon in verschiedenen Größen
- `assets/`: Aktualisierte Build-Assets

---

## [2.2.0] - 2026-03-15

### Neues Feature: Dynamische Theme-Icons

#### Hinzugefügt
- **Theme-basierte Icons**: Das App-Icon passt sich automatisch an das gewählte Theme an
- 7 verschiedene Icon-Varianten für alle Themes:
  - **Dark**: Dunkelblau-Variante
  - **Light**: Original Blau-Türkis
  - **Minimal**: Grau/Weiß-Version
  - **Morphismus**: Lila-Pink
  - **Glas**: Cyan/Hellblau
  - **Retro**: Synthwave Neon
  - **Foundations**: Orange-Rot
- Icons wechseln automatisch beim Theme-Wechsel
- Icons werden beim App-Start basierend auf gespeichertem Theme geladen

#### Technische Änderungen
- `main.js`: Neue IPC-Handler für Theme-Icon-Management (`theme:setIcon`, `theme:getAvailableIcons`)
- `preload.js`: Neue API-Methoden (`setThemeIcon`, `getAvailableThemeIcons`)
- `ThemeContext.js`: Automatische Icon-Aktualisierung bei Theme-Änderung
- Neue Icons in `/public/icons/themes/`
- `package.json`: Version auf 2.2.0 aktualisiert

---

## [2.1.0] - 2026-03-15

### Neues Feature: Anzeigename für E-Mail-Versand

#### Hinzugefügt
- **Anzeigename pro Konto**: Für jedes E-Mail-Konto kann ein eigener Absendername festgelegt werden
- Neues Feld "Anzeigename (für ausgehende E-Mails)" in der Konto-Konfiguration
- SMTP "from" wird als `"Anzeigename" <email@beispiel.ch>` formatiert
- Anzeige des Anzeigenamens in der Seitenleiste, Kontoliste und E-Mail-Composer
- Anzeigename ist optional – falls leer, wird nur die E-Mail-Adresse verwendet
- Validierung: Maximal 100 Zeichen, SMTP-sichere Zeichenbereinigung

#### Behoben
- Fehlende Helper-Funktionen `getImapConfigForAccount` und `getSmtpTransporterForAccount` wiederhergestellt

#### Technische Änderungen
- `AccountManager.js`: Neues `displayName`-Feld im Formular und Datenmodell
- `main.js`: Helper-Funktionen für IMAP/SMTP-Konfiguration hinzugefügt, Anzeigename-Formatierung im SMTP-Versand
- `ComposeEmail.js`: "Von:"-Anzeige mit Anzeigenamen
- `SidebarV2.js`: Anzeigename in der Kontoliste
- `package.json`: Version auf 2.1.0 aktualisiert

---

## [2.0.0] - 2026-03-13

### ⚠️ BREAKING CHANGE: OAuth2/Microsoft-Integration entfernt

Diese Version ist ein **Major Release** mit einer grundlegenden Änderung: Die OAuth2-Authentifizierung für Microsoft 365/Exchange wurde vollständig entfernt. CoreMail Desktop ist jetzt ein reiner **IMAP/SMTP E-Mail-Client**.

#### ❌ Entfernte Features
- **OAuth2-Authentifizierung** für Microsoft 365/Exchange/Outlook
- **"Mit Microsoft anmelden" Button** in der Kontenverwaltung
- **Azure AD App-Registrierung Support** (Custom Client-ID)
- **OAuth2-Token-Verwaltung** (Refresh, Revoke)
- **Microsoft Quick Setup** Modal
- **MicrosoftAppPasswordHelp** Komponente
- **XOAUTH2 für IMAP/SMTP**

#### ✅ Was bleibt
- **IMAP/SMTP-Authentifizierung** für alle Provider
- **App-Passwort-Support** für Microsoft, Gmail, iCloud, Yahoo
- **Server-Vorlagen** (Gmail, Outlook, Yahoo, GMX, WEB.DE, IONOS)
- **Automatische Updates** (v1.16.0)
- **Spam-Filter** (v1.14.0)
- **Globale Suche** (v1.13.0)
- **Alle anderen Features** (KI, Themes, Dashboard, etc.)

#### 💡 Gründe für diese Änderung
| Grund | Beschreibung |
|-------|--------------|
| **Einfachheit** | IMAP/SMTP ist universell und einfacher einzurichten |
| **Zuverlässigkeit** | Keine OAuth2-Token-Refresh-Probleme mehr |
| **Weniger Abhängigkeiten** | Keine Microsoft-API oder Azure AD erforderlich |
| **Admin-Consent-Probleme** | OAuth2 erfordert oft IT-Admin-Genehmigung |
| **Fokus** | Konzentration auf stabile, funktionierende Features |

#### 🔧 Technische Änderungen
- **main.js**: OAuth2-Funktionen entfernt (startMicrosoftOAuth, exchangeCodeForTokens, refreshOAuthTokens, etc.)
- **main.js**: getImapConfigForAccount/getSmtpTransporterForAccount vereinfacht (nur noch Passwort-Auth)
- **main.js**: OAuth2-IPC-Handler entfernt (oauth2:startMicrosoft, oauth2:refreshToken, etc.)
- **preload.js**: OAuth2-API entfernt
- **AccountManager.js**: Komplett überarbeitet, nur noch IMAP/SMTP
- **package.json**: Version 2.0.0
- **README.md**: Dokumentation aktualisiert

#### 📧 Microsoft-Konten einrichten (jetzt)
1. Gehe zu [account.microsoft.com/security](https://account.microsoft.com/security)
2. Erstelle ein App-Passwort (unter "Erweiterte Sicherheitsoptionen")
3. Verwende das App-Passwort in CoreMail mit der Vorlage "Microsoft 365 / Outlook"

#### ⚠️ Migration von v1.x
Wenn du ein Microsoft-Konto mit OAuth2 verwendet hast:
1. Lösche das Konto in der Kontenverwaltung
2. Erstelle ein App-Passwort bei Microsoft
3. Füge das Konto neu mit IMAP/SMTP hinzu

---

## [1.16.0] - 2026-03-13

### 🔄 Neues Feature: Automatische Updates

#### 🚀 Auto-Update-Funktion
- **Automatische Update-Prüfung**: Überprüft alle 24 Stunden auf neue Versionen
- **Ein-Klick-Update**: Download und Installation mit nur einem Klick
- **Ohne Terminal**: Alles direkt im Client, keine Kommandozeile nötig
- **Fortschrittsanzeige**: Zeigt Download-Fortschritt in Echtzeit

#### 📦 Update-Manager (UpdateManager.js)
- **Zentrale Update-Verwaltung**: Singleton-Klasse für Update-Logik
- **Status-Tracking**: Idle, Checking, Downloading, Downloaded, Installing, Error
- **Einstellungen-Persistenz**: Speichert Benutzereinstellungen in localStorage
- **Listener-System**: Reaktive Updates für UI-Komponenten

#### 🔔 Update-Benachrichtigung (UpdateNotification.js)
- **Toast-Notification**: Nicht-aufdringliche Benachrichtigung bei verfügbaren Updates
- **Animiertes Popup**: Slide-up Animation für bessere UX
- **"Später" Button**: Update auf später verschieben
- **"Nicht mehr anzeigen"**: Diese Version überspringen
- **Details anzeigen**: Release-Notes direkt im Popup

#### ⚙️ Erweiterte Update-Einstellungen (UpdateSettings.js)
- **Automatisch prüfen**: An/Aus-Schalter für automatische Prüfung alle 24h
- **Auto-Download**: Updates automatisch im Hintergrund herunterladen
- **Auto-Installation**: Heruntergeladene Updates automatisch installieren
- **Manueller Check**: Button zum sofortigen Prüfen auf Updates
- **Letzte Prüfung**: Zeigt Datum/Uhrzeit der letzten Überprüfung

#### 🔒 Sicherheitsfeatures
- **Automatisches Backup**: Sichert die alte Version vor jedem Update
- **Backup-Verwaltung**: Behält die letzten 3 Backups, ältere werden gelöscht
- **SHA256-Verifizierung**: Hash-Prüfung für Download-Integrität
- **Rollback-Funktion**: Wiederherstellung von Backup möglich
- **Nur GitHub**: Downloads ausschließlich von GitHub Releases

#### 🔧 Technische Details (main.js)
- **update:install** — Erweitert mit Backup-Logik vor Installation
- **update:verifyFile** — Neuer IPC-Handler für SHA256-Hash
- **update:getBackups** — Listet verfügbare Backups auf
- **update:restoreBackup** — Stellt eine Backup-Version wieder her

#### 📡 Preload-API (preload.js)
- `verifyUpdateFile(filePath)` — Überprüft Datei-Integrität
- `getBackups()` — Listet gespeicherte Backups
- `restoreBackup(backupPath)` — Startet Backup-Version

### 📝 Geänderte Dateien
- `src/utils/UpdateManager.js` — NEU: Zentrale Update-Logik
- `src/components/UpdateNotification.js` — NEU: Update-Popup
- `src/pages/UpdateSettings.js` — Komplett überarbeitet
- `src/App.js` — UpdateNotification integriert
- `main.js` — Backup und Verifizierung hinzugefügt
- `preload.js` — Neue IPC-Handler für Updates
- `package.json` — Version auf 1.16.0 aktualisiert
- `CHANGELOG.md` — Diese Einträge hinzugefügt
- `README.md` — Auto-Update dokumentiert

---

## [1.15.0] - 2026-03-13

### ⚡ Neues Feature: Vereinfachte Microsoft-Integration

#### 🚀 Ein-Klick-Setup
- **Neuer "Microsoft hinzufügen" Button**: Prominenter Button in der Kontenverwaltung
- **Schnelleinrichtung-Dialog**: Nur E-Mail-Adresse und App-Passwort eingeben
- **Automatische Konfiguration**: Server, Ports und TLS werden automatisch gesetzt
- **Verbindungstest integriert**: Teste die Verbindung vor dem Speichern

#### 🔍 Automatische Server-Erkennung
- **Microsoft-Domain-Erkennung**: Outlook.com, Hotmail.com, Live.com, MSN.com und internationale Varianten
- **Auto-Preset**: Beim Eingeben einer Microsoft-E-Mail wird automatisch das richtige Preset gewählt
- **Vorausgefüllte Einstellungen**:
  - IMAP: outlook.office365.com:993 (TLS)
  - SMTP: smtp.office365.com:587 (STARTTLS)

#### 📖 App-Passwort-Anleitung
- **Schritt-für-Schritt-Hilfe**: Detaillierte Anleitung zum Erstellen eines App-Passworts
- **Direkte Links**: Verknüpfung zu account.microsoft.com/security
- **Wichtige Hinweise**: Warnung, dass App-Passwort nur einmal angezeigt wird

#### 🎨 UI-Verbesserungen
- **Authentifizierungs-Auswahl**: Klare Unterscheidung zwischen IMAP/SMTP und OAuth2
- **Empfohlene Methode**: IMAP/SMTP mit App-Passwort als "EMPFOHLEN" markiert
- **OAuth2-Warnung**: Hinweis, dass eigene Azure AD App erforderlich ist
- **Konto-Badges**: "App-Passwort" Badge für Microsoft-Konten ohne OAuth2
- **Info-Banner**: Neues Banner in der Kontenverwaltung erklärt die vereinfachte Integration

#### 🔧 Technische Details
- **MicrosoftQuickSetup** Komponente: Neuer Modal-Dialog für Schnelleinrichtung
- **MicrosoftAppPasswordHelp** Komponente: Hilfe-Dialog mit Schritt-für-Schritt-Anleitung
- **isMicrosoftEmail()** Funktion: Erkennt Microsoft-E-Mail-Domains
- **MICROSOFT_DOMAINS** Array: Liste aller unterstützten Microsoft-Domains
- **authMethod** State: Wechsel zwischen 'imap' und 'oauth2'

### 📝 Geänderte Dateien
- `src/pages/AccountManager.js` — Komplette Überarbeitung mit neuen Komponenten
- `package.json` — Version auf 1.15.0 aktualisiert
- `CHANGELOG.md` — Diese Einträge hinzugefügt
- `README.md` — Microsoft-Integration dokumentiert

---

## [1.14.0] - 2026-03-12

### 🛡️ Neues Feature: Intelligenter Spam-Filter

#### 🔍 Spam-Erkennung
- **Automatische Analyse**: Jede E-Mail wird automatisch auf Spam, Werbung, Phishing und Viren analysiert
- **Regel-basierte Erkennung**: Über 100+ Keywords und Patterns für zuverlässige Klassifizierung
- **4 Kategorien**:
  - 📢 **Werbung** (Orange) — Marketing-Mails, Newsletter
  - 🚫 **Spam** (Rot) — Unerwünschte Mails
  - ⚠️ **Schädlich** (Gelb) — Phishing-Versuche, verdächtige Links
  - 🦠 **Virus** (Dunkelrot) — Gefährliche Anhänge (.exe, .scr, .bat, etc.)

#### 🏷️ UI-Integration
- **Spam-Tags**: Farbige Badges neben dem "Neu"-Badge in der E-Mail-Liste
- **Farbige Seitenränder**: Linker Rand der E-Mail wechselt je nach Kategorie die Farbe
- **Warnbanner**: Auffällige Warnung in der E-Mail-Vorschau mit Gründen
- **Sofortige Anzeige**: Tags erscheinen unmittelbar nach dem Laden

#### ⚙️ Einstellungen (neuer Tab in Einstellungen)
- **Aktivieren/Deaktivieren**: Spam-Filter ein- und ausschalten
- **Empfindlichkeit**: Niedrig, Mittel (Standard), Hoch
- **Whitelist**: Vertrauenswürdige Absender (werden nie als Spam markiert)
- **Blacklist**: Blockierte Absender (werden immer als Spam markiert)
- **Tags anzeigen**: Tags in der E-Mail-Liste ein-/ausblenden

#### 🔬 Analyse-Kriterien
- Spam-Keywords (Gewinnspiel, Kredit, Viagra, etc.)
- Verdächtige Domains (.xyz, .top, .click, etc.)
- Phishing-Keywords (Passwort zurücksetzen, Konto gesperrt, etc.)
- Verdächtige Links (Kurz-URLs, Phishing-Domains)
- Gefährliche Anhänge (.exe, .scr, .bat, .cmd, .vbs, etc.)
- Doppelte Dateiendungen (z.B. dokument.pdf.exe)
- HTML-Struktur (viele Bilder, wenig Text)
- Betreff-Analyse (Großbuchstaben, übermäßige Satzzeichen)
- Link-Mismatch (angezeigter Text ≠ tatsächliche URL)

#### 🔧 Backend
- Neue IPC-Handler: `spamfilter:saveSettings`, `spamfilter:loadSettings`, `spamfilter:saveAnalysis`, `spamfilter:loadAnalysis`
- Einstellungen in electron-store und localStorage gespeichert
- Asynchrone Analyse ohne UI-Blockierung

### 📝 Geänderte Dateien
- `src/utils/SpamFilter.js` — Neues Spam-Filter-Modul (erstellt)
- `src/pages/SpamFilterSettings.js` — Einstellungs-Komponente (erstellt)
- `src/pages/InboxSplitView.js` — Spam-Tags, Warnbanner, farbige Ränder
- `src/pages/SettingsV2.js` — Neuer "Spam-Filter" Tab, aktualisierter Changelog
- `main.js` — IPC-Handler für Spam-Filter-Einstellungen
- `preload.js` — Spam-Filter API-Bridge
- `package.json` — Version 1.14.0
- `README.md` — Spam-Filter Dokumentation
- `CHANGELOG.md` — Dieses Changelog

---

## [1.13.2] - 2026-03-12

### 🔧 Neues Feature: Azure AD App-Registrierung Support

#### 🎯 Eigene Azure AD Client-ID
- **Custom Client-ID Eingabe**: Neues Eingabefeld im OAuth2-Panel für benutzerdefinierte Azure AD Client-ID
- **Standard-Fallback**: Wenn keine Client-ID angegeben, wird die Standard-Client-ID (`d3590ed6-52b3-4102-aeff-aad2292ab01c`) verwendet
- **Hilfe-Icon**: "?" Button neben dem Client-ID Feld öffnet In-App Hilfe-Panel
- **In-App Anleitung**: Schritt-für-Schritt Kurzanleitung direkt im UI
- **Sichere Speicherung**: Custom Client-ID wird verschlüsselt mit dem Account gespeichert

#### 🔄 Backend-Anpassungen
- `startMicrosoftOAuth()` akzeptiert optionalen `customClientId` Parameter
- `exchangeCodeForTokens()` verwendet aktive Custom Client-ID
- `refreshOAuthTokens()` unterstützt Custom Client-ID für Token-Refresh
- `getValidAccessToken()` liest Custom Client-ID aus Account-Daten
- IPC-Handler `oauth2:startMicrosoft` leitet Custom Client-ID weiter
- Preload-Bridge aktualisiert für Client-ID Parameter

#### 📖 Dokumentation
- **Neue Datei: `AZURE_AD_SETUP.md`**: Vollständige Schritt-für-Schritt-Anleitung
  - Azure Portal App-Registrierung erstellen
  - Redirect URI konfigurieren
  - API-Berechtigungen (IMAP, SMTP, Graph) hinzufügen
  - Administratorzustimmung erteilen
  - Client-ID in CoreMail eingeben
  - Fehlerbehebung (AADSTS65002, Admin-Consent, redirect_uri)
- **README.md**: Neuer Abschnitt "Microsoft OAuth2 Setup" mit Link zu Dokumentation

### 📝 Geänderte Dateien
- `src/pages/AccountManager.js` - Client-ID Eingabefeld, Hilfe-Panel, HelpCircle Icon
- `main.js` - OAuth2 Custom Client-ID Support in allen Flows
- `preload.js` - Client-ID Parameter in IPC-Bridge
- `AZURE_AD_SETUP.md` - Neue Dokumentation (erstellt)
- `README.md` - v1.13.2 Abschnitt, Microsoft OAuth2 Setup
- `package.json` - Version 1.13.2
- `CHANGELOG.md` - Dieser Eintrag

---

## [1.13.1] - 2026-03-11

### 🔐 Bugfix: Microsoft OAuth2 Admin-Consent Problem

#### 🐛 Problem
- Microsoft 365 OAuth2 zeigte "Administratorgenehmigung erforderlich" Fehlermeldung
- Benutzer in Enterprise-Umgebungen konnten sich nicht anmelden
- Thunderbird-Client-ID erforderte Admin-Consent in strikt konfigurierten M365-Umgebungen

#### ✅ Lösung
- **Client-ID gewechselt**: Von Thunderbird (`08162f7c-0fd2-4200-a84a-f25a4db0b584`) auf Microsoft Office native (`d3590ed6-52b3-4102-aeff-aad2292ab01c`)
- **User-Delegated Permissions**: Keine Admin-Genehmigung mehr erforderlich
- **Verbesserte Kompatibilität**: Funktioniert mit Enterprise Microsoft 365 Umgebungen

### 📝 Geänderte Dateien
- `main.js` - OAuth2-Konfiguration aktualisiert (Client-ID, Kommentare)
- `package.json` - Version 1.13.1
- `README.md` - Dokumentation für v1.13.1
- `CHANGELOG.md` - Dieser Eintrag

---

## [1.13.0] - 2026-03-11

### 🔍 Neues Feature: Globale Suchfunktion

#### 🎯 Präzise Mail-Suche über alle Konten
- **Globale Suche**: Durchsuche alle E-Mail-Konten und Ordner gleichzeitig
- **Schnellzugriff**: `Ctrl+K` oder `Cmd+K` öffnet die Suchleiste
- **Suchleiste in Sidebar**: Prominente Suchleiste direkt in der Navigation
- **IMAP SEARCH**: Nutzt native IMAP-Suchfunktion für präzise Ergebnisse

#### 🎚️ Erweiterte Suchfilter
- **Konto-Filter**: Suche nur in bestimmten Konten
- **Ordner-Filter**: Alle Ordner, Posteingang, Gesendet, Entwürfe, Archiv
- **Datum-Filter**: Von/Bis Datum eingrenzen
- **Status-Filter**: Nur ungelesene, nur markierte Mails
- **Anhang-Filter**: Nur Mails mit Anhängen

#### ⚡ Performance & UX
- **Live-Vorschläge**: Autocomplete während der Eingabe (300ms Debouncing)
- **Highlighting**: Suchbegriff wird in Ergebnissen hervorgehoben
- **Gruppierung**: Ergebnisse nach Konto gruppiert
- **Match-Indikator**: Zeigt wo der Suchbegriff gefunden wurde (Betreff, Absender, Text)
- **Max. 200 Ergebnisse**: Sortiert nach Datum (neueste zuerst)

#### 🎨 Übersichtliche Darstellung
- **Such-Modal**: Elegantes Overlay mit Backdrop-Blur
- **Ergebnis-Preview**: Betreff, Absender, Datum, Vorschau-Text
- **Ordner-Anzeige**: Zeigt in welchem Ordner die Mail liegt
- **Status-Icons**: Gelesen/Ungelesen, Markiert, Mit Anhängen

### 📝 Neue Dateien
- `src/context/SearchContext.js` - State-Management für Suche
- `src/components/GlobalSearch.js` - Such-Modal mit Filtern
- `src/components/SearchResults.js` - Ergebnis-Darstellung

### 📝 Geänderte Dateien
- `main.js` - IMAP-Such-Backend (search:globalSearch, search:quickSearch, search:updateCache)
- `preload.js` - Such-APIs für Renderer
- `src/App.js` - SearchProvider und GlobalSearch Integration
- `src/components/SidebarV2.js` - Suchleiste-Button
- `package.json` - Version 1.13.0
- `README.md` - Dokumentation für v1.13.0
- `CHANGELOG.md` - Dieser Eintrag

---

## [1.12.4] - 2026-03-11

### 💡 UX-Verbesserung: Kategorien-Bearbeitung Navigation

#### 🔍 Problem: Benutzer findet Kategorien-Bearbeitung nicht
- **Symptom**: Benutzer suchte auf der Konten-Seite nach Kategorien-Bearbeitung
- **Ursache**: Keine klare Navigation zur Einstellungen → Kategorien
- **Verwirrung**: Kategorien werden auf Konten-Seite angezeigt, aber dort nicht bearbeitet

#### ✅ Lösung: Klarer Hinweis hinzugefügt
- **Hinweis**: "💡 Kategorien bearbeiten (Name, Farbe, Icon)? → Einstellungen → Kategorien"
- **Position**: Direkt unter den Kategorie-Tags auf der Konten-Seite
- **Styling**: Dezent aber sichtbar mit Accent-Farbe

### 📝 Geänderte Dateien
- `src/pages/AccountManager.js` - Hinweis zur Kategorien-Bearbeitung
- `package.json` - Version 1.12.4
- `README.md` - Dokumentation für v1.12.4
- `CHANGELOG.md` - Dieser Eintrag

---

## [1.12.3] - 2026-03-10

### 🐛 Kritischer Bugfix: Kategorien-Bearbeitung WIRKLICH gefixt

#### ✏️ Problem: Edit-Buttons waren unsichtbar
- **Problem**: Die Edit/Delete-Buttons bei Kategorien waren mit `opacity-0` versteckt
- **Symptom**: Benutzer konnten die Bearbeitungs-Buttons nicht sehen oder anklicken
- **Ursache**: CSS-Klasse `opacity-0 group-hover:opacity-100` versteckte die Buttons
- **Hover funktionierte nicht**: Der Hover-Effekt wurde nie ausgelöst

#### ✅ Lösung: Buttons IMMER sichtbar
- **Fix**: `opacity-0 group-hover:opacity-100` entfernt
- **Neue UI**: Deutlich sichtbare Buttons mit Text "Bearbeiten" und "Löschen"
- **Icons + Text**: Edit2 und Trash2 Icons mit beschreibendem Text
- **Bessere Farben**: Grauer Button für Edit, roter Button für Delete
- **Stabile Position**: `flex-shrink-0` verhindert Layout-Probleme

### 📝 Geänderte Dateien
- `src/pages/CategorySettings.js` - Edit/Delete-Buttons immer sichtbar
- `package.json` - Version 1.12.3
- `README.md` - Dokumentation für v1.12.3
- `CHANGELOG.md` - Dieser Eintrag

---

## [1.12.2] - 2026-03-10

### 🆕 Neue Funktionen

#### 📏 Mail-Liste-Spalte resizable
- **Feature**: Die mittlere Spalte (Mail-Liste) ist jetzt resizable
- **Min-Breite**: 100px - Spalte kann sehr schmal gemacht werden
- **Max-Breite**: 600px - Maximale Breite für optimale Lesbarkeit
- **Speicherung**: Breite wird in `localStorage` unter `inbox.emailListColumnWidth` gespeichert

#### 📝 Text-Wrapping aktiviert
- **Feature**: Text in Mail-Items wird jetzt umgebrochen statt abgeschnitten
- **Betreff**: Lange Betreffzeilen werden vollständig angezeigt
- **Absender**: E-Mail-Adressen werden umgebrochen
- **Vorschau**: Preview-Text passt sich der Spaltenbreite an

#### 📐 Dynamische Höhe für Mail-Items
- **Feature**: Mail-Items passen ihre Höhe dem Inhalt an
- **min-height**: 60px Mindesthöhe für konsistentes Aussehen
- **CSS-Eigenschaften**: `overflow-wrap: break-word`, `word-break: break-word`

### 📝 Geänderte Dateien
- `src/pages/InboxSplitView.js` - Email-Liste resizable mit Konstanten, Text-Wrapping in EmailListItem
- `package.json` - Version 1.12.2
- `README.md` - Dokumentation für v1.12.2
- `CHANGELOG.md` - Dieser Eintrag

---

## [1.12.1] - 2026-03-10

### 🐛 Kritische Bugfixes

#### 🗑️ Bug 1: Gelöschte E-Mails werden wieder abgerufen
- **Problem**: Nach dem Löschen und Refresh erschienen gelöschte E-Mails wieder
- **Ursache**: IndexedDB wurde nicht aktualisiert, nur Memory-Cache
- **Fix**: `removeEmailFromIndexedDB()` Funktion hinzugefügt
- **Geändert**: `src/pages/InboxSplitView.js` - handleDelete ruft jetzt IndexedDB-Sync auf

#### 🔐 Bug 2: Microsoft Auth funktioniert nicht richtig
- **Problem**: OAuth2-Verbindung zu Microsoft 365 schlug fehl
- **Ursache**: Falsche TLS-Einstellungen und zu kurzes Timeout
- **Fix**: IMAP-Konfiguration korrigiert mit `tlsOptions` und 30s Timeout
- **Geändert**: `main.js` - getImapConfigForAccount() verbessert

#### 🔤 Bug 3: Schriftart wird nicht übernommen
- **Problem**: Benutzerdefinierte Fonts wurden nicht angewendet
- **Ursache**: `* { font-family: 'JetBrains Mono' }` überschrieb alles
- **Fix**: Entfernte globale Font-Regel, Font wird jetzt dynamisch via JS gesetzt
- **Geändert**: `src/styles/index.css` - Entfernte hartcodierte Font-Family

#### ✏️ Bug 4: Kategorien lassen sich nicht bearbeiten
- **Problem**: Edit-Button beim Hover nicht sichtbar/klickbar
- **Ursache**: `hover:${c.text}` funktioniert nicht (dynamische Tailwind-Klassen)
- **Fix**: Statische Tailwind-Klassen für Hover-Effekte verwendet
- **Geändert**: `src/pages/CategorySettings.js` - CSS-Klassen korrigiert

### 📝 Geänderte Dateien
- `main.js`: OAuth2 IMAP-Konfiguration verbessert (TLS, Timeout)
- `src/pages/InboxSplitView.js`: removeEmailFromIndexedDB() hinzugefügt
- `src/pages/CategorySettings.js`: Hover-CSS korrigiert
- `src/styles/index.css`: Globale Font-Regel entfernt
- `package.json`: Version 1.12.1
- `README.md`: Bugfixes dokumentiert
- `CHANGELOG.md`: Diese Änderungen

---

## [1.12.0] - 2026-03-10

### 🆕 Neue Features

#### ✏️ Kategorien-Bearbeitung verbessert
- **Stift-Icon beim Hover**: Edit/Delete-Buttons erscheinen nur beim Hover über Kategorien
- **Alle Kategorien bearbeitbar**: Auch Standard-Kategorien können Name, Farbe und Icon ändern
- **Cleaner UI**: Aufgeräumtere Oberfläche ohne ständig sichtbare Buttons
- **group-hover CSS**: Verwendet Tailwind group-hover für elegante Interaktion

#### ↔️ Vorschau noch kleiner ziehen
- **PREVIEW_MIN_WIDTH**: Von 200px auf 100px reduziert
- **Maximale Flexibilität**: Benutzer können die Vorschau extrem kompakt machen
- **Responsives Design**: Vorschau bleibt auch bei 100px noch funktional

#### 📐 Alle Seitenleisten resizable
- **Haupt-Sidebar (SidebarV2)**: 200-400px, mit SidebarContext und localStorage-Persistenz
- **Ordner-Liste**: 150-350px, resizable mit Drag-Handle
- **Vorschau-Spalte**: 100-800px, flexibel einstellbar
- **Smooth Resizing**: Alle Resize-Handles mit visueller Feedback

#### 🔤 Font auf E-Mail-Inhalt
- **Google Font Integration**: Ausgewählte Schriftart wird auf E-Mail-Inhalt angewendet
- **HTML-Mails**: fontFamily wird inline auf HTML-Container gesetzt
- **Text-Mails**: fontFamily wird auf pre-Tag angewendet
- **GOOGLE_FONTS Mapping**: Schneller Font-Lookup in InboxSplitView

### 📝 Geänderte Dateien
- `src/pages/CategorySettings.js`: group-hover für Edit/Delete-Buttons
- `src/pages/InboxSplitView.js`: PREVIEW_MIN_WIDTH auf 100px
- `package.json`: Version 1.12.0
- `README.md`: Neue Features dokumentiert
- `CHANGELOG.md`: Diese Änderungen

---

## [1.11.2] - 2026-03-09

### 🌐 Infrastruktur-Update: Vercel entfernt

#### 🚀 GitHub-Hosting
- **Keine Vercel-Abhängigkeit mehr**: Alle Assets werden jetzt von GitHub gehostet
- **GitHub Raw URLs**: install.sh, uninstall.sh und Icon werden von GitHub Raw geladen
- **Zuverlässigere Installation**: Keine externen Dienste mehr notwendig

#### 📥 Aktualisierte URLs
- **install.sh**: `https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/install.sh`
- **uninstall.sh**: `https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/uninstall.sh`
- **Icon**: `https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/coremail-icon.png`

#### 📝 Geänderte Dateien
- `public/install.sh`: Alle Vercel-URLs auf GitHub Raw geändert
- `public/uninstall.sh`: Alle Vercel-URLs auf GitHub Raw geändert
- `package.json`: Version 1.11.2
- `README.md`: Schnellinstallation mit GitHub URLs
- `CHANGELOG.md`: Diese Änderungen

---

## [1.11.1] - 2026-03-09

### 🆕 Verbesserungen

#### ↔️ Vorschau-Spalte noch kleiner ziehen
- **Min-Breite reduziert**: Von 300px auf 200px gesenkt
- **Mehr Flexibilität**: Benutzer können die Vorschau-Spalte noch kompakter gestalten
- **Konstante PREVIEW_MIN_WIDTH**: In `InboxSplitView.js` auf 200 gesetzt

#### 🔤 Font auf E-Mail-Inhalt anwenden
- **HTML-E-Mails**: Ausgewählte Google Font wird auf HTML-E-Mail-Inhalt angewendet
- **Text-E-Mails**: Font wird auch auf reine Text-E-Mails angewendet
- **getCurrentFont Import**: In `InboxSplitView.js` aus `FontSettings.js` importiert
- **GOOGLE_FONTS Mapping**: Lokales Mapping für schnellen Font-Family-Lookup

#### 📁 Inbox ganz oben in Ordner-Liste
- **Sortierte Ordner-Liste**: INBOX wird immer als erstes angezeigt
- **Standard-Ordner-Reihenfolge**: INBOX → Sent → Drafts → Trash → Spam → Archive
- **Alphabetische Sortierung**: Alle anderen Ordner werden alphabetisch sortiert
- **Deutsche Ordnernamen**: Erkennt auch "Posteingang", "Gesendet", "Entwürfe", "Papierkorb"
- **Neue `sortedFolders` useMemo**: Sortiert Ordner vor dem Flatten

#### 📊 Ungelesene Anzahl in Konto-Liste (Sidebar)
- **Badge in Sidebar**: Blaues Badge mit Anzahl ungelesener E-Mails pro Konto
- **accountStats Integration**: Nutzt `accountStats` aus `AccountContext`
- **Automatische Aktualisierung**: Stats werden beim Laden von E-Mails aktualisiert
- **Overflow-Handling**: "99+" wird angezeigt, wenn mehr als 99 ungelesene E-Mails

### 📝 Geänderte Dateien
- `InboxSplitView.js`: Min-Breite 200px, Font auf Content, Ordner-Sortierung, Stats-Update
- `SidebarV2.js`: Ungelesene Anzahl Badge pro Account
- `package.json`: Version 1.11.1
- `README.md`: Neue Features dokumentiert
- `CHANGELOG.md`: Diese Änderungen

---

## [1.11.0] - 2026-03-09

### 🆕 Neue Features

#### 🏷️ Kategorien anpassen
- **Icon-Auswahl**: 14 Lucide Icons zur Auswahl (Briefcase, User, Star, Tag, Heart, Flag, Bookmark, Zap, Coffee, Globe, Mail, Home, Shield, Folder)
- **Farb-Picker**: 12 vordefinierte Farben + Custom Color Picker
- **Icon-Picker UI**: Neues Dropdown mit Raster-Ansicht aller Icons
- **Sidebar-Integration**: Kategorie-Icons werden in der Sidebar mit farbigem Hintergrund angezeigt
- **Persistenz**: Icons werden mit Kategorien in localStorage gespeichert

#### 📧 Ungelesene Mails besser markieren
- **Blaue Linie links**: 3px `border-left` in Blau für alle ungelesenen E-Mails
- **Blauer Punkt**: Pulsierender 2px Punkt neben dem Absender (mit `animate-pulse`)
- **Heller Hintergrund**: Dezent blauer Hintergrund (`bg-blue-500/5`) für ungelesene Mails
- **"Neu" Badge**: Kleines blaues Badge mit "Neu" Text in der E-Mail-Zeile
- **Fette Schrift**: Absender und Betreff in `font-semibold` für ungelesene Mails
- **Ordner-Badge**: Ungelesene Anzahl als blaues Badge im Ordner-Baum

#### 🔤 Google Fonts Auswahl
- **12 beliebte Schriftarten**:
  - Inter (Standard)
  - Roboto, Open Sans, Lato
  - Montserrat, Poppins, Raleway
  - Source Sans 3, Ubuntu, Nunito
  - Fira Code, JetBrains Mono (Monospace)
- **Live-Vorschau**: Font-Vorschau mit anpassbarem Text
- **Dynamisches Laden**: Google Fonts werden per `<link>` Tag geladen
- **Persistenz**: Font wird in localStorage gespeichert und beim App-Start geladen
- **Neue Komponente**: `FontSettings.js` mit `applySavedFont()`, `loadGoogleFont()`, `getCurrentFont()`

#### ↔️ Vorschau-Leiste anpassbar
- **Resizable**: Vorschau-Breite per Drag anpassbar
- **Min/Max**: 300px - 800px Breite
- **Visuelles Handle**: `GripVertical` Icon als visueller Hinweis zum Ziehen
- **Cursor-Feedback**: `col-resize` Cursor beim Hovern über Handle
- **Persistenz**: Breite wird in `inbox.previewColumnWidth` gespeichert
- **Smooth Resize**: Body-Styles während Resize für bessere UX

### 📝 Geänderte Dateien
- `CategorySettings.js`: Icon-Picker, erweiterte UI
- `SidebarV2.js`: Import von `getCategoryIcon`, Icon-Rendering
- `InboxSplitView.js`: Verbessertes `EmailListItem`, resizable Preview
- `FontSettings.js`: Neue Komponente
- `SettingsV2.js`: Neuer "Schriftart" Tab, Import von FontSettings
- `App.js`: Import und Aufruf von `applySavedFont()`
- `package.json`: Version 1.11.0
- `README.md`: Neue Features dokumentiert

---

## [1.10.2] - 2026-03-09

### 🐛 Kritischer Bugfix: Schwarzes Konten-Fenster

#### 🔧 Behobener Fehler
- **Schwarzes Konten-Fenster**: Das Konten-Fenster war komplett schwarz wenn der Benutzer auf "Konten" klickte
  - **Ursache**: React Hook Reihenfolge-Verletzung in `AccountManager.js` - `useMemo` referenzierte `accountForm` bevor es definiert wurde (Zeile 109 referenzierte Zeile 112)
  - **Lösung**: `accountForm` useState Hook vor die `useMemo` Hooks verschoben, die davon abhängen
  - **Betroffen**: Zeile 97-118 in `AccountManager.js`

#### 📝 Technische Details
- React Hooks müssen in konsistenter Reihenfolge aufgerufen werden
- `showOAuth2Panel` useMemo hatte Abhängigkeit auf `accountForm?.oauth2`
- `accountForm` wurde erst nach dem useMemo definiert → JavaScript undefined error
- Fix: Hook-Definition-Reihenfolge korrigiert

---

## [1.10.1] - 2026-03-09

### 🐛 Bugfix: OAuth2-Button Anzeige

#### 🔧 Behobene Fehler
- **OAuth2-Button nicht sichtbar**: Der "Mit Microsoft anmelden" Button wurde nicht angezeigt, obwohl "Microsoft 365 / Exchange" ausgewählt war
  - **Ursache**: Die Bedingung prüfte nur den Preset-Namen statt das `supportsOAuth2` Flag
  - **Lösung**: Neue `useMemo` Logik mit `showOAuth2Panel` Variable für robuste Erkennung

#### ✨ Verbesserungen
- **Prominenterer OAuth2-Button**: Größerer Button mit Schatten-Effekt und besserer Sichtbarkeit
- **"Empfohlen"-Badge**: Grünes Badge zeigt an, dass OAuth2 die bevorzugte Methode ist
- **Aufklappbare Erweiterte Einstellungen**: IMAP/SMTP-Felder sind standardmäßig ausgeblendet
  - "Alternative: Manuelle IMAP/SMTP-Konfiguration" Button zum Aufklappen
  - Reduziert visuelle Unordnung
- **Verbesserte Fehlermeldungen**: Fehler werden in rotem Box mit Icon angezeigt
- **Bessere Hinweisbox**: OAuth2-Vorteile werden klar kommuniziert

#### 📝 Änderungen in AccountManager.js
- Neue Imports: `useMemo`, `ChevronDown`, `ChevronUp`
- Neue State-Variable: `showAdvancedSettings`
- Neue Memos: `currentPreset`, `showOAuth2Panel`
- Bedingte Anzeige von IMAP/SMTP-Sektionen

---

## [1.10.0] - 2026-03-09

### 🔐 OAuth2-Integration für Microsoft 365/Exchange

#### ✨ Neue Features
- **Microsoft OAuth2-Login**: Ein-Klick-Anmeldung über Browser
  - PKCE (Proof Key for Code Exchange) für maximale Sicherheit
  - State-Parameter für CSRF-Schutz
  - Automatische Token-Extraktion aus Callback
- **XOAUTH2 für IMAP/SMTP**: Sichere E-Mail-Kommunikation ohne Passwörter
  - Access Tokens für IMAP-Verbindungen
  - Access Tokens für SMTP-Versand
  - Automatischer Fallback zu Passwort-Authentifizierung
- **Token-Verwaltung**:
  - Sichere Speicherung in verschlüsseltem Store
  - Automatischer Token-Refresh bei Ablauf
  - 5-Minuten-Puffer für rechtzeitiges Refresh
- **UI-Integration**:
  - "Mit Microsoft anmelden" Button im Kontomanager
  - OAuth2-Badge in der Kontenliste
  - Status-Anzeige (Verbunden/Fehler)
  - Deaktivierte Passwortfelder bei aktivem OAuth2

#### 🔧 Technische Details
- Microsoft OAuth2 Endpoints:
  - Authorization: login.microsoftonline.com/common/oauth2/v2.0/authorize
  - Token: login.microsoftonline.com/common/oauth2/v2.0/token
- Scopes:
  - IMAP.AccessAsUser.All
  - SMTP.Send
  - offline_access (Refresh Token)
  - openid, email, profile
- HTTP-Server auf Port 8847 für OAuth-Callback
- ID-Token-Parsing für E-Mail-Extraktion

#### 🏢 Unterstützte Anbieter
- Microsoft 365 (Firmenkonten)
- Exchange Online
- Outlook.com
- Hotmail
- Live.com

---

## [1.9.1] - 2026-03-09

### 🐛 Bugfixes

#### 🖼️ Icon-Installation Fix
- **Icon-URL korrigiert**: Icon wird jetzt von suremail.vercel.app geladen
- **Hicolor-Icons**: Icon wird in alle Standardgrößen installiert (512x512 bis 32x32)
- **Pixmaps-Verzeichnis**: Icon wird auch in ~/.local/share/pixmaps/ installiert
- **Icon-Cache**: Automatische Aktualisierung des GTK-Icon-Cache

#### 🖥️ Desktop-Integration Fix
- **--no-sandbox Flag**: Desktop-Entry verwendet jetzt --no-sandbox für Kompatibilität
- **StartupWMClass**: Korrigiert für bessere Fenster-Zuordnung
- **Mailto-Handler**: MIME-Type für E-Mail-Links registriert
- **StartupNotify**: Aktiviert für besseres Feedback beim Start

#### 📦 Installer-Verbesserungen
- **Wrapper-Script**: Enthält jetzt --no-sandbox für extrahierte Installation
- **Verzeichnisstruktur**: Alle Icon-Verzeichnisse werden korrekt erstellt
- **ImageMagick-Integration**: Skalierte Icons werden erstellt falls verfügbar

---

## [1.9.0] - 2026-03-08

### ✨ Neue Features

#### 🎨 Modernes UI/UX-Design
- **Moderne Button-Styles**: Neue CSS-Klassen für primäre, sekundäre und Ghost-Buttons
- **Hover-Effekte**: Shine-Animationen und Transform-Effekte
- **Verbesserte Transitions**: Smooth Übergänge in der gesamten App (0.3s ease)
- **Schatten-System**: Moderne Box-Shadow-Styles für Elevation

#### 🃏 Verbesserte Karten-Designs
- **Card-Modern**: Glasmorphismus-ähnlicher Effekt mit Backdrop-Blur
- **Card-Elevated**: Tiefeneffekt mit Inner-Light
- **Card-Glass**: Transparenter Glas-Effekt
- **Hover-States**: Karten heben sich beim Hover an

#### 📝 Elegante Input-Felder
- **Input-Modern**: Fokus-Animationen mit Glow-Effekt
- **Input-With-Icon**: Icon-unterstützte Eingabefelder
- **Input-Floating**: Floating-Label-Stil für moderne Formulare
- **Focus-Ring**: Konsistente Fokus-Anzeige

#### ✨ Professionelle Animationen
- **Fade-In/Fade-In-Up**: Sanfte Einblend-Animationen
- **Slide-In (Left/Right)**: Slide-Animationen für Panels
- **Scale-In**: Zoom-Effekt für Modals
- **Shimmer**: Loading-Effekt für Skeleton-Loader
- **Stagger-Children**: Gestaffelte Animationen für Listen (bis 10 Items)

#### 📧 E-Mail-Liste Optimiert
- **Email-Item**: Neue Hover-Effekte mit translateX
- **Unread-Indicator**: Cyan-Border für ungelesene E-Mails
- **Enter-Animationen**: Sanftes Einblenden neuer E-Mails
- **Scrollbar-Modern**: Moderne, dünne Scrollbars

#### 🧭 Sidebar-Verbesserungen
- **Sidebar-Item**: Hover-Animation mit Padding-Shift
- **Active-State**: Cyan-Border und Hintergrund
- **Slide-Animation**: Sanftes Einblenden beim Start

#### 🖼️ Professionelles App-Icon
- **SVG-basiertes Design**: Skalierbar ohne Qualitätsverlust
- **Cyan/Blau-Farbschema**: Passend zum CoreMail-Design
- **E-Mail-Envelope mit "C"**: Erkennbares CoreMail-Branding
- **Notification-Badge**: Checkmark für Bestätigung
- **Alle Größen**: 16x16, 32x32, 64x64, 128x128, 256x256, 512x512
- **Desktop-Integration**: Icon wird nach Installation angezeigt

#### 🧩 Neue UI-Komponenten
- **Badge-Styles**: Primary, Success, Warning, Danger mit Pulse-Animation
- **Tooltip**: Hover-Tooltips mit CSS-only
- **Skeleton-Loader**: Für Loading-States mit Shimmer
- **Progress-Bar**: Animated Progress mit Shine-Effekt
- **Switch/Toggle**: Moderner Toggle-Schalter
- **Avatar**: Gradient-Avatare in sm/md/lg
- **Chip/Tag**: Removable Tags

#### 🔧 LoadingSpinner Erweitert
- **Varianten**: Default, Dots, Pulse
- **Größen**: sm, md, lg
- **EmailSkeleton**: Skeleton-Loader für E-Mail-Listen

### 🔧 Verbesserungen

- **src/styles/index.css**: 700+ neue Zeilen für moderne UI
- **LoadingSpinner.js**: Neue Varianten und EmailSkeleton
- **build/icons/**: Alle Icon-Größen vorgeneriert

---

## [1.8.2] - 2026-03-08

### ✨ Neue Features

#### 🏢 Microsoft Account Integration verbessert
- **Auto-Fill für E-Mail**: E-Mail-Adresse wird automatisch als Benutzername übernommen
- **STARTTLS-Unterstützung**: Korrekte Anzeige für Port 587
- **Hilfe-Links**: Direkte Links zu App-Passwort-Anleitungen
- **"Von IMAP kopieren"**: Schnelles Übertragen der Zugangsdaten
- **Lucide Icons**: Moderne Icons für Test-Buttons und Status

#### ⏱️ Automatische Mail-Aktualisierung
- **Einstellbare Intervalle**: 1, 5, 10, 15, 30 Minuten oder Manuell
- **Für alle Konten**: Auto-Refresh läuft im Hintergrund
- **Live-Änderungen**: Einstellungen werden sofort übernommen
- **Neue Einstellungsseite**: Unter "E-Mail" in den Einstellungen

#### 💾 Lokale E-Mail-Speicherung (IndexedDB)
- **Stale-While-Revalidate**: Erst lokale Daten, dann Server-Aktualisierung
- **Schnellerer Kontowechsel**: E-Mails sofort sichtbar
- **Offline-Verfügbarkeit**: E-Mails auch ohne Verbindung lesbar
- **Cache-Verwaltung**: Cache-Größe anzeigen und leeren
- **Toggle-Schalter**: Lokale Speicherung ein/ausschalten

#### 🤖 KI-Zugriff auf alle Postfächer
- **Multi-Mailbox-Suche**: KI durchsucht alle Konten
- **aiSearchMailboxes**: KI-gestützte Suche mit Kontext
- **getMailboxStats**: Statistiken über alle Postfächer
- **Kontoübergreifend**: Finde E-Mails in allen Postfächern

### 🔧 Verbesserungen

- **EmailSettings.js**: Neue Optionen für Refresh-Intervall und Cache
- **InboxSplitView.js**: Auto-Refresh und IndexedDB-Integration
- **AccountManager.js**: Bessere Microsoft/Exchange-Unterstützung
- **OllamaContext.js**: Neue Multi-Mailbox-Funktionen

---

## [1.8.0] - 2026-03-08

### ✨ Neue Features

#### 🗑️ E-Mail-Funktions-Icons
- **Löschen**: E-Mails direkt aus der Liste oder Detailansicht löschen
- **Gelesen/Ungelesen**: Status schnell umschalten
- **Antworten**: E-Mail beantworten
- **Allen antworten**: An alle Empfänger antworten
- **Weiterleiten**: E-Mail an andere weiterleiten
- **Lucide Icons**: Moderne, konsistente Icons

#### ⚡ Performance-Verbesserungen
- **E-Mail-Caching**: 5-Minuten-Cache für schnellere Ordnerwechsel
- **Lazy Loading**: Nur erste 50 E-Mails werden geladen
- **Pagination**: "Mehr laden" Button für weitere E-Mails
- **React.memo**: Optimierte E-Mail-Listen-Komponenten
- **Ordner-Cache**: IMAP-Ordner werden gecacht

#### 📁 Ordner-Struktur
- **IMAP-Ordner anzeigen**: Posteingang, Gesendet, Entwürfe, Papierkorb, Spam, etc.
- **Ordner-Navigation**: Klick auf Ordner lädt die E-Mails
- **Ordner-Icons**: Passende Icons für jeden Ordnertyp
- **Ordner-Liste vom Server**: IMAP LIST-Befehl für echte Ordner

#### 🏷️ Kategorien bearbeiten
- **Neue Einstellungsseite**: "Kategorien" in den Einstellungen
- **Kategorie erstellen**: Name und Farbe wählen
- **Kategorie bearbeiten**: Name und Farbe ändern
- **Kategorie löschen**: Mit Bestätigung (Konten werden verschoben)
- **Farb-Presets**: 12 vordefinierte Farben + Custom-Picker

#### 🤖 KI-Zugriff auf Postfächer
- **E-Mail-Kontext**: KI hat Zugriff auf aktuelle E-Mail
- **Bessere Antworten**: KI kennt Absender, Betreff, Inhalt
- **E-Mail verfassen**: KI-Unterstützung beim Schreiben
- **Kontext-basiert**: Antworten beziehen sich auf die E-Mail

#### 🏢 Microsoft Exchange-Support
- **Server-Vorlagen**: 9 vordefinierte Anbieter
- **Exchange/Office 365**: outlook.office365.com mit korrekten Ports
- **Outlook.com/Hotmail**: Persönliche Microsoft-Konten
- **Gmail, iCloud, Yahoo**: Mit Hinweis auf App-Passwörter
- **GMX, WEB.DE, IONOS**: Deutsche Anbieter
- **Auto-Fill**: Server-Einstellungen werden ausgefüllt

### 🔧 UI-Fixes

#### Update-Balken Fix
- **max-width: 100%**: Update-Balken überläuft nicht mehr
- **overflow: hidden**: Text wird abgeschnitten statt überlaufen
- **break-words**: Lange URLs werden umgebrochen
- **flex-shrink-0**: Icons behalten ihre Größe

### 📦 Neue IMAP-Funktionen (Backend)

- `imap:deleteEmail`: E-Mail löschen
- `imap:markAsRead`: Als gelesen/ungelesen markieren
- `imap:moveEmail`: E-Mail in anderen Ordner verschieben
- `imap:listFolders`: Ordner-Liste abrufen
- `imap:fetchEmailsFromFolder`: E-Mails aus bestimmtem Ordner

### 📦 Version
- Minor-Release: v1.7.2 → v1.8.0

---

## [1.7.2] - 2026-03-08

### 🐛 Bugfixes

#### 🤖 Ollama API-Kommunikation gefixt
- **404-Fehler behoben**: Die Ollama API-Kommunikation wurde von `/api/generate` auf `/api/chat` umgestellt
- **Korrekte Chat-API**: Verwendet jetzt die richtige `/api/chat` API mit `messages`-Array für Konversationen
- **Bessere Fehlerbehandlung**: 
  - Spezifische Fehlermeldung wenn Modell nicht installiert ist
  - Klare Meldung wenn Ollama nicht läuft
  - Anleitung zum Starten von Ollama
- **Chat-Funktion funktioniert jetzt**: KI-Assistent kann nun korrekt mit Ollama kommunizieren

### 🔧 Technische Änderungen
- **OllamaContext.js**: 
  - `sendMessage()`: Verwendet jetzt `/api/chat` mit `messages`-Array
  - `sendMessageStreaming()`: Streaming-Antworten mit korrektem `/api/chat` Endpoint
  - `generate()`: Für E-Mail-Funktionen (Zusammenfassen, Antwortvorschläge) aktualisiert
  - Response-Parsing für Chat-API: `data.message.content` statt `data.response`

### 📦 Version
- Bugfix-Release: v1.7.1 → v1.7.2

---

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