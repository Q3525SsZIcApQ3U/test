import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Settings.css';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Default Color palette for courses
const DEFAULT_COLOR_PALETTE = [
  { bg: '#FF6B6B', text: '#FFFFFF' },
  { bg: '#4ECDC4', text: '#FFFFFF' },
  { bg: '#45B7D1', text: '#FFFFFF' },
  { bg: '#96CEB4', text: '#FFFFFF' },
  { bg: '#FFEEAD', text: '#000000' },
  { bg: '#D4A5A5', text: '#FFFFFF' },
  { bg: '#9B89B3', text: '#FFFFFF' },
  { bg: '#FF9999', text: '#FFFFFF' },
  { bg: '#77DD77', text: '#FFFFFF' },
  { bg: '#B19CD9', text: '#FFFFFF' },
];

// Default background themes
const DEFAULT_BACKGROUNDS = [
  { name: 'Default', value: '#ffffff' },
  { name: 'Light Blue', value: '#f0f8ff' },
  { name: 'Soft Green', value: '#f0fff0' },
  { name: 'Cream', value: '#fffaf0' },
  { name: 'Lavender', value: '#f5f0ff' },
  { name: 'Light Gray', value: '#f5f5f5' },
];

const SettingsComponent = ({ isOpen, onClose, trainers, courses, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [localTrainers, setLocalTrainers] = useState([]);
  const [localCourses, setLocalCourses] = useState([]);
  const [newTrainerName, setNewTrainerName] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseTag, setNewCourseTag] = useState('');
  const [selectedColor, setSelectedColor] = useState(() => {
    const savedPalette = localStorage.getItem('colorPalette');
    const palette = savedPalette ? JSON.parse(savedPalette) : DEFAULT_COLOR_PALETTE;
    return palette[0];
  });
  
  const [colorPalette, setColorPalette] = useState(() => {
    // Load custom color palette from localStorage if exists
    const savedPalette = localStorage.getItem('colorPalette');
    return savedPalette ? JSON.parse(savedPalette) : DEFAULT_COLOR_PALETTE;
  });
  
  const [newColorBg, setNewColorBg] = useState('#3B82F6');
  const [newColorText, setNewColorText] = useState('#FFFFFF');
  const [workHours, setWorkHours] = useState(() => {
    // Load persistent settings from localStorage
    const saved = localStorage.getItem('workHours');
    return saved ? JSON.parse(saved) : { startTime: "07:00:00", endTime: "22:00:00" };
  });
  
  const [tags, setTags] = useState(() => {
    const savedTags = localStorage.getItem('courseTags');
    return savedTags ? JSON.parse(savedTags) : [];
  });
  
  const [eventTypes, setEventTypes] = useState(() => {
    const savedTypes = localStorage.getItem('eventTypes');
    return savedTypes ? JSON.parse(savedTypes) : [
      { id: 'regular', name: 'שיעור רגיל', color: '#3B82F6' },
      { id: 'special', name: 'שיעור מיוחד', color: '#F59E0B' },
      { id: 'exam', name: 'בחינה', color: '#DC2626' }
    ];
  });
  
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#3B82F6');
  
  const [newTagName, setNewTagName] = useState('');
  
  const [backgrounds, setBackgrounds] = useState(() => {
    const savedBackgrounds = localStorage.getItem('backgrounds');
    return savedBackgrounds ? JSON.parse(savedBackgrounds) : DEFAULT_BACKGROUNDS;
  });
  
  const [selectedBackground, setSelectedBackground] = useState(() => {
    return localStorage.getItem('selectedBackground') || '#ffffff';
  });
  
  const [newBackgroundName, setNewBackgroundName] = useState('');
  const [newBackgroundColor, setNewBackgroundColor] = useState('#f0f0f0');
  
  const [backupSettings, setBackupSettings] = useState({
    autoBackup: localStorage.getItem('autoBackup') === 'true' || false,
    backupInterval: localStorage.getItem('backupInterval') || 'daily'
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
    
    // Load tags from localStorage
    const savedTags = localStorage.getItem('courseTags');
    if (savedTags) {
      setTags(JSON.parse(savedTags));
    }
    
    // Load event types from localStorage
    const savedTypes = localStorage.getItem('eventTypes');
    if (savedTypes) {
      setEventTypes(JSON.parse(savedTypes));
    }
    
    // Load background settings
    const savedBackgrounds = localStorage.getItem('backgrounds');
    if (savedBackgrounds) {
      setBackgrounds(JSON.parse(savedBackgrounds));
    }
    
    const savedBackground = localStorage.getItem('selectedBackground');
    if (savedBackground) {
      setSelectedBackground(savedBackground);
      // Apply background to the calendar container
      document.documentElement.style.setProperty('--calendar-bg-color', savedBackground);
    }
  }, [trainers, courses]);

  if (!isOpen) return null;

  const handleAddTrainer = () => {
    if (newTrainerName.trim()) {
      const newTrainer = { id: `t${Date.now()}`, name: newTrainerName };
      const updatedTrainers = [...localTrainers, newTrainer];
      setLocalTrainers(updatedTrainers);
      setNewTrainerName('');
      
      // Store in localStorage for persistence
      localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
    }
  };

  const handleDeleteTrainer = (id) => {
    const updatedTrainers = localTrainers.filter(trainer => trainer.id !== id);
    setLocalTrainers(updatedTrainers);
    
    // Update localStorage
    localStorage.setItem('trainers', JSON.stringify(updatedTrainers));
  };

  const handleAddCourse = () => {
    if (newCourseName.trim()) {
      const newCourse = { 
        id: `c${Date.now()}`, 
        name: newCourseName, 
        color: selectedColor,
        tags: newCourseTag.trim() ? [newCourseTag.trim()] : []
      };
      
      const updatedCourses = [...localCourses, newCourse];
      setLocalCourses(updatedCourses);
      setNewCourseName('');
      setNewCourseTag('');
      setSelectedColor(colorPalette[updatedCourses.length % colorPalette.length]);
      
      // Store in localStorage for persistence
      localStorage.setItem('courses', JSON.stringify(updatedCourses));
      
      // Add tag to tags list if it's new
      if (newCourseTag.trim() && !tags.includes(newCourseTag.trim())) {
        const updatedTags = [...tags, newCourseTag.trim()];
        setTags(updatedTags);
        localStorage.setItem('courseTags', JSON.stringify(updatedTags));
      }
    }
  };

  const handleDeleteCourse = (id) => {
    const updatedCourses = localCourses.filter(course => course.id !== id);
    setLocalCourses(updatedCourses);
    
    // Update localStorage
    localStorage.setItem('courses', JSON.stringify(updatedCourses));
  };

  const handleAddTag = () => {
    if (newTagName.trim() && !tags.includes(newTagName.trim())) {
      const updatedTags = [...tags, newTagName.trim()];
      setTags(updatedTags);
      localStorage.setItem('courseTags', JSON.stringify(updatedTags));
      setNewTagName('');
    }
  };

  const handleDeleteTag = (tag) => {
    const updatedTags = tags.filter(t => t !== tag);
    setTags(updatedTags);
    localStorage.setItem('courseTags', JSON.stringify(updatedTags));
    
    // Also remove this tag from any courses that have it
    const updatedCourses = localCourses.map(course => {
      if (course.tags && course.tags.includes(tag)) {
        return {
          ...course,
          tags: course.tags.filter(t => t !== tag)
        };
      }
      return course;
    });
    
    setLocalCourses(updatedCourses);
    localStorage.setItem('courses', JSON.stringify(updatedCourses));
  };

  const handleAddTagToCourse = (courseId, tag) => {
    const updatedCourses = localCourses.map(course => {
      if (course.id === courseId) {
        const updatedTags = course.tags || [];
        if (!updatedTags.includes(tag)) {
          return {
            ...course,
            tags: [...updatedTags, tag]
          };
        }
      }
      return course;
    });
    
    setLocalCourses(updatedCourses);
    localStorage.setItem('courses', JSON.stringify(updatedCourses));
  };

  const handleRemoveTagFromCourse = (courseId, tag) => {
    const updatedCourses = localCourses.map(course => {
      if (course.id === courseId && course.tags) {
        return {
          ...course,
          tags: course.tags.filter(t => t !== tag)
        };
      }
      return course;
    });
    
    setLocalCourses(updatedCourses);
    localStorage.setItem('courses', JSON.stringify(updatedCourses));
  };
  
  const handleAddEventType = () => {
    if (newTypeName.trim()) {
      const newType = {
        id: `type-${Date.now()}`,
        name: newTypeName.trim(),
        color: newTypeColor
      };
      
      const updatedTypes = [...eventTypes, newType];
      setEventTypes(updatedTypes);
      localStorage.setItem('eventTypes', JSON.stringify(updatedTypes));
      
      setNewTypeName('');
      setNewTypeColor('#3B82F6');
    }
  };
  
  const handleDeleteEventType = (typeId) => {
    const updatedTypes = eventTypes.filter(type => type.id !== typeId);
    setEventTypes(updatedTypes);
    localStorage.setItem('eventTypes', JSON.stringify(updatedTypes));
  };
  
  const handleAddBackground = () => {
    if (newBackgroundName.trim()) {
      const newBackground = {
        name: newBackgroundName.trim(),
        value: newBackgroundColor
      };
      
      const updatedBackgrounds = [...backgrounds, newBackground];
      setBackgrounds(updatedBackgrounds);
      localStorage.setItem('backgrounds', JSON.stringify(updatedBackgrounds));
      
      setNewBackgroundName('');
      setNewBackgroundColor('#f0f0f0');
    }
  };
  
  const handleDeleteBackground = (bgValue) => {
    const updatedBackgrounds = backgrounds.filter(bg => bg.value !== bgValue);
    setBackgrounds(updatedBackgrounds);
    localStorage.setItem('backgrounds', JSON.stringify(updatedBackgrounds));
    
    // If the deleted background was selected, reset to default
    if (selectedBackground === bgValue) {
      setSelectedBackground('#ffffff');
      localStorage.setItem('selectedBackground', '#ffffff');
      document.documentElement.style.setProperty('--calendar-bg-color', '#ffffff');
    }
  };
  
  const handleSelectBackground = (bgValue) => {
    setSelectedBackground(bgValue);
    localStorage.setItem('selectedBackground', bgValue);
    document.documentElement.style.setProperty('--calendar-bg-color', bgValue);
  };

  const handleAddColorToPalette = () => {
    if (newColorBg) {
      const newColor = { bg: newColorBg, text: newColorText };
      const updatedPalette = [...colorPalette, newColor];
      setColorPalette(updatedPalette);
      localStorage.setItem('colorPalette', JSON.stringify(updatedPalette));
      setNewColorBg('#3B82F6');
      setNewColorText('#FFFFFF');
    }
  };

  const handleResetColorPalette = () => {
    setColorPalette(DEFAULT_COLOR_PALETTE);
    localStorage.setItem('colorPalette', JSON.stringify(DEFAULT_COLOR_PALETTE));
  };

  const handleSave = async () => {
    try {
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
      localStorage.setItem('autoBackup', backupSettings.autoBackup);
      localStorage.setItem('backupInterval', backupSettings.backupInterval);
      localStorage.setItem('colorPalette', JSON.stringify(colorPalette));
      localStorage.setItem('courseTags', JSON.stringify(tags));
      localStorage.setItem('eventTypes', JSON.stringify(eventTypes));
      localStorage.setItem('backgrounds', JSON.stringify(backgrounds));
      localStorage.setItem('selectedBackground', selectedBackground);
      
      // Apply background color
      document.documentElement.style.setProperty('--calendar-bg-color', selectedBackground);
      
      // Notify parent component of all changes
      onSettingsChange({ type: 'eventTypes', eventTypes });
      onSettingsChange({ type: 'background', selectedBackground });
      
      onClose();
    } catch (error) {
      console.error("Error saving settings:", error);
      
      // Fall back to local changes if API fails
      onSettingsChange({ type: 'trainers', trainers: localTrainers });
      onSettingsChange({ type: 'courses', courses: localCourses });
      onSettingsChange({ type: 'workHours', startTime: workHours.startTime, endTime: workHours.endTime });
      onSettingsChange({ type: 'colorPalette', colorPalette });
      onSettingsChange({ type: 'courseTags', tags });
      onSettingsChange({ type: 'eventTypes', eventTypes });
      onSettingsChange({ type: 'background', selectedBackground });
      
      // Still persist settings locally
      localStorage.setItem('workHours', JSON.stringify(workHours));
      localStorage.setItem('trainers', JSON.stringify(localTrainers));
      localStorage.setItem('courses', JSON.stringify(localCourses));
      localStorage.setItem('autoBackup', backupSettings.autoBackup);
      localStorage.setItem('backupInterval', backupSettings.backupInterval);
      localStorage.setItem('colorPalette', JSON.stringify(colorPalette));
      localStorage.setItem('courseTags', JSON.stringify(tags));
      localStorage.setItem('eventTypes', JSON.stringify(eventTypes));
      localStorage.setItem('backgrounds', JSON.stringify(backgrounds));
      localStorage.setItem('selectedBackground', selectedBackground);
      
      // Apply background color
      document.documentElement.style.setProperty('--calendar-bg-color', selectedBackground);
      
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
            className={`tab-button ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            תגיות
          </button>
          <button 
            className={`tab-button ${activeTab === 'eventTypes' ? 'active' : ''}`}
            onClick={() => setActiveTab('eventTypes')}
          >
            סוגי אירועים
          </button>
          <button 
            className={`tab-button ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            עיצוב
          </button>
          <button 
            className={`tab-button ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            צבעים
          </button>
          <button 
            className={`tab-button ${activeTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveTab('backup')}
          >
            גיבוי ושחזור
          </button>
        </div>
        
        <div className="settings-content">
          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>שעות עבודה</h3>
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
                  onChange={(e) => setWorkHours({...workHours, endTime: `${e.target.value}:00`})}
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
              <div className="form-group">
                <label>הוסף קורס חדש</label>
                <div className="input-with-button">
                  <input 
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="form-input"
                    placeholder="שם הקורס החדש"
                  />
                  <button className="btn btn-primary" onClick={handleAddCourse}>
                    הוסף
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>תגית לקורס החדש (אופציונלי)</label>
                <select
                  value={newCourseTag}
                  onChange={(e) => setNewCourseTag(e.target.value)}
                  className="form-input"
                >
                  <option value="">בחר תגית</option>
                  {tags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>בחר צבע לקורס חדש</label>
                <div className="color-palette">
                  {colorPalette.map((color, index) => (
                    <div
                      key={index}
                      className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color.bg }}
                      onClick={() => setSelectedColor(color)}
                    />
                  ))}
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
                            style={{ backgroundColor: course.color?.bg || '#CCCCCC' }}
                          />
                          <div>
                            <span>{course.name}</span>
                            
                            {/* Tags list */}
                            {course.tags && course.tags.length > 0 && (
                              <div className="course-tags">
                                {course.tags.map(tag => (
                                  <span key={tag} className="course-tag">
                                    {tag}
                                    <button 
                                      className="tag-remove-btn" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTagFromCourse(course.id, tag);
                                      }}
                                    >
                                      ×
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Add tag dropdown */}
                            {tags.length > 0 && (
                              <div className="add-tag-dropdown">
                                <select 
                                  className="tag-select"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAddTagToCourse(course.id, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="">הוסף תגית...</option>
                                  {tags
                                    .filter(tag => !course.tags || !course.tags.includes(tag))
                                    .map(tag => (
                                      <option key={tag} value={tag}>{tag}</option>
                                    ))
                                  }
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                        <button 
                          className="btn btn-danger btn-small" 
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          הסר
                        </button>
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
          )}
          
          {activeTab === 'tags' && (
            <div className="settings-section">
              <h3>תגיות</h3>
              <div className="form-group">
                <label>הוסף תגית חדשה</label>
                <div className="input-with-button">
                  <input 
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="form-input"
                    placeholder="שם התגית"
                  />
                  <button className="btn btn-primary" onClick={handleAddTag}>
                    הוסף
                  </button>
                </div>
              </div>
              
              <div className="items-list">
                {tags.length > 0 ? (
                  <ul>
                    {tags.map(tag => (
                      <li key={tag} className="item-row">
                        <div className="tag-info">
                          <span className="tag-display">{tag}</span>
                          <span className="tag-count">
                            {localCourses.filter(course => 
                              course.tags && course.tags.includes(tag)
                            ).length} קורסים
                          </span>
                        </div>
                        <button 
                          className="btn btn-danger btn-small" 
                          onClick={() => handleDeleteTag(tag)}
                        >
                          הסר
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-items">
                    אין תגיות. הוסף תגית חדשה למעלה.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'eventTypes' && (
            <div className="settings-section">
              <h3>סוגי אירועים</h3>
              <div className="form-group">
                <label>הוסף סוג אירוע חדש</label>
                <div className="input-with-button">
                  <input 
                    type="text"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    className="form-input"
                    placeholder="שם סוג האירוע"
                  />
                </div>
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
                
                <div className="preview-chip" style={{ 
                  backgroundColor: newTypeColor,
                  color: '#ffffff',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '8px',
                  fontWeight: 'bold'
                }}>
                  {newTypeName || 'סוג אירוע חדש'}
                </div>
                
                <div style={{ marginTop: '12px' }}>
                  <button className="btn btn-primary" onClick={handleAddEventType}>
                    הוסף סוג אירוע
                  </button>
                </div>
              </div>
              
              <div className="items-list">
                {eventTypes.length > 0 ? (
                  <ul>
                    {eventTypes.map(type => (
                      <li key={type.id} className="item-row">
                        <div className="event-type-info">
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
                          <span>{type.name}</span>
                        </div>
                        {/* Don't allow deleting the default types */}
                        {!['regular', 'special', 'exam'].includes(type.id) && (
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
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <h3>עיצוב</h3>
              <div className="form-group">
                <label>צבע רקע לוח השנה</label>
                <div className="background-options">
                  {backgrounds.map((bg) => (
                    <div 
                      key={bg.value}
                      className={`background-option ${selectedBackground === bg.value ? 'selected' : ''}`}
                      style={{ backgroundColor: bg.value }}
                      onClick={() => handleSelectBackground(bg.value)}
                    >
                      <div className="bg-name">{bg.name}</div>
                      {!DEFAULT_BACKGROUNDS.some(defaultBg => defaultBg.value === bg.value) && (
                        <button 
                          className="bg-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBackground(bg.value);
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label>הוסף צבע רקע חדש</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    value={newBackgroundName}
                    onChange={(e) => setNewBackgroundName(e.target.value)}
                    className="form-input"
                    placeholder="שם צבע הרקע"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>צבע</label>
                <div className="color-input-group">
                  <input 
                    type="color" 
                    value={newBackgroundColor}
                    onChange={(e) => setNewBackgroundColor(e.target.value)}
                    className="color-picker"
                  />
                  <input 
                    type="text"
                    value={newBackgroundColor}
                    onChange={(e) => setNewBackgroundColor(e.target.value)}
                    className="form-input"
                    placeholder="#RRGGBB"
                  />
                </div>
                
                <div className="preview-background" style={{ 
                  backgroundColor: newBackgroundColor,
                  padding: '12px',
                  borderRadius: '8px',
                  marginTop: '10px',
                  textAlign: 'center',
                  border: '1px solid #ddd'
                }}>
                  <div style={{ 
                    backgroundColor: '#fff', 
                    padding: '12px', 
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    תצוגה מקדימה של רקע הלוח
                  </div>
                </div>
                
                <div style={{ marginTop: '12px' }}>
                  <button className="btn btn-primary" onClick={handleAddBackground}>
                    הוסף צבע רקע
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'colors' && (
            <div className="settings-section">
              <h3>לוח צבעים</h3>
              
              <div className="color-palette-manager">
                <h4>צבעים נוכחיים</h4>
                <div className="color-palette color-palette-large">
                  {colorPalette.map((color, index) => (
                    <div
                      key={index}
                      className="color-swatch color-swatch-large"
                      style={{ 
                        backgroundColor: color.bg,
                        color: color.text,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                      }}
                      title={color.bg}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
                
                <h4>הוסף צבע חדש</h4>
                <div className="color-add-form">
                  <div className="form-group">
                    <label>צבע רקע</label>
                    <div className="color-input-group">
                      <input 
                        type="color" 
                        value={newColorBg}
                        onChange={(e) => setNewColorBg(e.target.value)}
                        className="color-picker"
                      />
                      <input 
                        type="text"
                        value={newColorBg}
                        onChange={(e) => setNewColorBg(e.target.value)}
                        className="form-input"
                        placeholder="#RRGGBB"
                      />
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>צבע טקסט</label>
                    <div className="color-input-group">
                      <input 
                        type="color" 
                        value={newColorText}
                        onChange={(e) => setNewColorText(e.target.value)}
                        className="color-picker"
                      />
                      <input 
                        type="text"
                        value={newColorText}
                        onChange={(e) => setNewColorText(e.target.value)}
                        className="form-input"
                        placeholder="#RRGGBB"
                      />
                    </div>
                  </div>
                  
                  <div className="preview-color" style={{ 
                    backgroundColor: newColorBg, 
                    color: newColorText,
                    padding: '12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginBottom: '16px',
                    fontWeight: 'bold'
                  }}>
                    תצוגה מקדימה של הצבע
                  </div>
                  
                  <div className="button-group button-group-inline">
                    <button className="btn btn-primary" onClick={handleAddColorToPalette}>
                      הוסף צבע
                    </button>
                    <button className="btn btn-secondary" onClick={handleResetColorPalette}>
                      אפס לברירת מחדל
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'backup' && (
            <div className="settings-section">
              <h3>גיבוי ושחזור</h3>
              
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={backupSettings.autoBackup}
                    onChange={(e) => setBackupSettings({
                      ...backupSettings,
                      autoBackup: e.target.checked
                    })}
                    className="checkbox-input"
                  />
                  <span>גיבוי אוטומטי</span>
                </label>
              </div>
              
              {backupSettings.autoBackup && (
                <div className="form-group">
                  <label>תדירות גיבוי</label>
                  <select
                    value={backupSettings.backupInterval}
                    onChange={(e) => setBackupSettings({
                      ...backupSettings,
                      backupInterval: e.target.value
                    })}
                    className="form-input"
                  >
                    <option value="daily">יומי</option>
                    <option value="weekly">שבועי</option>
                    <option value="monthly">חודשי</option>
                  </select>
                </div>
              )}
              
              <div className="button-group button-group-inline" style={{ marginTop: '24px' }}>
                <button className="btn btn-primary" onClick={() => {
                  // Create data object with all settings
                  const backupData = {
                    trainers: localTrainers,
                    courses: localCourses,
                    workHours: workHours,
                    colorPalette: colorPalette,
                    tags: tags,
                    eventTypes: eventTypes,
                    backgrounds: backgrounds,
                    selectedBackground: selectedBackground,
                    backupDate: new Date().toISOString()
                  };
                  
                  // Convert to JSON string
                  const jsonData = JSON.stringify(backupData, null, 2);
                  
                  // Create blob and download
                  const blob = new Blob([jsonData], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `calendar-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                }}>
                  גיבוי עכשיו
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  // Create file input element
                  const fileInput = document.createElement('input');
                  fileInput.type = 'file';
                  fileInput.accept = 'application/json';
                  
                  fileInput.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.readAsText(file);
                      reader.onload = () => {
                        try {
                          const data = JSON.parse(reader.result);
                          
                          // Restore data
                          if (data.trainers) setLocalTrainers(data.trainers);
                          if (data.courses) setLocalCourses(data.courses);
                          if (data.workHours) setWorkHours(data.workHours);
                          if (data.colorPalette) setColorPalette(data.colorPalette);
                          if (data.tags) setTags(data.tags);
                          if (data.eventTypes) setEventTypes(data.eventTypes);
                          if (data.backgrounds) setBackgrounds(data.backgrounds);
                          if (data.selectedBackground) {
                            setSelectedBackground(data.selectedBackground);
                            document.documentElement.style.setProperty('--calendar-bg-color', data.selectedBackground);
                          }
                          
                          // Save to localStorage
                          localStorage.setItem('trainers', JSON.stringify(data.trainers || []));
                          localStorage.setItem('courses', JSON.stringify(data.courses || []));
                          localStorage.setItem('workHours', JSON.stringify(data.workHours || { startTime: "07:00:00", endTime: "22:00:00" }));
                          localStorage.setItem('colorPalette', JSON.stringify(data.colorPalette || DEFAULT_COLOR_PALETTE));
                          localStorage.setItem('courseTags', JSON.stringify(data.tags || []));
                          localStorage.setItem('eventTypes', JSON.stringify(data.eventTypes || []));
                          localStorage.setItem('backgrounds', JSON.stringify(data.backgrounds || DEFAULT_BACKGROUNDS));
                          localStorage.setItem('selectedBackground', data.selectedBackground || '#ffffff');
                          
                          alert('שחזור גיבוי בוצע בהצלחה.');
                        } catch (error) {
                          console.error("Error restoring backup:", error);
                          alert('שגיאה בשחזור גיבוי. הקובץ אינו תקין.');
                        }
                      };
                    }
                  };
                  
                  fileInput.click();
                }}>
                  שחזר מגיבוי
                </button>
              </div>
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