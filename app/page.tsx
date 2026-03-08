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
  X,
  Terminal,
  Shield
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
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Terminal className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold text-cyan-400 glow-text font-mono">CoreMail</h1>
          </div>
          <p className="text-zinc-500 text-sm font-mono">// Personalisierte E-Mail-Kampagnen</p>
        </div>

        {/* Compact Security Banner */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-2 mb-4 flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          <p className="text-xs text-emerald-400 font-mono">
            Verschlüsselte Session • Keine Datenspeicherung • Zero-Log Policy
          </p>
        </div>

        {/* Desktop Client Banner */}
        <a 
          href="/download" 
          className="block bg-gradient-to-r from-purple-500/10 to-cyan-500/10 border border-purple-500/30 rounded-lg px-4 py-3 mb-6 hover:from-purple-500/20 hover:to-cyan-500/20 transition-all group animate-pulse"
        >
          <div className="flex items-center justify-center gap-3">
            <Download className="w-5 h-5 text-purple-400" />
            <p className="text-sm text-purple-400 font-mono">
              <span className="font-bold">🚀 NEU:</span> CoreMail Desktop v1.7.1 – Bugfix Release!
              <span className="ml-2 group-hover:underline">Download →</span>
            </p>
          </div>
        </a>

        {/* Step Indicator */}
        <div className="flex justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex flex-col items-center cursor-pointer transition-all ${
                  currentStep >= step.id ? 'text-cyan-400' : 'text-zinc-600'
                }`}
                onClick={() => step.id < currentStep && setCurrentStep(step.id)}
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center mb-2 transition-all border ${
                    currentStep > step.id
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      : currentStep === step.id
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400 shadow-glow-cyan'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-500'
                  }`}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <span className="text-sm font-medium hidden md:block font-mono">{step.title}</span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`w-12 md:w-24 h-0.5 mx-2 rounded ${
                    currentStep > step.id ? 'bg-emerald-500/50' : 'bg-zinc-800'
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
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-cyan-400 text-center font-mono">&gt; Kontakte hochladen</h2>

              {/* Download Template */}
              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <Info className="w-5 h-5 text-cyan-400" />
                    <div>
                      <p className="font-medium text-zinc-200">CSV-Vorlage benötigt?</p>
                      <p className="text-sm text-zinc-500 font-mono">Spalten: vorname, nachname, email, firma</p>
                    </div>
                  </div>
                  <button onClick={downloadCsvTemplate} className="btn-secondary flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
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
                <div className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center hover:border-cyan-500/50 transition-colors bg-zinc-900/30">
                  <Upload className="w-12 h-12 text-cyan-400/50 mx-auto mb-4" />
                  <p className="text-lg font-medium text-zinc-300 mb-2">
                    CSV-Datei hierher ziehen oder klicken
                  </p>
                  <p className="text-sm text-zinc-600 font-mono">.csv</p>
                </div>
              </div>

              {csvFileName && (
                <p className="text-sm text-zinc-400 text-center font-mono">
                  <span className="text-emerald-400">✓</span> Geladen: <strong className="text-cyan-400">{csvFileName}</strong>
                </p>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-red-400 font-mono text-sm">{error}</p>
                </div>
              )}

              {/* Contact Preview */}
              {contacts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-emerald-400 font-mono">
                    <span className="text-zinc-500">[</span>{contacts.length}<span className="text-zinc-500">]</span> Kontakt{contacts.length !== 1 ? 'e' : ''} geladen
                  </h3>
                  <div className="max-h-64 overflow-y-auto border border-zinc-800 rounded-lg bg-zinc-900/50">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-800/80 sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-medium text-zinc-400 font-mono">vorname</th>
                          <th className="text-left p-3 font-medium text-zinc-400 font-mono">nachname</th>
                          <th className="text-left p-3 font-medium text-zinc-400 font-mono">email</th>
                          <th className="text-left p-3 font-medium text-zinc-400 font-mono">firma</th>
                          <th className="p-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {contacts.map((contact, index) => (
                          <tr key={index} className="border-t border-zinc-800 hover:bg-zinc-800/30">
                            <td className="p-3 text-zinc-300">{contact.vorname}</td>
                            <td className="p-3 text-zinc-300">{contact.nachname}</td>
                            <td className="p-3 text-cyan-400 font-mono text-xs">{contact.email}</td>
                            <td className="p-3 text-zinc-400">{contact.firma}</td>
                            <td className="p-3">
                              <button
                                onClick={() => removeContact(index)}
                                className="text-red-400/60 hover:text-red-400 transition-colors"
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
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-cyan-400 text-center font-mono">&gt; E-Mail Template</h2>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-zinc-200">Verfügbare Platzhalter:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['[vorname]', '[nachname]', '[email]', '[firma]'].map((placeholder) => (
                        <code
                          key={placeholder}
                          className="bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 rounded text-cyan-400 text-sm font-mono"
                        >
                          {placeholder}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-2 font-mono text-sm">Betreff:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="input-field font-mono"
                  placeholder="z.B.: Hallo [vorname], wir haben Neuigkeiten!"
                />
              </div>

              <div>
                <label className="block font-medium text-zinc-300 mb-2 font-mono text-sm">
                  HTML Template:
                </label>
                <textarea
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="input-field font-mono text-sm text-zinc-300"
                  rows={16}
                  placeholder="HTML-Code hier einfügen..."
                />
              </div>

              {/* Preview */}
              {contacts.length > 0 && (
                <div>
                  <label className="block font-medium text-zinc-300 mb-2 font-mono text-sm">
                    Vorschau <span className="text-zinc-500">// {contacts[0].email}</span>
                  </label>
                  <div className="border border-zinc-700 rounded-lg p-4 bg-white max-h-64 overflow-y-auto">
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
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-cyan-400 text-center font-mono">&gt; SMTP-Server</h2>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-400 font-mono">
                  Zugangsdaten werden nicht gespeichert. Nur für aktuellen Versand.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-zinc-300 mb-2 font-mono text-sm">host *</label>
                  <input
                    type="text"
                    value={smtpConfig.host}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, host: e.target.value })}
                    className="input-field font-mono"
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-2 font-mono text-sm">port *</label>
                  <input
                    type="text"
                    value={smtpConfig.port}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, port: e.target.value })}
                    className="input-field font-mono"
                    placeholder="587"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-2 font-mono text-sm">username *</label>
                  <input
                    type="text"
                    value={smtpConfig.username}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, username: e.target.value })}
                    className="input-field font-mono"
                    placeholder="user@domain.com"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-2 font-mono text-sm">password *</label>
                  <input
                    type="password"
                    value={smtpConfig.password}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, password: e.target.value })}
                    className="input-field font-mono"
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-2 font-mono text-sm">from_email *</label>
                  <input
                    type="email"
                    value={smtpConfig.fromEmail}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, fromEmail: e.target.value })}
                    className="input-field font-mono"
                    placeholder="sender@domain.com"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-300 mb-2 font-mono text-sm">from_name</label>
                  <input
                    type="text"
                    value={smtpConfig.fromName}
                    onChange={(e) => setSmtpConfig({ ...smtpConfig, fromName: e.target.value })}
                    className="input-field"
                    placeholder="Firma GmbH"
                  />
                </div>
              </div>

              <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4">
                <h4 className="font-medium text-zinc-300 mb-2 font-mono text-sm">// Provider-Konfiguration:</h4>
                <ul className="text-sm text-zinc-500 space-y-1 font-mono">
                  <li><span className="text-cyan-400">Gmail:</span> smtp.gmail.com:587</li>
                  <li><span className="text-cyan-400">Outlook:</span> smtp-mail.outlook.com:587</li>
                  <li><span className="text-cyan-400">GMX:</span> mail.gmx.net:587</li>
                </ul>
              </div>
            </div>
          )}

          {/* Step 4: Send & Results */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-cyan-400 text-center font-mono">&gt; Versand starten</h2>

              {sendResults.length === 0 && (
                <>
                  {/* Summary */}
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 space-y-4 font-mono">
                    <h3 className="font-semibold text-zinc-300 text-sm">// Zusammenfassung</h3>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Users className="w-5 h-5 text-cyan-400" />
                        <span>recipients: <span className="text-emerald-400">{contacts.length}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Mail className="w-5 h-5 text-cyan-400" />
                        <span>from: <span className="text-zinc-200">{smtpConfig.fromName || smtpConfig.fromEmail}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <span>subject: <span className="text-zinc-200 truncate">{subject}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-zinc-400">
                        <Settings className="w-5 h-5 text-cyan-400" />
                        <span>server: <span className="text-zinc-200">{smtpConfig.host}:{smtpConfig.port}</span></span>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                      <p className="text-red-400 font-mono text-sm">{error}</p>
                    </div>
                  )}

                  <div className="text-center">
                    <button
                      onClick={sendEmails}
                      disabled={isSending}
                      className="btn-success text-lg px-8 py-4 flex items-center gap-3 mx-auto font-mono"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          Sende E-Mails...
                        </>
                      ) : (
                        <>
                          <Send className="w-6 h-6" />
                          EXECUTE [{contacts.length}]
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
                    <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-emerald-400 font-mono">Versand abgeschlossen</h3>
                    <p className="text-zinc-500 font-mono text-sm">
                      <span className="text-emerald-400">{sendResults.filter((r) => r.success).length}</span>
                      <span className="text-zinc-600"> / </span>
                      <span>{sendResults.length}</span> erfolgreich
                    </p>
                  </div>

                  <div className="max-h-96 overflow-y-auto border border-zinc-800 rounded-lg bg-zinc-900/50">
                    <table className="w-full text-sm">
                      <thead className="bg-zinc-800/80 sticky top-0">
                        <tr>
                          <th className="text-left p-3 font-medium text-zinc-400 font-mono">status</th>
                          <th className="text-left p-3 font-medium text-zinc-400 font-mono">email</th>
                          <th className="text-left p-3 font-medium text-zinc-400 font-mono">info</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sendResults.map((result, index) => (
                          <tr key={index} className="border-t border-zinc-800">
                            <td className="p-3">
                              {result.success ? (
                                <span className="flex items-center gap-1 text-emerald-400 font-mono text-xs">
                                  <CheckCircle className="w-4 h-4" /> OK
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-red-400 font-mono text-xs">
                                  <AlertCircle className="w-4 h-4" /> ERR
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-cyan-400 font-mono text-xs">{result.email}</td>
                            <td className="p-3 text-zinc-500 font-mono text-xs">{result.error || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="text-center pt-4">
                    <button onClick={resetAll} className="btn-primary font-mono">
                      &gt; Neue Kampagne
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          {sendResults.length === 0 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-zinc-800">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="btn-secondary flex items-center gap-2 disabled:opacity-50 font-mono"
              >
                <ArrowLeft className="w-4 h-4" />
                zurück
              </button>

              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                  className="btn-primary flex items-center gap-2 font-mono"
                >
                  weiter
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-8 text-sm font-mono">
          <p className="text-zinc-600">CoreMail <span className="text-zinc-700">© {new Date().getFullYear()}</span></p>
          <p className="mt-2 text-zinc-700">
            Powered by <a href="https://wireon.ch" target="_blank" rel="noopener noreferrer" className="text-cyan-500/70 hover:text-cyan-400 transition-colors">wireon</a>
          </p>
        </footer>
      </div>
    </main>
  )
}
