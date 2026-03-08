# 📦 GitHub Release erstellen - Anleitung

## Das Problem

Die AppImage-Datei ist mit **130 MB zu groß** für:
- Vercel (max ~50 MB pro Datei im public-Ordner)
- GitHub ohne LFS (max 100 MB)

## Die Lösung: GitHub Releases

GitHub Releases erlaubt Dateien bis zu **2 GB** pro Asset. Perfekt für das AppImage!

---

## Schritt-für-Schritt Anleitung

### 1. Zu GitHub Releases gehen

1. Öffne https://github.com/Zenovs/coremail/releases
2. Klicke auf **"Draft a new release"** (rechts oben)

### 2. Release erstellen

1. **Tag erstellen**: Klicke auf "Choose a tag" → gib `v1.0.0` ein → "Create new tag"
2. **Release title**: `CoreMail Desktop v1.0.0`
3. **Description** (optional):
   ```markdown
   ## CoreMail Desktop Client v1.0.0
   
   Der native Desktop-Client für CoreMail mit:
   - ✅ IMAP Support für alle E-Mail-Anbieter
   - ✅ Darknet Design
   - ✅ Lokale Datenspeicherung
   
   ### Download
   - `coremail-desktop-v1.0.0.AppImage` - Linux (64-bit)
   
   ### Installation
   ```bash
   chmod +x coremail-desktop-v1.0.0.AppImage
   ./coremail-desktop-v1.0.0.AppImage
   ```
   ```

### 3. AppImage hochladen

1. Scrolle zu **"Attach binaries"**
2. Klicke auf das Feld oder ziehe die Datei rein
3. Lade hoch: `/home/ubuntu/coremail-desktop/dist/CoreMail Desktop-1.0.0.AppImage`
4. **Warte bis der Upload fertig ist** (kann 1-2 Minuten dauern bei 130 MB)

### 4. Veröffentlichen

- Klicke auf **"Publish release"**

---

## Nach dem Release

Die Download-Seite auf https://suremail.vercel.app/download verlinkt bereits auf:
```
https://github.com/Zenovs/coremail/releases
```

Die Besucher können dort direkt das AppImage herunterladen.

---

## Hinweis

Das AppImage liegt lokal unter:
```
/home/ubuntu/coremail-desktop/dist/CoreMail Desktop-1.0.0.AppImage
```

Du musst es von deinem lokalen Computer hochladen, da die DeepAgent-VM keinen direkten Zugriff auf GitHub Release-Uploads hat.
