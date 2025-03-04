// ICSImportExport.js
import React, { useState } from 'react';
import { parseICal, formatToICS } from '../utils/icsUtils';


const ICSImportExport = ({ courses, trainers, onImport, events }) => {
  const [importStatus, setImportStatus] = useState(null);
  const [exportStatus, setExportStatus] = useState(null);
  const [importStats, setImportStats] = useState(null);
  
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImportStatus('loading');
    setImportStats(null);
    
    try {
      const fileContent = await readFileAsText(file);
      
      // Parse the iCalendar file
      const parsedEvents = parseICal(fileContent, courses, trainers);
      
      // Import successful
      setImportStatus('success');
      setImportStats({
        totalEvents: parsedEvents.length,
        newEvents: parsedEvents.filter(e => !events.some(existingEvent => 
          existingEvent.extendedProps?.uid === e.extendedProps?.uid
        )).length,
        updatedEvents: parsedEvents.filter(e => events.some(existingEvent => 
          existingEvent.extendedProps?.uid === e.extendedProps?.uid
        )).length
      });
      
      // Pass the imported events to the parent component
      if (onImport) {
        onImport(parsedEvents);
      }
    } catch (error) {
      console.error('Error importing ICS file:', error);
      setImportStatus('error');
    }
    
    // Reset the file input
    e.target.value = null;
  };
  
  const handleExport = () => {
    if (!events || events.length === 0) {
      setExportStatus('error');
      return;
    }
    
    setExportStatus('loading');
    
    try {
      // Format events to iCalendar format
      const icsContent = formatToICS(events, courses, trainers);
      
      // Create a blob and download
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calendar-${new Date().toISOString().slice(0, 10)}.ics`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      
      setExportStatus('success');
      
      // Clear the status after 3 seconds
      setTimeout(() => {
        setExportStatus(null);
      }, 3000);
    } catch (error) {
      console.error('Error exporting to ICS:', error);
      setExportStatus('error');
    }
  };
  
  // Helper function to read file content
  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };
  
  return (
    <div className="ics-import-export">
      <h3>ייבוא/ייצוא קובץ ICS</h3>
      
      <div className="import-export-container">
        <div className="import-section">
          <h4>ייבוא מקובץ ICS</h4>
          <p>ייבא אירועים מקובץ ICS (iCalendar) הכולל פגישות, אירועים, או שיעורים.</p>
          
          <div className="file-input-container">
            <label className="btn btn-primary">
              בחר קובץ ICS
              <input 
                type="file"
                accept=".ics,.ical,.icalendar"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
            
            {importStatus === 'loading' && <div className="status-message loading">מייבא נתונים...</div>}
            {importStatus === 'success' && (
              <div className="status-message success">
                <div>ייבוא הצליח!</div>
                {importStats && (
                  <div className="import-stats">
                    <div>סה"כ אירועים: {importStats.totalEvents}</div>
                    <div>אירועים חדשים: {importStats.newEvents}</div>
                    <div>אירועים שעודכנו: {importStats.updatedEvents}</div>
                  </div>
                )}
              </div>
            )}
            {importStatus === 'error' && <div className="status-message error">שגיאה בייבוא הקובץ</div>}
          </div>
          
          <div className="import-tips">
            <h5>טיפים:</h5>
            <ul>
              <li>וודא שהקובץ בפורמט iCalendar תקין</li>
              <li>הייבוא מאחד אירועים לפי מזהה ייחודי (UID)</li>
              <li>אירועים חדשים ייווצרו עם הגדרות ברירת מחדל</li>
            </ul>
          </div>
        </div>
        
        <div className="export-section">
          <h4>ייצוא לקובץ ICS</h4>
          <p>ייצא את כל האירועים מלוח השנה לקובץ ICS לשיתוף או גיבוי.</p>
          
          <button 
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exportStatus === 'loading'}
          >
            {exportStatus === 'loading' ? 'מייצא...' : 'ייצא לקובץ ICS'}
          </button>
          
          {exportStatus === 'success' && <div className="status-message success">הייצוא הושלם בהצלחה!</div>}
          {exportStatus === 'error' && <div className="status-message error">שגיאה בייצוא אירועים</div>}
          
          <div className="export-stats">
            <div>מספר אירועים לייצוא: {events?.length || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ICSImportExport;
