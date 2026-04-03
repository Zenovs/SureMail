import React, { useState, useCallback } from 'react';
import GridLayout from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useTheme } from '../context/ThemeContext';
import { useAccounts } from '../context/AccountContext';
import { useDashboard, WIDGET_TYPES } from '../context/DashboardContext';
import StatsWidget from '../components/widgets/StatsWidget';
import AccountWidget from '../components/widgets/AccountWidget';
import CategoryWidget from '../components/widgets/CategoryWidget';
import QuickActionsWidget from '../components/widgets/QuickActionsWidget';
import AddWidgetModal from '../components/widgets/AddWidgetModal';

function Dashboard({ onNavigate, onSelectAccount }) {
  const { currentTheme } = useTheme();
  const { setActiveAccountId } = useAccounts();
  const { 
    widgets, 
    layout, 
    isEditMode, 
    loading,
    updateLayout, 
    toggleEditMode,
    resetToDefaults 
  } = useDashboard();
  const [showAddModal, setShowAddModal] = useState(false);
  const [containerWidth, setContainerWidth] = useState(1200);
  const c = currentTheme.colors;

  // Container ref für Breite
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 48); // 48px padding
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleLayoutChange = (newLayout) => {
    updateLayout(newLayout);
  };

  const handleSelectAccount = (accountId) => {
    setActiveAccountId(accountId);
    onSelectAccount?.(accountId);
  };

  const renderWidget = useCallback((widget) => {
    switch (widget.type) {
      case WIDGET_TYPES.STATS:
        return <StatsWidget widget={widget} />;
      case WIDGET_TYPES.ACCOUNT:
        return (
          <AccountWidget 
            widget={widget} 
            onNavigate={onNavigate}
            onSelectAccount={handleSelectAccount}
          />
        );
      case WIDGET_TYPES.CATEGORY:
        return (
          <CategoryWidget 
            widget={widget}
            onNavigate={onNavigate}
            onSelectAccount={handleSelectAccount}
          />
        );
      case WIDGET_TYPES.QUICK_ACTIONS:
        return <QuickActionsWidget widget={widget} onNavigate={onNavigate} />;
      default:
        return <div className={c.text}>Unbekannter Widget-Typ</div>;
    }
  }, [onNavigate, handleSelectAccount, c.text]);

  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${c.bg}`}>
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className={c.textSecondary}>Dashboard wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`flex-1 overflow-auto ${c.bg}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold ${c.text} mb-1`}>Dashboard</h1>
            <p className={c.textSecondary}>
              {isEditMode ? 'Bearbeite dein Dashboard - ziehe Widgets per Drag & Drop' : 'Deine personalisierte Übersicht'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isEditMode && (
              <>
                <button
                  onClick={() => setShowAddModal(true)}
                  className={`px-4 py-2 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors flex items-center gap-2`}
                >
                  <span>+</span> Widget hinzufügen
                </button>
                <button
                  onClick={resetToDefaults}
                  className={`px-4 py-2 ${c.border} border rounded-lg ${c.textSecondary} ${c.hover} transition-colors`}
                >
                  Zurücksetzen
                </button>
              </>
            )}
            <button
              onClick={toggleEditMode}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                isEditMode 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : `${c.bgSecondary} ${c.text} ${c.hover}`
              }`}
            >
              {isEditMode ? (
                <>
                  <span>✓</span> Fertig
                </>
              ) : (
                <>
                  <span>✏️</span> Bearbeiten
                </>
              )}
            </button>
          </div>
        </div>

        {/* Widget Grid */}
        {widgets.length === 0 ? (
          <div className={`${c.card} ${c.border} border rounded-2xl p-12 text-center`}>
            <div className="text-6xl mb-4">📊</div>
            <h3 className={`text-xl font-semibold ${c.text} mb-2`}>Keine Widgets</h3>
            <p className={`${c.textSecondary} mb-6`}>
              Füge Widgets hinzu, um dein Dashboard zu personalisieren.
            </p>
            <button
              onClick={() => {
                if (!isEditMode) toggleEditMode();
                setShowAddModal(true);
              }}
              className={`px-6 py-3 ${c.accentBg} ${c.accentHover} text-white rounded-lg transition-colors`}
            >
              Widget hinzufügen
            </button>
          </div>
        ) : (
          <div className={`${isEditMode ? 'ring-2 ring-cyan-500/30 ring-offset-2 ring-offset-transparent rounded-xl p-2' : ''}`}>
            <GridLayout
              className="layout"
              layout={layout}
              cols={12}
              rowHeight={80}
              width={containerWidth}
              onLayoutChange={handleLayoutChange}
              isDraggable={isEditMode}
              isResizable={isEditMode}
              draggableHandle=".drag-handle"
              margin={[16, 16]}
              containerPadding={[0, 0]}
              useCSSTransforms={true}
            >
              {widgets.map(widget => (
                <div key={widget.id} className="widget-container">
                  {renderWidget(widget)}
                </div>
              ))}
            </GridLayout>
          </div>
        )}

        {/* Edit Mode Hinweis */}
        {isEditMode && widgets.length > 0 && (
          <div className={`mt-6 p-4 ${c.bgSecondary} rounded-xl border ${c.border}`}>
            <div className="flex items-center gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className={`${c.text} font-medium`}>Bearbeitungsmodus aktiv</p>
                <p className={`text-sm ${c.textSecondary}`}>
                  Ziehe die Widgets am ⠿ Symbol, um sie zu verschieben. Nutze S/M/L um die Größe zu ändern.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Widget Modal */}
      <AddWidgetModal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)} 
      />
    </div>
  );
}

export default Dashboard;
