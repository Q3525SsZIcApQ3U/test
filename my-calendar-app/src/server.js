require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();

// Database connection setup for SQLite
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(path.join(__dirname, 'calendar_database.db'));
console.log('Using SQLite database');

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit for larger content (like rich text)
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Database operations helper
const dbOps = {
  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(query, params, function(err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(query, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }
};

const createTables = async () => {
  try {
    // Events table
    await dbOps.run(`
      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL,
        extendedProps TEXT,
        rrule TEXT,
        duration TEXT,
        backgroundColor TEXT,
        allDay BOOLEAN DEFAULT 0
      )
    `);

    // Courses table
    await dbOps.run(`
      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT,
        tags TEXT
      )
    `);

    // Trainers table
    await dbOps.run(`
      CREATE TABLE IF NOT EXISTS trainers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      )
    `);
    
    // Todo items table
    await dbOps.run(`
      CREATE TABLE IF NOT EXISTS todos (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        completed BOOLEAN DEFAULT 0,
        createdAt TEXT NOT NULL
      )
    `);
    
    // Event types table
    await dbOps.run(`
      CREATE TABLE IF NOT EXISTS event_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        color TEXT
      )
    `);
    
    // Settings table for app-wide settings
    await dbOps.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);
    
    // Notes table for the text editor feature
    await dbOps.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `);
    
    // Text editor table for storing general editor content
    await dbOps.run(`
      CREATE TABLE IF NOT EXISTS text_editor (
        id TEXT PRIMARY KEY,
        content TEXT
      )
    `);
    
    console.log('Database tables created or verified');
    return true;
  } catch (err) {
    console.error('Error creating tables:', err);
    return false;
  }
};

// API Routes

// Event Routes
app.get('/api/events', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT * FROM events');
    
    // Parse JSON strings back to objects
    const formattedEvents = rows.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: event.extendedProps ? JSON.parse(event.extendedProps) : {},
      rrule: event.rrule ? JSON.parse(event.rrule) : null,
      duration: event.duration ? JSON.parse(event.duration) : null,
      backgroundColor: event.backgroundColor,
      allDay: !!event.allDay
    }));
    
    res.json(formattedEvents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await dbOps.get('SELECT * FROM events WHERE id = ?', [id]);
    
    if (!row) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Parse JSON strings back to objects
    const event = {
      id: row.id,
      title: row.title,
      start: row.start,
      end: row.end,
      extendedProps: row.extendedProps ? JSON.parse(row.extendedProps) : {},
      rrule: row.rrule ? JSON.parse(row.rrule) : null,
      duration: row.duration ? JSON.parse(row.duration) : null,
      backgroundColor: row.backgroundColor,
      allDay: !!row.allDay
    };
    
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/events', async (req, res) => {
  try {
    const { 
      id, 
      title, 
      start, 
      end, 
      extendedProps, 
      rrule, 
      duration, 
      backgroundColor,
      allDay 
    } = req.body;
    
    const eventId = id || Date.now().toString();
    
    const query = `
      INSERT INTO events (id, title, start, end, extendedProps, rrule, duration, backgroundColor, allDay) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      eventId, 
      title, 
      start, 
      end, 
      extendedProps || null, 
      rrule || null, 
      duration || null, 
      backgroundColor || null,
      allDay ? 1 : 0
    ];
    
    await dbOps.run(query, params);
    
    res.status(201).json({
      id: eventId,
      title,
      start,
      end,
      extendedProps: extendedProps ? JSON.parse(extendedProps) : {},
      rrule: rrule ? JSON.parse(rrule) : null,
      duration: duration ? JSON.parse(duration) : null,
      backgroundColor,
      allDay: !!allDay
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      start, 
      end, 
      extendedProps, 
      rrule, 
      duration, 
      backgroundColor,
      allDay 
    } = req.body;
    
    const query = `
      UPDATE events 
      SET title = ?, start = ?, end = ?, extendedProps = ?, rrule = ?, duration = ?, backgroundColor = ?, allDay = ?
      WHERE id = ?
    `;
    
    const params = [
      title, 
      start, 
      end, 
      extendedProps || null, 
      rrule || null, 
      duration || null, 
      backgroundColor || null,
      allDay ? 1 : 0,
      id
    ];
    
    const result = await dbOps.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({
      id,
      title,
      start,
      end,
      extendedProps: extendedProps ? JSON.parse(extendedProps) : {},
      rrule: rrule ? JSON.parse(rrule) : null,
      duration: duration ? JSON.parse(duration) : null,
      backgroundColor,
      allDay: !!allDay
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbOps.run('DELETE FROM events WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Course Routes
app.get('/api/courses', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT * FROM courses');
    
    // Parse JSON strings back to objects
    const formattedCourses = rows.map(course => ({
      id: course.id,
      name: course.name,
      color: course.color ? JSON.parse(course.color) : null,
      tags: course.tags ? JSON.parse(course.tags) : []
    }));
    
    res.json(formattedCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { name, color, tags } = req.body;
    const id = req.body.id || Date.now().toString();
    
    const query = 'INSERT INTO courses (id, name, color, tags) VALUES (?, ?, ?, ?)';
    const params = [
      id, 
      name, 
      typeof color === 'string' ? color : JSON.stringify(color),
      tags ? JSON.stringify(tags) : JSON.stringify([])
    ];
    
    await dbOps.run(query, params);
    
    res.status(201).json({
      id,
      name,
      color: typeof color === 'string' ? JSON.parse(color) : color,
      tags: tags || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, tags } = req.body;
    
    const query = 'UPDATE courses SET name = ?, color = ?, tags = ? WHERE id = ?';
    const params = [
      name, 
      typeof color === 'string' ? color : JSON.stringify(color),
      tags ? JSON.stringify(tags) : JSON.stringify([]),
      id
    ];
    
    const result = await dbOps.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({
      id,
      name,
      color: typeof color === 'string' ? JSON.parse(color) : color,
      tags: tags || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbOps.run('DELETE FROM courses WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trainer Routes
app.get('/api/trainers', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT * FROM trainers');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trainers', async (req, res) => {
  try {
    const { name } = req.body;
    const id = req.body.id || 't' + Date.now().toString();
    
    const query = 'INSERT INTO trainers (id, name) VALUES (?, ?)';
    const params = [id, name];
    
    await dbOps.run(query, params);
    
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/trainers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const query = 'UPDATE trainers SET name = ? WHERE id = ?';
    const params = [name, id];
    
    const result = await dbOps.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    res.json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trainers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbOps.run('DELETE FROM trainers WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    res.status(200).json({ message: 'Trainer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Todo Routes
app.get('/api/todos', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT * FROM todos ORDER BY createdAt DESC');
    
    // Convert completed from number to boolean
    const formattedTodos = rows.map(todo => ({
      ...todo,
      completed: !!todo.completed
    }));
    
    res.json(formattedTodos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/todos', async (req, res) => {
  try {
    const { text } = req.body;
    const id = Date.now().toString();
    const createdAt = new Date().toISOString();
    
    const query = 'INSERT INTO todos (id, text, completed, createdAt) VALUES (?, ?, ?, ?)';
    const params = [id, text, 0, createdAt];
    
    await dbOps.run(query, params);
    
    res.status(201).json({
      id,
      text,
      completed: false,
      createdAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;
    
    const query = 'UPDATE todos SET text = ?, completed = ? WHERE id = ?';
    const params = [text, completed ? 1 : 0, id];
    
    const result = await dbOps.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    const updatedTodo = await dbOps.get('SELECT * FROM todos WHERE id = ?', [id]);
    
    res.json({
      ...updatedTodo,
      completed: !!updatedTodo.completed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbOps.run('DELETE FROM todos WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.status(200).json({ message: 'Todo deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all completed todos
app.delete('/api/todos/completed/clear', async (req, res) => {
  try {
    const result = await dbOps.run('DELETE FROM todos WHERE completed = 1');
    res.status(200).json({ message: `${result.changes} completed todos deleted successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Event Types Routes
app.get('/api/event-types', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT * FROM event_types');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/event-types', async (req, res) => {
  try {
    const { name, icon, color } = req.body;
    const id = req.body.id || 'et' + Date.now().toString();
    
    const query = 'INSERT INTO event_types (id, name, icon, color) VALUES (?, ?, ?, ?)';
    const params = [id, name, icon, color];
    
    await dbOps.run(query, params);
    
    res.status(201).json({
      id,
      name,
      icon,
      color
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/event-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, icon, color } = req.body;
    
    const query = 'UPDATE event_types SET name = ?, icon = ?, color = ? WHERE id = ?';
    const params = [name, icon, color, id];
    
    const result = await dbOps.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    
    res.json({
      id,
      name,
      icon,
      color
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/event-types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbOps.run('DELETE FROM event_types WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event type not found' });
    }
    
    res.status(200).json({ message: 'Event type deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings Routes
app.get('/api/settings', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT * FROM settings');
    
    // Convert rows to an object
    const settings = {};
    rows.forEach(row => {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch (e) {
        settings[row.key] = row.value;
      }
    });
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const row = await dbOps.get('SELECT value FROM settings WHERE key = ?', [key]);
    
    if (!row) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    try {
      res.json(JSON.parse(row.value));
    } catch (e) {
      res.json(row.value);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }
    
    // Check if setting already exists
    const exists = await dbOps.get('SELECT 1 FROM settings WHERE key = ?', [key]);
    
    // Convert value to JSON string if it's an object
    const valueStr = typeof value === 'object' ? JSON.stringify(value) : value.toString();
    
    if (exists) {
      // Update existing setting
      await dbOps.run('UPDATE settings SET value = ? WHERE key = ?', [valueStr, key]);
    } else {
      // Insert new setting
      await dbOps.run('INSERT INTO settings (key, value) VALUES (?, ?)', [key, valueStr]);
    }
    
    res.status(200).json({ key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Special route for work hours
app.get('/api/settings/workhours', async (req, res) => {
  try {
    const row = await dbOps.get('SELECT value FROM settings WHERE key = ?', ['workHours']);
    
    if (!row) {
      // Return default work hours
      return res.json({
        startTime: '07:00:00',
        endTime: '22:01:00'
      });
    }
    
    try {
      res.json(JSON.parse(row.value));
    } catch (e) {
      res.status(500).json({ error: 'Invalid work hours data' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/workhours', async (req, res) => {
  try {
    const { startTime, endTime } = req.body;
    
    // Validate times
    if (!startTime || !endTime) {
      return res.status(400).json({ error: 'Both startTime and endTime are required' });
    }
    
    const workHours = JSON.stringify({ startTime, endTime });
    
    // Check if work hours already exist
    const exists = await dbOps.get('SELECT 1 FROM settings WHERE key = ?', ['workHours']);
    
    if (exists) {
      // Update existing work hours
      await dbOps.run('UPDATE settings SET value = ? WHERE key = ?', [workHours, 'workHours']);
    } else {
      // Insert new work hours
      await dbOps.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['workHours', workHours]);
    }
    
    res.status(200).json({ startTime, endTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Notes Routes
app.get('/api/notes', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT id, title, created_at, updated_at FROM notes ORDER BY updated_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const note = await dbOps.get('SELECT * FROM notes WHERE id = ?', [id]);
    
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    res.json(note);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { title, content } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const id = Date.now().toString();
    const now = new Date().toISOString();
    
    await dbOps.run(
      'INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, title, content || '', now, now]
    );
    
    const newNote = await dbOps.get('SELECT * FROM notes WHERE id = ?', [id]);
    res.status(201).json(newNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const now = new Date().toISOString();
    
    // Check if note exists
    const note = await dbOps.get('SELECT * FROM notes WHERE id = ?', [id]);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Update only the fields that are provided
    const updates = [];
    const params = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    
    // Always update the updated_at field
    updates.push('updated_at = ?');
    params.push(now);
    
    // Add id to params
    params.push(id);
    
    // Update the note
    await dbOps.run(
      `UPDATE notes SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    
    const updatedNote = await dbOps.get('SELECT * FROM notes WHERE id = ?', [id]);
    res.json(updatedNote);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if note exists
    const note = await dbOps.get('SELECT * FROM notes WHERE id = ?', [id]);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    
    // Delete the note
    await dbOps.run('DELETE FROM notes WHERE id = ?', [id]);
    
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Text Editor Routes
app.get('/api/text-editor', async (req, res) => {
  try {
    const defaultId = 'default';
    let content = await dbOps.get('SELECT content FROM text_editor WHERE id = ?', [defaultId]);
    
    if (!content) {
      // Create default content if it doesn't exist
      await dbOps.run(
        'INSERT INTO text_editor (id, content) VALUES (?, ?)',
        [defaultId, '']
      );
      content = { content: '' };
    }
    
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/text-editor', async (req, res) => {
  try {
    const { content } = req.body;
    const defaultId = 'default';
    
    // Check if the default entry exists
    const exists = await dbOps.get('SELECT 1 FROM text_editor WHERE id = ?', [defaultId]);
    
    if (exists) {
      // Update existing content
      await dbOps.run(
        'UPDATE text_editor SET content = ? WHERE id = ?',
        [content, defaultId]
      );
    } else {
      // Create new content
      await dbOps.run(
        'INSERT INTO text_editor (id, content) VALUES (?, ?)',
        [defaultId, content]
      );
    }
    
    res.json({ message: 'Content saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize default data
const initializeDefaultData = async () => {
  try {
    // Check if courses table is empty
    const courseCountResult = await dbOps.get('SELECT COUNT(*) as count FROM courses');
    const courseCount = courseCountResult?.count || 0;
    
    if (courseCount === 0) {
      // Insert default courses
      const defaultCourses = [
        { 
          id: '1', 
          name: 'מתמטיקה', 
          color: JSON.stringify({ bg: '#FF6B6B', text: '#FFFFFF' }),
          tags: JSON.stringify([])
        },
        { 
          id: '2', 
          name: 'פיזיקה', 
          color: JSON.stringify({ bg: '#4ECDC4', text: '#FFFFFF' }),
          tags: JSON.stringify([])
        }
      ];
      
      const courseInsertQuery = 'INSERT INTO courses (id, name, color, tags) VALUES (?, ?, ?, ?)';
      for (const course of defaultCourses) {
        await dbOps.run(courseInsertQuery, [course.id, course.name, course.color, course.tags]);
      }
      
      console.log('Default courses initialized');
    }
    
    // Check if trainers table is empty
    const trainerCountResult = await dbOps.get('SELECT COUNT(*) as count FROM trainers');
    const trainerCount = trainerCountResult?.count || 0;
    
if (trainerCount === 0) {
      // Insert default trainers
      const defaultTrainers = [
        { id: 't1', name: 'אדם' },
        { id: 't2', name: 'הודיה' }
      ];
      
      const trainerInsertQuery = 'INSERT INTO trainers (id, name) VALUES (?, ?)';
      for (const trainer of defaultTrainers) {
        await dbOps.run(trainerInsertQuery, [trainer.id, trainer.name]);
      }
      
      console.log('Default trainers initialized');
    }
    
    // Check if event types table is empty
    const eventTypesCountResult = await dbOps.get('SELECT COUNT(*) as count FROM event_types');
    const eventTypesCount = eventTypesCountResult?.count || 0;
    
    if (eventTypesCount === 0) {
      // Insert default event types
      const defaultEventTypes = [
        { id: 'et1', name: 'שיעור פרטי', icon: '👤', color: '#3a56d4' },
        { id: 'et2', name: 'שיעור קבוצתי', icon: '👥', color: '#10b981' },
        { id: 'et3', name: 'בחינה', icon: '📝', color: '#ef4444' }
      ];
      
      const eventTypeInsertQuery = 'INSERT INTO event_types (id, name, icon, color) VALUES (?, ?, ?, ?)';
      for (const eventType of defaultEventTypes) {
        await dbOps.run(eventTypeInsertQuery, [eventType.id, eventType.name, eventType.icon, eventType.color]);
      }
      
      console.log('Default event types initialized');
    }
    
    // Initialize default settings if needed
    const settingsCountResult = await dbOps.get('SELECT COUNT(*) as count FROM settings');
    const settingsCount = settingsCountResult?.count || 0;
    
    if (settingsCount === 0) {
      // Insert default settings
      const defaultSettings = [
        { 
          key: 'workHours', 
          value: JSON.stringify({ startTime: '07:00:00', endTime: '22:01:00' })
        },
        {
          key: 'colorPalette',
          value: JSON.stringify([
            { bg: '#4361ee', text: '#FFFFFF' },
            { bg: '#3a56d4', text: '#FFFFFF' },
            { bg: '#4895ef', text: '#FFFFFF' },
            { bg: '#10b981', text: '#FFFFFF' },
            { bg: '#f59e0b', text: '#FFFFFF' },
            { bg: '#ef4444', text: '#FFFFFF' },
            { bg: '#8b5cf6', text: '#FFFFFF' },
            { bg: '#ec4899', text: '#FFFFFF' },
            { bg: '#14b8a6', text: '#FFFFFF' },
            { bg: '#6366f1', text: '#FFFFFF' }
          ])
        },
        {
          key: 'activeTab',
          value: JSON.stringify('calendar')
        },
        {
          key: 'darkMode',
          value: JSON.stringify(false)
        }
      ];
      
      const settingsInsertQuery = 'INSERT INTO settings (key, value) VALUES (?, ?)';
      for (const setting of defaultSettings) {
        await dbOps.run(settingsInsertQuery, [setting.key, setting.value]);
      }
      
      console.log('Default settings initialized');
    }
    
    // Initialize default notes if table is empty
    const notesCountResult = await dbOps.get('SELECT COUNT(*) as count FROM notes');
    const notesCount = notesCountResult?.count || 0;
    
    if (notesCount === 0) {
      // Create a default welcome note
      const now = new Date().toISOString();
      const welcomeNote = {
        id: 'welcome',
        title: 'ברוכים הבאים',
        content: '<h1>ברוכים הבאים לעורך הטקסט</h1><p>זהו מקום לתעד רעיונות, הערות וכל מה שעולה על דעתך.</p><p>תוכל ליצור הערות חדשות בלחיצה על כפתור "חדש" בצד שמאל.</p>',
        created_at: now,
        updated_at: now
      };
      
      await dbOps.run(
        'INSERT INTO notes (id, title, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [welcomeNote.id, welcomeNote.title, welcomeNote.content, welcomeNote.created_at, welcomeNote.updated_at]
      );
      
      console.log('Default welcome note created');
    }
    
  } catch (err) {
    console.error('Error initializing default data:', err);
  }
};

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Initialize everything
createTables().then(() => {
  initializeDefaultData().then(() => {
    // Start the server
    const port = process.env.PORT || 5001;
    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  });
});

// Ensure data directory exists
const ensureDataDirectoryExists = () => {
  const dataDir = path.dirname(CONTENT_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Create directory on startup
ensureDataDirectoryExists();

// Get content endpoint
app.get('/api/file-content', (req, res) => {
  try {
    ensureDataDirectoryExists();
    
    if (fs.existsSync(CONTENT_FILE_PATH)) {
      const content = fs.readFileSync(CONTENT_FILE_PATH, 'utf-8');
      res.json({ content, timestamp: new Date().toISOString() });
    } else {
      // Return empty content if file doesn't exist yet
      res.json({ content: '', timestamp: new Date().toISOString() });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Save content endpoint
app.post('/api/file-content', (req, res) => {
  try {
    ensureDataDirectoryExists();
    
    const { content } = req.body;
    if (content === undefined) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    fs.writeFileSync(CONTENT_FILE_PATH, content, 'utf-8');
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error writing to file:', error);
    res.status(500).json({ error: 'Failed to write to file' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`File will be saved at: ${CONTENT_FILE_PATH}`);
});
