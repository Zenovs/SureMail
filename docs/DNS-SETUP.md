# DNS-Setup für coremail.ch

So bringst du die Landingpage unter **https://coremail.ch** zum Laufen.

---

## 1. GitHub Pages aktivieren (einmalig, ~1 Min)

1. Geh auf **https://github.com/Zenovs/coremail/settings/pages**
2. Unter **Source** wähle:
   - Branch: `initial-code`
   - Folder: `/docs`
3. Klick **Save**
4. Warte ~30 Sek — die Seite ist jetzt live unter `https://zenovs.github.io/coremail/`

GitHub erkennt automatisch die `docs/CNAME`-Datei und trägt `coremail.ch` als Custom-Domain ein.

---

## 2. DNS-Einträge bei deinem Registrar setzen

Bei dem Anbieter, wo du **coremail.ch** registriert hast (Hostpoint, Infomaniak, Cyon, GoDaddy etc.) — DNS-Verwaltung öffnen und folgende Records anlegen:

### Apex-Domain `coremail.ch` → 4× A-Records

| Typ | Name / Host | Wert | TTL |
|-----|-------------|------|-----|
| A | `@` (oder leer) | `185.199.108.153` | 3600 |
| A | `@` | `185.199.109.153` | 3600 |
| A | `@` | `185.199.110.153` | 3600 |
| A | `@` | `185.199.111.153` | 3600 |

> Das sind die **offiziellen GitHub-Pages-IPs** (siehe https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)

### Subdomain `www.coremail.ch` → 1× CNAME

| Typ | Name / Host | Wert | TTL |
|-----|-------------|------|-----|
| CNAME | `www` | `zenovs.github.io.` | 3600 |

> Der Punkt am Ende von `zenovs.github.io.` ist wichtig (sonst hängt mancher Registrar deine Domain dran).

---

## 3. Auf DNS-Propagation warten (5–60 Min)

Prüfen mit:

```bash
dig coremail.ch +short
# Erwartete Ausgabe: 185.199.108.153 (etc.)

dig www.coremail.ch +short
# Erwartete Ausgabe: zenovs.github.io. + GitHub-IPs
```

Oder online unter https://dnschecker.org/ (suche nach `coremail.ch` Type A).

---

## 4. HTTPS aktivieren (automatisch)

Sobald GitHub die DNS-Einträge sieht (kann 5–30 Min dauern):

1. Zurück auf **https://github.com/Zenovs/coremail/settings/pages**
2. Bei **Custom domain** sollte `coremail.ch` mit grünem Häkchen stehen
3. Häkchen bei **Enforce HTTPS** setzen — Let's Encrypt-Zertifikat wird automatisch ausgestellt

Fertig: **https://coremail.ch** zeigt jetzt die Landingpage 🎉

---

## Häufige Probleme

| Problem | Lösung |
|---|---|
| `Domain does not resolve to GitHub Pages servers` | A-Records noch nicht propagiert — 30 Min warten und neu prüfen |
| `Enforce HTTPS` ist ausgegraut | DNS noch nicht durch — sobald die Apex-A-Records auf alle 4 IPs zeigen, wird der Toggle aktiv |
| `www.coremail.ch` zeigt 404 | CNAME falsch — muss auf `zenovs.github.io.` zeigen, nicht direkt auf eine IP |
| Falsche Inhalte werden angezeigt | Browser-Cache leeren (Ctrl+Shift+R) — GitHub Pages CDN braucht ggf. ein paar Min |

---

## Nach Updates

Jeder Push auf den `initial-code`-Branch (Änderungen in `/docs/`) deployed die Seite automatisch neu — meist innerhalb von 1–2 Min.
