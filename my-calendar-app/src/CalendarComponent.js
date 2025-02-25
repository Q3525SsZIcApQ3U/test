import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Calendar.css';
import SettingsComponent from './SettingsComponent';
import EventModal from './EventModal';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Default Color palette for courses (will use custom palette from localStorage if available)
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
    </ul>
    <div className="warning-toast-buttons">
      <button onClick={onProceed} className="btn btn-primary">המשך</button>
      <button onClick={onCancel} className="btn btn-secondary">ביטול</button>
    </div>
  </div>
);

const DeleteConfirmationToast = ({ event, onConfirm, onCancel }) => (
  <div className="delete-confirmation" style={{ fontSize: '0.9em', direction: 'rtl' }}>
    <h4>האם למחוק את האירוע?</h4>
    <p><strong>{event.title}</strong>: {new Date(event.start).toLocaleString('he-IL')}</p>
    {event.rrule && <p>זהו אירוע חוזר. מחיקה תסיר את כל המופעים העתידיים.</p>}
    <div className="delete-confirmation-buttons">
      <button onClick={onConfirm} className="btn btn-danger">מחק</button>
      <button onClick={onCancel} className="btn btn-secondary">ביטול</button>
    </div>
  </div>
);

/* -------------------------- Main Calendar Component -------------------------- */
const CalendarComponent = () => {
  // State for UI options
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // State for data
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState('');
  const [events, setEvents] = useState([]);
  const [calendarSettings, setCalendarSettings] = useState({
    slotMinTime: "07:00:00",
    slotMaxTime: "22:00:00"
  });
  
  // Refs
  const calendarRef = useRef(null);
  const highlightedEventRef = useRef(null);
  
  // Persist dark mode
  useEffect(() => {
    localStorage.setItem('darkMode', isDarkMode);
    
    // Apply dark mode to document body for consistent styling
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // Load data from localStorage on mount
  useEffect(() => {
    // Load courses from localStorage
    const savedCourses = localStorage.getItem('courses');
    if (savedCourses) {
      setCourses(JSON.parse(savedCourses));
    }
    
    // Load trainers from localStorage
    const savedTrainers = localStorage.getItem('trainers');
    if (savedTrainers) {
      setTrainers(JSON.parse(savedTrainers));
    }
    
    // Load work hours from localStorage
    const savedWorkHours = localStorage.getItem('workHours');
    if (savedWorkHours) {
      const parsedWorkHours = JSON.parse(savedWorkHours);
      setCalendarSettings({
        slotMinTime: parsedWorkHours.startTime,
        slotMaxTime: parsedWorkHours.endTime
      });
    }
  }, []);

  // Fetch courses if not in localStorage
  useEffect(() => {
    if (courses.length === 0) {
      const fetchCourses = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/courses`);
          const fetchedCourses = response.data;
          setCourses(fetchedCourses);
          localStorage.setItem('courses', JSON.stringify(fetchedCourses));
        } catch (error) {
          console.error("Error fetching courses:", error);
          
          // Use default courses if API fails
          const defaultCourses = [
            { id: '1', name: 'מתמטיקה', color: DEFAULT_COLOR_PALETTE[0], tags: [] },
            { id: '2', name: 'פיזיקה', color: DEFAULT_COLOR_PALETTE[1], tags: [] }
          ];
          setCourses(defaultCourses);
          localStorage.setItem('courses', JSON.stringify(defaultCourses));
        }
      };
      fetchCourses();
    }
  }, [courses.length]);

  // Fetch trainers if not in localStorage
  useEffect(() => {
    if (trainers.length === 0) {
      const fetchTrainers = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/trainers`);
          const fetchedTrainers = response.data;
          setTrainers(fetchedTrainers);
          localStorage.setItem('trainers', JSON.stringify(fetchedTrainers));
        } catch (error) {
          console.error("Error fetching trainers:", error);
          
          // Use default trainers if API fails
          const defaultTrainers = [
            { id: 't1', name: 'אדם' },
            { id: 't2', name: 'שרה' }
          ];
          setTrainers(defaultTrainers);
          localStorage.setItem('trainers', JSON.stringify(defaultTrainers));
        }
      };
      fetchTrainers();
    }
  }, [trainers.length]);

  // Fetch work hours if not in localStorage
  useEffect(() => {
    const fetchWorkHours = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/settings/workhours`);
        const workHoursData = {
          startTime: response.data.startTime,
          endTime: response.data.endTime
        };
        setCalendarSettings(workHoursData);
        localStorage.setItem('workHours', JSON.stringify(workHoursData));
      } catch (error) {
        console.error("Error fetching work hours:", error);
      }
    };
    
    if (!localStorage.getItem('workHours')) {
      fetchWorkHours();
    }
  }, []);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/events`);
        
        // Process event data from API
        const formattedEvents = response.data.map(event => {
          // Parse JSON strings to objects
          const parsedExtendedProps = typeof event.extendedProps === 'string'
            ? JSON.parse(event.extendedProps)
            : event.extendedProps || {};
            
          const parsedRrule = typeof event.rrule === 'string'
            ? JSON.parse(event.rrule)
            : event.rrule;
            
          const parsedDuration = typeof event.duration === 'string'
            ? JSON.parse(event.duration)
            : event.duration;
          
          // Get course color if available
          const courseId = parsedExtendedProps?.courseId;
          const course = courseId ? courses.find(c => c.id === courseId) : null;
          
          // Return formatted event
          return {
            ...event,
            extendedProps: parsedExtendedProps,
            rrule: parsedRrule,
            duration: parsedDuration,
            start: new Date(event.start).toISOString(),
            end: new Date(event.end).toISOString(),
            backgroundColor: course?.color?.bg || event.backgroundColor || '#3788d8'
          };
        });
        
        setEvents(formattedEvents);
        localStorage.setItem('events', JSON.stringify(formattedEvents));
      } catch (error) {
        console.error("Error fetching events:", error);
        
        // Try to load from localStorage if API fails
        const savedEvents = localStorage.getItem('events');
        if (savedEvents) {
          setEvents(JSON.parse(savedEvents));
        } else {
          // Use default event if nothing available
          const defaultEvent = {
            id: '1',
            title: 'מתמטיקה',
            start: '2025-02-24T10:00:00',
            end: '2025-02-24T11:30:00',
            extendedProps: {
              description: 'שיעור מתמטיקה שבועי',
              location: 'כיתה 101',
              courseId: '1',
              trainerId: 't1'
            },
            backgroundColor: DEFAULT_COLOR_PALETTE[0].bg,
            rrule: {
              freq: 'weekly',
              dtstart: '2025-02-24T10:00:00',
              until: '2025-06-24T23:59:59',
              interval: 1
            },
            duration: { hours: 1, minutes: 30 }
          };
          
          setEvents([defaultEvent]);
          localStorage.setItem('events', JSON.stringify([defaultEvent]));
        }
      }
    };
    
    if (courses.length > 0) {
      fetchEvents();
    }
  }, [courses]);

  // Update events when courses change to reflect any new course settings (such as colors)
  useEffect(() => {
    setEvents(prevEvents => prevEvents.map(event => {
      const courseId = event.extendedProps?.courseId;
      if (courseId) {
        const course = courses.find(c => c.id === courseId);
        if (course && course.color && course.color.bg) {
          return { ...event, backgroundColor: course.color.bg };
        }
      }
      return event;
    }));
  }, [courses]);

  // Filter events by trainer if filter is active
  const filteredEvents = useMemo(() => {
    if (!selectedTrainerFilter) return events;
    return events.filter(event => event.extendedProps?.trainerId === selectedTrainerFilter);
  }, [events, selectedTrainerFilter]);

  // Handle highlighting of conflicting events
  const highlightConflictingEvents = (newEvent) => {
    if (!calendarRef.current) return [];
    
    const calendarApi = calendarRef.current.getApi();
    const conflictingEvents = [];
    
    // Find conflicting events
    const start = new Date(newEvent.start);
    const end = new Date(newEvent.end);
    
    events.forEach(event => {
      if (event.id === newEvent.id) return; // Skip the current event
      
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      // Check for overlap
      if (start < eventEnd && eventStart < end) {
        conflictingEvents.push(event);
        
        // Highlight in the calendar
        const eventElement = calendarApi.getEventById(event.id);
        if (eventElement) {
          eventElement.setProp('classNames', ['conflicting']);
          
          // Store reference to clear later
          if (!highlightedEventRef.current) {
            highlightedEventRef.current = [];
          }
          highlightedEventRef.current.push(event.id);
        }
      }
    });
    
    return conflictingEvents;
  };

  // Clear highlighted events
  const clearHighlightedEvents = () => {
    if (!calendarRef.current || !highlightedEventRef.current) return;
    
    const calendarApi = calendarRef.current.getApi();
    
    highlightedEventRef.current.forEach(eventId => {
      const eventElement = calendarApi.getEventById(eventId);
      if (eventElement) {
        eventElement.setProp('classNames', []);
      }
    });
    
    highlightedEventRef.current = [];
  };

  // Handle date selection (creating a new event)
  const handleDateSelect = useCallback((selectInfo) => {
    // Clear any previously highlighted events
    clearHighlightedEvents();
    
    // Create new event object
    const newEvent = {
      id: Date.now().toString(),
      title: 'שיעור חדש',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      extendedProps: {
        description: '',
        location: '',
        courseId: '',
        // if filtering by trainer, default to that trainer:
        trainerId: selectedTrainerFilter || ''
      }
    };
    
    // Highlight any conflicting events
    highlightConflictingEvents(newEvent);
    
    // Open modal with new event
    setSelectedEvent(newEvent);
    setIsModalOpen(true);
  }, [selectedTrainerFilter, events]);

  // Handle clicking on an existing event
  const handleEventClick = useCallback((clickInfo) => {
    // Clear any previously highlighted events
    clearHighlightedEvents();
    
    const event = clickInfo.event;
    
    // Handle recurring events differently
    if (event.rrule) {
      const choice = window.prompt(
        'בחר אפשרות:\n\n1 - ערוך את כל המופעים\n2 - ערוך רק את המופע הנוכחי\n3 - בטל את המופע הנוכחי\n\nהקלד 1, 2, או 3:'
      );
      
      switch(choice) {
        case '1': 
          // Edit all occurrences
          setSelectedEvent({ ...event.toPlainObject(), start: event.startStr, end: event.endStr });
          setIsModalOpen(true);
          break;
          
        case '2': 
          // Edit just this occurrence (create exception)
          setSelectedEvent({
            id: Date.now().toString(),
            title: event.title,
            start: event.start,
            end: event.end,
            extendedProps: { 
              ...event.extendedProps, 
              originalEventId: event.id, 
              originalDate: event.startStr, 
              isException: true 
            },
            backgroundColor: event.backgroundColor,
            isException: true
          });
          setIsModalOpen(true);
          break;
          
        case '3': 
          // Cancel this occurrence (create cancelled exception)
          const cancelledEvent = {
            id: Date.now().toString(),
            title: `${event.title} (מבוטל)`,
            start: event.start,
            end: event.end,
            extendedProps: { 
              ...event.extendedProps, 
              originalEventId: event.id, 
              originalDate: event.startStr, 
              isCancelled: true, 
              isException: true 
            },
            backgroundColor: '#e5e7eb',
            textColor: '#9ca3af',
            display: 'block',
            isCancelled: true
          };
          handleUpdateEvent(cancelledEvent);
          break;
          
        default:
          break;
      }
    } else {
      // For non-recurring events, just open the modal
      setSelectedEvent({ ...event.toPlainObject(), start: event.startStr, end: event.endStr });
      setIsModalOpen(true);
    }
  }, []);

  // Save/update event to backend
  const saveEventToDB = async (event) => {
    try {
      // Format event data for API
      const eventData = {
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        extendedProps: JSON.stringify(event.extendedProps || {}),
        rrule: event.rrule ? JSON.stringify(event.rrule) : null,
        duration: event.duration ? JSON.stringify(event.duration) : null,
        backgroundColor: event.backgroundColor
      };
      
      // Check if event is new or existing
      const isNewEvent = !events.some(e => e.id === event.id);
      
      // Send API request
      if (isNewEvent) {
        await axios.post(`${API_BASE_URL}/events`, eventData);
      } else {
        await axios.put(`${API_BASE_URL}/events/${event.id}`, eventData);
      }
    } catch (error) {
      console.error("Error saving event to database:", error);
      // Note: event will still be updated in local state even if API fails
    }
  };

  // Validate an event for conflicts
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
    events.forEach(ev => {
      if (ev.id === updatedEvent.id) return; // Skip the current event
      
      const evStart = new Date(ev.start);
      const evEnd = new Date(ev.end);
      
      // Check for overlap
      if (start < evEnd && evStart < end) {
        warnings.push("ScheduleAvailability");
        conflictingEvents.push(ev);
      }
    });

    return { warnings, conflictingEvents };
  };

  // Handle dragging (eventDrop) with validations and highlighting
  const handleEventDrop = useCallback((dropInfo) => {
    // Clear any previously highlighted events
    clearHighlightedEvents();
    
    const event = dropInfo.event;
    const updatedEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      extendedProps: event.extendedProps
    };
    
    // Highlight conflicting events
    const conflictingEvents = highlightConflictingEvents(updatedEvent);
    
    // Validate dropped event
    const { warnings } = validateEvent(updatedEvent);
    
    if (warnings.length > 0) {
      toast.info(
        <WarningToastContent
          warnings={warnings}
          conflictingEvents={conflictingEvents}
          onProceed={() => {
            toast.dismiss();
            clearHighlightedEvents();
            saveEventToDB(updatedEvent);
            setEvents(prevEvents => {
              const updatedEvents = prevEvents.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev);
              localStorage.setItem('events', JSON.stringify(updatedEvents));
              return updatedEvents;
            });
          }}
          onCancel={() => {
            toast.dismiss();
            clearHighlightedEvents();
            dropInfo.revert(); // revert drop if cancelled
          }}
        />,
        { autoClose: false }
      );
      return;
    }
    
    // If no warnings, update event normally
    clearHighlightedEvents();
    saveEventToDB(updatedEvent);
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
      return updatedEvents;
    });
  }, [events]);

  // Handle event resize
  const handleEventResize = useCallback((resizeInfo) => {
    // Clear any previously highlighted events
    clearHighlightedEvents();
    
    const event = resizeInfo.event;
    const updatedEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      extendedProps: event.extendedProps
    };
    
    // Highlight conflicting events
    const conflictingEvents = highlightConflictingEvents(updatedEvent);
    
    // Validate resized event
    const { warnings } = validateEvent(updatedEvent);
    
    if (warnings.length > 0) {
      toast.info(
        <WarningToastContent
          warnings={warnings}
          conflictingEvents={conflictingEvents}
          onProceed={() => {
            toast.dismiss();
            clearHighlightedEvents();
            saveEventToDB(updatedEvent);
            setEvents(prevEvents => {
              const updatedEvents = prevEvents.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev);
              localStorage.setItem('events', JSON.stringify(updatedEvents));
              return updatedEvents;
            });
          }}
          onCancel={() => {
            toast.dismiss();
            clearHighlightedEvents();
            resizeInfo.revert(); // revert resize if cancelled
          }}
        />,
        { autoClose: false }
      );
      return;
    }
    
    // If no warnings, update event normally
    clearHighlightedEvents();
    saveEventToDB(updatedEvent);
    setEvents(prevEvents => {
      const updatedEvents = prevEvents.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev);
      localStorage.setItem('events', JSON.stringify(updatedEvents));
      return updatedEvents;
    });
  }, [events]);

  // Handle update event (from modal)
  const handleUpdateEvent = useCallback((updatedEvent) => {
    // Clear any previously highlighted events
    clearHighlightedEvents();
    
    // Save to database
    saveEventToDB(updatedEvent);
    
    // Update local state
    setEvents(prevEvents => {
      let newEvents;
      
      // Handle exception cases (special occurrences of recurring events)
      if (updatedEvent.isException) {
        const originalEvent = prevEvents.find(e => 
          e.id === updatedEvent.extendedProps.originalEventId
        );
        
        if (originalEvent) {
          // Check if there's already an exception for this occurrence
          const existingException = prevEvents.find(e => 
            e.extendedProps?.isException && 
            e.extendedProps?.originalEventId === originalEvent.id &&
            e.extendedProps?.originalDate === updatedEvent.extendedProps.originalDate
          );
          
          if (existingException) {
            // Update existing exception
            newEvents = prevEvents.map(ev => 
              ev.id === existingException.id ? updatedEvent : ev
            );
          } else {
            // Add new exception
            newEvents = [...prevEvents, updatedEvent];
          }
        } else {
          newEvents = [...prevEvents, updatedEvent];
        }
      } else {
        // Handle regular event updates
        const eventExists = prevEvents.some(ev => ev.id === updatedEvent.id);
        
        if (eventExists) {
          // Update existing event
          newEvents = prevEvents.map(ev => 
            ev.id === updatedEvent.id ? { ...ev, ...updatedEvent } : ev
          );
        } else {
          // Add new event
          newEvents = [...prevEvents, updatedEvent];
        }
      }
      
      // Save to localStorage
      localStorage.setItem('events', JSON.stringify(newEvents));
      return newEvents;
    });
    
    // Close modal
    setIsModalOpen(false);
  }, []);

  // Handle delete event
  const handleDeleteEvent = useCallback(async (eventId) => {
    try {
      // Clear any previously highlighted events
      clearHighlightedEvents();
      
      // Delete from API
      await axios.delete(`${API_BASE_URL}/events/${eventId}`);
      
      // Update local state
      setEvents(prevEvents => {
        const updatedEvents = prevEvents.filter(ev => ev.id !== eventId);
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        return updatedEvents;
      });
      
      // Close modal
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error deleting event:", error);
      
      // Still update local state even if API fails
      setEvents(prevEvents => {
        const updatedEvents = prevEvents.filter(ev => ev.id !== eventId);
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        return updatedEvents;
      });
      
      // Close modal
      setIsModalOpen(false);
    }
  }, []);

  // Handle adding a new course
  const handleAddCourse = useCallback(async (newCourse) => {
    try {
      // Ensure course has tags array
      if (!newCourse.tags) {
        newCourse.tags = [];
      }
      
      // Save to API
      const response = await axios.post(`${API_BASE_URL}/courses`, {
        name: newCourse.name,
        color: JSON.stringify(newCourse.color),
        tags: JSON.stringify(newCourse.tags)
      });
      
      // Update with API response
      const savedCourse = response.data;
      setCourses(prevCourses => {
        const updatedCourses = [...prevCourses, savedCourse];
        localStorage.setItem('courses', JSON.stringify(updatedCourses));
        return updatedCourses;
      });
    } catch (error) {
      console.error("Error adding course:", error);
      
      // Still update local state even if API fails
      setCourses(prevCourses => {
        const updatedCourses = [...prevCourses, newCourse];
        localStorage.setItem('courses', JSON.stringify(updatedCourses));
        return updatedCourses;
      });
    }
  }, []);

  // Handle settings changes
  const handleSettingsChange = useCallback((changes) => {
    if (changes.type === 'workHours') {
      setCalendarSettings({ 
        slotMinTime: changes.startTime, 
        slotMaxTime: changes.endTime 
      });
    } else if (changes.type === 'trainers') {
      setTrainers(changes.trainers);
      localStorage.setItem('trainers', JSON.stringify(changes.trainers));
    } else if (changes.type === 'courses') {
      setCourses(changes.courses);
      localStorage.setItem('courses', JSON.stringify(changes.courses));
    } else if (changes.type === 'colorPalette') {
      // No need to update state here, we'll use localStorage directly
      localStorage.setItem('colorPalette', JSON.stringify(changes.colorPalette));
    } else if (changes.type === 'courseTags') {
      localStorage.setItem('courseTags', JSON.stringify(changes.tags));
    }
  }, []);

  // Export to ICS file
  const exportToICS = useCallback(() => {
    // Format date to iCalendar format
    const formatDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    // Create description text for event
    const formatDescription = (event) => {
      const course = courses.find(c => c.id === event.extendedProps?.courseId);
      const trainer = trainers.find(t => t.id === event.extendedProps?.trainerId);
      const desc = [];
      
      if (course) desc.push(`קורס: ${course.name}`);
      if (trainer) desc.push(`מאמן: ${trainer.name}`);
      if (event.extendedProps?.description) desc.push(event.extendedProps.description);
      
      return desc.join('\\n');
    };
    
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
        `UID:${event.id}@academiccalendar.com`,
        `DTSTAMP:${formatDate(new Date().toISOString())}`,
        `DTSTART:${formatDate(event.start)}`
      ];
      
      // Add end time for non-recurring events
      if (!event.rrule) {
        eventLines.push(`DTEND:${formatDate(event.end)}`);
      }
      
      // Add recurrence rule and duration for recurring events
      if (event.rrule) {
        const rruleStr = [
          'RRULE:FREQ=WEEKLY',
          `UNTIL=${formatDate(event.rrule.until)}`,
          `INTERVAL=${event.rrule.interval || 1}`
        ].join(';');
        
        eventLines.push(rruleStr);
        
        if (event.duration) {
          const duration = `PT${event.duration.hours || 0}H${event.duration.minutes || 0}M`;
          eventLines.push(`DURATION:${duration}`);
        }
      }
      
      // Add other event properties
      eventLines.push(
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${formatDescription(event)}`
      );
      
      if (event.extendedProps?.location) {
        eventLines.push(`LOCATION:${event.extendedProps.location}`);
      }
      
      if (event.backgroundColor) {
        eventLines.push(`X-APPLE-CALENDAR-COLOR:${event.backgroundColor}`);
      }
      
      // Close event
      eventLines.push('END:VEVENT');
      
      // Add to calendar content
      icsContent = icsContent.concat(eventLines);
    });
    
    // Close calendar
    icsContent.push('END:VCALENDAR');
    
    // Handle non-ASCII characters
    const finalContent = icsContent.join('\r\n')
      .replace(/[^\x00-\x7F]/g, (char) => encodeURIComponent(char)
        .split('%')
        .filter(Boolean)
        .map(code => String.fromCharCode(parseInt(code, 16)))
        .join(''));
    
    // Create and download file
    const blob = new Blob([finalContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'academic-calendar.ics';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [events, courses, trainers]);

  // Custom event content renderer
  const renderEventContent = (eventInfo) => {
    const event = eventInfo.event;
    const isCancelled = event.extendedProps?.isCancelled;
    const isException = event.extendedProps?.isException;
    const trainer = trainers.find(t => t.id === event.extendedProps?.trainerId);
    
    // Find course to get tags
    const course = event.extendedProps?.courseId ? 
      courses.find(c => c.id === event.extendedProps.courseId) : null;
    
    const fullTitle = event.title;
    const displayTitle = fullTitle.length > 15 ? fullTitle.substring(0,15) + '...' : fullTitle;
    
    return (
      <div className={`event-content ${isException ? 'exception' : ''} ${isCancelled ? 'cancelled' : ''}`}
        style={{ fontSize: '0.8em' }}
        title={fullTitle}
      >
        <div className="event-title">
          {isException && !isCancelled && <span className="exception-indicator">⚡</span>}
          {isCancelled && <span className="cancelled-indicator">🚫</span>}
          {displayTitle}
        </div>
        
        {trainer && <div className="event-trainer">מאמן: {trainer.name}</div>}
        
        {course && course.tags && course.tags.length > 0 && (
          <div className="event-tags">
            {course.tags.map(tag => (
              <span key={tag} className="event-tag">{tag}</span>
            ))}
          </div>
        )}
        
        {event.extendedProps?.location && !isCancelled && (
          <div className="event-location">📍 {event.extendedProps.location}</div>
        )}
      </div>
    );
  };

  return (
    <div className={`calendar-container modern ${isDarkMode ? 'dark' : ''}`}>
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="header-buttons">
          <button 
            className="theme-toggle" 
            onClick={() => setIsDarkMode(!isDarkMode)} 
            title="החלף מצב תצוגה"
          >
            {isDarkMode ? '🌞' : '🌙'}
          </button>
          <button 
            className="settings-button" 
            onClick={() => setIsSettingsOpen(true)} 
            title="הגדרות"
          >
            ⚙️ הגדרות
          </button>
          <select
            className="trainer-filter"
            value={selectedTrainerFilter}
            onChange={(e) => setSelectedTrainerFilter(e.target.value)}
            title="סנן לפי מאמן"
          >
            <option value="">כל המאמנים</option>
            {trainers.map(trainer => (
              <option key={trainer.id} value={trainer.id}>
                {trainer.name}
              </option>
            ))}
          </select>
          <button 
            className="export-button" 
            onClick={exportToICS} 
            title="ייצא לוח שנה"
          >
            ⬇️ ייצא ל-ICS
          </button>
        </div>
      </div>
      
      {/* Calendar View */}
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
          initialView="timeGridWeek"
          headerToolbar={{ 
            start: 'prev,next today', 
            center: 'title', 
            end: 'dayGridMonth,timeGridWeek,timeGridDay' 
          }}
          height="800px"
          events={filteredEvents}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekNumbers={true}
          nowIndicator={true}
          locale="he"
          direction="rtl"
          firstDay={0}
          slotMinTime={calendarSettings.slotMinTime}
          slotMaxTime={calendarSettings.slotMaxTime}
          allDaySlot={false}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          buttonText={{ today: 'היום', month: 'חודש', week: 'שבוע', day: 'יום' }}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventContent={renderEventContent}
          unselectAuto={false}
        />
      </div>
      
      {/* Event Modal */}
      {isModalOpen && (
        <EventModal
          isOpen={isModalOpen}
          onClose={() => {
            clearHighlightedEvents();
            setIsModalOpen(false);
          }}
          event={selectedEvent}
          courses={courses}
          trainers={trainers}
          onUpdate={handleUpdateEvent}
          onDelete={handleDeleteEvent}
          onAddCourse={handleAddCourse}
          allEvents={events}
          confirmDelete={(event) => {
            toast.info(
              <DeleteConfirmationToast
                event={event}
                onConfirm={() => {
                  toast.dismiss();
                  handleDeleteEvent(event.id);
                }}
                onCancel={() => {
                  toast.dismiss();
                }}
              />,
              { autoClose: false }
            );
          }}
        />
      )}
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsComponent
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          trainers={trainers}
          courses={courses}
          onSettingsChange={handleSettingsChange}
        />
      )}
      
      {/* Toast Container for notifications */}
      <ToastContainer position="top-center" rtl={true} />
    </div>
  );
};

export default CalendarComponent;
