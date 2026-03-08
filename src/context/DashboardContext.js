import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const DashboardContext = createContext();

// Widget-Typen Definition
export const WIDGET_TYPES = {
  ACCOUNT: 'account',
  CATEGORY: 'category',
  STATS: 'stats',
  QUICK_ACTIONS: 'quickActions'
};

// Widget-Größen (Grid-Einheiten)
export const WIDGET_SIZES = {
  small: { w: 3, h: 2, minW: 2, minH: 2 },
  medium: { w: 6, h: 3, minW: 3, minH: 2 },
  large: { w: 12, h: 4, minW: 6, minH: 3 }
};

// Standard-Widgets
const DEFAULT_WIDGETS = [
  {
    id: 'stats-1',
    type: WIDGET_TYPES.STATS,
    title: 'Gesamtstatistik',
    size: 'large',
    config: {}
  },
  {
    id: 'quick-actions-1',
    type: WIDGET_TYPES.QUICK_ACTIONS,
    title: 'Schnellaktionen',
    size: 'medium',
    config: {}
  }
];

// Standard-Layout
const DEFAULT_LAYOUT = [
  { i: 'stats-1', x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 2 },
  { i: 'quick-actions-1', x: 0, y: 3, w: 6, h: 3, minW: 3, minH: 2 }
];

export function DashboardProvider({ children }) {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);
  const [layout, setLayout] = useState(DEFAULT_LAYOUT);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);

  // Laden der Dashboard-Konfiguration
  useEffect(() => {
    loadDashboardConfig();
  }, []);

  const loadDashboardConfig = async () => {
    try {
      if (window.electronAPI?.getAppSettings) {
        const appSettings = await window.electronAPI.getAppSettings();
        if (appSettings.dashboardWidgets && appSettings.dashboardWidgets.length > 0) {
          setWidgets(appSettings.dashboardWidgets);
        }
        if (appSettings.dashboardLayout && appSettings.dashboardLayout.length > 0) {
          setLayout(appSettings.dashboardLayout);
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Dashboard-Konfiguration:', error);
    }
    setLoading(false);
  };

  const saveDashboardConfig = async (newWidgets, newLayout) => {
    try {
      if (window.electronAPI?.getAppSettings && window.electronAPI?.saveAppSettings) {
        const appSettings = await window.electronAPI.getAppSettings();
        await window.electronAPI.saveAppSettings({
          ...appSettings,
          dashboardWidgets: newWidgets,
          dashboardLayout: newLayout
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Dashboard-Konfiguration:', error);
    }
  };

  const addWidget = useCallback((type, config = {}, size = 'medium') => {
    const id = `${type}-${Date.now()}`;
    const sizeConfig = WIDGET_SIZES[size];
    
    // Titel basierend auf Typ
    let title = '';
    switch (type) {
      case WIDGET_TYPES.ACCOUNT:
        title = config.accountName || 'E-Mail-Konto';
        break;
      case WIDGET_TYPES.CATEGORY:
        title = config.categoryName || 'Kategorie';
        break;
      case WIDGET_TYPES.STATS:
        title = 'Statistik';
        break;
      case WIDGET_TYPES.QUICK_ACTIONS:
        title = 'Schnellaktionen';
        break;
      default:
        title = 'Widget';
    }

    const newWidget = {
      id,
      type,
      title,
      size,
      config
    };

    // Finde freie Position
    const maxY = layout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    const newLayoutItem = {
      i: id,
      x: 0,
      y: maxY,
      ...sizeConfig
    };

    const newWidgets = [...widgets, newWidget];
    const newLayout = [...layout, newLayoutItem];
    
    setWidgets(newWidgets);
    setLayout(newLayout);
    saveDashboardConfig(newWidgets, newLayout);
    
    return id;
  }, [widgets, layout]);

  const removeWidget = useCallback((widgetId) => {
    const newWidgets = widgets.filter(w => w.id !== widgetId);
    const newLayout = layout.filter(l => l.i !== widgetId);
    
    setWidgets(newWidgets);
    setLayout(newLayout);
    saveDashboardConfig(newWidgets, newLayout);
  }, [widgets, layout]);

  const updateWidget = useCallback((widgetId, updates) => {
    const newWidgets = widgets.map(w => 
      w.id === widgetId ? { ...w, ...updates } : w
    );
    setWidgets(newWidgets);
    saveDashboardConfig(newWidgets, layout);
  }, [widgets, layout]);

  const updateWidgetSize = useCallback((widgetId, newSize) => {
    const sizeConfig = WIDGET_SIZES[newSize];
    const newLayout = layout.map(l => 
      l.i === widgetId ? { ...l, ...sizeConfig } : l
    );
    const newWidgets = widgets.map(w => 
      w.id === widgetId ? { ...w, size: newSize } : w
    );
    
    setLayout(newLayout);
    setWidgets(newWidgets);
    saveDashboardConfig(newWidgets, newLayout);
  }, [widgets, layout]);

  const updateLayout = useCallback((newLayout) => {
    setLayout(newLayout);
    saveDashboardConfig(widgets, newLayout);
  }, [widgets]);

  const resetToDefaults = useCallback(() => {
    setWidgets(DEFAULT_WIDGETS);
    setLayout(DEFAULT_LAYOUT);
    saveDashboardConfig(DEFAULT_WIDGETS, DEFAULT_LAYOUT);
  }, []);

  const toggleEditMode = useCallback(() => {
    setIsEditMode(prev => !prev);
  }, []);

  return (
    <DashboardContext.Provider value={{
      widgets,
      layout,
      isEditMode,
      loading,
      addWidget,
      removeWidget,
      updateWidget,
      updateWidgetSize,
      updateLayout,
      resetToDefaults,
      toggleEditMode,
      WIDGET_TYPES,
      WIDGET_SIZES
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export default DashboardContext;
