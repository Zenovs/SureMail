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
    return signatures[selectedAccountId] || { enabled: false, html: '', text: '' };
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

  const currentSig = getCurrentSignature();
  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

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
          <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Konto auswählen</h3>
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
                <span className={`font-semibold ${c.text}`}>Signatur aktivieren</span>
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
              <h3 className={`text-lg font-semibold ${c.text}`}>Signatur bearbeiten</h3>
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
                </div>

                {/* Editor Area */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={updateContentFromEditor}
                  className={`min-h-[200px] p-4 ${c.input} border ${c.border} border-t-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-cyan-500`}
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
            <h3 className={`text-lg font-semibold ${c.text} mb-4`}>Vorlagen</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const template = `<p>Mit freundlichen Grüßen</p><p><strong>${selectedAccount.name}</strong></p>`;
                  updateSignature({ html: template, text: `Mit freundlichen Grüßen\n${selectedAccount.name}` });
                  if (editorRef.current) editorRef.current.innerHTML = template;
                }}
                className={`p-3 ${c.bgSecondary} ${c.hover} rounded-lg text-left`}
              >
                <span className={`text-sm font-medium ${c.text}`}>Einfach</span>
                <p className={`text-xs ${c.textSecondary} mt-1`}>MfG + Name</p>
              </button>
              <button
                onClick={() => {
                  const email = selectedAccount.smtp?.fromEmail || selectedAccount.smtp?.username || '';
                  const template = `<p>Mit freundlichen Grüßen</p><p><strong>${selectedAccount.name}</strong></p><p style="color: #666; font-size: 12px;">E-Mail: ${email}</p>`;
                  updateSignature({ html: template, text: `Mit freundlichen Grüßen\n${selectedAccount.name}\nE-Mail: ${email}` });
                  if (editorRef.current) editorRef.current.innerHTML = template;
                }}
                className={`p-3 ${c.bgSecondary} ${c.hover} rounded-lg text-left`}
              >
                <span className={`text-sm font-medium ${c.text}`}>Professionell</span>
                <p className={`text-xs ${c.textSecondary} mt-1`}>Name + E-Mail</p>
              </button>
              <button
                onClick={() => {
                  const template = `<p>Beste Grüße 🌟</p><p>${selectedAccount.name}</p>`;
                  updateSignature({ html: template, text: `Beste Grüße 🌟\n${selectedAccount.name}` });
                  if (editorRef.current) editorRef.current.innerHTML = template;
                }}
                className={`p-3 ${c.bgSecondary} ${c.hover} rounded-lg text-left`}
              >
                <span className={`text-sm font-medium ${c.text}`}>Freundlich</span>
                <p className={`text-xs ${c.textSecondary} mt-1`}>Mit Emoji</p>
              </button>
              <button
                onClick={() => {
                  updateSignature({ html: '', text: '' });
                  if (editorRef.current) editorRef.current.innerHTML = '';
                }}
                className={`p-3 ${c.bgSecondary} ${c.hover} rounded-lg text-left`}
              >
                <span className={`text-sm font-medium ${c.text}`}>Löschen</span>
                <p className={`text-xs ${c.textSecondary} mt-1`}>Signatur entfernen</p>
              </button>
            </div>
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
