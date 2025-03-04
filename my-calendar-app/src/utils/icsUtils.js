// icsUtils.js - Utilities for ICS file import and export

/**
 * Parse an iCalendar file and convert to app event format
 * @param {string} icsContent - The content of the ICS file
 * @param {Array} courses - Available courses in the system
 * @param {Array} trainers - Available trainers in the system
 * @returns {Array} - Array of events in the application format
 */
export const parseICal = (icsContent, courses, trainers) => {
  const events = [];
  
  // Split the content into lines and normalize line endings
  const lines = icsContent.replace(/\r\n/g, '\n').split('\n');
  
  let currentEvent = null;
  let inEvent = false;
  
  // Process each line of the ICS file
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle line continuations (lines starting with space or tab)
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (i > 0) {
        // Append this continuation to the previous line
        lines[i-1] += line.trim();
        continue;
      }
    }
    
    // Start of an event
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      currentEvent = {
        extendedProps: {}
      };
      continue;
    }
    
    // End of an event
    if (line === 'END:VEVENT') {
      if (currentEvent && currentEvent.start) {
        // Prepare the end date if not present
        if (!currentEvent.end && currentEvent.duration) {
          const startDate = new Date(currentEvent.start);
          currentEvent.end = new Date(
            startDate.getTime() + parseDuration(currentEvent.duration)
          ).toISOString();
          delete currentEvent.duration; // Remove duration after calculating end time
        } else if (!currentEvent.end) {
          // Default to 1 hour if no end or duration
          const startDate = new Date(currentEvent.start);
          currentEvent.end = new Date(
            startDate.getTime() + 60 * 60 * 1000
          ).toISOString();
        }
        
        // Set default values if missing
        if (!currentEvent.title) {
          currentEvent.title = 'Event';
        }
        
        // Generate an ID if missing
        if (!currentEvent.id) {
          currentEvent.id = `import-${Date.now()}-${events.length}`;
        }
        
        // Try to match with a course
        if (!currentEvent.extendedProps.courseId && courses && courses.length > 0) {
          const matchedCourse = findMatchingCourse(currentEvent.title, courses);
          if (matchedCourse) {
            currentEvent.extendedProps.courseId = matchedCourse.id;
            currentEvent.backgroundColor = matchedCourse.color?.bg;
          }
        }
        
        // Try to match with a trainer
        if (!currentEvent.extendedProps.trainerId && trainers && trainers.length > 0) {
          const matchedTrainer = findMatchingTrainer(
            currentEvent.description || currentEvent.title, 
            trainers
          );
          if (matchedTrainer) {
            currentEvent.extendedProps.trainerId = matchedTrainer.id;
          }
        }
        
        events.push(currentEvent);
      }
      
      inEvent = false;
      currentEvent = null;
      continue;
    }
    
    // Skip if not in an event
    if (!inEvent || !currentEvent) {
      continue;
    }
    
    // Parse event properties
    const [key, ...values] = line.split(':');
    const value = values.join(':');
    
    // Parse key and parameters
    let propertyName = key;
    const parameters = {};
    
    if (key.includes(';')) {
      const parts = key.split(';');
      propertyName = parts[0];
      
      // Parse parameters (e.g., DTSTART;VALUE=DATE:20220101)
      for (let i = 1; i < parts.length; i++) {
        const paramParts = parts[i].split('=');
        if (paramParts.length === 2) {
          parameters[paramParts[0].toLowerCase()] = paramParts[1];
        }
      }
    }
    
    // Process based on property name
    switch (propertyName) {
      case 'UID':
        currentEvent.extendedProps.uid = value;
        break;
        
      case 'SUMMARY':
        currentEvent.title = decodeValue(value);
        break;
        
      case 'DESCRIPTION':
        currentEvent.extendedProps.description = decodeValue(value);
        break;
        
      case 'LOCATION':
        currentEvent.extendedProps.location = decodeValue(value);
        break;
        
      case 'DTSTART':
        if (parameters.value === 'DATE') {
          // All-day event (date without time)
          currentEvent.start = parseIcalDate(value, true);
          currentEvent.allDay = true;
          currentEvent.extendedProps.isAllDay = true;
        } else {
          // Event with time
          currentEvent.start = parseIcalDate(value);
        }
        break;
        
      case 'DTEND':
        if (parameters.value === 'DATE') {
          // All-day event end (exclusive date)
          const endDate = parseIcalDate(value, true);
          // For all-day events, the end date is exclusive, so subtract one day
          const date = new Date(endDate);
          date.setDate(date.getDate() - 1);
          currentEvent.end = date.toISOString();
        } else {
          // Regular event end
          currentEvent.end = parseIcalDate(value);
        }
        break;
        
      case 'DURATION':
        currentEvent.duration = value;
        break;
        
      case 'RRULE':
        try {
          currentEvent.rrule = parseRRule(value, currentEvent.start);
        } catch (e) {
          console.error('Error parsing RRULE:', e);
        }
        break;
        
      case 'CATEGORIES':
        const categories = value.split(',').map(cat => cat.trim());
        if (categories.length > 0) {
          currentEvent.extendedProps.categories = categories;
        }
        break;
        
      case 'X-APPLE-CALENDAR-COLOR':
      case 'COLOR':
        currentEvent.backgroundColor = value;
        break;
        
      default:
        // Store any other properties in extendedProps
        if (propertyName.startsWith('X-')) {
          const propName = propertyName.substring(2).toLowerCase();
          currentEvent.extendedProps[propName] = value;
        }
        break;
    }
  }
  
  return events;
};

/**
 * Format events from the application to iCalendar format
 * @param {Array} events - Events from the application
 * @param {Array} courses - Available courses in the system
 * @param {Array} trainers - Available trainers in the system
 * @returns {string} - ICS file content
 */
export const formatToICS = (events, courses, trainers) => {
  // Start building ICS file
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Academic Calendar//Course Schedule//HE',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Academic Calendar'
  ];
  
  // Add each event
  events.forEach(event => {
    const eventLines = [
      'BEGIN:VEVENT',
      `UID:${event.extendedProps?.uid || event.id}@academiccalendar.com`,
      `DTSTAMP:${formatIcalDate(new Date().toISOString())}`
    ];
    
    // Get course and trainer info for description
    const course = event.extendedProps?.courseId ? 
      courses.find(c => c.id === event.extendedProps.courseId) : null;
    
    const trainer = event.extendedProps?.trainerId ? 
      trainers.find(t => t.id === event.extendedProps.trainerId) : null;
    
    // Handle all-day events differently
    if (event.allDay || event.extendedProps?.isAllDay) {
      // All-day events use DATE format without time
      const startDate = new Date(event.start);
      
      // Format as YYYYMMDD for all-day events (no time component)
      eventLines.push(`DTSTART;VALUE=DATE:${formatIcalDate(startDate, true)}`);
      
      // For all-day events, iCal expects end date to be exclusive (the day after)
      if (event.end) {
        const endDate = new Date(event.end);
        endDate.setDate(endDate.getDate() + 1);
        eventLines.push(`DTEND;VALUE=DATE:${formatIcalDate(endDate, true)}`);
      } else {
        // If no end date, assume same day (add 1 day to make it exclusive)
        const defaultEnd = new Date(startDate);
        defaultEnd.setDate(defaultEnd.getDate() + 1);
        eventLines.push(`DTEND;VALUE=DATE:${formatIcalDate(defaultEnd, true)}`);
      }
    } else {
      // Regular events with specific times
      eventLines.push(`DTSTART:${formatIcalDate(event.start)}`);
      
      // Add end time for non-recurring events
      if (!event.rrule) {
        eventLines.push(`DTEND:${formatIcalDate(event.end)}`);
      }
      
      // Add recurrence rule for recurring events
      if (event.rrule) {
        const rruleStr = formatRRule(event.rrule);
        if (rruleStr) {
          eventLines.push(rruleStr);
        }
        
        // Add duration for recurring events
        if (event.duration) {
          const duration = formatDuration(event.duration);
          if (duration) {
            eventLines.push(`DURATION:${duration}`);
          }
        } else if (event.start && event.end) {
          // Calculate duration from start and end
          const start = new Date(event.start);
          const end = new Date(event.end);
          const durationMs = end.getTime() - start.getTime();
          const hours = Math.floor(durationMs / (1000 * 60 * 60));
          const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
          
          if (hours > 0 || minutes > 0) {
            eventLines.push(`DURATION:PT${hours}H${minutes}M`);
          }
        }
      }
    }
    
    // Add event summary (title)
    eventLines.push(`SUMMARY:${encodeValue(event.title)}`);
    
    // Add description with course and trainer info
    let description = event.extendedProps?.description || '';
    
    if (course || trainer) {
      const details = [];
      
      if (course) {
        details.push(`Course: ${course.name}`);
      }
      
      if (trainer) {
        details.push(`Trainer: ${trainer.name}`);
      }
      
      if (details.length > 0) {
        description = details.join('\\n') + (description ? '\\n\\n' + description : '');
      }
    }
    
    if (description) {
      eventLines.push(`DESCRIPTION:${encodeValue(description)}`);
    }
    
    // Add location
    if (event.extendedProps?.location) {
      eventLines.push(`LOCATION:${encodeValue(event.extendedProps.location)}`);
    }

    // Add color
    if (event.backgroundColor) {
      eventLines.push(`X-APPLE-CALENDAR-COLOR:${event.backgroundColor}`);
    }
    
    // Add categories for tags
    if (course && course.tags && course.tags.length > 0) {
      eventLines.push(`CATEGORIES:${course.tags.join(',')}`);
    }
    
    // Close event
    eventLines.push('END:VEVENT');
    
    // Add to calendar content
    icsContent = [...icsContent, ...eventLines];
  });
  
  // Close calendar
  icsContent.push('END:VCALENDAR');
  
  // Join all lines with proper line endings (CRLF)
  return icsContent.join('\r\n');
};

/**
 * Parse an iCalendar date string to ISO format
 * @param {string} icalDate - Date in iCalendar format (e.g., 20220101T120000Z)
 * @param {boolean} isAllDay - Whether this is an all-day event date (no time component)
 * @returns {string} - Date in ISO format
 */
const parseIcalDate = (icalDate, isAllDay = false) => {
  if (isAllDay) {
    // Format: YYYYMMDD
    const year = icalDate.substring(0, 4);
    const month = icalDate.substring(4, 6);
    const day = icalDate.substring(6, 8);
    
    return `${year}-${month}-${day}T00:00:00Z`;
  } else {
    // Format: YYYYMMDDTHHMMSSZ or YYYYMMDDTHHMMSS
    let dateStr = icalDate;
    
    // If there's no 'Z' at the end, assume UTC
    if (!dateStr.endsWith('Z')) {
      dateStr += 'Z';
    }
    
    // Parse the components
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    const hour = dateStr.substring(9, 11);
    const minute = dateStr.substring(11, 13);
    const second = dateStr.substring(13, 15);
    
    return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
  }
};

/**
 * Format a date to iCalendar format
 * @param {string|Date} date - Date in ISO format or Date object
 * @param {boolean} isAllDay - Whether this is an all-day event date (no time component)
 * @returns {string} - Date in iCalendar format
 */
const formatIcalDate = (date, isAllDay = false) => {
  // Ensure we have a Date object
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Get UTC components
  const year = dateObj.getUTCFullYear().toString().padStart(4, '0');
  const month = (dateObj.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = dateObj.getUTCDate().toString().padStart(2, '0');
  
  if (isAllDay) {
    // All-day events just need the date part
    return `${year}${month}${day}`;
  } else {
    // Regular events need date and time
    const hours = dateObj.getUTCHours().toString().padStart(2, '0');
    const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getUTCSeconds().toString().padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }
};

/**
 * Parse a RRULE string into an object format
 * @param {string} rruleString - RRULE string from iCalendar
 * @param {string} startDate - Event start date in ISO format
 * @returns {object} - RRULE object
 */
const parseRRule = (rruleString, startDate) => {
  const parts = rruleString.split(';');
  const rrule = {
    dtstart: startDate,
    interval: 1 // Default interval
  };
  
  parts.forEach(part => {
    const [key, value] = part.split('=');
    
    switch (key) {
      case 'FREQ':
        rrule.freq = value.toLowerCase();
        break;
        
      case 'UNTIL':
        rrule.until = parseIcalDate(value, value.length === 8);
        break;
        
      case 'INTERVAL':
        rrule.interval = parseInt(value, 10);
        break;
        
      case 'COUNT':
        rrule.count = parseInt(value, 10);
        break;
        
      case 'BYDAY':
        rrule.byDay = value.split(',');
        break;
        
      case 'BYMONTH':
        rrule.byMonth = value.split(',').map(v => parseInt(v, 10));
        break;
        
      case 'BYMONTHDAY':
        rrule.byMonthDay = value.split(',').map(v => parseInt(v, 10));
        break;
    }
  });
  
  // Default until date if not provided (3 months from start)
  if (!rrule.until && !rrule.count) {
    const untilDate = new Date(startDate);
    untilDate.setMonth(untilDate.getMonth() + 3);
    rrule.until = untilDate.toISOString();
  }
  
  return rrule;
};

/**
 * Format a RRULE object to iCalendar format
 * @param {object} rrule - RRULE object
 * @returns {string} - RRULE string
 */
const formatRRule = (rrule) => {
  if (!rrule || !rrule.freq) return '';
  
  const parts = [`RRULE:FREQ=${rrule.freq.toUpperCase()}`];
  
  if (rrule.until) {
    // Determine if the until date is an all-day date
    const isAllDay = rrule.until.endsWith('T00:00:00Z');
    parts.push(`UNTIL=${formatIcalDate(rrule.until, isAllDay)}`);
  }
  
  if (rrule.count) {
    parts.push(`COUNT=${rrule.count}`);
  }
  
  if (rrule.interval && rrule.interval !== 1) {
    parts.push(`INTERVAL=${rrule.interval}`);
  }
  
  if (rrule.byDay && rrule.byDay.length > 0) {
    parts.push(`BYDAY=${rrule.byDay.join(',')}`);
  }
  
  if (rrule.byMonth && rrule.byMonth.length > 0) {
    parts.push(`BYMONTH=${rrule.byMonth.join(',')}`);
  }
  
  if (rrule.byMonthDay && rrule.byMonthDay.length > 0) {
    parts.push(`BYMONTHDAY=${rrule.byMonthDay.join(',')}`);
  }
  
  return parts.join(';');
};

/**
 * Parse a duration string from iCalendar format
 * @param {string} durationStr - Duration string (e.g., PT1H30M)
 * @returns {number} - Duration in milliseconds
 */
const parseDuration = (durationStr) => {
  let totalMs = 0;
  
  // Remove PT prefix
  const duration = durationStr.substring(2);
  
  // Extract hours
  const hoursMatch = duration.match(/(\d+)H/);
  if (hoursMatch) {
    totalMs += parseInt(hoursMatch[1], 10) * 60 * 60 * 1000;
  }
  
  // Extract minutes
  const minutesMatch = duration.match(/(\d+)M/);
  if (minutesMatch) {
    totalMs += parseInt(minutesMatch[1], 10) * 60 * 1000;
  }
  
  // Extract seconds
  const secondsMatch = duration.match(/(\d+)S/);
  if (secondsMatch) {
    totalMs += parseInt(secondsMatch[1], 10) * 1000;
  }
  
  return totalMs;
};

/**
 * Format a duration object to iCalendar format
 * @param {object} duration - Duration object with hours and minutes
 * @returns {string} - Duration in iCalendar format
 */
const formatDuration = (duration) => {
  if (!duration) return '';
  
  let result = 'PT';
  
  if (duration.hours && duration.hours > 0) {
    result += `${duration.hours}H`;
  }
  
  if (duration.minutes && duration.minutes > 0) {
    result += `${duration.minutes}M`;
  }
  
  if (result === 'PT') {
    // No valid duration components
    return '';
  }
  
  return result;
};

/**
 * Encode special characters for iCalendar
 * @param {string} value - Value to encode
 * @returns {string} - Encoded value
 */
const encodeValue = (value) => {
  if (!value) return '';
  
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
};

/**
 * Decode special characters from iCalendar
 * @param {string} value - Value to decode
 * @returns {string} - Decoded value
 */
const decodeValue = (value) => {
  if (!value) return '';
  
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
};

/**
 * Try to find a matching course based on event title
 * @param {string} title - Event title
 * @param {Array} courses - Available courses
 * @returns {object|null} - Matched course or null
 */
const findMatchingCourse = (title, courses) => {
  if (!title || !courses || courses.length === 0) return null;
  
  // First try exact match with course name
  const exactMatch = courses.find(course => 
    title.toLowerCase() === course.name.toLowerCase()
  );
  
  if (exactMatch) return exactMatch;
  
  // Then try partial match (if course name is in the title)
  const partialMatch = courses.find(course => 
    title.toLowerCase().includes(course.name.toLowerCase())
  );
  
  return partialMatch || null;
};

/**
 * Try to find a matching trainer based on event description or title
 * @param {string} text - Event description or title
 * @param {Array} trainers - Available trainers
 * @returns {object|null} - Matched trainer or null
 */
const findMatchingTrainer = (text, trainers) => {
  if (!text || !trainers || trainers.length === 0) return null;
  
  for (const trainer of trainers) {
    const regex = new RegExp(`\\b${trainer.name}\\b`, 'i');
    if (regex.test(text)) {
      return trainer;
    }
  }
  
  return null;
};
