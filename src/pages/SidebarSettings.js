import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useSidebar } from '../context/SidebarContext';

function SidebarSettings() {
  const { currentTheme } = useTheme();
  const { settings, updateSetting, updateWidth, resetToDefaults } = useSidebar();
  const c = currentTheme.colors;

  const handleWidthChange = (e) => {
    updateWidth(parseInt(e.target.value, 10));
  };

  return (
    <div className="space-y-6">
      {/* Sidebar-Breite */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${c.text} mb-4`}>📏 Sidebar-Breite</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={c.textSecondary}>Breite</span>
              <span className={`${c.accent} font-mono`}>{settings.width}px</span>
            </div>
            <input
              type="range"
              min={settings.minWidth}
              max={settings.maxWidth}
              value={settings.width}
              onChange={handleWidthChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between mt-1">
              <span className={`text-xs ${c.textSecondary}`}>{settings.minWidth}px</span>
              <span className={`text-xs ${c.textSecondary}`}>{settings.maxWidth}px</span>
            </div>
          </div>
          
          <p className={`text-sm ${c.textSecondary}`}>
            💡 Du kannst die Sidebar auch direkt am rechten Rand per Drag & Drop vergrößern/verkleinern.
          </p>
        </div>
      </div>

      {/* Sidebar-Verhalten */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${c.text} mb-4`}>⚙️ Verhalten</h3>
        
        <div className="space-y-4">
          {/* Auto-Collapse */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className={c.text}>Auto-Collapse</span>
              <p className={`text-sm ${c.textSecondary}`}>Sidebar automatisch minimieren bei kleinen Fenstern</p>
            </div>
            <div 
              onClick={() => updateSetting('autoCollapse', !settings.autoCollapse)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.autoCollapse ? 'bg-cyan-500' : c.bgSecondary
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.autoCollapse ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </div>
          </label>

          {/* Icons-Only Mode */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className={c.text}>Nur Icons anzeigen</span>
              <p className={`text-sm ${c.textSecondary}`}>Zeigt nur Icons statt Text in der Sidebar</p>
            </div>
            <div 
              onClick={() => updateSetting('iconsOnly', !settings.iconsOnly)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.iconsOnly ? 'bg-cyan-500' : c.bgSecondary
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.iconsOnly ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </div>
          </label>

          {/* Collapsed */}
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <span className={c.text}>Sidebar minimiert starten</span>
              <p className={`text-sm ${c.textSecondary}`}>Sidebar beim App-Start minimiert anzeigen</p>
            </div>
            <div 
              onClick={() => updateSetting('collapsed', !settings.collapsed)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                settings.collapsed ? 'bg-cyan-500' : c.bgSecondary
              }`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                settings.collapsed ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </div>
          </label>
        </div>
      </div>

      {/* Zurücksetzen */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${c.text} mb-4`}>🔄 Zurücksetzen</h3>
        <p className={`${c.textSecondary} mb-4`}>
          Setze alle Sidebar-Einstellungen auf die Standardwerte zurück.
        </p>
        <button
          onClick={resetToDefaults}
          className={`px-4 py-2 ${c.border} border rounded-lg ${c.text} ${c.hover} transition-colors`}
        >
          Standardeinstellungen wiederherstellen
        </button>
      </div>

      {/* Vorschau */}
      <div className={`${c.card} ${c.border} border rounded-xl p-6`}>
        <h3 className={`text-lg font-semibold ${c.text} mb-4`}>👁️ Vorschau</h3>
        <div className="flex gap-4">
          {/* Normal */}
          <div className="flex-1">
            <span className={`text-xs ${c.textSecondary} block mb-2`}>Normal</span>
            <div className={`${c.bgSecondary} rounded-lg p-3 h-32 flex flex-col`}>
              <div className={`${c.accent} font-bold text-sm mb-2`}>CoreMail</div>
              <div className="space-y-1">
                <div className={`h-2 w-20 ${c.bgTertiary} rounded`} />
                <div className={`h-2 w-16 ${c.bgTertiary} rounded`} />
                <div className={`h-2 w-18 ${c.bgTertiary} rounded`} />
              </div>
            </div>
          </div>
          
          {/* Icons Only */}
          <div>
            <span className={`text-xs ${c.textSecondary} block mb-2`}>Icons</span>
            <div className={`${c.bgSecondary} rounded-lg p-3 h-32 w-12 flex flex-col items-center`}>
              <div className="text-lg mb-2">📧</div>
              <div className="space-y-2 text-center">
                <div>📊</div>
                <div>📥</div>
                <div>✏️</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SidebarSettings;
