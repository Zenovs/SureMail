# Unsigned Builds — macOS & Windows

CoreMail Desktop ist **Open Source** und wird ohne kostenpflichtige Code-Signing-Zertifikate ausgeliefert. Auf Windows und macOS erscheinen daher beim ersten Start Sicherheitswarnungen. Das ist normal und kein Hinweis auf Schadsoftware — die Quelle (GitHub Actions, öffentliches Repo) ist nachvollziehbar.

Für die maximale Sicherheit kannst du immer den **SHA-256-Hash** vor dem Start verifizieren — siehe `SHA256SUMS.txt` im jeweiligen Release.

---

## 🪟 Windows

Beim Doppelklick auf `CoreMail-Desktop-X.Y.Z-x64.exe` erscheint **„Windows hat Ihren PC geschützt"** (SmartScreen). So entsperren:

1. Klick auf **„Weitere Informationen"**
2. Klick auf **„Trotzdem ausführen"**

Alternativ per Rechtsklick → **Eigenschaften** → unter „Sicherheit" das Häkchen bei **„Zulassen"** setzen → **OK**.

---

## 🍎 macOS

Beim Öffnen der `.dmg` und Start der App erscheint **„CoreMail Desktop kann nicht geöffnet werden, da der Entwickler nicht verifiziert werden kann"**. Workaround:

### Option A — über die App-Sicherheit (empfohlen)
1. App nach `/Applications` ziehen, einmal versuchen zu starten (Warnung schließen)
2. **Systemeinstellungen → Datenschutz & Sicherheit**
3. Ganz unten unter „Sicherheit" klick auf **„Dennoch öffnen"**
4. Beim nächsten Doppelklick auf die App → **„Öffnen"**

### Option B — per Terminal (für Erfahrene)
```bash
xattr -d com.apple.quarantine "/Applications/CoreMail Desktop.app"
```

---

## 🐧 Linux

AppImage / deb / rpm haben kein Signing-Problem auf Linux — einfach starten oder mit `apt`/`rpm` installieren. Die SHA256SUMS-Datei lässt sich trotzdem zur Verifikation nutzen:

```bash
sha256sum -c SHA256SUMS.txt --ignore-missing
```

---

## Für CoreMail-Maintainer: Signing aktivieren

Wenn du als Maintainer signierte Builds ausliefern willst, brauchst du:

### Apple (macOS)
- **Apple Developer Account** — 99 USD/Jahr
- Developer-ID-Application-Zertifikat → als `.p12` exportieren, base64 kodieren
- GitHub Secrets setzen:
  - `CSC_LINK` — base64 des `.p12`
  - `CSC_KEY_PASSWORD` — Passwort
  - `APPLE_ID` — Apple-Account
  - `APPLE_APP_SPECIFIC_PASSWORD` — App-spezifisches Passwort
  - `APPLE_TEAM_ID` — Team-ID

In `.github/workflows/release.yml` bei `build-macos` `CSC_IDENTITY_AUTO_DISCOVERY: true` setzen.

### Microsoft (Windows)
- **EV Code Signing Certificate** — ab ca. 250 USD/Jahr (Sectigo, DigiCert, etc.) — nötig für SmartScreen-Reputation ohne Wartezeit
- Als `.pfx` exportieren, base64 kodieren
- GitHub Secrets:
  - `CSC_LINK` — base64 des `.pfx`
  - `CSC_KEY_PASSWORD` — Passwort

Alternativ: ohne EV-Cert (~80 USD) → SmartScreen lernt erst nach mehreren Tausend Downloads, dass die Datei sicher ist.
