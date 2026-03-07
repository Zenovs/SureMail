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
  Cpu
} from 'lucide-react'

export default function DownloadPage() {
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
            <span>Desktop Client v1.0.0</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            CoreMail <span className="text-cyan-400">Desktop</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Der native Desktop-Client für CoreMail. Lese und versende E-Mails direkt von deinem Desktop – 
            mit vollem IMAP-Support und dem bekannten Darknet-Design.
          </p>
        </div>
      </section>

      {/* Download Section */}
      <section className="py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-800 border border-dark-700 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-emerald-400 rounded-2xl flex items-center justify-center">
              <Download className="w-10 h-10 text-dark-900" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Download für Linux</h2>
            <p className="text-gray-400 mb-6">AppImage – Keine Installation erforderlich</p>
            
            <a 
              href="/downloads/coremail-desktop-v1.0.0.AppImage"
              download
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-dark-900 font-bold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:scale-105"
            >
              <Download className="w-5 h-5" />
              <span>CoreMail Desktop herunterladen</span>
            </a>
            
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <HardDrive className="w-4 h-4" />
                130 MB
              </span>
              <span className="flex items-center gap-1">
                <Cpu className="w-4 h-4" />
                Linux 64-bit
              </span>
              <span>v1.0.0</span>
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
              <h3 className="font-bold mb-2">Darknet Design</h3>
              <p className="text-gray-400 text-sm">
                Das bekannte dunkle Design von CoreMail – jetzt auch auf dem Desktop. 
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

      {/* Installation Guide */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">
            <span className="font-mono text-cyan-400">// </span>Installation
          </h2>
          <div className="bg-dark-800 border border-dark-700 rounded-xl p-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-cyan-400 text-dark-900 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold mb-2">AppImage herunterladen</h3>
                  <p className="text-gray-400 text-sm">Lade die AppImage-Datei über den Download-Button herunter.</p>
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
                    chmod +x coremail-desktop-v1.0.0.AppImage
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
                    ./coremail-desktop-v1.0.0.AppImage
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-dark-700">
        <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
          <p>CoreMail Desktop v1.0.0 • Powered by Electron</p>
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
