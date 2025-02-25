import React, { useState, useEffect } from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  onDelete, 
  message, 
  selectedEvent,
  courses,
  trainers,
  onAddCourse 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [courseId, setCourseId] = useState('');
  const [trainerId, setTrainerId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceEnd, setRecurrenceEnd] = useState('');
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseColor, setNewCourseColor] = useState('#4299e1');

  useEffect(() => {
    if (selectedEvent) {
      setTitle(selectedEvent.title || '');
      setDescription(selectedEvent.extendedProps?.description || '');
      setLocation(selectedEvent.extendedProps?.location || '');
      setCourseId(selectedEvent.extendedProps?.courseId || '');
      setTrainerId(selectedEvent.extendedProps?.trainerId || '');
      setIsRecurring(!!selectedEvent.rrule);
      setRecurrenceEnd(selectedEvent.rrule?.until || '');
    }
  }, [selectedEvent]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const eventData = {
      id: selectedEvent.id,
      title,
      description,
      location,
      courseId,
      trainerId
    };

    if (isRecurring) {
      eventData.rrule = {
        freq: 'weekly',
        dtstart: selectedEvent.start,
        until: recurrenceEnd
      };
    }

    onUpdate(eventData);
  };

  const handleAddCourse = (e) => {
    e.preventDefault();
    onAddCourse({
      name: newCourseName,
      color: newCourseColor
    });
    setShowNewCourseForm(false);
    setNewCourseName('');
    setNewCourseColor('#4299e1');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">פרטי אירוע</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>קורס</label>
            <div className="course-selection">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="form-input"
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
                onClick={() => setShowNewCourseForm(true)}
              >
                הוסף קורס חדש
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
                />
              </div>
              <div className="form-group">
                <label>צבע</label>
                <input
                  type="color"
                  value={newCourseColor}
                  onChange={(e) => setNewCourseColor(e.target.value)}
                  className="form-input"
                />
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
            <label>כותרת</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>תיאור</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-input"
              rows="3"
            />
          </div>

          <div className="form-group">
            <label>מיקום</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
              />
              אירוע חוזר שבועי
            </label>
          </div>

          {isRecurring && (
            <div className="form-group">
              <label>תאריך סיום חזרות</label>
              <input
                type="date"
                value={recurrenceEnd.split('T')[0]}
                onChange={(e) => setRecurrenceEnd(`${e.target.value}T${selectedEvent.start.split('T')[1]}`)}
                className="form-input"
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
            <button type="button" onClick={onDelete} className="btn btn-danger">
              מחיקה
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmationModal;
