# User Guide

Welcome to the Academic Calendar application! This guide will walk you through all the features and functionality to help you get the most out of the application.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Calendar Interface](#calendar-interface)
3. [Managing Events](#managing-events)
4. [Courses and Trainers](#courses-and-trainers)
5. [Tasks Management](#tasks-management)
6. [Settings and Customization](#settings-and-customization)
7. [Import and Export](#import-and-export)
8. [Keyboard Shortcuts](#keyboard-shortcuts)
9. [Troubleshooting](#troubleshooting)

## Getting Started

### First Launch

When you first open the Academic Calendar, you'll see a calendar view with the current week displayed. The interface has two main tabs:
- **Calendar**: For managing events, courses, and schedules
- **Tasks**: For managing to-do items and tasks

### Interface Overview

![Interface Overview](https://via.placeholder.com/800x450.png?text=Interface+Overview)

1. **App Tabs**: Switch between Calendar and Tasks views
2. **Calendar Header**: Contains theme toggle, settings button, and trainer filter
3. **Calendar View**: Main calendar area showing your events
4. **View Controls**: Change between day, week, and month views

## Calendar Interface

### Navigation

- Use the **prev/next** buttons to move backward or forward in time
- Click **today** to jump to the current date
- Use the view buttons (day, week, month) to change your calendar perspective

### View Types

- **Month View**: Shows a traditional monthly calendar
- **Week View**: Shows a detailed weekly schedule with time slots
- **Day View**: Shows a single day with detailed time slots

### Filtering

Use the trainer dropdown in the header to filter events by a specific trainer. This helps when managing multiple trainers' schedules.

## Managing Events

### Creating Events

1. Click on any time slot in the calendar
2. Fill in the event details in the modal:
   - **Title**: Name of the event
   - **Event Type**: Optional categorization
   - **All Day**: Check if it's an all-day event
   - **Course**: Associate with a specific course
   - **Trainer**: Assign a trainer
   - **Description**: Add details about the event
   - **Location**: Specify where the event will take place
   - **Recurring**: Set up a repeating pattern

3. Click "Save" to create the event

### Editing Events

1. Click on an existing event
2. If it's a recurring event, you'll see options to:
   - Edit all occurrences
   - Edit just this occurrence
   - Cancel this occurrence

3. Modify the event details
4. Click "Save" to update the event

### Moving Events

You can drag and drop events to different times or days. The system will:
- Check for conflicts with existing events
- Warn you about scheduling issues
- Allow you to proceed or cancel the change

### Resizing Events

Click and drag the bottom edge of an event to change its duration. The system will:
- Check for conflicts with other events
- Ensure the new duration is valid
- Warn you about any scheduling issues

### Context Menu

Right-click on any event to open a context menu with options:
- **Edit**: Open the edit modal
- **Convert to regular/all-day event**: Toggle between time-specific and all-day event types
- **Delete**: Remove the event

## Courses and Trainers

### Managing Courses

Courses are accessed through the Settings menu:

1. Click the ⚙️ (Settings) button in the header
2. Select the "Courses" tab
3. From here you can:
   - Add new courses with custom colors
   - Edit existing courses
   - Delete courses
   - Assign tags to courses

### Managing Trainers

Trainers are also managed through the Settings menu:

1. Click the ⚙️ (Settings) button in the header
2. Select the "Trainers" tab
3. From here you can:
   - Add new trainers
   - Remove trainers

## Tasks Management

### Accessing Tasks

Click on the "Tasks" tab at the top of the application to switch to the task management view.

### Creating Tasks

1. Enter your task in the input field at the top
2. Press Enter or click "Add" to create the task

### Managing Tasks

- **Complete a task**: Click the checkbox next to a task
- **Delete a task**: Click the X button on the right side of a task
- **Filter tasks**: Use the filter buttons to show All, Active, or Completed tasks
- **Clear completed**: Remove all completed tasks with one click

## Settings and Customization

### Accessing Settings

Click the ⚙️ (Settings) button in the header to open the settings panel.

### General Settings

- **Work Hours**: Set the start and end times for your working day
- The calendar will focus on these hours in the day and week views

### Theme Settings

1. Go to the "Theme" tab in Settings
2. Choose from predefined themes or create your own
3. Toggle between light and dark mode using the 🌙/🌞 button in the header

### Event Types

1. Go to the "Event Types" tab in Settings
2. Create custom event types with:
   - Names
   - Colors
   - Icons
   - Associated courses

### Tags Management

1. Go to the relevant tab in Settings
2. Add, edit, or delete tags
3. Assign tags to courses for better organization

## Import and Export

### Exporting Calendar

1. Go to Settings > Import/Export
2. Click "Export to ICS"
3. Save the ICS file to your computer
4. Import this file into other calendar applications like Google Calendar, Outlook, etc.

### Importing Calendar

1. Go to Settings > Import/Export
2. Click "Choose File"
3. Select an ICS file from your computer
4. Click "Import"
5. The imported events will be added to your calendar

## Keyboard Shortcuts

For efficient navigation and operation:

- **Today**: `T` - Go to today's date
- **Day View**: `1` - Switch to day view
- **Week View**: `2` - Switch to week view
- **Month View**: `3` - Switch to month view
- **Next**: `Right Arrow` - Move to next day/week/month
- **Previous**: `Left Arrow` - Move to previous day/week/month
- **Escape**: Close modals and menus

## Troubleshooting

### Common Issues

#### Events Not Saving

If events aren't being saved properly:

1. Check your internet connection
2. Refresh the page to reconnect to the server
3. If the problem persists, the application will fall back to using localStorage

#### Conflicts Not Detected

If scheduling conflicts aren't being detected:

1. Ensure all events have proper start and end times
2. Check that the trainers are correctly assigned
3. Refresh the calendar view

#### Display Issues

If the calendar doesn't display correctly:

1. Try toggling between views (day/week/month)
2. Refresh the page
3. Clear browser cache if issues persist

### Data Backup

The application stores your data in two places:
1. On the server database
2. In your browser's localStorage as a backup

To manually backup your data:
1. Export your calendar to ICS format
2. Save the file in a safe location

### Reporting Problems

If you encounter issues that aren't covered here:

1. Take a screenshot of the problem
2. Note the steps to reproduce the issue
3. Contact the system administrator or support team

---

Thank you for using Academic Calendar! We hope this guide helps you make the most of the application.
