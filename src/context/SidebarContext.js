import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

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

  // Ref hält den aktuellen Stand, damit die Action-Callbacks stabil bleiben
  // (sonst re-rendern alle Consumer bei jeder Settings-Änderung doppelt).
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const loadSettings = useCallback(async () => {
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
  }, []);

  // Laden der Einstellungen beim Start
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = useCallback(async (newSettings) => {
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
  }, []);

  const updateWidth = useCallback((width) => {
    const s = settingsRef.current;
    const clampedWidth = Math.min(Math.max(width, s.minWidth), s.maxWidth);
    const newSettings = { ...s, width: clampedWidth };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [saveSettings]);

  const updateSetting = useCallback((key, value) => {
    const newSettings = { ...settingsRef.current, [key]: value };
    setSettings(newSettings);
    saveSettings(newSettings);
  }, [saveSettings]);

  const toggleCollapse = useCallback(() => {
    updateSetting('collapsed', !settingsRef.current.collapsed);
  }, [updateSetting]);

  const toggleIconsOnly = useCallback(() => {
    updateSetting('iconsOnly', !settingsRef.current.iconsOnly);
  }, [updateSetting]);

  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);

  const value = useMemo(() => ({
    settings,
    isResizing,
    setIsResizing,
    updateWidth,
    updateSetting,
    toggleCollapse,
    toggleIconsOnly,
    resetToDefaults,
    loadSettings
  }), [settings, isResizing, updateWidth, updateSetting, toggleCollapse, toggleIconsOnly, resetToDefaults, loadSettings]);

  return (
    <SidebarContext.Provider value={value}>
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
