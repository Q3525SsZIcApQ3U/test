// Enhanced SettingsComponent.js
import React, { useState, useEffect } from 'react';
import TagsManager from './TagsManager';
import axios from 'axios';
import '../styles/Settings.css';
import ThemeSelector from './ThemeSelector';
import EventTypesManager from './EventTypesManager';
import ICSImportExport from './ICSImportExport';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

const SettingsComponent = ({ 
  isOpen, 
  onClose, 
  trainers, 
  courses, 
  onSettingsChange,
  events,
  onImportEvents
}) => {
  const [activeTab, setActiveTab] = useState('general');
  const [localTrainers, setLocalTrainers] = useState([]);
  const [localCourses, setLocalCourses] = useState([]);
  const [newTrainerName, setNewTrainerName] = useState('');
  const [workHours, setWorkHours] = useState(() => {
    // Load persistent settings from localStorage
    const saved = localStorage.getItem('workHours');
    return saved ? JSON.parse(saved) : { startTime: "07:00:00", endTime: "22:01:00" }; // Fixed end time
  });
  
  // Initialize the state from props when component mounts or when props change
  useEffect(() => {
    if (trainers && trainers.length > 0) {
      setLocalTrainers([...trainers]);
    } else {
      // Get from localStorage if not provided
      const savedTrainers = localStorage.getItem('trainers');
      if (savedTrainers) {
        setLocalTrainers(JSON.parse(savedTrainers));
      }
    }
    
    if (courses && courses.length > 0) {
      setLocalCourses([...courses]);
    } else {
      // Get from localStorage if not provided
      const savedCourses = localStorage.getItem('courses');
      if (savedCourses) {
        setLocalCourses(JSON.parse(savedCourses));
      }
    }
  }, [trainers, courses]);

  if (!isOpen) return null;
  
  const handleAddTrainer = async () => {
    if (newTrainerName.trim()) {
      const newTrainer = { id: `t${Date.now()}`, name: newTrainerName };
      
      try {
        // Save to API
        const response = await axios.post(`${API_BASE_URL}/trainers`, {
          name: newTrainer.name
        });
        
        // Use the trainer returned by the API (which should have a DB-generated ID)
        const savedTrainer = response.data;
        const updatedTrainers = [...localTrainers, savedTrainer];
        
        setLocalTrainers(updatedTrainers);
        setNewTrainerName('');
        
        // Store in localStorage for persistence
        localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
      } catch (error) {
        console.error("Error adding trainer:", error);
        
        // Still update local state even if API fails
        const updatedTrainers = [...localTrainers, newTrainer];
        setLocalTrainers(updatedTrainers);
        setNewTrainerName('');
        
        // Store in localStorage for persistence
        localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
      }
    }
  };
  
  const handleDeleteTrainer = async (id) => {
    try {
      // Delete from database
      await axios.delete(`${API_BASE_URL}/trainers/${id}`);
      
      // Update local state
      const updatedTrainers = localTrainers.filter(trainer => trainer.id !== id);
      setLocalTrainers(updatedTrainers);
      
      // Update localStorage
      localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
    } catch (error) {
      console.error("Error deleting trainer:", error);
      
      // Still update local state even if API call fails
      const updatedTrainers = localTrainers.filter(trainer => trainer.id !== id);
      setLocalTrainers(updatedTrainers);
      
      // Update localStorage
      localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
    }
  };
  
  const handleCoursesChange = (updatedCourses) => {
    setLocalCourses(updatedCourses);
    localStorage.setItem('courses', JSON.stringify(updatedCourses));
    
    if (onSettingsChange) {
      onSettingsChange({ 
        type: 'courses',
        courses: updatedCourses
      });
    }
  };
  
  const handleImportEvents = (importedEvents) => {
    if (onImportEvents) {
      onImportEvents(importedEvents);
    }
  };
  
  const handleSave = async () => {
    try {
      // Ensure end time is set correctly (add 1 minute if needed)
      const endTime = workHours.endTime;
      const endTimeParts = endTime.split(':');
      if (endTimeParts[1] === '00' && endTimeParts[2] === '00') {
        workHours.endTime = `${endTimeParts[0]}:01:00`;
      }
      
      // Save trainers
      await axios.put(`${API_BASE_URL}/trainers`, localTrainers);
      onSettingsChange({ type: 'trainers', trainers: localTrainers });
      
      // Save courses
      await axios.put(`${API_BASE_URL}/courses`, localCourses);
      onSettingsChange({ type: 'courses', courses: localCourses });
      
      // Save work hours
      await axios.put(`${API_BASE_URL}/settings/workhours`, workHours);
      onSettingsChange({ type: 'workHours', startTime: workHours.startTime, endTime: workHours.endTime });
      
      // Persist settings locally
      localStorage.setItem('workHours', JSON.stringify(workHours));
      localStorage.setItem('trainers', JSON.stringify(localTrainers));
      localStorage.setItem('courses', JSON.stringify(localCourses));
      
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      
      // Fall back to local changes if API fails
      onSettingsChange({ type: 'trainers', trainers: localTrainers });
      onSettingsChange({ type: 'courses', courses: localCourses });
      onSettingsChange({ type: 'workHours', startTime: workHours.startTime, endTime: workHours.endTime });
      
      // Still persist settings locally
      localStorage.setItem('workHours', JSON.stringify(workHours));
      localStorage.setItem('trainers', JSON.stringify(localTrainers));
      localStorage.setItem('courses', JSON.stringify(localCourses));
      
      onClose();
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal modern">
        <div className="settings-header">
          <h2>הגדרות</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="settings-tabs">
          <button 
            className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            כללי
          </button>
          <button 
            className={`tab-button ${activeTab === 'trainers' ? 'active' : ''}`}
            onClick={() => setActiveTab('trainers')}
          >
            מאמנים
          </button>
          <button 
            className={`tab-button ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            קורסים
          </button>
          <button 
            className={`tab-button ${activeTab === 'eventTypes' ? 'active' : ''}`}
            onClick={() => setActiveTab('eventTypes')}
          >
            סוגי אירועים
          </button>
          <button 
            className={`tab-button ${activeTab === 'theme' ? 'active' : ''}`}
            onClick={() => setActiveTab('theme')}
          >
            עיצוב
          </button>
          <button 
            className={`tab-button ${activeTab === 'importExport' ? 'active' : ''}`}
            onClick={() => setActiveTab('importExport')}
          >
            ייבוא/ייצוא
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>הגדרות כלליות</h3>
              
              <h4>שעות עבודה</h4>
              <div className="form-group">
                <label>שעת התחלה</label>
                <input 
                  type="time" 
                  value={workHours.startTime.slice(0,5)} 
                  onChange={(e) => setWorkHours({...workHours, startTime: `${e.target.value}:00`})}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>שעת סיום</label>
                <input 
                  type="time" 
                  value={workHours.endTime.slice(0,5)} 
                  onChange={(e) => {
                    // Ensure end time has 01 minutes if hours are set to a full hour
                    const hours = e.target.value.split(':')[0];
                    const minutes = e.target.value.split(':')[1];
                    const newEndTime = minutes === '00' ? `${hours}:01:00` : `${e.target.value}:00`;
                    setWorkHours({...workHours, endTime: newEndTime});
                  }}
                  className="form-input"
                />
              </div>
            </div>
          )}
          
          {activeTab === 'trainers' && (
            <div className="settings-section">
              <h3>מאמנים</h3>
              <div className="form-group">
                <label>הוסף מאמן חדש</label>
                <div className="input-with-button">
                  <input 
                    type="text"
                    value={newTrainerName}
                    onChange={(e) => setNewTrainerName(e.target.value)}
                    className="form-input"
                    placeholder="שם המאמן החדש"
                  />
                  <button className="btn btn-primary" onClick={handleAddTrainer}>
                    הוסף
                  </button>
                </div>
              </div>
              
              <div className="items-list">
                {localTrainers.length > 0 ? (
                  <ul>
                    {localTrainers.map(trainer => (
                      <li key={trainer.id} className="item-row">
                        <span>{trainer.name}</span>
                        <button 
                          className="btn btn-danger btn-small" 
                          onClick={() => handleDeleteTrainer(trainer.id)}
                        >
                          הסר
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-items">
                    אין מאמנים. הוסף מאמן חדש למעלה.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'courses' && (
            <div className="settings-section">
              <h3>קורסים</h3>
              
              {/* Course management implementation */}
              <div className="courses-management">
                <div className="form-group">
                  <label>הוסף קורס חדש</label>
                  <div className="input-with-button">
                    <input 
                      type="text"
                      placeholder="שם הקורס החדש"
                      className="form-input"
                      id="new-course-name"
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        const courseNameInput = document.getElementById('new-course-name');
                        const courseName = courseNameInput.value.trim();
                        if (courseName) {
                          const newCourse = {
                            id: `c${Date.now()}`,
                            name: courseName,
                            color: {
                              bg: '#4361ee', // Default color
                              text: '#FFFFFF'
                            },
                            tags: []
                          };
                          
                          handleCoursesChange([...localCourses, newCourse]);
                          courseNameInput.value = '';
                        }
                      }}
                    >
                      הוסף
                    </button>
                  </div>
                </div>
                
                <div className="items-list">
                  {localCourses.length > 0 ? (
                    <ul>
                      {localCourses.map(course => (
                        <li key={course.id} className="item-row">
                          <div className="course-info">
                            <div 
                              className="course-color" 
                              style={{ backgroundColor: course.color?.bg || '#4361ee' }}
                            ></div>
                            <span>{course.name}</span>
                            {course.tags && course.tags.length > 0 && (
                              <div className="course-tags">
                                {course.tags.map(tag => (
                                  <span key={tag} className="course-tag">{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="course-actions">
                            <button 
                              className="btn btn-secondary btn-small"
                              onClick={() => {
                                // Toggle color picker
                                const colorPicker = document.getElementById(`color-picker-${course.id}`);
                                if (colorPicker) {
                                  colorPicker.style.display = colorPicker.style.display === 'none' ? 'block' : 'none';
                                }
                              }}
                            >
                              צבע
                            </button>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => {
                                const updatedCourses = localCourses.filter(c => c.id !== course.id);
                                handleCoursesChange(updatedCourses);
                              }}
                            >
                              הסר
                            </button>
                          </div>
                          <div 
                            id={`color-picker-${course.id}`} 
                            className="color-picker-dropdown"
                            style={{ display: 'none' }}
                          >
                            <div className="color-palette">
                              {[
                                '#4361ee', '#3a56d4', '#ef4444', '#10b981', 
                                '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6',
                                '#6366f1', '#0ea5e9', '#84cc16', '#f97316'
                              ].map(color => (
                                <div 
                                  key={color}
                                  className={`color-swatch ${course.color?.bg === color ? 'selected' : ''}`}
                                  style={{ backgroundColor: color }}
                                  onClick={() => {
                                    const updatedCourses = localCourses.map(c => {
                                      if (c.id === course.id) {
                                        return {
                                          ...c,
                                          color: { bg: color, text: '#FFFFFF' }
                                        };
                                      }
                                      return c;
                                    });
                                    handleCoursesChange(updatedCourses);
                                    
                                    // Hide color picker
                                    const colorPicker = document.getElementById(`color-picker-${course.id}`);
                                    if (colorPicker) {
                                      colorPicker.style.display = 'none';
                                    }
                                  }}
                                ></div>
                              ))}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="no-items">
                      אין קורסים. הוסף קורס חדש למעלה.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'eventTypes' && (
            <div className="settings-section">
              <EventTypesManager 
                onEventTypesChange={(eventTypes) => {
                  onSettingsChange({ type: 'eventTypes', eventTypes });
                }}
              />
            </div>
          )}
          
          {activeTab === 'theme' && (
            <div className="settings-section">
              <ThemeSelector />
            </div>
          )}
          
          {activeTab === 'importExport' && (
            <div className="settings-section">
              <ICSImportExport 
                courses={localCourses}
                trainers={localTrainers}
                events={events}
                onImport={handleImportEvents}
              />
            </div>
          )}
        </div>
        
        <div className="settings-footer">
          <div className="button-group button-group-inline">
            <button className="btn btn-secondary" onClick={onClose}>
              ביטול
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              שמור שינויים
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;
