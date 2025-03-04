// EventRenderer.js - Component for rendering calendar events

// For regular time-bound events
export const renderEventContent = (eventInfo, trainers, courses, eventTypes) => {
  const event = eventInfo.event;
  const isCancelled = event.extendedProps?.isCancelled;
  const isException = event.extendedProps?.isException;
  const isAllDay = event.allDay || event.extendedProps?.isAllDay;
  const trainer = trainers.find(t => t.id === event.extendedProps?.trainerId);
  const eventType = event.extendedProps?.eventTypeId ? 
    eventTypes.find(type => type.id === event.extendedProps.eventTypeId) : null;
  
  // Find course to get tags
  const course = event.extendedProps?.courseId ? 
    courses.find(c => c.id === event.extendedProps.courseId) : null;
  
  const fullTitle = event.title;
  const displayTitle = fullTitle.length > 15 ? fullTitle.substring(0,15) + '...' : fullTitle;
  
  // Get icon from event type or use default
  const icon = eventType?.icon || event.extendedProps?.icon || '📅';
  
  // If it's an all-day event, use a more compact display
  if (isAllDay) {
    return (
      <div className={`event-content all-day-event ${isException ? 'exception' : ''} ${isCancelled ? 'cancelled' : ''}`}
        style={{ fontSize: '0.8em' }}
        title={fullTitle}
      >
        <div className="event-title">
          <span className="event-icon">{icon}</span>
          {isException && !isCancelled && <span className="exception-indicator">⚡</span>}
          {isCancelled && <span className="cancelled-indicator">🚫</span>}
          <span className="event-title-text">{displayTitle}</span>
        </div>
      </div>
    );
  }
  
  // For regular time-bound events
  return (
    <div className={`event-content ${isException ? 'exception' : ''} ${isCancelled ? 'cancelled' : ''}`}
      style={{ fontSize: '0.8em' }}
      title={fullTitle}
    >
      <div className="event-title">
        <span className="event-icon">{icon}</span>
        {isException && !isCancelled && <span className="exception-indicator">⚡</span>}
        {isCancelled && <span className="cancelled-indicator">🚫</span>}
        <span className="event-title-text">{displayTitle}</span>
      </div>
      
      {trainer && <div className="event-trainer">מאמן: {trainer.name}</div>}
      
      {course && course.tags && course.tags.length > 0 && (
        <div className="event-tags">
          {Array.isArray(course.tags) && course.tags.map(tag => {
            // Handle tags that are objects or strings
            const tagName = typeof tag === 'object' ? tag.name : tag;
            const tagColor = typeof tag === 'object' && tag.color ? tag.color : null;
            
            return (
              <span 
                key={typeof tag === 'object' ? tag.id : tag} 
                className="event-tag"
                style={tagColor ? { backgroundColor: tagColor } : {}}
              >
                {tagName}
              </span>
            );
          })}
        </div>
      )}
      
      {event.extendedProps?.location && !isCancelled && (
        <div className="event-location">📍 {event.extendedProps.location}</div>
      )}
    </div>
  );
};

// Create a formatted event object from form data
export const createEventFromFormData = (formData, existingEvent = null) => {
  // Start with existing event data or create new
  const event = existingEvent ? { ...existingEvent } : {
    id: `event-${Date.now()}`,
    extendedProps: {}
  };
  
  // Apply form data
  event.title = formData.title || 'אירוע חדש';
  event.allDay = formData.isAllDay || false;
  
  // Update start and end times
  if (formData.start) {
    event.start = formData.start;
  }
  
  if (formData.end) {
    event.end = formData.end;
  }
  
  // Extended properties
  event.extendedProps = {
    ...event.extendedProps,
    description: formData.description || '',
    location: formData.location || '',
    courseId: formData.courseId || '',
    trainerId: formData.trainerId || '',
    eventTypeId: formData.eventTypeId || '',
    isAllDay: formData.isAllDay || false
  };
  
  // Set background color based on event type or course
  if (formData.eventTypeId && formData.eventTypes) {
    const eventType = formData.eventTypes.find(type => type.id === formData.eventTypeId);
    if (eventType && eventType.color) {
      event.backgroundColor = eventType.color;
    }
  } else if (formData.courseId && formData.courses) {
    const course = formData.courses.find(c => c.id === formData.courseId);
    if (course && course.color && course.color.bg) {
      event.backgroundColor = course.color.bg;
    }
  }
  
  // Handle recurring events
  if (formData.isRecurring) {
    const rruleStart = new Date(event.start);
    const rruleEnd = new Date(formData.recurrenceEnd);
    rruleEnd.setHours(23, 59, 59);
    
    event.rrule = {
      freq: formData.recurrenceFreq || 'weekly',
      dtstart: event.start,
      until: rruleEnd.toISOString(),
      interval: formData.recurrenceInterval || 1
    };
    
    // Calculate duration for recurring events
    if (!formData.isAllDay) {
      const startTime = new Date(event.start);
      const endTime = new Date(event.end);
      event.duration = {
        hours: Math.floor((endTime - startTime) / (1000 * 60 * 60)),
        minutes: Math.round(((endTime - startTime) % (1000 * 60 * 60)) / (1000 * 60))
      };
    }
  } else {
    // Clear rrule if not recurring
    event.rrule = null;
    event.duration = null;
  }
  
  return event;
};

// Validate event data with enhanced checks
export const validateEvent = (eventData, existingEvents = [], options = {}) => {
  const { 
    enforceOneHourRule = true, 
    checkScheduleConflicts = true,
    minimumTimeGap = 12, 
    skipAllDayEvents = true 
  } = options;
  
  const errors = {};
  const warnings = [];
  const conflictingEvents = [];
  
  // Skip extended validation for all-day events if option is set
  const isAllDay = eventData.allDay || eventData.extendedProps?.isAllDay;
  const skipExtendedValidation = skipAllDayEvents && isAllDay;
  
  // --------------- Basic validations ---------------
  if (!eventData.title || eventData.title.trim() === '') {
    errors.title = 'שם האירוע הוא שדה חובה';
  }
  
  if (!eventData.start) {
    errors.start = 'תאריך ושעת התחלה הם שדות חובה';
  }
  
  if (!eventData.end) {
    errors.end = 'תאריך ושעת סיום הם שדות חובה';
  }
  
  // Check that end time is after start time
  if (eventData.start && eventData.end) {
    const start = new Date(eventData.start);
    const end = new Date(eventData.end);
    
    if (end <= start) {
      errors.end = 'שעת הסיום חייבת להיות אחרי שעת ההתחלה';
    }
    
    // Check meeting duration (one hour rule)
    if (!skipExtendedValidation && enforceOneHourRule) {
      const meetingDuration = (end - start) / (1000 * 60);
      if (meetingDuration !== 60) {
        warnings.push("SingleMeetingTime");
      }
    }
  }
  
  // For recurring events, validate recurrence end date
  if (eventData.isRecurring) {
    if (!eventData.recurrenceEnd) {
      errors.recurrenceEnd = 'תאריך סיום החזרות הוא שדה חובה';
    } else {
      const start = new Date(eventData.start);
      const recurrenceEnd = new Date(eventData.recurrenceEnd);
      
      if (recurrenceEnd <= start) {
        errors.recurrenceEnd = 'תאריך סיום החזרות חייב להיות אחרי תאריך ההתחלה';
      }
    }
  }
  
  // --------------- Schedule conflict validations ---------------
  if (!skipExtendedValidation && checkScheduleConflicts && existingEvents.length > 0) {
    const eventId = eventData.id;
    const start = new Date(eventData.start);
    const end = new Date(eventData.end);
    const trainerId = eventData.extendedProps?.trainerId;
    const title = eventData.title;
    
    // Helper function to check time gap between two events
    const checkTimeGap = (eventA, eventB) => {
      const eventAStart = new Date(eventA.start);
      const eventAEnd = new Date(eventA.end);
      const eventBStart = new Date(eventB.start);
      const eventBEnd = new Date(eventB.end);
      
      // If events overlap, gap is 0
      if (eventAStart < eventBEnd && eventBStart < eventAEnd) {
        return 0;
      }
      
      // Otherwise calculate the gap in hours
      return Math.min(
        Math.abs(eventAEnd - eventBStart) / (1000 * 60 * 60),
        Math.abs(eventBEnd - eventAStart) / (1000 * 60 * 60)
      );
    };
    
    existingEvents.forEach(ev => {
      // Skip the current event being validated
      if (ev.id === eventId) return;
      
      // Skip all-day events for conflict checking if option is set
      if (skipAllDayEvents && (ev.allDay || ev.extendedProps?.isAllDay)) return;
      
      const evStart = new Date(ev.start);
      const evEnd = new Date(ev.end);
      const evTrainerId = ev.extendedProps?.trainerId;
      
      // Check for regular events
      if (!ev.rrule) {
        // Check for time overlap with the same trainer
        if (start < evEnd && evStart < end && evTrainerId === trainerId) {
          warnings.push("ScheduleAvailability");
          conflictingEvents.push(ev);
        }
        
        // Check for minimum time gap between events with same title and same trainer
        else if (
          ev.title === title && 
          evTrainerId === trainerId
        ) {
          const hoursBetween = checkTimeGap(
            {start, end}, 
            {start: evStart, end: evEnd}
          );
          
          if (hoursBetween < minimumTimeGap) {
            warnings.push("MinimumTimeGap");
            if (!conflictingEvents.includes(ev)) {
              conflictingEvents.push(ev);
            }
          }
        }
      }
      // Check for recurring events
      else if (ev.rrule) {
        // We need to check future occurrences of weekly events
        const freq = ev.rrule.freq;
        const interval = ev.rrule.interval || 1;
        const untilDate = ev.rrule.until ? new Date(ev.rrule.until) : null;
        
        // Only process if it's a weekly recurring event
        if (freq === 'weekly') {
          // Calculate the number of weeks to check (up to 52 weeks/1 year)
          const maxWeeks = 52;
          const startDate = new Date(ev.rrule.dtstart || ev.start);
          
          // Generate occurrences for this weekly event
          for (let i = 0; i < maxWeeks; i += interval) {
            const occurrenceStart = new Date(startDate);
            occurrenceStart.setDate(occurrenceStart.getDate() + (i * 7));
            
            // Stop if we've passed the until date
            if (untilDate && occurrenceStart > untilDate) {
              break;
            }
            
            // Create an occurrence end time
            const occurrenceEnd = new Date(occurrenceStart);
            const duration = ev.duration || { hours: 1, minutes: 0 };
            occurrenceEnd.setHours(
              occurrenceStart.getHours() + (duration.hours || 0),
              occurrenceStart.getMinutes() + (duration.minutes || 0)
            );
            
            // Check for time overlap with the same trainer
            if (
              start < occurrenceEnd && 
              occurrenceStart < end && 
              evTrainerId === trainerId
            ) {
              warnings.push("ScheduleAvailability");
              
              // Create a special recurring event occurrence for display
              const occurrenceEvent = {
                ...ev,
                start: occurrenceStart.toISOString(),
                end: occurrenceEnd.toISOString(),
                title: `${ev.title} (חזרה)`
              };
              
              conflictingEvents.push(occurrenceEvent);
            }
            
            // Check for minimum time gap between events with same title and same trainer
            else if (
              ev.title === title && 
              evTrainerId === trainerId
            ) {
              const hoursBetween = checkTimeGap(
                {start, end}, 
                {start: occurrenceStart, end: occurrenceEnd}
              );
              
              if (hoursBetween < minimumTimeGap) {
                warnings.push("MinimumTimeGap");
                
                // Create a special recurring event occurrence for display
                const occurrenceEvent = {
                  ...ev,
                  start: occurrenceStart.toISOString(),
                  end: occurrenceEnd.toISOString(),
                  title: `${ev.title} (חזרה)`
                };
                
                if (!conflictingEvents.some(e => 
                  e.start === occurrenceEvent.start && 
                  e.end === occurrenceEvent.end
                )) {
                  conflictingEvents.push(occurrenceEvent);
                }
              }
            }
          }
        }
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    warnings,
    conflictingEvents,
    hasWarnings: warnings.length > 0
  };
};
