'use client'

import Link from 'next/link'
import { 
  Download, 
  Monitor, 
  Mail, 
  Moon, 
  Shield, 
  ArrowLeft,
  CheckCircle,
  Terminal,
  HardDrive,
  Cpu,
  ExternalLink,
  Github,
  Wrench,
  Zap,
  Copy,
  Check,
  Palette,
  Sparkles,
  RefreshCw,
  Paperclip,
  PenTool,
  LayoutDashboard,
  PanelLeft,
  GripVertical,
  Bot,
  MessageSquare,
  FileText,
  Wand2,
  Lock
} from 'lucide-react'
import { useState } from 'react'

export default function DownloadPage() {
  const githubReleaseUrl = 'https://github.com/Zenovs/coremail/releases'
  const [copiedCurl, setCopiedCurl] = useState(false)
  const [copiedWget, setCopiedWget] = useState(false)
  
  const curlCommand = 'curl -sSL https://suremail.vercel.app/install.sh | bash'
  const wgetCommand = 'wget -qO- https://suremail.vercel.app/install.sh | bash'
  
  const copyToClipboard = (text: string, setCopied: (val: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <main className="min-h-screen bg-dark-900 text-white">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-800/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-mono">// zurück zur App</span>
          </Link>
          <div className="flex items-center gap-2 text-cyan-400">
            <Terminal className="w-5 h-5" />
            <span className="font-mono font-bold">CoreMail</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-400/20 to-cyan-400/20 border border-purple-400/40 rounded-full text-purple-400 text-sm font-mono mb-6 animate-pulse">
            <Bot className="w-4 h-4" />
            <span>🚀 Desktop Client v1.6.0 - In-App Ollama Installation!</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            CoreMail <span className="text-cyan-400">Desktop</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Der native Desktop-Client mit <span className="text-purple-400 font-semibold">lokaler KI</span>! 
            KI-Chatbot, E-Mail-Zusammenfassungen, Antwort-Vorschläge – alles 100% lokal und privat.
          </p>
        </div>
      </section>

      {/* NEW: Neu in v1.6.0 Section - In-App Ollama Installation */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-500/20 via-cyan-500/15 to-emerald-500/20 border-2 border-purple-400/50 rounded-2xl p-8 relative overflow-hidden">
            {/* Background effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-2xl shadow-lg shadow-purple-400/30 flex items-center justify-center">
                  <Bot className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">
                    <span className="font-mono text-purple-400">// </span>Neu in v1.6.0
                  </h2>
                  <p className="text-gray-400 font-mono text-sm">Revolutionär: In-App Ollama-Installation!</p>
                </div>
              </div>

              {/* Feature Badges */}
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-400/10 border border-emerald-400/30 rounded-full">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-sm font-semibold">NEU: In-App Ollama-Installation (beim ersten Start!)</span>
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <span className="text-cyan-400 text-sm font-semibold">Theme-Fixes: Alle 6 Themes funktionieren!</span>
                </div>
              </div>

              {/* Privacy Badge */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-400/10 border border-emerald-400/30 rounded-full">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-sm font-semibold">100% Lokal – Keine Cloud, keine Datenübertragung!</span>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3 bg-dark-800/70 backdrop-blur rounded-xl p-4 border border-purple-400/20">
                  <div className="w-10 h-10 bg-purple-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">KI-Chatbot Widget</h4>
                    <p className="text-gray-400 text-sm">Dein persönlicher KI-Assistent direkt in CoreMail. Stelle Fragen, lass dir helfen – offline und privat.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-dark-800/70 backdrop-blur rounded-xl p-4 border border-cyan-400/20">
                  <div className="w-10 h-10 bg-cyan-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">E-Mails zusammenfassen</h4>
                    <p className="text-gray-400 text-sm">Lange E-Mails auf einen Blick verstehen. Die KI fasst den Inhalt für dich zusammen.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-dark-800/70 backdrop-blur rounded-xl p-4 border border-emerald-400/20">
                  <div className="w-10 h-10 bg-emerald-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Antwort-Vorschläge</h4>
                    <p className="text-gray-400 text-sm">Die KI generiert passende Antwort-Vorschläge basierend auf dem E-Mail-Inhalt.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 bg-dark-800/70 backdrop-blur rounded-xl p-4 border border-yellow-400/20">
                  <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Wand2 className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Text verbessern</h4>
                    <p className="text-gray-400 text-sm">Lass deine E-Mail-Texte professioneller klingen. Die KI verbessert Stil und Grammatik.</p>
                  </div>
                </div>
              </div>

              {/* AI Chat Preview */}
              <div className="bg-dark-800/50 rounded-xl p-6 border border-dark-700">
                <h4 className="font-mono text-purple-400 text-sm mb-4 text-center">// KI-Chatbot Vorschau</h4>
                <div className="max-w-md mx-auto space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-cyan-500/20 border border-cyan-400/30 rounded-lg rounded-br-none px-4 py-2 max-w-[80%]">
                      <p className="text-sm text-gray-300">Fasse diese E-Mail zusammen</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-purple-500/20 border border-purple-400/30 rounded-lg rounded-bl-none px-4 py-2 max-w-[80%]">
                      <p className="text-sm text-gray-300">📧 Diese E-Mail behandelt einen Projektvorschlag für Q2 mit einem Budget von 50.000€ und einer Deadline am 15. April.</p>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <span className="text-xs text-gray-500 font-mono">Powered by Ollama (llama3.2:1b)</span>
                  </div>
                </div>
              </div>

              {/* Ollama Info */}
              <div className="mt-6 bg-dark-900/50 rounded-xl p-4 border border-purple-400/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="font-mono text-purple-400 text-sm mb-1">Powered by Ollama</h4>
                    <p className="text-gray-400 text-xs">
                      Die KI läuft vollständig auf deinem Computer. Keine Internetverbindung erforderlich, keine Daten verlassen dein Gerät. 
                      Das Installationsscript bietet dir die Option, Ollama automatisch einzurichten.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Install Section */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-400/30 rounded-2xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-400/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Quick Install</h2>
                <p className="text-gray-400 text-sm">Eine Zeile – fertig installiert</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Kopiere einen der folgenden Befehle und füge ihn in dein Terminal ein:
            </p>
            
            {/* Curl Command */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 font-mono mb-2 block">Mit curl:</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-cyan-400 font-mono text-sm overflow-x-auto">
                  {curlCommand}
                </code>
                <button
                  onClick={() => copyToClipboard(curlCommand, setCopiedCurl)}
                  className="p-3 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-700 transition-colors"
                  title="Kopieren"
                >
                  {copiedCurl ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Wget Command */}
            <div className="mb-6">
              <label className="text-sm text-gray-400 font-mono mb-2 block">Mit wget:</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-cyan-400 font-mono text-sm overflow-x-auto">
                  {wgetCommand}
                </code>
                <button
                  onClick={() => copyToClipboard(wgetCommand, setCopiedWget)}
                  className="p-3 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-700 transition-colors"
                  title="Kopieren"
                >
                  {copiedWget ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            {/* What does it do? */}
            <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-4">
              <h4 className="font-mono text-emerald-400 text-sm mb-3">// Was macht das Script?</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Prüft und installiert automatisch <code className="text-cyan-400">FUSE</code> (benötigt für AppImages)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Lädt CoreMail Desktop v1.6.0 von GitHub Releases herunter</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Installiert <strong className="text-purple-400">Ollama automatisch</strong> für lokale KI</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Installiert nach <code className="text-cyan-400">~/.local/bin/coremail-desktop</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Erstellt einen Desktop-Eintrag im App-Menü</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span>Alternative ohne FUSE: Extrahiert das AppImage automatisch</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-dark-700">
                <p className="text-xs text-yellow-400/80 flex items-start gap-2">
                  <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Hinweis:</strong> Für die automatische FUSE-Installation werden einmalig sudo-Rechte benötigt. 
                    Falls kein sudo verfügbar ist, wird das AppImage automatisch extrahiert.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Download Section */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-2xl flex items-center justify-center">
              <Download className="w-10 h-10 text-dark-900" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Manuelle Installation</h2>
            <p className="text-gray-400 mb-6">Für Sicherheitsbewusste: Lade direkt von GitHub herunter</p>
            
            <a 
              href={githubReleaseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-dark-900 font-bold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:scale-105"
            >
              <Github className="w-5 h-5" />
              <span>Download auf GitHub Releases</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <HardDrive className="w-4 h-4" />
                ~130 MB
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-4 h-4" />
                Linux 64-bit
              </span>
              <span className="text-purple-400 font-bold">v1.6.0</span>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-cyan-400/5 border border-cyan-400/20 rounded-xl text-left">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-400/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-mono text-cyan-400 text-sm mb-1">Sicherheitshinweis</h3>
                  <p className="text-gray-400 text-sm">
                    Du kannst das Installations-Script vor der Ausführung prüfen: 
                    <code className="text-cyan-400 ml-1">curl -sSL https://suremail.vercel.app/install.sh</code>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Build from Source */}
          <div className="mt-6 bg-dark-800/50 border border-dark-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Wrench className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold">Selbst bauen (für Entwickler)</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Du kannst den Desktop-Client auch selbst aus dem Quellcode bauen:
            </p>
            <div className="space-y-2">
              <code className="block bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-cyan-400 font-mono text-sm">
                git clone https://github.com/Zenovs/coremail-desktop.git
              </code>
              <code className="block bg-dark-900 border border-dark-700 rounded-lg px-4 py-2 text-cyan-400 font-mono text-sm">
                cd coremail-desktop && npm install && npm run build
              </code>
            </div>
          </div>
        </div>
      </section>

      {/* Previous Versions */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-400">
            <span className="font-mono text-gray-500">// </span>Frühere Versionen
          </h2>

          {/* v1.5.4 */}
          <div className="bg-dark-800/30 border border-dark-700 rounded-xl p-6 mb-4">
            <h3 className="font-bold text-gray-300 mb-3">v1.5.4 – Bugfix Release</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Robustere Ollama-Installation mit Logging</span>
              </div>
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Verbesserte Einstellungs-UI (breitere Leiste, Scrolling)</span>
              </div>
            </div>
          </div>

          {/* v1.4.0 */}
          <div className="bg-dark-800/30 border border-dark-700 rounded-xl p-6 mb-4">
            <h3 className="font-bold text-gray-300 mb-3">v1.4.0 – Customizable UI</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Individualisierbare Sidebar (Breite, Auto-Collapse, Icons-Only)</span>
              </div>
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Widget-Dashboard mit Drag & Drop</span>
              </div>
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Vollständig anpassbare Layouts</span>
              </div>
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Kombinierbar mit allen 6 Themes</span>
              </div>
            </div>
          </div>
          
          {/* v1.2.2 */}
          <div className="bg-dark-800/30 border border-dark-700 rounded-xl p-6 mb-4">
            <h3 className="font-bold text-gray-300 mb-3">v1.2.2 – Professionelles Icon</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Professionelles App-Icon für App-Menü und Taskleiste</span>
              </div>
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Version wird dynamisch aus package.json gelesen</span>
              </div>
            </div>
          </div>

          {/* v1.2.1 */}
          <div className="bg-dark-800/30 border border-dark-700 rounded-xl p-6 mb-4">
            <h3 className="font-bold text-gray-300 mb-3">v1.2.1 – Bugfix Release</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>E-Mail-Liste scrollt korrekt</span>
              </div>
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>E-Mail-Vorschau scrollt korrekt</span>
              </div>
            </div>
          </div>

          {/* v1.2.0 */}
          <div className="bg-dark-800/30 border border-dark-700 rounded-xl p-6">
            <h3 className="font-bold text-gray-300 mb-3">v1.2.0 – Feature Update</h3>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Desktop-Benachrichtigungen</span>
              </div>
              <div className="flex items-start gap-2 text-gray-500">
                <CheckCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                <span>Neues Icon & UI-Verbesserungen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            <span className="font-mono text-cyan-400">// </span>Features
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-400/10 rounded-lg flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-bold mb-2">Lokale KI</h3>
              <p className="text-gray-400 text-sm">
                KI-Chatbot, E-Mail-Zusammenfassungen und Antwort-Vorschläge – 
                alles lokal mit Ollama.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-cyan-400/10 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-bold mb-2">IMAP Support</h3>
              <p className="text-gray-400 text-sm">
                Voller IMAP-Support für alle gängigen E-Mail-Anbieter. 
                Gmail, Outlook, oder eigener Mailserver.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-emerald-400/10 rounded-lg flex items-center justify-center mb-4">
                <Palette className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-bold mb-2">6 Themes</h3>
              <p className="text-gray-400 text-sm">
                Dark, Light, Minimal, Morphismus, Glas oder Retro – 
                wähle das Design, das zu dir passt.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-yellow-400/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="font-bold mb-2">100% Privat</h3>
              <p className="text-gray-400 text-sm">
                Alle Daten bleiben auf deinem Rechner. 
                Keine Cloud, kein Tracking – volle Kontrolle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            <span className="font-mono text-cyan-400">// </span>Systemanforderungen
          </h2>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-mono text-cyan-400 mb-4">Minimum</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Ubuntu 20.04 oder neuer
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    64-bit Linux Distribution
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    2 GB RAM
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    200 MB freier Speicher
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-mono text-cyan-400 mb-4">Unterstützte Distros</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Ubuntu 20.04, 22.04, 24.04
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Debian 11, 12
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Fedora 38, 39
                  </li>
                  <li className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Linux Mint 21+
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Installation Guide (Manual) */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            <span className="font-mono text-cyan-400">// </span>Manuelle Installation
          </h2>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-400 text-dark-900 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold mb-2">AppImage von GitHub herunterladen</h3>
                  <p className="text-gray-400 text-sm">
                    Gehe zu den <a href={githubReleaseUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">GitHub Releases</a> und 
                    lade die neueste AppImage-Datei herunter.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-400 text-dark-900 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold mb-2">Ausführbar machen</h3>
                  <p className="text-gray-400 text-sm mb-2">Öffne ein Terminal und führe folgenden Befehl aus:</p>
                  <code className="block bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-cyan-400 font-mono text-sm">
                    chmod +x coremail-desktop-*.AppImage
                  </code>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-400 text-dark-900 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold mb-2">Starten</h3>
                  <p className="text-gray-400 text-sm mb-2">Doppelklicke auf die AppImage-Datei oder starte sie im Terminal:</p>
                  <code className="block bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-cyan-400 font-mono text-sm">
                    ./coremail-desktop-*.AppImage
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Uninstall Section */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-800/50 border border-dark-700 rounded-xl p-6">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-gray-400" />
              Deinstallation
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Um CoreMail Desktop zu deinstallieren, führe folgenden Befehl aus:
            </p>
            <code className="block bg-dark-900 border border-dark-700 rounded-lg px-4 py-3 text-red-400 font-mono text-sm">
              curl -sSL https://suremail.vercel.app/uninstall.sh | bash
            </code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-dark-700">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          <p>CoreMail Desktop v1.6.0 • Powered by Electron & Ollama</p>
          <p className="mt-2">
            <Link href="/" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Zur Web-App →
            </Link>
          </p>
        </div>
      </footer>
    </main>
  )
}
