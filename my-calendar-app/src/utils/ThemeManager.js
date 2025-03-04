// ThemeManager.js
import React, { createContext, useContext, useState, useEffect } from 'react';

// Default theme options (these can be expanded)
export const DEFAULT_THEMES = [
  { id: 'blue', name: 'כחול', primary: '#4361ee', success: '#10b981', danger: '#ef4444' },
  { id: 'green', name: 'ירוק', primary: '#059669', success: '#10b981', danger: '#ef4444' },
  { id: 'purple', name: 'סגול', primary: '#8b5cf6', success: '#10b981', danger: '#ef4444' },
  { id: 'orange', name: 'כתום', primary: '#f59e0b', success: '#10b981', danger: '#ef4444' },
  { id: 'red', name: 'אדום', primary: '#dc2626', success: '#10b981', danger: '#ef4444' },
];

// Create a context for theme management
const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize from localStorage or use default
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme ? JSON.parse(savedTheme) : DEFAULT_THEMES[0];
  });
  
  const [customThemes, setCustomThemes] = useState(() => {
    const savedCustomThemes = localStorage.getItem('customThemes');
    return savedCustomThemes ? JSON.parse(savedCustomThemes) : [];
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  // Apply theme to CSS variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Set primary color variables
    root.style.setProperty('--primary-color', currentTheme.primary);
    root.style.setProperty('--primary-dark', adjustColor(currentTheme.primary, -20));
    root.style.setProperty('--primary-light', adjustColor(currentTheme.primary, 20));
    
    // Set success color variables
    root.style.setProperty('--success-color', currentTheme.success);
    root.style.setProperty('--success-dark', adjustColor(currentTheme.success, -20));
    
    // Set danger color variables
    root.style.setProperty('--danger-color', currentTheme.danger);
    root.style.setProperty('--danger-dark', adjustColor(currentTheme.danger, -20));
    
    // Save to localStorage
    localStorage.setItem('appTheme', JSON.stringify(currentTheme));
  }, [currentTheme]);

  useEffect(() => {
    localStorage.setItem('customThemes', JSON.stringify(customThemes));
  }, [customThemes]);

  // Function to adjust color brightness/darkness
  function adjustColor(hex, percent) {
    // Convert hex to RGB
    let r = parseInt(hex.substr(1, 2), 16);
    let g = parseInt(hex.substr(3, 2), 16);
    let b = parseInt(hex.substr(5, 2), 16);

    // Adjust each component by percent
    r = Math.min(255, Math.max(0, r + Math.floor(r * (percent / 100))));
    g = Math.min(255, Math.max(0, g + Math.floor(g * (percent / 100))));
    b = Math.min(255, Math.max(0, b + Math.floor(b * (percent / 100))));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Add a new custom theme
  const addCustomTheme = (newTheme) => {
    if (!newTheme.id) {
      newTheme.id = `custom-${Date.now()}`;
    }
    setCustomThemes([...customThemes, newTheme]);
    return newTheme;
  };

  // Delete a custom theme
  const deleteCustomTheme = (themeId) => {
    const updatedThemes = customThemes.filter(theme => theme.id !== themeId);
    setCustomThemes(updatedThemes);
    
    // If the current theme is being deleted, switch to the default
    if (currentTheme.id === themeId) {
      setCurrentTheme(DEFAULT_THEMES[0]);
    }
  };

  // Set the current theme (either default or custom)
  const setTheme = (themeId) => {
    // First check custom themes
    let theme = customThemes.find(t => t.id === themeId);
    
    // If not found in custom themes, check default themes
    if (!theme) {
      theme = DEFAULT_THEMES.find(t => t.id === themeId);
    }
    
    if (theme) {
      setCurrentTheme(theme);
    }
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    
    // Apply dark mode to document body for consistent styling
    if (newMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  // All available themes (default + custom)
  const allThemes = [...DEFAULT_THEMES, ...customThemes];

  const value = {
    currentTheme,
    isDarkMode,
    allThemes,
    setTheme,
    addCustomTheme,
    deleteCustomTheme,
    toggleDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper functions for external usage
export const saveTheme = (theme) => {
  localStorage.setItem('appTheme', JSON.stringify(theme));
};

export const getTheme = () => {
  const savedTheme = localStorage.getItem('appTheme');
  return savedTheme ? JSON.parse(savedTheme) : DEFAULT_THEMES[0];
};

export const getThemes = () => {
  const savedCustomThemes = localStorage.getItem('customThemes');
  const customThemes = savedCustomThemes ? JSON.parse(savedCustomThemes) : [];
  return [...DEFAULT_THEMES, ...customThemes];
};
