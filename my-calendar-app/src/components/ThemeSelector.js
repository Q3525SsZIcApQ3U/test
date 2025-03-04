// ThemeSelector.js
import React, { useState } from 'react';
import { saveTheme, getTheme, getThemes } from '../utils/ThemeManager';
import { useTheme, DEFAULT_THEMES } from '../utils/ThemeManager';

const ThemeSelector = () => {
  const { currentTheme, allThemes, setTheme, addCustomTheme, deleteCustomTheme } = useTheme();
  
  const [newThemeName, setNewThemeName] = useState('');
  const [newPrimaryColor, setNewPrimaryColor] = useState('#4361ee');
  const [newSuccessColor, setNewSuccessColor] = useState('#10b981');
  const [newDangerColor, setNewDangerColor] = useState('#ef4444');
  
  const handleAddTheme = () => {
    if (newThemeName.trim()) {
      const newTheme = {
        id: `custom-${Date.now()}`,
        name: newThemeName.trim(),
        primary: newPrimaryColor,
        success: newSuccessColor,
        danger: newDangerColor
      };
      
      addCustomTheme(newTheme);
      setNewThemeName('');
      setNewPrimaryColor('#4361ee');
      setNewSuccessColor('#10b981');
      setNewDangerColor('#ef4444');
    }
  };
  
  const isDefaultTheme = (themeId) => {
    return DEFAULT_THEMES.some(theme => theme.id === themeId);
  };
  
  return (
    <div className="theme-selector">
      <h3>ערכות צבעים</h3>
      
      <div className="themes-grid">
        {allThemes.map((theme) => (
          <div 
            key={theme.id}
            className={`theme-item ${currentTheme.id === theme.id ? 'selected' : ''}`}
            onClick={() => setTheme(theme.id)}
          >
            <div className="theme-colors">
              <div className="color-preview" style={{ backgroundColor: theme.primary }}></div>
              <div className="color-preview" style={{ backgroundColor: theme.success }}></div>
              <div className="color-preview" style={{ backgroundColor: theme.danger }}></div>
            </div>
            <div className="theme-name">{theme.name}</div>
            {!isDefaultTheme(theme.id) && (
              <button 
                className="theme-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCustomTheme(theme.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="add-theme-section">
        <h4>הוסף ערכת צבעים חדשה</h4>
        
        <div className="form-group">
          <label>שם הערכה</label>
          <input
            type="text"
            value={newThemeName}
            onChange={(e) => setNewThemeName(e.target.value)}
            className="form-input"
            placeholder="שם ערכת הצבעים"
          />
        </div>
        
        <div className="form-group">
          <label>צבע ראשי</label>
          <div className="color-input-group">
            <input 
              type="color" 
              value={newPrimaryColor}
              onChange={(e) => setNewPrimaryColor(e.target.value)}
              className="color-picker"
            />
            <input 
              type="text"
              value={newPrimaryColor}
              onChange={(e) => setNewPrimaryColor(e.target.value)}
              className="form-input"
              placeholder="#RRGGBB"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>צבע הצלחה</label>
          <div className="color-input-group">
            <input 
              type="color" 
              value={newSuccessColor}
              onChange={(e) => setNewSuccessColor(e.target.value)}
              className="color-picker"
            />
            <input 
              type="text"
              value={newSuccessColor}
              onChange={(e) => setNewSuccessColor(e.target.value)}
              className="form-input"
              placeholder="#RRGGBB"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>צבע אזהרה</label>
          <div className="color-input-group">
            <input 
              type="color" 
              value={newDangerColor}
              onChange={(e) => setNewDangerColor(e.target.value)}
              className="color-picker"
            />
            <input 
              type="text"
              value={newDangerColor}
              onChange={(e) => setNewDangerColor(e.target.value)}
              className="form-input"
              placeholder="#RRGGBB"
            />
          </div>
        </div>
        
        <div className="theme-preview" style={{ 
          backgroundColor: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          marginTop: '16px',
          marginBottom: '16px'
        }}>
          <div style={{ marginBottom: '10px' }}>תצוגה מקדימה:</div>
          <div style={{ 
            backgroundColor: newPrimaryColor,
            color: '#ffffff',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '8px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            כפתור ראשי
          </div>
          <div style={{ 
            backgroundColor: newSuccessColor,
            color: '#ffffff',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '8px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            כפתור הצלחה
          </div>
          <div style={{ 
            backgroundColor: newDangerColor,
            color: '#ffffff',
            padding: '10px',
            borderRadius: '4px',
            fontWeight: 'bold',
            textAlign: 'center'
          }}>
            כפתור אזהרה
          </div>
        </div>
        
        <button className="btn btn-primary" onClick={handleAddTheme}>
          הוסף ערכת צבעים
        </button>
      </div>
    </div>
  );
};

export default ThemeSelector;
