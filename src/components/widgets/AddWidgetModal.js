import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAccounts } from '../../context/AccountContext';
import { useDashboard, WIDGET_TYPES } from '../../context/DashboardContext';

function AddWidgetModal({ isOpen, onClose }) {
  const { currentTheme } = useTheme();
  const { accounts, categories } = useAccounts();
  const { addWidget } = useDashboard();
  const c = currentTheme.colors;

  const [step, setStep] = useState('type');
  const [selectedType, setSelectedType] = useState(null);
  const [selectedSize, setSelectedSize] = useState('medium');
  const [selectedConfig, setSelectedConfig] = useState({});

  const widgetTypes = [
    { id: WIDGET_TYPES.ACCOUNT, icon: '📧', name: 'Konto-Widget', desc: 'Zeigt ein E-Mail-Konto an' },
    { id: WIDGET_TYPES.CATEGORY, icon: '📁', name: 'Kategorie-Widget', desc: 'Zeigt eine Kategorie mit Konten' },
    { id: WIDGET_TYPES.STATS, icon: '📊', name: 'Statistik-Widget', desc: 'Zeigt Gesamtstatistiken' },
    { id: WIDGET_TYPES.QUICK_ACTIONS, icon: '⚡', name: 'Schnellaktionen', desc: 'Schnellzugriff auf Aktionen' }
  ];

  const sizeOptions = [
    { id: 'small', name: 'Klein', desc: '1/4 Breite' },
    { id: 'medium', name: 'Mittel', desc: '1/2 Breite' },
    { id: 'large', name: 'Groß', desc: 'Volle Breite' }
  ];

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    if (type === WIDGET_TYPES.ACCOUNT || type === WIDGET_TYPES.CATEGORY) {
      setStep('config');
    } else {
      setStep('size');
    }
  };

  const handleConfigSelect = (config) => {
    setSelectedConfig(config);
    setStep('size');
  };

  const handleAdd = () => {
    addWidget(selectedType, selectedConfig, selectedSize);
    handleClose();
  };

  const handleClose = () => {
    setStep('type');
    setSelectedType(null);
    setSelectedSize('medium');
    setSelectedConfig({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className={`${c.card} ${c.border} border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-auto shadow-2xl`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 ${c.border} border-b`}>
          <h2 className={`text-xl font-bold ${c.text}`}>
            {step === 'type' && '📦 Widget hinzufügen'}
            {step === 'config' && '⚙️ Widget konfigurieren'}
            {step === 'size' && '📐 Größe wählen'}
          </h2>
          <button onClick={handleClose} className={`${c.textSecondary} hover:${c.text} text-2xl`}>×</button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Schritt 1: Widget-Typ */}
          {step === 'type' && (
            <div className="grid grid-cols-2 gap-4">
              {widgetTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`p-4 rounded-xl ${c.border} border ${c.hover} text-left transition-all hover:border-cyan-500`}
                >
                  <span className="text-3xl mb-2 block">{type.icon}</span>
                  <span className={`font-semibold ${c.text} block`}>{type.name}</span>
                  <span className={`text-xs ${c.textSecondary}`}>{type.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Schritt 2: Konfiguration */}
          {step === 'config' && selectedType === WIDGET_TYPES.ACCOUNT && (
            <div className="space-y-3">
              <p className={`${c.textSecondary} mb-4`}>Wähle ein Konto für das Widget:</p>
              {accounts.length === 0 ? (
                <p className={c.textSecondary}>Keine Konten verfügbar</p>
              ) : (
                accounts.map(account => (
                  <button
                    key={account.id}
                    onClick={() => handleConfigSelect({ accountId: account.id, accountName: account.name })}
                    className={`w-full p-4 rounded-xl ${c.border} border ${c.hover} text-left flex items-center gap-3 transition-all hover:border-cyan-500`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">
                      {account.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className={`font-semibold ${c.text} block`}>{account.name}</span>
                      <span className={`text-xs ${c.textSecondary}`}>{account.email || account.imapUser}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {step === 'config' && selectedType === WIDGET_TYPES.CATEGORY && (
            <div className="space-y-3">
              <p className={`${c.textSecondary} mb-4`}>Wähle eine Kategorie für das Widget:</p>
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => handleConfigSelect({ categoryId: category.id, categoryName: category.name })}
                  className={`w-full p-4 rounded-xl ${c.border} border ${c.hover} text-left flex items-center gap-3 transition-all hover:border-cyan-500`}
                >
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className={`font-semibold ${c.text}`}>{category.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Schritt 3: Größe */}
          {step === 'size' && (
            <div>
              <p className={`${c.textSecondary} mb-4`}>Wähle die Widget-Größe:</p>
              <div className="grid grid-cols-3 gap-4 mb-6">
                {sizeOptions.map(size => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedSize === size.id
                        ? 'border-cyan-500 bg-cyan-500/10'
                        : `${c.border} ${c.hover}`
                    }`}
                  >
                    <div className={`h-8 rounded ${selectedSize === size.id ? 'bg-cyan-500' : c.bgSecondary}`}
                      style={{ width: size.id === 'small' ? '33%' : size.id === 'medium' ? '66%' : '100%' }}
                    />
                    <span className={`font-semibold ${c.text} block mt-2`}>{size.name}</span>
                    <span className={`text-xs ${c.textSecondary}`}>{size.desc}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={handleAdd}
                className={`w-full py-3 ${c.accentBg} ${c.accentHover} text-white rounded-xl font-semibold transition-colors`}
              >
                ✓ Widget hinzufügen
              </button>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        {step !== 'type' && (
          <div className={`p-4 ${c.border} border-t flex justify-between`}>
            <button
              onClick={() => setStep(step === 'size' ? (selectedType === WIDGET_TYPES.ACCOUNT || selectedType === WIDGET_TYPES.CATEGORY ? 'config' : 'type') : 'type')}
              className={`px-4 py-2 rounded-lg ${c.textSecondary} ${c.hover}`}
            >
              ← Zurück
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddWidgetModal;
