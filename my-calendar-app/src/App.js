import React, { useState, useEffect } from 'react';
import CalendarComponent from './components/CalendarComponent';
import { ThemeProvider } from './utils/ThemeManager';
import './styles/Calendar.css';
import './styles/ThemeStyles.css';

function App() {
  const [isLoading, setIsLoading] = useState(true);

  // Add loading effect
  useEffect(() => {
    // Simulate loading for a smoother experience
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <ThemeProvider>
      {isLoading ? (
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading your calendar</div>
        </div>
      ) : (
        <CalendarComponent />
      )}
    </ThemeProvider>
  );
}

export default App;
