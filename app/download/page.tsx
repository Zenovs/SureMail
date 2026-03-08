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
  Check
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-sm font-mono mb-6">
            <Monitor className="w-4 h-4" />
            <span>Desktop Client v1.1.0 - NEU!</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            CoreMail <span className="text-cyan-400">Desktop</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Der native Desktop-Client für CoreMail. Verwalte mehrere IMAP-Konten, nutze das neue Dashboard, 
            organisiere E-Mails in Kategorien und wähle aus 3 Themes – alles mit dem bekannten Darknet-Design.
          </p>
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
                  <span>Lädt CoreMail Desktop v1.1.0 von GitHub Releases herunter</span>
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
              <span>v1.1.0</span>
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

      {/* New in v1.1.0 Section */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-400/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              <span className="font-mono text-cyan-400">// </span>Neu in v1.1.0
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-dark-800/50 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Mehrere IMAP-Konten</h4>
                  <p className="text-gray-400 text-sm">Verwalte alle deine E-Mail-Konten an einem Ort.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-dark-800/50 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Kategorien & Gruppen</h4>
                  <p className="text-gray-400 text-sm">Organisiere E-Mails mit benutzerdefinierten Kategorien.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-dark-800/50 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">Dashboard</h4>
                  <p className="text-gray-400 text-sm">Übersicht aller Konten und Statistiken auf einen Blick.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-dark-800/50 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">E-Mail-Vorschau (Split-View)</h4>
                  <p className="text-gray-400 text-sm">Vorschau von E-Mails direkt in der Listenansicht.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-dark-800/50 rounded-xl p-4 md:col-span-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-white">3 Themes: Dark, Light & Minimal</h4>
                  <p className="text-gray-400 text-sm">Wähle dein bevorzugtes Design – von klassisch dunkel bis minimalistisch hell.</p>
                </div>
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
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-cyan-400/10 rounded-lg flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="font-bold mb-2">IMAP Support</h3>
              <p className="text-gray-400 text-sm">
                Voller IMAP-Support für alle gängigen E-Mail-Anbieter. 
                Verbinde dich mit Gmail, Outlook, oder deinem eigenen Mailserver.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-emerald-400/10 rounded-lg flex items-center justify-center mb-4">
                <Moon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="font-bold mb-2">3 Themes</h3>
              <p className="text-gray-400 text-sm">
                Dark, Light oder Minimal – wähle das Design, das zu dir passt.
                Schonend für die Augen, auch bei langen Sessions.
              </p>
            </div>
            <div className="bg-dark-800 border border-dark-700 rounded-xl p-6">
              <div className="w-12 h-12 bg-purple-400/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-bold mb-2">Lokal & Sicher</h3>
              <p className="text-gray-400 text-sm">
                Alle Daten bleiben auf deinem Rechner. 
                Keine Cloud, keine Tracking – volle Kontrolle über deine E-Mails.
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
          <p>CoreMail Desktop v1.1.0 • Powered by Electron</p>
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
