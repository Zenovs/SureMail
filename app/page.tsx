'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Upload, 
  FileText, 
  Mail, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Info,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Users,
  Settings,
  X
} from 'lucide-react'
import Papa from 'papaparse'

interface Contact {
  vorname: string
  nachname: string
  email: string
  firma: string
}

interface SmtpConfig {
  host: string
  port: string
  username: string
  password: string
  fromEmail: string
  fromName: string
}

interface SendResult {
  email: string
  success: boolean
  error?: string
}

const STEPS = [
  { id: 1, title: 'Kontakte', icon: Users, description: 'CSV-Datei hochladen' },
  { id: 2, title: 'Template', icon: FileText, description: 'E-Mail Vorlage erstellen' },
  { id: 3, title: 'SMTP', icon: Settings, description: 'E-Mail-Server konfigurieren' },
  { id: 4, title: 'Versenden', icon: Send, description: 'E-Mails versenden' },
]

const DEFAULT_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>E-Mail</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1 style="color: #2563eb;">Hallo [vorname] [nachname]!</h1>
    
    <p>Wir freuen uns, Ihnen diese Nachricht zu senden.</p>
    
    <p>Als Mitarbeiter von <strong>[firma]</strong> möchten wir Sie über unsere neuesten Angebote informieren.</p>
    
    <p>Bei Fragen erreichen Sie uns jederzeit.</p>
    
    <p>Mit freundlichen Grüßen,<br>
    Ihr Team</p>
  </div>
</body>
</html>`

export default function Home() {
  const [currentStep, setCurrentStep] = useState(1)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [subject, setSubject] = useState('Ihre persönliche Nachricht, [vorname]!')
  const [smtpConfig, setSmtpConfig] = useState<SmtpConfig>({
    host: '',
    port: '587',
    username: '',
    password: '',
    fromEmail: '',
    fromName: '',
  })
  const [isSending, setIsSending] = useState(false)
  const [sendResults, setSendResults] = useState<SendResult[]>([])
  const [error, setError] = useState<string | null>(null)
  const [csvFileName, setCsvFileName] = useState<string | null>(null)

  // Warning when leaving page with data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (contacts.length > 0 || smtpConfig.host) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [contacts, smtpConfig])

  const downloadCsvTemplate = () => {
    const csvContent = 'vorname,nachname,email,firma\nMax,Mustermann,max@beispiel.de,Beispiel GmbH\nErika,Musterfrau,erika@firma.de,Test AG'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'coremail_vorlage.csv'
    link.click()
  }

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setError(null)
    setCsvFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[]
        
        // Validate columns
        const requiredColumns = ['vorname', 'nachname', 'email', 'firma']
        const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase().trim())
        const missingColumns = requiredColumns.filter(col => !headers.includes(col))
        
        if (missingColumns.length > 0) {
          setError(`Fehlende Spalten: ${missingColumns.join(', ')}. Bitte laden Sie die Vorlage herunter.`)
          return
        }

        // Validate and map contacts
        const validContacts: Contact[] = []
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

        data.forEach((row, index) => {
          const normalizedRow: any = {}
          Object.keys(row).forEach(key => {
            normalizedRow[key.toLowerCase().trim()] = row[key]?.trim() || ''
          })

          const contact: Contact = {
            vorname: normalizedRow.vorname || '',
            nachname: normalizedRow.nachname || '',
            email: normalizedRow.email || '',
            firma: normalizedRow.firma || '',
          }

          if (contact.email && emailRegex.test(contact.email)) {
            validContacts.push(contact)
          } else if (contact.email) {
            console.warn(`Zeile ${index + 2}: Ungültige E-Mail-Adresse: ${contact.email}`)
          }
        })

        if (validContacts.length === 0) {
          setError('Keine gültigen E-Mail-Adressen in der CSV gefunden.')
          return
        }

        setContacts(validContacts)
      },
      error: (err) => {
        setError(`CSV-Fehler: ${err.message}`)
      },
    })
  }

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index))
  }

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return contacts.length > 0
      case 2:
        return template.trim().length > 0 && subject.trim().length > 0
      case 3:
        return (
          smtpConfig.host.trim().length > 0 &&
          smtpConfig.port.trim().length > 0 &&
          smtpConfig.username.trim().length > 0 &&
          smtpConfig.password.trim().length > 0 &&
          smtpConfig.fromEmail.trim().length > 0
        )
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < 4) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const sendEmails = async () => {
    setIsSending(true)
    setError(null)
    setSendResults([])

    try {
      const response = await fetch('/api/send-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts,
          template,
          subject,
          smtpConfig,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Fehler beim Senden der E-Mails')
      }

      setSendResults(data.results)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSending(false)
    }
  }

  const resetAll = () => {
    setCurrentStep(1)
    setContacts([])
    setTemplate(DEFAULT_TEMPLATE)
    setSubject('Ihre persönliche Nachricht, [vorname]!')
    setSmtpConfig({
      host: '',
      port: '587',
      username: '',
      password: '',
      fromEmail: '',
      fromName: '',
    })
    setSendResults([])
    setError(null)
    setCsvFileName(null)
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">📧 CoreMail</h1>
          <p className="text-gray-600">Einfaches E-Mail-Marketing mit personalisierten Templates</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Hinweis:</strong> Ihre Daten werden nur im Browser gespeichert und gehen beim Schließen des Tabs verloren. SMTP-Zugangsdaten werden nicht dauerhaft gespeichert.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex flex-col items-center cursor-pointer transition-all ${
                  currentStep >= step.id ? 'text-blue-600' : 'text-gray-400'
                }`}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                    currentStep > step.id
                      ? 'bg-green-500 text-white'
                      : currentStep === step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <span className="text-sm font-medium hidden md:block">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-12 md:w-24 h-1 mx-2 rounded ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="card">
          {/* Step 1: CSV Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Schritt 1: Kontakte hochladen</h2>
                <p className="text-gray-600">Laden Sie eine CSV-Datei mit Ihren Kontakten hoch.</p>
              </div>

              {/* Download Template */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-800">CSV-Vorlage benötigt?</p>
                      <p className="text-sm text-blue-600">Spalten: vorname, nachname, email, firma</p>
                    </div>
                  </div>
                  <button onClick={downloadCsvTemplate} className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Vorlage herunterladen
                  </button>
                </div>
              </div>

              {/* Upload Area */}
              <div className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-blue-500 transition-colors">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-700 mb-2">
                    CSV-Datei hierher ziehen oder klicken
                  </p>
                  <p className="text-sm text-gray-500">Unterstützt: .csv Dateien</p>
                </div>
              </div>

              {csvFileName && (
                <p className="text-sm text-gray-600 text-center">
                  📄 Geladene Datei: <strong>{csvFileName}</strong>
                </p>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {/* Contact Preview */}
              {contacts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">
                    ✅ {contacts.length} Kontakt{contacts.length !== 1 ? 'e' : ''} geladen
                  </h3>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-medium">Vorname</th>
                          <th className="text-left p-3 font-medium">Nachname</th>
                          <th className="text-left p-3 font-medium">E-Mail</th>
                          <th className="text-left p-3 font-medium">Firma</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((contact, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="p-3">{contact.vorname}</td>
                            <td className="p-3">{contact.nachname}</td>
                            <td className="p-3">{contact.email}</td>
                            <td className="p-3">{contact.firma}</td>
                            <td className="p-3">
                              <button
                                onClick={() => removeContact(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Template */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Schritt 2: E-Mail Template</h2>
                <p className="text-gray-600">Erstellen Sie Ihr E-Mail-Template mit Platzhaltern.</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800">Verfügbare Platzhalter:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['[vorname]', '[nachname]', '[email]', '[firma]'].map((placeholder) => (
                        <code
                          key={placeholder}
                          className="bg-green-100 px-2 py-1 rounded text-green-800 text-sm"
                        >
                          {placeholder}
                        </code>
                      ))}
                    </div>
                    <p className="text-sm text-green-700 mt-2">
                      Diese werden automatisch durch die Daten aus der CSV ersetzt.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">E-Mail Betreff</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field"
                  placeholder="z.B.: Hallo [vorname], wir haben Neuigkeiten!"
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  HTML/MJML Template
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Sie können HTML von MJML.io einfügen)
                  </span>
                </label>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="input-field font-mono text-sm"
                  rows={16}
                  placeholder="Fügen Sie hier Ihren HTML-Code ein..."
                />
              </div>

              {/* Preview */}
              {contacts.length > 0 && (
                <div>
                  <label className="block font-medium text-gray-700 mb-2">
                    Vorschau (für: {contacts[0].vorname} {contacts[0].nachname})
                  </label>
                  <div className="border rounded-lg p-4 bg-white max-h-64 overflow-y-auto">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: template
                          .replace(/\[vorname\]/g, contacts[0].vorname)
                          .replace(/\[nachname\]/g, contacts[0].nachname)
                          .replace(/\[email\]/g, contacts[0].email)
                          .replace(/\[firma\]/g, contacts[0].firma),
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: SMTP Configuration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Schritt 3: SMTP Konfiguration</h2>
                <p className="text-gray-600">Geben Sie Ihre E-Mail-Server-Daten ein.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Ihre SMTP-Zugangsdaten werden nur für den aktuellen Versand verwendet und NICHT gespeichert.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-gray-700 mb-2">SMTP Host *</label>
                  <input
                    type="text"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    className="input-field"
                    placeholder="z.B.: smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2">SMTP Port *</label>
                  <input
                    type="text"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                    className="input-field"
                    placeholder="z.B.: 587"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Benutzername *</label>
                  <input
                    type="text"
                    value={smtpConfig.username}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                    className="input-field"
                    placeholder="z.B.: ihre@email.de"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Passwort *</label>
                  <input
                    type="password"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                    className="input-field"
                    placeholder="SMTP-Passwort oder App-Passwort"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Absender E-Mail *</label>
                  <input
                    type="email"
                    value={smtpConfig.fromEmail}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                    className="input-field"
                    placeholder="absender@beispiel.de"
                  />
                </div>
                <div>
                  <label className="block font-medium text-gray-700 mb-2">Absender Name (optional)</label>
                  <input
                    type="text"
                    value={smtpConfig.fromName}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                    className="input-field"
                    placeholder="z.B.: Ihre Firma GmbH"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">💡 Hinweise für gängige Anbieter:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li><strong>Gmail:</strong> smtp.gmail.com, Port 587, App-Passwort erforderlich</li>
                  <li><strong>Outlook:</strong> smtp-mail.outlook.com, Port 587</li>
                  <li><strong>GMX:</strong> mail.gmx.net, Port 587</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Send & Results */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Schritt 4: E-Mails versenden</h2>
                <p className="text-gray-600">Überprüfen Sie Ihre Einstellungen und starten Sie den Versand.</p>
              </div>

              {sendResults.length === 0 && (
                <>
                  {/* Summary */}
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <h3 className="font-semibold text-gray-800">Zusammenfassung:</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span><strong>{contacts.length}</strong> Empfänger</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <span>Von: <strong>{smtpConfig.fromName || smtpConfig.fromEmail}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <span>Betreff: <strong>{subject}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-blue-600" />
                        <span>Server: <strong>{smtpConfig.host}:{smtpConfig.port}</strong></span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-red-800">{error}</p>
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={sendEmails}
                      disabled={isSending}
                      className="btn-success text-lg px-8 py-4 flex items-center gap-3 mx-auto"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          E-Mails werden versendet...
                        </>
                      ) : (
                        <>
                          <Send className="w-6 h-6" />
                          {contacts.length} E-Mail{contacts.length !== 1 ? 's' : ''} versenden
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Results */}
              {sendResults.length > 0 && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-gray-800">Versand abgeschlossen!</h3>
                    <p className="text-gray-600">
                      {sendResults.filter((r) => r.success).length} von {sendResults.length} E-Mails erfolgreich gesendet
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">E-Mail-Adresse</th>
                          <th className="text-left p-3 font-medium">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sendResults.map((result, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">
                              {result.success ? (
                                <span className="flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" /> Gesendet
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-600">
                                  <AlertCircle className="w-4 h-4" /> Fehler
                                </span>
                              )}
                            </td>
                            <td className="p-3">{result.email}</td>
                            <td className="p-3 text-gray-500">{result.error || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-center pt-4">
                    <button onClick={resetAll} className="btn-primary">
                      Neue Kampagne starten
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {sendResults.length === 0 && (
            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Zurück
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="btn-primary flex items-center gap-2"
                >
                  Weiter
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm text-gray-500">
          <p>CoreMail - Einfaches E-Mail-Marketing © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </main>
  )
}
