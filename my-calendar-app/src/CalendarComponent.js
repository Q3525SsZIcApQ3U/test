import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction"; // For drag-and-drop
import { Hebrew } from '@fullcalendar/core/locales/he'; // Import Hebrew locale

const CalendarComponent = () => {
  const [events, setEvents] = useState([
    { title: "פגישה", start: "2024-02-20T10:00:00", end: "2024-02-20T11:00:00" },
    { title: "כנס", start: "2024-02-25T14:00:00", end: "2024-02-25T15:30:00" },
  ]);

  // Event handler for creating new events via selecting times
  const handleDateSelect = (info) => {
    const title = prompt("הכנס כותרת לאירוע:");
    if (title) {
      const newEvent = {
        title: title,
        start: info.startStr,
        end: info.endStr,
      };
      // Updating events with the new event
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
  };

  // Event handler for dragging and moving events
  const handleEventDrop = (info) => {
    const updatedEvents = events.map((event) => {
      if (event.title === info.event.title) {
        return {
          ...event,
          start: info.event.startStr,
          end: info.event.endStr,
        };
      }
      return event;
    });

    setEvents(updatedEvents); // Update the events with the new time
  };

  return (
    <div style={{ width: "80%", margin: "auto" }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        selectable={true} // Allow selecting time slots
        select={handleDateSelect} // Triggered when a time is selected
        editable={true} // Allow drag-and-drop of events
        droppable={true} // Allow dropping events into different slots
        eventDrop={handleEventDrop} // Triggered when an event is dropped/moved
        locale="he" // Set the locale to Hebrew
      />
    </div>
  );
};

export default CalendarComponent;
