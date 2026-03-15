# 📧 CoreMail Desktop

Ein schlanker, moderner **E-Mail-Client für Linux** – einfach zu bedienen, lokal und sicher.

<p align="center">
  <img src="assets/icon.png" width="128" height="128" alt="CoreMail Desktop">
</p>

---

## 📥 Download

### AppImage (empfohlen)

```bash
# Direkt herunterladen und starten
curl -sSL https://raw.githubusercontent.com/Zenovs/coremail/initial-code/public/install.sh | bash
```

Oder manuell: **[CoreMail.Desktop-2.2.2.AppImage](https://github.com/Zenovs/coremail/releases)**

```bash
chmod +x CoreMail.Desktop-2.2.2.AppImage
./CoreMail.Desktop-2.2.2.AppImage
```

---

## ✨ Was kann CoreMail?

### 📬 E-Mail verwalten
- **Mehrere Konten** – Gmail, Outlook, Yahoo, GMX, WEB.DE, iCloud und mehr
- **Server-Vorlagen** – Schnelle Einrichtung mit vordefinierten Einstellungen
- **Kategorien** – Organisiere Konten nach Arbeit, Privat, etc.
- **Anzeigename** – Eigenen Absendernamen pro Konto festlegen

### 🛡️ Spam-Filter
- Automatische Erkennung von Spam, Werbung und Phishing
- Farbige Tags direkt in der E-Mail-Liste
- Whitelist & Blacklist

### 🔍 Globale Suche
- Alle Konten gleichzeitig durchsuchen
- Tastenkürzel: `Ctrl+K` oder `Cmd+K`
- Filter nach Datum, Anhängen, gelesen/ungelesen

### 🤖 KI-Assistent (optional)
- Lokale KI mit Ollama – keine Cloud, keine Daten raus
- E-Mails zusammenfassen
- Antwortvorschläge generieren

### 🎨 7 Themes mit dynamischen Icons
Dark, Light, Minimal, Morphismus, Glas, Retro, Foundations
- **Dynamische Icons**: Das App-Icon passt sich automatisch an das gewählte Theme an

### 📊 Dashboard
- Anpassbare Widgets für Statistiken und Schnellaktionen
- Drag & Drop

### 🔄 Auto-Update
- Prüft automatisch auf neue Versionen
- Ein-Klick-Update direkt im Client

---

## 🔧 Systemanforderungen

| | |
|---|---|
| **Betriebssystem** | Linux (x64) |
| **Speicher** | ~200 MB |
| **KI-Features** | Ollama + 4 GB RAM (optional) |

---

## 🔒 Datenschutz

| | |
|---|---|
| ✅ | Alle Daten bleiben **lokal** auf deinem Computer |
| ✅ | **Keine Cloud**, keine Telemetrie |
| ✅ | **Open Source** |
| ✅ | Verbindet sich nur zu deinen E-Mail-Servern |

---

## 📧 Unterstützte Anbieter

| Anbieter | App-Passwort nötig? |
|----------|---------------------|
| Gmail | ✅ Ja |
| Microsoft 365 / Outlook | ✅ Ja |
| iCloud | ✅ Ja |
| Yahoo | ✅ Ja |
| GMX | ❌ Nein |
| WEB.DE | ❌ Nein |
| IONOS / 1&1 | ❌ Nein |
| Jeder IMAP/SMTP Server | – |

---

## 🛠️ Aus Quellcode bauen

```bash
git clone https://github.com/Zenovs/coremail.git
cd coremail
npm install
npm run dev      # Entwicklung
npm run build    # AppImage erstellen
```

---

## 📜 Lizenz

MIT License

---

**CoreMail Desktop** – Dein E-Mail-Client für Linux 📧
