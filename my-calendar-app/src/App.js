import React, { useState, useEffect } from 'react';
import CalendarComponent from './components/CalendarComponent';
import TextEditor from './components/TextEditor';
import { ThemeProvider, useTheme } from './utils/ThemeManager';
import './styles/Calendar.css';
import './styles/ThemeStyles.css';

// Main App component with inline styles for immediate testing
function AppContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // Get theme using the useTheme hook
  const { isDarkMode } = useTheme();

  // Add loading effect
  useEffect(() => {
    // Simulate loading for a smoother experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Toggle editor visibility
  const toggleEditor = () => {
    setIsEditorOpen(!isEditorOpen);
  };

  // Inline styles to ensure they are applied
  const editorPanelStyle = {
    position: 'fixed',
    top: 0,
    left: isEditorOpen ? 0 : '-600px', // Changed from right to left
    width: '600px',
    height: '100vh',
    backgroundColor: isDarkMode ? '#1a202c' : 'white',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.2)', // Changed shadow direction
    transition: 'left 0.3s ease-in-out', // Changed from right to left
    zIndex: 99,
    overflowY: 'auto',
    color: isDarkMode ? '#e2e8f0' : 'inherit'
  };

  const toggleButtonStyle = {
    position: 'fixed',
    left: '20px', // Changed from right to left
    bottom: '20px',
    padding: '10px 15px',
    borderRadius: '4px',
    backgroundColor: isDarkMode ? '#6366f1' : '#4a90e2',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    zIndex: 100,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)'
  };

  const editorHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    borderBottom: `1px solid ${isDarkMode ? '#4a5568' : '#eee'}`
  };

  return (
    <>
      {isLoading ? (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your calendar</div>
        </div>
      ) : (
        <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
          <CalendarComponent />
          
          {/* Toggle button for the editor */}
          <button 
            style={toggleButtonStyle}
            onClick={toggleEditor}
          >
            {isEditorOpen ? 'Hide Editor' : 'Show Editor'}
          </button>
          
          {/* Slide-in Text Editor with inline styles */}
          <div style={editorPanelStyle}>
            <div style={editorHeaderStyle}>
              <h3>Notes</h3>
              <button 
                onClick={toggleEditor}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  cursor: 'pointer',
                  color: isDarkMode ? '#e2e8f0' : 'inherit'
                }}
              >
                ✕
              </button>
            </div>
            {isEditorOpen && <TextEditor isDarkMode={isDarkMode} />}
          </div>
        </div>
      )}
    </>
  );
}

// Wrapper component that provides the ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
