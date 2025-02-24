import React, { useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ConfirmationModal from './ConfirmationModal';

const CalendarComponent = () => {
  const [events, setEvents] = useState([
    { id: 1, title: "פגישה", start: "2025-02-20T10:00:00", end: "2025-02-20T11:00:00" },
    { id: 2, title: "כנס", start: "2025-02-25T14:00:00", end: "2025-02-25T15:30:00" },
  ]);
  
const [selectedEvent, setSelectedEvent] = useState(null);
const [isModalOpen, setIsModalOpen] = useState(false);

//checked
const handleUpdateEvent = (updatedEvent) => {
  setEvents((prevEvents) =>
    prevEvents.map((event) =>
      parseInt(event.id) === parseInt(updatedEvent.id) ? { ...event, title: updatedEvent.title } : event
    )
  );
  setIsModalOpen(false); // Close the modal after updating
};

  
  // Event handler for creating new events via selecting times
  const handleDateSelect = (info) => {
    const title = prompt("הכנס כותרת לאירוע:");
    if (title) {
      const newEvent = {
        id: Date.now(), // Unique ID for event
        title: title,
        start: info.startStr,
        end: info.endStr,
      };
      setEvents((prevEvents) => [...prevEvents, newEvent]);
    }
  };

  // Event handler for dragging and moving events
  const handleEventDrop = (info) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === parseInt(info.event.id)
          ? { ...event, start: info.event.startStr, end: info.event.endStr }
          : event
      )
    );
  };

  //checked
  // Event handler for clicking on an event to show the modal
  const handleEventClick = (info) => {
    setSelectedEvent(info.event); // Store the selected event
    console.log("The event has been selected.")
    setIsModalOpen(true); // Open the modal
  };

  //checked
  // Handle delete confirmation
  const handleConfirmDelete = () => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== parseInt(selectedEvent.id)));
    setIsModalOpen(false); // Close the modal after deleting
  };

  // Handle closing the modal without any action
  const handleCloseModal = () => {
    setIsModalOpen(false); // Close the modal
  };

  return (
    <div style={{ width: "80%", margin: "auto" }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        events={events}
        selectable={true}
        select={handleDateSelect}
        editable={true}
        eventDrop={handleEventDrop}
        eventClick={handleEventClick}
        locale="he"
        slotLabelFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }} // Ensures 23:00 format
      />
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleUpdateEvent}
        onDelete={handleConfirmDelete}
        message="האם אתה בטוח שברצונך למחוק את האירוע?"
        selectedEvent={selectedEvent}
      />
    </div>
  );
};

export default CalendarComponent;
