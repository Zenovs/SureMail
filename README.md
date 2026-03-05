# 📧 SureMail - E-Mail Marketing Tool

Ein einfaches, benutzerfreundliches E-Mail-Marketing-Tool mit personalisierten Templates.

## Features

- **CSV-Upload**: Kontakte über CSV-Datei hochladen (Spalten: vorname, nachname, email, firma)
- **Template-Editor**: HTML/MJML-Templates mit Platzhaltern [vorname], [nachname], [email], [firma]
- **SMTP-Konfiguration**: Flexible SMTP-Server-Einstellungen
- **Personalisierter Versand**: Automatische Ersetzung der Platzhalter für jeden Empfänger
- **Versandübersicht**: Detaillierter Bericht nach dem Versand

## Sicherheit

- SMTP-Zugangsdaten werden **NICHT** dauerhaft gespeichert
- Alle Daten bleiben im Browser-Session und gehen beim Schließen verloren
- Keine Datenbank erforderlich

## Installation

```bash
npm install
npm run dev
```

## Deployment

### Vercel

1. Repository auf GitHub pushen
2. Bei [Vercel](https://vercel.com) anmelden
3. "New Project" → GitHub Repository auswählen
4. Deploy klicken

Die Anwendung ist sofort einsatzbereit ohne weitere Konfiguration.

## Verwendung

1. **Kontakte hochladen**: CSV-Datei mit den Spalten vorname, nachname, email, firma
2. **Template erstellen**: HTML eingeben mit Platzhaltern wie [vorname]
3. **SMTP konfigurieren**: Server-Daten eingeben
4. **Versenden**: E-Mails an alle Kontakte senden

## Technologien

- Next.js 14 (App Router)
- Tailwind CSS
- Nodemailer
- PapaParse

## Lizenz

MIT
