// Enhanced SettingsComponent.js with database persistence
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
  const [workHours, setWorkHours] = useState({ startTime: "07:00:00", endTime: "22:01:00" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load work hours from database on component mount
  useEffect(() => {
    const fetchWorkHours = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${API_BASE_URL}/settings/workhours`);
        setWorkHours(response.data);
      } catch (error) {
        console.error("Error fetching work hours:", error);
        setError("Failed to load work hours. Using defaults.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkHours();
  }, []);
  
  // Initialize the state from props when component mounts or when props change
  useEffect(() => {
    if (trainers && trainers.length > 0) {
      setLocalTrainers([...trainers]);
    } else {
      // Fetch trainers from database if not provided in props
      const fetchTrainers = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await axios.get(`${API_BASE_URL}/trainers`);
          setLocalTrainers(response.data);
        } catch (error) {
          console.error("Error fetching trainers:", error);
          setError("Failed to load trainers. Using defaults.");
          setLocalTrainers([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTrainers();
    }
    
    if (courses && courses.length > 0) {
      setLocalCourses([...courses]);
    } else {
      // Fetch courses from database if not provided in props
      const fetchCourses = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const response = await axios.get(`${API_BASE_URL}/courses`);
          setLocalCourses(response.data);
        } catch (error) {
          console.error("Error fetching courses:", error);
          setError("Failed to load courses. Using defaults.");
          setLocalCourses([]);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchCourses();
    }
  }, [trainers, courses]);

  if (!isOpen) return null;
  
  const handleAddTrainer = async () => {
    if (newTrainerName.trim()) {
      try {
        setIsLoading(true);
        setError(null);
        
        // Save to API
        const response = await axios.post(`${API_BASE_URL}/trainers`, {
          name: newTrainerName
        });
        
        // Use the trainer returned by the API (which should have a DB-generated ID)
        const savedTrainer = response.data;
        const updatedTrainers = [...localTrainers, savedTrainer];
        
        setLocalTrainers(updatedTrainers);
        setNewTrainerName('');
      } catch (error) {
        console.error("Error adding trainer:", error);
        setError("Failed to add trainer. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const handleDeleteTrainer = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Delete from database
      await axios.delete(`${API_BASE_URL}/trainers/${id}`);
      
      // Update local state
      const updatedTrainers = localTrainers.filter(trainer => trainer.id !== id);
      setLocalTrainers(updatedTrainers);
    } catch (error) {
      console.error("Error deleting trainer:", error);
      setError("Failed to delete trainer. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCoursesChange = async (updatedCourses) => {
    setLocalCourses(updatedCourses);
    
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
  
  const handleAddCourse = async (courseName) => {
    if (!courseName.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const newCourse = {
        name: courseName,
        color: {
          bg: '#4361ee', // Default color
          text: '#FFFFFF'
        },
        tags: []
      };
      
      // Save to database
      const response = await axios.post(`${API_BASE_URL}/courses`, {
        name: newCourse.name,
        color: JSON.stringify(newCourse.color),
        tags: JSON.stringify(newCourse.tags)
      });
      
      // Use the course returned by the API
      const savedCourse = response.data;
      const updatedCourses = [...localCourses, savedCourse];
      
      // Update local state and notify parent
      handleCoursesChange(updatedCourses);
    } catch (error) {
      console.error("Error adding course:", error);
      setError("Failed to add course. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteCourse = async (courseId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Delete from database
      await axios.delete(`${API_BASE_URL}/courses/${courseId}`);
      
      // Update local state
      const updatedCourses = localCourses.filter(course => course.id !== courseId);
      handleCoursesChange(updatedCourses);
    } catch (error) {
      console.error("Error deleting course:", error);
      setError("Failed to delete course. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateCourseColor = async (courseId, color) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Find the course to update
      const courseToUpdate = localCourses.find(course => course.id === courseId);
      if (!courseToUpdate) {
        throw new Error("Course not found");
      }
      
      // Update the course in the database
      const updatedCourse = {
        ...courseToUpdate,
        color: { bg: color, text: '#FFFFFF' }
      };
      
      await axios.put(`${API_BASE_URL}/courses/${courseId}`, {
        name: updatedCourse.name,
        color: JSON.stringify(updatedCourse.color),
        tags: JSON.stringify(updatedCourse.tags || [])
      });
      
      // Update local state
      const updatedCourses = localCourses.map(course => 
        course.id === courseId ? updatedCourse : course
      );
      
      handleCoursesChange(updatedCourses);
    } catch (error) {
      console.error("Error updating course color:", error);
      setError("Failed to update course color. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Ensure end time is set correctly (add 1 minute if needed)
      const endTime = workHours.endTime;
      const endTimeParts = endTime.split(':');
      const finalEndTime = (endTimeParts[1] === '00' && endTimeParts[2] === '00') 
        ? `${endTimeParts[0]}:01:00` 
        : endTime;
      
      const finalWorkHours = {
        startTime: workHours.startTime,
        endTime: finalEndTime
      };
      
      // Save work hours to database
      await axios.post(`${API_BASE_URL}/settings/workhours`, finalWorkHours);
      
      // Notify parent component
      if (onSettingsChange) {
        onSettingsChange({ 
          type: 'workHours', 
          startTime: finalWorkHours.startTime, 
          endTime: finalWorkHours.endTime 
        });
        
        onSettingsChange({ type: 'trainers', trainers: localTrainers });
        onSettingsChange({ type: 'courses', courses: localCourses });
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      setError("Failed to save settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal modern">
        <div className="settings-header">
          <h2>הגדרות</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <span>טוען...</span>
          </div>
        )}
        
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
                  <button 
                    className="btn btn-primary" 
                    onClick={handleAddTrainer}
                    disabled={isLoading}
                  >
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
                          disabled={isLoading}
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
                          handleAddCourse(courseName);
                          courseNameInput.value = '';
                        }
                      }}
                      disabled={isLoading}
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
                              disabled={isLoading}
                            >
                              צבע
                            </button>
                            <button 
                              className="btn btn-danger btn-small"
                              onClick={() => handleDeleteCourse(course.id)}
                              disabled={isLoading}
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
                                    handleUpdateCourseColor(course.id, color);
                                    
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
            <button 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isLoading}
            >
              ביטול
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsComponent;
