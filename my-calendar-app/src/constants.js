// API Configuration
export const API_BASE_URL = 'http://localhost:5001/api';

// Default Color Palette for Courses
export const DEFAULT_COLOR_PALETTE = [
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

// Calendar Configuration
export const CALENDAR_CONFIG = {
  DEFAULT_START_TIME: "07:00:00",
  DEFAULT_END_TIME: "22:00:00",
  INITIAL_VIEW: 'timeGridWeek',
  FIRST_DAY: 0, // Sunday
  LOCALE: 'he',
};

// Event-Related Constants
export const EVENT_TYPES = {
  SINGLE: 'single',
  RECURRING: 'recurring',
  ALL_DAY: 'all-day',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  DARK_MODE: 'darkMode',
  COURSES: 'courses',
  TRAINERS: 'trainers',
  WORK_HOURS: 'workHours',
  ACTIVE_TAB: 'activeTab',
  EVENTS: 'events',
};
