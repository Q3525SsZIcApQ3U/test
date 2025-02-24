import React, { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import ConfirmationModal from './ConfirmationModal';
import axios from 'axios';

const CalendarComponent = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch events from the backend
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events');
        // Ensure dates are in ISO format
        const formattedEvents = response.data.map((event) => ({
          ...event,
          start: new Date(event.start).toISOString(),
          end: new Date(event.end).toISOString(),
        }));
        setEvents(formattedEvents);
      } catch (error) {
        console.error("Error fetching events", error);
      }
    };
    fetchEvents();
  }, []);

  // Handle saving new event
  const saveEventToDB = async (newEvent) => {
    try {
      const response = await axios.post('http://localhost:5000/api/events', newEvent);
      setEvents((prevEvents) => [...prevEvents, response.data]);
    } catch (error) {
      console.error("Error saving event", error);
    }
  };

  // Handle updating an event
  const handleUpdateEvent = async (updatedEvent) => {
    try {
      await axios.put(`http://localhost:5000/api/events/${updatedEvent.id}`, updatedEvent);
      setEvents((prevEvents) =>
        prevEvents.map((event) =>
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
      setIsModalOpen(false); // Close modal after updating
    } catch (error) {
      console.error("Error updating event", error);
    }
  };

  // Handle event deletion
  const handleConfirmDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/events/${selectedEvent.id}`);
      setEvents((prevEvents) => prevEvents.filter((event) => event.id !== selectedEvent.id));
      setIsModalOpen(false); // Close modal after deleting
    } catch (error) {
      console.error("Error deleting event", error);
    }
  };

  // Handle selecting a date and creating a new event
  const handleDateSelect = (info) => {
    const title = prompt("הכנס כותרת לאירוע:");
    if (title) {
      const newEvent = {
        title: title,
        start: info.startStr,
        end: info.endStr,
      };
      saveEventToDB(newEvent); // Save the event to the backend
    }
  };

  // Handle dragging an event (move and update time)
  const handleEventDrop = (info) => {
    const updatedEvent = {
      id: info.event.id,
      title: info.event.title,
      start: info.event.startStr,
      end: info.event.endStr,
    };
    handleUpdateEvent(updatedEvent); // Update event on the backend
  };

  // Handle clicking an event to open the confirmation modal
  const handleEventClick = (info) => {
    setSelectedEvent(info.event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
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
