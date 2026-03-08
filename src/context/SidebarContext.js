import React, { createContext, useContext, useState, useEffect } from 'react';

const SidebarContext = createContext();

const DEFAULT_SETTINGS = {
  width: 256,
  minWidth: 200,
  maxWidth: 400,
  autoCollapse: false,
  iconsOnly: false,
  collapsed: false
};

export function SidebarProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isResizing, setIsResizing] = useState(false);

  // Laden der Einstellungen beim Start
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (window.electronAPI?.getAppSettings) {
        const appSettings = await window.electronAPI.getAppSettings();
        if (appSettings.sidebarSettings) {
          setSettings(prev => ({ ...prev, ...appSettings.sidebarSettings }));
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sidebar-Einstellungen:', error);
    }
  };

  const saveSettings = async (newSettings) => {
    try {
      if (window.electronAPI?.getAppSettings && window.electronAPI?.saveAppSettings) {
        const appSettings = await window.electronAPI.getAppSettings();
        await window.electronAPI.saveAppSettings({
          ...appSettings,
          sidebarSettings: newSettings
        });
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Sidebar-Einstellungen:', error);
    }
  };

  const updateWidth = (width) => {
    const clampedWidth = Math.min(Math.max(width, settings.minWidth), settings.maxWidth);
    const newSettings = { ...settings, width: clampedWidth };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const toggleCollapse = () => {
    updateSetting('collapsed', !settings.collapsed);
  };

  const toggleIconsOnly = () => {
    updateSetting('iconsOnly', !settings.iconsOnly);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  };

  return (
    <SidebarContext.Provider value={{
      settings,
      isResizing,
      setIsResizing,
      updateWidth,
      updateSetting,
      toggleCollapse,
      toggleIconsOnly,
      resetToDefaults,
      loadSettings
    }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export default SidebarContext;
