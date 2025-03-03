import React, { useState, useEffect } from 'react';
import './Calendar.css';

const EventModal = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete, 
  event,
  courses,
  trainers,
  onAddCourse,
  confirmDelete
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [courseId, setCourseId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseColor, setNewCourseColor] = useState('#4299e1');

  // Format dates for display
  const eventDate = event ? new Date(event.start).toLocaleDateString('he-IL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';
  
  const eventStartTime = event ? new Date(event.start).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';
  
  const eventEndTime = event ? new Date(event.end).toLocaleTimeString('he-IL', {
    hour: '2-digit',
    minute: '2-digit'
  }) : '';

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setDescription(event.extendedProps?.description || '');
      setLocation(event.extendedProps?.location || '');
      setCourseId(event.extendedProps?.courseId || '');
      setTrainerId(event.extendedProps?.trainerId || '');
      setIsRecurring(!!event.rrule);
      setIsAllDay(event.allDay || event.extendedProps?.isAllDay || false);
      
      if (event.rrule?.until) {
        const untilDate = new Date(event.rrule.until);
        setRecurrenceEnd(untilDate.toISOString().split('T')[0]);
      } else if (event.start) {
        // Default recurrence end to 3 months from event start
        const startDate = new Date(event.start);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
        setRecurrenceEnd(endDate.toISOString().split('T')[0]);
      }
    }
  }, [event]);

  if (!isOpen || !event) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clone the original event
    const updatedEvent = { ...event };
    
    // Update properties
    updatedEvent.title = title;
    updatedEvent.allDay = isAllDay;
    updatedEvent.extendedProps = {
      ...updatedEvent.extendedProps,
      description,
      location,
      courseId,
      trainerId,
      isAllDay: isAllDay
    };
    
    // Find selected course to get background color
    const selectedCourse = courses.find(c => c.id === courseId);
    if (selectedCourse && selectedCourse.color && selectedCourse.color.bg) {
      updatedEvent.backgroundColor = selectedCourse.color.bg;
    }
    
    // Handle recurring events
    if (isRecurring) {
      const rruleStart = new Date(event.start);
      const rruleEnd = new Date(recurrenceEnd);
      rruleEnd.setHours(23, 59, 59);
      
      updatedEvent.rrule = {
        freq: 'weekly',
        dtstart: event.start,
        until: rruleEnd.toISOString(),
        interval: 1
      };
      
      // Calculate duration for recurring events
      if (!isAllDay) {
        const startTime = new Date(event.start);
        const endTime = new Date(event.end);
        updatedEvent.duration = {
          hours: Math.floor((endTime - startTime) / (1000 * 60 * 60)),
          minutes: Math.round(((endTime - startTime) % (1000 * 60 * 60)) / (1000 * 60))
        };
      }
    } else {
      // Clear rrule if not recurring
      updatedEvent.rrule = null;
      updatedEvent.duration = null;
    }
    
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
              className="form-input"
              required
              dir="rtl"
            />
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
              <span>אירוע חוזר שבועי</span>
            </label>
          </div>

          {isRecurring && (
            <div className="form-group">
              <label>תאריך סיום חזרות</label>
              <input
                type="date"
                value={recurrenceEnd}
                onChange={(e) => setRecurrenceEnd(e.target.value)}
                className="form-input"
                dir="ltr"
              />
            </div>
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

export default EventModal;
