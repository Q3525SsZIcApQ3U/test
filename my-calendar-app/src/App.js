import React, { useState, useEffect } from 'react';
import CalendarComponent from './CalendarComponent';
import './Calendar.css';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [isLoading, setIsLoading] = useState(true);

  // Apply dark mode to entire app
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }

    // Save preference to localStorage
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  // Add loading effect
  useEffect(() => {
    // Simulate loading for a smoother experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`app-container ${isDarkMode ? 'dark' : ''}`}>
      {isLoading ? (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your calendar</div>
        </div>
      ) : (
        <CalendarComponent 
          isDarkMode={isDarkMode} 
          setIsDarkMode={setIsDarkMode} 
        />
      )}
    </div>
  );
}

export default App;
