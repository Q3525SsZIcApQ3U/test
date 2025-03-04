# Developer's Guide

This guide provides detailed information for developers looking to understand, modify, or extend the Academic Calendar application.

## Architecture Overview

The Academic Calendar is a React-based front-end application with an Express.js backend server. It uses a client-server architecture with the following key components:

### Frontend Architecture

- **React Components**: Functional components using React Hooks
- **CSS Styling**: Custom CSS with responsive design and dark mode support
- **State Management**: Uses React's built-in state management with Context API for theme
- **Data Persistence**: LocalStorage as fallback when API is unavailable
- **Calendar Engine**: FullCalendar library with customizations

### Backend Architecture

- **Server**: Express.js REST API server
- **Database**: SQLite for data storage
- **API Routes**: RESTful endpoints for events, courses, and trainers
- **Data Modeling**: Simple object schemas for calendar entities

## Key Components

### 1. CalendarComponent (src/components/CalendarComponent.js)

The main calendar component that integrates FullCalendar and handles all event operations.

**Key Functions:**
- `handleDateSelect`: Creates new events
- `handleEventClick`: Handles existing event interactions
- `handleEventDrop`: Manages drag-and-drop operations
- `handleEventResize`: Handles event duration changes
- `highlightConflictingEvents`: Detects scheduling conflicts

### 2. EventModal (src/components/EventModal.js)

Manages the creation and editing of calendar events.

**Key Features:**
- Form validation
- Recurring event creation
- Event exception handling
- Course and trainer selection

### 3. SettingsComponent (src/components/SettingsComponent.js)

Provides the settings interface for the application.

**Key Settings:**
- Work hours configuration
- Trainer management
- Course management
- Theme selection
- Import/Export functionality

### 4. TodoComponent (src/components/TodoComponent.js)

A simple task management component.

**Key Features:**
- Task creation and completion
- Filtering by status
- Clear completed tasks

### 5. Server (src/server.js)

The backend Express server that handles data persistence.

**Key Features:**
- REST API endpoints
- SQLite database operations
- Initial data seeding

## Data Models

### Event

```javascript
{
  id: String,              // Unique identifier
  title: String,           // Event title
  start: String,           // ISO date string
  end: String,             // ISO date string
  allDay: Boolean,         // Is it an all-day event
  backgroundColor: String, // Color for the event
  extendedProps: {         // Additional properties
    description: String,   // Event description
    location: String,      // Event location
    courseId: String,      // Reference to a course
    trainerId: String,     // Reference to a trainer
    isAllDay: Boolean,     // Alternative all-day flag
    isException: Boolean,  // Is this an exception to a recurring event
    isCancelled: Boolean,  // Is this event cancelled
    originalEventId: String, // For exceptions, the parent event ID
    originalDate: String,  // For exceptions, the original date
    tags: Array            // Array of tag IDs
  },
  rrule: {                 // For recurring events
    freq: String,          // Frequency (daily, weekly, monthly)
    dtstart: String,       // Start date for recurrence
    until: String,         // End date for recurrence
    interval: Number,      // Recurrence interval
    exdate: Array          // Excluded dates
  },
  duration: {              // For recurring events
    hours: Number,
    minutes: Number
  }
}
```

### Course

```javascript
{
  id: String,        // Unique identifier
  name: String,      // Course name
  color: {           // Course color
    bg: String,      // Background color (hex)
    text: String     // Text color (hex)
  },
  tags: Array        // Array of tag objects
}
```

### Trainer

```javascript
{
  id: String,        // Unique identifier
  name: String       // Trainer name
}
```

### Tag

```javascript
{
  id: String,        // Unique identifier
  name: String,      // Tag name
  color: String      // Tag color (hex)
}
```

## Database Schema

The application uses SQLite with the following tables:

### events

```sql
CREATE TABLE events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start TEXT NOT NULL,
  end TEXT NOT NULL,
  extendedProps TEXT,
  rrule TEXT,
  duration TEXT,
  backgroundColor TEXT
)
```

### courses

```sql
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT
)
```

### trainers

```sql
CREATE TABLE trainers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL
)
```

## Development Workflow

### Adding a New Feature

1. Create a new branch from `main`
2. Implement the feature in the relevant components
3. Test thoroughly, including both API and localStorage fallback paths
4. Create a pull request to merge back to main

### Creating a New Component

Follow this structure for new components:

```javascript
import React, { useState, useEffect } from 'react';
// Import other dependencies

const NewComponent = ({ prop1, prop2 }) => {
  // State declarations
  const [stateVar, setStateVar] = useState(initialValue);
  
  // Effects
  useEffect(() => {
    // Setup or data fetching
    return () => {
      // Cleanup if needed
    };
  }, [dependencies]);
  
  // Event handlers
  const handleSomething = () => {
    // Handle an event
  };
  
  // Render component
  return (
    <div className="new-component">
      {/* Component markup */}
    </div>
  );
};

export default NewComponent;
```

### Working with the API

All API requests should use axios and follow this pattern:

```javascript
try {
  // Attempt API call
  const response = await axios.get(`${API_BASE_URL}/endpoint`);
  // Handle successful response
  handleSuccess(response.data);
} catch (error) {
  console.error("Error message:", error);
  // Fallback to localStorage or other backup mechanism
  handleFallback();
}
```

### Adding a New API Endpoint

1. Define the route in `server.js`:

```javascript
app.get('/api/new-endpoint', async (req, res) => {
  try {
    // Handle the request
    const result = await dbOps.all('SELECT * FROM table');
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
```

2. Create a corresponding client function in the appropriate component.

## Code Style Guidelines

### JavaScript

- Use ES6+ features like destructuring, spread operator, arrow functions
- Use functional components with hooks instead of class components
- Apply meaningful variable and function names using camelCase
- Add comments for complex logic or non-obvious behavior

### CSS

- Follow BEM (Block Element Modifier) naming convention
- Use CSS variables for theming (defined in :root)
- Use responsive units (rem, %, vh/vw) instead of fixed px where appropriate
- Group related properties together

### React Best Practices

- Use dependency arrays in useEffect to prevent unnecessary re-renders
- Avoid nested ternary operators for better readability
- Extract complex logic to utility functions
- Memoize expensive calculations with useMemo or useCallback

## Localization

The application currently uses Hebrew localization. To change or extend language support:

1. Update the `locale` property in FullCalendar component
2. Replace existing Hebrew strings with a translation function
3. Create translation files for each supported language

## Testing

Currently, the project includes minimal testing. When implementing tests:

- Use Jest for unit testing
- Use React Testing Library for component tests
- Create mock data for API response tests
- Test both success and error paths

## Documentation

When adding new code:

- Document all functions with a brief description
- Explain parameters and return values
- Add examples for complex functions
- Update this developer guide for significant changes

## Performance Considerations

- Use pagination for large datasets
- Implement virtualization for long lists
- Avoid unnecessary re-renders with proper state management
- Use the useCallback hook for functions passed as props

## Security Considerations

- Validate all user inputs on both client and server sides
- Use parameterized queries to prevent SQL injection
- Sanitize HTML content if rendering user-provided content
- Implement proper error handling without exposing sensitive information
