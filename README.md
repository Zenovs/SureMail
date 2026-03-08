# CoreMail

Ein einfaches, benutzerfreundliches E-Mail-Marketing-Tool mit personalisierten Templates – speziell entwickelt für Nicht-IT-User, die schnell und sicher personalisierte E-Mail-Kampagnen versenden möchten.

## 🎯 Projektbeschreibung und Zweck

CoreMail ist ein schlankes, browserbasiertes E-Mail-Marketing-Tool, das es ermöglicht, personalisierte E-Mails an eine Liste von Empfängern zu versenden, ohne dabei sensible Daten zu speichern. Perfekt für kleine Unternehmen, Freelancer und Teams, die eine einfache Lösung für Newsletter und Marketing-Kampagnen suchen.

**Hauptziele:**
- Einfache Bedienung ohne technische Vorkenntnisse
- Maximale Datensicherheit durch Session-basierte Verarbeitung
- Schnelle Einrichtung und sofortiger Einsatz
- Keine Kosten für Datenbank oder Backend-Infrastruktur

## ✨ Features

- **📊 CSV-Upload**: Kontakte über CSV-Datei hochladen (Spalten: vorname, nachname, email, firma)
- **📝 Template-Editor**: HTML/MJML-Templates mit Platzhaltern [vorname], [nachname], [email], [firma]
- **⚙️ SMTP-Konfiguration**: Flexible SMTP-Server-Einstellungen (Gmail, Outlook, eigener Server)
- **🎨 Personalisierter Versand**: Automatische Ersetzung der Platzhalter für jeden Empfänger
- **📋 CSV-Vorlage Download**: Beispiel-CSV zum einfachen Befüllen
- **✅ Versandübersicht**: Detaillierter Bericht nach dem Versand mit Erfolgs-/Fehlermeldungen
- **🇩🇪 Deutsche Benutzeroberfläche**: Komplett auf Deutsch für maximale Benutzerfreundlichkeit
- **🔒 Keine Datenspeicherung**: Alle Daten bleiben in der Browser-Session

## 🔒 Sicherheitshinweise

**Wichtig:** CoreMail speichert **KEINE** Daten dauerhaft!

- ✅ SMTP-Zugangsdaten werden **NICHT** auf dem Server gespeichert
- ✅ Kontaktdaten bleiben nur in der Browser-Session
- ✅ Alle Daten gehen beim Schließen des Browsers verloren
- ✅ Keine Datenbank erforderlich
- ✅ Keine Cookies oder Tracking
- ✅ Vollständige Kontrolle über Ihre Daten

**Empfehlung:** Verwenden Sie App-spezifische Passwörter für SMTP (z.B. Gmail App-Passwörter) statt Ihres Haupt-Passworts.

## 🖥️ Desktop Client

CoreMail ist auch als Desktop-App für Linux verfügbar!

### 🆕 Neu in v1.1.0

- **Mehrere IMAP-Konten**: Verwalte alle deine E-Mail-Konten an einem Ort
- **Dashboard**: Übersicht aller Konten und Statistiken auf einen Blick
- **Kategorien & Gruppen**: Organisiere E-Mails mit benutzerdefinierten Kategorien
- **E-Mail-Vorschau (Split-View)**: Vorschau von E-Mails direkt in der Listenansicht
- **3 Themes**: Dark, Light und Minimal – wähle dein bevorzugtes Design

### Quick Install (Eine Zeile)

Mit curl:
```bash
curl -sSL https://suremail.vercel.app/install.sh | bash
```

Mit wget:
```bash
wget -qO- https://suremail.vercel.app/install.sh | bash
```

Das Script:
- Lädt CoreMail Desktop v1.1.0 von GitHub Releases herunter
- Prüft und installiert automatisch FUSE (benötigt für AppImages)
- Installiert nach `~/.local/bin/coremail-desktop`
- Erstellt einen Desktop-Eintrag im App-Menü
- Alternative ohne FUSE: Extrahiert das AppImage automatisch

### Deinstallation

```bash
curl -sSL https://suremail.vercel.app/uninstall.sh | bash
```

### Systemanforderungen
- Ubuntu 20.04+ / Debian 11+ / Fedora 38+ / Linux Mint 21+
- 64-bit Linux
- 2 GB RAM, 200 MB Speicher

## 🚀 Vercel-Deployment (Schritt-für-Schritt)

### Voraussetzungen
- GitHub-Account
- Vercel-Account (kostenlos unter [vercel.com](https://vercel.com))

### Deployment-Schritte

1. **Repository forken oder klonen**
   ```bash
   git clone https://github.com/Zenovs/CoreMail.git
   cd CoreMail
   ```

2. **Bei Vercel anmelden**
   - Gehen Sie zu [vercel.com](https://vercel.com)
   - Melden Sie sich mit Ihrem GitHub-Account an

3. **Neues Projekt erstellen**
   - Klicken Sie auf "Add New..." → "Project"
   - Wählen Sie das CoreMail-Repository aus
   - Klicken Sie auf "Import"

4. **Projekt konfigurieren**
   - **Framework Preset:** Next.js (wird automatisch erkannt)
   - **Root Directory:** `./` (Standard)
   - **Build Command:** `npm run build` (Standard)
   - **Output Directory:** `.next` (Standard)
   - **Environment Variables:** Keine erforderlich! ✅

5. **Deploy starten**
   - Klicken Sie auf "Deploy"
   - Warten Sie 1-2 Minuten
   - Ihre App ist live! 🎉

6. **URL erhalten**
   - Nach dem Deployment erhalten Sie eine URL wie `coremail.vercel.app`
   - Diese können Sie sofort verwenden oder eine eigene Domain verbinden

### Automatische Updates
- Jeder Push zum `main`-Branch löst automatisch ein neues Deployment aus
- Preview-Deployments für Pull Requests werden automatisch erstellt

## 💻 Lokale Installation und Entwicklung

### Voraussetzungen
- Node.js 18+ ([Download](https://nodejs.org/))
- npm oder yarn

### Installation

1. **Repository klonen**
   ```bash
   git clone https://github.com/Zenovs/CoreMail.git
   cd CoreMail
   ```

2. **Dependencies installieren**
   ```bash
   npm install
   # oder
   yarn install
   ```

3. **Entwicklungsserver starten**
   ```bash
   npm run dev
   # oder
   yarn dev
   ```

4. **App öffnen**
   - Öffnen Sie [http://localhost:3000](http://localhost:3000) im Browser
   - Die App lädt automatisch bei Code-Änderungen neu

### Build für Produktion

```bash
npm run build
npm start
```

## 📖 Verwendung des Tools

### Schritt 1: CSV-Datei vorbereiten

Erstellen Sie eine CSV-Datei mit folgenden Spalten:
```csv
vorname,nachname,email,firma
Max,Mustermann,max@example.com,Musterfirma GmbH
Anna,Schmidt,anna@example.com,Schmidt AG
```

**Tipp:** Laden Sie die CSV-Vorlage direkt in der App herunter!

### Schritt 2: Kontakte hochladen

1. Klicken Sie auf "CSV-Datei auswählen"
2. Wählen Sie Ihre vorbereitete CSV-Datei
3. Die Kontakte werden sofort angezeigt

### Schritt 3: E-Mail-Template erstellen

Erstellen Sie Ihr HTML-Template mit Platzhaltern:

```html
<h1>Hallo [vorname] [nachname]!</h1>
<p>Vielen Dank für Ihr Interesse an unseren Dienstleistungen.</p>
<p>Wir freuen uns, [firma] als Partner zu gewinnen.</p>
<p>Bei Fragen erreichen Sie uns unter [email].</p>
```

**Verfügbare Platzhalter:**
- `[vorname]` - Vorname des Empfängers
- `[nachname]` - Nachname des Empfängers
- `[email]` - E-Mail-Adresse des Empfängers
- `[firma]` - Firma des Empfängers

### Schritt 4: SMTP-Server konfigurieren

Geben Sie Ihre SMTP-Daten ein:

**Beispiel Gmail:**
- Host: `smtp.gmail.com`
- Port: `587`
- Benutzer: `ihre-email@gmail.com`
- Passwort: `Ihr App-Passwort` (nicht Ihr normales Passwort!)

**Beispiel Outlook:**
- Host: `smtp-mail.outlook.com`
- Port: `587`
- Benutzer: `ihre-email@outlook.com`
- Passwort: `Ihr Passwort`

### Schritt 5: E-Mails versenden

1. Geben Sie Betreff und Absender-E-Mail ein
2. Klicken Sie auf "E-Mails versenden"
3. Warten Sie auf die Bestätigung
4. Überprüfen Sie den Versandreport

## 🛠️ Technologie-Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **E-Mail-Versand:** Nodemailer
- **CSV-Parsing:** PapaParse
- **Sprache:** TypeScript
- **Deployment:** Vercel (empfohlen)

### Warum dieser Stack?

- **Next.js:** Moderne React-Framework mit Server-Side Rendering
- **Tailwind CSS:** Schnelles, utility-first CSS-Framework
- **Nodemailer:** Zuverlässige E-Mail-Bibliothek mit SMTP-Support
- **TypeScript:** Typsicherheit für weniger Fehler
- **Vercel:** Optimiert für Next.js, kostenloses Hosting

## 🤝 Beitragen

Contributions sind willkommen! Bitte erstellen Sie einen Pull Request oder öffnen Sie ein Issue.

## 📄 Lizenz

MIT - Frei verwendbar für private und kommerzielle Projekte.

## 🐛 Bekannte Einschränkungen

- Keine Warteschlange für große E-Mail-Listen (>100 Empfänger)
- SMTP-Rate-Limits des Providers gelten
- Keine E-Mail-Tracking-Funktionen
- Keine Anhänge-Unterstützung (geplant)

## 💡 Geplante Features

- [ ] E-Mail-Anhänge
- [ ] MJML-Editor mit Vorschau
- [ ] Template-Bibliothek
- [ ] Versand-Zeitplanung
- [ ] A/B-Testing

---

**Entwickelt mit ❤️ für einfaches E-Mail-Marketing**

**Powered by [wireon](https://wireon.ch)**
