// EnhancedEventModal.js
import React, { useState, useEffect } from 'react';
import { createEventFromFormData, validateEvent } from '../utils/EventRenderer';
import { renderEvent } from '../utils/EventRenderer';
import { parseICS, generateICS, parseICal, formatToICS } from '../utils/icsUtils';
import '../styles/Calendar.css';
import '../styles/ThemeStyles.css';

const EnhancedEventModal = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete, 
  event,
  courses,
  trainers,
  onAddCourse,
  confirmDelete,
  allEvents
}) => {
  // State for form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [courseId, setCourseId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [eventTypeId, setEventTypeId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseColor, setNewCourseColor] = useState('#4299e1');
  const [formErrors, setFormErrors] = useState({});

  // Format dates for display
  const eventDate = event ? new Date(event.start).toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';
  
  const eventStartTime = event && !isAllDay ? new Date(event.start).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';
  
  const eventEndTime = event && !isAllDay ? new Date(event.end).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

 // Load event types and tags from localStorage
  const [eventTypes, setEventTypes] = useState(() => {
    try {
      const savedEventTypes = localStorage.getItem('eventTypes');
      return savedEventTypes ? JSON.parse(savedEventTypes) : [];
    } catch (e) {
      console.error("Error parsing eventTypes from localStorage:", e);
      return [];
    }
  });

  // Initialize form from event data
  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.extendedProps?.description || '');
      setLocation(event.extendedProps?.location || '');
      setCourseId(event.extendedProps?.courseId || '');
      setTrainerId(event.extendedProps?.trainerId || '');
      setEventTypeId(event.extendedProps?.eventTypeId || '');
      setIsRecurring(!!event.rrule);
      setIsAllDay(event.allDay || event.extendedProps?.isAllDay || false);
      
      if (event.rrule) {
        // Set recurrence frequency
        setRecurrenceFreq(event.rrule.freq || 'weekly');
        
        // Set recurrence interval
        setRecurrenceInterval(event.rrule.interval || 1);
        
        // Set recurrence end date
        if (event.rrule.until) {
          const untilDate = new Date(event.rrule.until);
          setRecurrenceEnd(untilDate.toISOString().split('T')[0]);
        } else if (event.start) {
          // Default recurrence end to 3 months from event start
          const startDate = new Date(event.start);
          const endDate = new Date(startDate);
          endDate.setMonth(endDate.getMonth() + 3);
          setRecurrenceEnd(endDate.toISOString().split('T')[0]);
        }
      } else if (event.start) {
        // Default recurrence end to 3 months from event start for new recurring events
        const startDate = new Date(event.start);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
        setRecurrenceEnd(endDate.toISOString().split('T')[0]);
      }
      
      // Clear any previous form errors
      setFormErrors({});
    }
  }, [event]);
  useEffect(() => {
    try {
      const savedEventTypes = localStorage.getItem('eventTypes');
      if (savedEventTypes) {
        setEventTypes(JSON.parse(savedEventTypes));
      }
      
    } catch (e) {
      console.error("Error loading data from localStorage:", e);
    }
  }, []);

  if (!isOpen || !event) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Create event data from form
    const formData = {
      title,
      description,
      location,
      courseId,
      trainerId,
      eventTypeId,
      isRecurring,
      recurrenceFreq,
      recurrenceInterval,
      recurrenceEnd,
      isAllDay,
      start: event.start,
      end: event.end,
      courses,
      eventTypes
    };
    
    // Validate form data
    const { isValid, errors } = validateEvent(formData, allEvents);
    
    if (!isValid) {
      setFormErrors(errors);
      return;
    }
    
    // Clear any errors
    setFormErrors({});
    
    // Create updated event object
    const updatedEvent = createEventFromFormData(formData, event);
    
    // Send to parent component
    onUpdate(updatedEvent);
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    
    if (newCourseName.trim()) {
      const newCourse = {
        id: `c${Date.now()}`,
        name: newCourseName,
        color: { bg: newCourseColor, text: '#FFFFFF' }
      };
      
      onAddCourse(newCourse);
      setShowNewCourseForm(false);
      setNewCourseName('');
      setCourseId(newCourse.id);
    }
  };

  const handleDeleteClick = () => {
    confirmDelete(event);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modern">
        <h2 className="modal-title">פרטי אירוע</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>כותרת</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`form-input ${formErrors.title ? 'error' : ''}`}
              required
              dir="rtl"
            />
            {formErrors.title && <div className="form-error">{formErrors.title}</div>}
          </div>

          <div className="form-group">
            <label>סוג אירוע</label>
            <select
              value={eventTypeId}
              onChange={(e) => setEventTypeId(e.target.value)}
              className="form-input"
              dir="rtl"
            >
              <option value="">בחר סוג אירוע</option>
              {(eventTypes || []).map(type => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isAllDay}
                onChange={(e) => setIsAllDay(e.target.checked)}
                className="checkbox-input"
              />
              <span>אירוע יום שלם</span>
            </label>
          </div>
          
          {/* Conditionally show time information based on whether it's an all-day event */}
          {!isAllDay && (
            <div className="event-datetime-info">
              <div className="event-date">{eventDate}</div>
              <div className="event-time">{eventStartTime} - {eventEndTime}</div>
            </div>
          )}
          {isAllDay && (
            <div className="event-datetime-info">
              <div className="event-date">{eventDate}</div>
              <div className="event-all-day-label">אירוע יום שלם</div>
            </div>
          )}
          
          <div className="form-group">
            <label>קורס</label>
            <div className="course-selection">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="form-input"
                dir="rtl"
              >
                <option value="">בחר קורס</option>
                {(courses || []).map(course => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setShowNewCourseForm(!showNewCourseForm)}
              >
                {showNewCourseForm ? 'בטל' : 'הוסף קורס חדש'}
              </button>
            </div>
          </div>

          {showNewCourseForm && (
            <div className="new-course-form">
              <h3>הוסף קורס חדש</h3>
              <div className="form-group">
                <label>שם הקורס</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  className="form-input"
                  dir="rtl"
                />
              </div>
              <div className="form-group">
                <label>צבע</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="color"
                    value={newCourseColor}
                    onChange={(e) => setNewCourseColor(e.target.value)}
                    style={{ width: '50px', height: '40px' }}
                  />
                  <div 
                    style={{
                      backgroundColor: newCourseColor,
                      padding: '10px 20px',
                      borderRadius: '4px',
                      color: '#fff',
                      fontWeight: 'bold'
                    }}
                  >
                    {newCourseName || 'צבע הקורס'}
                  </div>
                </div>
              </div>
              <div className="button-group">
                <button 
                  type="button" 
                  onClick={handleAddCourse}
                  className="btn btn-primary"
                >
                  הוסף קורס
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowNewCourseForm(false)}
                  className="btn btn-secondary"
                >
                  ביטול
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>מאמן</label>
            <select
              value={trainerId}
              onChange={(e) => setTrainerId(e.target.value)}
              className="form-input"
              dir="rtl"
            >
              <option value="">בחר מאמן</option>
              {(trainers || []).map(trainer => (
                <option key={trainer.id} value={trainer.id}>
                  {trainer.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>תיאור</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              rows="3"
              dir="rtl"
            />
          </div>

          <div className="form-group">
            <label>מיקום</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="form-input"
              dir="rtl"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="checkbox-input"
              />
              <span>אירוע חוזר</span>
            </label>
          </div>

          {isRecurring && (
            <>
              <div className="form-group">
                <label>תדירות</label>
                <select
                  value={recurrenceFreq}
                  onChange={(e) => setRecurrenceFreq(e.target.value)}
                  className="form-input"
                  dir="rtl"
                >
                  <option value="daily">יומי</option>
                  <option value="weekly">שבועי</option>
                  <option value="monthly">חודשי</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>מרווח ({recurrenceFreq === 'daily' ? 'ימים' : recurrenceFreq === 'weekly' ? 'שבועות' : 'חודשים'})</label>
                <input
                  type="number"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(Math.max(1, parseInt(e.target.value) || 1))}
                  className="form-input"
                  min="1"
                  dir="ltr"
                />
              </div>
              
              <div className="form-group">
                <label>תאריך סיום חזרות</label>
                <input
                  type="date"
                  value={recurrenceEnd}
                  onChange={(e) => setRecurrenceEnd(e.target.value)}
                  className={`form-input ${formErrors.recurrenceEnd ? 'error' : ''}`}
                  dir="ltr"
                />
                {formErrors.recurrenceEnd && <div className="form-error">{formErrors.recurrenceEnd}</div>}
              </div>
            </>
          )}

          <div className="button-group">
            <button type="submit" className="btn btn-primary">
              שמירה
            </button>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              ביטול
            </button>
            <button type="button" onClick={handleDeleteClick} className="btn btn-danger">
              מחיקה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EnhancedEventModal;
