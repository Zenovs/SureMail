# 📧 CoreMail Desktop v1.13.1

Ein schlanker, benutzerfreundlicher E-Mail-Client für Linux mit modernem Design, lokaler KI-Integration, anpassbaren Kategorien, Google Fonts und professionellem UI/UX.

## 🚀 Schnellinstallation

```bash
curl -sSL https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/install.sh | bash
```

oder

```bash
wget -qO- https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/install.sh | bash
```

## 🆕 v1.13.1 - OAuth2 Admin-Consent Fix

### 🔐 Microsoft 365 OAuth2 Verbesserung
- **Admin-Consent Problem behoben**: Wechsel von Thunderbird-Client-ID auf Microsoft Office native Client-ID
- **Keine Administrator-Genehmigung mehr nötig**: User-Delegated Permissions ohne Admin-Consent
- **Verbesserte Kompatibilität**: Funktioniert jetzt mit Enterprise Microsoft 365 Umgebungen

### 🔧 Technische Änderungen
- Client-ID geändert von `08162f7c-0fd2-4200-a84a-f25a4db0b584` (Thunderbird) auf `d3590ed6-52b3-4102-aeff-aad2292ab01c` (Microsoft Office)
- Optimierte Scopes für User-Delegated Permissions
- Kommentare in OAuth2-Konfiguration aktualisiert

---

## 🆕 v1.13.0 - Globale Suchfunktion

### 🔍 Präzise Mail-Suche über alle Konten
- **Globale Suche**: Durchsuche alle E-Mail-Konten und Ordner gleichzeitig
- **Schnellzugriff**: `Ctrl+K` oder `Cmd+K` öffnet die Suchleiste sofort
- **Suchleiste in Sidebar**: Prominente Suchleiste direkt in der Navigation

### 🎯 Erweiterte Suchfilter
- **Konto-Filter**: Suche nur in bestimmten Konten
- **Ordner-Filter**: Alle Ordner, Posteingang, Gesendet, Entwürfe, Archiv
- **Datum-Filter**: Von/Bis Datum eingrenzen
- **Status-Filter**: Nur ungelesene, nur markierte Mails
- **Anhang-Filter**: Nur Mails mit Anhängen

### ⚡ Schnelle Ergebnisse
- **Live-Vorschläge**: Autocomplete während der Eingabe (300ms Debouncing)
- **Highlighting**: Suchbegriff wird in Ergebnissen hervorgehoben
- **Gruppierung**: Ergebnisse nach Konto gruppiert
- **Match-Indikator**: Zeigt wo der Suchbegriff gefunden wurde (Betreff, Absender, Text)

### 🎨 Übersichtliche Darstellung
- **Such-Modal**: Elegantes Overlay mit Backdrop-Blur
- **Ergebnis-Preview**: Betreff, Absender, Datum, Vorschau-Text
- **Ordner-Anzeige**: Zeigt in welchem Ordner die Mail liegt
- **Status-Icons**: Gelesen/Ungelesen, Markiert, Mit Anhängen

### 🔧 Technische Details
- IMAP SEARCH über alle Postfächer
- Suche in: Betreff, Absender, Empfänger, Nachrichtentext
- Max. 200 Ergebnisse (sortiert nach Datum)
- Fehlertoleranz: Nicht erreichbare Konten werden übersprungen

---

## 🆕 v1.12.4 - Kategorien-Bearbeitung UX verbessert

### 💡 Bessere Navigation zur Kategorien-Bearbeitung
- **Hinweis auf Konten-Seite**: Deutlicher Hinweis "Kategorien bearbeiten? → Einstellungen → Kategorien"
- **Benutzer findet es jetzt**: Der Weg zur Kategorien-Bearbeitung ist jetzt offensichtlich
- **UX-Verbesserung**: Benutzer werden nicht mehr auf der falschen Seite gesucht

### 🔧 Was wurde geändert
- `AccountManager.js`: Hinweis zur Kategorien-Bearbeitung unter den Kategorie-Tags hinzugefügt
- Kategorien werden weiterhin in Einstellungen → Kategorien bearbeitet (Name, Farbe, Icon)

---

## 🆕 v1.12.3 - Kategorien-Bearbeitung GEFIXT

### ✏️ Kategorien-Bearbeitung funktioniert jetzt WIRKLICH
- **Buttons immer sichtbar**: Edit/Delete-Buttons sind IMMER sichtbar (nicht nur bei Hover)
- **Klare UI**: "Bearbeiten" und "Löschen" Buttons mit Text und Icons
- **Sofortige Bearbeitung**: Ein Klick auf "Bearbeiten" öffnet den Edit-Modus
- **Zuverlässig**: Keine versteckten Hover-Effekte mehr, die nicht funktionieren

### 🔧 Was wurde geändert
- `opacity-0 group-hover:opacity-100` entfernt - Buttons waren unsichtbar
- Neue deutlich sichtbare Buttons mit Text: "Bearbeiten" / "Löschen"
- Bessere Farbgestaltung für Edit (grau) und Delete (rot) Buttons
- Responsive Layout mit `flex-shrink-0` für stabile Button-Positionen

---

## 🆕 v1.12.2 - Resizable Mail-Liste

### 📏 Mail-Liste-Spalte resizable
- **Frei skalierbar**: Die mittlere Spalte (Mail-Liste) kann jetzt beliebig verkleinert werden
- **Min-Breite 100px**: Spalte kann sehr schmal gemacht werden
- **Max-Breite 600px**: Maximale Breite für optimale Lesbarkeit
- **Speicherung**: Breite wird in localStorage gespeichert

### 📝 Text-Wrapping aktiviert
- **Betreff umbrechen**: Lange Betreffzeilen werden umgebrochen
- **Absender umbrechen**: Lange E-Mail-Adressen werden angezeigt
- **Vorschau umbrechen**: Preview-Text passt sich der Breite an

### 📐 Dynamische Höhe
- **Flexible Items**: Mail-Items passen ihre Höhe dem Inhalt an
- **Min-Height**: Mindesthöhe für konsistentes Aussehen
- **Bessere Lesbarkeit**: Text wird nicht mehr abgeschnitten

### 🎨 Verbessertes Layout
- **Alle 3 Spalten resizable**: Ordner, Mail-Liste und Vorschau
- **Unabhängige Breiten**: Jede Spalte kann separat angepasst werden
- **Grip-Handle**: Visueller Indikator zum Ziehen

---

## 🐛 v1.12.1 - Kritische Bugfixes

### 🗑️ Gelöschte E-Mails bleiben gelöscht
- **IndexedDB-Sync**: Gelöschte E-Mails werden jetzt auch aus dem lokalen Cache entfernt
- **Kein Wiederauftauchen**: Nach dem Refresh bleiben gelöschte E-Mails gelöscht
- **IMAP-Expunge**: Korrekte IMAP-Löschung mit `\\Deleted`-Flag und `expunge()`

### 🔐 Microsoft Auth (OAuth2) korrigiert
- **TLS-Einstellungen**: Korrekte TLS-Konfiguration für Microsoft 365/Exchange
- **Timeout erhöht**: Verbindungs-Timeout auf 30 Sekunden erhöht
- **Bessere Fehlerbehandlung**: Logging für OAuth2-Debugging hinzugefügt

### 🔤 Schriftart wird übernommen
- **CSS-Fix**: Entfernte hartcodierte Font-Family (`JetBrains Mono`)
- **Dynamische Fonts**: Benutzerdefinierte Google Fonts werden jetzt korrekt angewendet
- **Alle Bereiche**: Font gilt für die gesamte App inklusive E-Mail-Inhalt

### ✏️ Kategorien-Bearbeitung funktioniert
- **CSS-Hover-Fix**: Korrigierte Tailwind-CSS-Klassen für Hover-Effekte
- **Edit-Button sichtbar**: Bearbeiten-Button erscheint beim Hover korrekt
- **Theme-unabhängig**: Funktioniert mit allen Themes

---

## 🆕 v1.12.0 Features

### ✏️ Kategorien-Bearbeitung verbessert
- **Stift-Icon beim Hover**: Edit/Delete-Buttons erscheinen nur beim Hover über die Kategorie
- **Alle Kategorien bearbeitbar**: Auch Standard-Kategorien (Arbeit, Privat, Sonstiges) können bearbeitet werden
- **Cleaner UI**: Aufgeräumtere Oberfläche ohne ständig sichtbare Buttons

### ↔️ Vorschau noch kleiner ziehen
- **Min-Breite reduziert**: Von 200px auf 100px gesenkt
- **Mehr Flexibilität**: Maximale Kontrolle über das Layout

### 📐 Alle Seitenleisten resizable
- **Haupt-Sidebar**: 200-400px, mit localStorage-Speicherung
- **Ordner-Liste**: 150-350px, anpassbar per Drag
- **Vorschau-Spalte**: 100-800px, flexibel einstellbar

### 🔤 Font auf E-Mail-Inhalt
- **Ausgewählte Schrift**: Google Font wird auf E-Mail-Inhalt angewendet
- **HTML & Text**: Funktioniert für beide E-Mail-Typen

---

## 📦 Version v1.11.2

### 🌐 Vercel entfernt - Alles auf GitHub
- **GitHub Raw URLs**: Alle Assets werden jetzt von GitHub gehostet
- **Keine Vercel-Abhängigkeit**: Installation funktioniert ohne externe Dienste
- **Zuverlässiger**: Direkter Download von GitHub Releases

---

## 📦 Version v1.11.1

### ↔️ Vorschau-Spalte noch kleiner ziehen
- **Min-Breite reduziert**: Von 300px auf 200px gesenkt
- **Mehr Platz**: Mehr Flexibilität bei der E-Mail-Vorschau
- **Gleiches Handling**: Smooth Resizing bleibt erhalten

### 🔤 Font auf E-Mail-Inhalt
- **Konsistente Schrift**: Ausgewählte Schriftart wird auf E-Mail-Inhalt angewendet
- **HTML-Mails**: Font-Family wird auf HTML-E-Mails angewendet
- **Text-Mails**: Font-Family auch auf reine Text-E-Mails

### 📁 Inbox ganz oben in Ordner-Liste
- **Sortierte Ordner**: INBOX, Gesendet, Entwürfe, Papierkorb, Spam zuerst
- **Dann alphabetisch**: Alle anderen Ordner alphabetisch sortiert
- **Automatische Erkennung**: Deutsche und englische Ordnernamen

### 📊 Ungelesene Anzahl in Konto-Liste
- **Badge in Sidebar**: Blaues Badge mit Anzahl ungelesener Mails
- **Pro Konto**: Ungelesene Anzahl wird pro E-Mail-Konto angezeigt
- **Automatisch aktualisiert**: Badge wird beim Laden von E-Mails aktualisiert
- **Overflow-Handling**: Bei mehr als 99 wird "99+" angezeigt

---

## 📦 Version v1.11.0

### 🏷️ Kategorien anpassen
- **Name bearbeiten**: Jede Kategorie kann umbenannt werden
- **Farbe wählen**: 12 Vordefinierten Farben + Custom Color Picker
- **Icon wählen**: 14 Lucide Icons zur Auswahl (Briefcase, Star, Heart, etc.)
- **Sidebar-Integration**: Icons werden in der Sidebar angezeigt

### 📧 Ungelesene Mails besser markieren
- **Blaue Linie links**: 3px blaue Border für ungelesene E-Mails
- **Blauer Punkt**: Pulsierender Indikator neben dem Absender
- **Heller Hintergrund**: Dezent blauer Hintergrund für bessere Sichtbarkeit
- **"Neu" Badge**: Badge in der E-Mail-Zeile
- **Ordner-Badge**: Ungelesene Anzahl im Ordner-Baum

### 🔤 Google Fonts Auswahl
- **12 beliebte Schriftarten**: Inter, Roboto, Open Sans, Montserrat, Poppins, etc.
- **Live-Vorschau**: Sofortige Vorschau beim Auswählen
- **Code-Fonts**: Fira Code und JetBrains Mono für Entwickler
- **Automatische Speicherung**: Font wird beim App-Start geladen

### ↔️ Vorschau-Leiste anpassbar
- **Resizable**: Breite per Drag anpassbar (300-800px)
- **Persistenz**: Breite wird in localStorage gespeichert
- **Visuelles Handle**: Grip-Icon zum Ziehen
- **Smooth Transitions**: Flüssige Größenänderung

## 📦 Version v1.10.2

### 🐛 Kritischer Bugfix: Konten-Fenster funktioniert wieder
- **Fix**: Das Konten-Fenster war schwarz/leer wenn man auf "Konten" klickte
- **Ursache**: React Hook Reihenfolge-Fehler in AccountManager.js
- **Lösung**: Hook-Definitionen in korrekte Reihenfolge gebracht

## 📦 Version v1.10.1

### 🐛 Bugfix: OAuth2-Button wird jetzt korrekt angezeigt
- **Fix**: Der "Mit Microsoft anmelden" Button wird nun korrekt angezeigt, wenn "Microsoft 365 / Exchange" oder "Outlook.com" ausgewählt wird
- **Verbesserte UI**: OAuth2-Panel ist jetzt prominenter mit "Empfohlen"-Badge
- **Aufklappbare Erweiterte Einstellungen**: IMAP/SMTP-Felder sind standardmäßig ausgeblendet, wenn OAuth2 verfügbar ist
- **Saubereres Design**: Weniger Unordnung beim Hinzufügen von Microsoft-Konten

## 📦 Version v1.10.0

### 🔐 OAuth2-Integration für Microsoft 365/Exchange
- **Mit Microsoft anmelden**: Ein-Klick-Login über Browser
- **Sicherer als Passwort**: OAuth2-Tokens statt Passwörter
- **2FA-kompatibel**: Funktioniert auch mit aktivierter Zwei-Faktor-Authentifizierung
- **Automatische Token-Refresh**: Tokens werden automatisch erneuert
- **PKCE-Sicherheit**: State-of-the-Art-Sicherheit für Desktop-Apps
- **XOAUTH2 für IMAP/SMTP**: Volle E-Mail-Funktionalität über OAuth2

### Wie OAuth2 funktioniert:
1. Wähle "Microsoft 365 / Exchange" oder "Outlook.com" als Server-Vorlage
2. Klicke auf "Mit Microsoft anmelden"
3. Ein Browser öffnet sich zur Microsoft-Anmeldung
4. Nach erfolgreicher Anmeldung werden IMAP/SMTP automatisch konfiguriert
5. Konto speichern - fertig!

### Vorherige Version (v1.9.1)
- **🖼️ Icon-Fix**: Icon wird jetzt korrekt im App-Menü angezeigt
- **🖥️ Desktop-Integration**: --no-sandbox Flag für SUID Sandbox-Kompatibilität
- **📦 Installer**: Icon wird in alle Standard-Verzeichnisse installiert

### Version v1.9.0
- **🎨 Modernes UI/UX-Design**: Komplett überarbeitete Benutzeroberfläche
- **✨ Professionelle Animationen**: Fade-In, Slide-In, Loading-Animationen
- **📐 Optimiertes Layout**: Verbesserte Typografie und Spacing
  - Moderne Scrollbars
- **🖼️ Professionelles App-Icon**:
  - Neues SVG-basiertes Icon-Design
  - Cyan/Blau-Farbschema passend zum CoreMail-Design
  - Hochauflösende Icons in allen Größen (16x16 bis 512x512)
  - Sichtbar in Desktop-Umgebungen nach Installation

### Frühere Versionen

<details>
<summary>v1.8.2 Features</summary>

- **🏢 Microsoft Account Integration verbessert**: Auto-Fill, STARTTLS, Hilfe-Links
- **⏱️ Automatische Mail-Aktualisierung**: 1-30 Minuten Intervalle einstellbar
- **💾 Lokale E-Mail-Speicherung**: IndexedDB für schnellere Ladezeiten
- **🤖 KI-Zugriff auf alle Postfächer**: Suche und lese E-Mails kontoübergreifend

</details>

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

### v1.8.0 (aktuell)
- 🗑️ **E-Mail-Aktionen**
  - Löschen, Als gelesen/ungelesen markieren
  - Antworten, Allen antworten, Weiterleiten
  - Aktions-Icons in E-Mail-Liste und Detailansicht
- ⚡ **Performance-Verbesserungen**
  - E-Mail-Caching für schnellere Ordnerwechsel
  - Lazy Loading für große Postfächer
  - Pagination mit "Mehr laden" Button
- 📁 **Ordner-Struktur**
  - IMAP-Ordner werden angezeigt (Posteingang, Gesendet, Entwürfe, Papierkorb, Spam)
  - Ordner-Navigation in der E-Mail-Ansicht
- 🏷️ **Kategorien-Verwaltung**
  - Kategorien erstellen, bearbeiten, löschen
  - Farbauswahl mit Preset-Palette
  - Neue Einstellungsseite "Kategorien"
- 🤖 **KI-Zugriff auf Postfächer**
  - KI hat Kontext zur aktuellen E-Mail
  - Bessere Antwortvorschläge
  - E-Mail-Verfassen mit KI-Unterstützung
- 🏢 **Microsoft Exchange/Office 365 Support**
  - Server-Vorlagen für Exchange, Outlook, Gmail, etc.
  - Automatische Server-Konfiguration
- 🔧 **UI-Fixes**
  - Update-Balken überläuft nicht mehr
  - Verbesserte Responsive-Design

### v1.7.x
- 💬 **Lokale KI-Integration mit Ollama**
- ⚙️ **In-App Ollama-Installation**
- 🔧 **Bugfixes für Ollama API**

### v1.4.0 - v1.6.0
- 📐 **Individualisierbare Sidebar**
- 📊 **Widget-Dashboard** mit Drag & Drop
- 🎨 7 Themes (inkl. Foundations)

### v1.1.0 - v1.3.0
- Multi-Account-Support
- 🎨 Themes: Morphismus, Glas, Retro
- 📎 Drag & Drop für Anhänge
- ✍️ 6 Signatur-Vorlagen
- 🔄 Auto-Update
- 🔔 Desktop-Benachrichtigungen

## 🤝 Beitragen

Beiträge sind willkommen! Bitte erstelle einen Issue oder Pull Request.

## 📜 Lizenz

MIT License - siehe LICENSE für Details.

---

**CoreMail Desktop** - ...die mit Wallisär Pauer 💪
