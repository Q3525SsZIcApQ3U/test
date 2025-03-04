import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import rrulePlugin from '@fullcalendar/rrule';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/Calendar.css';
import SettingsComponent from './SettingsComponent';
import EventModal from './EventModal';
import TodoComponent from './TodoComponent';
import ContextMenu from './ContextMenu';

// API base URL
const API_BASE_URL = 'http://localhost:5001/api';

// Default Color palette for courses (will use custom palette from localStorage if available)
const DEFAULT_COLOR_PALETTE = [
  { bg: '#4361ee', text: '#FFFFFF' },
  { bg: '#3a56d4', text: '#FFFFFF' },
  { bg: '#4895ef', text: '#FFFFFF' },
  { bg: '#10b981', text: '#FFFFFF' },
  { bg: '#f59e0b', text: '#FFFFFF' },
  { bg: '#ef4444', text: '#FFFFFF' },
  { bg: '#8b5cf6', text: '#FFFFFF' },
  { bg: '#ec4899', text: '#FFFFFF' },
  { bg: '#14b8a6', text: '#FFFFFF' },
  { bg: '#6366f1', text: '#FFFFFF' },
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
const CalendarComponent = ({ isDarkMode, setIsDarkMode }) => {
  // If props are not provided, use local state
  const [localDarkMode, setLocalDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  
  // Use props if available, otherwise use local state
  const effectiveDarkMode = isDarkMode !== undefined ? isDarkMode : localDarkMode;
  const handleToggleDarkMode = useCallback(() => {
    if (setIsDarkMode) {
      setIsDarkMode(!effectiveDarkMode);
    } else {
      setLocalDarkMode(!effectiveDarkMode);
    }
  }, [effectiveDarkMode, setIsDarkMode]);
  
  // State for UI options
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // State for context menu
  const [contextMenu, setContextMenu] = useState(null);
  
  // State for data
  const [courses, setCourses] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState('');
  const [events, setEvents] = useState([]);
  const [calendarSettings, setCalendarSettings] = useState({
    slotMinTime: "07:00:00",
    slotMaxTime: "22:01:00" // Fixed to have 1 minute past hour
  });
  
  // State for app tabs
  const [activeTab, setActiveTab] = useState('calendar');
  
  // Refs
  const calendarRef = useRef(null);
  const highlightedEventRef = useRef(null);
  
  // Helper function to process recurring events with excluded dates
  const processRecurringEvent = (event) => {
    // If this event has exdates, format them for FullCalendar
    if (event.rrule && event.rrule.exdate && event.rrule.exdate.length > 0) {
      // Ensure exdate is an array
      const exdates = Array.isArray(event.rrule.exdate) 
        ? event.rrule.exdate 
        : [event.rrule.exdate];
      
      // Format each excluded date as required by FullCalendar
      const formattedExdates = exdates.map(dateStr => {
        // If dateStr is already in ISO format, use it directly
        if (dateStr.includes('T')) {
          return dateStr;
        }
        
        // Otherwise, assume it's YYYY-MM-DD and convert to ISO
        const date = new Date(`${dateStr}T00:00:00`);
        return date.toISOString();
      });
      
      // Update the event with the formatted exdates
      return {
        ...event,
        rrule: {
          ...event.rrule,
          exdate: formattedExdates
        }
      };
    }
    
    return event;
  };
  
  // Persist dark mode if we're using local state
  useEffect(() => {
    if (isDarkMode === undefined) {
      localStorage.setItem('darkMode', localDarkMode);
      
      // Apply dark mode to document body for consistent styling
      if (localDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  }, [localDarkMode, isDarkMode]);

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
    
    // Load active tab from localStorage if exists
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab) {
      setActiveTab(savedTab);
    }
    
    // Add drag boundary check for document
    document.addEventListener('mouseup', handleDragOutsideWindow);
    
    return () => {
      document.removeEventListener('mouseup', handleDragOutsideWindow);
    };
  }, []);
  
  // Handle drag outside window
  const handleDragOutsideWindow = () => {
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      // Check if currently dragging
      if (calendarApi.isDragging && calendarApi.isDragging()) {
        calendarApi.unselect(); // Stop any active drag
      }
    }
  };

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

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
          const formattedEvent = {
            ...event,
            extendedProps: parsedExtendedProps,
            rrule: parsedRrule,
            duration: parsedDuration,
            start: new Date(event.start).toISOString(),
            end: new Date(event.end).toISOString(),
            backgroundColor: course?.color?.bg || event.backgroundColor || '#4361ee',
            allDay: event.allDay || parsedExtendedProps?.isAllDay || false
          };
          
          // Process recurring events with exdates
          return processRecurringEvent(formattedEvent);
        });
        
        setEvents(formattedEvents);
        localStorage.setItem('events', JSON.stringify(formattedEvents));
      } catch (error) {
        console.error("Error fetching events:", error);
        
        // Try to load from localStorage if API fails
        const savedEvents = localStorage.getItem('events');
        if (savedEvents) {
          const parsedEvents = JSON.parse(savedEvents).map(processRecurringEvent);
          setEvents(parsedEvents);
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
              trainerId: 't1',
              tags: []
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
          
          setEvents([processRecurringEvent(defaultEvent)]);
          localStorage.setItem('events', JSON.stringify([defaultEvent]));
        }
      }
    };
    
    fetchEvents();
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
    
    // Skip conflict checking for all-day events
    if (newEvent.allDay || newEvent.extendedProps?.isAllDay) {
      return [];
    }
    
    // Find conflicting events
    const start = new Date(newEvent.start);
    const end = new Date(newEvent.end);

    events.forEach(event => {
      if (event.id === newEvent.id) return; // Skip the current event
      if (event.allDay || event.extendedProps?.isAllDay) return; // Skip all-day events
      
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
        backgroundColor: event.backgroundColor,
        allDay: event.allDay || event.extendedProps?.isAllDay || false
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
    
    // Skip conflict validation for all-day events
    if (updatedEvent.allDay || updatedEvent.extendedProps?.isAllDay) {
      return { warnings, conflictingEvents };
    }
    
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
      if (ev.allDay || ev.extendedProps?.isAllDay) return; // Skip all-day events
      
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

  // Handle update event (from modal)
  const handleUpdateEvent = useCallback((updatedEvent) => {
    // Clear any previously highlighted events
    clearHighlightedEvents();
    
    // Process the event to ensure proper formatting of recurring event exclusions
    const processedEvent = processRecurringEvent(updatedEvent);
    
    // Save to database
    saveEventToDB(processedEvent);
    
    // Update local state
    setEvents(prevEvents => {
      let newEvents;
      
      // Handle exception cases (special occurrences of recurring events)
      if (processedEvent.isException) {
        const originalEvent = prevEvents.find(e => 
          e.id === processedEvent.extendedProps.originalEventId
        );
        
        if (originalEvent) {
          // Check if there's already an exception for this occurrence
          const existingException = prevEvents.find(e => 
            e.extendedProps?.isException && 
            e.extendedProps?.originalEventId === originalEvent.id &&
            e.extendedProps?.originalDate === processedEvent.extendedProps.originalDate
          );
          
          if (existingException) {
            // Update existing exception
            newEvents = prevEvents.map(ev => 
              ev.id === existingException.id ? processedEvent : ev
            );
          } else {
            // Add new exception
            newEvents = [...prevEvents, processedEvent];
          }
        } else {
          newEvents = [...prevEvents, processedEvent];
        }
      } else {
        // Handle regular event updates
        const eventExists = prevEvents.some(ev => ev.id === processedEvent.id);
        
        if (eventExists) {
          // Update existing event
          newEvents = prevEvents.map(ev => 
            ev.id === processedEvent.id ? { ...ev, ...processedEvent } : ev
          );
        } else {
          // Add new event
          newEvents = [...prevEvents, processedEvent];
        }
      }
      
      // Process all recurring events to ensure proper formatting
      newEvents = newEvents.map(processRecurringEvent);
      
      // Save to localStorage
      localStorage.setItem('events', JSON.stringify(newEvents));
      return newEvents;
    });
    
    // Close modal
    setIsModalOpen(false);
  }, []);

  // Handle event click - with support for excluding individual instances
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
          // First add this date to the exclude dates in the original event's rrule
          const originalEvent = events.find(e => e.id === event.id);
          if (originalEvent && originalEvent.rrule) {
            // Create a copy of the original event to update
            const updatedOriginalEvent = { ...originalEvent };
            
            // Get the date of this occurrence in YYYY-MM-DD format
            const occurrenceDate = new Date(event.start);
            const dateString = occurrenceDate.toISOString().split('T')[0];
            
            // Initialize or update the exdate array in the rrule
            if (!updatedOriginalEvent.rrule.exdate) {
              updatedOriginalEvent.rrule.exdate = [dateString];
            } else if (Array.isArray(updatedOriginalEvent.rrule.exdate)) {
              updatedOriginalEvent.rrule.exdate.push(dateString);
            } else {
              updatedOriginalEvent.rrule.exdate = [updatedOriginalEvent.rrule.exdate, dateString];
            }
            
            // Update the original recurring event with the new exclude date
            handleUpdateEvent(updatedOriginalEvent);
            
            // Now create a new single event for this occurrence
            setSelectedEvent({
              id: Date.now().toString(),
              title: event.title,
              start: event.start,
              end: event.end,
              allDay: event.allDay,
              extendedProps: { 
                ...event.extendedProps, 
                originalEventId: event.id, 
                originalDate: event.startStr, 
                isException: true,
                isAllDay: event.allDay || event.extendedProps?.isAllDay,
              },
              backgroundColor: event.backgroundColor,
              isException: true
            });
            setIsModalOpen(true);
          }
          break;
          
        case '3': 
          // Cancel this occurrence (create cancelled exception)
          // First add this date to the exclude dates in the original event
          const origEvent = events.find(e => e.id === event.id);
          if (origEvent && origEvent.rrule) {
            // Create a copy of the original event to update
            const updatedOrigEvent = { ...origEvent };
            
            // Get the date of this occurrence in YYYY-MM-DD format
            const occurrenceDate = new Date(event.start);
            const dateString = occurrenceDate.toISOString().split('T')[0];
            
            // Initialize or update the exdate array in the rrule
            if (!updatedOrigEvent.rrule.exdate) {
              updatedOrigEvent.rrule.exdate = [dateString];
            } else if (Array.isArray(updatedOrigEvent.rrule.exdate)) {
              updatedOrigEvent.rrule.exdate.push(dateString);
            } else {
              updatedOrigEvent.rrule.exdate = [updatedOrigEvent.rrule.exdate, dateString];
            }
            
            // Update the original recurring event with the new exclude date
            handleUpdateEvent(updatedOrigEvent);
            
            // Create a cancelled event for this occurrence
            const cancelledEvent = {
              id: Date.now().toString(),
              title: `${event.title} (מבוטל)`,
              start: event.start,
              end: event.end,
              allDay: event.allDay,
              extendedProps: { 
                ...event.extendedProps, 
                originalEventId: event.id, 
                originalDate: event.startStr, 
                isCancelled: true, 
                isException: true,
                isAllDay: event.allDay || event.extendedProps?.isAllDay,
                tags: event.extendedProps?.tags || []
              },
              backgroundColor: '#e5e7eb',
              textColor: '#9ca3af',
              display: 'block',
              isCancelled: true
            };
            handleUpdateEvent(cancelledEvent);
          }
          break;
          
        default:
          break;
      }
    } else {
      // For non-recurring events, just open the modal
      setSelectedEvent({ ...event.toPlainObject(), start: event.startStr, end: event.endStr });
      setIsModalOpen(true);
    }
  }, [events, handleUpdateEvent]);

  // Handle date selection (creating a new event)
  const handleDateSelect = useCallback((selectInfo) => {
    // Clear any previously highlighted events
    clearHighlightedEvents();
    
    // Find default course for initial color
    const defaultCourse = courses.length > 0 ? courses[0] : null;
    const defaultColor = defaultCourse?.color?.bg || '#4361ee';
    
    // Check if this is an all-day selection
    const isAllDay = selectInfo.allDay;
    
    // Create new event object
    const newEvent = {
      id: Date.now().toString(),
      title: 'שיעור חדש',
      start: selectInfo.startStr,
      end: selectInfo.endStr,
      backgroundColor: defaultColor,
      allDay: isAllDay,
      extendedProps: {
        description: '',
        location: '',
        courseId: defaultCourse?.id || '',
        trainerId: selectedTrainerFilter || '',
        isAllDay: isAllDay,
      }
    };
    
    // Add the event temporarily to the calendar
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect(); // clear date selection
    
    // Add event to state temporarily
    setEvents(prevEvents => {
      const updatedEvents = [...prevEvents, newEvent];
      return updatedEvents;
    });
    
    // For all-day events, don't highlight conflicts
    if (!isAllDay) {
      // Highlight any conflicting events
      highlightConflictingEvents(newEvent);
    }
    
    // Open modal with new event
    setSelectedEvent(newEvent);
    setIsModalOpen(true);
  }, [selectedTrainerFilter, courses, events]);

  // Handle event drop - with support for all-day to time conversion
  const handleEventDrop = useCallback((dropInfo) => {
    // Clear any previously highlighted events
    clearHighlightedEvents();
    
    const event = dropInfo.event; // Drop position
    const oldEvent = dropInfo.oldEvent; // First event
    const originalEvent = events.find(ev => ev.id === event.id); // Original event
    
    if (!originalEvent) return;
    
    // Check if this is an all-day to time slot conversion
    const wasAllDay = originalEvent.allDay || originalEvent.extendedProps?.isAllDay;
    const isNowAllDay = event.allDay;
    
    // If converting from all-day to time-based
    if (wasAllDay && !isNowAllDay) {
      // Create the updated event with appropriate time slots
      const updatedEvent = {
        ...originalEvent,
        start: event.startStr,
        end: new Date(new Date(event.startStr).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        allDay: false,
extendedProps: {
          ...originalEvent.extendedProps,
          isAllDay: false
        }
      };
      
      // If there's a recurring rule, update it
      if (updatedEvent.rrule) {
        updatedEvent.rrule = {
          ...updatedEvent.rrule,
          dtstart: event.startStr
        };
        
        // Calculate the duration for recurring events
        updatedEvent.duration = {
          hours: 1,
          minutes: 0
        };
      }
      
      // Save and update
      saveEventToDB(updatedEvent);
      setEvents(prevEvents => {
        const updatedEvents = prevEvents.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev);
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        return updatedEvents;
      });
      
      return;
    }
    
    // For all-day events being moved within all-day section, construct a simpler update
    if (isNowAllDay && wasAllDay) {
      const updatedEvent = {
        ...originalEvent,
        start: event.startStr,
        end: event.endStr,
        allDay: true,
        extendedProps: {
          ...originalEvent.extendedProps,
          isAllDay: true
        }
      };
      
      // If there's a recurring rule, update it
      if (updatedEvent.rrule) {
        updatedEvent.rrule = {
          ...updatedEvent.rrule,
          dtstart: event.startStr
        };
      }
      
      // Save directly without conflict checking
      saveEventToDB(updatedEvent);
      setEvents(prevEvents => {
        const updatedEvents = prevEvents.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev);
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        return updatedEvents;
      });
      
      return;
    }
    
    // For regular events, handle as before with time shifts
    const originalStart = new Date(originalEvent.start);
    const modifiedStart = new Date(event.startStr);
    const oldStart = new Date(oldEvent.startStr);
    const timeShift = modifiedStart.getTime() - oldStart.getTime();

    // Create the updated event with a shifted start time
    const updatedEvent = {
      id: event.id,
      title: event.title,
      start: new Date((new Date(originalEvent.start)).getTime() + timeShift).toISOString(), // Shifted start time
      end: new Date((new Date(originalEvent.end)).getTime() + timeShift).toISOString(), // Keep the modified end time
      extendedProps: event.extendedProps,
      allDay: event.allDay,
      rrule: originalEvent.rrule
        ? {
            ...originalEvent.rrule,
            dtstart: new Date(originalStart.getTime() + timeShift).toISOString(), // Shifted recurrence start
            until: new Date(new Date(originalEvent.rrule.until).getTime() + timeShift).toISOString()
          }
        : null
    };

    // Calculate the duration for recurring events (if applicable)
    if (updatedEvent.rrule && !updatedEvent.allDay) {
      const modifiedEnd = new Date(event.endStr);
      updatedEvent.duration = {
        hours: Math.floor((modifiedEnd - new Date(event.startStr)) / (1000 * 60 * 60)),
        minutes: Math.round(((modifiedEnd - new Date(event.startStr)) % (1000 * 60 * 60)) / (1000 * 60))
      };
    }

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
            dropInfo.revert(); // Revert drop if cancelled
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
    const oldEvent = resizeInfo.oldEvent;
    const originalEvent = events.find(ev => ev.id === event.id);
    
    if (!originalEvent) return;
    
    // For all-day events, just update the end date
    if (event.allDay || event.extendedProps?.isAllDay) {
      const updatedEvent = {
        ...originalEvent,
        end: event.endStr,
        allDay: true,
        extendedProps: {
          ...originalEvent.extendedProps,
          isAllDay: true
        }
      };
      
      // Save directly without conflict checking
      saveEventToDB(updatedEvent);
      setEvents(prevEvents => {
        const updatedEvents = prevEvents.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev);
        localStorage.setItem('events', JSON.stringify(updatedEvents));
        return updatedEvents;
      });
      
      return;
    }

    // For regular events, handle as before
    const originalEnd = new Date(originalEvent.end);
    const modifiedEnd = new Date(event.endStr);
    const oldEnd = new Date(oldEvent.endStr);
    const timeShift = (modifiedEnd.getTime() - oldEnd.getTime());

    // Create the updated event with the proper shifted end time
    const updatedEvent = {
      id: event.id,
      title: event.title,
      start: originalEvent.start, // Keep original start time
      end: new Date(originalEnd.getTime() + timeShift).toISOString(), // Shifted end time
      extendedProps: originalEvent.extendedProps,
      allDay: event.allDay,
      rrule: originalEvent.rrule
        ? {
            ...originalEvent.rrule,
            // Keep original dtstart
            dtstart: originalEvent.rrule.dtstart,
            // Keep original until
            until: originalEvent.rrule.until
          }
        : null,
      // Update duration for recurring events
      duration: originalEvent.rrule && !event.allDay
        ? {
            hours: Math.floor((modifiedEnd - new Date(event.startStr)) / (1000 * 60 * 60)),
            minutes: Math.round(((modifiedEnd - new Date(event.startStr)) % (1000 * 60 * 60)) / (1000 * 60))
          }
        : null
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

  // Handle context menu
  const handleEventContextMenu = (eventClickInfo) => {
    const originalEvent = eventClickInfo.jsEvent.originalEvent || eventClickInfo.jsEvent;
    if (originalEvent) {
      originalEvent.preventDefault();
      
      const event = eventClickInfo.event;
      
      // Get position for context menu
      const x = originalEvent.clientX;
      const y = originalEvent.clientY;
      
      // Show context menu
      setContextMenu({
        x,
        y,
        event,
        options: [
          {
            label: 'עריכה',
            onClick: () => {
              setSelectedEvent({ ...event.toPlainObject(), start: event.startStr, end: event.endStr });
              setIsModalOpen(true);
            }
          },
          {
            label: event.allDay ? 'המר לאירוע רגיל' : 'המר לאירוע יום שלם',
            onClick: () => handleConvertEventType(event)
          },
          {
            label: 'מחיקה',
            onClick: () => {
              confirmDelete(event.toPlainObject());
            },
            type: 'delete'
          }
        ]
      });
    }
  };
  
  // Handle converting event type (all day <-> regular)
  const handleConvertEventType = (event) => {
    // Create a copy of the event
    const eventCopy = { ...event.toPlainObject(), start: event.startStr, end: event.endStr };
    
    // Toggle allDay property
    const isAllDay = !event.allDay;
    eventCopy.allDay = isAllDay;
    eventCopy.extendedProps = {
      ...eventCopy.extendedProps,
      isAllDay: isAllDay
    };
    
    // If converting to all-day event, adjust dates
    if (isAllDay) {
      // For all-day events, we only care about the date part
      const startDate = new Date(event.start);
      const endDate = new Date(event.end);
      
      // Set to midnight UTC for proper all-day handling
      startDate.setUTCHours(0, 0, 0, 0);
      
      // End date should be the next day for FullCalendar all-day events
      endDate.setUTCHours(0, 0, 0, 0);
      endDate.setDate(endDate.getDate() + 1);
      
      eventCopy.start = startDate.toISOString();
      eventCopy.end = endDate.toISOString();
    } else {
      // Converting from all-day to regular
      // Set default time range (e.g., 10:00 - 11:00)
      const date = new Date(event.start);
      date.setHours(10, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(11, 0, 0, 0);
      
      eventCopy.start = date.toISOString();
      eventCopy.end = endDate.toISOString();
    }
    
    // Save the converted event
    handleUpdateEvent(eventCopy);
  };

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

  // Simplified and robust exportToICS function that properly handles Hebrew text
  const exportToICS = (events, courses, trainers) => {
    if (!events || events.length === 0) {
      alert("אין אירועים לייצוא");
      return false;
    }

    try {
      // Helper function to properly encode text for ICS format
      const encodeIcsText = (text) => {
        if (!text) return '';
        return text
          .replace(/\\/g, '\\\\')
          .replace(/;/g, '\\;')
          .replace(/,/g, '\\,')
          .replace(/\n/g, '\\n');
      };
      
      // Simple date formatter for ICS
      const formatIcsDate = (date, isAllDay = false) => {
        const d = new Date(date);
        if (isAllDay) {
          return d.toISOString().replace(/[-:]/g, '').slice(0, 8);
        }
        return d.toISOString().replace(/[-:.]/g, '').replace(/\d{3}Z$/, 'Z');
      };
      
      // Start building the ICS file
      let icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Academic Calendar//Course Schedule//EN',
        'CALSCALE:GREGORIAN'
      ];
      
      // Process each event
      events.forEach(event => {
        if (!event.start) return;
        
        icsContent.push('BEGIN:VEVENT');
        icsContent.push(`UID:${event.id || `event-${Date.now()}`}@academiccalendar.com`);
        
        // Handle all-day events differently
        if (event.allDay || event.extendedProps?.isAllDay) {
          icsContent.push(`DTSTART;VALUE=DATE:${formatIcsDate(event.start, true)}`);
          
          // If there's an end date, use it; otherwise, use start date + 1 day
          const endDate = event.end ? new Date(event.end) : new Date(event.start);
          if (!event.end) {
            endDate.setDate(endDate.getDate() + 1);
          }
          icsContent.push(`DTEND;VALUE=DATE:${formatIcsDate(endDate, true)}`);
        } else {
          icsContent.push(`DTSTART:${formatIcsDate(event.start)}`);
          if (event.end) {
            icsContent.push(`DTEND:${formatIcsDate(event.end)}`);
          } else {
            // Default to 1 hour duration
            const endDate = new Date(new Date(event.start).getTime() + 60*60*1000);
            icsContent.push(`DTEND:${formatIcsDate(endDate)}`);
          }
        }
        
        // Add event title
        icsContent.push(`SUMMARY:${encodeIcsText(event.title || 'Untitled Event')}`);
        
        // Add description with course and trainer info
        const description = [];
        const course = event.extendedProps?.courseId ? 
          courses.find(c => c.id === event.extendedProps.courseId) : null;
        const trainer = event.extendedProps?.trainerId ? 
          trainers.find(t => t.id === event.extendedProps.trainerId) : null;
          
        if (course) description.push(`קורס: ${course.name}`);
        if (trainer) description.push(`מאמן: ${trainer.name}`);
        if (event.extendedProps?.description) description.push(event.extendedProps.description);
        
        if (description.length > 0) {
          icsContent.push(`DESCRIPTION:${encodeIcsText(description.join('\\n'))}`);
        }
        
        // Add location
        if (event.extendedProps?.location) {
          icsContent.push(`LOCATION:${encodeIcsText(event.extendedProps.location)}`);
        }
        
        // End the event
        icsContent.push('END:VEVENT');
      });
      
      // Close the calendar
      icsContent.push('END:VCALENDAR');
      
      // Create the file content with proper line endings
      const fileContent = icsContent.join('\r\n') + '\r\n';
      
      // Create and download the file
      const blob = new Blob([fileContent], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calendar-export-${new Date().toISOString().slice(0, 10)}.ics`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error("Error exporting to ICS:", error);
      alert(`שגיאה בייצוא אירועים: ${error.message}`);
      return false;
    }
  };

  // Custom event content renderer with event type support
  const renderEventContent = (eventInfo) => {
    const event = eventInfo.event;
    const isCancelled = event.extendedProps?.isCancelled;
    const isException = event.extendedProps?.isException;
    const isAllDay = event.allDay || event.extendedProps?.isAllDay;
    const trainer = trainers.find(t => t.id === event.extendedProps?.trainerId);
    
    // Find course to get event type
    const course = event.extendedProps?.courseId ? 
      courses.find(c => c.id === event.extendedProps.courseId) : null;
      
    // Get event type from extendedProps
    const eventTypeId = event.extendedProps?.eventTypeId;
    let eventType = null;
    
    // Load event types from localStorage
    try {
      const savedEventTypes = localStorage.getItem('eventTypes');
      const eventTypes = savedEventTypes ? JSON.parse(savedEventTypes) : [];
      eventType = eventTypeId ? eventTypes.find(type => type.id === eventTypeId) : null;
    } catch (e) {
      console.error("Error parsing eventTypes from localStorage:", e);
    }
    
    const fullTitle = event.title;
    const displayTitle = fullTitle.length > 15 ? fullTitle.substring(0,15) + '...' : fullTitle;
    
    // If it's an all-day event, use a more compact display
    if (isAllDay) {
      return (
        <div className={`event-content all-day-event ${isException ? 'exception' : ''} ${isCancelled ? 'cancelled' : ''}`}
          style={{ fontSize: '0.8em' }}
          title={fullTitle}
        >
          <div className="event-title">
            {isException && !isCancelled && <span className="exception-indicator">⚡</span>}
            {isCancelled && <span className="cancelled-indicator">🚫</span>}
            {displayTitle}
            {eventType && <span className="event-type"> - {eventType.icon} {eventType.name}</span>}
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
          {isException && !isCancelled && <span className="exception-indicator">⚡</span>}
          {isCancelled && <span className="cancelled-indicator">🚫</span>}
          {displayTitle}
          {eventType && <span className="event-type"> - {eventType.icon} {eventType.name}</span>}
        </div>
        
        {course && <div className="event-course">קורס: {course.name}</div>}
        {trainer && <div className="event-trainer">מאמן: {trainer.name}</div>}
        
        {event.extendedProps?.location && !isCancelled && (
          <div className="event-location">📍 {event.extendedProps.location}</div>
        )}
      </div>
    );
  };

  // Handle import events from export/import feature
  const handleImportEvents = (importedEvents) => {
    // Process imported events and add them to the existing events
    const existingEventIds = new Set(events.map(e => e.id));
    const newEvents = importedEvents.filter(e => !existingEventIds.has(e.id));
    
    // Save each new event
    newEvents.forEach(event => {
      saveEventToDB(event);
    });
    
    // Update the state
    setEvents(prevEvents => {
      const updatedEvents = [...prevEvents, ...newEvents];
      localStorage.setItem('events', JSON.stringify(updatedEvents));
      return updatedEvents;
    });
    
    toast.success(`ייבוא הושלם: ${newEvents.length} אירועים חדשים התווספו ללוח השנה`);
  };

  // Confirm event deletion
  const confirmDelete = (event) => {
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
  };

  return (
    <div className={`calendar-container modern ${effectiveDarkMode ? 'dark' : ''}`}>
      {/* App Tabs */}
      <div className="app-tabs">
        <div 
          className={`app-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          לוח שנה
        </div>
        <div 
          className={`app-tab ${activeTab === 'todo' ? 'active' : ''}`}
          onClick={() => setActiveTab('todo')}
        >
          משימות
        </div>
      </div>
      
      {/* Calendar View */}
      {activeTab === 'calendar' && (
        <div className="calendar-view">
          {/* Calendar Header */}
          <div className="calendar-header">
            <div className="header-buttons">
              <button 
                className="theme-toggle" 
                onClick={handleToggleDarkMode} 
                title="החלף מצב תצוגה"
              >
                {effectiveDarkMode ? '🌞' : '🌙'}
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
            </div>
          </div>
          
          {/* Calendar Wrapper */}
          <div className="calendar-wrapper">
            <FullCalendar
              dragRevertDuration={0}
              timeZone="UTC"
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, rrulePlugin]}
              initialView="timeGridWeek"
              headerToolbar={{ 
                start: 'prev,next today', 
                center: 'title', 
                end: 'dayGridMonth,timeGridWeek,timeGridDay' 
              }}
              height="100%"
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
              allDaySlot={true}
              allDayText="כל היום"
              slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
              buttonText={{ today: 'היום', month: 'חודש', week: 'שבוע', day: 'יום' }}
              select={handleDateSelect}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventResize={handleEventResize}
              eventContent={renderEventContent}
              eventContextMenu={handleEventContextMenu}
              unselectAuto={false}
            />
          </div>
        </div>
      )}
      
      {/* Todo View */}
      {activeTab === 'todo' && (
        <div className="todo-view">
          <TodoComponent isDarkMode={effectiveDarkMode} />
        </div>
      )}
      
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
          confirmDelete={confirmDelete}
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
          events={events}
          onImportEvents={handleImportEvents}
        />
      )}
      
      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          options={contextMenu.options}
          onClose={() => setContextMenu(null)}
        />
      )}
      
      {/* Toast Container for notifications */}
      <ToastContainer position="top-center" rtl={true} />
    </div>
  );
};

export default CalendarComponent;
