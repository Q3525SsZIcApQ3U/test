import React, { useState, useEffect } from 'react';
import './highlight-register'; // Import this first to ensure hljs is registered
import CalendarComponent from './CalendarComponent';
import TextEditor from './TextEditor';
import './Calendar.css';

// Updated imports for react-pro-sidebar
import { Sidebar, ProSidebarProvider } from 'react-pro-sidebar';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Apply dark mode to the entire app
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  // Simulate loading for a smoother experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      {isLoading ? (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your calendar</div>
        </div>
      ) : (
        <div className="main-container">
          {/* Button to toggle the sidebar */}
          <button className="toggle-sidebar-button" onClick={toggleSidebar}>
            {isSidebarOpen ? '🗙' : '✎'}
          </button>
          {/* Layout container */}
          <div className="content-wrapper" style={{ display: 'flex' }}>
            <ProSidebarProvider>
              <Sidebar
                collapsed={!isSidebarOpen}
                style={{
                  display: isSidebarOpen ? 'block' : 'none', // Hide when collapsed
                  transition: 'display 0.3s ease',
                  width: '550px',
                }}
              >
                <div style={{ padding: '10px', fontWeight: 'bold' }}>
                ארמשפטים
                </div>
                <div>
                  <TextEditor />
                </div>
              </Sidebar>
            </ProSidebarProvider>
            <div
              className="calendar-container"
              style={{
                flex: 1,
                transition: 'padding-left 0.3s',
                paddingLeft: isSidebarOpen ? '20px' : '0',
              }}
            >
              <CalendarComponent
                isDarkMode={isDarkMode}
                setIsDarkMode={setIsDarkMode}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;