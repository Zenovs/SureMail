import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0c0e13] text-[#e4e6ed] font-sans">

      {/* NAV */}
      <nav className="border-b border-white/[0.06] px-8 h-14 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 bg-[#4f8ef7] rounded-lg flex items-center justify-center text-white text-xs font-semibold tracking-tight">
            cm
          </span>
          <span className="text-sm font-semibold tracking-tight">coreMail</span>
        </div>
        <div className="flex items-center gap-6 text-sm text-[#6b7280]">
          <a href="#features" className="hover:text-[#e4e6ed] transition-colors">Features</a>
          <a href="#download" className="hover:text-[#e4e6ed] transition-colors">Download</a>
          <Link
            href="/app"
            className="px-4 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-[#e4e6ed] hover:bg-white/[0.08] transition-colors text-sm"
          >
            Web-App →
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-8 pt-24 pb-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#4f8ef7]/20 bg-[#4f8ef7]/10 text-[#4f8ef7] text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4f8ef7] animate-pulse"></span>
            Ubuntu · Linux · Version 1.0
          </div>

          <h1 className="text-5xl font-light leading-[1.1] tracking-tight mb-6 text-[#e4e6ed]">
            Alle deine Mails.<br />
            <span className="text-[#4f8ef7]">Ein Ort.</span>
          </h1>

          <p className="text-[#6b7280] text-lg leading-relaxed mb-10 max-w-xl">
            coreMail ist ein lokaler Desktop-Client für Ubuntu. SMTP, IMAP und Exchange –
            übersichtlich zusammengefasst in Gruppen. Keine Cloud, keine Tracking, alles lokal.
          </p>

          <div className="flex items-center gap-4">
            <a
              href="#download"
              className="flex items-center gap-2.5 px-6 py-3 rounded-xl bg-[#4f8ef7] text-white font-medium text-sm hover:bg-[#3d7ef6] transition-all hover:-translate-y-0.5 shadow-lg shadow-[#4f8ef7]/20"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Für Ubuntu herunterladen
            </a>
            <Link
              href="/app"
              className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.08] text-[#6b7280] hover:text-[#e4e6ed] hover:border-white/[0.14] transition-all text-sm"
            >
              Web-App starten
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>

        {/* DASHBOARD PREVIEW */}
        <div className="mt-16 rounded-2xl border border-white/[0.06] bg-[#111318] overflow-hidden shadow-2xl shadow-black/60">
          {/* Window chrome */}
          <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.06] bg-[#0f1117]">
            <span className="w-3 h-3 rounded-full bg-[#f87171]/60"></span>
            <span className="w-3 h-3 rounded-full bg-[#fbbf24]/60"></span>
            <span className="w-3 h-3 rounded-full bg-[#34d399]/60"></span>
            <span className="ml-4 text-xs text-[#363c4a] font-mono">coreMail — Dashboard</span>
          </div>

          {/* Mock dashboard */}
          <div className="flex h-72">
            {/* Sidebar */}
            <div className="w-48 border-r border-white/[0.06] p-3 flex flex-col gap-1">
              <div className="text-[9px] font-medium tracking-widest text-[#363c4a] uppercase px-2 pb-1">Gruppen</div>
              {[
                { label: "Arbeit", count: 14, color: "#4f8ef7" },
                { label: "Privat", count: 8,  color: "#34d399" },
                { label: "Projekte", count: 6, color: "#fbbf24" },
                { label: "Newsletter", count: 3, color: "#a78bfa" },
              ].map((g) => (
                <div key={g.label} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.04] cursor-pointer group">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: g.color }}></span>
                  <span className="text-xs text-[#6b7280] group-hover:text-[#e4e6ed] flex-1 transition-colors">{g.label}</span>
                  <span className="text-[10px] text-[#363c4a]">{g.count}</span>
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex-1 p-4 flex flex-col gap-3">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: "31", lbl: "Ungelesen", color: "#4f8ef7" },
                  { val: "12", lbl: "Gesendet", color: "#34d399" },
                  { val: "3",  lbl: "Priorität", color: "#fbbf24" },
                  { val: "6",  lbl: "Konten",    color: "#a78bfa" },
                ].map((s) => (
                  <div key={s.lbl} className="rounded-lg border border-white/[0.05] bg-[#0f1117] p-2.5">
                    <div className="text-lg font-light" style={{ color: s.color }}>{s.val}</div>
                    <div className="text-[9px] text-[#363c4a] mt-0.5">{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Feed */}
              <div className="rounded-lg border border-white/[0.05] bg-[#0f1117] overflow-hidden flex-1">
                {[
                  { av: "SK", name: "Sarah Kirchner", tag: "max@firma.de", tagColor: "#4f8ef7", subj: "Q3-Report: Bitte bis Freitag reviewen", dot: true },
                  { av: "TB", name: "Thomas B.", tag: "max@gmail.com", tagColor: "#34d399", subj: "Re: Kickoff Meeting – Montag bestätigt", dot: true },
                  { av: "GH", name: "GitHub", tag: "contact@coremail.dev", tagColor: "#fbbf24", subj: "[coremail] Pull Request #47 gemergt", dot: false },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-2.5 px-3 py-2 border-b border-white/[0.04] last:border-0">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-semibold flex-shrink-0"
                      style={{ background: row.tagColor }}>
                      {row.av}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-medium text-[#e4e6ed]">{row.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded"
                          style={{ background: `${row.tagColor}18`, color: row.tagColor }}>
                          {row.tag}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#6b7280] truncate">{row.subj}</div>
                    </div>
                    {row.dot && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: row.tagColor }}></span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="max-w-6xl mx-auto px-8 py-20 border-t border-white/[0.06]">
        <p className="text-xs font-medium tracking-widest uppercase text-[#363c4a] mb-12">Features</p>
        <div className="grid grid-cols-3 gap-6">
          {[
            {
              icon: "⊞",
              title: "Alle Konten. Ein Dashboard.",
              desc: "SMTP, IMAP und Exchange-Konten in frei wählbare Gruppen zusammenfassen. Voller Überblick auf einen Blick.",
            },
            {
              icon: "🔒",
              title: "100% lokal. Keine Cloud.",
              desc: "Alle Mails bleiben auf deinem Gerät. Keine Drittserver, keine Datenweitergabe, kein Tracking.",
            },
            {
              icon: "✨",
              title: "KI-Zusammenfassungen.",
              desc: "Lange Mails automatisch zusammenfassen lassen. Antwortvorschläge mit einem Klick übernehmen.",
            },
            {
              icon: "🏢",
              title: "Exchange-Support.",
              desc: "Microsoft Exchange via EWS vollständig unterstützt – ideal für Unternehmensumgebungen.",
            },
            {
              icon: "⚡",
              title: "Schnell & nativ.",
              desc: "Electron-basiert, direkt auf Ubuntu installierbar. Keine Ladezeiten, kein Browser nötig.",
            },
            {
              icon: "🗂️",
              title: "Smarte Sortierung.",
              desc: "Mails werden automatisch kategorisiert. Newsletter, Priorität und mehr – ohne manuellen Aufwand.",
            },
          ].map((f) => (
            <div key={f.title} className="p-5 rounded-xl border border-white/[0.06] bg-[#111318] hover:border-white/[0.1] transition-colors">
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="text-sm font-medium text-[#e4e6ed] mb-2">{f.title}</div>
              <div className="text-sm text-[#6b7280] leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* DOWNLOAD */}
      <section id="download" className="max-w-6xl mx-auto px-8 py-20 border-t border-white/[0.06]">
        <p className="text-xs font-medium tracking-widest uppercase text-[#363c4a] mb-4">Download</p>
        <h2 className="text-3xl font-light text-[#e4e6ed] mb-3">coreMail für Ubuntu</h2>
        <p className="text-[#6b7280] mb-10 max-w-lg">
          Als <code className="text-[#4f8ef7] text-sm">.deb</code>-Paket direkt installierbar.
          Unterstützt Ubuntu 22.04 LTS und neuer.
        </p>

        <div className="grid grid-cols-3 gap-4 max-w-2xl">
          {/* Primary .deb */}
          <div className="col-span-2 p-5 rounded-xl border border-[#4f8ef7]/20 bg-[#4f8ef7]/[0.06] flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#e4e6ed] mb-1">coreMail 1.0.0</div>
              <div className="text-xs text-[#6b7280]">Ubuntu 22.04+ · .deb · ~85 MB</div>
            </div>
            <a
              href="/downloads/coremail_1.0.0_amd64.deb"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4f8ef7] text-white text-sm font-medium hover:bg-[#3d7ef6] transition-all hover:-translate-y-0.5"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v7M4 6.5l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              .deb herunterladen
            </a>
          </div>

          {/* AppImage */}
          <div className="p-5 rounded-xl border border-white/[0.06] bg-[#111318] flex flex-col justify-between">
            <div>
              <div className="text-xs font-medium text-[#e4e6ed] mb-1">AppImage</div>
              <div className="text-xs text-[#6b7280]">Alle Distros · ~90 MB</div>
            </div>
            <a
              href="/downloads/coreMail-1.0.0.AppImage"
              className="text-xs text-[#4f8ef7] hover:underline mt-3 inline-block"
            >
              Herunterladen →
            </a>
          </div>
        </div>

        {/* Install instructions */}
        <div className="mt-8 max-w-lg">
          <p className="text-xs text-[#363c4a] mb-3 uppercase tracking-widest font-medium">Installation</p>
          <div className="bg-[#0f1117] rounded-xl border border-white/[0.06] p-4 font-mono text-xs text-[#6b7280] space-y-1">
            <div><span className="text-[#363c4a]">$</span> <span className="text-[#34d399]">sudo</span> dpkg -i coremail_1.0.0_amd64.deb</div>
            <div className="text-[#363c4a]"># oder via AppImage:</div>
            <div><span className="text-[#363c4a]">$</span> chmod +x coreMail-1.0.0.AppImage && ./coreMail-1.0.0.AppImage</div>
          </div>
        </div>
      </section>

      {/* WEB APP CTA */}
      <section className="max-w-6xl mx-auto px-8 py-16 border-t border-white/[0.06]">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111318] p-10 flex items-center justify-between">
          <div>
            <div className="text-lg font-medium text-[#e4e6ed] mb-2">Lieber direkt im Browser?</div>
            <p className="text-[#6b7280] text-sm">CoreMail – der Web-Mailer läuft ohne Installation, direkt im Browser.</p>
          </div>
          <Link
            href="/app"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm font-medium text-[#e4e6ed] hover:bg-white/[0.1] transition-all flex-shrink-0 ml-8"
          >
            Web-App öffnen
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] px-8 py-8 max-w-6xl mx-auto flex items-center justify-between text-xs text-[#363c4a]">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 bg-[#4f8ef7] rounded flex items-center justify-center text-white text-[9px] font-semibold">cm</span>
          coreMail · MIT License
        </div>
        <div className="flex gap-6">
          <a href="https://github.com/Zenovs/coremail" className="hover:text-[#6b7280] transition-colors">GitHub</a>
          <a href="#download" className="hover:text-[#6b7280] transition-colors">Download</a>
          <Link href="/app" className="hover:text-[#6b7280] transition-colors">Web-App</Link>
        </div>
      </footer>

    </main>
  );
}
