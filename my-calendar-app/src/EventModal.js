import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './Calendar.css';

/* ------------------- Warning Toast Content (in Hebrew) ------------------- */
const WarningToastContent = ({ warnings, onProceed, onCancel, conflictingEvents = [] }) => (
  <div className="warning-toast-content" style={{ fontSize: '0.9em', direction: 'rtl' }}>
    <h4>נמצאו אזהרות</h4>
    <ul>
      {warnings.includes("ScheduleAvailability") && (
        <li>
          השעה הזו כבר תפוסה בלוח הזמנים.
          {conflictingEvents.length > 0 && (
            <ul>
              {conflictingEvents.map((event, index) => (
                <li key={index}>
                  <strong>{event.title}</strong>: {new Date(event.start).toLocaleTimeString('he-IL')} - {new Date(event.end).toLocaleTimeString('he-IL')}
                </li>
              ))}
            </ul>
          )}
        </li>
      )}
      {warnings.includes("SingleMeetingTime") && (
        <li>הקורס דורש מפגש של שעה אחת בדיוק.</li>
      )}
      {warnings.includes("MinimumTimeGap") && (
        <li>יש פחות מ-12 שעות בין מפגש זה למפגש אחר.</li>
      )}
    </ul>
    <div className="warning-toast-buttons">
      <button onClick={onProceed} className="btn btn-primary">המשך</button>
      <button onClick={onCancel} className="btn btn-secondary">ביטול</button>
    </div>
  </div>
);

// Try to get color palette from localStorage, or use default
const getColorPalette = () => {
  try {
    const savedPalette = localStorage.getItem('colorPalette');
    if (savedPalette) {
      return JSON.parse(savedPalette);
    }
  } catch (error) {
    console.error("Error loading color palette from localStorage:", error);
  }
  
  // Default palette if localStorage fails
  return [
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
};

// Get event types from localStorage, or use default
const getEventTypes = () => {
  try {
    const savedTypes = localStorage.getItem('eventTypes');
    if (savedTypes) {
      return JSON.parse(savedTypes);
    }
  } catch (error) {
    console.error("Error loading event types from localStorage:", error);
  }
  
  // Default event types if localStorage fails
  return [
    { id: 'regular', name: 'שיעור רגיל', color: '#3B82F6' },
    { id: 'special', name: 'שיעור מיוחד', color: '#F59E0B' },
    { id: 'exam', name: 'בחינה', color: '#DC2626' }
  ];
};

/**
 * EventModal Component
 * 
 * Modal dialog for creating and editing calendar events.
 */
const EventModal = ({
  isOpen,
  onClose,
  event,
  courses = [],
  trainers = [],
  onUpdate,
  onDelete,
  onAddCourse,
  allEvents = [],
  confirmDelete
}) => {
  // Form state
  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.extendedProps?.description || '');
  const [location, setLocation] = useState(event?.extendedProps?.location || '');
  const [selectedCourseId, setSelectedCourseId] = useState(event?.extendedProps?.courseId || '');
  const [selectedTrainerId, setSelectedTrainerId] = useState(event?.extendedProps?.trainerId || '');
  const [selectedEventType, setSelectedEventType] = useState(
    event?.extendedProps?.eventTypeId || 'regular'
  );
  const [isRecurring, setIsRecurring] = useState(!!event?.rrule);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    event?.rrule?.until ? new Date(event.rrule.until).toISOString().split('T')[0] : ''
  );
  
  // New course form state
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  
  // State for event types
  const [eventTypes, setEventTypes] = useState([]);
  
  // Get all available tags
  const [availableTags, setAvailableTags] = useState([]);
  
  // Fetch tags and event types when component mounts
  useEffect(() => {
    const fetchData = () => {
      try {
        // Load tags
        const savedTags = localStorage.getItem('courseTags');
        if (savedTags) {
          setAvailableTags(JSON.parse(savedTags));
        }
        
        // Load event types
        setEventTypes(getEventTypes());
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
        setAvailableTags([]);
        setEventTypes(getEventTypes());
      }
    };
    
    fetchData();
  }, []);
  
  // Early return if modal is closed
  if (!isOpen) return null;

  /**
   * Validates event for potential conflicts and issues
   */
  const validateEvent = (updatedEvent) => {
    const warnings = [];
    const conflictingEvents = [];
    const start = new Date(updatedEvent.start);
    const end = new Date(updatedEvent.end);
    const meetingDuration = (end - start) / (1000 * 60);

    // Check meeting duration
    if (meetingDuration !== 60) {
      warnings.push("SingleMeetingTime");
    }

    // Check for scheduling conflicts
    for (let ev of allEvents) {
      if (ev.id === updatedEvent.id) continue; // Skip the current event

      const evStart = new Date(ev.start);
      const evEnd = new Date(ev.end);
      const hoursBetween = Math.abs(end - evEnd) / (1000 * 60 * 60);

      // Check for overlap
      if (start < evEnd && evStart < end && ev.extendedProps.trainerId ==  updatedEvent.extendedProps.trainerId ) {
        warnings.push("ScheduleAvailability");
        conflictingEvents.push(ev);
      }
      else if (hoursBetween < 12 &&ev.title==updatedEvent.title && ev.extendedProps.trainerId ==  updatedEvent.extendedProps.trainerId ) 
      {
        warnings.push("MinimumTimeGap");
      }
    }

    return { warnings, conflictingEvents };
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Get course info for title and color
    const course = courses.find(c => c.id === selectedCourseId);
    
    // Get event type
    const eventType = eventTypes.find(t => t.id === selectedEventType);
    
    // Create updated event object
    const updatedEvent = {
      id: event.id,
      title: course ? course.name : title,
      start: event.start,
      end: event.end,
      extendedProps: {
        description,
        location,
        courseId: selectedCourseId,
        trainerId: selectedTrainerId,
        eventTypeId: selectedEventType,
        originalStart: event.originalStart || event.start
      },
      // Use event type color if no course is selected, otherwise use course color
      backgroundColor: selectedCourseId ? (course?.color?.bg) : (eventType?.color || '#3B82F6')
    };

    // Add recurrence info if this is a recurring event
    if (isRecurring && recurrenceEndDate) {
      updatedEvent.rrule = {
        freq: 'weekly',
        dtstart: event.start,
        until: recurrenceEndDate + 'T23:59:59Z',
        interval: 1
      };
      
      // Calculate duration for recurring events
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      const duration = endDate - startDate;
      updatedEvent.duration = {
        hours: Math.floor(duration / (1000 * 60 * 60)),
        minutes: Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
      };
    }

    // Validate the event for conflicts and issues
    const { warnings, conflictingEvents } = validateEvent(updatedEvent);
    
    // Show warnings if any found
    if (warnings.length > 0) {
      toast.info(
        <WarningToastContent
          warnings={warnings}
          conflictingEvents={conflictingEvents}
          onProceed={() => {
            toast.dismiss();
            onUpdate(updatedEvent);
          }}
          onCancel={() => {
            toast.dismiss();
          }}
        />,
        { autoClose: false }
      );
      return;
    }
    
    // No warnings, proceed with update
    onUpdate(updatedEvent);
  };

  /**
   * Handles adding a new course
   */
  const handleAddNewCourse = () => {
    if (newCourseName.trim()) {
      // Get the color palette (from localStorage or default)
      const colorPalette = getColorPalette();
      
      // Select color based on number of existing courses
      const color = colorPalette[courses.length % colorPalette.length];
      
      // Create new course object with tags if selected
      const newCourse = { 
        id: Date.now().toString(), 
        name: newCourseName, 
        color,
        tags: selectedTag ? [selectedTag] : []
      };
      
      // Add course
      onAddCourse(newCourse);
      
      // Select the newly added course
      setSelectedCourseId(newCourse.id);
      
      // Reset form
      setShowNewCourseForm(false);
      setNewCourseName('');
      setSelectedTag('');
    }
  };

  /**
   * Handles deletion with confirmation
   */
  const handleDeleteClick = () => {
    confirmDelete(event);
  };

  const handleCancelClick = () => {
    onClose(event);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modern">
        <h2 className="modal-title">{event?.id ? 'עריכת אירוע' : 'אירוע חדש'}</h2>
        
        {/* Event date and time display */}
        <div className="event-datetime-info">
          <div className="event-date">
            {new Date(event.start).toLocaleDateString('he-IL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' ,
              timeZone: 'UTC'
            })}
          </div>
          <div className="event-time">
            {new Date(event.start).toLocaleTimeString('he-IL', { 
              hour: '2-digit', 
              minute: '2-digit' ,
              timeZone: 'UTC'
            })} - {new Date(event.end).toLocaleTimeString('he-IL', { 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'UTC'
            })}
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="event-form">
          {/* Event type selection */}
          <div className="form-group">
            <label>סוג אירוע</label>
            <div className="event-type-selection">
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="form-input"
              >
                {eventTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              <div className="event-type-indicator" style={{ 
                backgroundColor: eventTypes.find(t => t.id === selectedEventType)?.color || '#3B82F6',
                width: '20px',
                height: '20px',
                borderRadius: '4px',
                marginRight: '8px'
              }} />
            </div>
          </div>
          
          {/* Course selection */}
          <div className="form-group">
            <label>קורס</label>
            <div className="course-selection">
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="form-input"
              >
                <option value="">בחר קורס</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                    {course.tags && course.tags.length > 0 && 
                      ` (${course.tags.join(', ')})`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn btn-secondary icon-button"
                onClick={() => setShowNewCourseForm(!showNewCourseForm)}
                title="הוסף קורס חדש"
              >
                +
              </button>
            </div>
          </div>
          
          {/* New course form (conditional) */}
          {showNewCourseForm && (
            <div className="new-course-form">
              <div className="form-group">
                <label>שם הקורס החדש</label>
                <div className="course-input-group">
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    className="form-input"
                    placeholder="הכנס שם קורס"
                  />
                </div>
              </div>
              
              {/* Tag selection for new course */}
              {availableTags.length > 0 && (
                <div className="form-group">
                  <label>תגית (אופציונלי)</label>
                  <select
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className="form-input"
                  >
                    <option value="">בחר תגית</option>
                    {availableTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="course-button-group">
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAddNewCourse}
                >
                  הוסף קורס
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNewCourseForm(false)}
                >
                  ביטול
                </button>
              </div>
            </div>
          )}
          
          {/* Trainer selection */}
          <div className="form-group">
            <label>מאמן</label>
            <select
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
              className="form-input"
            >
              <option value="">בחר מאמן</option>
              {trainers.map(trainer => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Description */}
          <div className="form-group">
            <label>תיאור</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              rows="3"
              placeholder="הוסף תיאור לאירוע"
            />
          </div>
          
          {/* Location */}
          <div className="form-group">
            <label>מיקום</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="form-input"
              placeholder="הכנס מיקום"
            />
          </div>
          
          {/* Recurrence checkbox */}
          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="checkbox-input"
              />
              <span>אירוע חוזר שבועי</span>
            </label>
          </div>
          
          {/* Recurrence end date (conditional) */}
          {isRecurring && (
            <div className="form-group">
              <label>תאריך סיום חזרות</label>
              <input
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                className="form-input"
                min={new Date().toISOString().split('T')[0]} // Prevent past dates
              />
            </div>
          )}
          
          {/* Action buttons */}
            <div className="button-group button-group-inline">
              <button type="submit" className="btn btn-primary">
                {event?.id ? 'עדכן' : 'צור'} אירוע
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancelClick}>
                ביטול
              </button>
              {event?.id && (
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  onClick={handleDeleteClick}
                >
                  מחק
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  export default EventModal;
