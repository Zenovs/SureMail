# CoreMail Desktop auf Flathub veröffentlichen

> **Status**: Manifest ist vorbereitet (`flatpak/com.coremail.Desktop.yml`). Das Veröffentlichen auf Flathub ist ein **manueller PR-Prozess** beim externen Repo `flathub/flathub`.

## Voraussetzungen

```bash
sudo apt install flatpak flatpak-builder
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo
flatpak install -y flathub org.flatpak.Builder
flatpak install -y flathub org.electronjs.Electron2.BaseApp//23.08
flatpak install -y flathub org.freedesktop.Platform//23.08 org.freedesktop.Sdk//23.08
```

## 1. Lokal testen

Vor dem PR auf Flathub muss der Build sauber durchlaufen.

### a) SHA256 in das Manifest eintragen

Im `flatpak/com.coremail.Desktop.yml` die `PLACEHOLDER_SHA256_*`-Werte mit den realen Hashes aus dem letzten GitHub-Release ersetzen:

```bash
curl -s https://github.com/Zenovs/coremail/releases/latest/download/SHA256SUMS.txt
```

Beispiel-Ausgabe:
```
abc123...def x86_64.AppImage
fed987...cba arm64.AppImage
```

→ jeweils in das Manifest eintragen.

### b) Build + Install lokal

```bash
flatpak-builder --user --install --force-clean build-dir flatpak/com.coremail.Desktop.yml
flatpak run com.coremail.Desktop
```

Wenn das funktioniert: weiter zu Flathub.

## 2. Auf Flathub einreichen

Flathub akzeptiert keine direkten Releases — alles geht via Pull-Request beim Meta-Repo `flathub/flathub`.

### Schritt 1 — Fork & PR vorbereiten

```bash
# Fork: https://github.com/flathub/flathub klicken
git clone https://github.com/<DEIN-USER>/flathub.git
cd flathub
git checkout new-pr
git submodule add https://github.com/Zenovs/coremail-flatpak com.coremail.Desktop
git commit -am "Add com.coremail.Desktop"
git push origin new-pr
```

> Du brauchst ein **separates Repo** für die Flatpak-Manifeste — z.B. `Zenovs/coremail-flatpak`.
> Inhalt: alle Dateien aus `flatpak/`, plus eine `flathub.json` mit Build-Optionen.

### Schritt 2 — PR auf Flathub einreichen

Auf https://github.com/flathub/flathub/pulls einen PR von deinem `new-pr`-Branch öffnen. **Beschreibung**:
- App-Beschreibung
- Link auf Quellcode + Lizenz
- Verifikation der App-ID (`com.coremail.Desktop` muss zur eigenen Domain passen)

### Schritt 3 — Review & Build

Flathub-Reviewer prüfen das Manifest (kann 1-4 Wochen dauern). Bei Erfolg: das Repo `flathub/com.coremail.Desktop` wird angelegt — von dort kommen alle künftigen Builds.

### Schritt 4 — Updates ausliefern

Bei jedem neuen CoreMail-Release musst du im **`flathub/com.coremail.Desktop`-Repo** die neuen URL + SHA256 im Manifest aktualisieren und einen Commit pushen — Flathub baut automatisch und published.

Das lässt sich auch via [Flat-Manager-Bot](https://docs.flathub.org/docs/for-app-authors/updates) automatisieren.

---

## Domain-Verifikation für `com.coremail.Desktop`

Damit Flathub akzeptiert, dass die App-ID `com.coremail.Desktop` zu dir gehört, musst du eine der folgenden Verifikationen aufsetzen:

**Variante A** — DNS-Eintrag bei `coremail.ch`:
```
TXT _flathub-verified."com.coremail.Desktop"  →  "<github-username>"
```

**Variante B** — Datei unter `https://coremail.ch/.well-known/org.flathub.VerifiedApps.txt`:
```
com.coremail.Desktop=<github-username>
```

---

## Wichtige Hinweise

- **Flathub-IDs sind unveränderlich** — wenn du `com.coremail.Desktop` einmal eingereicht hast, bleibt das die App-ID auf ewig.
- Die **Sandbox** schränkt CoreMail ein: kein direkter Zugriff aufs Home-Verzeichnis, nur `xdg-download` und `xdg-documents:ro`. Bei Anhängen kann das den User irritieren.
- **Auto-Update der App** (In-App-Update aus dem Settings-Menü) sollte auf Flatpak deaktiviert werden, da Flathub die Updates managt — siehe [Issue-Vorschlag](https://github.com/Zenovs/coremail/issues): `if (process.env.FLATPAK_ID) hideUpdateUI()`.

---

Wenn dir der Aufwand zu gross ist: AppImage + deb + rpm decken bereits die meisten Linux-Nutzer ab. Flatpak ist ein **Nice-to-Have**, kein Must.
