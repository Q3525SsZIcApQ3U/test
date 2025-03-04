# Academic Calendar

A comprehensive, modern calendar application for academic institutions, featuring course management, event scheduling, trainer assignments, and task tracking. The application is fully localized in Hebrew and supports both light and dark modes.

![Calendar Screenshot](https://via.placeholder.com/800x450.png?text=Academic+Calendar+Screenshot)

## Features

- **Academic Event Management**: Create, edit, and manage courses, classes, and academic events
- **Recurring Events**: Support for recurring events with flexible scheduling patterns
- **Course Management**: Organize events by courses with customizable colors and tags
- **Trainer Assignment**: Assign trainers to events and filter calendar views by trainer
- **Task Management**: Built-in todo list functionality for tracking tasks
- **Tag System**: Flexible tagging system for better organization
- **Import/Export**: ICS format support for calendar interoperability
- **Theme Support**: Multiple color themes and dark mode support
- **Responsive Design**: Works on both desktop and mobile devices
- **Conflict Detection**: Automatically detects scheduling conflicts
- **Context Menu**: Right-click functionality for quick actions

## Technology Stack

- **Frontend**: React.js with modern hooks and patterns
- **UI Components**: 
  - FullCalendar for the calendar interface
  - React-Toastify for notifications
- **Backend**: Express.js server with SQLite database
- **State Management**: React useState/useEffect with localStorage persistence
- **API Communication**: Axios for REST API requests

## Installation

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/academic-calendar.git
   cd academic-calendar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. In a separate terminal, start the backend server:
   ```bash
   node src/server.js
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Project Structure

```
academic-calendar/
├── src/
│   ├── components/        # React components
│   │   ├── CalendarComponent.js  # Main calendar component
│   │   ├── EventModal.js         # Event creation/editing modal
│   │   ├── SettingsComponent.js  # Settings panel
│   │   ├── TodoComponent.js      # Task management component
│   │   ├── TagsManager.js        # Tag management component
│   │   └── ...
│   ├── styles/            # CSS styles
│   │   ├── Calendar.css
│   │   ├── ThemeStyles.css
│   │   └── ...
│   ├── utils/             # Utility functions and helpers
│   │   ├── EventRenderer.js  # Event display logic
│   │   ├── icsUtils.js       # ICS import/export utils
│   │   └── ThemeManager.js   # Theme management
│   ├── constants.js       # Application constants
│   ├── server.js          # Backend server
│   └── App.js             # Main application component
├── public/                # Static assets
└── package.json           # Project configuration
```

## Usage Guide

### Calendar Navigation

- Use the top navigation to switch between day, week, and month views
- Use the date picker or navigation arrows to move between time periods
- Filter events by trainer using the dropdown in the header

### Creating Events

1. Click on a time slot in the calendar
2. Fill in the event details in the modal
3. For recurring events, check the "Recurring Event" option and set the pattern
4. For all-day events, check the "All Day Event" option
5. Click "Save" to create the event

### Managing Courses

1. Go to Settings > Courses
2. Add new courses with custom colors
3. Assign tags to courses for better organization
4. Existing courses can be edited or removed

### Task Management

1. Click on the "Tasks" tab at the top of the application
2. Add new tasks using the input at the top
3. Mark tasks as completed by checking the checkbox
4. Filter tasks by status (All, Active, Completed)
5. Clear completed tasks with a single click

### Importing/Exporting Calendar

1. Go to Settings > Import/Export
2. To export: Click "Export to ICS" to download your calendar
3. To import: Choose an ICS file and click "Import"

### Customizing Themes

1. Go to Settings > Theme
2. Choose from predefined themes or create your own
3. Toggle between light and dark mode using the moon/sun icon in the header

## Configuration

You can customize the application by modifying the following files:

- `src/constants.js`: Contains default settings like API URL, color palette, etc.
- `src/utils/ThemeManager.js`: Theme configuration and default themes

## API Endpoints

The backend provides the following API endpoints:

- **Events**
  - `GET /api/events`: Get all events
  - `GET /api/events/:id`: Get a specific event
  - `POST /api/events`: Create a new event
  - `PUT /api/events/:id`: Update an event
  - `DELETE /api/events/:id`: Delete an event

- **Courses**
  - `GET /api/courses`: Get all courses
  - `POST /api/courses`: Create a new course
  - `PUT /api/courses/:id`: Update a course
  - `DELETE /api/courses/:id`: Delete a course

- **Trainers**
  - `GET /api/trainers`: Get all trainers
  - `POST /api/trainers`: Create a new trainer
  - `PUT /api/trainers/:id`: Update a trainer
  - `DELETE /api/trainers/:id`: Delete a trainer

## Known Issues

- Hebrew text in exported ICS files may require special handling in some calendar applications
- The application requires localStorage to persist settings when API is unavailable

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
