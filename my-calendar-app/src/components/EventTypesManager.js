// EventTypesManager.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Default event types that cannot be deleted
const DEFAULT_EVENT_TYPES = [
];

const EventTypesManager = ({ onEventTypesChange }) => {
  const [eventTypes, setEventTypes] = useState(() => {
    const saved = localStorage.getItem('eventTypes');
    return saved ? JSON.parse(saved) : DEFAULT_EVENT_TYPES;
  });
  
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#4361ee');
  const [newTypeIcon, setNewTypeIcon] = useState('📅');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courses, setCourses] = useState([]);
  
  // Load courses
  useEffect(() => {
    const loadCourses = () => {
      const savedCourses = localStorage.getItem('courses');
      if (savedCourses) {
        setCourses(JSON.parse(savedCourses));
      } else {
        // Try to fetch from API
        axios.get(`${API_BASE_URL}/courses`)
          .then(response => {
            setCourses(response.data);
            localStorage.setItem('courses', JSON.stringify(response.data));
          })
          .catch(error => {
            console.error("Error fetching courses:", error);
          });
      }
    };
    
    loadCourses();
  }, []);
  
  // Save event types to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('eventTypes', JSON.stringify(eventTypes));
    
    // Notify parent component if callback is provided
    if (onEventTypesChange) {
      onEventTypesChange(eventTypes);
    }
  }, [eventTypes, onEventTypesChange]);
  
  const handleAddEventType = () => {
    if (newTypeName.trim()) {
      const newType = {
        id: `type-${Date.now()}`,
        name: newTypeName.trim(),
        color: newTypeColor,
        icon: newTypeIcon,
        relatedCourses: selectedCourses.length > 0 ? selectedCourses : null
      };
      
      setEventTypes([...eventTypes, newType]);
      resetForm();
    }
  };
  
  const handleDeleteEventType = (typeId) => {
    // Prevent deletion of default event types
    if (DEFAULT_EVENT_TYPES.some(type => type.id === typeId)) {
      return;
    }
    
    setEventTypes(eventTypes.filter(type => type.id !== typeId));
  };
  
  const resetForm = () => {
    setNewTypeName('');
    setNewTypeColor('#4361ee');
    setNewTypeIcon('📅');
    setSelectedCourses([]);
  };
  
  const handleCourseSelection = (e) => {
    const courseId = e.target.value;
    
    if (courseId === '') return;
    
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
    
    // Reset the select box
    e.target.value = '';
  };
  
  const removeSelectedCourse = (courseId) => {
    setSelectedCourses(selectedCourses.filter(id => id !== courseId));
  };
  
  // Common icons for event types
  const commonIcons = ['📅', '📚', '📝', '⏰', '👥', '🎓', '🏆', '💼', '🔍', '🎯'];
  
  const isDefaultType = (typeId) => {
    return DEFAULT_EVENT_TYPES.some(type => type.id === typeId);
  };
  
  return (
    <div className="event-types-manager">
      <h3>סוגי אירועים</h3>
      
      <div className="items-list">
        {eventTypes.length > 0 ? (
          <ul>
            {eventTypes.map(type => (
              <li key={type.id} className="item-row">
                <div className="event-type-info">
                  <span className="event-type-icon">{type.icon}</span>
                  <div 
                    className="event-type-color" 
                    style={{ 
                      backgroundColor: type.color,
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginLeft: '8px'
                    }}
                  />
                  <span className="event-type-name">{type.name}</span>
                  
                  {/* Display related courses if any */}
                  {type.relatedCourses && type.relatedCourses.length > 0 && (
                    <div className="related-courses">
                      <small>
                        קורסים: {type.relatedCourses.map(courseId => {
                          const course = courses.find(c => c.id === courseId);
                          return course ? course.name : '';
                        }).filter(Boolean).join(', ')}
                      </small>
                    </div>
                  )}
                </div>
                
                {/* Don't allow deleting default types */}
                {!isDefaultType(type.id) && (
                  <button 
                    className="btn btn-danger btn-small" 
                    onClick={() => handleDeleteEventType(type.id)}
                  >
                    הסר
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="no-items">
            אין סוגי אירועים. הוסף סוג אירוע חדש למעלה.
          </div>
        )}
      </div>
      
      <div className="add-event-type-form">
        <h4>הוסף סוג אירוע חדש</h4>
        
        <div className="form-group">
          <label>שם סוג האירוע</label>
          <input 
            type="text"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            className="form-input"
            placeholder="שם סוג האירוע"
          />
        </div>
        
        <div className="form-group">
          <label>צבע</label>
          <div className="color-input-group">
            <input 
              type="color" 
              value={newTypeColor}
              onChange={(e) => setNewTypeColor(e.target.value)}
              className="color-picker"
            />
            <input 
              type="text"
              value={newTypeColor}
              onChange={(e) => setNewTypeColor(e.target.value)}
              className="form-input"
              placeholder="#RRGGBB"
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>אייקון</label>
          <div className="icons-selector">
            {commonIcons.map((icon, index) => (
              <button
                key={index}
                type="button"
                className={`icon-button ${newTypeIcon === icon ? 'selected' : ''}`}
                onClick={() => setNewTypeIcon(icon)}
              >
                {icon}
              </button>
            ))}
            <input 
              type="text"
              value={newTypeIcon}
              onChange={(e) => setNewTypeIcon(e.target.value)}
              className="form-input icon-input"
              placeholder="אייקון (אימוג'י)"
              maxLength={2}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>קורסים קשורים (אופציונלי)</label>
          <select
            className="form-input"
            onChange={handleCourseSelection}
            defaultValue=""
          >
            <option value="">בחר קורס...</option>
            {courses
              .filter(course => !selectedCourses.includes(course.id))
              .map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))
            }
          </select>
          
          {/* Display selected courses */}
          {selectedCourses.length > 0 && (
            <div className="selected-courses">
              {selectedCourses.map(courseId => {
                const course = courses.find(c => c.id === courseId);
                return course ? (
                  <div key={courseId} className="selected-course-tag">
                    <span>{course.name}</span>
                    <button 
                      type="button"
                      className="remove-course-btn"
                      onClick={() => removeSelectedCourse(courseId)}
                    >
                      ×
                    </button>
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
        
        <div className="preview-event-type" style={{ 
          backgroundColor: newTypeColor,
          color: '#ffffff',
          padding: '12px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '16px',
          marginBottom: '16px',
          fontWeight: 'bold'
        }}>
          <span style={{ fontSize: '1.5em' }}>{newTypeIcon}</span>
          <span>{newTypeName || 'תצוגה מקדימה של סוג האירוע'}</span>
        </div>
        
        <button className="btn btn-primary" onClick={handleAddEventType}>
          הוסף סוג אירוע
        </button>
      </div>
    </div>
  );
};

export default EventTypesManager;
