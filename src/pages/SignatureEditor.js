import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';

function SignatureEditor() {
  const { currentTheme } = useTheme();
  const { accounts } = useAccounts();
  const c = currentTheme.colors;
  
  const [signatures, setSignatures] = useState({});
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showPlaceholderHelp, setShowPlaceholderHelp] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    loadSignatures();
  }, []);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const loadSignatures = async () => {
    if (window.electronAPI?.loadSignatures) {
      const result = await window.electronAPI.loadSignatures();
      if (result.success) {
        setSignatures(result.signatures);
      }
    }
  };

  const saveSignatures = async (newSignatures) => {
    setSignatures(newSignatures);
    if (window.electronAPI?.saveSignatures) {
      await window.electronAPI.saveSignatures(newSignatures);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const getCurrentSignature = () => {
    return signatures[selectedAccountId] || { enabled: false, html: '', text: '', name: 'Standard' };
  };

  const updateSignature = (updates) => {
    const newSignatures = {
      ...signatures,
      [selectedAccountId]: {
        ...getCurrentSignature(),
        ...updates
      }
    };
    saveSignatures(newSignatures);
  };

  const applyFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    updateContentFromEditor();
  };

  const updateContentFromEditor = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.innerText;
      updateSignature({ html, text });
    }
  };

  const insertLink = () => {
    const url = prompt('URL eingeben:', 'https://');
    if (url) {
      applyFormat('createLink', url);
    }
  };

  const insertImage = () => {
    const url = prompt('Bild-URL eingeben:', 'https://i.ytimg.com/vi/6gmzKaBm3Tk/hq720.jpg?sqp=-oaymwE7CK4FEIIDSFryq4qpAy0IARUAAAAAGAElAADIQj0AgKJD8AEB-AH-CYACvAWKAgwIABABGF4gXiheMA8=&rs=AOn4CLB7ROvwwV1D5LENQ466b0OXzu7cEQ');
    if (url) {
      applyFormat('insertImage', url);
    }
  };

  const insertPlaceholder = (placeholder) => {
    const selectedAccount = accounts.find(a => a.id === selectedAccountId);
    let value = placeholder;
    
    switch (placeholder) {
      case '{{name}}':
        value = selectedAccount?.name || 'Name';
        break;
      case '{{email}}':
        value = selectedAccount?.smtp?.fromEmail || selectedAccount?.smtp?.username || 'email@example.com';
        break;
      case '{{date}}':
        value = new Date().toLocaleDateString('de-DE');
        break;
      case '{{company}}':
        value = 'Firma';
        break;
      case '{{phone}}':
        value = '+49 123 456789';
        break;
      default:
        break;
    }
    
    document.execCommand('insertText', false, value);
    updateContentFromEditor();
  };

  const currentSig = getCurrentSignature();
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  // Extended templates
  const templates = [
    {
      name: 'Einfach',
      desc: 'MfG + Name',
      icon: '📝',
      getHtml: (acc) => `<p>Mit freundlichen Grüßen</p><p><strong>${acc.name}</strong></p>`,
      getText: (acc) => `Mit freundlichen Grüßen\n${acc.name}`
    },
    {
      name: 'Professionell',
      desc: 'Name + E-Mail + Trennlinie',
      icon: '💼',
      getHtml: (acc) => {
        const email = acc.smtp?.fromEmail || acc.smtp?.username || '';
        return `<p style="border-top: 1px solid #ccc; padding-top: 12px; margin-top: 12px;">Mit freundlichen Grüßen</p><p><strong>${acc.name}</strong></p><p style="color: #666; font-size: 12px;">E-Mail: <a href="mailto:${email}">${email}</a></p>`;
      },
      getText: (acc) => {
        const email = acc.smtp?.fromEmail || acc.smtp?.username || '';
        return `---\nMit freundlichen Grüßen\n${acc.name}\nE-Mail: ${email}`;
      }
    },
    {
      name: 'Business',
      desc: 'Vollständig mit Telefon',
      icon: '🏢',
      getHtml: (acc) => {
        const email = acc.smtp?.fromEmail || acc.smtp?.username || '';
        return `<table style="font-family: Arial, sans-serif; font-size: 12px; color: #333;"><tr><td style="border-right: 2px solid #0891b2; padding-right: 15px;"><strong style="font-size: 14px; color: #0891b2;">${acc.name}</strong><br><span style="color: #666;">Position</span></td><td style="padding-left: 15px;"><span style="color: #666;">📧</span> <a href="mailto:${email}" style="color: #0891b2;">${email}</a><br><span style="color: #666;">📞</span> +49 123 456789</td></tr></table>`;
      },
      getText: (acc) => {
        const email = acc.smtp?.fromEmail || acc.smtp?.username || '';
        return `${acc.name}\nPosition\n📧 ${email}\n📞 +49 123 456789`;
      }
    },
    {
      name: 'Freundlich',
      desc: 'Mit Emoji',
      icon: '🌟',
      getHtml: (acc) => `<p>Beste Grüße 🌟</p><p>${acc.name}</p>`,
      getText: (acc) => `Beste Grüße 🌟\n${acc.name}`
    },
    {
      name: 'Minimal',
      desc: 'Nur Name',
      icon: '✨',
      getHtml: (acc) => `<p style="color: #666;">— ${acc.name}</p>`,
      getText: (acc) => `— ${acc.name}`
    },
    {
      name: 'Modern',
      desc: 'Mit Social Links',
      icon: '🚀',
      getHtml: (acc) => {
        const email = acc.smtp?.fromEmail || acc.smtp?.username || '';
        return `<div style="font-family: Arial, sans-serif;"><p style="margin: 0; font-size: 14px;"><strong>${acc.name}</strong></p><p style="margin: 4px 0; font-size: 12px; color: #666;">${email}</p><p style="margin-top: 8px;"><a href="#" style="text-decoration: none; margin-right: 8px;">🔗 LinkedIn</a><a href="#" style="text-decoration: none; margin-right: 8px;">🐦 Twitter</a><a href="#" style="text-decoration: none;">🌐 Website</a></p></div>`;
      },
      getText: (acc) => {
        const email = acc.smtp?.fromEmail || acc.smtp?.username || '';
        return `${acc.name}\n${email}\n\nLinkedIn | Twitter | Website`;
      }
    }
  ];

  const applyTemplate = (template) => {
    if (!selectedAccount) return;
    const html = template.getHtml(selectedAccount);
    const text = template.getText(selectedAccount);
    updateSignature({ html, text });
    if (editorRef.current) editorRef.current.innerHTML = html;
  };

  return (
    <div className="space-y-6">
      {/* Saved Banner */}
      {saved && (
        <div className="p-3 bg-green-900/20 border border-green-600 rounded-lg text-green-400 text-center">
          ✓ Signatur gespeichert
        </div>
      )}

      {/* Account Selection */}
      {accounts.length > 1 && (
        <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
          <h3 className={`text-lg font-semibold ${c.text} mb-4`}>📧 Konto auswählen</h3>
          <div className="flex flex-wrap gap-2">
            {accounts.map(account => (
              <button
                key={account.id}
                onClick={() => setSelectedAccountId(account.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedAccountId === account.id
                    ? `${c.accentBg} text-white`
                    : `${c.bgTertiary} ${c.hover} ${c.text}`
                }`}
              >
                {account.name}
                {signatures[account.id]?.enabled && (
                  <span className="ml-2 text-green-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedAccount && (
        <>
          {/* Enable/Disable */}
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className={`font-semibold ${c.text}`}>✍️ Signatur aktivieren</span>
                <p className={`text-sm ${c.textSecondary}`}>
                  Signatur für "{selectedAccount.name}" automatisch anhängen
                </p>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={currentSig.enabled}
                  onChange={(e) => updateSignature({ enabled: e.target.checked })}
                  className="sr-only"
                />
                <div 
                  onClick={() => updateSignature({ enabled: !currentSig.enabled })}
                  className={`w-14 h-7 rounded-full transition-colors cursor-pointer ${
                    currentSig.enabled ? 'bg-cyan-500' : c.bgTertiary
                  }`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                    currentSig.enabled ? 'translate-x-7' : 'translate-x-0.5'
                  }`} />
                </div>
              </div>
            </label>
          </div>

          {/* Editor */}
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${c.text}`}>📝 Signatur bearbeiten</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1 rounded transition-colors ${
                    !previewMode ? `${c.accentBg} text-white` : `${c.bgTertiary} ${c.text}`
                  }`}
                >
                  Bearbeiten
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={`px-3 py-1 rounded transition-colors ${
                    previewMode ? `${c.accentBg} text-white` : `${c.bgTertiary} ${c.text}`
                  }`}
                >
                  Vorschau
                </button>
              </div>
            </div>

            {!previewMode ? (
              <>
                {/* Toolbar */}
                <div className={`flex flex-wrap gap-1 p-2 ${c.bgSecondary} rounded-t-lg border ${c.border}`}>
                  <button
                    onClick={() => applyFormat('bold')}
                    className={`p-2 ${c.hover} rounded ${c.text} font-bold`}
                    title="Fett"
                  >
                    B
                  </button>
                  <button
                    onClick={() => applyFormat('italic')}
                    className={`p-2 ${c.hover} rounded ${c.text} italic`}
                    title="Kursiv"
                  >
                    I
                  </button>
                  <button
                    onClick={() => applyFormat('underline')}
                    className={`p-2 ${c.hover} rounded ${c.text} underline`}
                    title="Unterstrichen"
                  >
                    U
                  </button>
                  <div className={`w-px h-6 ${c.bgTertiary} self-center mx-1`} />
                  <button
                    onClick={() => applyFormat('justifyLeft')}
                    className={`p-2 ${c.hover} rounded ${c.text}`}
                    title="Linksbündig"
                  >
                    ⫷
                  </button>
                  <button
                    onClick={() => applyFormat('justifyCenter')}
                    className={`p-2 ${c.hover} rounded ${c.text}`}
                    title="Zentriert"
                  >
                    ☰
                  </button>
                  <button
                    onClick={() => applyFormat('justifyRight')}
                    className={`p-2 ${c.hover} rounded ${c.text}`}
                    title="Rechtsbündig"
                  >
                    ⫸
                  </button>
                  <div className={`w-px h-6 ${c.bgTertiary} self-center mx-1`} />
                  <button
                    onClick={insertLink}
                    className={`p-2 ${c.hover} rounded ${c.text}`}
                    title="Link einfügen"
                  >
                    🔗
                  </button>
                  <button
                    onClick={insertImage}
                    className={`p-2 ${c.hover} rounded ${c.text}`}
                    title="Bild einfügen"
                  >
                    🖼️
                  </button>
                  <div className={`w-px h-6 ${c.bgTertiary} self-center mx-1`} />
                  <select
                    onChange={(e) => applyFormat('fontSize', e.target.value)}
                    className={`px-2 py-1 ${c.bgTertiary} ${c.text} rounded text-sm`}
                    defaultValue="3"
                  >
                    <option value="1">Klein</option>
                    <option value="3">Normal</option>
                    <option value="5">Groß</option>
                    <option value="7">Sehr groß</option>
                  </select>
                  <input
                    type="color"
                    onChange={(e) => applyFormat('foreColor', e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                    title="Textfarbe"
                    defaultValue="#ffffff"
                  />
                  <div className={`w-px h-6 ${c.bgTertiary} self-center mx-1`} />
                  <button
                    onClick={() => setShowPlaceholderHelp(!showPlaceholderHelp)}
                    className={`px-2 py-1 ${c.hover} rounded ${c.textSecondary} text-sm`}
                    title="Platzhalter"
                  >
                    {'{...}'}
                  </button>
                </div>

                {/* Placeholder Help */}
                {showPlaceholderHelp && (
                  <div className={`flex flex-wrap gap-2 p-3 ${c.bgTertiary} border-x ${c.border}`}>
                    <span className={`text-xs ${c.textSecondary} w-full mb-1`}>Klicke um einzufügen:</span>
                    {[
                      { key: '{{name}}', label: 'Name' },
                      { key: '{{email}}', label: 'E-Mail' },
                      { key: '{{date}}', label: 'Datum' },
                      { key: '{{company}}', label: 'Firma' },
                      { key: '{{phone}}', label: 'Telefon' }
                    ].map(p => (
                      <button
                        key={p.key}
                        onClick={() => insertPlaceholder(p.key)}
                        className={`px-2 py-1 ${c.bgSecondary} ${c.hover} ${c.text} rounded text-xs`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Editor Area */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={updateContentFromEditor}
                  className={`min-h-[200px] p-4 ${c.input} border ${c.border} ${showPlaceholderHelp ? '' : 'border-t-0'} rounded-b-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
                  dangerouslySetInnerHTML={{ __html: currentSig.html }}
                  style={{ color: 'white' }}
                />
              </>
            ) : (
              /* Preview */
              <div className={`p-6 bg-white rounded-lg min-h-[200px]`}>
                <p className="text-gray-500 text-sm mb-4">--- Signatur Vorschau ---</p>
                <div 
                  className="text-gray-800"
                  dangerouslySetInnerHTML={{ __html: currentSig.html || '<em>Keine Signatur</em>' }}
                />
              </div>
            )}
          </div>

          {/* Templates */}
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${c.text} mb-4`}>🎨 Vorlagen</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {templates.map((template, index) => (
                <button
                  key={index}
                  onClick={() => applyTemplate(template)}
                  className={`p-3 ${c.bgSecondary} ${c.hover} rounded-lg text-left transition-all hover:scale-[1.02]`}
                >
                  <span className="text-xl mb-2 block">{template.icon}</span>
                  <span className={`text-sm font-medium ${c.text}`}>{template.name}</span>
                  <p className={`text-xs ${c.textSecondary} mt-1`}>{template.desc}</p>
                </button>
              ))}
              <button
                onClick={() => {
                  updateSignature({ html: '', text: '' });
                  if (editorRef.current) editorRef.current.innerHTML = '';
                }}
                className={`p-3 ${c.bgSecondary} ${c.hover} rounded-lg text-left border border-red-500/30 hover:border-red-500`}
              >
                <span className="text-xl mb-2 block">🗑️</span>
                <span className={`text-sm font-medium text-red-400`}>Löschen</span>
                <p className={`text-xs ${c.textSecondary} mt-1`}>Signatur entfernen</p>
              </button>
            </div>
          </div>

          {/* Tips */}
          <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
            <h3 className={`text-lg font-semibold ${c.text} mb-4`}>💡 Tipps</h3>
            <ul className={`space-y-2 text-sm ${c.textSecondary}`}>
              <li>• Jedes Konto kann eine eigene Signatur haben</li>
              <li>• Aktiviere "Signatur aktivieren" um sie automatisch anzuhängen</li>
              <li>• Beim Verfassen kannst du die Signatur ein/ausschalten</li>
              <li>• Füge Bilder über URLs ein (z.B. Logo)</li>
            </ul>
          </div>
        </>
      )}

      {accounts.length === 0 && (
        <div className={`${c.card} ${c.border} border rounded-xl p-8 text-center`}>
          <div className="text-4xl mb-4">✉️</div>
          <h3 className={`text-lg font-semibold ${c.text} mb-2`}>Keine Konten vorhanden</h3>
          <p className={`${c.textSecondary}`}>
            Füge zuerst ein E-Mail-Konto hinzu, um Signaturen zu erstellen.
          </p>
        </div>
      )}
    </div>
  );
}

export default SignatureEditor;
