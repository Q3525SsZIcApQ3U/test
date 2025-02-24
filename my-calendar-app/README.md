

## Add Course Functionality

### Required Fields

- Course Name
- Commanders (Name and ID)
- Two Hourly Meetings
- Start and Finish Dates

# change hourly meeting

drag and drop. 

# Add Event Types

Drag and drop to create:

- Team Sessions
    - Group training activities
    - Team building exercises
- Fitness Tests
    - Physical assessments
    - Performance evaluations
- Regular Sessions
    - Individual training
    - Routine meetings

### **Validation Rules & Warnings**

### 1. Schedule Availability Check

- Warning: Selected time slot is not available in schedule
    - A. Add course with notification of unavailable time slot
    - B. Cancel course creation
    - C. Add course without unavailable time slot, with weekly reminder notifications

### 2. Single Meeting Time Check

- Warning: Course requires exactly one hourly meeting
    - A. Proceed with single meeting
    - B. Cancel course creation

### 3. 48-Hour Rule Check

- Warning: Meeting scheduled within first 48 hours
    - A. Proceed with notifications
    - B. Cancel course creation

### 4. Meeting Interval Check

- Warning: Less than 12 hours between sessions
    - A. Proceed with notifications
    - B. Cancel course creation

### Notification Triggers Summary

- Schedule conflicts
- Meeting time violations
- 48-hour notice requirement
- Insufficient interval between sessions
- Missing commander sessions this week
- Fitness test within one month

## Technologies

- React
- nodejs
