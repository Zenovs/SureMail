# 🔧 Azure AD App-Registrierung für CoreMail Desktop

Diese Anleitung beschreibt, wie du eine eigene Azure AD App-Registrierung erstellst, um CoreMail Desktop mit Microsoft 365 / Exchange zu verbinden.

## 📋 Warum eine eigene App-Registrierung?

CoreMail Desktop verwendet standardmässig die öffentliche Microsoft Office Client-ID (`d3590ed6-52b3-4102-aeff-aad2292ab01c`). In manchen Organisationen kann diese Client-ID blockiert sein oder eine **Administratorgenehmigung** erfordern:

- **"Administratorgenehmigung erforderlich"** - Der Azure AD Admin hat die Standard-Client-ID nicht freigegeben
- **Conditional Access Policies** - Unternehmensrichtlinien blockieren unbekannte Apps
- **Strenge Sicherheitsrichtlinien** - Nur genehmigte Apps dürfen auf Postfächer zugreifen

Mit einer **eigenen App-Registrierung** kann dein IT-Admin die App gezielt genehmigen.

---

## 🚀 Schritt-für-Schritt-Anleitung

### Schritt 1: Azure Portal öffnen

1. Gehe zu [https://portal.azure.com](https://portal.azure.com)
2. Melde dich mit deinem **Administrator-Konto** an
3. Navigiere zu **Azure Active Directory** → **App-Registrierungen**

   Oder direkt: [https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps)

---

### Schritt 2: Neue App-Registrierung erstellen

1. Klicke auf **"+ Neue Registrierung"**
2. Fülle das Formular aus:

   | Feld | Wert |
   |------|------|
   | **Name** | `CoreMail Desktop` |
   | **Unterstützte Kontotypen** | "Konten in einem beliebigen Organisationsverzeichnis" (Multi-Tenant) |
   | **Redirect URI** | Plattform: **Web** → `http://localhost:8847/oauth/callback` |

3. Klicke auf **"Registrieren"**

---

### Schritt 3: Redirect URI konfigurieren

1. Gehe zu **Authentifizierung** (im linken Menü)
2. Unter **Plattformkonfigurationen**, stelle sicher:
   - **Redirect URI**: `http://localhost:8847/oauth/callback`
   - **Typ**: Web
3. Unter **Erweiterte Einstellungen**:
   - ✅ **Öffentliche Clientflows zulassen**: **Ja**
4. Klicke auf **"Speichern"**

---

### Schritt 4: API-Berechtigungen hinzufügen

1. Gehe zu **API-Berechtigungen** (im linken Menü)
2. Klicke auf **"+ Berechtigung hinzufügen"** → **"Microsoft Graph"** → **"Delegierte Berechtigungen"**
3. Aktiviere folgende Berechtigungen:

   | Berechtigung | Beschreibung |
   |-------------|-------------|
   | `Mail.ReadWrite` | E-Mails lesen und schreiben |
   | `Mail.Send` | E-Mails senden |
   | `User.Read` | Profil und E-Mail-Adresse lesen |
   | `offline_access` | Refresh-Token für Dauerzugriff |

4. Klicke auf **"Berechtigungen hinzufügen"**

---

### Schritt 5: Administratorzustimmung erteilen

1. Klicke auf **"Administratorzustimmung für [Organisation] erteilen"**
2. Bestätige mit **"Ja"**
3. Alle Berechtigungen sollten jetzt einen grünen Haken haben ✅

---

### Schritt 6: Client-ID kopieren

1. Gehe zu **Übersicht** (im linken Menü)
2. Kopiere die **Anwendungs-ID (Client-ID)**
   - Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
3. **Achtung**: Du brauchst **kein Client-Secret** – CoreMail nutzt PKCE (öffentlicher Client)

---

### Schritt 7: Client-ID in CoreMail eingeben

1. Öffne **CoreMail Desktop**
2. Gehe zu **Kontenverwaltung** → **+ Neues Konto** (oder bestehendes bearbeiten)
3. Wähle **Microsoft 365 / Exchange** als Server-Vorlage
4. Im **OAuth2-Bereich**:
   - Füge deine **Azure AD Client-ID** in das Feld ein
   - Klicke auf **"Mit Microsoft anmelden"**
5. Folge dem Anmeldeprozess im Browser

---

## 🔍 Fehlerbehebung

### "AADSTS65002: Consent between first party application..."

**Problem**: Die Standard-Client-ID wird blockiert.
**Lösung**: Erstelle eine eigene App-Registrierung (diese Anleitung).

### "Administratorgenehmigung erforderlich"

**Problem**: Dein Azure AD Admin muss die Berechtigungen genehmigen.
**Lösung**: 
1. Sende die **Client-ID** deiner App-Registrierung an den Admin
2. Admin genehmigt die Berechtigungen im Azure Portal (Schritt 5)

### "redirect_uri mismatch"

**Problem**: Die Redirect URI stimmt nicht überein.
**Lösung**: Stelle sicher, dass in der App-Registrierung genau diese URI steht:
```
http://localhost:8847/oauth/callback
```

### Token-Refresh funktioniert nicht

**Problem**: Der Refresh-Token läuft ab.
**Lösung**: Stelle sicher, dass `offline_access` als Berechtigung aktiviert ist.

---

## 📚 Weiterführende Links

- [Microsoft: App-Registrierung](https://learn.microsoft.com/de-de/azure/active-directory/develop/quickstart-register-app)
- [Microsoft: OAuth 2.0 Authorization Code Flow mit PKCE](https://learn.microsoft.com/de-de/azure/active-directory/develop/v2-oauth2-auth-code-flow)
- [Microsoft: IMAP/SMTP OAuth2](https://learn.microsoft.com/de-de/exchange/client-developer/legacy-protocols/how-to-authenticate-an-imap-pop-smtp-application-by-using-oauth)

---

## ℹ️ Technische Details

| Parameter | Wert |
|-----------|------|
| **OAuth2 Flow** | Authorization Code + PKCE |
| **Token Endpoint** | `https://login.microsoftonline.com/common/oauth2/v2.0/token` |
| **Auth Endpoint** | `https://login.microsoftonline.com/common/oauth2/v2.0/authorize` |
| **Redirect URI** | `http://localhost:8847/oauth/callback` |
| **Client-Typ** | Öffentlich (Public Client, kein Secret) |
| **Standard Client-ID** | `d3590ed6-52b3-4102-aeff-aad2292ab01c` |

---

*Zuletzt aktualisiert für CoreMail Desktop v4.0.1*
